import { Check } from "lucide-react";
import { cn } from "@/lib/cn";
import { DAY_CODES, DAY_FULL, DAY_LABELS } from "@/lib/scheduleTime";
import type { DayCode } from "@/types/schedule";

type DaysPickerProps = {
  value: DayCode[];
  onChange: (days: DayCode[]) => void;
  /** The `<label>` that names the group. */
  labelledBy: string;
  describedBy?: string;
  invalid?: boolean;
  disabled?: boolean;
};

/**
 * Meeting-day chips.
 *
 * A class meets on a SET of days at ONE time, so the day list is a value in its
 * own right, not six independent checkboxes: the grid, the conflict engine and
 * `swapDay` all read `entry.days` in `DAY_CODES` order, and this control keeps
 * that order so a saved row never looks shuffled.
 *
 * `role="group"` plus `aria-pressed` is what makes the state readable without
 * colour: a screen reader hears "Monday, Tuesday, pressed, toggle button".
 */
export function DaysPicker({
  value,
  onChange,
  labelledBy,
  describedBy,
  invalid = false,
  disabled = false,
}: DaysPickerProps) {
  const toggle = (day: DayCode) => {
    const next = value.includes(day) ? value.filter((item) => item !== day) : [...value, day];
    onChange(DAY_CODES.filter((item) => next.includes(item)));
  };

  return (
    <div
      role="group"
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      aria-invalid={invalid || undefined}
      className="flex flex-wrap gap-1.5"
    >
      {DAY_CODES.map((day) => {
        const selected = value.includes(day);
        return (
          <button
            key={day}
            type="button"
            disabled={disabled}
            aria-pressed={selected}
            title={DAY_FULL[day]}
            onClick={() => toggle(day)}
            className={cn(
              "inline-flex cursor-pointer items-center gap-1 rounded-lg border px-2.5 py-1.5 font-poppins text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent disabled:cursor-not-allowed disabled:opacity-60",
              selected
                ? "border-cpc-blue-accent bg-cpc-blue-accent text-white"
                : "border-cpc-input-border bg-white text-cpc-navy-text hover:bg-cpc-section-light",
            )}
          >
            {selected && <Check className="h-3 w-3 shrink-0" aria-hidden />}
            {DAY_LABELS[day]}
          </button>
        );
      })}
    </div>
  );
}
