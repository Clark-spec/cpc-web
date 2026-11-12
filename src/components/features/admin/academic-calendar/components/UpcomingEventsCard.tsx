import { useMemo, useState } from "react";
import { ArrowRight, CalendarPlus, Clock3, MapPin } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  CATEGORY_META,
  CATEGORY_ORDER,
  daysBetween,
  eventEndKey,
  formatDateShort,
  formatTimeRange,
  parseDateKey,
  relativeDayLabel,
  sortEvents,
  toDateKey,
  type AdminCalendarEvent,
  type EventCategory,
} from "../data/academicCalendar";
import {
  CalendarEmptyState,
  CategoryBadge,
  SectionCard,
  StatusBadge,
  ghostButtonClass,
} from "./CalendarPieces";

type UpcomingEventsCardProps = {
  events: AdminCalendarEvent[];
  onSelect: (event: AdminCalendarEvent) => void;
  onViewAll: () => void;
  onAddEvent: () => void;
};

const UPCOMING_LIMIT = 6;

/** Chronological list of published events that have not ended yet. */
export function UpcomingEventsCard({
  events,
  onSelect,
  onViewAll,
  onAddEvent,
}: UpcomingEventsCardProps) {
  const [category, setCategory] = useState<EventCategory | "all">("all");
  const todayKey = toDateKey(new Date());

  const upcoming = useMemo(() => {
    return sortEvents(
      events.filter(
        (event) =>
          event.status === "published" &&
          eventEndKey(event) >= todayKey &&
          (category === "all" || event.category === category),
      ),
    ).slice(0, UPCOMING_LIMIT);
  }, [events, category, todayKey]);

  return (
    <SectionCard
      id="upcoming-events"
      title="Upcoming Academic Events"
      description="Published dates students can already see, in chronological order."
      actions={
        <>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value as EventCategory | "all")}
            aria-label="Filter upcoming events by category"
            className="rounded-lg border border-cpc-input-border/70 bg-white/90 px-2.5 py-1.5 font-poppins text-[11px] font-semibold text-cpc-navy-text shadow-2xs backdrop-blur-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
          >
            <option value="all">All categories</option>
            {CATEGORY_ORDER.map((option) => (
              <option key={option} value={option}>
                {CATEGORY_META[option].label}
              </option>
            ))}
          </select>
          <button type="button" onClick={onViewAll} className={ghostButtonClass()}>
            View all
            <ArrowRight className="h-3 w-3" aria-hidden />
          </button>
        </>
      }
      bodyClassName="p-3"
    >
      {upcoming.length === 0 ? (
        <CalendarEmptyState
          title="No upcoming published events"
          description="Publish an event or change the category filter to populate this list."
          action={
            <button
              type="button"
              onClick={onAddEvent}
              className="cpc-btn cpc-btn-primary cpc-btn-sm mt-1"
            >
              <CalendarPlus className="h-3 w-3" aria-hidden />
              Add Event
            </button>
          }
        />
      ) : (
        <ul className="space-y-1">
          {upcoming.map((event) => {
            const meta = CATEGORY_META[event.category];
            const start = parseDateKey(event.startDate);
            const ongoing = event.startDate <= todayKey && eventEndKey(event) >= todayKey;
            const days = daysBetween(new Date(), start);
            const soon = ongoing || days <= 7;
            return (
              <li key={event.id}>
                <button
                  type="button"
                  onClick={() => onSelect(event)}
                  className="group flex w-full items-start gap-2.5 rounded-lg border border-transparent p-2 text-left transition-colors hover:border-cpc-input-border/70 hover:bg-white/80 focus-visible:outline-2 focus-visible:outline-cpc-blue-accent"
                >
                  <span
                    className={cn(
                      "flex h-10 w-9 shrink-0 flex-col items-center justify-center rounded-lg border",
                      meta.softClass,
                      meta.borderClass,
                    )}
                    aria-hidden
                  >
                    <span className={cn("font-poppins text-[9px] font-bold tracking-[0.04em] uppercase", meta.textClass)}>
                      {start.toLocaleDateString("en-US", { month: "short" })}
                    </span>
                    <span className={cn("font-poppins text-[15px] leading-none font-bold", meta.textClass)}>
                      {start.getDate()}
                    </span>
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-1">
                      <span className="truncate font-poppins text-xs font-semibold text-cpc-navy-text">
                        {event.title}
                      </span>
                      {soon && (
                        <span
                          className={cn(
                            "shrink-0 rounded-full border px-2 py-0.5 font-poppins text-[10px] font-bold",
                            ongoing
                              ? "border-[#C4EBDC] bg-[#E9F7F1] text-[#128A59]"
                              : "border-[#F9DDB4] bg-[#FEF4E7] text-[#B9761B]",
                          )}
                        >
                          {ongoing ? "Ongoing" : relativeDayLabel(event.startDate)}
                        </span>
                      )}
                    </span>

                    <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-poppins text-[11px] text-cpc-heading-soft">
                      <span className="inline-flex items-center gap-1">
                        <Clock3 className="h-3 w-3" aria-hidden />
                        {formatTimeRange(event)}
                      </span>
                      {event.location && (
                        <span className="inline-flex items-center gap-1 truncate">
                          <MapPin className="h-3 w-3" aria-hidden />
                          {event.location}
                        </span>
                      )}
                    </span>

                    <span className="mt-1 flex items-center gap-1">
                      <CategoryBadge category={event.category} compact />
                      <StatusBadge status={event.status} />
                    </span>
                  </span>

                  <span className="shrink-0 self-center font-poppins text-[11px] font-semibold text-cpc-heading-soft">
                    {formatDateShort(start)}
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
