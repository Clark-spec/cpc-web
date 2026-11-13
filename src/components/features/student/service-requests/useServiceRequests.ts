import { useCallback, useEffect, useRef, useState } from "react";
import { useSSE } from "@/hooks/useSSE";
import { showApiError, showSuccess, showSuccessModal } from "@/lib/feedback";
import {
  applyRequestUpdate,
  createServiceRequest,
  deleteDraft,
  getCatalog,
  getErrorMessage,
  getCurrentDraft,
  getNotifications,
  getServiceRequests,
  markNotificationsRead,
  parseServiceRequestUpdate,
  saveDraft,
  type PurposeOption,
  type RequestFormValues,
  type ServiceOption,
  type ServiceRequest,
  type ServiceRequestDraft,
  type ServiceRequestNotification,
  type ServiceRequestUpdate,
} from "@/services/serviceRequests/student";

const HIGHLIGHT_MS = 2200;

type PageData = {
  services: ServiceOption[];
  purposes: PurposeOption[];
  requests: ServiceRequest[];
  notifications: ServiceRequestNotification[];
  unread: number;
  draft: ServiceRequestDraft | null;
};

async function fetchPageData(): Promise<PageData> {
  const [catalog, list, notificationData, currentDraft] = await Promise.all([
    getCatalog(),
    getServiceRequests(),
    getNotifications(),
    // A missing draft is not an error; the form simply starts empty.
    getCurrentDraft().catch(() => null),
  ]);

  return {
    services: catalog.services,
    purposes: catalog.purposes,
    requests: list,
    notifications: notificationData.notifications,
    unread: notificationData.unread,
    draft: currentDraft,
  };
}

export function useServiceRequestsPage() {
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [purposes, setPurposes] = useState<PurposeOption[]>([]);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [notifications, setNotifications] = useState<ServiceRequestNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [draft, setDraft] = useState<ServiceRequestDraft | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [discardingDraft, setDiscardingDraft] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [liveUpdate, setLiveUpdate] = useState<ServiceRequestUpdate | null>(null);
  const highlightTimer = useRef<number | null>(null);
  const requestsRef = useRef<ServiceRequest[]>([]);

  useEffect(() => {
    requestsRef.current = requests;
  }, [requests]);

  const flashRow = useCallback((id: string) => {
    setHighlightId(id);
    if (highlightTimer.current !== null) window.clearTimeout(highlightTimer.current);
    highlightTimer.current = window.setTimeout(() => setHighlightId(null), HIGHLIGHT_MS);
  }, []);

  useEffect(
    () => () => {
      if (highlightTimer.current !== null) window.clearTimeout(highlightTimer.current);
    },
    [],
  );

  const applyPageData = useCallback((data: PageData) => {
    setServices(data.services);
    setPurposes(data.purposes);
    setRequests(data.requests);
    setNotifications(data.notifications);
    setUnread(data.unread);
    setDraft(data.draft);
  }, []);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      applyPageData(await fetchPageData());
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [applyPageData]);

  useEffect(() => {
    let active = true;

    async function loadInitialData() {
      try {
        const data = await fetchPageData();
        if (active) applyPageData(data);
      } catch (loadError) {
        if (active) setError(getErrorMessage(loadError));
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadInitialData();
    return () => {
      active = false;
    };
  }, [applyPageData]);

  const refreshRequestsAndNotifications = useCallback(async () => {
    const [list, notificationData] = await Promise.all([
      getServiceRequests(),
      getNotifications(),
    ]);
    setRequests(list);
    setNotifications(notificationData.notifications);
    setUnread(notificationData.unread);
  }, []);

  const refreshNotifications = useCallback(async () => {
    try {
      const data = await getNotifications();
      setNotifications(data.notifications);
      setUnread(data.unread);
    } catch {
      // Keep the current feed; the bell has its own reconnect handling.
    }
  }, []);

  // Real-time synchronization via Server-Sent Events (SSE). Status changes
  // patch the matching row in place so the table never reloads.
  useSSE(
    useCallback(
      (type, data) => {
        if (type === "notification_created" || type === "notification_updated") {
          void refreshNotifications();
          return;
        }
        if (type === "connected") {
          void refreshRequestsAndNotifications();
          return;
        }
        if (type !== "service_request_updated") return;

        const update = parseServiceRequestUpdate(data);
        if (!update) return;

        const known = requestsRef.current.some(
          (request) => String(request.id) === update.requestId,
        );
        setRequests((current) =>
          current.map((request) =>
            String(request.id) === update.requestId
              ? applyRequestUpdate(request, update)
              : request,
          ),
        );
        flashRow(update.requestId);
        setLiveUpdate(update);
        void refreshNotifications();
        if (!known) void refreshRequestsAndNotifications();
      },
      [flashRow, refreshNotifications, refreshRequestsAndNotifications],
    ),
    !loading,
  );

  const submit = useCallback(
    async (values: RequestFormValues): Promise<ServiceRequest | null> => {
      setSubmitting(true);
      setProgress(0);
      try {
        const request = await createServiceRequest(values, setProgress);
        setDraft(null);
        await refreshRequestsAndNotifications().catch(() => {});
        showSuccessModal({
          title: "Request submitted",
          message: "We received your request. You can follow its progress in your request history.",
          reference: request.referenceNumber,
          meta: `${request.service.name} · ${request.statusLabel}`,
          primaryAction: {
            label: "View status",
            onClick: () => {
              document.getElementById("request-history")?.scrollIntoView({ block: "start" });
            },
          },
        });
        return request;
      } catch (submitError) {
        showApiError(submitError, "Could not submit your request");
        return null;
      } finally {
        setSubmitting(false);
        setProgress(null);
      }
    },
    [refreshRequestsAndNotifications],
  );

  const save = useCallback(
    async (values: RequestFormValues): Promise<boolean> => {
      setSavingDraft(true);
      setProgress(0);
      try {
        const saved = await saveDraft(values, setProgress);
        setDraft(saved);
        showSuccess("Draft saved", "You can finish this request any time — it stays saved to your account.");
        return true;
      } catch (saveError) {
        showApiError(saveError, "Could not save your draft");
        return false;
      } finally {
        setSavingDraft(false);
        setProgress(null);
      }
    },
    [],
  );

  const discardDraft = useCallback(async (): Promise<boolean> => {
    setDiscardingDraft(true);
    try {
      await deleteDraft();
      setDraft(null);
      showSuccess("Draft discarded", "Your saved answers were removed.");
      return true;
    } catch (discardError) {
      showApiError(discardError, "Could not discard the draft");
      return false;
    } finally {
      setDiscardingDraft(false);
    }
  }, []);

  const markAllRead = useCallback(async () => {
    if (unread === 0) return;
    setNotifications((current) => current.map((item) => ({ ...item, isRead: true })));
    setUnread(0);
    try {
      await markNotificationsRead();
    } catch (markError) {
      showApiError(markError, "Could not update notifications");
    }
  }, [unread]);

  return {
    services,
    purposes,
    requests,
    latestRequest: requests[0] ?? null,
    notifications,
    unread,
    draft,
    loading,
    error,
    submitting,
    savingDraft,
    discardingDraft,
    progress,
    reload,
    submit,
    save,
    discardDraft,
    markAllRead,
    highlightId,
    liveUpdate,
  };
}

/** The page state tree. `useServiceRequestsPage` owns it, so it is called once per page. */
export type ServiceRequestsPage = ReturnType<typeof useServiceRequestsPage>;
