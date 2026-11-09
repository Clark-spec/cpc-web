import type { LucideIcon } from "lucide-react";
import { useCountUp } from "@/hooks/useCountUp";
import { cn } from "@/lib/cn";

type SummaryCardProps = {
  label: string;
  count: number;
  icon: LucideIcon;
  /** Icon-tile colour classes. */
  tone: string;
  /** Small right-hand chip, e.g. "42% of total". */
  chip: string;
  hint: string;
  active?: boolean;
  onClick: () => void;
};

/**
 * Click-to-filter summary card shared by the three Student Accounts pages,
 * visually aligned with the clearance and complaint KPI strips.
 */
export function SummaryCard({
  label,
  count,
  icon: Icon,
  tone,
  chip,
  hint,
  active = false,
  onClick,
}: SummaryCardProps) {
  const displayed = useCountUp(count, 700);

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={`${label}: ${count}. ${hint}. Filter the table.`}
      className={cn(
        "flex cursor-pointer flex-col rounded-2xl border bg-white p-5 text-left transition-all hover:-translate-y-0.5 hover:border-cpc-tile-border hover:shadow-[0_14px_36px_rgba(15,36,104,0.10)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent motion-reduce:hover:translate-y-0",
        active
          ? "border-cpc-blue-accent/40 ring-1 ring-cpc-blue-accent/25"
          : "border-cpc-tile-border/70",
      )}
    >
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
            tone,
          )}
          aria-hidden
        >
          <Icon className="h-5 w-5" />
        </span>
        <p className="min-w-0 font-poppins text-xs leading-snug font-semibold text-cpc-heading-soft">
          {label}
        </p>
      </div>

      <div className="mt-4 flex items-end justify-between gap-3">
        <p
          aria-live="polite"
          aria-atomic="true"
          className="min-w-0 truncate font-poppins text-[26px] leading-none font-bold text-cpc-navy-text tabular-nums"
        >
          {displayed.toLocaleString()}
        </p>
        <span className="inline-flex shrink-0 items-center rounded-full bg-slate-100 px-2 py-1 font-poppins text-[11px] leading-none font-semibold text-slate-600">
          {chip}
        </span>
      </div>
    </button>
  );
}
