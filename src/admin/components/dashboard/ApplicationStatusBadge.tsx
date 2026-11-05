import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Eye,
  XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import {
  ENROLLMENT_STATUS_LABELS,
  type EnrollmentApplicationStatus,
} from "../../data/enrollmentApplications";

const CONFIG: Record<
  EnrollmentApplicationStatus,
  { tone: BadgeTone; icon: LucideIcon }
> = {
  pending: { tone: "info", icon: Clock3 },
  "for-review": { tone: "warning", icon: Eye },
  approved: { tone: "success", icon: CheckCircle2 },
  "needs-requirements": { tone: "danger", icon: AlertCircle },
  rejected: { tone: "neutral", icon: XCircle },
};

/** Enrollment-specific status pill: icon plus label, never colour alone. */
export function ApplicationStatusBadge({
  status,
  className,
}: {
  status: EnrollmentApplicationStatus;
  className?: string;
}) {
  const config = CONFIG[status];
  const Icon = config.icon;

  return (
    <Badge tone={config.tone} className={cn("gap-1 px-2 py-0.5 text-[10px]", className)}>
      <Icon className="h-3 w-3 shrink-0" aria-hidden />
      {ENROLLMENT_STATUS_LABELS[status]}
    </Badge>
  );
}
