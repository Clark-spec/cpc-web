import { Ban } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";

/** Marks an event the administrator cancelled; it stays listed for reference. */
export function CancelledBadge({ className }: { className?: string }) {
  return (
    <Badge
      tone="danger"
      size="sm"
      icon={Ban}
      className={cn(className)}
      title="Cancelled by the administrator"
    >
      Cancelled
    </Badge>
  );
}
