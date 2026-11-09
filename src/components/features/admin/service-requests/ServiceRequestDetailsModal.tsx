import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  User,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { formatDateTime } from "@/lib/format";
import { Modal } from "@/components/ui/modal";
import {
  ServicePaymentBadge,
  ServiceRequestStatusBadge,
} from "@/components/features/admin/service-requests/ServiceRequestStatusBadge";
import type { AdminServiceRequest } from "@/services/serviceRequests/admin";

type ServiceRequestDetailsModalProps = {
  request: AdminServiceRequest;
  onClose: () => void;
};

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

const CHANNEL_LABELS: Record<AdminServiceRequest["channel"], string> = {
  online: "Online request",
  kiosk: "Kiosk walk-up",
  "walk-in": "Walk-in counter",
};

/** Read-only detail view for one service request, opened from the table. */
export function ServiceRequestDetailsModal({
  request,
  onClose,
}: ServiceRequestDetailsModalProps) {
  const missing = request.requirements.filter((item) => !item.submitted);
  const submittedCount = request.requirements.length - missing.length;

  return (
    <Modal
      open
      onClose={onClose}
      labelledBy="service-request-details-title"
      className="sm:max-w-[640px]"
    >
      {/* Frosted modal header */}
      <div className="relative overflow-hidden border-b border-white/60 bg-gradient-to-br from-cpc-navy via-[#0d2460] to-[#091b4c] px-5 py-5 pr-14">
        {/* Ambient glow */}
        <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-cpc-blue-accent/20 blur-2xl" aria-hidden />

        <div className="relative flex items-start gap-3.5">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 font-poppins text-sm font-bold text-white shadow-sm ring-1 ring-white/20 backdrop-blur-sm"
            aria-hidden
          >
            {initials(request.studentName)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2
                id="service-request-details-title"
                className="font-poppins text-[17px] leading-tight font-bold text-white"
              >
                {request.studentName}
              </h2>
              <ServiceRequestStatusBadge status={request.status} />
            </div>
            <p className="mt-0.5 font-poppins text-[11px] text-white/60">
              {request.id} · {request.studentNumber}
            </p>
          </div>
        </div>

        {/* Request title sub-line */}
        <div className="relative mt-3.5 flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2.5 backdrop-blur-sm">
          <ClipboardList className="h-4 w-4 shrink-0 text-white/70" aria-hidden />
          <span className="font-poppins text-[12px] font-semibold text-white/90">
            {request.service}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="space-y-4 px-5 py-5">
        {request.overdue && (
          <div className="flex items-start gap-2 rounded-xl border border-amber-200/70 bg-amber-50/80 px-3.5 py-2.5">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" aria-hidden />
            <p className="font-poppins text-[11px] leading-snug text-amber-800">
              This request has exceeded the three-day processing target and needs immediate attention.
            </p>
          </div>
        )}

        {/* Metadata grid */}
        <div className="rounded-xl border border-admin-border/50 bg-admin-page/50 p-4">
          <h3 className="mb-3 font-poppins text-[9.5px] font-bold tracking-[0.1em] text-admin-muted uppercase">
            Request Details
          </h3>
          <dl className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
            {[
              { label: "Category", value: request.category },
              { label: "Pickup Method", value: request.pickupMethod },
              { label: "Submitted", value: formatDateTime(request.submittedAt) },
              { label: "Channel", value: CHANNEL_LABELS[request.channel] },
              {
                label: "Kiosk Ticket",
                value: request.kioskTicket ?? "Not a kiosk request",
              },
              {
                label: "Completed",
                value: request.completedAt
                  ? formatDateTime(request.completedAt)
                  : "Not yet completed",
              },
            ].map((row) => (
              <div key={row.label} className="min-w-0">
                <dt className="font-poppins text-[9.5px] font-bold tracking-[0.08em] text-admin-muted uppercase">
                  {row.label}
                </dt>
                <dd className="mt-0.5 font-poppins text-[11.5px] leading-snug font-medium break-words text-admin-text">
                  {row.value}
                </dd>
              </div>
            ))}
            <div className="min-w-0">
              <dt className="font-poppins text-[9.5px] font-bold tracking-[0.08em] text-admin-muted uppercase">
                Fee Status
              </dt>
              <dd className="mt-1">
                <ServicePaymentBadge status={request.paymentStatus} />
              </dd>
            </div>
          </dl>
        </div>

        {/* Requirements checklist */}
        <div className="rounded-xl border border-admin-border/50 bg-admin-page/50 p-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-poppins text-[9.5px] font-bold tracking-[0.08em] text-admin-muted uppercase">
              Requirements
            </h3>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-poppins text-[10px] font-semibold",
                submittedCount === request.requirements.length
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-amber-50 text-amber-700",
              )}
            >
              <User className="h-3 w-3" aria-hidden />
              {submittedCount} of {request.requirements.length} submitted
            </span>
          </div>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {request.requirements.map((requirement) => (
              <li
                key={requirement.label}
                className={cn(
                  "flex items-start gap-2 rounded-xl border px-3 py-2.5",
                  requirement.submitted
                    ? "border-emerald-200/60 bg-emerald-50/40"
                    : "border-rose-200/70 bg-rose-50/50",
                )}
              >
                {requirement.submitted ? (
                  <CheckCircle2
                    className="mt-px h-3.5 w-3.5 shrink-0 text-emerald-500"
                    aria-hidden
                  />
                ) : (
                  <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0 text-rose-500" aria-hidden />
                )}
                <span className="font-poppins text-[11px] leading-snug text-admin-text">
                  {requirement.label}
                  <span
                    className={cn(
                      "mt-0.5 block text-[9.5px] font-semibold",
                      requirement.submitted ? "text-emerald-600" : "text-rose-600",
                    )}
                  >
                    {requirement.submitted ? "Submitted" : "Missing"}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Notes */}
        <div className="rounded-xl border border-admin-border/50 bg-admin-page/60 px-4 py-3.5">
          <p className="font-poppins text-[9.5px] font-bold tracking-[0.08em] text-admin-muted uppercase">
            Request Notes
          </p>
          <p className="mt-1.5 font-poppins text-[11.5px] leading-relaxed text-admin-text">
            {request.notes}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end border-t border-admin-border/50 bg-admin-page/40 px-5 py-3.5">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-admin-border/60 bg-white px-5 py-2 font-poppins text-[11.5px] font-semibold text-admin-text shadow-xs transition-all hover:bg-admin-page hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-info"
        >
          Close
        </button>
      </div>
    </Modal>
  );
}
