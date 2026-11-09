/**
 * CONFLICT ENGINE — pure functions, no React, no storage.
 *
 * Keeping this file free of state is what makes the rules testable in
 * isolation: `detectConflicts(schedules)` takes the four sections and returns
 * the clashes, so the same function backs the sidebar panel, the live warning
 * inside the entry form, the Publish button's disabled state and the import
 * preview.
 *
 * THE RULES
 * 1. Two entries collide on a day only when their minute ranges genuinely
 *    overlap: `aStart < bEnd && bStart < aEnd`. Using `<` (not `<=`) is what
 *    makes back-to-back classes legal — 12:00-1:00 PM followed by 1:00-2:00 PM
 *    shares the minute 13:00 as one class's end and the next's start, and the
 *    test returns false. `false` is the answer we want; `<=` would flag every
 *    normal timetable.
 * 2. Section clash   — two entries of the SAME section on a shared day.
 * 3. Instructor clash— the same instructor across ANY section.
 * 4. Room clash      — the same room across ANY section, compared Set A against
 *                      Set A and Set B against Set B (the two columns are
 *                      alternative rooms for one class, not two bookings), and
 *                      ONLINE never clashes because nobody occupies a room
 *                      that does not exist.
 * 5. `not_active` entries are excluded: a class that is switched off cannot
 *    tie up a teacher or a room.
 */
import type { DayCode, ScheduleEntry, SectionId, SectionSchedule } from "@/types/schedule";
import type { Conflict, ConflictKind } from "@/types/scheduleAdmin";
import { DAY_CODES, DAY_END_MIN, DAY_START_MIN, formatTimeRange } from "@/lib/scheduleTime";

/** The only room name exempt from the room rule. */
export const ONLINE_ROOM = "ONLINE";

/**
 * The editor's resolution: every free-slot search and every drag lands on a
 * half-hour mark, so a class can never be dropped at 10:07.
 */
export const STEP_MIN = 30;

/** Snaps a raw minute value to the nearest half hour inside the day. */
export function snapToStep(minutes: number): number {
  const snapped = Math.round(minutes / STEP_MIN) * STEP_MIN;
  return Math.min(Math.max(snapped, DAY_START_MIN), DAY_END_MIN);
}

/** Rule 1: the whole overlap test lives here so every caller agrees on `<`. */
export function rangesOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/** Entries that can clash at all: switched-off classes are out (rule 5). */
function schedulable(entries: ScheduleEntry[]): ScheduleEntry[] {
  return entries.filter((entry) => entry.status === "active");
}

function firstSharedDay(a: ScheduleEntry, b: ScheduleEntry): DayCode | null {
  for (const day of DAY_CODES) {
    if (a.days.includes(day) && b.days.includes(day)) return day;
  }
  return null;
}

function label(entry: ScheduleEntry, section: SectionId): string {
  return `${entry.subjectCode} (${section})`;
}

function conflictId(
  kind: ConflictKind,
  day: DayCode,
  a: ScheduleEntry,
  b: ScheduleEntry,
  discriminator = "",
): string {
  return `${kind}-${day}${discriminator === "" ? "" : `-${discriminator}`}-${a.id}-${b.id}`;
}

/** Stable key for the instructor rule: id first, display name as the fallback. */
function instructorKey(entry: ScheduleEntry): string | null {
  if (entry.instructorId) return `id:${entry.instructorId}`;
  if (entry.instructor.trim()) return `name:${entry.instructor.trim().toLowerCase()}`;
  return null;
}

type PairSource = {
  entry: ScheduleEntry;
  section: SectionSchedule["section"];
};

function buildConflict(
  kind: ConflictKind,
  day: DayCode,
  first: PairSource,
  second: PairSource,
  /** Only used by the room rule, and only for the set that actually clashed. */
  roomName = "",
): Conflict {
  // The message always quotes the overlap window both classes share, so the
  // panel and the inline warning never disagree about "when".
  const startMin = Math.max(first.entry.startMin, second.entry.startMin);
  const endMin = Math.min(first.entry.endMin, second.entry.endMin);
  const time = formatTimeRange(startMin, endMin);

  const message =
    kind === "section"
      ? `Section ${first.section} has ${label(first.entry, first.section)} and ${label(
          second.entry,
          second.section,
        )} at the same time on ${day} ${time}`
      : kind === "instructor"
        ? `Instructor ${first.entry.instructor} is booked by ${label(
            first.entry,
            first.section,
          )} and ${label(second.entry, second.section)} on ${day} ${time}`
        : `Room ${roomName} is used by ${label(first.entry, first.section)} and ${label(
            second.entry,
            second.section,
          )} on ${day} ${time}`;

  return {
    id: conflictId(kind, day, first.entry, second.entry, kind === "room" ? roomName : ""),
    kind,
    day,
    startMin,
    endMin,
    entryIds: [first.entry.id, second.entry.id],
    message,
  };
}

