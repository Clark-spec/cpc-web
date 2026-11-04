import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import type { EntryStatus } from "../types";

type StatusBadgeProps = {
  status: EntryStatus;
  className?: string;
};

/**
 * Status is conveyed by icon + text as well as color, so it remains readable
 * for color-blind users and in monochrome prints.
 */
export function StatusBadge({ status, className }: StatusBadgeProps) {
  const active = status === "active";
  const Icon = active ? CheckCircle2 : AlertTriangle;

  return (
    <Badge
      tone={active ? "success" : "danger"}
      className={cn("gap-1 px-2 py-0.5", className)}
    >
      <Icon className="h-3 w-3 shrink-0" aria-hidden />
      {active ? "Active" : "Not Active"}
    </Badge>
  );
}
