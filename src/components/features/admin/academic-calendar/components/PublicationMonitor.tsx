import { ArrowRight, Eye, Send } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  STATUS_META,
  type AdminCalendarEvent,
  type EventStatus,
  type StatusCounts,
} from "../data/academicCalendar";
import { SectionCard, StatusBadge, ghostButtonClass } from "./CalendarPieces";

const STATUS_ORDER: EventStatus[] = ["published", "draft", "pending", "archived", "cancelled"];

type PublicationMonitorProps = {
  statusCounts: StatusCounts;
  events: AdminCalendarEvent[];
  onPublish: (event: AdminCalendarEvent) => void;
  onView: (event: AdminCalendarEvent) => void;
  onViewAllPending: () => void;
};

/** Publication breakdown plus the pending-review queue that needs action. */
export function PublicationMonitor({
  statusCounts,
  events,
  onPublish,
  onView,
  onViewAllPending,
}: PublicationMonitorProps) {
  const total = Math.max(
    1,
    STATUS_ORDER.reduce((sum, status) => sum + statusCounts[status], 0),
  );
  const pending = events.filter((event) => event.status === "pending").slice(0, 3);

  return (
    <SectionCard
      id="publication-monitor"
      title="Publication and Draft Monitoring"
      description="Visibility is local to this frontend preview, not a live student distribution."
      actions={
        <button type="button" onClick={onViewAllPending} className={ghostButtonClass()}>
          Review queue
          <ArrowRight className="h-3 w-3" aria-hidden />
        </button>
      }
      bodyClassName="space-y-3 p-3"
    >
      <div className="space-y-1.5">
        {STATUS_ORDER.map((status) => {
          const meta = STATUS_META[status];
          const Icon = meta.icon;
          const count = statusCounts[status];
          const percent = Math.round((count / total) * 100);
          return (
            <div key={status} className="flex items-center gap-2">
              <span className="flex w-[124px] shrink-0 items-center gap-1 font-poppins text-[11px] font-semibold text-cpc-navy-text">
                <Icon className="h-3 w-3 text-cpc-heading-soft" aria-hidden />
                <span className="truncate">{meta.label}</span>
              </span>
              <span className="h-2 flex-1 overflow-hidden rounded-full bg-cpc-section-light">
                <span
                  className={cn("block h-full rounded-full transition-[width] duration-500", meta.barClass)}
                  style={{ width: `${percent}%` }}
                />
              </span>
              <span className="w-7 shrink-0 text-right font-poppins text-[11px] font-bold text-cpc-navy-text tabular-nums">
                {count}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
        <Eye className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-700" aria-hidden />
        <p className="font-poppins text-[11px] leading-snug text-emerald-800">
          <span className="font-bold">{statusCounts.published} published</span> event
          {statusCounts.published === 1 ? "" : "s"} are marked visible to students.{" "}
          {statusCounts.pending > 0
            ? `${statusCounts.pending} still await publication review.`
            : "Nothing is waiting for review."}
        </p>
      </div>

      <div>
        <p className="mb-1 font-poppins text-[10px] font-bold tracking-[0.12em] text-cpc-heading-soft uppercase">
          Awaiting publication
        </p>
        {pending.length === 0 ? (
          <p className="rounded-lg border border-dashed border-cpc-tile-border px-3 py-3 text-center font-poppins text-[11px] text-cpc-heading-soft">
            No events are pending review.
          </p>
        ) : (
          <ul className="space-y-1">
            {pending.map((event) => (
              <li
                key={event.id}
                className="flex items-center gap-1.5 rounded-lg border border-cpc-tile-border bg-white px-2.5 py-2"
              >
                <button
                  type="button"
                  onClick={() => onView(event)}
                  className="min-w-0 flex-1 truncate text-left font-poppins text-xs font-semibold text-cpc-navy-text hover:text-cpc-blue-accent"
                >
                  {event.title}
                </button>
                <StatusBadge status={event.status} />
                <button
                  type="button"
                  onClick={() => onPublish(event)}
                  className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-lg bg-cpc-blue-accent px-2 py-1 font-poppins text-[11px] font-semibold text-white transition-colors hover:bg-cpc-navy focus-visible:outline-2 focus-visible:outline-cpc-blue-accent"
                >
                  <Send className="h-3 w-3" aria-hidden />
                  Publish
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </SectionCard>
  );
}
