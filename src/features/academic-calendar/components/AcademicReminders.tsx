import { BellRing } from "lucide-react";
import { cn } from "@/lib/cn";
import { CATEGORY_META, type AcademicEvent } from "../data/academicCalendar";
import { formatEventDateShort } from "../lib/calendar";
import { CategoryBadge } from "./CategoryBadge";

type AcademicRemindersProps = {
  reminders: AcademicEvent[];
  onOpenEvent: (event: AcademicEvent) => void;
};

export function AcademicReminders({ reminders, onOpenEvent }: AcademicRemindersProps) {
  return (
    <section
      className="ac-card overflow-hidden bg-gradient-to-br from-ac-section via-white to-white"
      aria-labelledby="ac-reminders-heading"
    >
      <div className="p-3.5">
        <div className="flex items-start gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-ac-primary shadow-[0_1px_4px_rgba(23,43,92,0.08)]">
            <BellRing className="h-3.5 w-3.5" aria-hidden />
          </span>
          <div className="min-w-0">
            <h2
              id="ac-reminders-heading"
              className="font-poppins text-[13px] leading-tight font-bold text-ac-text"
            >
              Academic Reminders
            </h2>
            <p className="mt-1 font-poppins text-[9.5px] leading-relaxed text-ac-muted">
              Important academic announcements and reminders.
            </p>
          </div>
        </div>

        <div className="mt-3 rounded-lg border border-ac-deadline/25 bg-white/85 p-2.5">
          <p className="flex items-center gap-1.5 font-poppins text-[8.5px] font-bold tracking-[0.09em] text-ac-deadline uppercase">
            <BellRing className="h-3 w-3" aria-hidden />
            Nearest Important Dates
          </p>

          {reminders.length === 0 ? (
            <p className="mt-2 font-poppins text-[9.5px] text-ac-muted">
              No reminders at the moment. Check back for new announcements.
            </p>
          ) : (
            <ul className="mt-2 space-y-2">
              {reminders.map((event) => {
                const meta = CATEGORY_META[event.category];
                return (
                  <li key={event.id}>
                    <button
                      type="button"
                      onClick={() => onOpenEvent(event)}
                      className="group w-full rounded text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ac-primary"
                    >
                      <span className="flex items-start gap-1.5">
                        <span
                          className={cn("mt-1 h-1.5 w-1.5 shrink-0 rounded-full", meta.dotClass)}
                          aria-hidden
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block font-poppins text-[10px] leading-tight font-semibold text-ac-text transition-colors group-hover:text-ac-primary">
                            {event.title}
                          </span>
                          <span className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-1">
                            <span className="font-poppins text-[8.5px] font-medium text-ac-muted">
                              {formatEventDateShort(event)}
                            </span>
                            <CategoryBadge category={event.category} />
                          </span>
                          {event.reminderNote && (
                            <span className="mt-0.5 line-clamp-2 block font-poppins text-[8.5px] leading-relaxed text-ac-muted">
                              {event.reminderNote}
                            </span>
                          )}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
