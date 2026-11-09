import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getErrorMessage,
  getServiceRequests,
  STATUS_LABELS,
  type RequestStatus,
  type ServiceRequest,
} from "@/services/serviceRequests/student";

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
  };
}
