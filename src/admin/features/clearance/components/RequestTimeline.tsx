import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  MessageSquarePlus,
  RotateCcw,
  Send,
  Undo2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatDateTime } from "@/features/clearance/lib/format";
import { useClearanceAdmin } from "../context/ClearanceAdminContext";
import type { TimelineEvent } from "../types";

const EVENT_META: Record<
  TimelineEvent["type"],
  { label: string; icon: LucideIcon; circle: string }
> = {
  requested: {
    label: "Requested signature",
    icon: Send,
    circle: "border-cpc-tile-border bg-cpc-section-light text-cpc-blue-accent",
  },
  cancelled: {
    label: "Cancelled by student",
    icon: Ban,
    circle: "border-slate-200 bg-slate-50 text-slate-500",
  },
  reopened: {
    label: "Re-requested by student",
    icon: RotateCcw,
    circle: "border-amber-200 bg-amber-50 text-amber-700",
  },
  signed: {
    label: "Signed",
    icon: CheckCircle2,
    circle: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  rejected: {
    label: "Returned to student",
    icon: Undo2,
    circle: "border-rose-200 bg-rose-50 text-rose-700",
  },
  revoked: {
    label: "Signature revoked",
    icon: AlertTriangle,
    circle: "border-rose-200 bg-rose-50 text-rose-700",
  },
  note: {
    label: "Note added",
    icon: MessageSquarePlus,
    circle: "border-cpc-tile-border bg-cpc-section-light text-cpc-heading-soft",
  },
};

/** Audit trail for the selected request, newest first. */
export function RequestTimeline() {
  const { selectedTimeline } = useClearanceAdmin();
  const events = [...selectedTimeline].sort((a, b) => Date.parse(b.at) - Date.parse(a.at));

  return (
    <section aria-labelledby="request-timeline-heading" className="min-w-0">
      <h3
        id="request-timeline-heading"
        className="font-poppins text-[10px] font-bold tracking-[0.12em] text-cpc-heading-soft uppercase"
      >
        Request timeline
      </h3>

      {events.length === 0 ? (
        <p className="mt-2 rounded-xl border border-dashed border-cpc-tile-border/70 px-3 py-2.5 font-poppins text-xs text-cpc-heading-soft">
          No activity yet for this request.
        </p>
      ) : (
        <ol className="mt-2 space-y-2.5">
          {events.map((event, index) => {
            const meta = EVENT_META[event.type];
            const Icon = meta.icon;

            return (
              <li key={event.id} className="flex items-start gap-2.5">
                <span
                  aria-hidden
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border",
                    meta.circle,
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0">
                  <p className="font-poppins text-xs font-semibold text-cpc-navy-text">
                    {meta.label}
                    <span className="font-normal text-cpc-heading-soft"> · {event.actor}</span>
                  </p>
                  {event.detail && (
                    <p className="mt-0.5 font-poppins text-[11px] leading-snug break-words text-cpc-heading-soft">
                      {event.detail}
                    </p>
                  )}
                  <p className="mt-0.5 font-poppins text-[10px] text-cpc-heading-soft">
                    {formatDateTime(event.at)}
                    {index === 0 && " · newest"}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
