import { useMemo } from "react";
import { AlertTriangle } from "lucide-react";
import type { ScheduleEntry } from "@/types/schedule";
import { findConflicts } from "@/lib/layoutEvents";
import { DAY_FULL, formatTimeRange } from "@/lib/scheduleTime";

type ConflictBannerProps = {
  entries: ScheduleEntry[];
};

/** Amber banner listing any genuine time overlaps in the selected section. */
export function ConflictBanner({ entries }: ConflictBannerProps) {
  const conflicts = useMemo(() => findConflicts(entries), [entries]);

  if (conflicts.length === 0) return null;

  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-amber-900 shadow-[0_6px_18px_rgba(180,83,9,0.08)]"
    >
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
      <div className="min-w-0">
        <p className="font-poppins text-sm font-semibold">
          {conflicts.length === 1 ? "Schedule conflict detected" : `${conflicts.length} schedule conflicts detected`}
        </p>
        <ul className="mt-1 space-y-1 font-poppins text-xs leading-relaxed">
          {conflicts.slice(0, 3).map(({ day, first, second }) => (
            <li key={`${day}-${first.id}-${second.id}`}>
              {first.subjectCode} ({formatTimeRange(first.startMin, first.endMin)}) overlaps{" "}
              {second.subjectCode} ({formatTimeRange(second.startMin, second.endMin)}) on{" "}
              {DAY_FULL[day]}.
            </li>
          ))}
        </ul>
        <p className="mt-1.5 font-poppins text-[11px]">
          Please contact the registrar&rsquo;s office so the schedule can be corrected.
        </p>
      </div>
    </div>
  );
}
