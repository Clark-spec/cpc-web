import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Badge, type BadgeSize, type BadgeTone } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import type { AdminStatus } from "@/types/admin";

type StatusConfig = {
  tone: BadgeTone;
  label: string;
  /** In-progress statuses get the soft dot pulse. */
  pulse?: boolean;
};

const STATUS_CONFIG: Record<AdminStatus, StatusConfig> = {
  pending: { tone: "warning", label: "Pending", pulse: true },
  signed: { tone: "success", label: "Signed" },
  rejected: { tone: "danger", label: "Rejected" },
  new: { tone: "warning", label: "New" },
  completed: { tone: "success", label: "Completed" },
  published: { tone: "success", label: "Published" },
  submitted: { tone: "success", label: "Submitted" },
  "for-review": { tone: "info", label: "For Review", pulse: true },
  approved: { tone: "success", label: "Approved" },
  "needs-requirements": { tone: "warning", label: "Needs Requirements" },
};

type StatusBadgeProps = {
  status: AdminStatus;
  size?: BadgeSize;
  className?: string;
};

/** Shared admin status pill; the dot plus label keeps it readable without colour. */
export function StatusBadge({ status, size, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <Badge
      tone={config.tone}
      size={size}
      pulse={config.pulse}
      className={cn("gap-1.5", className)}
    >
      {config.label}
    </Badge>
  );
}

/** Compact inline warning used by the review modal checklist. */
export function ChecklistIcon({ done }: { done: boolean }) {
  return done ? (
    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
  ) : (
    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" aria-hidden />
  );
}