/**
 * The single pass every consumer uses.
 *
 * Complexity is fine at this size (4 sections x 9-ish entries), so the loops
 * stay explicit — a registrar reading this file should be able to point at the
 * three rules above and match each one to a block below.
 */
export function detectConflicts(schedules: SectionSchedule[]): Conflict[] {
  const conflicts: Conflict[] = [];
  const sources: PairSource[] = schedules.flatMap((schedule) =>
    schedulable(schedule.entries).map((entry) => ({ entry, section: schedule.section })),
  );

  for (let i = 0; i < sources.length; i += 1) {
    for (let j = i + 1; j < sources.length; j += 1) {
      const first = sources[i];
      const second = sources[j];
      const day = firstSharedDay(first.entry, second.entry);
      if (day === null) continue;
      if (!rangesOverlap(first.entry.startMin, first.entry.endMin, second.entry.startMin, second.entry.endMin)) {
        continue;
      }

      // Rule 2 — same section.
      if (first.section === second.section) {
        conflicts.push(buildConflict("section", day, first, second));
        continue;
      }

      // Rule 3 — same teacher, any section.
      const teacherA = instructorKey(first.entry);
      if (teacherA !== null && teacherA === instructorKey(second.entry)) {
        conflicts.push(buildConflict("instructor", day, first, second));
      }

      // Rule 4 — same room, per set, never ONLINE. The room name is part of the
      // conflict identity, so a pair that clashes in two different rooms gets
      // one row per room, while a double-booked room (LAB 1 in both columns)
      // is the same single clash rather than the same row twice.
      const setA = first.entry.roomSetA.trim().toUpperCase();
      if (setA && setA !== ONLINE_ROOM && setA === second.entry.roomSetA.trim().toUpperCase()) {
        conflicts.push(buildConflict("room", day, first, second, setA));
      }
      const setB = first.entry.roomSetB.trim().toUpperCase();
      if (setB && setB !== ONLINE_ROOM && setB === second.entry.roomSetB.trim().toUpperCase()) {
        conflicts.push(buildConflict("room", day, first, second, setB));
      }
    }
  }

  return dedupeConflicts(conflicts);
}

/** The same pair can clash on three days at once; the panel wants one row per pair/day. */
function dedupeConflicts(conflicts: Conflict[]): Conflict[] {
  const seen = new Map<string, Conflict>();
  for (const conflict of conflicts) {
    if (!seen.has(conflict.id)) seen.set(conflict.id, conflict);
  }
  return [...seen.values()].sort(
    (a, b) =>
      a.kind.localeCompare(b.kind) ||
      DAY_CODES.indexOf(a.day) - DAY_CODES.indexOf(b.day) ||
      a.startMin - b.startMin,
  );
}

/** Conflicts that involve one specific entry, for the inline form warning. */
export function conflictsForEntry(conflicts: Conflict[], entryId: string): Conflict[] {
  return conflicts.filter((conflict) => conflict.entryIds.includes(entryId));
}

export function conflictCountBySection(
  conflicts: Conflict[],
  schedules: SectionSchedule[],
): Record<string, number> {
  const sectionOfEntry = new Map<string, string>();
  for (const schedule of schedules) {
    for (const entry of schedule.entries) sectionOfEntry.set(entry.id, schedule.section);
  }
  const counts: Record<string, number> = {};
  for (const conflict of conflicts) {
    for (const entryId of conflict.entryIds) {
      const section = sectionOfEntry.get(entryId);
      if (section) counts[section] = (counts[section] ?? 0) + 1;
    }
  }
  return counts;
}

/* ------------------------------------------------------------- free slots */

