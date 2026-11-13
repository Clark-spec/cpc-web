import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  applyRequestUpdate,
  getErrorMessage,
  getServiceRequests,
  parseServiceRequestUpdate,
  STATUS_LABELS,
  type RequestStatus,
  type ServiceRequest,
  type ServiceRequestUpdate,
} from "@/services/serviceRequests/student";
import { useSSE } from "@/hooks/useSSE";

const HIGHLIGHT_MS = 2200;

export type StatusFilter = "all" | RequestStatus;

export type StatusCounts = Record<RequestStatus, number>;

export type RequestSummary = {
  total: number;
  processing: number;
  underReview: number;
  released: number;
};

export const STATUS_FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All statuses" },
  ...(Object.keys(STATUS_LABELS) as RequestStatus[]).map((status) => ({
    value: status,
    label: STATUS_LABELS[status],
  })),
];

function sortNewestFirst(requests: ServiceRequest[]): ServiceRequest[] {
  return [...requests].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
}

/**
 * Loads the same service-request records used by the submission page, so the
 * tracking page never keeps a second copy of request data. Works against the
 * demo adapter or the HTTP adapter depending on VITE_USE_DEMO_DATA.
 */
export function useRequestStatus() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [liveUpdate, setLiveUpdate] = useState<ServiceRequestUpdate | null>(null);
  const highlightTimer = useRef<number | null>(null);
  const requestsRef = useRef<ServiceRequest[]>(requests);

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

  useEffect(() => {
    let active = true;

    async function loadInitial() {
      try {
        const list = await getServiceRequests();
        if (active) setRequests(sortNewestFirst(list));
      } catch (loadError) {
        if (active) setError(getErrorMessage(loadError));
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadInitial();
    return () => {
      active = false;
    };
  }, []);

  const reload = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      setRequests(sortNewestFirst(await getServiceRequests()));
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setRefreshing(false);
    }
  }, []);

  /** Used on reconnect so missed changes are restored without a manual reload. */
  const refreshSilently = useCallback(async () => {
    try {
      setRequests(sortNewestFirst(await getServiceRequests()));
      setError(null);
    } catch {
      // Keep the last known list; the Refresh button surfaces errors.
    }
  }, []);

  // Status changes arrive over SSE; patch the affected row in place so search,
  // filters and scroll are never reset. A reconnect refetches missed changes.
  useSSE(
    useCallback(
      (type, data) => {
        if (type === "connected") {
          void refreshSilently();
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
        setLiveUpdate(update);
        flashRow(update.requestId);
        // A request submitted from another tab has no row yet.
        if (!known) void refreshSilently();
      },
      [flashRow, refreshSilently],
    ),
    true,
  );

  const statusCounts = useMemo<StatusCounts>(() => {
    const counts = {
      submitted: 0,
      under_review: 0,
      processing: 0,
      ready_for_release: 0,
      released: 0,
      rejected: 0,
    } satisfies StatusCounts;

    for (const request of requests) counts[request.status] += 1;
    return counts;
  }, [requests]);

  const summary = useMemo<RequestSummary>(
    () => ({
      total: requests.length,
      processing: statusCounts.processing,
      underReview: statusCounts.under_review,
      released: statusCounts.released,
    }),
    [requests.length, statusCounts],
  );

  const filteredRequests = useMemo(() => {
    const term = query.trim().toLowerCase();

    return requests.filter((request) => {
      if (statusFilter !== "all" && request.status !== statusFilter) return false;
      if (!term) return true;

      return (
        request.referenceNumber.toLowerCase().includes(term) ||
        request.service.name.toLowerCase().includes(term)
      );
    });
  }, [query, requests, statusFilter]);

  const hasFilters = query.trim().length > 0 || statusFilter !== "all";

  const clearFilters = useCallback(() => {
    setQuery("");
    setStatusFilter("all");
  }, []);

  return {
    requests,
    filteredRequests,
    summary,
    statusCounts,
    loading,
    refreshing,
    error,
    query,
    setQuery,
    statusFilter,
    setStatusFilter,
    hasFilters,
    clearFilters,
    reload,
    highlightId,
    liveUpdate,
  };
}
