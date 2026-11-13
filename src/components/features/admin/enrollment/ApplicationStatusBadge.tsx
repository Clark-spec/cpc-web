import { Badge, type BadgeSize, type BadgeTone } from "@/components/ui/badge";
import {
  ENROLLMENT_STATUS_LABELS,
  type EnrollmentApplicationStatus,
} from "@/services/enrollmentAdmin";

const CONFIG: Record<
  EnrollmentApplicationStatus,
  { tone: BadgeTone; pulse?: boolean }
> = {
  pending: { tone: "warning", pulse: true },
  "for-review": { tone: "info", pulse: true },
  approved: { tone: "success" },
  "needs-requirements": { tone: "warning" },
  rejected: { tone: "danger" },
};

/** Enrollment-specific status pill: dot plus label, never colour alone. */
export function ApplicationStatusBadge({
  status,
  size,
  className,
}: {
  status: EnrollmentApplicationStatus;
  size?: BadgeSize;
  className?: string;
}) {
  const config = CONFIG[status];

  return (
    <Badge tone={config.tone} size={size} pulse={config.pulse} className={className}>
      {ENROLLMENT_STATUS_LABELS[status]}
    </Badge>
  );
}
