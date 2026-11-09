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
      <div className="min-w-[640px] overflow-hidden rounded-xl border border-cpc-input-border bg-white">
        <div className="grid grid-cols-7 border-b border-cpc-input-border bg-cpc-section-light">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="py-2.5 text-center font-poppins text-[11px] font-semibold tracking-[0.08em] text-cpc-heading-soft uppercase"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-px bg-cpc-input-border">
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
                  "min-h-[72px] min-w-0 bg-white p-1.5 sm:min-h-[92px] sm:p-2 lg:min-h-[104px]",
                  !inMonth && "bg-[#FAFBFF]",
                  today && inMonth && "bg-cpc-blue-accent/[0.04]",
                )}
              >
                <button
                  type="button"
                  onClick={() => onOpenDay(date)}
                  aria-label={`View events on ${date.toDateString()}`}
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full font-poppins text-[11px] font-semibold transition-colors sm:h-7 sm:w-7 sm:text-xs",
                    today
                      ? "bg-cpc-blue-accent font-bold text-white"
                      : inMonth
                        ? "text-cpc-navy-text hover:bg-cpc-section-light hover:text-cpc-blue-accent"
                        : "text-cpc-muted-blue/70 hover:bg-cpc-section-light hover:text-cpc-blue-accent",
                  )}
                >
                  {date.getDate()}
                </button>

                <div className="mt-1 space-y-1">
                  {visible.map((event) => {
                    const meta = CATEGORY_META[event.category];
                    return (
                      <button
                        key={event.id}
                        type="button"
                        onClick={() => onOpenEvent(event)}
                        title={`${event.title} · ${meta.label}`}
                        style={{ borderLeftColor: meta.color }}
                        className={cn(
                          "flex w-full min-w-0 items-center gap-1 rounded-md border border-l-2 px-1.5 py-1 text-left font-poppins text-[10px] leading-tight font-semibold transition-colors hover:brightness-[0.97] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-cpc-blue-accent sm:text-[10.5px]",
                          meta.softClass,
                          meta.borderClass,
                          meta.textClass,
                        )}
                      >
                        <span
                          className={cn("h-2 w-2 shrink-0 rounded-full", meta.dotClass)}
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
                      className="w-full rounded px-1 text-left font-poppins text-[10px] font-semibold text-cpc-blue-accent hover:underline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-cpc-blue-accent"
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
