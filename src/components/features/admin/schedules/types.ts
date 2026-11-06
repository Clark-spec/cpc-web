/**
 * Types for the admin Class Schedules module.
 *
 * The student-side shapes are re-exported rather than re-declared: one
 * `ScheduleEntry` type is what keeps the published payload readable by the
 * student page without a mapping layer. Everything added here is either the
 * registrar's own vocabulary (master data, draft/published, conflicts) or a
 * view concern that only this page has.
 */
export type {
  DayCode,
  EntryStatus,
  RoomSet,
  ScheduleEntry,
  SectionId,
  SectionSchedule,
  SortDirection,
  SortKey,
  StatusFilter,
} from "@/types/schedule";

export type {
  Conflict,
  ConflictKind,
  DraftSchedule,
  DuplicateMode,
  DuplicateOptions,
  EntryPatch,
  ImportRowInput,
  ImportRowResult,
  ImportVerdict,
  Instructor,
  PublishDiffEntry,
  PublishOptions,
  PublishedSchedule,
  PublishedVersion,
  Room,
  RoomType,
  ScheduleChange,
  ScheduleChangeType,
  ScheduleMasterData,
  SectionMeta,
  SectionPublishDiff,
  Subject,
} from "@/types/scheduleAdmin";

export type { SlotRequest } from "./utils/conflicts";
export type { EntryFormValues } from "./schema";
export type { ScheduleSnapshot } from "./services/scheduleAdminService";

import type {
  DayCode,
  EntryStatus,
  SectionId,
} from "@/types/schedule";

/* ------------------------------------------------------------- view state */

/** Table (list/edit) or the weekly grid; stored in the URL as `?view=`. */
export type ScheduleEditorView = "table" | "grid";

/** The grid can ghost one instructor's or one room's usage across sections. */
export type GridOverlayMode = "none" | "instructor" | "room";

/** Which room column the grid and the student preview read. */
export type RoomSetChoice = "A" | "B";

export type SectionTab = SectionId | "all";

export type ScheduleFilters = {
  search: string;
  day: DayCode | "all";
  instructorId: string | "all";
  room: string | "all";
  status: EntryStatus | "all";
  onlyConflicts: boolean;
};

export const EMPTY_FILTERS: ScheduleFilters = {
  search: "",
  day: "all",
  instructorId: "all",
  room: "all",
  status: "all",
  onlyConflicts: false,
};

/** KPI cards apply a filter instead of navigating, so they map onto this. */
export type KpiFilterTarget = "sections" | "entries" | "conflicts" | "rooms";

/* ------------------------------------------------------------ edit drafts */

/** `EntryFormValues` is inferred from the zod schema in `schema.ts`, the one place that owns the form's shape. */

export type SyncStatus = {
  live: boolean;
  lastSyncedAt: string | null;
};

export type UndoableAction = {
  label: string;
  /** Restores the store the way it was before the action. */
  run: () => void | Promise<void>;
};
