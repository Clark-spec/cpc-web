import {
  SCHEDULE_DRAFT_KEY,
  SCHEDULE_HISTORY_KEY,
  SCHEDULE_MASTER_KEY,
  SCHEDULE_PUBLISHED_KEY,
} from "@/lib/scheduleStorage";
import { ACADEMIC_YEAR, SEMESTER } from "@/services/scheduleStudent/mockSchedules";
import {
  seedHistory,
  seedMasterData,
  seedPublishedSchedule,
} from "@/services/scheduleStudent/mockAdmin";
import type { SectionId, SectionSchedule } from "@/types/schedule";
import type {
  DraftSchedule,
  PublishedSchedule,
  ScheduleChange,
  ScheduleMasterData,
} from "@/types/scheduleAdmin";
import {
  MAX_HISTORY,
  announceScheduleChange,
  newId,
  nowIso,
  readJson,
  wait,
  writeJson,
} from "./primitives";

export function emptySection(section: SectionId): SectionSchedule {
  return { section, semester: SEMESTER, academicYear: ACADEMIC_YEAR, entries: [] };
}

export function draftFromPublished(published: PublishedSchedule): DraftSchedule {
  return {
    baseVersion: published.version,
    updatedAt: nowIso(),
    schedules: published.schedules.map((schedule) => ({
      ...schedule,
      entries: schedule.entries.map((entry) => ({ ...entry })),
    })),
  };
}

export function getMasterSync(): ScheduleMasterData {
  const stored = readJson<ScheduleMasterData | null>(SCHEDULE_MASTER_KEY, null);
  if (
    stored !== null &&
    Array.isArray(stored.subjects) &&
    Array.isArray(stored.instructors) &&
    Array.isArray(stored.rooms)
  ) {
    return stored;
  }
  const seeded = seedMasterData();
  writeJson(SCHEDULE_MASTER_KEY, seeded);
  return seeded;
}

export function getPublishedSync(): PublishedSchedule {
  const stored = readJson<PublishedSchedule | null>(SCHEDULE_PUBLISHED_KEY, null);
  if (stored !== null && Array.isArray(stored.schedules)) return stored;
  const seeded = seedPublishedSchedule();
  writeJson(SCHEDULE_PUBLISHED_KEY, seeded);
  return seeded;
}

export function getDraftSync(): DraftSchedule {
  const stored = readJson<DraftSchedule | null>(SCHEDULE_DRAFT_KEY, null);
  if (stored !== null && Array.isArray(stored.schedules)) return stored;
  const seeded = draftFromPublished(getPublishedSync());
  writeJson(SCHEDULE_DRAFT_KEY, seeded);
  return seeded;
}

export function getHistorySync(): ScheduleChange[] {
  const stored = readJson<ScheduleChange[] | null>(SCHEDULE_HISTORY_KEY, null);
  if (Array.isArray(stored)) return stored;
  const seeded = seedHistory(getPublishedSync());
  writeJson(SCHEDULE_HISTORY_KEY, seeded);
  return seeded;
}

export function appendChange(change: Omit<ScheduleChange, "id" | "at">): void {
  const history = getHistorySync();
  const next: ScheduleChange[] = [{ ...change, id: newId(), at: nowIso() }, ...history];
  writeJson(SCHEDULE_HISTORY_KEY, next.slice(0, MAX_HISTORY));
}

export function persistDraft(draft: DraftSchedule, reason: string): DraftSchedule {
  const stamped: DraftSchedule = { ...draft, updatedAt: nowIso() };
  writeJson(SCHEDULE_DRAFT_KEY, stamped);
  announceScheduleChange(reason);
  return stamped;
}

/**
 * Creates the four keys on first run so the page never opens onto an empty
 * store, and repairs a partial store. `resetDemoData()` calls the same
 * builder after clearing.
 */
export function ensureSeeded(): void {
  getPublishedSync();
  getMasterSync();
  getDraftSync();
  getHistorySync();
}

/* --------------------------------------------------------------- snapshots */

export type ScheduleSnapshot = {
  published: PublishedSchedule;
  draft: DraftSchedule;
  master: ScheduleMasterData;
  history: ScheduleChange[];
};

/** One call for the whole page, so the first paint waits 400 ms once, not four times. */
export async function getScheduleSnapshot(): Promise<ScheduleSnapshot> {
  ensureSeeded();
  return wait({
    published: getPublishedSync(),
    draft: getDraftSync(),
    master: getMasterSync(),
    history: getHistorySync(),
  });
}

/** The student-facing read. PUBLISHED only — never the draft. */
export async function getPublishedSchedule(): Promise<PublishedSchedule> {
  ensureSeeded();
  return wait(getPublishedSync());
}

/** The admin working copy. Every edit in this module lands here, nowhere else. */
export async function getDraft(): Promise<DraftSchedule> {
  ensureSeeded();
  return wait(getDraftSync());
}

export async function getMasterData(): Promise<ScheduleMasterData> {
  ensureSeeded();
  return wait(getMasterSync());
}

export async function getHistory(): Promise<ScheduleChange[]> {
  ensureSeeded();
  return wait(getHistorySync());
}

/**
 * Synchronous read of the audit trail, used by the context right after a
 * mutation so the history list is fresh without waiting out another 400 ms
 * round trip.
 */
export function readHistoryNow(): ScheduleChange[] {
  return getHistorySync();
}

