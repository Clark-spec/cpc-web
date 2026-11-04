import { useCallback, useEffect, useState } from "react";
import {
  createServiceRequest,
  deleteDraft,
  getCatalog,
  getErrorMessage,
  getCurrentDraft,
  getNotifications,
  getServiceRequests,
  markNotificationsRead,
  saveDraft,
  type PurposeOption,
  type RequestFormValues,
  type ServiceOption,
  type ServiceRequest,
  type ServiceRequestDraft,
  type ServiceRequestNotification,
} from "@/services/serviceRequests";

type Notice = {
  kind: "success" | "error";
  message: string;
};

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
  const [progress, setProgress] = useState<number | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);

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

  const submit = useCallback(
    async (values: RequestFormValues): Promise<ServiceRequest | null> => {
      setSubmitting(true);
      setProgress(0);
      setNotice(null);
      try {
        const request = await createServiceRequest(values, setProgress);
        setDraft(null);
        await refreshRequestsAndNotifications().catch(() => {});
        setNotice({
          kind: "success",
          message: `Request ${request.referenceNumber} was submitted. You can track its progress here.`,
        });
        return request;
      } catch (submitError) {
        setNotice({ kind: "error", message: getErrorMessage(submitError) });
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
      setNotice(null);
      try {
        const saved = await saveDraft(values, setProgress);
        setDraft(saved);
        setNotice({ kind: "success", message: "Draft saved. You can finish this request later." });
        return true;
      } catch (saveError) {
        setNotice({ kind: "error", message: getErrorMessage(saveError) });
        return false;
      } finally {
        setSavingDraft(false);
        setProgress(null);
      }
    },
    [],
  );

  const discardDraft = useCallback(async (): Promise<boolean> => {
    setNotice(null);
    try {
      await deleteDraft();
      setDraft(null);
      setNotice({ kind: "success", message: "Draft discarded." });
      return true;
    } catch (discardError) {
      setNotice({ kind: "error", message: getErrorMessage(discardError) });
      return false;
    }
  }, []);

  const markAllRead = useCallback(async () => {
    if (unread === 0) return;
    setNotifications((current) => current.map((item) => ({ ...item, isRead: true })));
    setUnread(0);
    try {
      await markNotificationsRead();
    } catch (markError) {
      setNotice({ kind: "error", message: getErrorMessage(markError) });
    }
  }, [unread]);

  const clearNotice = useCallback(() => setNotice(null), []);

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
    progress,
    notice,
    reload,
    submit,
    save,
    discardDraft,
    markAllRead,
    clearNotice,
  };
}

/** The page state tree. `useServiceRequestsPage` owns it, so it is called once per page. */
export type ServiceRequestsPage = ReturnType<typeof useServiceRequestsPage>;
