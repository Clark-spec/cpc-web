/* eslint-disable react-refresh/only-export-components -- provider + hook intentionally share a module */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useSearchParams } from "react-router";
import { useToast } from "@/components/ui/toast";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { isSectionId } from "@/data/mockSchedules";
import { DAY_CODES } from "@/utils/scheduleTime";
import type { AdminRole } from "@/types/admin";
import type { DayCode, SectionId, ScheduleEntry } from "@/types/schedule";
import type {
  Conflict,
  DraftSchedule,
  DuplicateOptions,
  EntryPatch,
  ImportRowInput,
  ImportRowResult,
  Instructor,
  PublishOptions,
  PublishedSchedule,
  Room,
  ScheduleChange,
  ScheduleMasterData,
  SectionPublishDiff,
  Subject,
} from "@/types/scheduleAdmin";
import {
  bulkUpdate as bulkUpdateService,
  countMasterUsage,
  createSampleConflict,
  deleteEntry as deleteEntryService,
  diffPublishedAgainstDraft,
  discardDraft as discardDraftService,
  duplicateSection as duplicateSectionService,
  getScheduleSnapshot,
  importRows as importRowsService,
  moveEntry as moveEntryService,
  publish as publishService,
  readHistoryNow,
  resetDemoData,
  restoreDraftSnapshot,
  restorePublishedSnapshot,
  restoreVersion as restoreVersionService,
  saveEntry as saveEntryService,
  saveInstructor as saveInstructorService,
  saveRoom as saveRoomService,
  saveSubject as saveSubjectService,
  type ScheduleSnapshot,
} from "../services/scheduleAdminService";
import { useConflicts } from "../hooks/useConflicts";
import { useScheduleDraft, useUnsavedGuard } from "../hooks/useScheduleDraft";
import { useStorageSync } from "../hooks/useStorageSync";
import { useUndoAction } from "../hooks/useUndoAction";
import type {
  EntryFormValues,
  GridOverlayMode,
  KpiFilterTarget,
  RoomSetChoice,
  ScheduleEditorView,
  ScheduleFilters,
  SectionTab,
  SyncStatus,
} from "../types";
import { EMPTY_FILTERS } from "../types";

const ScheduleAdminContext = createContext<ScheduleAdminContextValue | null>(null);

/** First paint keeps the skeletons up long enough to feel like a real fetch. */
const MIN_SKELETON_MS = 800;

function pause(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, Math.max(0, ms));
  });
}

const EMPTY_PUBLISHED: PublishedSchedule = {
  version: 0,
  publishedAt: "",
  publishedBy: "",
  schedules: [],
};

const EMPTY_DRAFT: DraftSchedule = { baseVersion: 0, updatedAt: "", schedules: [] };

const EMPTY_MASTER: ScheduleMasterData = {
  subjects: [],
  instructors: [],
  rooms: [],
  sections: [],
};

/** Stable empty list so `history` never invalidates the context memo. */
const EMPTY_HISTORY: ScheduleChange[] = [];

/* ------------------------------------------------------------ role scoping */

/**
 * Who may edit what. Admin and Registrar own every section; a Dean is scoped to
 * their department's sections; an Instructor gets their own teaching load,
 * read-only; every other staff role is read-only. The controls are disabled
 * with a reason rather than hidden, so staff can see the button exists and why
 * it is not theirs to press.
 */
const EDITING_ROLES: AdminRole[] = ["admin", "registrar"];

/**
 * Mock scoping for the dean demo account: the sections of the College of
 * Computer Studies. A real deployment reads the department from the staff
 * profile; only this list changes, not the shape of the rule.
 */
const DEAN_SECTIONS: SectionId[] = ["BSIT-3A", "BSIT-3B"];

function surnameOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  return (parts.length > 1 ? parts[parts.length - 1] : parts[0]).toLowerCase();
}

/** Links a staff login to its master record so "My teaching load" has data. */
function matchInstructor(master: ScheduleMasterData, name: string): Instructor | null {
  const surname = surnameOf(name);
  return (
    master.instructors.find((item) => surnameOf(item.displayName) === surname) ??
    master.instructors.find((item) => surnameOf(item.fullName) === surname) ??
    null
  );
}

/* --------------------------------------------------------------- url state */

