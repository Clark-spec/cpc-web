import { AlertCircle, AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatDateTime } from "@/utils/format";
import { Modal } from "@/components/ui/modal";
import {
  ServicePaymentBadge,
  ServiceRequestStatusBadge,
} from "./ServiceRequestStatusBadge";
import type { AdminServiceRequest } from "@/data/serviceRequests";

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

  return (
    <Modal
      open
      onClose={onClose}
      labelledBy="service-request-details-title"
      className="sm:max-w-[620px]"
    >
      <div className="border-b border-admin-border/70 bg-admin-header/60 px-5 py-4 pr-12">
        <div className="flex items-start gap-3">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white font-poppins text-sm font-bold text-admin-secondary shadow-sm"
            aria-hidden
          >
            {initials(request.studentName)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2
                id="service-request-details-title"
                className="font-poppins text-[17px] leading-tight font-bold text-admin-primary"
              >
                {request.studentName}
              </h2>
              <ServiceRequestStatusBadge status={request.status} />
            </div>
            <p className="mt-0.5 font-poppins text-[11px] text-admin-muted">
              {request.id} · {request.studentNumber}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4 px-5 py-4">
        {request.overdue && (
          <p className="flex items-start gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 font-poppins text-[10.5px] leading-snug text-amber-800">
            <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden />
            This request has exceeded the three-day processing target and needs attention.
          </p>
        )}

        <dl className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
          {[
            { label: "Service Requested", value: request.service },
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
              value: request.completedAt ? formatDateTime(request.completedAt) : "Not yet completed",
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

        <div>
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-poppins text-[11px] font-bold tracking-[0.07em] text-admin-muted uppercase">
              Requirements
            </h3>
            <span className="font-poppins text-[10px] text-admin-muted">
              {request.requirements.length - missing.length} of {request.requirements.length}{" "}
              submitted
            </span>
          </div>
          <ul className="mt-1.5 grid gap-1.5 sm:grid-cols-2">
            {request.requirements.map((requirement) => (
              <li
                key={requirement.label}
                className={cn(
                  "flex items-start gap-1.5 rounded-md border px-2 py-1.5",
                  requirement.submitted
                    ? "border-admin-border/70 bg-admin-page/50"
                    : "border-rose-200 bg-rose-50/60",
                )}
              >
                {requirement.submitted ? (
                  <CheckCircle2
                    className="mt-px h-3.5 w-3.5 shrink-0 text-admin-success"
                    aria-hidden
                  />
                ) : (
                  <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0 text-admin-error" aria-hidden />
                )}
                <span className="font-poppins text-[10.5px] leading-snug text-admin-text">
                  {requirement.label}
                  <span className="block text-[9.5px] text-admin-muted">
                    {requirement.submitted ? "Submitted" : "Missing"}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-md border border-admin-border/70 bg-admin-page/60 px-3 py-2.5">
          <p className="font-poppins text-[9.5px] font-bold tracking-[0.08em] text-admin-muted uppercase">
            Request Notes
          </p>
          <p className="mt-1 font-poppins text-[11px] leading-relaxed text-admin-text">
            {request.notes}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-end border-t border-admin-border/70 bg-admin-page/40 px-5 py-3">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-admin-border bg-white px-4 py-2 font-poppins text-[11.5px] font-semibold text-admin-text transition-colors hover:bg-admin-page focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-info"
        >
          Close
        </button>
      </div>
    </Modal>
  );
}
