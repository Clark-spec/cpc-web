/**
 * Domain types for the ADMIN side of Class Schedules.
 *
 * The student-facing shapes live in `@/types/schedule` and are reused verbatim:
 * one `ScheduleEntry` type means the published payload the staff portal writes
 * is the exact payload the student page reads, with no mapping layer that could
 * drift. Everything here is the registrar's vocabulary on top of it — master
 * data, the draft/published pair, conflicts and the audit trail.
 */
import type {
  DayCode,
  EntryStatus,
  SectionId,
  SectionSchedule,
  ScheduleEntry,
} from "@/types/schedule";

/* -------------------------------------------------------------- master data */

export interface Subject {
  id: string;
  /** "HCI 1" */
  code: string;
  /** "Human Computer Interaction 1" */
  title: string;
  units: number;
  /** Palette token in `utils/scheduleColors.ts`; drives the legend and the grid. */
  colorKey: string;
  /** Deactivated subjects stay referenced by old entries but stop appearing in pickers. */
  active: boolean;
}

export interface Instructor {
  id: string;
  /** "T. Comayas" — the form schedules are written and displayed with. */
  displayName: string;
  fullName: string;
  department: string;
  /** Load ceiling: exceeding it warns, it never blocks. */
  maxUnits: number;
  active: boolean;
}

export type RoomType = "lab" | "lecture" | "online" | "tent";

export interface Room {
  id: string;
  /** "LAB 2" */
  name: string;
  type: RoomType;
  capacity?: number;
  active: boolean;
}

export interface SectionMeta {
  section: SectionId;
  semester: string;
  academicYear: string;
  adviser?: string;
  studentCount: number;
}

export interface ScheduleMasterData {
  subjects: Subject[];
  instructors: Instructor[];
  rooms: Room[];
  sections: SectionMeta[];
}

/* -------------------------------------------------- draft / published pair */

/** What students see. `scheduleService.getSchedule` reads this key only. */
export interface PublishedVersion {
  version: number;
  publishedAt: string;
  publishedBy: string;
  schedules: SectionSchedule[];
}

export interface PublishedSchedule {
  version: number;
  publishedAt: string;
  publishedBy: string;
  schedules: SectionSchedule[];
  /**
   * The versions before this one, newest first, so "Restore this version" has
   * something to restore from without inventing a sixth localStorage key.
   * Bounded by MAX_PUBLISHED_ARCHIVE.
   */
  archive?: PublishedVersion[];
}

/** What the staff portal edits. Never read by the student page. */
export interface DraftSchedule {
  /** The published version this draft started from; drives the "v7 → v8" diff. */
  baseVersion: number;
  updatedAt: string;
  schedules: SectionSchedule[];
}

/* ---------------------------------------------------------------- conflicts */

export type ConflictKind = "section" | "instructor" | "room";

/**
 * One pair of entries that cannot both exist. `entryIds` is always a pair, and
 * the ids let the panel jump to ("Go to entry") or open ("Fix") either side.
 */
export interface Conflict {
  id: string;
  kind: ConflictKind;
  day: DayCode;
  /** Minutes from midnight, for the overlap message and the grid highlight. */
  startMin: number;
  endMin: number;
  entryIds: [string, string];
  /** Full sentence, e.g. "Room LAB 2 is used by HCI 1 (BSIT-3A) and NET 2 (BSIT-3C) on MON 10:00-11:00 AM". */
  message: string;
}

/* ------------------------------------------------------------ audit trail */

export type ScheduleChangeType =
  | "added"
  | "edited"
  | "deleted"
  | "published"
  | "reverted"
  | "duplicated"
  | "imported";

export interface ScheduleChange {
  id: string;
  /** ISO date-time. */
  at: string;
  actor: string;
  type: ScheduleChangeType;
  section: SectionId;
  detail: string;
}

/* ------------------------------------------------------- publish mechanics */

/** One changed entry inside the PublishModal diff. */
export interface PublishDiffEntry {
  before?: ScheduleEntry;
  after?: ScheduleEntry;
  /** Field names that differ, for the "edited" rows. */
  changedFields: (keyof ScheduleEntry)[];
}

export interface SectionPublishDiff {
  section: SectionId;
  added: ScheduleEntry[];
  edited: PublishDiffEntry[];
  removed: ScheduleEntry[];
}

export interface PublishOptions {
  notifyStudents: boolean;
  message?: string;
  /** Publish even though `detectConflicts` still reports clashes. */
  overrideConflicts?: boolean;
}

/* ---------------------------------------------------- duplicate / bulk / csv */

export type DuplicateMode = "replace" | "merge";

export interface DuplicateOptions {
  targetSections: SectionId[];
  mode: DuplicateMode;
  keepInstructors: boolean;
  keepRooms: boolean;
}

export interface ImportRowInput {
  section: string;
  subjectCode: string;
  days: string;
  start: string;
  end: string;
  roomA: string;
  roomB: string;
  instructor: string;
  status: string;
}

export type ImportVerdict = "valid" | "warning" | "error";

export interface ImportRowResult {
  /** 1-based row number in the uploaded file, counting the header as row 1. */
  line: number;
  verdict: ImportVerdict;
  messages: string[];
  entry?: ScheduleEntry;
  section?: SectionId;
}

/** Patch applied to every id selected in a bulk action. */
export type EntryPatch = Partial<
  Pick<ScheduleEntry, "status" | "roomSetA" | "roomSetB" | "instructor" | "instructorId" | "roomAId" | "roomBId">
>;

export type EntryStatusFilter = "all" | EntryStatus;
