import {
  BellRing,
  CalendarDays,
  Clock,
  MapPin,
  MoveRight,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { Modal } from "@/components/ui/modal";
import { CATEGORY_META, type AcademicEvent } from "@/components/features/student/academic-calendar/academicCalendar";
import { formatEventDate, formatTime, parseDateKey } from "@/components/features/student/academic-calendar/calendar";

type EventDetailsModalProps = {
  event: AcademicEvent | null;
  onClose: () => void;
  onViewDay: (date: Date) => void;
};

export function EventDetailsModal({ event, onClose, onViewDay }: EventDetailsModalProps) {
  if (!event) return null;

  const meta = CATEGORY_META[event.category];
  const Icon = meta.icon;

  return (
    <Modal open onClose={onClose} labelledBy="ac-event-title" className="sm:max-w-md">
      <div className={cn("border-b border-ac-border px-5 py-4 pr-12", meta.softClass)}>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border bg-white/80 px-2 py-0.5 font-poppins text-[9px] font-semibold",
            meta.borderClass,
            meta.textClass,
          )}
        >
          <Icon className="h-3 w-3" aria-hidden />
          {meta.label}
        </span>
        <h2
          id="ac-event-title"
          className="mt-2 font-poppins text-[17px] leading-snug font-bold text-ac-text"
        >
          {event.title}
        </h2>
      </div>

      <div className="space-y-4 p-5">
        <dl className="space-y-2.5">
          <div className="flex items-start gap-2.5">
            <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-ac-primary" aria-hidden />
            <div>
              <dt className="font-poppins text-[8.5px] font-semibold tracking-[0.1em] text-ac-muted uppercase">
                Date
              </dt>
              <dd className="font-poppins text-[11px] font-medium text-ac-text">
                {formatEventDate(event)}
              </dd>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-ac-primary" aria-hidden />
            <div>
              <dt className="font-poppins text-[8.5px] font-semibold tracking-[0.1em] text-ac-muted uppercase">
                Time
              </dt>
              <dd className="font-poppins text-[11px] font-medium text-ac-text">
                {formatTime(event)}
              </dd>
            </div>
          </div>

          {event.location && (
            <div className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-ac-primary" aria-hidden />
              <div>
                <dt className="font-poppins text-[8.5px] font-semibold tracking-[0.1em] text-ac-muted uppercase">
                  Location
                </dt>
                <dd className="font-poppins text-[11px] font-medium text-ac-text">
                  {event.location}
                </dd>
              </div>
            </div>
          )}
        </dl>

        <p className="font-poppins text-[11px] leading-relaxed text-ac-muted">
          {event.description}
        </p>

        {event.reminder && event.reminderNote && (
          <div className="flex items-start gap-2 rounded-lg border border-ac-deadline/25 bg-ac-deadline-soft p-2.5">
            <BellRing className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ac-deadline" aria-hidden />
            <p className="font-poppins text-[10px] leading-relaxed font-medium text-ac-text">
              {event.reminderNote}
            </p>
          </div>
        )}

        <div className="flex gap-2 pt-0.5">
          <button
            type="button"
            onClick={() => onViewDay(parseDateKey(event.start))}
            className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-ac-primary px-3 py-2 font-poppins text-[10.5px] font-semibold text-white transition-colors hover:bg-ac-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ac-primary"
          >
            View this day
            <MoveRight className="h-3.5 w-3.5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg border border-ac-border bg-white px-3 py-2 font-poppins text-[10.5px] font-semibold text-ac-text transition-colors hover:bg-ac-page focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ac-primary"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}