const SECTION_PARAM = "section";
const VIEW_PARAM = "view";

function filtersFromParams(params: URLSearchParams): ScheduleFilters {
  const day = params.get("day");
  const status = params.get("status");
  return {
    search: params.get("q") ?? "",
    day: day !== null && (DAY_CODES as string[]).includes(day) ? (day as DayCode) : "all",
    instructorId: params.get("instructor") ?? "all",
    room: params.get("room") ?? "all",
    status: status === "active" || status === "not_active" ? status : "all",
    onlyConflicts: params.get("clash") === "1",
  };
}

/** Filters live in the URL, so a schedule view can be shared or bookmarked. */
function writeFilters(params: URLSearchParams, filters: ScheduleFilters): void {
  const set = (key: string, value: string | null) => {
    if (value === null || value === "" || value === "all") params.delete(key);
    else params.set(key, value);
  };
  set("q", filters.search.trim());
  set("day", filters.day === "all" ? null : filters.day);
  set("instructor", filters.instructorId === "all" ? null : filters.instructorId);
  set("room", filters.room === "all" ? null : filters.room);
  set("status", filters.status === "all" ? null : filters.status);
  set("clash", filters.onlyConflicts ? "1" : null);
}

/* ----------------------------------------------------------- entry factory */

function entryIdFor(section: SectionId, code: string, existing: ScheduleEntry[]): string {
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
function entryFromFormValues(
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

/* ------------------------------------------------------------ exported view */

export type VisibleEntry = {
  entry: ScheduleEntry;
  section: SectionId;
  conflictCount: number;
};

export type GridOverlay = { mode: GridOverlayMode; id: string };

export type ScheduleAdminContextValue = {
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  publishing: boolean;

  published: PublishedSchedule;
  draft: DraftSchedule;
  master: ScheduleMasterData;
  history: ScheduleChange[];

  conflicts: Conflict[];
  conflictCount: number;
  conflictsBySection: Record<string, number>;
  dirtyCount: number;
  hasUnsavedChanges: boolean;
  publishDiff: SectionPublishDiff[];
  changedSections: SectionId[];
  sync: SyncStatus;
  leaveGuard: { warnOnLeave: (event: BeforeUnloadEvent) => void; message: string };

  actor: string;
  role: AdminRole;
  canEdit: boolean;
  canEditSection: (section: SectionId) => boolean;
  editDisabledReason: (section?: SectionId) => string | null;
  sectionsForRole: SectionId[];
  /** The master record the signed-in instructor maps to, for "My teaching load". */
  myInstructor: Instructor | null;

  section: SectionTab;
  setSection: (section: SectionTab) => void;
  view: ScheduleEditorView;
  setView: (view: ScheduleEditorView) => void;
  roomSet: RoomSetChoice;
  setRoomSet: (roomSet: RoomSetChoice) => void;
  overlay: GridOverlay;
  setOverlay: (overlay: GridOverlay) => void;
  filters: ScheduleFilters;
  setFilters: (filters: ScheduleFilters) => void;
  clearFilters: () => void;
  activeFilterCount: number;
  applyKpiFilter: (target: KpiFilterTarget) => void;
  visibleEntries: VisibleEntry[];
  entriesBySection: (section: SectionId) => ScheduleEntry[];
  sectionOfEntry: (entryId: string) => SectionId | null;

  selectedEntryId: string | null;
  selectEntry: (entryId: string | null) => void;

  saveEntryValues: (values: EntryFormValues, replaceId?: string) => Promise<void>;
  deleteEntry: (entry: ScheduleEntry, section: SectionId) => Promise<void>;
  moveEntry: (entryId: string, patch: { startMin: number; endMin: number; days?: DayCode[] }) => Promise<void>;
  toggleStatus: (entry: ScheduleEntry, section: SectionId) => Promise<void>;
  quickEdit: (entry: ScheduleEntry, section: SectionId, patch: EntryPatch, label: string) => Promise<void>;
  bulkUpdate: (ids: string[], patch: EntryPatch, section: SectionId, label: string) => Promise<void>;
  bulkDelete: (ids: string[], section: SectionId) => Promise<void>;
  duplicateSection: (source: SectionId, options: DuplicateOptions) => Promise<void>;
  importRows: (rows: ImportRowInput[]) => Promise<{ results: ImportRowResult[] }>;
  publish: (options: PublishOptions) => Promise<void>;
  discardDraft: () => Promise<void>;
  restoreVersion: (version: number) => Promise<void>;

  saveSubject: (subject: Subject) => Promise<void>;
  saveInstructor: (instructor: Instructor) => Promise<void>;
  saveRoom: (room: Room) => Promise<void>;
  usageOf: (kind: "subject" | "instructor" | "room", id: string) => number;

  runDemoConflict: () => Promise<void>;
  resetDemo: () => Promise<void>;
};

/**
 * State owner for the staff Class Schedules page.
 *
 * It holds exactly the four stored records — published, draft, master, history
 * — and derives everything else (conflicts, the unpublished count, the publish
 * diff, the filtered rows), so a change made on this page, in another tab, or
 * by a student action can only ever produce one consistent picture per render.
 *
 * (1) Draft-vs-published contract: no action here writes PUBLISHED except
 * `publish()` and `restoreVersion()`, which is what keeps half-finished
 * registrar work away from students.
 */
export function ScheduleAdminProvider({ children }: { children: ReactNode }) {
  const { user } = useAdminAuth();
  const { toast } = useToast();
  const [params, setParams] = useSearchParams();

  const [snapshot, setSnapshot] = useState<ScheduleSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [roomSet, setRoomSet] = useState<RoomSetChoice>("A");
  const [overlay, setOverlay] = useState<GridOverlay>({ mode: "none", id: "" });

  const actor = user?.name ?? "Registrar";
  const role: AdminRole = user?.role ?? "admin";

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    const started = Date.now();
    try {
      const next = await getScheduleSnapshot();
      const elapsed = Date.now() - started;
      if (elapsed < MIN_SKELETON_MS) await pause(MIN_SKELETON_MS - elapsed);
      setSnapshot(next);
      setError(null);
    } catch {
      setError("We couldn't load the class schedules. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch: the localStorage-backed service is the external store, so
    // this is the sanctioned "subscribe on mount" case for this provider.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  // Any of the four keys changing — this tab's own writes, the student tab, or
  // a publish in another window — makes the in-memory snapshot stale.
  const sync = useStorageSync(() => {
    void load(true);
  });

  const armUndo = useUndoAction();

  const published = snapshot?.published ?? EMPTY_PUBLISHED;
  const draft = snapshot?.draft ?? EMPTY_DRAFT;
  const master = snapshot?.master ?? EMPTY_MASTER;
  const history = snapshot?.history ?? EMPTY_HISTORY;

  const draftState = useScheduleDraft(draft, published);
  const { conflicts, count: conflictCount, bySection: conflictsBySection } = useConflicts(draft);
  const leaveGuard = useUnsavedGuard(draftState);

  // The service is the writer, the context the reader: keep the latest draft in
  // a ref so an Undo always reverts to the state from before its own action.
  const draftRef = useRef(draft);
  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  const applyDraft = useCallback((next: DraftSchedule) => {
    draftRef.current = next;
    setSnapshot((current) =>
      current === null
        ? { published: EMPTY_PUBLISHED, draft: next, master: EMPTY_MASTER, history: readHistoryNow() }
        : { ...current, draft: next, history: readHistoryNow() },
    );
  }, []);

  const applyPublished = useCallback((next: PublishedSchedule) => {
    setSnapshot((current) =>
      current === null
        ? null
        : { ...current, published: next, history: readHistoryNow() },
    );
  }, []);

  /* ---------------------------------------------------------------- roles */

  const canEditSection = useCallback(
    (section: SectionId) => {
      if (EDITING_ROLES.includes(role)) return true;
      if (role === "dean") return DEAN_SECTIONS.includes(section);
      return false;
    },
    [role],
  );

  const canEdit = EDITING_ROLES.includes(role) || role === "dean";

  const myInstructor = useMemo(
    () => (user === null ? null : matchInstructor(master, user.name)),
    [master, user],
  );

  const editDisabledReason = useCallback(
    (section?: SectionId) => {
      if (EDITING_ROLES.includes(role)) return null;
      if (role === "dean") {
        return section !== undefined && !canEditSection(section)
          ? "Deans edit only their own department's sections."
          : null;
      }
      if (role === "instructor") return "Instructors view their teaching load read-only.";
      return "Only the Registrar and the Administrator can edit class schedules.";
    },
    [canEditSection, role],
  );

  const sectionsForRole = useMemo<SectionId[]>(() => {
    const stored = draft.schedules.map((schedule) => schedule.section);
    if (role === "dean") {
      const scoped = stored.filter((section) => canEditSection(section));
      return scoped.length > 0 ? scoped : DEAN_SECTIONS;
    }
    return stored.length > 0 ? stored : DEAN_SECTIONS;
  }, [canEditSection, draft.schedules, role]);

  /* ------------------------------------------------------------ view state */

  const sectionParam = params.get(SECTION_PARAM);
  const section: SectionTab =
    sectionParam === "all" ? "all" : isSectionId(sectionParam) ? sectionParam : "BSIT-3A";
  const view: ScheduleEditorView = params.get(VIEW_PARAM) === "grid" ? "grid" : "table";
  const filters = useMemo(() => filtersFromParams(params), [params]);

  const patchParams = useCallback(
    (patch: (next: URLSearchParams) => void) => {
      const next = new URLSearchParams(params);
      patch(next);
      setParams(next, { replace: true });
    },
    [params, setParams],
  );

  const setSection = useCallback(
    (value: SectionTab) => {
      patchParams((next) => {
        next.set(SECTION_PARAM, value);
        next.delete("clash");
      });
      setSelectedEntryId(null);
    },
    [patchParams],
  );

  const setView = useCallback(
    (value: ScheduleEditorView) => {
      patchParams((next) => {
        if (value === "grid") next.set(VIEW_PARAM, "grid");
        else next.delete(VIEW_PARAM);
      });
    },
    [patchParams],
  );

  const setFilters = useCallback(
    (value: ScheduleFilters) => {
      patchParams((next) => writeFilters(next, value));
    },
    [patchParams],
  );

  const clearFilters = useCallback(() => setFilters(EMPTY_FILTERS), [setFilters]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.search.trim() !== "") count += 1;
    if (filters.day !== "all") count += 1;
    if (filters.instructorId !== "all") count += 1;
    if (filters.room !== "all") count += 1;
    if (filters.status !== "all") count += 1;
    if (filters.onlyConflicts) count += 1;
    return count;
  }, [filters]);

  /** A KPI card is a filter, not a navigation: clicking it narrows this view. */
  const applyKpiFilter = useCallback(
    (target: KpiFilterTarget) => {
      if (target === "conflicts") {
        setFilters({ ...EMPTY_FILTERS, onlyConflicts: true });
        setSection("all");
        return;
      }
      if (target === "sections") {
        setFilters(EMPTY_FILTERS);
        setSection("all");
        return;
      }
      if (target === "rooms") {
        setFilters(EMPTY_FILTERS);
        setView("grid");
        return;
      }
      setFilters(EMPTY_FILTERS);
    },
    [setFilters, setSection, setView],
  );

  const conflictCountByEntry = useMemo(() => {
    const counts = new Map<string, number>();
    for (const conflict of conflicts) {
      for (const entryId of conflict.entryIds) {
        counts.set(entryId, (counts.get(entryId) ?? 0) + 1);
      }
    }
    return counts;
  }, [conflicts]);

  const visibleEntries = useMemo<VisibleEntry[]>(() => {
    const needle = filters.search.trim().toLowerCase();
    const rows: VisibleEntry[] = [];
    for (const schedule of draft.schedules) {
      if (section !== "all" && schedule.section !== section) continue;
      for (const entry of schedule.entries) {
        // An instructor's tabs are their own teaching load, nothing else.
        if (role === "instructor" && entry.instructorId !== myInstructor?.id) continue;
        if (filters.day !== "all" && !entry.days.includes(filters.day)) continue;
        if (filters.status !== "all" && entry.status !== filters.status) continue;
        if (filters.instructorId !== "all" && entry.instructorId !== filters.instructorId) continue;
        if (filters.room !== "all") {
          const roomName =
            master.rooms.find((room) => room.id === filters.room)?.name ?? filters.room;
          const target = roomName.trim().toUpperCase();
          if (
            entry.roomSetA.trim().toUpperCase() !== target &&
            entry.roomSetB.trim().toUpperCase() !== target
          ) {
            continue;
          }
        }
        if (filters.onlyConflicts && (conflictCountByEntry.get(entry.id) ?? 0) === 0) continue;
        if (
          needle !== "" &&
          !`${entry.subjectCode} ${entry.title} ${entry.instructor} ${entry.roomSetA} ${entry.roomSetB}`
            .toLowerCase()
            .includes(needle)
        ) {
          continue;
        }
        rows.push({
          entry,
          section: schedule.section,
          conflictCount: conflictCountByEntry.get(entry.id) ?? 0,
        });
      }
    }
    return rows;
  }, [conflictCountByEntry, draft.schedules, filters, master.rooms, myInstructor, role, section]);

  const entriesBySection = useCallback(
    (value: SectionId) => draft.schedules.find((schedule) => schedule.section === value)?.entries ?? [],
    [draft.schedules],
  );

  const sectionOfEntry = useCallback(
    (entryId: string) =>
      draft.schedules.find((schedule) => schedule.entries.some((entry) => entry.id === entryId))
        ?.section ?? null,
    [draft.schedules],
  );

  /* ------------------------------------------------------------- mutations */

  /**
   * Every draft write takes the snapshot BEFORE the call, because afterwards
   * the previous value exists nowhere else. The service answers with the new
   * draft, so the page updates from that instead of waiting for a second read.
   */
  const mutateDraft = useCallback(
    async (message: string, run: () => Promise<DraftSchedule>, sectionForUndo: SectionId) => {
      const before = draftRef.current;
      try {
        const next = await run();
        applyDraft(next);
        armUndo({
          message,
          revert: async () => {
            applyDraft(
              restoreDraftSnapshot(before, {
                section: sectionForUndo,
                detail: "Undid the last schedule change.",
                actor,
              }),
            );
          },
        });
      } catch {
        toast("That change didn't save. Please try again.", "error");
      }
    },
    [actor, applyDraft, armUndo, toast],
  );

  const saveEntryValues = useCallback(
    async (values: EntryFormValues, replaceId?: string) => {
      const targetSection = values.section;
      const entry = entryFromFormValues(
        values,
        master,
        targetSection,
        entriesBySection(targetSection),
        replaceId,
      );
      await mutateDraft(
        `${entry.subjectCode} ${replaceId === undefined ? "added" : "updated"} in ${targetSection}`,
        () => saveEntryService(entry, targetSection, actor),
        targetSection,
      );
    },
    [actor, entriesBySection, master, mutateDraft],
  );

  const deleteEntry = useCallback(
    async (entry: ScheduleEntry, targetSection: SectionId) => {
      await mutateDraft(
        `Removed ${entry.subjectCode} from ${targetSection}`,
        () => deleteEntryService(entry.id, actor),
        targetSection,
      );
      if (selectedEntryId === entry.id) setSelectedEntryId(null);
    },
    [actor, mutateDraft, selectedEntryId],
  );

  /** Grid drag, resize and the keyboard moves — no Undo toast, the draft is live. */
  const moveEntry = useCallback(
    async (entryId: string, patch: { startMin: number; endMin: number; days?: DayCode[] }) => {
      try {
        applyDraft(await moveEntryService(entryId, patch, actor));
      } catch {
        toast("That move didn't save. Please try again.", "error");
      }
    },
    [actor, applyDraft, toast],
  );

  const quickEdit = useCallback(
    async (
      entry: ScheduleEntry,
      targetSection: SectionId,
      patch: EntryPatch,
      label: string,
    ) => {
      await mutateDraft(
        label,
        () => bulkUpdateService([entry.id], patch, actor, targetSection),
        targetSection,
      );
    },
    [actor, mutateDraft],
  );

  const toggleStatus = useCallback(
    async (entry: ScheduleEntry, targetSection: SectionId) => {
      const status = entry.status === "active" ? "not_active" : "active";
      await quickEdit(entry, targetSection, { status }, `${entry.subjectCode} set to ${
        status === "active" ? "Active" : "Not Active"
      }`);
    },
    [quickEdit],
  );

  const bulkUpdate = useCallback(
    async (ids: string[], patch: EntryPatch, targetSection: SectionId, label: string) => {
      await mutateDraft(label, () => bulkUpdateService(ids, patch, actor, targetSection), targetSection);
    },
    [actor, mutateDraft],
  );

  /** One Undo for the whole batch: the service is called per id, the snapshot taken once. */
  const bulkDelete = useCallback(
    async (ids: string[], targetSection: SectionId) => {
      const before = draftRef.current;
      try {
        let next = before;
        for (const id of ids) {
          next = await deleteEntryService(id, actor);
        }
        applyDraft(next);
        armUndo({
          message: `Removed ${ids.length} ${ids.length === 1 ? "class" : "classes"} from ${targetSection}`,
          revert: async () => {
            applyDraft(
              restoreDraftSnapshot(before, {
                section: targetSection,
                detail: "Undid a bulk delete.",
                actor,
              }),
            );
          },
        });
        setSelectedEntryId(null);
      } catch {
        toast("That bulk delete didn't save.", "error");
      }
    },
    [actor, applyDraft, armUndo, toast],
  );

  const duplicateSection = useCallback(
    async (source: SectionId, options: DuplicateOptions) => {
      await mutateDraft(
        `Copied ${source} to ${options.targetSections.join(", ")}`,
        () => duplicateSectionService(source, options, actor),
        source,
      );
    },
    [actor, mutateDraft],
  );

  const importRows = useCallback(
    async (rows: ImportRowInput[]) => {
      const before = draftRef.current;
      const outcome = await importRowsService(rows, actor);
      applyDraft(outcome.draft);
      const imported = outcome.results.filter((item) => item.verdict !== "error").length;
      armUndo({
        message: `Imported ${imported} ${imported === 1 ? "row" : "rows"}`,
        revert: async () => {
          applyDraft(
            restoreDraftSnapshot(before, {
              section: before.schedules[0]?.section ?? "BSIT-3A",
              detail: "Undid a CSV import.",
              actor,
            }),
          );
        },
      });
      return { results: outcome.results };
    },
    [actor, applyDraft, armUndo],
  );

  /**
   * (2) PUBLISH FLOW: draft -> conflict check -> publish -> versioned
   * localStorage -> storage/broadcast event -> the student page re-renders from
   * PUBLISHED and shows its update banner. The Undo here restores the previous
   * published record verbatim, so students go back to exactly what they had.
   */
  const publish = useCallback(
    async (options: PublishOptions) => {
      setPublishing(true);
      const previousPublished = published;
      const previousDraft = draftRef.current;
      try {
        const next = await publishService(options, actor);
        const diffs = diffPublishedAgainstDraft(previousPublished, previousDraft);
        applyPublished(next);
        applyDraft({ ...previousDraft, baseVersion: next.version });
        const undoSection = diffs[0]?.section ?? next.schedules[0]?.section ?? "BSIT-3A";
        toast(`Version ${next.version} published.`, "success", {
          label: "Undo",
          durationMs: 8000,
          onClick: () => {
            applyPublished(
              restorePublishedSnapshot(previousPublished, {
                section: undoSection,
                detail: `Undid the publish of version ${next.version}.`,
                actor,
              }),
            );
            toast(`Back to version ${previousPublished.version}.`, "info");
          },
        });
      } catch {
        toast("Publishing failed. Nothing was sent to students.", "error");
      } finally {
        setPublishing(false);
      }
    },
    [actor, applyDraft, applyPublished, published, toast],
  );

  const discardDraft = useCallback(async () => {
    const before = draftRef.current;
    const targetSection = before.schedules[0]?.section ?? "BSIT-3A";
    try {
      applyDraft(await discardDraftService(actor));
      armUndo({
        message: "Draft discarded.",
        tone: "warning",
        revert: async () => {
          applyDraft(
            restoreDraftSnapshot(before, {
              section: targetSection,
              detail: "Undid a draft discard.",
              actor,
            }),
          );
        },
      });
    } catch {
      toast("The draft could not be discarded.", "error");
    }
  }, [actor, applyDraft, armUndo, toast]);

  const restoreVersion = useCallback(
    async (version: number) => {
      const next = await restoreVersionService(version, actor);
      applyPublished(next);
      toast(`Version ${version} restored, published as version ${next.version}.`, "success");
    },
    [actor, applyPublished, toast],
  );

  const saveSubject = useCallback(
    async (subject: Subject) => {
      await saveSubjectService(subject, actor);
      await load(true);
      toast(`Subject ${subject.code} saved.`, "success");
    },
    [actor, load, toast],
  );

  const saveInstructor = useCallback(
    async (instructor: Instructor) => {
      await saveInstructorService(instructor, actor);
      await load(true);
      toast(`Instructor ${instructor.displayName} saved.`, "success");
    },
    [actor, load, toast],
  );

  const saveRoom = useCallback(
    async (room: Room) => {
      await saveRoomService(room, actor);
      await load(true);
      toast(`Room ${room.name} saved.`, "success");
    },
    [actor, load, toast],
  );

  const runDemoConflict = useCallback(async () => {
    applyDraft(await createSampleConflict(actor));
    toast("Sample conflict created in BSIT-3B.", "warning");
  }, [actor, applyDraft, toast]);

  const resetDemo = useCallback(async () => {
    const next = await resetDemoData();
    setSnapshot(next);
    draftRef.current = next.draft;
    toast("Demo schedule data reset to published v7.", "info");
  }, [toast]);

  /** "Go to entry" from the conflict panel: select the row/block and open its section. */
  const selectEntry = useCallback(
    (entryId: string | null) => {
      setSelectedEntryId(entryId);
      if (entryId === null) return;
      const owner = sectionOfEntry(entryId);
      if (owner !== null && section !== "all" && owner !== section) setSection(owner);
    },
    [section, sectionOfEntry, setSection],
  );

  const value = useMemo<ScheduleAdminContextValue>(
    () => ({
      loading,
      error,
      reload: () => load(),
      publishing,
      published,
      draft,
      master,
      history,
      conflicts,
      conflictCount,
      conflictsBySection,
      dirtyCount: draftState.dirtyCount,
      hasUnsavedChanges: draftState.dirty,
      publishDiff: draftState.diff,
      changedSections: draftState.changedSections,
      sync: { live: sync.live, lastSyncedAt: sync.lastSyncedAt },
      leaveGuard,
      actor,
      role,
      canEdit,
      canEditSection,
      editDisabledReason,
      sectionsForRole,
      myInstructor,
      section,
      setSection,
      view,
      setView,
      roomSet,
      setRoomSet,
      overlay,
      setOverlay,
      filters,
      setFilters,
      clearFilters,
      activeFilterCount,
      applyKpiFilter,
      visibleEntries,
      entriesBySection,
      sectionOfEntry,
      selectedEntryId,
      selectEntry,
      saveEntryValues,
      deleteEntry,
      moveEntry,
      toggleStatus,
      quickEdit,
      bulkUpdate,
      bulkDelete,
      duplicateSection,
      importRows,
      publish,
      discardDraft,
      restoreVersion,
      saveSubject,
      saveInstructor,
      saveRoom,
      usageOf: countMasterUsage,
      runDemoConflict,
      resetDemo,
    }),
    [
      activeFilterCount,
      actor,
      applyKpiFilter,
      bulkDelete,
      bulkUpdate,
      canEdit,
      canEditSection,
      clearFilters,
      conflictCount,
      conflicts,
      conflictsBySection,
      deleteEntry,
      discardDraft,
      draft,
      draftState.changedSections,
      draftState.diff,
      draftState.dirty,
      draftState.dirtyCount,
      duplicateSection,
      editDisabledReason,
      entriesBySection,
      error,
      filters,
      history,
      importRows,
      leaveGuard,
      load,
      loading,
      master,
      moveEntry,
      myInstructor,
      overlay,
      publish,
      published,
      publishing,
      quickEdit,
      resetDemo,
      restoreVersion,
      role,
      roomSet,
      runDemoConflict,
      saveEntryValues,
      saveInstructor,
      saveRoom,
      saveSubject,
      section,
      sectionOfEntry,
      sectionsForRole,
      selectEntry,
      selectedEntryId,
      setFilters,
      setSection,
      setView,
      sync.lastSyncedAt,
      sync.live,
      toggleStatus,
      view,
      visibleEntries,
    ],
  );

  return <ScheduleAdminContext.Provider value={value}>{children}</ScheduleAdminContext.Provider>;
}

export function useScheduleAdmin(): ScheduleAdminContextValue {
  const context = useContext(ScheduleAdminContext);
  if (context === null) {
    throw new Error("useScheduleAdmin must be used inside a <ScheduleAdminProvider>.");
  }
  return context;
}
