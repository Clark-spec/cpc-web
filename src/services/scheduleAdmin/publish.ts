import {
  SCHEDULE_DRAFT_KEY,
  SCHEDULE_PUBLISHED_KEY,
  studentNotificationsKey,
} from "@/lib/scheduleStorage";
import type { AppNotification } from "@/types/clearance";
import type { SectionId, ScheduleEntry } from "@/types/schedule";
import type {
  DraftSchedule,
  PublishOptions,
  PublishedSchedule,
  PublishedVersion,
  SectionPublishDiff,
} from "@/types/scheduleAdmin";
import {
  DEMO_STUDENT_ID,
  DEMO_STUDENT_SECTION,
  MAX_FEED,
  MAX_PUBLISHED_ARCHIVE,
  STUDENT_PROFILE_KEY,
  WRITE_DELAY,
  announceScheduleChange,
  newId,
  nowIso,
  readJson,
  wait,
  writeJson,
} from "./primitives";
import { appendChange, getDraftSync, getPublishedSync } from "./storage";

/**
 * stamped on every save, so they differ on every touched row without telling
 * the registrar anything. The publish diff only reports what students see.
 */
export const BOOKKEEPING_FIELDS: (keyof ScheduleEntry)[] = ["updatedAt", "updatedBy"];

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

export function notifyStudents(
  diffs: SectionPublishDiff[],
  message: string | undefined,
  version: number,
): void {
  const changedSections = new Set(diffs.map((diff) => diff.section));
  const stored = readJson<{ studentId?: string; section?: string } | null>(
    STUDENT_PROFILE_KEY,
    null,
  );
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
export async function publish(
  options: PublishOptions,
  actor: string,
): Promise<PublishedSchedule> {
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

  announceScheduleChange("published");
  return wait(next, WRITE_DELAY);
}

export async function restoreVersion(version: number, actor: string): Promise<PublishedSchedule> {
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

