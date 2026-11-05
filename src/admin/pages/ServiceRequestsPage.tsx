import { useMemo, useState } from "react";
import { ClipboardList } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { PageBanner } from "../components/PageBanner";
import { ConfirmDialog } from "../components/Modal";
import { ServiceRequestStatCards } from "../components/service-requests/ServiceRequestStatCards";
import { ServiceRequestTable } from "../components/service-requests/ServiceRequestTable";
import { ServiceRequestDetailsModal } from "../components/service-requests/ServiceRequestDetailsModal";
import { useAdminAuth } from "../context/AdminAuthContext";
import {
  buildSampleServiceRequests,
  getServiceRequestCounts,
  SERVICE_STATUS_LABELS,
  type AdminServiceRequest,
  type AdminServiceRequestStatus,
} from "../data/serviceRequests";

type PendingChange = {
  request: AdminServiceRequest;
  status: AdminServiceRequestStatus;
};

/**
 * Admin Service Request dashboard. Frontend only: the queue is seeded from
 * local sample data and every action mutates component state, never a server.
 */
export default function ServiceRequestsPage() {
  const { user } = useAdminAuth();
  const { toast } = useToast();

  const [requests, setRequests] = useState<AdminServiceRequest[]>(() =>
    buildSampleServiceRequests(),
  );
  const [viewing, setViewing] = useState<AdminServiceRequest | null>(null);
  const [pendingChange, setPendingChange] = useState<PendingChange | null>(null);

  const counts = useMemo(() => getServiceRequestCounts(requests), [requests]);
  const openCount = counts.pending + counts.processing + counts.readyForPickup;

  if (!user) return null;

  const applyStatus = (request: AdminServiceRequest, status: AdminServiceRequestStatus) => {
    const isClosed = status === "completed" || status === "rejected";

    setRequests((current) =>
      current.map((entry) =>
        entry.id === request.id
          ? {
              ...entry,
              status,
              completedAt: status === "completed" ? new Date().toISOString() : undefined,
              overdue: isClosed ? false : entry.overdue,
            }
          : entry,
      ),
    );

    setViewing((current) =>
      current && current.id === request.id
        ? {
            ...current,
            status,
            completedAt: status === "completed" ? new Date().toISOString() : undefined,
            overdue: isClosed ? false : current.overdue,
          }
        : current,
    );
  };

  const handleChangeStatus = (
    request: AdminServiceRequest,
    status: AdminServiceRequestStatus,
  ) => {
    if (status === request.status) return;

    if (status === "completed" || status === "rejected") {
      setPendingChange({ request, status });
      return;
    }

    applyStatus(request, status);
    toast(
      `${request.id} moved to ${SERVICE_STATUS_LABELS[status]}.`,
      status === "ready-for-pickup" ? "success" : "info",
    );
  };

  const confirmPendingChange = () => {
    if (!pendingChange) return;
    const { request, status } = pendingChange;
    applyStatus(request, status);
    setPendingChange(null);
    toast(
      status === "completed"
        ? `${request.id} is marked as completed.`
        : `${request.id} was rejected and the student will be notified.`,
      status === "completed" ? "success" : "error",
    );
  };

  const handleBulkStatus = (ids: string[], status: AdminServiceRequestStatus) => {
    const idSet = new Set(ids);

    setRequests((current) =>
      current.map((entry) =>
        idSet.has(entry.id) && entry.status !== status
          ? {
              ...entry,
              status,
              completedAt: undefined,
              overdue: status === "completed" || status === "rejected" ? false : entry.overdue,
            }
          : entry,
      ),
    );

    toast(
      `${ids.length} request${ids.length === 1 ? "" : "s"} moved to ${SERVICE_STATUS_LABELS[status]}.`,
      "info",
    );
  };

  return (
    <div className="space-y-5">
      <PageBanner
        eyebrow="STUDENT SERVICES"
        title="Service Request"
        subtitle="Review student document requests, ID replacements, certificate processing, and kiosk ticketing queues."
        right={
          <span className="inline-flex items-center gap-1.5 rounded-full border border-cpc-tile-border bg-white/80 px-3 py-1.5 font-poppins text-[11px] font-semibold text-cpc-navy-text">
            <ClipboardList className="h-3.5 w-3.5 text-cpc-blue-accent" aria-hidden />
            {openCount.toLocaleString()} active request{openCount === 1 ? "" : "s"}
          </span>
        }
      />

      <section aria-labelledby="service-statistics-heading" className="space-y-2.5">
        <div>
          <h2
            id="service-statistics-heading"
            className="font-poppins text-[15px] leading-tight font-semibold text-admin-text"
          >
            Service Request Statistics
          </h2>
          <p className="mt-0.5 font-poppins text-[11px] leading-snug text-admin-muted">
            Live counts from the current request queue, updated as statuses change.
          </p>
        </div>
        <ServiceRequestStatCards counts={counts} />
      </section>

      <ServiceRequestTable
        requests={requests}
        onView={setViewing}
        onChangeStatus={handleChangeStatus}
        onBulkStatus={handleBulkStatus}
      />

      {viewing && (
        <ServiceRequestDetailsModal
          key={viewing.id}
          request={viewing}
          onClose={() => setViewing(null)}
        />
      )}

      <ConfirmDialog
        id="service-request-confirm-title"
        open={pendingChange !== null}
        onClose={() => setPendingChange(null)}
        onConfirm={confirmPendingChange}
        danger={pendingChange?.status === "rejected"}
        title={
          pendingChange?.status === "completed"
            ? "Mark this request as completed?"
            : "Reject this service request?"
        }
        confirmLabel={
          pendingChange?.status === "completed" ? "Mark Completed" : "Reject Request"
        }
        description={
          pendingChange ? (
            <>
              <span className="font-semibold text-admin-text">{pendingChange.request.id}</span>{" "}
              for {pendingChange.request.studentName} will be moved to{" "}
              <span className="font-semibold text-admin-text">
                {SERVICE_STATUS_LABELS[pendingChange.status]}
              </span>
              .{" "}
              {pendingChange.status === "completed"
                ? "The student can be notified that the document is ready for release."
                : "The student will be notified that the request needs to be corrected or resubmitted."}
            </>
          ) : null
        }
      />
    </div>
  );
}
