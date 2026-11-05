/**
 * Domain types for the student-side Class Schedules page.
 *
 * Schedules are read-only for students: the registrar owns the data, and the
 * page only filters, sorts and lays it out.
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
  /** Maps to a palette token in `utils/colors.ts`. */
  colorKey: string;
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
