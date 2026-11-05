import { cn } from "@/lib/cn";
import { CATEGORY_META, type AcademicEvent } from "../data/academicCalendar";
import { eventsForDate, isToday } from "../utils/calendar";

type WeekViewProps = {
  days: Date[];
  events: AcademicEvent[];
  onOpenEvent: (event: AcademicEvent) => void;
  onOpenDay: (date: Date) => void;
};

export function WeekView({ days, events, onOpenEvent, onOpenDay }: WeekViewProps) {
  return (
    <div className="ac-fade overflow-x-auto pb-1">
      <div className="min-w-[640px] overflow-hidden rounded-lg border border-ac-border">
        <div className="grid grid-cols-7 gap-px border-b border-ac-border bg-ac-section">
          {days.map((day) => {
            const today = isToday(day);
            return (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => onOpenDay(day)}
                aria-label={`View events on ${day.toDateString()}`}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-2 transition-colors hover:bg-white/70",
                  today && "bg-ac-primary text-white hover:bg-ac-primary",
                )}
              >
                <span
                  className={cn(
                    "font-poppins text-[8.5px] font-semibold tracking-[0.08em] uppercase",
                    today ? "text-white/85" : "text-ac-muted",
                  )}
                >
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][day.getDay()]}
                </span>
                <span
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full font-poppins text-[11px] font-semibold",
                    today ? "bg-white text-ac-primary" : "text-ac-text",
                  )}
                >
                  {day.getDate()}
                </span>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-7 gap-px bg-ac-border">
          {days.map((day) => {
            const dayEvents = eventsForDate(events, day);
            const today = isToday(day);
            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "min-h-[260px] space-y-1 bg-white p-1.5",
                  today && "bg-ac-section/40",
                )}
              >
                {dayEvents.length === 0 ? (
                  <p className="pt-1 text-center font-poppins text-[8px] text-ac-muted/70">—</p>
                ) : (
                  dayEvents.map((event) => {
                    const meta = CATEGORY_META[event.category];
                    return (
                      <button
                        key={event.id}
                        type="button"
                        onClick={() => onOpenEvent(event)}
                        title={event.title}
                        className={cn(
                          "block w-full rounded-md border p-1.5 text-left transition-transform hover:-translate-y-px hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ac-primary",
                          meta.softClass,
                          meta.borderClass,
                        )}
                      >
                        <span
                          className={cn(
                            "block truncate font-poppins text-[7.5px] font-bold tracking-[0.06em] uppercase",
                            meta.textClass,
                          )}
                          title={event.allDay ? "All day" : (event.time ?? "TBA")}
                        >
                          {event.allDay ? "All day" : (event.time ?? "TBA")}
                        </span>
                        <span className="mt-0.5 block font-poppins text-[8.5px] leading-[11px] font-semibold text-ac-text">
                          {event.title}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
