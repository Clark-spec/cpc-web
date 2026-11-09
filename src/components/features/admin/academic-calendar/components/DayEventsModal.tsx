import { CalendarPlus, Clock3, MapPin } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/cn";
import {
  CATEGORY_META,
  formatDateLong,
  formatTimeRange,
  type AdminCalendarEvent,
} from "../data/academicCalendar";
import { CategoryBadge, StatusBadge, primaryButtonClass, secondaryButtonClass } from "./CalendarPieces";

type DayEventsModalProps = {
  date: Date;
  events: AdminCalendarEvent[];
  onClose: () => void;
  onSelect: (event: AdminCalendarEvent) => void;
  onAdd: (dateKey: string) => void;
};

/** Compact day tray used by the "+N more" affordance in the month grid. */
export function DayEventsModal({ date, events, onClose, onSelect, onAdd }: DayEventsModalProps) {
  const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;

  return (
    <Modal open onClose={onClose} labelledBy="day-events-title" className="sm:max-w-md">
      <div className="border-b border-cpc-tile-border/60 bg-cpc-bg/50 px-5 py-4 pr-12">
        <p className="font-poppins text-[11px] font-bold tracking-[0.16em] text-cpc-blue-accent uppercase">
          Day schedule
        </p>
        <h2
          id="day-events-title"
          className="mt-0.5 font-poppins text-lg font-bold text-cpc-blue-accent"
        >
          {formatDateLong(date)}
        </h2>
        <p className="mt-0.5 font-poppins text-xs text-cpc-heading-soft">
          {events.length} {events.length === 1 ? "event" : "events"} on this date
        </p>
      </div>

      <ul className="max-h-[52vh] space-y-1.5 overflow-y-auto p-3 admin-scrollbar">
        {events.map((event) => {
          const meta = CATEGORY_META[event.category];
          return (
            <li key={event.id}>
              <button
                type="button"
                onClick={() => onSelect(event)}
                className={cn(
                  "flex w-full items-start gap-2.5 rounded-lg border border-l-[3px] p-2.5 text-left transition-colors hover:brightness-[0.98] focus-visible:outline-2 focus-visible:outline-cpc-blue-accent",
                  meta.borderClass,
                  meta.softClass,
                  event.status === "cancelled" && "opacity-60",
                )}
                style={{ borderLeftColor: meta.hex }}
              >
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "font-poppins text-xs font-semibold text-cpc-navy-text",
                      event.status === "cancelled" && "line-through",
                    )}
                  >
                    {event.title}
                  </p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2 font-poppins text-[11px] text-cpc-heading-soft">
                    <span className="inline-flex items-center gap-1">
                      <Clock3 className="h-3 w-3" aria-hidden />
                      {formatTimeRange(event)}
                    </span>
                    {event.location && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3" aria-hidden />
                        {event.location}
                      </span>
                    )}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-1">
                    <CategoryBadge category={event.category} compact />
                    <StatusBadge status={event.status} />
                  </div>
                </div>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="flex flex-col-reverse gap-2 border-t border-cpc-tile-border/60 px-5 py-3 sm:flex-row sm:justify-end">
        <button type="button" onClick={onClose} className={secondaryButtonClass()}>
          Close
        </button>
        <button type="button" onClick={() => onAdd(dateKey)} className={primaryButtonClass()}>
          <CalendarPlus className="h-3.5 w-3.5" aria-hidden />
          Add Event on This Date
        </button>
      </div>
    </Modal>
  );
}
