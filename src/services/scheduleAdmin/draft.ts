import { SECTION_IDS } from "@/services/scheduleStudent/mockSchedules";
import { linkEntryToMaster } from "@/services/scheduleStudent/mockAdmin";
import type { DayCode, SectionId, ScheduleEntry } from "@/types/schedule";
import type {
  DraftSchedule,
  DuplicateOptions,
  EntryPatch,
  ImportRowInput,
  ImportRowResult,
} from "@/types/scheduleAdmin";
import { parseCsvDays, parseCsvTime } from "@/components/features/admin/schedules/csv";
import { WRITE_DELAY, nowIso, wait } from "./primitives";
import {
  appendChange,
  draftFromPublished,
  emptySection,
  getDraftSync,
  getMasterSync,
  getPublishedSync,
  persistDraft,
} from "./storage";

export function mapSection(
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

export function findEntry(draft: DraftSchedule, entryId: string) {
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

