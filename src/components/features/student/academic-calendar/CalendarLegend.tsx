import { CircleDot } from "lucide-react";
import { cn } from "@/lib/cn";
import { CATEGORY_META, CATEGORY_ORDER } from "@/components/features/student/academic-calendar/academicCalendar";
import type { AcademicCalendar } from "@/components/features/student/academic-calendar/useAcademicCalendar";

export function CalendarLegend({ calendar }: { calendar: AcademicCalendar }) {
  const { category, categoryCounts, toggleCategory } = calendar;

  return (
    <section className="ac-card overflow-hidden" aria-labelledby="ac-legend-heading">
      <div className="flex items-center gap-2.5 border-b border-ac-border px-3.5 py-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ac-section text-ac-primary">
          <CircleDot className="h-3.5 w-3.5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2
            id="ac-legend-heading"
            className="font-poppins text-sm leading-tight font-bold text-ac-text"
          >
            Calendar Legend
          </h2>
          <p className="mt-0.5 font-poppins text-[10px] text-ac-muted">
            Tap a type to filter the calendar
          </p>
        </div>
        {category !== "all" ? (
          <button
            type="button"
            onClick={() => toggleCategory(category)}
            className="shrink-0 cursor-pointer rounded-md border border-ac-border px-2 py-1 font-poppins text-[10px] font-semibold text-ac-muted transition-colors hover:bg-ac-section hover:text-ac-text"
          >
            Show all
          </button>
        ) : null}
      </div>

      <ul className="grid grid-cols-2 gap-x-2 gap-y-1.5 p-3 sm:grid-cols-3 xl:grid-cols-1">
        {CATEGORY_ORDER.map((entry) => {
          const meta = CATEGORY_META[entry];
          const active = category === entry;
          return (
            <li key={entry}>
              <button
                type="button"
                onClick={() => toggleCategory(entry)}
                aria-pressed={active}
                className={cn(
                  "flex w-full min-w-0 cursor-pointer items-center gap-1.5 rounded-md px-1 py-0.5 text-left transition-colors hover:bg-ac-section focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ac-primary",
                  active && "bg-ac-section",
                )}
              >
                <span
                  className={cn("h-2 w-2 shrink-0 rounded-full", meta.dotClass)}
                  aria-hidden
                />
                <span
                  className={cn(
                    "min-w-0 flex-1 truncate font-poppins text-[11px] font-medium",
                    active ? "text-ac-primary" : "text-ac-text",
                  )}
                >
                  {meta.pluralLabel}
                </span>
                <span className="font-poppins text-[10px] text-ac-muted">
                  {categoryCounts[entry] ?? 0}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
