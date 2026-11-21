import {
  SCHEDULE_DRAFT_KEY,
  SCHEDULE_PUBLISHED_KEY,
  STUDENT_SECTION_REGISTRY_KEY,
  studentNotificationsKey,
} from "@/lib/scheduleStorage";
import { apiClient } from "@/lib/apiClient";
import { STUDENT_ACCOUNTS } from "@/components/features/admin/student-accounts/mockStudentAccounts";
import { SECTION_IDS } from "@/services/scheduleStudent/mockSchedules";
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

function normalizeSection(value?: string | null, course?: string | null): SectionId | null {
  let text = (value ?? "").trim().toUpperCase();
  if (text === "") return null;
  if (course && !text.includes("-")) text = `${course.trim().toUpperCase()}-${text}`;
  text = text
    .replace(/\s+/g, "-")
    .replace(/-(\d)-([A-Z])/g, "-$1$2")
    .replace(/-+/g, "-");
  return SECTION_IDS.find((section) => section.toUpperCase() === text) ?? null;
}

/**
 * Every known student account, with the section used by the student schedules
 * page. The bell reads `cpc:notifications:<studentId>`, so a notification is
 * written only for students whose own section appears in the publish diff.
 */
function studentTargets(): Array<{ id: string; section: SectionId }> {
  const targets = new Map<string, { id: string; section: SectionId }>();
  const add = (id: string | null | undefined, section: SectionId | null) => {
    if (id && section) targets.set(id, { id, section });
  };

  add(DEMO_STUDENT_ID, DEMO_STUDENT_SECTION);
  for (const account of STUDENT_ACCOUNTS) {
    add(account.studentId, normalizeSection(`${account.course}-${account.section}`));
  }

  const registry = readJson<Record<string, string>>(STUDENT_SECTION_REGISTRY_KEY, {});
  for (const [id, section] of Object.entries(registry)) {
    add(id, normalizeSection(section));
  }

  try {
    const raw = window.sessionStorage.getItem("cpc_user");
    if (raw) {
      const user = JSON.parse(raw) as {
        role?: string;
        studentNumber?: string;
        id?: string;
        section?: string;
        course?: string;
      };
      if (user.role === "student") {
        add(user.studentNumber ?? user.id, normalizeSection(user.section, user.course));
      }
    }
  } catch {}

  const stored = readJson<{ studentId?: string; section?: string; course?: string } | null>(
    STUDENT_PROFILE_KEY,
    null,
  );
  add(stored?.studentId, normalizeSection(stored?.section, stored?.course));

  return Array.from(targets.values());
}

export function notifyStudents(
  diffs: SectionPublishDiff[],
  message: string | undefined,
  version: number,
): void {
  const changed = new Map<SectionId, SectionPublishDiff>();
  for (const diff of diffs) changed.set(diff.section, diff);
  if (changed.size === 0) return;

  let notified = 0;
  for (const student of studentTargets()) {
    const diff = changed.get(student.section);
    if (diff === undefined) continue;
    const changes = [
      diff.added.length > 0 ? `${diff.added.length} class${diff.added.length === 1 ? "" : "es"} added` : "",
      diff.edited.length > 0 ? `${diff.edited.length} class${diff.edited.length === 1 ? "" : "es"} updated` : "",
      diff.removed.length > 0 ? `${diff.removed.length} class${diff.removed.length === 1 ? "" : "es"} removed` : "",
    ].filter(Boolean);
    const note: AppNotification = {
      id: newId(),
      message:
        message ??
        `Your ${student.section} class schedule changed (v${version}): ${changes.join(", ")}.`,
      type: "success",
      createdAt: nowIso(),
      read: false,
      href: `/academics/class-schedules?section=${encodeURIComponent(student.section)}`,
    };
    const key = studentNotificationsKey(student.id);
    const feed = readJson<AppNotification[]>(key, []);
    writeJson(key, [note, ...feed].slice(0, MAX_FEED));
    notified += 1;
  }

  if (notified > 0) {
    window.dispatchEvent(new CustomEvent("cpc:student:notification"));
  }
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
  void apiClient.post("/schedules/v1/publish", next).catch(() => {});
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
  void apiClient.post("/schedules/v1/publish", next).catch(() => {});
  return wait(next, WRITE_DELAY);
}

