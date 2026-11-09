import { cn } from "@/lib/cn";
import type { RequestStatus } from "@/services/serviceRequests/student";
import { STATUS_BADGE_CLASSES } from "@/components/features/student/service-requests/format";

const STATUS_LABELS: Record<RequestStatus, string> = {
  submitted: "Submitted",
  under_review: "Under Review",
  processing: "Processing",
  ready_for_release: "Ready for Release",
  released: "Released",
  rejected: "Rejected",
};

type StatusBadgeProps = {
  status: RequestStatus;
  label?: string;
  className?: string;
};

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-poppins text-[11px] leading-[16px] font-semibold whitespace-nowrap",
        STATUS_BADGE_CLASSES[status],
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
      {label ?? STATUS_LABELS[status]}
    </span>
  );
}
