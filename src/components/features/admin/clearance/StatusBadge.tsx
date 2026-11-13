/* eslint-disable react-refresh/only-export-components -- pill and its text label read one config */
import { Badge, type BadgeSize, type BadgeTone } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import type { RequestStatus } from "@/components/features/admin/clearance/types";

const CONFIG: Record<
  RequestStatus,
  { label: string; tone: BadgeTone; pulse?: boolean }
> = {
  requested: { label: "Pending signature", tone: "warning", pulse: true },
  signed: { label: "Signed", tone: "success" },
  rejected: { label: "Returned to student", tone: "danger" },
  not_requested: { label: "Not requested", tone: "neutral" },
};

/**
 * Clearance status pill. The dot and text always travel together, so a
 * colour-blind or monochrome reader still sees the difference.
 */
export function StatusBadge({
  status,
  size,
  className,
}: {
  status: RequestStatus;
  size?: BadgeSize;
  className?: string;
}) {
  const config = CONFIG[status];

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

export function statusLabel(status: RequestStatus): string {
  return CONFIG[status].label;
}
