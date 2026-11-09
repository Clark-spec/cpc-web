import { CircleDot } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  CATEGORY_EVENT_COUNT,
  CATEGORY_META,
  CATEGORY_ORDER,
} from "@/components/features/student/academic-calendar/academicCalendar";

export function CalendarLegend() {
  return (
    <section className="ac-card overflow-hidden" aria-labelledby="ac-legend-heading">
      <div className="flex items-center gap-2.5 border-b border-ac-border px-3.5 py-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ac-section text-ac-primary">
          <CircleDot className="h-3.5 w-3.5" aria-hidden />
        </span>
        <div className="min-w-0">
          <h2
            id="ac-legend-heading"
            className="font-poppins text-[13px] leading-tight font-bold text-ac-text"
          >
            Calendar Legend
          </h2>
          <p className="mt-0.5 font-poppins text-[9px] text-ac-muted">
            Colour guide for every activity type
          </p>
        </div>
      </div>

      <ul className="grid grid-cols-2 gap-x-2 gap-y-1.5 p-3 sm:grid-cols-3 xl:grid-cols-1">
        {CATEGORY_ORDER.map((category) => {
          const meta = CATEGORY_META[category];
          return (
            <li
              key={category}
              className="flex min-w-0 items-center gap-1.5 rounded-md px-1 py-0.5"
            >
              <span
                className={cn("h-2 w-2 shrink-0 rounded-full", meta.dotClass)}
                aria-hidden
              />
              <span className="min-w-0 flex-1 truncate font-poppins text-[9px] font-medium text-ac-text">
                {meta.pluralLabel}
              </span>
              <span className="font-poppins text-[8px] text-ac-muted">
                {CATEGORY_EVENT_COUNT[category] ?? 0}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
