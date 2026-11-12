import { AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import type { DayCode } from "@/types/schedule";
import { formatTimeRange } from "@/lib/scheduleTime";
import { describeSlot } from "@/components/features/admin/schedules/conflicts";
import type { Conflict } from "@/components/features/admin/schedules/types";
import { KIND_GROUPS } from "@/components/features/admin/schedules/conflictKinds";

export type FreeSlot = { day: DayCode; startMin: number; endMin: number };

type ConflictInlineWarningProps = {
  /** Clashes for the class exactly as the form holds it right now. */
  conflicts: Conflict[];
  /** `null` until the staff member asks; then the first free windows. */
  slots: FreeSlot[] | null;
  onFindSlots: () => void;
  onApplySlot: (slot: FreeSlot) => void;
  /** A read-only role sees the clash but cannot act on it. */
  disabled?: boolean;
  /** False while no day or no real time range is chosen: there is nothing to judge yet. */
  ready?: boolean;
};

/**
 * The live check inside the entry form (spec §8).
 *
 * It runs the same engine as the panel and the Publish button against the
 * half-finished class in the form, so the warning is never a guess: change the
 * teacher and the teacher clash appears while the fields are still open, fix
 * the time and it disappears. "Find a free slot" then walks the day in the
 * grid's own 30-minute steps and offers the first windows where the section,
 * the teacher and both room sets are simultaneously clear, which is the same
 * search the import preview and the duplicate modal rely on.
 *
 * The summary sentence is inside `aria-live="polite"`, so the answer is spoken
 * without stealing focus from the field being edited.
 */
export function ConflictInlineWarning({
  conflicts,
  slots,
  onFindSlots,
  onApplySlot,
  disabled = false,
  ready = true,
}: ConflictInlineWarningProps) {
  const clashing = conflicts.length > 0;

  return (
    <div className="space-y-2">
      <div aria-live="polite">
        {clashing ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5">
            <p className="flex items-center gap-1.5 font-poppins text-xs font-bold text-rose-700">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {conflicts.length} clash{conflicts.length === 1 ? "" : "es"} at this time
            </p>
            <ul className="mt-1.5 space-y-1">
              {conflicts.map((conflict) => {
                const group = KIND_GROUPS.find((item) => item.kind === conflict.kind);
                return (
                  <li
                    key={conflict.id}
                    className="font-poppins text-[11px] leading-snug text-cpc-navy-text"
                  >
                    <span className="font-semibold">{group?.label ?? conflict.kind}</span>{" "}
                    — {conflict.message}
                  </li>
                );
              })}
            </ul>
          </div>
        ) : ready ? (
          <p className="flex items-center gap-1.5 font-poppins text-xs font-semibold text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
            This slot is free.
          </p>
        ) : null}
      </div>

      {clashing && !disabled && (
        <button
          type="button"
          onClick={onFindSlots}
          className="cpc-btn cpc-btn-secondary cpc-btn-sm"
        >
          <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
          Find a free slot
        </button>
      )}

      {slots !== null && !disabled && (
        <div className="rounded-xl border border-cpc-tile-border/70 bg-cpc-section-light px-3 py-2.5">
          <p className="font-poppins text-[10px] font-bold tracking-[0.12em] text-cpc-heading-soft uppercase">
            Free windows
          </p>
          {slots.length === 0 ? (
            <p className="mt-1 font-poppins text-[11px] text-cpc-navy-text">
              Nothing free in these days at this length. Widen the days or shorten the class.
            </p>
          ) : (
            <ul className="mt-1.5 flex flex-wrap gap-1.5">
              {slots.map((slot) => (
                <li key={`${slot.day}-${slot.startMin}`}>
                  <button
                    type="button"
                    onClick={() => onApplySlot(slot)}
                    aria-label={`Use ${describeSlot(slot)}`}
                    className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-cpc-input-border bg-white px-2.5 py-1.5 font-poppins text-[11px] font-semibold text-cpc-navy-text tabular-nums transition-colors hover:bg-cpc-blue-accent hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
                  >
                    {slot.day} {formatTimeRange(slot.startMin, slot.endMin)}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
