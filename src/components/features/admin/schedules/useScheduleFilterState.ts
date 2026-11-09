import { useCallback, useMemo } from "react";
import type { ScheduleEntry, SectionId, SectionSchedule } from "@/types/schedule";
import type { Conflict, ScheduleMasterData } from "@/types/scheduleAdmin";
import type { ScheduleFilters, SectionTab } from "./types";

export type VisibleEntry = {
  entry: ScheduleEntry;
  section: SectionId;
  conflictCount: number;
};

export function useScheduleFilterState(
  filters: ScheduleFilters,
  scopedSchedules: SectionSchedule[],
  master: ScheduleMasterData,
  conflicts: Conflict[],
  section: SectionTab,
) {
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.search.trim() !== "") count += 1;
    if (filters.day !== "all") count += 1;
    if (filters.instructorId !== "all") count += 1;
    if (filters.room !== "all") count += 1;
    if (filters.status !== "all") count += 1;
    if (filters.onlyConflicts) count += 1;
    return count;
  }, [filters]);

  const conflictCountByEntry = useMemo(() => {
    const counts = new Map<string, number>();
    for (const conflict of conflicts) {
      for (const entryId of conflict.entryIds) {
        counts.set(entryId, (counts.get(entryId) ?? 0) + 1);
      }
    }
    return counts;
  }, [conflicts]);

  const visibleEntries = useMemo<VisibleEntry[]>(() => {
    const needle = filters.search.trim().toLowerCase();
    const rows: VisibleEntry[] = [];
    for (const schedule of scopedSchedules) {
      if (section !== "all" && schedule.section !== section) continue;
      for (const entry of schedule.entries) {
        if (filters.day !== "all" && !entry.days.includes(filters.day)) continue;
        if (filters.status !== "all" && entry.status !== filters.status) continue;
        if (filters.instructorId !== "all" && entry.instructorId !== filters.instructorId) continue;
        if (filters.room !== "all") {
          const roomName =
            master.rooms.find((room) => room.id === filters.room)?.name ?? filters.room;
          const target = roomName.trim().toUpperCase();
          if (
            entry.roomSetA.trim().toUpperCase() !== target &&
            entry.roomSetB.trim().toUpperCase() !== target
          ) {
            continue;
          }
        }
        if (filters.onlyConflicts && (conflictCountByEntry.get(entry.id) ?? 0) === 0) continue;
        if (
          needle !== "" &&
          !`${entry.subjectCode} ${entry.title} ${entry.instructor} ${entry.roomSetA} ${entry.roomSetB}`
            .toLowerCase()
            .includes(needle)
        ) {
          continue;
        }
        rows.push({
          entry,
          section: schedule.section,
          conflictCount: conflictCountByEntry.get(entry.id) ?? 0,
        });
      }
    }
    return rows;
  }, [conflictCountByEntry, filters, master.rooms, scopedSchedules, section]);

  const entriesBySection = useCallback(
    (value: SectionId) => scopedSchedules.find((schedule) => schedule.section === value)?.entries ?? [],
    [scopedSchedules],
  );

  const sectionOfEntry = useCallback(
    (entryId: string) =>
      scopedSchedules.find((schedule) => schedule.entries.some((entry) => entry.id === entryId))
        ?.section ?? null,
    [scopedSchedules],
  );

  return {
    activeFilterCount,
    conflictCountByEntry,
    visibleEntries,
    entriesBySection,
    sectionOfEntry,
  };
}

