import { useMemo } from "react";
import { AlarmClock, ArrowRight, Building2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { Badge, type BadgeTone } from "@/components/ui/badge";
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

const DEADLINE_TONES: Record<string, BadgeTone> = {
  overdue: "danger",
  today: "danger",
  soon: "warning",
  upcoming: "success",
};

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
        <Badge tone="danger" size="sm">
          {overdue} overdue
        </Badge>
        <Badge tone="warning" size="sm">
          {dueSoon} due this week
        </Badge>
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
                    "flex w-full items-start gap-2 rounded-lg border border-transparent px-2 py-2 text-left transition-colors hover:border-cpc-input-border/70 hover:bg-white/80 focus-visible:outline-2 focus-visible:outline-cpc-blue-accent",
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
                          : "border-cpc-input-border/60 bg-white/85 text-cpc-blue-accent",
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
                    <span className="mt-1 flex flex-wrap items-center gap-1">
                      <Badge tone={DEADLINE_TONES[state.tone]} size="sm">
                        {state.label}
                      </Badge>
                      <StatusBadge status={event.status} size="sm" />
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
