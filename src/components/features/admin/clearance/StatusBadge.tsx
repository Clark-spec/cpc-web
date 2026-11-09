/* eslint-disable react-refresh/only-export-components -- pill and its text label read one config */
import type { LucideIcon } from "lucide-react";
import { CheckCircle2, Clock3, FileText, Undo2 } from "lucide-react";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import type { RequestStatus } from "@/components/features/admin/clearance/types";

const CONFIG: Record<RequestStatus, { label: string; tone: BadgeTone; icon: LucideIcon }> = {
  requested: { label: "Pending signature", tone: "warning", icon: Clock3 },
  signed: { label: "Signed", tone: "success", icon: CheckCircle2 },
  rejected: { label: "Returned to student", tone: "danger", icon: Undo2 },
  not_requested: { label: "Not requested", tone: "neutral", icon: FileText },
};

/**
 * Clearance status pill. Icon + text always travel together, so a colour-blind
 * or monochrome reader still sees the difference.
 */
export function StatusBadge({
  status,
  className,
}: {
  status: RequestStatus;
  className?: string;
}) {
  const config = CONFIG[status];
  const Icon = config.icon;

  return (
    <Badge tone={config.tone} className={cn("gap-1.5", className)}>
      <Icon className="h-3 w-3 shrink-0" aria-hidden />
      {config.label}
    </Badge>
  );
}

export function statusLabel(status: RequestStatus): string {
  return CONFIG[status].label;
}
