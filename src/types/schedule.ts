/**
 * Domain types for the Class Schedules pages, shared by both portals.
 *
 * Schedules are read-only for students: the staff portal owns the data, and the
 * student page only filters, sorts and lays it out.
 */

export type SectionId = "BSIT-3A" | "BSIT-3B" | "BSIT-3C" | "BSIT-3D";

export type DayCode = "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT";

/** Which room column the calendar/agenda should display. */
export type RoomSet = "A" | "B";

export type EntryStatus = "active" | "not_active";

export interface ScheduleEntry {
  id: string;
  /** "HCI 1" */
  subjectCode: string;
  /** "Human Computer Interaction 1" */
  title: string;
  /** MWF -> ['MON','WED','FRI'] */
  days: DayCode[];
  /** minutes from midnight (10:00 -> 600) */
  startMin: number;
  /** minutes from midnight (11:00 -> 660) */
  endMin: number;
  /** "LAB 2" */
  roomSetA: string;
  /** "ONLINE" */
  roomSetB: string;
  units: number;
  instructor: string;
  status: EntryStatus;
  /** Maps to a palette token in `utils/scheduleColors.ts`. */
  colorKey: string;
  /**
   * ADMIN-ONLY FIELDS BELOW. They are optional so the student page — which
   * never reads them — keeps compiling and rendering exactly as before, while
   * the staff portal resolves the ids to master data. `subjectId` /
   * `instructorId` / `roomAId` / `roomBId` are the stable keys, so renaming a
   * subject, instructor or room propagates without touching every entry.
   */
  subjectId?: string;
  instructorId?: string;
  roomAId?: string;
  roomBId?: string;
  /** ISO date-time of the last draft edit, shown in the change history. */
  updatedAt?: string;
  /** Staff display name that made that edit. */
  updatedBy?: string;
  /** Registrar note, optional on the entry form. */
  note?: string;
}

export interface SectionSchedule {
  section: SectionId;
  semester: string;
  academicYear: string;
  entries: ScheduleEntry[];
}

/** Two entries that genuinely overlap (back-to-back does not count). */
export interface ConflictPair {
  day: DayCode;
  first: ScheduleEntry;
  second: ScheduleEntry;
}

export type SortKey = "time" | "units" | "instructor";
export type SortDirection = "asc" | "desc";
export type StatusFilter = "all" | "active" | "not_active";
