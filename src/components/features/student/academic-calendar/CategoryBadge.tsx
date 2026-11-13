import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import {
  CATEGORY_META,
  type CalendarCategory,
} from "@/components/features/student/academic-calendar/academicCalendar";

type CategoryBadgeProps = {
  category: CalendarCategory;
  className?: string;
  /** Uses the plural label, e.g. "Examinations". */
  plural?: boolean;
};

export function CategoryBadge({ category, className, plural = false }: CategoryBadgeProps) {
  const meta = CATEGORY_META[category];
  return (
    <Badge
      tone="plain"
      size="sm"
      dotColor={meta.color}
      className={cn(meta.badgeClass, className)}
    >
      {plural ? meta.pluralLabel : meta.label}
    </Badge>
  );
}
