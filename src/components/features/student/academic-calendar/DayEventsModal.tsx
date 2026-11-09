import { CalendarDays, ChevronRight, Clock } from "lucide-react";
import { cn } from "@/lib/cn";
import { Modal } from "@/components/ui/modal";
import { CATEGORY_META, type AcademicEvent } from "@/components/features/student/academic-calendar/academicCalendar";
import { formatDayLabel, formatTime, sortEvents } from "@/components/features/student/academic-calendar/calendar";
import { CategoryBadge } from "@/components/features/student/academic-calendar/CategoryBadge";

type DayEventsModalProps = {
  date: Date | null;
  events: AcademicEvent[];
  onClose: () => void;
  onOpenEvent: (event: AcademicEvent) => void;
};

export function DayEventsModal({ date, events, onClose, onOpenEvent }: DayEventsModalProps) {
  if (!date) return null;
  const dayEvents = sortEvents(events);

  return (
    <Modal open onClose={onClose} labelledBy="ac-day-title" className="sm:max-w-md">
      <div className="border-b border-ac-border bg-ac-section px-5 py-4 pr-12">
        <p className="font-poppins text-[8.5px] font-semibold tracking-[0.12em] text-ac-muted uppercase">
          Events on
        </p>
        <h2
          id="ac-day-title"
          className="mt-0.5 font-poppins text-[16px] leading-snug font-bold text-ac-text"
        >
          {formatDayLabel(date)}
        </h2>
        <p className="mt-1 font-poppins text-[10px] text-ac-muted">
          {dayEvents.length === 0
            ? "Nothing scheduled"
            : `${dayEvents.length} scheduled ${dayEvents.length === 1 ? "activity" : "activities"}`}
        </p>
      </div>

      <div className="p-4">
        {dayEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-ac-border bg-ac-page/60 px-4 py-10 text-center">
            <CalendarDays className="h-7 w-7 text-ac-muted" aria-hidden />
            <p className="mt-2 font-poppins text-[12px] font-semibold text-ac-text">
              No events on this date
            </p>
            <p className="mt-1 max-w-[240px] font-poppins text-[10px] leading-relaxed text-ac-muted">
              Select another date on the calendar or browse the upcoming dates for the month.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {dayEvents.map((event) => {
              const meta = CATEGORY_META[event.category];
              const Icon = meta.icon;
              return (
                <li key={event.id}>
                  <button
                    type="button"
                    onClick={() => onOpenEvent(event)}
                    className={cn(
                      "flex w-full items-start gap-2.5 rounded-lg border p-2.5 text-left transition-colors hover:brightness-[0.98] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ac-primary",
                      meta.softClass,
                      meta.borderClass,
                    )}
                  >
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/75">
                      <Icon className={cn("h-3.5 w-3.5", meta.textClass)} aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="font-poppins text-[11px] leading-tight font-semibold text-ac-text">
                          {event.title}
                        </span>
                        <CategoryBadge category={event.category} />
                      </span>
                      <span className="mt-1 flex items-center gap-1 font-poppins text-[9px] text-ac-muted">
                        <Clock className="h-2.5 w-2.5" aria-hidden />
                        {formatTime(event)}
                        {event.location && <span>· {event.location}</span>}
                      </span>
                    </span>
                    <ChevronRight className="mt-1.5 h-4 w-4 shrink-0 text-ac-muted" aria-hidden />
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full cursor-pointer rounded-lg border border-ac-border bg-white px-3 py-2 font-poppins text-[10.5px] font-semibold text-ac-text transition-colors hover:bg-ac-page focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ac-primary"
        >
          Close
        </button>
      </div>
    </Modal>
  );
}
