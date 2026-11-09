/**
 * Form values -> the record the draft stores.
 *
 * This is the one mapping between the entry form and `ScheduleEntry`, and it
 * lives in `utils/` rather than inside the context so the form's live conflict
 * check can build the same candidate the Save button will write. If the two
 * ever disagreed, the warning would promise a clean class and the draft would
 * land a clash.
 */
import type { ScheduleEntry, SectionId } from "@/types/schedule";
import type { ScheduleMasterData } from "@/types/scheduleAdmin";
import type { EntryFormValues } from "@/components/features/admin/schedules/schema";

/**
 * Class ids read `SECTION-SUBJECT-CODE`, which makes them readable in a bug
 * report and stable enough to survive a rename. A second class with the same
 * code in the same section gets a numeric suffix instead of clobbering the
 * first one.
 */
export function entryIdFor(section: SectionId, code: string, existing: ScheduleEntry[]): string {
  const base = `${section}-${code.replace(/\s+/g, "-").toLowerCase()}`;
  if (!existing.some((entry) => entry.id === base)) return base;
  let suffix = 2;
  while (existing.some((entry) => entry.id === `${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}

/**
 * Form values -> a student-side `ScheduleEntry`. Every string is copied from a
 * master record rather than typed by hand, which is what lets a later rename
 * propagate by id and keeps the student page's rendering truthful.
 */
export function entryFromFormValues(
  values: EntryFormValues,
  master: ScheduleMasterData,
  section: SectionId,
  existing: ScheduleEntry[],
  replaceId?: string,
): ScheduleEntry {
  const subject = master.subjects.find((item) => item.id === values.subjectId);
  const teacher = master.instructors.find((item) => item.id === values.instructorId);
  const roomA = master.rooms.find((item) => item.id === values.roomAId);
  const roomB = master.rooms.find((item) => item.id === values.roomBId);
  const previous = replaceId === undefined ? undefined : existing.find((item) => item.id === replaceId);
  const code = subject?.code ?? previous?.subjectCode ?? "NEW CLASS";
  return {
    id: previous?.id ?? entryIdFor(section, code, existing),
    subjectCode: code,
    title: subject?.title ?? previous?.title ?? code,
    days: values.days,
    startMin: values.startMin,
    endMin: values.endMin,
    roomSetA: roomA?.name ?? previous?.roomSetA ?? "ONLINE",
    roomSetB: roomB?.name ?? previous?.roomSetB ?? "ONLINE",
    units: subject?.units ?? previous?.units ?? 3,
    instructor: teacher?.displayName ?? "",
    status: values.status,
    colorKey: subject?.colorKey ?? previous?.colorKey ?? "blue",
    subjectId: subject?.id,
    instructorId: teacher?.id,
    roomAId: roomA?.id,
    roomBId: roomB?.id,
    note: values.note ?? "",
  };
}

/** The reverse: an existing row back into the form's own vocabulary. */
function roomIdFor(rooms: { id: string; name: string }[], name: string, idHint?: string): string {
  const byId = rooms.find((room) => room.id === idHint);
  if (byId !== undefined) return byId.id;
  const needle = name.trim().toUpperCase();
  return rooms.find((room) => room.name.toUpperCase() === needle)?.id ?? "";
}

/**
 * The reverse direction: a saved row back into the form's own vocabulary. The
 * id hint wins and the printed name is the fallback, because a row written
 * before master data existed carries only the name.
 */
export function formValuesFromEntry(
  entry: ScheduleEntry,
  section: SectionId,
  master: ScheduleMasterData,
): EntryFormValues {
  const subject = master.subjects.find(
    (item) => item.id === entry.subjectId || item.code === entry.subjectCode,
  );
  const teacher = master.instructors.find(
    (item) => item.id === entry.instructorId || item.displayName === entry.instructor,
  );
  return {
    section,
    subjectId: subject?.id ?? entry.subjectId ?? "",
    days: entry.days,
    startMin: entry.startMin,
    endMin: entry.endMin,
    roomAId: roomIdFor(master.rooms, entry.roomSetA, entry.roomAId),
    roomBId: roomIdFor(master.rooms, entry.roomSetB, entry.roomBId),
    instructorId: teacher?.id ?? entry.instructorId ?? "",
    status: entry.status,
    note: entry.note ?? "",
  };
}
