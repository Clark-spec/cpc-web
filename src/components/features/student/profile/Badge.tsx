import { CheckCircle2, CircleX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { EnrollmentStatus } from "@/components/features/student/profile/types";

/**
 * Enrollment status pill. Status is conveyed by icon + text, not colour alone.
 */
export function EnrollmentBadge({ status }: { status: EnrollmentStatus }) {
  const enrolled = status === "Enrolled";
  const Icon = enrolled ? CheckCircle2 : CircleX;

  return (
    <Badge
      tone={enrolled ? "success" : "neutral"}
      className="gap-1 px-2.5 py-1 text-[11px]"
    >
      <Icon className="h-3 w-3 shrink-0" aria-hidden />
      {status}
    </Badge>
  );
}
