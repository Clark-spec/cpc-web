/**
 * Staff-side data layer for Class Schedules.
 *
 * (1) SHARED-STORAGE CONTRACT. Both portals read and write the same keys, so
 * the strings come from `config/scheduleStorage.ts` rather than being typed a
 * second time here:
 *     cpc:schedules:published   PublishedSchedule  (students read this only)
 *     cpc:schedules:draft       DraftSchedule      (staff edits this only)
 *     cpc:schedules:master      ScheduleMasterData (subjects/teachers/rooms/sections)
 *     cpc:schedules:history     ScheduleChange[]   (audit trail + version log)
 *     cpc:notifications:{id}    AppNotification[]  (the student bell)
 *   The one rule that protects a student: every edit function below writes the
 *   DRAFT. Only `publish()` copies draft → PUBLISHED, so an unfinished or
 *   half-conflicted timetable can never reach the student page.
 *
 * (2) PUBLISH FLOW. admin edits draft → `detectConflicts` runs on every draft
 *   change → publish() bumps the version, archives the previous copy, appends
 *   history, notifies the affected students and broadcasts on
 *   BroadcastChannel("cpc-schedules"). The `storage` event covers the other
 *   tab, the channel covers this one; the student page re-reads PUBLISHED and
 *   shows the "Your schedule was updated" banner.
 *
 * (3) MOCK TIMING. Every function is async with a short delay so the UI
 *   exercises its real loading and error states. Each one says in a comment
 *   where a `fetch` replaces the localStorage call; the signatures stay.
 */
import {
  SCHEDULE_CHANNEL_NAME,
  SCHEDULE_DRAFT_KEY,
  SCHEDULE_HISTORY_KEY,
  SCHEDULE_MASTER_KEY,
  SCHEDULE_PUBLISHED_KEY,
  studentNotificationsKey,
} from "@/config/scheduleStorage";
import { ACADEMIC_YEAR, SEMESTER, SECTION_IDS } from "@/data/mockSchedules";
import {
  linkEntryToMaster,
  seedHistory,
  seedMasterData,
  seedPublishedSchedule,
} from "@/data/mockScheduleAdmin";
import type { AppNotification } from "@/types/clearance";
import type { DayCode, SectionId, SectionSchedule, ScheduleEntry } from "@/types/schedule";
import type {
  DraftSchedule,
  DuplicateOptions,
  EntryPatch,
  ImportRowInput,
  ImportRowResult,
  Instructor,
  PublishOptions,
  PublishedSchedule,
  PublishedVersion,
  Room,
  ScheduleChange,
  ScheduleMasterData,
  SectionPublishDiff,
  Subject,
} from "@/types/scheduleAdmin";
import { detectConflicts } from "../utils/conflicts";
import { parseCsvDays, parseCsvTime } from "../utils/csv";

const READ_DELAY = 400;
const WRITE_DELAY = 400;
const MAX_HISTORY = 120;
const MAX_PUBLISHED_ARCHIVE = 8;
const MAX_FEED = 30;

/** The demo learner whose bell this portal writes into; a real session supplies the id. */
const DEMO_STUDENT_ID = "12345678";
const DEMO_STUDENT_SECTION: SectionId = "BSIT-3A";
const STUDENT_PROFILE_KEY = "cpc.student-profile.v1";

function wait<T>(value: T, ms = READ_DELAY): Promise<T> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(value), ms);
  });
}

function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Quota or private mode: this tab's in-memory state still works.
  }
}

/** Tells the other open tabs (and the other hooks in this tab) to re-read. */
export function announceScheduleChange(reason: string): void {
  if (typeof BroadcastChannel === "undefined") return;
  try {
    const channel = new BroadcastChannel(SCHEDULE_CHANNEL_NAME);
    channel.postMessage({ reason, at: new Date().toISOString() });
    channel.close();
  } catch {
    // BroadcastChannel is unavailable in some privacy modes.
  }
}

/* ------------------------------------------------------------------- seed */

function nowIso(): string {
  return new Date().toISOString();
}

function emptySection(section: SectionId): SectionSchedule {
  return { section, semester: SEMESTER, academicYear: ACADEMIC_YEAR, entries: [] };
}

