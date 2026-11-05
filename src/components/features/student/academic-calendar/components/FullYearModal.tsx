import { CalendarRange, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { Modal } from "@/components/ui/modal";
import {
  ACADEMIC_YEAR,
  CATEGORY_META,
  CATEGORY_ORDER,
  type AcademicEvent,
} from "../data/academicCalendar";
import {
  eventShortTitle,
  eventsForDate,
  eventsInMonth,
  getMonthGrid,
  isSameMonth,
  isToday,
} from "../utils/calendar";

const MONTHS_LONG = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const MINI_WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

type FullYearModalProps = {
  open: boolean;
  year: number;
  events: AcademicEvent[];
  onChangeYear: (delta: number) => void;
  onSelectMonth: (date: Date) => void;
  onClose: () => void;
};

export function FullYearModal({
  open,
  year,
  events,
  onChangeYear,
  onSelectMonth,
  onClose,
}: FullYearModalProps) {
  if (!open) return null;

  return (
    <Modal open onClose={onClose} labelledBy="ac-year-title" className="sm:max-w-5xl">
      <div className="sticky top-0 z-10 border-b border-ac-border bg-white px-4 py-3.5 pr-12 sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ac-section text-ac-primary">
              <CalendarRange className="h-4 w-4" aria-hidden />
            </span>
            <div className="min-w-0">
              <h2
                id="ac-year-title"
                className="font-poppins text-[15px] leading-tight font-bold text-ac-text"
              >
                Full Year Calendar
              </h2>
              <p className="mt-0.5 font-poppins text-[9.5px] text-ac-muted">
                A.Y. {ACADEMIC_YEAR} · 12-month overview
              </p>
            </div>
          </div>

          <div className="flex items-center gap-0.5 rounded-md border border-ac-border bg-ac-page p-0.5">
            <button
              type="button"
              onClick={() => onChangeYear(-1)}
              aria-label="Previous year"
              className="flex h-7 w-7 cursor-pointer items-center justify-center rounded text-ac-text transition-colors hover:bg-white hover:text-ac-primary focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ac-primary"
            >
              <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
            </button>
            <span className="min-w-[44px] text-center font-poppins text-[11px] font-semibold text-ac-text">
              {year}
            </span>
            <button
              type="button"
              onClick={() => onChangeYear(1)}
              aria-label="Next year"
              className="flex h-7 w-7 cursor-pointer items-center justify-center rounded text-ac-text transition-colors hover:bg-white hover:text-ac-primary focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ac-primary"
            >
              <ChevronRight className="h-3.5 w-3.5" aria-hidden />
            </button>
          </div>
        </div>
      </div>

      <div className="p-3 sm:p-4">
        <p className="mb-2.5 font-poppins text-[9.5px] text-ac-muted">
          Select any month to jump to its full calendar.
        </p>

        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {MONTHS_LONG.map((month, monthIndex) => {
            const monthDate = new Date(year, monthIndex, 1);
            const monthEvents = eventsInMonth(events, monthDate);
            const grid = getMonthGrid(monthDate);

            return (
              <button
                key={month}
                type="button"
                onClick={() => onSelectMonth(monthDate)}
                aria-label={`Open ${month} ${year} calendar`}
                className="cursor-pointer rounded-lg border border-ac-border bg-white p-2.5 text-left transition-all hover:-translate-y-px hover:border-ac-primary/35 hover:shadow-[0_6px_16px_rgba(23,43,92,0.08)] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ac-primary"
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="font-poppins text-[10.5px] font-semibold text-ac-text">
                    {month}
                  </span>
                  <span className="font-poppins text-[8px] text-ac-muted">
                    {monthEvents.length} {monthEvents.length === 1 ? "event" : "events"}
                  </span>
                </span>

                <span className="mt-1.5 grid grid-cols-7 gap-[1px] text-center">
                  {MINI_WEEKDAYS.map((day, index) => (
                    <span
                      key={`${day}-${index}`}
                      className="font-poppins text-[6.5px] font-semibold text-ac-muted/80"
                    >
                      {day}
                    </span>
                  ))}
                  {grid.map((day) => {
                    const inMonth = isSameMonth(day, monthDate);
                    const hasEvents = eventsForDate(events, day).length > 0;
                    return (
                      <span
                        key={day.toISOString()}
                        className={cn(
                          "flex h-[15px] items-center justify-center rounded-[2px] font-poppins text-[7px]",
                          !inMonth && "text-transparent",
                          inMonth && hasEvents && "bg-ac-section font-bold text-ac-primary",
                          inMonth && !hasEvents && "text-ac-muted",
                          inMonth && isToday(day) && "ring-1 ring-ac-primary",
                        )}
                      >
                        {inMonth ? day.getDate() : ""}
                      </span>
                    );
                  })}
                </span>

                <span className="mt-1.5 block min-h-[18px] space-y-0.5">
                  {monthEvents.slice(0, 2).map((event) => {
                    const meta = CATEGORY_META[event.category];
                    return (
                      <span
                        key={event.id}
                        className="flex items-center gap-1 font-poppins text-[7.5px] leading-tight text-ac-muted"
                      >
                        <span
                          className={cn("h-1 w-1 shrink-0 rounded-full", meta.dotClass)}
                          aria-hidden
                        />
                        <span className="truncate">{eventShortTitle(event)}</span>
                      </span>
                    );
                  })}
                  {monthEvents.length > 2 && (
                    <span className="block font-poppins text-[7.5px] font-semibold text-ac-primary">
                      +{monthEvents.length - 2} more
                    </span>
                  )}
                  {monthEvents.length === 0 && (
                    <span className="block font-poppins text-[7.5px] text-ac-muted/70">
                      No scheduled events
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-lg bg-ac-page px-3 py-2">
          {CATEGORY_ORDER.map((category) => {
            const meta = CATEGORY_META[category];
            return (
              <span
                key={category}
                className="flex items-center gap-1 font-poppins text-[8px] font-medium text-ac-muted"
              >
                <span className={cn("h-1.5 w-1.5 rounded-full", meta.dotClass)} aria-hidden />
                {meta.pluralLabel}
              </span>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}
