import { SCHEDULE_MASTER_KEY } from "@/lib/scheduleStorage";
import { linkEntryToMaster } from "@/services/scheduleStudent/mockAdmin";
import type {
  DraftSchedule,
  Instructor,
  Room,
  ScheduleMasterData,
  Subject,
} from "@/types/scheduleAdmin";
import { WRITE_DELAY, announceScheduleChange, nowIso, wait, writeJson } from "./primitives";
import {
  appendChange,
  getDraftSync,
  getMasterSync,
  getPublishedSync,
  persistDraft,
} from "./storage";

/**
 * A master rename propagates by id, not by string search: every draft entry
 * that carries this record's id is re-stamped from the new master row, so the
 * subject code, title, units, colour, teacher name and room name all follow
 * the record. The published copy is left alone until the next publish, because
 * students must not see a half-applied rename.
 */
export function restampDraft(master: ScheduleMasterData, actor: string): DraftSchedule {
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
  const master = getMasterSync();
  const clash = master.subjects.some(
    (item) =>
      item.id !== subject.id &&
      item.code.trim().toUpperCase() === subject.code.trim().toUpperCase(),
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
  appendChange({
    actor,
    type: "edited",
    section: "BSIT-3A",
    detail: `Saved subject ${subject.code}.`,
  });
  announceScheduleChange("master");
  return wait(next, WRITE_DELAY);
}

export async function saveInstructor(
  instructor: Instructor,
  actor: string,
): Promise<ScheduleMasterData> {
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
  const master = getMasterSync();
  const clash = master.rooms.some(
    (item) =>
      item.id !== room.id &&
      item.name.trim().toUpperCase() === room.name.trim().toUpperCase(),
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
  appendChange({
    actor,
    type: "edited",
    section: "BSIT-3A",
    detail: `Saved room ${room.name}.`,
  });
  announceScheduleChange("master");
  return wait(next, WRITE_DELAY);
}

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

