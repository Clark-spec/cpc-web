import {
  SCHEDULE_DRAFT_KEY,
  SCHEDULE_HISTORY_KEY,
  SCHEDULE_MASTER_KEY,
  SCHEDULE_PUBLISHED_KEY,
} from "@/lib/scheduleStorage";
import type { SectionId } from "@/types/schedule";
import type { DraftSchedule, PublishedSchedule } from "@/types/scheduleAdmin";
import { detectConflicts } from "@/components/features/admin/schedules/conflicts";
import { WRITE_DELAY, announceScheduleChange, nowIso, wait, writeJson } from "./primitives";
import {
  type ScheduleSnapshot,
  appendChange,
  ensureSeeded,
  getDraftSync,
  getHistorySync,
  getMasterSync,
  getPublishedSync,
  persistDraft,
} from "./storage";
import { mapSection } from "./draft";

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

export async function resetDemoData(): Promise<ScheduleSnapshot> {
  [
    SCHEDULE_PUBLISHED_KEY,
    SCHEDULE_DRAFT_KEY,
    SCHEDULE_MASTER_KEY,
    SCHEDULE_HISTORY_KEY,
  ].forEach((key) => {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Ignore.
    }
  });
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
