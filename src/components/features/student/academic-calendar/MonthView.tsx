import { cn } from "@/lib/cn";
import { CATEGORY_META, type AcademicEvent } from "@/components/features/student/academic-calendar/academicCalendar";
import {
  eventShortTitle,
  eventsForDate,
  getMonthGrid,
  isSameMonth,
  isToday,
} from "@/components/features/student/academic-calendar/calendar";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type MonthViewProps = {
  monthDate: Date;
  events: AcademicEvent[];
  onOpenEvent: (event: AcademicEvent) => void;
  onOpenDay: (date: Date) => void;
};

export function MonthView({ monthDate, events, onOpenEvent, onOpenDay }: MonthViewProps) {
  const grid = getMonthGrid(monthDate);

  return (
    <div className="ac-fade overflow-x-auto pb-1">
      <div className="min-w-[640px] overflow-hidden rounded-lg border border-ac-border">
        <div className="grid grid-cols-7 border-b border-ac-border bg-ac-section">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="py-1.5 text-center font-poppins text-[9px] font-semibold tracking-[0.08em] text-ac-muted uppercase"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-px bg-ac-border">
          {grid.map((date) => {
            const inMonth = isSameMonth(date, monthDate);
            const today = isToday(date);
            const dayEvents = eventsForDate(events, date);
            const visible = dayEvents.slice(0, 2);
            const extra = dayEvents.length - visible.length;

            return (
              <div
                key={date.toISOString()}
                className={cn(
                  "min-h-[64px] min-w-0 bg-white p-1 sm:min-h-[82px] sm:p-1.5 lg:min-h-[90px]",
                  !inMonth && "bg-[#FAFBFF]",
                  today && inMonth && "bg-ac-section/60",
                )}
              >
                <button
                  type="button"
                  onClick={() => onOpenDay(date)}
                  aria-label={`View events on ${date.toDateString()}`}
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full font-poppins text-[9.5px] font-medium transition-colors sm:h-[22px] sm:w-[22px] sm:text-[10px]",
                    today
                      ? "bg-ac-primary font-bold text-white"
                      : inMonth
                        ? "text-ac-text hover:bg-ac-section hover:text-ac-primary"
                        : "text-ac-muted/70 hover:bg-ac-section hover:text-ac-primary",
                  )}
                >
                  {date.getDate()}
                </button>

                <div className="mt-0.5 space-y-0.5">
                  {visible.map((event) => {
                    const meta = CATEGORY_META[event.category];
                    return (
                      <button
                        key={event.id}
                        type="button"
                        onClick={() => onOpenEvent(event)}
                        title={`${event.title} · ${meta.label}`}
                        className={cn(
                          "flex w-full min-w-0 items-center gap-1 rounded border px-1 py-[2px] text-left font-poppins text-[8px] leading-[10px] font-medium transition-colors hover:brightness-[0.97] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ac-primary sm:text-[8.5px]",
                          meta.softClass,
                          meta.borderClass,
                          meta.textClass,
                        )}
                      >
                        <span
                          className={cn("h-1.5 w-1.5 shrink-0 rounded-full", meta.dotClass)}
                          aria-hidden
                        />
                        <span className="truncate">{eventShortTitle(event)}</span>
                      </button>
                    );
                  })}

                  {extra > 0 && (
                    <button
                      type="button"
                      onClick={() => onOpenDay(date)}
                      className="w-full rounded px-1 text-left font-poppins text-[8px] font-semibold text-ac-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ac-primary"
                    >
                      +{extra} more
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
