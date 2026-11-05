import { CalendarRange, ChevronDown, ChevronUp, MoveRight } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { CATEGORY_META, type AcademicEvent } from "../data/academicCalendar";
import {
  formatDateBox,
  formatEventDateShort,
  formatTime,
  parseDateKey,
} from "../utils/calendar";
import { CardListSkeleton } from "./CalendarSkeletons";
import { CategoryBadge } from "./CategoryBadge";

type UpcomingDatesProps = {
  events: AcademicEvent[];
  monthLabel: string;
  loading: boolean;
  onOpenEvent: (event: AcademicEvent) => void;
};

export function UpcomingDates({
  events,
  monthLabel,
  loading,
  onOpenEvent,
}: UpcomingDatesProps) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? events.slice(0, 9) : events.slice(0, 5);
  const hasMore = events.length > 5;

  return (
    <section className="ac-card overflow-hidden" aria-labelledby="ac-upcoming-heading">
      <div className="flex items-center gap-2.5 border-b border-ac-border px-3.5 py-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ac-section text-ac-primary">
          <CalendarRange className="h-3.5 w-3.5" aria-hidden />
        </span>
        <div className="min-w-0">
          <h2
            id="ac-upcoming-heading"
            className="font-poppins text-[13px] leading-tight font-bold text-ac-text"
          >
            Upcoming Dates
          </h2>
          <p className="mt-0.5 truncate font-poppins text-[9px] text-ac-muted">
            From {monthLabel} onward · nearest first
          </p>
        </div>
      </div>

      <div className="p-2.5 sm:p-3" aria-busy={loading}>
        {loading ? (
          <CardListSkeleton rows={4} />
        ) : visible.length === 0 ? (
          <div className="px-2 py-6 text-center">
            <p className="font-poppins text-[10.5px] font-semibold text-ac-text">
              No upcoming dates
            </p>
            <p className="mt-1 font-poppins text-[9px] text-ac-muted">
              Browse an earlier month to see scheduled activities.
            </p>
          </div>
        ) : (
          <ul className="space-y-1">
            {visible.map((event) => {
              const date = parseDateKey(event.start);
              const box = formatDateBox(date);
              const meta = CATEGORY_META[event.category];
              return (
                <li key={event.id}>
                  <button
                    type="button"
                    onClick={() => onOpenEvent(event)}
                    className="flex w-full items-start gap-2.5 rounded-lg p-1.5 text-left transition-colors hover:bg-ac-page focus-visible:bg-ac-page focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ac-primary"
                  >
                    <span
                      className={cn(
                        "flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg border bg-white",
                        meta.borderClass,
                      )}
                      aria-hidden
                    >
                      <span
                        className={cn(
                          "font-poppins text-[7px] font-bold tracking-[0.08em]",
                          meta.textClass,
                        )}
                      >
                        {box.month}
                      </span>
                      <span className="font-poppins text-[14px] leading-none font-bold text-ac-text">
                        {box.day}
                      </span>
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
                        <span className="font-poppins text-[10.5px] leading-tight font-semibold text-ac-text">
                          {event.title}
                        </span>
                        <CategoryBadge category={event.category} />
                      </span>
                      <span className="mt-1 block font-poppins text-[8.5px] text-ac-muted">
                        {formatEventDateShort(event)} · {formatTime(event)}
                      </span>
                    </span>

                    <MoveRight
                      className="mt-3 h-3 w-3 shrink-0 text-ac-muted"
                      aria-hidden
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {!loading && hasMore && (
          <button
            type="button"
            onClick={() => setExpanded((current) => !current)}
            aria-expanded={expanded}
            className="mt-1.5 flex w-full cursor-pointer items-center justify-center gap-1 rounded-md border border-ac-border bg-white px-2 py-1.5 font-poppins text-[9.5px] font-semibold text-ac-primary transition-colors hover:bg-ac-section focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ac-primary"
          >
            {expanded ? (
              <>
                Show less
                <ChevronUp className="h-3 w-3" aria-hidden />
              </>
            ) : (
              <>
                View more dates
                <ChevronDown className="h-3 w-3" aria-hidden />
              </>
            )}
          </button>
        )}
      </div>
    </section>
  );
}
