import { cn } from "@/lib/cn";
import { DAY_END_MIN, DAY_START_MIN, formatTime } from "@/lib/scheduleTime";
import { STEP_MIN } from "@/components/features/admin/schedules/conflicts";
import { DISABLED_BASE, FIELD_BASE, INVALID_BASE, LABEL_BASE } from "@/components/features/admin/schedules/formStyles";

/** Every half-hour mark the grid can draw, inclusive of the closing minute. */
function slotRange(from: number, to: number): number[] {
  const slots: number[] = [];
  for (let minutes = from; minutes <= to; minutes += STEP_MIN) slots.push(minutes);
  return slots;
}

type TimeRangePickerProps = {
  startMin: number;
  endMin: number;
  onChange: (next: { startMin: number; endMin: number }) => void;
  startId: string;
  endId: string;
  startInvalid?: boolean;
  endInvalid?: boolean;
  describedBy?: string;
  disabled?: boolean;
};

/**
 * Start and end time, as two selects over the grid's own half-hour marks.
 *
 * The last start option is one step before closing and the first end option is
 * one step after opening, so the pair can never be built the wrong way round by
 * the picker itself — `endMin > startMin` stays a schema rule rather than a
 * disabled-state puzzle. A class keeps its duration when either edge moves,
 * because shifting a start time and losing an hour is never what a registrar
 * meant to do.
 */
export function TimeRangePicker({
  startMin,
  endMin,
  onChange,
  startId,
  endId,
  startInvalid = false,
  endInvalid = false,
  describedBy,
  disabled = false,
}: TimeRangePickerProps) {
  const duration = Math.max(endMin - startMin, 0);
  const hours = Math.floor(duration / 60);
  const minutes = duration % 60;
  const durationLabel =
    duration === 0
      ? "no length yet"
      : `${hours > 0 ? `${hours} h` : ""}${hours > 0 && minutes > 0 ? " " : ""}${
          minutes > 0 ? `${minutes} min` : ""
        }`;

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="min-w-[7.5rem] flex-1">
        <label htmlFor={startId} className={LABEL_BASE}>
          Starts
        </label>
        <select
          id={startId}
          value={startMin}
          disabled={disabled}
          aria-invalid={startInvalid || undefined}
          aria-describedby={describedBy}
          onChange={(event) => {
            const next = Number(event.target.value);
            onChange({ startMin: next, endMin: Math.min(next + duration, DAY_END_MIN) });
          }}
          className={cn(FIELD_BASE, "cursor-pointer", DISABLED_BASE, startInvalid && INVALID_BASE)}
        >
          {slotRange(DAY_START_MIN, DAY_END_MIN - STEP_MIN).map((slot) => (
            <option key={slot} value={slot}>
              {formatTime(slot)}
            </option>
          ))}
        </select>
      </div>

      <div className="min-w-[7.5rem] flex-1">
        <label htmlFor={endId} className={LABEL_BASE}>
          Ends
        </label>
        <select
          id={endId}
          value={endMin}
          disabled={disabled}
          aria-invalid={endInvalid || undefined}
          aria-describedby={describedBy}
          onChange={(event) => onChange({ startMin, endMin: Number(event.target.value) })}
          className={cn(FIELD_BASE, "cursor-pointer", DISABLED_BASE, endInvalid && INVALID_BASE)}
        >
          {slotRange(DAY_START_MIN + STEP_MIN, DAY_END_MIN).map((slot) => (
            <option key={slot} value={slot}>
              {formatTime(slot)}
            </option>
          ))}
        </select>
      </div>

      <p className="pb-2 font-poppins text-xs text-cpc-heading-soft" aria-live="polite">
        {durationLabel}
      </p>
    </div>
  );
}