function draftFromPublished(published: PublishedSchedule): DraftSchedule {
  return {
    baseVersion: published.version,
    updatedAt: nowIso(),
    schedules: published.schedules.map((schedule) => ({
      ...schedule,
      entries: schedule.entries.map((entry) => ({ ...entry })),
    })),
  };
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

function getMasterSync(): ScheduleMasterData {
  const stored = readJson<ScheduleMasterData | null>(SCHEDULE_MASTER_KEY, null);
  if (stored !== null && Array.isArray(stored.subjects) && Array.isArray(stored.instructors) && Array.isArray(stored.rooms)) {
    return stored;
  }
  const seeded = seedMasterData();
  writeJson(SCHEDULE_MASTER_KEY, seeded);
  return seeded;
}

function getPublishedSync(): PublishedSchedule {
  const stored = readJson<PublishedSchedule | null>(SCHEDULE_PUBLISHED_KEY, null);
  if (stored !== null && Array.isArray(stored.schedules)) return stored;
  const seeded = seedPublishedSchedule();
  writeJson(SCHEDULE_PUBLISHED_KEY, seeded);
  return seeded;
}

function getDraftSync(): DraftSchedule {
  const stored = readJson<DraftSchedule | null>(SCHEDULE_DRAFT_KEY, null);
  if (stored !== null && Array.isArray(stored.schedules)) return stored;
  const seeded = draftFromPublished(getPublishedSync());
  writeJson(SCHEDULE_DRAFT_KEY, seeded);
  return seeded;
}

function getHistorySync(): ScheduleChange[] {
  const stored = readJson<ScheduleChange[] | null>(SCHEDULE_HISTORY_KEY, null);
  if (Array.isArray(stored)) return stored;
  const seeded = seedHistory(getPublishedSync());
  writeJson(SCHEDULE_HISTORY_KEY, seeded);
  return seeded;
}

function appendChange(change: Omit<ScheduleChange, "id" | "at">): void {
  const history = getHistorySync();
  const next: ScheduleChange[] = [{ ...change, id: newId(), at: nowIso() }, ...history];
  writeJson(SCHEDULE_HISTORY_KEY, next.slice(0, MAX_HISTORY));
}

function persistDraft(draft: DraftSchedule, reason: string): DraftSchedule {
  const stamped: DraftSchedule = { ...draft, updatedAt: nowIso() };
  writeJson(SCHEDULE_DRAFT_KEY, stamped);
  announceScheduleChange(reason);
  return stamped;
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
  // Replace with GET /schedules (published + draft + master + history).
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
  // Replace with GET /schedules/published.
  ensureSeeded();
  return wait(getPublishedSync());
}

/** The admin working copy. Every edit in this module lands here, nowhere else. */
export async function getDraft(): Promise<DraftSchedule> {
  // Replace with GET /schedules/draft.
  ensureSeeded();
  return wait(getDraftSync());
}

export async function getMasterData(): Promise<ScheduleMasterData> {
  // Replace with GET /schedules/master.
  ensureSeeded();
  return wait(getMasterSync());
}

export async function getHistory(): Promise<ScheduleChange[]> {
  // Replace with GET /schedules/history.
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

/* ------------------------------------------------------------- draft edits */

function mapSection(
  draft: DraftSchedule,
  section: SectionId,
  update: (entries: ScheduleEntry[]) => ScheduleEntry[],
): DraftSchedule {
  const schedules = draft.schedules.some((item) => item.section === section)
    ? draft.schedules
    : [...draft.schedules, emptySection(section)];
  return {
    ...draft,
    schedules: schedules.map((item) =>
      item.section === section ? { ...item, entries: update(item.entries) } : item,
    ),
  };
}

function findEntry(draft: DraftSchedule, entryId: string) {
  for (const schedule of draft.schedules) {
    const entry = schedule.entries.find((item) => item.id === entryId);
    if (entry) return { entry, section: schedule.section };
  }
  return null;
}

/** Adds or replaces one entry, stamped with the admin ids and the editing staff member. */
export async function saveEntry(
  entry: ScheduleEntry,
  section: SectionId,
  actor: string,
): Promise<DraftSchedule> {
  // Replace with PUT /schedules/draft/entries.
  const draft = getDraftSync();
  const master = getMasterSync();
  const existingSection = draft.schedules.find((item) => item.section === section);
  const isNew = !(existingSection?.entries.some((item) => item.id === entry.id) ?? false);
  const stamped = linkEntryToMaster({ ...entry, updatedAt: nowIso(), updatedBy: actor }, master);
  const next = mapSection(draft, section, (entries) => {
    const index = entries.findIndex((item) => item.id === stamped.id);
    if (index === -1) return [...entries, stamped];
    const copy = [...entries];
    copy[index] = stamped;
    return copy;
  });
  appendChange({
    actor,
    type: isNew ? "added" : "edited",
    section,
    detail: `${stamped.subjectCode} ${isNew ? "added" : "edited"} for ${section}.`,
  });
  return wait(persistDraft(next, "draft"), WRITE_DELAY);
}

export async function deleteEntry(entryId: string, actor: string): Promise<DraftSchedule> {
  // Replace with DELETE /schedules/draft/entries/:id.
  const draft = getDraftSync();
  const found = findEntry(draft, entryId);
  const next: DraftSchedule = {
    ...draft,
    schedules: draft.schedules.map((schedule) => ({
      ...schedule,
      entries: schedule.entries.filter((entry) => entry.id !== entryId),
    })),
  };
  if (found) {
    appendChange({
      actor,
      type: "deleted",
      section: found.section,
      detail: `Removed ${found.entry.subjectCode} from ${found.section}.`,
    });
  }
  return wait(persistDraft(next, "draft"), WRITE_DELAY);
}

/** Grid drag/resize and the keyboard equivalents land here: one entry, new day/time. */
export async function moveEntry(
  entryId: string,
  patch: { startMin: number; endMin: number; days?: DayCode[] },
  actor: string,
): Promise<DraftSchedule> {
  // Replace with PATCH /schedules/draft/entries/:id.
  const draft = getDraftSync();
  const found = findEntry(draft, entryId);
  if (found === null) return wait(draft);

  const next = mapSection(draft, found.section, (entries) =>
    entries.map((entry) =>
      entry.id === entryId
        ? {
            ...entry,
            startMin: patch.startMin,
            endMin: patch.endMin,
            days: patch.days ?? entry.days,
            updatedAt: nowIso(),
            updatedBy: actor,
          }
        : entry,
    ),
  );
  appendChange({
    actor,
    type: "edited",
    section: found.section,
    detail: `Moved ${found.entry.subjectCode} to a new time slot in ${found.section}.`,
  });
  return wait(persistDraft(next, "draft"), WRITE_DELAY);
}

export async function bulkUpdate(
  entryIds: string[],
  patch: EntryPatch,
  actor: string,
  section: SectionId,
): Promise<DraftSchedule> {
  // Replace with PATCH /schedules/draft/bulk.
  const draft = getDraftSync();
  const idSet = new Set(entryIds);
  const next = mapSection(draft, section, (entries) =>
    entries.map((entry) =>
      idSet.has(entry.id) ? { ...entry, ...patch, updatedAt: nowIso(), updatedBy: actor } : entry,
    ),
  );
  appendChange({
    actor,
    type: "edited",
    section,
    detail: `Applied a bulk change to ${entryIds.length} ${
      entryIds.length === 1 ? "class" : "classes"
    } in ${section}.`,
  });
  return wait(persistDraft(next, "draft"), WRITE_DELAY);
}

export async function discardDraft(actor: string): Promise<DraftSchedule> {
  // Replace with DELETE /schedules/draft.
  const fresh = draftFromPublished(getPublishedSync());
  appendChange({
    actor,
    type: "reverted",
    section: fresh.schedules[0]?.section ?? "BSIT-3A",
    detail: `Discarded the draft and returned to version ${fresh.baseVersion}.`,
  });
  return wait(persistDraft(fresh, "draft"), WRITE_DELAY);
}

/** Copying re-slots a whole section, so the entry ids must change to stay unique. */
export async function duplicateSection(
  sourceSection: SectionId,
  options: DuplicateOptions,
  actor: string,
): Promise<DraftSchedule> {
  // Replace with POST /schedules/draft/duplicate.
  const draft = getDraftSync();
  const source = draft.schedules.find((item) => item.section === sourceSection);
  if (source === undefined) return wait(draft);

  let next = draft;
  for (const target of options.targetSections) {
    if (target === sourceSection) continue;
    const copies: ScheduleEntry[] = source.entries.map((entry) => ({
      ...entry,
      id: `${target}-${entry.subjectCode.replace(/\s+/g, "-").toLowerCase()}`,
      instructor: options.keepInstructors ? entry.instructor : "",
      instructorId: options.keepInstructors ? entry.instructorId : undefined,
      roomSetA: options.keepRooms ? entry.roomSetA : "ONLINE",
      roomSetB: options.keepRooms ? entry.roomSetB : "ONLINE",
      roomAId: options.keepRooms ? entry.roomAId : undefined,
      roomBId: options.keepRooms ? entry.roomBId : undefined,
      updatedAt: nowIso(),
      updatedBy: actor,
    }));
    const merge = options.mode === "merge";
    next = {
      ...next,
      schedules: (
        next.schedules.some((item) => item.section === target)
          ? next.schedules
          : [...next.schedules, emptySection(target)]
      ).map((schedule) =>
        schedule.section === target
          ? {
              ...schedule,
              entries: merge
                ? [
                    ...schedule.entries.filter(
                      (entry) => !copies.some((copy) => copy.subjectCode === entry.subjectCode),
                    ),
                    ...copies,
                  ]
                : copies,
            }
          : schedule,
      ),
    };
    appendChange({
      actor,
      type: "duplicated",
      section: target,
      detail: `${options.mode === "replace" ? "Replaced" : "Merged"} ${target} from ${sourceSection} (${copies.length} classes).`,
    });
  }
  return wait(persistDraft(next, "draft"), WRITE_DELAY);
}

/**
 * CSV import. Rows that parse become entries; a row naming an unknown subject,
 * teacher or room is a warning (the plain string is still kept), a row that
 * cannot be read at all is an error and is skipped by the caller.
 */
export async function importRows(
  rows: ImportRowInput[],
  actor: string,
): Promise<{ draft: DraftSchedule; results: ImportRowResult[] }> {
  // Replace with POST /schedules/draft/import.
  const master = getMasterSync();
  const results: ImportRowResult[] = [];
  const bySection = new Map<SectionId, ScheduleEntry[]>();

  rows.forEach((row, index) => {
    const line = index + 2; // the header is line 1
    const section = row.section.trim().toUpperCase() as SectionId;
    const isKnownSection = (SECTION_IDS as string[]).includes(section);
    const days = parseCsvDays(row.days);
    const start = parseCsvTime(row.start);
    const end = parseCsvTime(row.end);
    const subject = master.subjects.find(
      (item) => item.code.trim().toUpperCase() === row.subjectCode.trim().toUpperCase(),
    );
    const instructor = master.instructors.find(
      (item) => item.displayName.toLowerCase() === row.instructor.trim().toLowerCase(),
    );
    const roomA = master.rooms.find(
      (item) => item.name.toUpperCase() === row.roomA.trim().toUpperCase(),
    );
    const status = row.status.trim().toLowerCase().replace(/\s+/g, "_");

    const errors: string[] = [];
    const warnings: string[] = [];
    if (!isKnownSection) errors.push(`Unknown section "${row.section}".`);
    if (days.length === 0) errors.push('Days must look like "MWF", "TTh" or "SAT".');
    if (start === null) errors.push(`Start time "${row.start}" is not readable.`);
    if (end === null) errors.push(`End time "${row.end}" is not readable.`);
    if (start !== null && end !== null && end <= start) {
      errors.push("End time must be after the start time.");
    }
    if (subject === undefined && row.subjectCode.trim() === "") {
      errors.push("Subject code is required.");
    }

    if (subject === undefined && row.subjectCode.trim() !== "") {
      warnings.push(`Subject code "${row.subjectCode}" is not in the subject list.`);
    }
    if (instructor === undefined && row.instructor.trim() !== "") {
      warnings.push(`"${row.instructor}" is not in the instructor list.`);
    }
    if (roomA === undefined && row.roomA.trim() !== "") {
      warnings.push(`Room "${row.roomA}" is not in the room list.`);
    }
    if (status !== "active" && status !== "not_active") {
      warnings.push(`Status "${row.status}" read as Active.`);
    }

    if (errors.length > 0) {
      results.push({ line, verdict: "error", messages: errors });
      return;
    }

    const entry = linkEntryToMaster(
      {
        id: `${section}-${(subject?.code ?? row.subjectCode).replace(/\s+/g, "-").toLowerCase()}`,
        subjectCode: subject?.code ?? row.subjectCode.trim(),
        title: subject?.title ?? row.subjectCode.trim(),
        days,
        startMin: start ?? 0,
        endMin: end ?? 0,
        roomSetA: row.roomA.trim() || "ONLINE",
        roomSetB: row.roomB.trim() || "ONLINE",
        units: subject?.units ?? 3,
        instructor: instructor?.displayName ?? row.instructor.trim(),
        status: status === "not_active" ? "not_active" : "active",
        colorKey: subject?.colorKey ?? "blue",
        updatedAt: nowIso(),
        updatedBy: actor,
      },
      master,
    );
    bySection.set(section, [...(bySection.get(section) ?? []), entry]);
    results.push({
      line,
      verdict: warnings.length > 0 ? "warning" : "valid",
      messages: warnings,
      entry,
      section,
    });
  });

  let draft = getDraftSync();
  for (const [section, entries] of bySection) {
    draft = mapSection(draft, section, (current) => {
      const copy = [...current];
      for (const entry of entries) {
        const index = copy.findIndex((item) => item.id === entry.id);
        if (index === -1) copy.push(entry);
        else copy[index] = entry;
      }
      return copy;
    });
    appendChange({
      actor,
      type: "imported",
      section,
      detail: `Imported ${entries.length} ${entries.length === 1 ? "row" : "rows"} into ${section}.`,
    });
  }

  return wait({ draft: persistDraft(draft, "draft"), results }, WRITE_DELAY);
}

/* ----------------------------------------------------------------- publish */

/**
 * stamped on every save, so they differ on every touched row without telling
 * the registrar anything. The publish diff only reports what students see.
 */
const BOOKKEEPING_FIELDS: (keyof ScheduleEntry)[] = ["updatedAt", "updatedBy"];

/**
 * Diff used by PublishModal and by the changed-sections notification list.
 * Entries are matched by id, so an edited class shows its before and after
 * values instead of appearing as one removal plus one addition.
 */
export function diffPublishedAgainstDraft(
  published: PublishedSchedule,
  draft: DraftSchedule,
): SectionPublishDiff[] {
  const diffs: SectionPublishDiff[] = [];
  for (const schedule of draft.schedules) {
    const before = published.schedules.find((item) => item.section === schedule.section);
    const beforeById = new Map((before?.entries ?? []).map((entry) => [entry.id, entry]));
    const afterIds = new Set(schedule.entries.map((entry) => entry.id));
    const added = schedule.entries.filter((entry) => !beforeById.has(entry.id));
    const removed = (before?.entries ?? []).filter((entry) => !afterIds.has(entry.id));
    const edited: SectionPublishDiff["edited"] = [];
    for (const entry of schedule.entries) {
      const previous = beforeById.get(entry.id);
      if (previous === undefined) continue;
      const changedFields = (Object.keys(entry) as (keyof ScheduleEntry)[]).filter(
        (field) =>
          !BOOKKEEPING_FIELDS.includes(field) &&
          JSON.stringify(previous[field]) !== JSON.stringify(entry[field]),
      );
      if (changedFields.length > 0) edited.push({ before: previous, after: entry, changedFields });
    }

    if (added.length === 0 && edited.length === 0 && removed.length === 0) continue;
    diffs.push({ section: schedule.section, added, edited, removed });
  }
  return diffs;
}

function notifyStudents(diffs: SectionPublishDiff[], message: string | undefined, version: number): void {
  // Replace with a server-side fan-out to the roster of each changed section.
  const changedSections = new Set(diffs.map((diff) => diff.section));
  const stored = readJson<{ studentId?: string; section?: string } | null>(STUDENT_PROFILE_KEY, null);
  const studentId = stored?.studentId || DEMO_STUDENT_ID;
  const section = (stored?.section || DEMO_STUDENT_SECTION) as SectionId;
  if (!changedSections.has(section)) return;

  const key = studentNotificationsKey(studentId);
  const feed = readJson<AppNotification[]>(key, []);
  const note: AppNotification = {
    id: newId(),
    message: message ?? `Your ${section} schedule was updated (version ${version}).`,
    type: "success",
    createdAt: nowIso(),
    read: false,
  };
  writeJson(key, [note, ...feed].slice(0, MAX_FEED));
}

/**
 * draft → published. Returns the new published record; the previous one is
 * archived inside it so "Restore this version" works from the same key.
 */
export async function publish(options: PublishOptions, actor: string): Promise<PublishedSchedule> {
  // Replace with POST /schedules/publish.
  const published = getPublishedSync();
  const draft = getDraftSync();
  const version = published.version + 1;
  const archived: PublishedVersion = {
    version: published.version,
    publishedAt: published.publishedAt,
    publishedBy: published.publishedBy,
    schedules: published.schedules,
  };
  const next: PublishedSchedule = {
    version,
    publishedAt: nowIso(),
    publishedBy: actor,
    schedules: draft.schedules.map((schedule) => ({
      ...schedule,
      entries: schedule.entries.map((entry) => ({ ...entry })),
    })),
    archive: [archived, ...(published.archive ?? [])].slice(0, MAX_PUBLISHED_ARCHIVE),
  };

  writeJson(SCHEDULE_PUBLISHED_KEY, next);
  // The draft now matches what students see, so its baseline moves up with it.
  writeJson(SCHEDULE_DRAFT_KEY, { ...draft, baseVersion: version, updatedAt: nowIso() });

  const diffs = diffPublishedAgainstDraft(published, draft);
  appendChange({
    actor,
    type: "published",
    section: diffs[0]?.section ?? draft.schedules[0]?.section ?? "BSIT-3A",
    detail: `Published version ${version}${
      options.overrideConflicts ? " with unresolved conflicts" : ""
    } for ${diffs.length === 1 ? "1 section" : `${diffs.length || draft.schedules.length} sections`}.`,
  });
  if (options.notifyStudents) notifyStudents(diffs, options.message, version);

  // storage fires for other tabs only; the channel is what wakes this one.
  announceScheduleChange("published");
  return wait(next, WRITE_DELAY);
}

export async function restoreVersion(version: number, actor: string): Promise<PublishedSchedule> {
  // Replace with POST /schedules/publish/:version/restore.
  const published = getPublishedSync();
  const target =
    version === published.version
      ? published
      : (published.archive ?? []).find((item) => item.version === version);
  if (target === undefined) return wait(published);

  const next: PublishedSchedule = {
    version: published.version + 1,
    publishedAt: nowIso(),
    publishedBy: actor,
    schedules: target.schedules.map((schedule) => ({
      ...schedule,
      entries: schedule.entries.map((entry) => ({ ...entry })),
    })),
    archive: [
      {
        version: published.version,
        publishedAt: published.publishedAt,
        publishedBy: published.publishedBy,
        schedules: published.schedules,
      },
      ...(published.archive ?? []).filter((item) => item.version !== version),
    ].slice(0, MAX_PUBLISHED_ARCHIVE),
  };
  writeJson(SCHEDULE_PUBLISHED_KEY, next);
  appendChange({
    actor,
    type: "reverted",
    section: next.schedules[0]?.section ?? "BSIT-3A",
    detail: `Restored version ${version}; published as version ${next.version}.`,
  });
  announceScheduleChange("published");
  return wait(next, WRITE_DELAY);
}

/* -------------------------------------------------------------- master data */

/**
 * A master rename propagates by id, not by string search: every draft entry
 * that carries this record's id is re-stamped from the new master row, so the
 * subject code, title, units, colour, teacher name and room name all follow
 * the record. The published copy is left alone until the next publish, because
 * students must not see a half-applied rename.
 */
function restampDraft(master: ScheduleMasterData, actor: string): DraftSchedule {
  const draft = getDraftSync();
  const next: DraftSchedule = {
    ...draft,
    schedules: draft.schedules.map((schedule) => ({
      ...schedule,
      entries: schedule.entries.map((entry) => {
        const linked = linkEntryToMaster(entry, master);
        const subject = master.subjects.find((item) => item.id === entry.subjectId);
        const teacher = master.instructors.find((item) => item.id === entry.instructorId);
        const roomA = master.rooms.find((item) => item.id === entry.roomAId);
        const roomB = master.rooms.find((item) => item.id === entry.roomBId);
        return {
          ...linked,
          subjectCode: subject?.code ?? entry.subjectCode,
          title: subject?.title ?? entry.title,
          units: subject?.units ?? entry.units,
          colorKey: subject?.colorKey ?? entry.colorKey,
          instructor: teacher?.displayName ?? entry.instructor,
          roomSetA: roomA?.name ?? entry.roomSetA,
          roomSetB: roomB?.name ?? entry.roomSetB,
          updatedAt: nowIso(),
          updatedBy: actor,
        };
      }),
    })),
  };
  return persistDraft(next, "master");
}

export async function saveSubject(subject: Subject, actor: string): Promise<ScheduleMasterData> {
  // Replace with PUT /schedules/master/subjects.
  const master = getMasterSync();
  const clash = master.subjects.some(
    (item) => item.id !== subject.id && item.code.trim().toUpperCase() === subject.code.trim().toUpperCase(),
  );
  if (clash) throw new Error("Subject code already exists.");
  const next: ScheduleMasterData = {
    ...master,
    subjects: master.subjects.some((item) => item.id === subject.id)
      ? master.subjects.map((item) => (item.id === subject.id ? subject : item))
      : [...master.subjects, subject],
  };
  writeJson(SCHEDULE_MASTER_KEY, next);
  restampDraft(next, actor);
  appendChange({ actor, type: "edited", section: "BSIT-3A", detail: `Saved subject ${subject.code}.` });
  announceScheduleChange("master");
  return wait(next, WRITE_DELAY);
}

export async function saveInstructor(instructor: Instructor, actor: string): Promise<ScheduleMasterData> {
  // Replace with PUT /schedules/master/instructors.
  const master = getMasterSync();
  const clash = master.instructors.some(
    (item) =>
      item.id !== instructor.id &&
      item.displayName.trim().toLowerCase() === instructor.displayName.trim().toLowerCase(),
  );
  if (clash) throw new Error("Instructor name already exists.");
  const next: ScheduleMasterData = {
    ...master,
    instructors: master.instructors.some((item) => item.id === instructor.id)
      ? master.instructors.map((item) => (item.id === instructor.id ? instructor : item))
      : [...master.instructors, instructor],
  };
  writeJson(SCHEDULE_MASTER_KEY, next);
  restampDraft(next, actor);
  appendChange({
    actor,
    type: "edited",
    section: "BSIT-3A",
    detail: `Saved instructor ${instructor.displayName}.`,
  });
  announceScheduleChange("master");
  return wait(next, WRITE_DELAY);
}

export async function saveRoom(room: Room, actor: string): Promise<ScheduleMasterData> {
  // Replace with PUT /schedules/master/rooms.
  const master = getMasterSync();
  const clash = master.rooms.some(
    (item) => item.id !== room.id && item.name.trim().toUpperCase() === room.name.trim().toUpperCase(),
  );
  if (clash) throw new Error("Room name already exists.");
  const next: ScheduleMasterData = {
    ...master,
    rooms: master.rooms.some((item) => item.id === room.id)
      ? master.rooms.map((item) => (item.id === room.id ? room : item))
      : [...master.rooms, room],
  };
  writeJson(SCHEDULE_MASTER_KEY, next);
  restampDraft(next, actor);
  appendChange({ actor, type: "edited", section: "BSIT-3A", detail: `Saved room ${room.name}.` });
  announceScheduleChange("master");
  return wait(next, WRITE_DELAY);
}

/* ------------------------------------------------------------ undo support */

/**
 * Writes a draft the portal had before an action, which is what the 8-second
 * Undo on a delete, a bulk change or a duplicate needs. Deliberately synchronous
 * and deliberately not a draft mutation: an Undo must land before the caller
 * re-reads, and it must not be logged as if the registrar made the change.
 */
export function restoreDraftSnapshot(
  snapshot: DraftSchedule,
  note: { section: SectionId; detail: string; actor: string },
): DraftSchedule {
  const restored: DraftSchedule = { ...snapshot, updatedAt: nowIso() };
  writeJson(SCHEDULE_DRAFT_KEY, restored);
  appendChange({ actor: note.actor, type: "reverted", section: note.section, detail: note.detail });
  announceScheduleChange("draft");
  return restored;
}

/** The same idea for a publish: put the previous published record back verbatim. */
export function restorePublishedSnapshot(
  snapshot: PublishedSchedule,
  note: { section: SectionId; detail: string; actor: string },
): PublishedSchedule {
  writeJson(SCHEDULE_PUBLISHED_KEY, snapshot);
  writeJson(SCHEDULE_DRAFT_KEY, { ...getDraftSync(), baseVersion: snapshot.version });
  appendChange({ actor: note.actor, type: "reverted", section: note.section, detail: note.detail });
  announceScheduleChange("published");
  return snapshot;
}

/* ------------------------------------------------------------------- demo */
/** How many draft + published entries still reference a master record. */
export function countMasterUsage(kind: "subject" | "instructor" | "room", id: string): number {
  const schedules = [...getDraftSync().schedules, ...getPublishedSync().schedules];
  const seen = new Set<string>();
  for (const schedule of schedules) {
    for (const entry of schedule.entries) {
      const match =
        (kind === "subject" && entry.subjectId === id) ||
        (kind === "instructor" && entry.instructorId === id) ||
        (kind === "room" && (entry.roomAId === id || entry.roomBId === id));
      if (match) seen.add(entry.id);
    }
  }
  return seen.size;
}

export async function resetDemoData(): Promise<ScheduleSnapshot> {
  // Replace with POST /demo/reset.
  [SCHEDULE_PUBLISHED_KEY, SCHEDULE_DRAFT_KEY, SCHEDULE_MASTER_KEY, SCHEDULE_HISTORY_KEY].forEach(
    (key) => {
      try {
        window.localStorage.removeItem(key);
      } catch {
        // Ignore.
      }
    },
  );
  ensureSeeded();
  announceScheduleChange("reset");
  return wait({
    published: getPublishedSync(),
    draft: getDraftSync(),
    master: getMasterSync(),
    history: getHistorySync(),
  });
}

/**
 * Demo helper for the teacher: moves one 3B class into a 3A slot so the
 * conflict panel, the inline warning and the disabled Publish button all have
 * something real to show.
 */
export async function createSampleConflict(actor: string): Promise<DraftSchedule> {
  const draft = getDraftSync();
  const target = draft.schedules.find((schedule) => schedule.section === "BSIT-3B");
  const victim = target?.entries.find((entry) => entry.subjectCode === "HCI 1");
  const blocker = draft.schedules
    .find((schedule) => schedule.section === "BSIT-3A")
    ?.entries.find((entry) => entry.subjectCode === "HCI 1");
  if (target === undefined || victim === undefined || blocker === undefined) return wait(draft);

  const next = mapSection(draft, target.section, (entries) =>
    entries.map((entry) =>
      entry.id === victim.id
        ? {
            ...entry,
            days: blocker.days,
            startMin: blocker.startMin,
            endMin: blocker.endMin,
            roomSetA: blocker.roomSetA,
            roomAId: blocker.roomAId,
            updatedAt: nowIso(),
            updatedBy: actor,
          }
        : entry,
    ),
  );
  appendChange({
    actor,
    type: "edited",
    section: target.section,
    detail: "Demo: moved a 3B class into a 3A slot to create a conflict.",
  });
  return wait(persistDraft(next, "draft"), WRITE_DELAY);
}

/** Exposed so the Publish tooltip can quote the number without re-deriving it. */
export function countConflicts(draft: DraftSchedule): number {
  return detectConflicts(draft.schedules).length;
}
