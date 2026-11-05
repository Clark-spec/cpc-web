import { cn } from "@/lib/cn";
import {
  SERVICE_PAYMENT_LABELS,
  SERVICE_STATUS_LABELS,
  type AdminServiceRequestStatus,
  type ServicePaymentStatus,
} from "../../../data/serviceRequests";

const STATUS_STYLES: Record<AdminServiceRequestStatus, { pill: string; dot: string }> = {
  pending: { pill: "bg-[#FEF4E7] text-[#B77416]", dot: "bg-[#F3A43B]" },
  processing: { pill: "bg-[#EAF1FF] text-[#2C5BC4]", dot: "bg-[#4785F5]" },
  "ready-for-pickup": { pill: "bg-[#F1EEFE] text-[#5B4BC4]", dot: "bg-[#7C6FE0]" },
  completed: { pill: "bg-[#E9F7F1] text-[#12805A]", dot: "bg-[#20B77A]" },
  rejected: { pill: "bg-[#FDEDEF] text-[#C7354A]", dot: "bg-[#EF5365]" },
};

const PAYMENT_STYLES: Record<ServicePaymentStatus, string> = {
  verified: "bg-[#E9F7F1] text-[#12805A]",
  pending: "bg-[#FEF4E7] text-[#B77416]",
  "not-applicable": "bg-admin-page text-admin-muted",
};

export function ServiceRequestStatusBadge({ status }: { status: AdminServiceRequestStatus }) {
  const style = STATUS_STYLES[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-poppins text-[9.5px] leading-none font-semibold whitespace-nowrap",
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
        "inline-flex items-center rounded-full px-2 py-0.5 font-poppins text-[9px] leading-none font-semibold whitespace-nowrap",
        PAYMENT_STYLES[status],
      )}
    >
      {SERVICE_PAYMENT_LABELS[status]}
    </span>
  );
}
