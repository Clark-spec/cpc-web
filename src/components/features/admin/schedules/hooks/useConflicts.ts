import { useCallback, useMemo } from "react";
import type { Conflict, DraftSchedule } from "@/types/scheduleAdmin";
import type { ScheduleEntry, SectionId, SectionSchedule } from "@/types/schedule";
import { conflictCountBySection, detectConflicts } from "../utils/conflicts";

export type UseConflictsResult = {
  conflicts: Conflict[];
  count: number;
  bySection: Record<string, number>;
  /**
   * Runs the SAME engine against a hypothetical draft, which is what makes the
   * live warning inside EntryFormModal and the duplicate/import previews
   * honest: they show what WOULD clash, not what clashes right now.
   */
  preview: (candidateSchedules?: SectionSchedule[]) => Conflict[];
  /** Convenience for the form: clash check for one entry against everything else. */
  conflictsForEntry: (entryId: string) => Conflict[];
};

/**
 * Memoised so the whole draft is re-scanned once per change, not once per
 * render. `detectConflicts` is pure, so memoising on the schedules reference is
 * sound: the service hands out a new draft object on every write.
 */
export function useConflicts(draft: DraftSchedule): UseConflictsResult {
  const conflicts = useMemo(() => detectConflicts(draft.schedules), [draft.schedules]);

  const bySection = useMemo(
    () => conflictCountBySection(conflicts, draft.schedules),
    [conflicts, draft.schedules],
  );

  const preview = useCallback(
    (candidateSchedules?: SectionSchedule[]) =>
      detectConflicts(candidateSchedules ?? draft.schedules),
    [draft.schedules],
  );

  const conflictsForEntry = useCallback(
    (entryId: string) => conflicts.filter((conflict) => conflict.entryIds.includes(entryId)),
    [conflicts],
  );

  return { conflicts, count: conflicts.length, bySection, preview, conflictsForEntry };
}

/**
 * Same engine, one entry swapped in. Used by the form's live check: the entry
 * being edited is replaced (by id) inside a copy of the schedules, so its own
 * current booking never reports itself as a conflict.
 */
export function detectConflictsWithEntry(
  schedules: SectionSchedule[],
  section: SectionId,
  entry: ScheduleEntry,
): Conflict[] {
  const swapped: SectionSchedule[] = schedules.map((schedule) =>
    schedule.section !== section
      ? schedule
      : {
          ...schedule,
          entries: schedule.entries.some((item) => item.id === entry.id)
            ? schedule.entries.map((item) => (item.id === entry.id ? entry : item))
            : [...schedule.entries, entry],
        },
  );
  return detectConflicts(swapped).filter(
    (conflict) => conflict.entryIds.includes(entry.id),
  );
}
