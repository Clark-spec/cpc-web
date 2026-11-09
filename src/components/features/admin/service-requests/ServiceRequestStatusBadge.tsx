import { cn } from "@/lib/cn";
import {
  SERVICE_PAYMENT_LABELS,
  SERVICE_STATUS_LABELS,
  type AdminServiceRequestStatus,
  type ServicePaymentStatus,
} from "@/services/serviceRequests/admin";

const STATUS_STYLES: Record<
  AdminServiceRequestStatus,
  { pill: string; dot: string }
> = {
  pending: {
    pill: "bg-amber-50 text-amber-700 ring-1 ring-amber-200/80",
    dot: "bg-amber-400",
  },
  processing: {
    pill: "bg-blue-50 text-blue-700 ring-1 ring-blue-200/80",
    dot: "bg-blue-400",
  },
  "ready-for-pickup": {
    pill: "bg-violet-50 text-violet-700 ring-1 ring-violet-200/80",
    dot: "bg-violet-400",
  },
  completed: {
    pill: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/80",
    dot: "bg-emerald-400",
  },
  rejected: {
    pill: "bg-rose-50 text-rose-700 ring-1 ring-rose-200/80",
    dot: "bg-rose-400",
  },
};

const PAYMENT_STYLES: Record<ServicePaymentStatus, string> = {
  verified: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/80",
  pending: "bg-amber-50 text-amber-700 ring-1 ring-amber-200/80",
  "not-applicable": "bg-admin-page text-admin-muted ring-1 ring-admin-border/60",
};

export function ServiceRequestStatusBadge({ status }: { status: AdminServiceRequestStatus }) {
  const style = STATUS_STYLES[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-poppins text-[10px] leading-none font-semibold whitespace-nowrap",
        style.pill,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", style.dot)} aria-hidden />
      {SERVICE_STATUS_LABELS[status]}
    </span>
  );
}

export function ServicePaymentBadge({ status }: { status: ServicePaymentStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 font-poppins text-[10px] leading-none font-semibold whitespace-nowrap",
        PAYMENT_STYLES[status],
      )}
    >
      {SERVICE_PAYMENT_LABELS[status]}
    </span>
  );
}
