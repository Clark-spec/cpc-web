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
import { useAdminAuth } from "@/components/context/AdminAuthContext";
import type { AdminRole } from "@/types/admin";
import type { DayCode, ScheduleEntry, SectionId, SectionSchedule } from "@/types/schedule";
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
  countMasterUsage,
  getScheduleSnapshot,
  readHistoryNow,
  type ScheduleSnapshot,
} from "@/services/scheduleAdmin";
import { conflictCountBySection } from "./conflicts";
import type {
  EntryFormValues,
  GridOverlayMode,
  KpiFilterTarget,
  RoomSetChoice,
  ScheduleEditorView,
  ScheduleFilters,
  SectionTab,
  SyncStatus,
} from "./types";
import { useConflicts } from "./useConflicts";
import { useScheduleAdminUrl } from "./useScheduleAdminUrl";
import { useScheduleDraft, useUnsavedGuard } from "./useScheduleDraft";
import { useScheduleFilterState, type VisibleEntry } from "./useScheduleFilterState";
import { useScheduleMutations } from "./useScheduleMutations";
import { useScheduleRoleScoping } from "./useScheduleRoleScoping";
import { useStorageSync } from "./useStorageSync";
import { useUndoAction } from "./useUndoAction";

export type { VisibleEntry };
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
  scopedSchedules: SectionSchedule[];
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

const ScheduleAdminContext = createContext<ScheduleAdminContextValue | null>(null);

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

const EMPTY_HISTORY: ScheduleChange[] = [];

export function ScheduleAdminProvider({ children }: { children: ReactNode }) {
  const { user } = useAdminAuth();

  const [snapshot, setSnapshot] = useState<ScheduleSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
    queueMicrotask(() => {
      void load();
    });
  }, [load]);

  const sync = useStorageSync(() => {
    void load(true);
  });

  const armUndo = useUndoAction();

  const published = snapshot?.published ?? EMPTY_PUBLISHED;
  const draft = snapshot?.draft ?? EMPTY_DRAFT;
  const master = snapshot?.master ?? EMPTY_MASTER;
  const history = snapshot?.history ?? EMPTY_HISTORY;

  const draftState = useScheduleDraft(draft, published);
  const { conflicts: draftConflicts } = useConflicts(draft);
  const leaveGuard = useUnsavedGuard(draftState);

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

  // 1. Role Scoping
  const roleScoping = useScheduleRoleScoping(user, role, master, draft);
  const { scopedSchedules } = roleScoping;

  // 2. Conflicts
  const conflicts = useMemo<Conflict[]>(() => {
    const visible = new Set<string>();
    for (const schedule of scopedSchedules) {
      for (const entry of schedule.entries) visible.add(entry.id);
    }
    return draftConflicts.filter((conflict) =>
      conflict.entryIds.some((entryId) => visible.has(entryId)),
    );
  }, [draftConflicts, scopedSchedules]);

  const conflictCount = conflicts.length;
  const conflictsBySection = useMemo(
    () => conflictCountBySection(conflicts, scopedSchedules),
    [conflicts, scopedSchedules],
  );

  // 3. URL State & Navigation
  const scopedSections = useMemo(
    () => scopedSchedules.map((schedule) => schedule.section),
    [scopedSchedules],
  );

  const urlState = useScheduleAdminUrl(scopedSections, () => setSelectedEntryId(null));
  const { section, setSection, view, setView, filters, setFilters, clearFilters, applyKpiFilter } = urlState;

  // 4. Filtering & Visible Rows
  const filterState = useScheduleFilterState(filters, scopedSchedules, master, conflicts, section);
  const { visibleEntries, activeFilterCount, entriesBySection, sectionOfEntry } = filterState;

  // 5. Mutations
  const mutations = useScheduleMutations({
    actor,
    master,
    published,
    draftRef,
    applyDraft,
    applyPublished,
    armUndo,
    load,
    setSnapshot,
    entriesBySection,
    selectedEntryId,
    setSelectedEntryId,
  });

  const selectEntry = useCallback(
    (entryId: string | null) => {
      if (entryId === null) {
        setSelectedEntryId(null);
        return;
      }
      const owner = sectionOfEntry(entryId);
      if (owner !== null && section !== "all" && owner !== section) setSection(owner);
      setSelectedEntryId(entryId);
    },
    [section, sectionOfEntry, setSection],
  );

  const value = useMemo<ScheduleAdminContextValue>(
    () => ({
      loading,
      error,
      reload: () => load(),
      publishing: mutations.publishing,
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
      ...roleScoping,
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
      saveEntryValues: mutations.saveEntryValues,
      deleteEntry: mutations.deleteEntry,
      moveEntry: mutations.moveEntry,
      toggleStatus: mutations.toggleStatus,
      quickEdit: mutations.quickEdit,
      bulkUpdate: mutations.bulkUpdate,
      bulkDelete: mutations.bulkDelete,
      duplicateSection: mutations.duplicateSection,
      importRows: mutations.importRows,
      publish: mutations.publish,
      discardDraft: mutations.discardDraft,
      restoreVersion: mutations.restoreVersion,
      saveSubject: mutations.saveSubject,
      saveInstructor: mutations.saveInstructor,
      saveRoom: mutations.saveRoom,
      usageOf: countMasterUsage,
      runDemoConflict: mutations.runDemoConflict,
      resetDemo: mutations.resetDemo,
    }),
    [
      activeFilterCount,
      actor,
      applyKpiFilter,
      clearFilters,
      conflictCount,
      conflicts,
      conflictsBySection,
      draft,
      draftState.changedSections,
      draftState.diff,
      draftState.dirty,
      draftState.dirtyCount,
      entriesBySection,
      error,
      filters,
      history,
      leaveGuard,
      load,
      loading,
      master,
      mutations,
      overlay,
      published,
      role,
      roleScoping,
      roomSet,
      section,
      sectionOfEntry,
      selectEntry,
      selectedEntryId,
      setFilters,
      setSection,
      setView,
      sync.lastSyncedAt,
      sync.live,
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
