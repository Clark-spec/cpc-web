import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Eye,
  FileText,
  Megaphone,
  Sparkles,
  XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import type { AdminStatus } from "../types";

type StatusConfig = {
  tone: BadgeTone;
  label: string;
  icon: LucideIcon;
};

const STATUS_CONFIG: Record<AdminStatus, StatusConfig> = {
  pending: { tone: "warning", label: "Pending", icon: Clock3 },
  signed: { tone: "success", label: "Signed", icon: CheckCircle2 },
  rejected: { tone: "danger", label: "Rejected", icon: XCircle },
  new: { tone: "info", label: "New", icon: Sparkles },
  completed: { tone: "success", label: "Completed", icon: CheckCircle2 },
  published: { tone: "info", label: "Published", icon: Megaphone },
  submitted: { tone: "info", label: "Submitted", icon: FileText },
  "for-review": { tone: "warning", label: "For Review", icon: Eye },
  approved: { tone: "success", label: "Approved", icon: CheckCircle2 },
  "needs-requirements": {
    tone: "danger",
    label: "Needs Requirements",
    icon: AlertCircle,
  },
};

type StatusBadgeProps = {
  status: AdminStatus;
  className?: string;
};

/** Status is always icon + text, never color alone. */
export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <Badge tone={config.tone} className={cn("gap-1.5", className)}>
      <Icon className="h-3 w-3 shrink-0" aria-hidden />
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
