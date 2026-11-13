import { useCallback, useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import { PortalFooter } from "@/components/common/layout/PortalFooter";
import { PortalHeader } from "@/components/common/layout/PortalHeader";
import { ComplaintForm } from "@/components/features/student/complaints/ComplaintForm";
import { ComplaintHero } from "@/components/features/student/complaints/ComplaintHero";
import { ComplaintTable } from "@/components/features/student/complaints/ComplaintTable";
import type { ComplaintFormValues } from "@/components/features/student/complaints/types";
import { useSSE } from "@/hooks/useSSE";
import { ApiError } from "@/lib/apiClient";
import {
  getMyComplaints,
  parseComplaintUpdate,
  submitComplaint,
  type MyComplaintsResponse,
} from "@/services/complaints";

const HIGHLIGHT_MS = 2200;

/** Route: /student-support/online-complaint */
export default function OnlineComplaintPage() {
  const [data, setData] = useState<MyComplaintsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
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

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setData(await getMyComplaints());
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : "Could not load your complaints. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Office saves arrive over SSE; patch the row in place and refetch only when
  // the stream reconnects, so missed changes land without touching the form.
  const refreshSilently = useCallback(async () => {
    try {
      setData(await getMyComplaints());
    } catch {
      // Keep the last known list on a transient failure.
    }
  }, []);

  useSSE(
    useCallback(
      (type, payload) => {
        if (type === "connected") {
          void refreshSilently();
          return;
        }
        if (type !== "complaint_updated") return;

        const update = parseComplaintUpdate(payload);
        if (!update) return;

        setData((current) => {
          if (!current) return current;
          let touched = false;
          const complaints = current.complaints.map((complaint) => {
            if (complaint.id !== update.complaintId) return complaint;
            touched = true;
            return {
              ...complaint,
              status: update.status,
              updatedAt: update.updatedAt,
              adminRemarks: update.adminRemarks,
            };
          });
          return touched ? { ...current, complaints } : current;
        });
        flashRow(update.complaintId);
      },
      [flashRow, refreshSilently],
    ),
    true,
  );

  const complaints = data?.complaints ?? [];
  const cooldownUntil = data && !data.canSubmit ? data.nextAllowedAt : null;

  async function handleSubmit(values: ComplaintFormValues): Promise<string> {
    try {
      const complaint = await submitComplaint({
        subject: values.subject,
        category: values.category,
        description: values.description,
        isAnonymous: values.anonymous,
        attachment: values.attachment,
      });

      try {
        setData(await getMyComplaints());
      } catch {
        // The submission succeeded; the list refreshes on the next visit.
      }

      return complaint.referenceNumber;
    } catch (error) {
      // If the server and the page disagree about the cooldown, resync so the
      // Submit button and countdown match the backend.
      if (error instanceof ApiError && error.status === 429) {
        void load();
      }
      throw error;
    }
  }

  return (
    <div className="min-h-screen w-full overflow-x-clip bg-white font-poppins">
      <PortalHeader />
      <ComplaintHero />

      <main className="mx-auto w-full max-w-[1280px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <ComplaintForm onSubmit={handleSubmit} cooldownUntil={cooldownUntil} />

        {loadError && (
          <div
            role="alert"
            className="mt-6 flex flex-col gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <p className="font-poppins text-xs leading-relaxed text-rose-700">
              {loadError}
            </p>
            <button
              type="button"
              onClick={() => void load()}
              className="cpc-btn cpc-btn-secondary cpc-btn-sm shrink-0"
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden />
              Retry
            </button>
          </div>
        )}

        <div className="mt-6">
          <ComplaintTable
            complaints={complaints}
            loading={loading}
            highlightId={highlightId}
          />
        </div>
      </main>

      <PortalFooter />
    </div>
  );
}
