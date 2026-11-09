import { Eye, EyeOff, Palette } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  CATEGORY_META,
  CATEGORY_ORDER,
  type EventCategory,
} from "../data/academicCalendar";
import { SectionCard, ghostButtonClass } from "./CalendarPieces";

type CategoryLegendCardProps = {
  counts: Record<EventCategory, number>;
  hidden: EventCategory[];
  onToggle: (category: EventCategory) => void;
  onShowAll: () => void;
};

/**
 * Calendar legend doubles as the category filter. Hidden categories are removed
 * from the calendar immediately while this list keeps every category visible.
 */
export function CategoryLegendCard({
  counts,
  hidden,
  onToggle,
  onShowAll,
}: CategoryLegendCardProps) {
  const hiddenCount = hidden.length;

  return (
    <SectionCard
      id="calendar-legend"
      title="Event Categories and Calendar Legend"
      description="Click a category to show or hide it on the calendar."
      actions={
        <>
          <span className="font-poppins text-[11px] text-cpc-heading-soft">
            {hiddenCount > 0 ? `${hiddenCount} hidden` : "All visible"}
          </span>
          <button
            type="button"
            onClick={onShowAll}
            disabled={hiddenCount === 0}
            className={ghostButtonClass("disabled:cursor-not-allowed disabled:opacity-40")}
          >
            <Palette className="h-3 w-3" aria-hidden />
            Show all
          </button>
        </>
      }
      bodyClassName="p-3"
    >
      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        {CATEGORY_ORDER.map((category) => {
          const meta = CATEGORY_META[category];
          const Icon = meta.icon;
          const isHidden = hidden.includes(category);
          return (
            <button
              key={category}
              type="button"
              onClick={() => onToggle(category)}
              aria-pressed={!isHidden}
              aria-label={`${isHidden ? "Show" : "Hide"} ${meta.label} events`}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition-all focus-visible:outline-2 focus-visible:outline-cpc-blue-accent",
                isHidden
                  ? "border-cpc-input-border/50 bg-white/80 opacity-55 hover:opacity-80"
                  : "border-cpc-input-border/60 bg-white/90 hover:border-cpc-blue-accent/40 hover:bg-white/80",
              )}
            >
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border",
                  meta.softClass,
                  meta.borderClass,
                  meta.textClass,
                )}
                aria-hidden
              >
                <Icon className="h-3.5 w-3.5" />
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className={cn(
                    "block truncate font-poppins text-xs font-semibold text-cpc-navy-text",
                    isHidden && "line-through",
                  )}
                >
                  {meta.label}
                </span>
                <span className="block font-poppins text-[11px] text-cpc-heading-soft">
                  {counts[category]} {counts[category] === 1 ? "event" : "events"}
                </span>
              </span>
              {isHidden ? (
                <EyeOff className="h-3 w-3 shrink-0 text-cpc-heading-soft" aria-hidden />
              ) : (
                <Eye className="h-3 w-3 shrink-0 text-cpc-heading-soft/60" aria-hidden />
              )}
            </button>
          );
        })}
      </div>
    </SectionCard>
  );
}
