import { useMemo } from "react";
import { AlarmClock, ArrowRight, Building2 } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  daysBetween,
  eventEndKey,
  formatDateKeyShort,
  getDeadlineState,
  parseDateKey,
  type AdminCalendarEvent,
} from "../data/academicCalendar";
import {
  CalendarEmptyState,
  EventStatusDot,
  SectionCard,
  StatusBadge,
  ghostButtonClass,
} from "./CalendarPieces";

type DeadlinesCardProps = {
  events: AdminCalendarEvent[];
  onSelect: (event: AdminCalendarEvent) => void;
  onViewAll: () => void;
};

export function DeadlinesCard({ events, onSelect, onViewAll }: DeadlinesCardProps) {
  const today = new Date();

  const deadlines = useMemo(
    () =>
      [...events]
        .filter(
          (event) =>
            event.category === "deadline" &&
            event.status !== "archived" &&
            event.status !== "cancelled",
        )
        .sort((a, b) => {
          const dateCompare = eventEndKey(a).localeCompare(eventEndKey(b));
          if (dateCompare !== 0) return dateCompare;
          return a.title.localeCompare(b.title);
        })
        .slice(0, 6),
    [events],
  );

  const overdue = deadlines.filter(
    (event) => daysBetween(today, parseDateKey(eventEndKey(event))) < 0,
  ).length;
  const dueSoon = deadlines.filter((event) => {
    const days = daysBetween(today, parseDateKey(eventEndKey(event)));
    return days >= 0 && days <= 7;
  }).length;

  return (
    <SectionCard
      id="academic-deadlines"
      title="Academic Deadlines"
      description="Countdowns are calculated from each event's actual due date."
      actions={
        <button type="button" onClick={onViewAll} className={ghostButtonClass()}>
          View all
          <ArrowRight className="h-3 w-3" aria-hidden />
        </button>
      }
      bodyClassName="p-3"
    >
      <div className="mb-1.5 flex flex-wrap items-center gap-1.5 px-1">
        <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 font-poppins text-[11px] font-semibold text-rose-700">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-500" aria-hidden />
          {overdue} overdue
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 font-poppins text-[11px] font-semibold text-amber-700">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden />
          {dueSoon} due this week
        </span>
      </div>

      {deadlines.length === 0 ? (
        <CalendarEmptyState
          title="No academic deadlines"
          description="Deadline-category events and their responsible offices appear here."
        />
      ) : (
        <ul className="space-y-1">
          {deadlines.map((event) => {
            const state = getDeadlineState(event, today);
            return (
              <li key={event.id}>
                <button
                  type="button"
                  onClick={() => onSelect(event)}
                  className={cn(
                    "flex w-full items-start gap-2 rounded-lg border border-transparent px-2 py-2 text-left transition-colors hover:border-cpc-tile-border hover:bg-cpc-section-light focus-visible:outline-2 focus-visible:outline-cpc-blue-accent",
                    state.tone === "overdue" && "bg-rose-50/50",
                    state.tone === "today" && "bg-rose-50/60",
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border",
                      state.tone === "overdue" || state.tone === "today"
                        ? "border-rose-200 bg-rose-50 text-rose-600"
                        : state.tone === "soon"
                          ? "border-amber-200 bg-amber-50 text-amber-600"
                          : "border-cpc-tile-border bg-cpc-section-light text-cpc-blue-accent",
                    )}
                    aria-hidden
                  >
                    <AlarmClock className="h-3.5 w-3.5" />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-1">
                      <span className="truncate font-poppins text-xs font-semibold text-cpc-navy-text">
                        {event.title}
                      </span>
                      <EventStatusDot status={event.status} />
                    </span>
                    <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-poppins text-[11px] text-cpc-heading-soft">
                      <span className="font-semibold text-cpc-navy-text">
                        Due {formatDateKeyShort(eventEndKey(event))}
                      </span>
                      <span>{event.semester}</span>
                      {event.department && (
                        <span className="inline-flex items-center gap-0.5">
                          <Building2 className="h-3 w-3" aria-hidden />
                          {event.department}
                        </span>
                      )}
                    </span>
                    <span className="mt-1 flex items-center gap-1">
                      <span
                        className={cn(
                          "rounded-full border px-2 py-0.5 font-poppins text-[10px] font-bold",
                          state.badgeClass,
                        )}
                      >
                        {state.label}
                      </span>
                      <StatusBadge status={event.status} />
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </SectionCard>
  );
}
