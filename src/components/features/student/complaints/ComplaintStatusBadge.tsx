import { Badge, type BadgeSize, type BadgeTone } from "@/components/ui/badge";
import { COMPLAINT_STATUS_LABELS } from "./mockComplaints";
import type { ComplaintStatus } from "./types";

const STATUS_TONES: Record<ComplaintStatus, BadgeTone> = {
  pending: "warning",
  in_review: "info",
  resolved: "success",
};

const STATUS_PULSE: Partial<Record<ComplaintStatus, boolean>> = {
  pending: true,
  in_review: true,
};

/** Dot + text status pill so status stays readable without colour. */
export function ComplaintStatusBadge({
  status,
  size,
  className,
}: {
  status: ComplaintStatus;
  size?: BadgeSize;
  className?: string;
}) {
  return (
    <Badge
      tone={STATUS_TONES[status]}
      pulse={STATUS_PULSE[status]}
      size={size}
      className={className}
    >
      {COMPLAINT_STATUS_LABELS[status]}
    </Badge>
  );
}
