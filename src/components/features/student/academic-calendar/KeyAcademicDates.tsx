import { CalendarCheck2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { CATEGORY_META, type AcademicEvent } from "@/components/features/student/academic-calendar/academicCalendar";
import { formatEventDateShort } from "@/components/features/student/academic-calendar/calendar";
import { CardListSkeleton } from "@/components/features/student/academic-calendar/CalendarSkeletons";
import { CategoryBadge } from "@/components/features/student/academic-calendar/CategoryBadge";

type KeyAcademicDatesProps = {
  dates: AcademicEvent[];
  monthLabel: string;
  loading: boolean;
  onOpenEvent: (event: AcademicEvent) => void;
};

export function KeyAcademicDates({
  dates,
  monthLabel,
  loading,
  onOpenEvent,
}: KeyAcademicDatesProps) {
  return (
    <section className="ac-card overflow-hidden" aria-labelledby="ac-key-dates-heading">
      <div className="flex items-center gap-2.5 border-b border-ac-border px-3.5 py-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ac-section text-ac-primary">
          <CalendarCheck2 className="h-3.5 w-3.5" aria-hidden />
        </span>
        <div className="min-w-0">
          <h2
            id="ac-key-dates-heading"
            className="font-poppins text-sm leading-tight font-bold text-ac-text"
          >
            Key Academic Dates
          </h2>
          <p className="mt-0.5 truncate font-poppins text-[10px] text-ac-muted">
            Important dates around {monthLabel}
          </p>
        </div>
      </div>

      <div className="p-2.5 sm:p-3" aria-busy={loading}>
        {loading ? (
          <CardListSkeleton rows={4} />
        ) : dates.length === 0 ? (
          <p className="px-1 py-4 text-center font-poppins text-[11px] text-ac-muted">
            No key dates to show for this period.
          </p>
        ) : (
          <ul className="space-y-1">
            {dates.map((event) => {
              const meta = CATEGORY_META[event.category];
              const Icon = meta.icon;
              return (
                <li key={event.id}>
                  <button
                    type="button"
                    onClick={() => onOpenEvent(event)}
                    className="flex w-full items-start gap-2.5 rounded-lg p-1.5 text-left transition-colors hover:bg-ac-page focus-visible:bg-ac-page focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ac-primary"
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
                        meta.softClass,
                      )}
                    >
                      <Icon className={cn("h-3.5 w-3.5", meta.textClass)} aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-poppins text-xs leading-tight font-semibold text-ac-text">
                        {event.title}
                      </span>
                      <span className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1">
                        <span
                          className={cn(
                            "font-poppins text-[10px] font-semibold",
                            meta.textClass,
                          )}
                        >
                          {formatEventDateShort(event)}
                        </span>
                        <CategoryBadge category={event.category} />
                      </span>
                      <span className="mt-1 line-clamp-2 block font-poppins text-[10px] leading-relaxed text-ac-muted">
                        {event.description}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
