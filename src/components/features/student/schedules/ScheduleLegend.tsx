import { useMemo } from "react";
import { ArrowRight, Check, Info } from "lucide-react";
import { cn } from "@/lib/cn";
import { useSchedule } from "@/components/features/student/schedules/useSchedule";
import type { ScheduleEntry } from "@/types/schedule";
import { getSubjectColor } from "@/lib/scheduleColors";

type ScheduleLegendProps = {
  entries: ScheduleEntry[];
  layout: "chips" | "sidebar";
};

/**
 * Clickable subject legend. The same color tokens drive the calendar blocks,
 * and pressing a chip filters the calendar to that subject only.
 */
export function ScheduleLegend({ entries, layout }: ScheduleLegendProps) {
  const { activeColorKey, setActiveColorKey, toggleColorKey, roomSet } = useSchedule();

  const items = useMemo(() => {
    const seen = new Set<string>();
    return entries.filter((entry) => {
      if (seen.has(entry.colorKey)) return false;
      seen.add(entry.colorKey);
      return true;
    });
  }, [entries]);

  const isChips = layout === "chips";

  return (
    <div
      className={cn(
        "rounded-2xl border border-cpc-input-border bg-white shadow-[0_6px_18px_rgba(27,47,158,0.05)]",
        isChips ? "p-4" : "p-4",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-poppins text-sm font-semibold text-cpc-navy-text">Legend</h3>
        <button
          type="button"
          onClick={() => setActiveColorKey(null)}
          disabled={!activeColorKey}
          className={cn(
            "rounded-md px-2 py-1 font-poppins text-[11px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent",
            activeColorKey
              ? "cursor-pointer text-cpc-blue-accent hover:bg-cpc-section-light"
              : "cursor-not-allowed text-cpc-muted-blue opacity-60",
          )}
        >
          Show all
        </button>
      </div>

      <div
        role="group"
        aria-label="Highlight a subject in the calendar"
        className={cn(
          "mt-3",
          isChips ? "flex flex-wrap gap-1.5" : "flex flex-col gap-1",
        )}
      >
        {items.map((entry) => {
          const color = getSubjectColor(entry.colorKey);
          const active = activeColorKey === entry.colorKey;

          if (isChips) {
            return (
              <button
                key={entry.colorKey}
                type="button"
                aria-pressed={active}
                title={entry.title}
                onClick={() => toggleColorKey(entry.colorKey)}
                className={cn(
                  "inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 font-poppins text-[11px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent",
                  active ? color.chipActive : color.chip,
                  active ? "text-cpc-navy-text" : "text-cpc-heading-soft",
                )}
              >
                <span className={cn("h-2 w-2 shrink-0 rounded-full", color.dot)} aria-hidden />
                {entry.subjectCode}
              </button>
            );
          }

          return (
            <button
              key={entry.colorKey}
              type="button"
              aria-pressed={active}
              onClick={() => toggleColorKey(entry.colorKey)}
              className={cn(
                "flex w-full cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent",
                active
                  ? color.chipActive
                  : "border-transparent hover:bg-cpc-section-light",
              )}
            >
              <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", color.dot)} aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="block font-poppins text-xs font-semibold text-cpc-navy-text">
                  {entry.subjectCode}
                </span>
                <span className="block truncate font-poppins text-[10px] leading-snug text-cpc-heading-soft">
                  {entry.title}
                </span>
              </span>
              {active && <Check className="h-3.5 w-3.5 shrink-0 text-cpc-blue-accent" aria-hidden />}
            </button>
          );
        })}
      </div>

      <p className="mt-3 border-t border-cpc-input-border/70 pt-2 font-poppins text-[10px] leading-relaxed text-cpc-heading-soft">
        Showing Set {roomSet} rooms. Use the Set A / Set B toggle above the calendar to switch.
      </p>
    </div>
  );
}

/** Sticky sidebar helper card. */
export function RegistrarHelpCard() {
  return (
    <div className="rounded-2xl border border-cpc-tile-border bg-cpc-section-light p-4">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-cpc-blue-accent">
          <Info className="h-4 w-4" aria-hidden />
        </span>
        <h3 className="font-poppins text-sm font-semibold text-cpc-navy-text">
          Need to make changes?
        </h3>
      </div>
      <p className="mt-2 font-poppins text-xs leading-relaxed text-cpc-heading-soft">
        Contact your registrar&rsquo;s office for schedule adjustments or inquiries.
      </p>
      <a
        href="mailto:registrar@cordovapubliccollege.edu.ph"
        className="cpc-btn cpc-btn-primary cpc-btn-sm mt-3"
      >
        Contact Registrar
        <ArrowRight className="h-3.5 w-3.5" aria-hidden />
      </a>
    </div>
  );
}
