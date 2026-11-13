import { Badge, type BadgeSize } from "@/components/ui/badge";
import type { EnrollmentStatus } from "@/components/features/student/profile/types";

/**
 * Enrollment status pill. Status is conveyed by dot + text, not colour alone.
 */
export function EnrollmentBadge({
  status,
  size,
}: {
  status: EnrollmentStatus;
  size?: BadgeSize;
}) {
  const enrolled = status === "Enrolled";

  return (
    <Badge tone={enrolled ? "success" : "neutral"} size={size}>
      {status}
    </Badge>
  );
}
