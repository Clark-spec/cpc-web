import { cn } from "@/lib/cn";
import { CATEGORY_META, type AcademicEvent } from "@/components/features/student/academic-calendar/academicCalendar";
import { eventsForDate, isToday } from "@/components/features/student/academic-calendar/calendar";

type WeekViewProps = {
  days: Date[];
  events: AcademicEvent[];
  onOpenEvent: (event: AcademicEvent) => void;
  onOpenDay: (date: Date) => void;
};

export function WeekView({ days, events, onOpenEvent, onOpenDay }: WeekViewProps) {
  return (
    <div className="ac-fade overflow-x-auto pb-1">
      <div className="min-w-[640px] overflow-hidden rounded-xl border border-cpc-input-border bg-white">
        <div className="grid grid-cols-7 border-b border-cpc-input-border bg-cpc-section-light">
          {days.map((day) => {
            const today = isToday(day);
            return (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => onOpenDay(day)}
                aria-label={`View events on ${day.toDateString()}`}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-2.5 transition-colors hover:bg-white/70",
                  today && "bg-cpc-blue-accent/5 hover:bg-cpc-blue-accent/5",
                )}
              >
                <span
                  className={cn(
                    "font-poppins text-[10px] font-semibold tracking-[0.08em] uppercase",
                    today ? "text-cpc-blue-accent" : "text-cpc-heading-soft",
                  )}
                >
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][day.getDay()]}
                </span>
                <span
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full font-poppins text-[11px] font-semibold",
                    today ? "bg-cpc-blue-accent text-white" : "text-cpc-navy-text",
                  )}
                >
                  {day.getDate()}
                </span>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-7 gap-px bg-cpc-input-border">
          {days.map((day) => {
            const dayEvents = eventsForDate(events, day);
            const today = isToday(day);
            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "min-h-[260px] space-y-1 bg-white p-2",
                  today && "bg-cpc-blue-accent/[0.03]",
                )}
              >
                {dayEvents.length === 0 ? (
                  <p className="pt-1 text-center font-poppins text-[10px] text-cpc-muted-blue">—</p>
                ) : (
                  dayEvents.map((event) => {
                    const meta = CATEGORY_META[event.category];
                    return (
                      <button
                        key={event.id}
                        type="button"
                        onClick={() => onOpenEvent(event)}
                        title={event.title}
                        style={{ borderLeftColor: meta.color }}
                        className={cn(
                          "block w-full rounded-md border border-l-4 p-2 text-left transition-transform hover:-translate-y-px hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-cpc-blue-accent",
                          meta.softClass,
                          meta.borderClass,
                        )}
                      >
                        <span
                          className={cn(
                            "block truncate font-poppins text-[9px] font-bold tracking-[0.06em] uppercase",
                            meta.textClass,
                          )}
                          title={event.allDay ? "All day" : (event.time ?? "TBA")}
                        >
                          {event.allDay ? "All day" : (event.time ?? "TBA")}
                        </span>
                        <span className="mt-1 block font-poppins text-[10.5px] leading-tight font-semibold text-cpc-navy-text">
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
