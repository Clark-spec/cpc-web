import { Badge, type BadgeSize } from "@/components/ui/badge";
import type { EntryStatus } from "@/types/schedule";

type StatusBadgeProps = {
  status: EntryStatus;
  size?: BadgeSize;
  className?: string;
};

/** Dot + text status pill so the state stays readable without colour. */
export function StatusBadge({ status, size, className }: StatusBadgeProps) {
  const active = status === "active";

  return (
    <Badge tone={active ? "success" : "neutral"} size={size} className={className}>
      {active ? "Active" : "Not Active"}
    </Badge>
  );
}
