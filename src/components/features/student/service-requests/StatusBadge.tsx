import { Badge, type BadgeSize, type BadgeTone } from "@/components/ui/badge";
import type { RequestStatus } from "@/services/serviceRequests/student";

const STATUS_LABELS: Record<RequestStatus, string> = {
  submitted: "Submitted",
  under_review: "Under Review",
  processing: "Processing",
  ready_for_release: "Ready for Release",
  released: "Released",
  rejected: "Rejected",
};

const STATUS_TONES: Record<RequestStatus, BadgeTone> = {
  submitted: "success",
  under_review: "info",
  processing: "info",
  ready_for_release: "info",
  released: "success",
  rejected: "danger",
};

const STATUS_PULSE: Partial<Record<RequestStatus, boolean>> = {
  under_review: true,
  processing: true,
};

type StatusBadgeProps = {
  status: RequestStatus;
  label?: string;
  size?: BadgeSize;
  className?: string;
};

export function StatusBadge({ status, label, size, className }: StatusBadgeProps) {
  return (
    <Badge
      tone={STATUS_TONES[status]}
      pulse={STATUS_PULSE[status]}
      size={size}
      className={className}
    >
      {label ?? STATUS_LABELS[status]}
    </Badge>
  );
}
