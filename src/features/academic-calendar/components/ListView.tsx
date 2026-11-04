import { CalendarDays, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { CATEGORY_META, type AcademicEvent } from "../data/academicCalendar";
import {
  formatEventDate,
  formatMonthYear,
  formatTime,
  parseDateKey,
} from "../lib/calendar";
import { CategoryBadge } from "./CategoryBadge";

type ListViewProps = {
  events: AcademicEvent[];
  monthDate: Date;
  onOpenEvent: (event: AcademicEvent) => void;
};

const MONTHS_SHORT = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
];

export function ListView({ events, monthDate, onOpenEvent }: ListViewProps) {
  if (events.length === 0) {
    return (
      <div className="ac-fade flex flex-col items-center justify-center rounded-lg border border-dashed border-ac-border bg-ac-page/60 px-4 py-14 text-center">
        <CalendarDays className="h-8 w-8 text-ac-muted" aria-hidden />
        <p className="mt-3 font-poppins text-[13px] font-semibold text-ac-text">
          No events scheduled for {formatMonthYear(monthDate)}
        </p>
        <p className="mt-1 max-w-xs font-poppins text-[10.5px] leading-relaxed text-ac-muted">
          Use the previous and next arrows, or view the full year, to browse other months.
        </p>
      </div>
    );
  }

  return (
    <div className="ac-fade">
      <p className="mb-2 font-poppins text-[10px] font-medium text-ac-muted">
        {events.length} {events.length === 1 ? "event" : "events"} in{" "}
        {formatMonthYear(monthDate)}
      </p>

      <ul className="divide-y divide-ac-border overflow-hidden rounded-lg border border-ac-border bg-white">
        {events.map((event) => {
          const meta = CATEGORY_META[event.category];
          const start = parseDateKey(event.start);
          return (
            <li key={event.id}>
              <button
                type="button"
                onClick={() => onOpenEvent(event)}
                className="flex w-full items-start gap-3 px-3 py-3 text-left transition-colors hover:bg-ac-page/70 focus-visible:bg-ac-page focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ac-primary"
              >
                <span
                  className={cn(
                    "flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg border",
                    meta.softClass,
                    meta.borderClass,
                  )}
                  aria-hidden
                >
                  <span
                    className={cn(
                      "font-poppins text-[7.5px] font-bold tracking-[0.08em]",
                      meta.textClass,
                    )}
                  >
                    {MONTHS_SHORT[start.getMonth()]}
                  </span>
                  <span className="font-poppins text-[15px] leading-none font-bold text-ac-text">
                    {start.getDate()}
                  </span>
                </span>

                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="font-poppins text-[11.5px] leading-tight font-semibold text-ac-text">
                      {event.title}
                    </span>
                    <CategoryBadge category={event.category} />
                  </span>
                  <span className="mt-0.5 block font-poppins text-[9px] text-ac-muted">
                    {formatEventDate(event)} · {formatTime(event)}
                  </span>
                  <span className="mt-1 line-clamp-2 block font-poppins text-[9.5px] leading-relaxed text-ac-muted">
                    {event.description}
                  </span>
                </span>

                <ChevronRight
                  className="mt-2 h-4 w-4 shrink-0 text-ac-muted"
                  aria-hidden
                />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