export type SlotRequest = {
  section: SectionId;
  days: DayCode[];
  durationMin: number;
  instructorId?: string;
  roomAId?: string;
  roomBId?: string;
  /** The entry being edited, so its own current booking is not treated as a clash. */
  excludeEntryId?: string;
};

function roomNameFor(master: { id: string; name: string }[] | undefined, id?: string): string {
  if (!id) return "";
  return master?.find((room) => room.id === id)?.name ?? "";
}

/**
 * The first `limit` windows in which the section, the teacher and BOTH room
 * columns are simultaneously free. Scanning is a 30-minute step from 7:00 AM to
 * the last window that still fits the duration, which is exactly the grid's
 * own snapping, so a suggestion is always something the form can accept.
 */
export function findFreeSlots(
  schedules: SectionSchedule[],
  request: SlotRequest,
  rooms?: { id: string; name: string }[],
  limit = 5,
): { day: DayCode; startMin: number; endMin: number }[] {
  const taken = schedules
    .filter((schedule) => schedule.section !== request.section)
    .flatMap((schedule) => schedulable(schedule.entries));
  const ownSection = schedules.find((schedule) => schedule.section === request.section);
  const ownEntries = ownSection ? schedulable(ownSection.entries) : [];
  const roomA = roomNameFor(rooms, request.roomAId).toUpperCase();
  const roomB = roomNameFor(rooms, request.roomBId).toUpperCase();

  const suggestions: { day: DayCode; startMin: number; endMin: number }[] = [];

  for (const day of DAY_CODES) {
    if (suggestions.length >= limit) break;
    if (!request.days.includes(day)) continue;
    for (let start = DAY_START_MIN; start + request.durationMin <= DAY_END_MIN; start += STEP_MIN) {
      if (suggestions.length >= limit) break;
      const end = start + request.durationMin;
      const clashesSection = ownEntries.some((entry) =>
        entry.days.includes(day) &&
        entry.id !== request.excludeEntryId &&
        rangesOverlap(start, end, entry.startMin, entry.endMin),
      );
      const clashesOthers = taken.some(
        (entry) =>
          entry.id !== request.excludeEntryId &&
          entry.days.includes(day) &&
          rangesOverlap(start, end, entry.startMin, entry.endMin) &&
          ((request.instructorId !== undefined && entry.instructorId === request.instructorId) ||
            (roomA !== "" && roomA !== ONLINE_ROOM && entry.roomSetA.toUpperCase() === roomA) ||
            (roomB !== "" && roomB !== ONLINE_ROOM && entry.roomSetB.toUpperCase() === roomB)),
      );
      if (!clashesSection && !clashesOthers) {
        suggestions.push({ day, startMin: start, endMin: end });
      }
    }
  }

  return suggestions;
}

/** A suggestion as the sentence the inline warning shows. */
export function describeSlot(slot: { day: DayCode; startMin: number; endMin: number }): string {
  return `${slot.day} ${formatTimeRange(slot.startMin, slot.endMin)}`;
}

/* ----------------------------------------------------------------- lookups */

export function entriesForInstructor(
  schedules: SectionSchedule[],
  instructorId: string,
): { entry: ScheduleEntry; section: SectionId }[] {
  return schedules.flatMap((schedule) =>
    schedule.entries
      .filter((entry) => entry.instructorId === instructorId)
      .map((entry) => ({ entry, section: schedule.section })),
  );
}

export function entriesForRoom(
  schedules: SectionSchedule[],
  roomName: string,
): { entry: ScheduleEntry; section: SectionId }[] {
  const needle = roomName.trim().toUpperCase();
  return schedules.flatMap((schedule) =>
    schedule.entries
      .filter(
        (entry) =>
          entry.roomSetA.trim().toUpperCase() === needle ||
          entry.roomSetB.trim().toUpperCase() === needle,
      )
      .map((entry) => ({ entry, section: schedule.section })),
  );
}

/** Weekly meeting minutes per instructor, active classes only. */
export function weeklyMinutes(entries: ScheduleEntry[]): number {
  return entries
    .filter((entry) => entry.status === "active")
    .reduce((total, entry) => total + (entry.endMin - entry.startMin) * entry.days.length, 0);
}

export function unitsFor(entries: ScheduleEntry[]): number {
  return entries
    .filter((entry) => entry.status === "active")
    .reduce((total, entry) => total + entry.units, 0);
}
