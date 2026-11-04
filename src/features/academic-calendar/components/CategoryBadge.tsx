import { cn } from "@/lib/cn";
import { CATEGORY_META, type CalendarCategory } from "../data/academicCalendar";

type CategoryBadgeProps = {
  category: CalendarCategory;
  className?: string;
  /** Uses the plural label, e.g. "Examinations". */
  plural?: boolean;
};

export function CategoryBadge({ category, className, plural = false }: CategoryBadgeProps) {
  const meta = CATEGORY_META[category];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-poppins text-[9px] leading-none font-semibold whitespace-nowrap",
        meta.badgeClass,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dotClass)} aria-hidden />
      {plural ? meta.pluralLabel : meta.label}
    </span>
  );
}
