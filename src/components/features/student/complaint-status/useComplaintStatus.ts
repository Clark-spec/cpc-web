import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getMyComplaints,
  parseComplaintUpdate,
  type ComplaintStatus,
  type StudentComplaint,
} from "@/services/complaints";
import { useSSE } from "@/hooks/useSSE";

const HIGHLIGHT_MS = 2200;

export type ComplaintStatusFilter = "all" | ComplaintStatus;

export const COMPLAINT_STATUS_FILTER_OPTIONS: {
  value: ComplaintStatusFilter;
  label: string;
}[] = [
  { value: "all", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "in_review", label: "In Review" },
  { value: "resolved", label: "Resolved" },
];

export type ComplaintStatusCounts = Record<ComplaintStatus, number>;

export type ComplaintSummary = {
  total: number;
  pending: number;
  inReview: number;
  resolved: number;
};

function sortNewestFirst(complaints: StudentComplaint[]): StudentComplaint[] {
  return [...complaints].sort((a, b) => b.filedAt.localeCompare(a.filedAt));
}

function loadErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Could not load your complaints. Please try again.";
}

/**
 * Reads the same complaint records used by the Online Complaint page, so the
 * tracking page never keeps a second copy of complaint data.
 */
export function useComplaintStatus() {
  const [complaints, setComplaints] = useState<StudentComplaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ComplaintStatusFilter>("all");
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const highlightTimer = useRef<number | null>(null);

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

    getMyComplaints()
      .then((data) => {
        if (!active) return;
        setComplaints(sortNewestFirst(data.complaints));
        setError(null);
      })
      .catch((loadError) => {
        if (active) setError(loadErrorMessage(loadError));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const reload = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      setComplaints(sortNewestFirst((await getMyComplaints()).complaints));
    } catch (loadError) {
      setError(loadErrorMessage(loadError));
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Status changes arrive over SSE; patch the affected row in place so the
  // table (filters, scroll) never reloads. A reconnect refetches to catch
  // anything that changed while the stream was down.
  const refreshSilently = useCallback(async () => {
    try {
      setComplaints(sortNewestFirst((await getMyComplaints()).complaints));
      setError(null);
    } catch {
      // Keep the last known list; the Refresh button surfaces errors.
    }
  }, []);

  useSSE(
    useCallback(
      (type, data) => {
        if (type === "connected") {
          void refreshSilently();
          return;
        }
        if (type !== "complaint_updated") return;

        const update = parseComplaintUpdate(data);
        if (!update) return;

        setComplaints((current) => {
          let touched = false;
          const next = current.map((complaint) => {
            if (complaint.id !== update.complaintId) return complaint;
            touched = true;
            return {
              ...complaint,
              status: update.status,
              updatedAt: update.updatedAt,
              adminRemarks: update.adminRemarks,
            };
          });
          return touched ? next : current;
        });
        flashRow(update.complaintId);
      },
      [flashRow, refreshSilently],
    ),
    true,
  );

  const statusCounts = useMemo<ComplaintStatusCounts>(() => {
    const counts = { pending: 0, in_review: 0, resolved: 0 } satisfies ComplaintStatusCounts;
    for (const complaint of complaints) counts[complaint.status] += 1;
    return counts;
  }, [complaints]);

  const summary = useMemo<ComplaintSummary>(
    () => ({
      total: complaints.length,
      pending: statusCounts.pending,
      inReview: statusCounts.in_review,
      resolved: statusCounts.resolved,
    }),
    [complaints.length, statusCounts],
  );

  const filteredComplaints = useMemo(() => {
    const term = query.trim().toLowerCase();

    return complaints.filter((complaint) => {
      if (statusFilter !== "all" && complaint.status !== statusFilter) return false;
      if (!term) return true;

      return (
        complaint.referenceNumber.toLowerCase().includes(term) ||
        complaint.subject.toLowerCase().includes(term) ||
        complaint.category.toLowerCase().includes(term)
      );
    });
  }, [complaints, query, statusFilter]);

  const hasFilters = query.trim().length > 0 || statusFilter !== "all";

  const clearFilters = useCallback(() => {
    setQuery("");
    setStatusFilter("all");
  }, []);

  return {
    complaints,
    filteredComplaints,
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
  };
}
