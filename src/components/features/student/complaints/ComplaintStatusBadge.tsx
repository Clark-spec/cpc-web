import { CheckCircle2, Clock, Search } from "lucide-react";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { COMPLAINT_STATUS_LABELS } from "./mockComplaints";
import type { ComplaintStatus } from "./types";

const STATUS_TONES: Record<ComplaintStatus, BadgeTone> = {
  pending: "warning",
  in_review: "info",
  resolved: "success",
};

const STATUS_ICONS = {
  pending: Clock,
  in_review: Search,
  resolved: CheckCircle2,
} as const;

/** Icon + text status pill so status stays readable without color. */
export function ComplaintStatusBadge({ status }: { status: ComplaintStatus }) {
  const Icon = STATUS_ICONS[status];

  return (
    <Badge tone={STATUS_TONES[status]} className="gap-1 px-2 py-0.5">
      <Icon className="h-3 w-3 shrink-0" aria-hidden />
      {COMPLAINT_STATUS_LABELS[status]}
    </Badge>
  );
}
