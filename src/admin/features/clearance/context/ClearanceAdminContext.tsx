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
import { useAdminAuth } from "@/admin/context/AdminAuthContext";
import { useAdminData } from "@/admin/context/AdminDataContext";
import { ADMIN_USERS } from "@/admin/config/navigation";
import {
  DEFAULT_FILTERS,
  filterAndSortRows,
  filtersFromParams,
  paramsFromFilters,
  useClearanceQueue,
} from "../hooks/useClearanceQueue";
import { useSavedSignatures } from "../hooks/useSavedSignatures";
import { useStorageSync } from "../hooks/useStorageSync";
import { useUndoAction } from "../hooks/useUndoAction";
import {
  DEFAULT_PERIOD,
  addSavedSignature,
  approveRequest,
  bulkApprove as bulkApproveService,
  bulkReject as bulkRejectService,
  computeKpis,
  computeOfficeLoad,
  deriveRows,
  deleteSavedSignature,
  getAllTimeline,
  getPeriod,
  getRecords,
  rejectRequest,
  resetClearanceDemo,
  revokeRequest,
  scopeRows,
  sendReminders as sendRemindersService,
  setPeriod as setPeriodService,
  simulateStudentCancel,
  simulateStudentRequest,
  undoDecision,
  updateSavedSignature,
  type DecisionSnapshot,
} from "../services/clearanceAdminService";
import { OFFICE_LABELS, buildOfficeChecks } from "../utils/officeChecks";
import type {
  ApproveInput,
  ClearanceAdminContextValue,
  ClearancePeriod,
  ClearanceRecord,
  ClearanceRequestRow,
  KpiId,
  NewSignatureInput,
  QueueFilters,
  TimelineEvent,
} from "../types";

const ClearanceAdminContext = createContext<ClearanceAdminContextValue | null>(null);

/** First paint keeps the skeletons up long enough to feel like a real fetch. */
const MIN_SKELETON_MS = 800;

function pause(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, Math.max(0, ms));
  });
}

/** `?request=STU-2026-0778:dean` from a notification, or the older `?student=` links. */
function readDeepLink(): string | null {
  const params = new URLSearchParams(window.location.search);
  const request = params.get("request");
  const student = params.get("student");
  return request ?? (student ? `student:${student}` : null);
}

/** Legacy `?student=` links land on that student's most urgent row. */
function rowForStudent(
  rows: ClearanceRequestRow[],
  studentId: string,
): ClearanceRequestRow | null {
  const owned = rows.filter((row) => row.studentId === studentId);
  return (
    owned.find((row) => row.status === "requested") ??
    owned.find((row) => row.status === "rejected") ??
    owned[0] ??
    null
  );
}

/**
 * A notification link is a request to *see* one row, so the view is widened
 * enough to hold it: a status or office tab that would hide the target gives
 * way to "all", and the page jumps to wherever the row actually lands.
 */
function focusRow(
  current: QueueFilters,
  rows: ClearanceRequestRow[],
  target: ClearanceRequestRow,
): QueueFilters {
  const widened: QueueFilters = {
    ...current,
    status: current.status === "all" || current.status === target.status ? current.status : "all",
    office: current.office === "all" || current.office === target.office ? current.office : "all",
    page: 1,
  };

  const index = filterAndSortRows(rows, widened).findIndex((row) => row.id === target.id);
  if (index < 0) return widened;

  return { ...widened, page: Math.floor(index / widened.pageSize) + 1 };
}

/**
 * State owner for the staff clearance queue.
 *
 * (3) `records` is the only clearance data this page holds; the queue, the KPIs
 * and the workload chart are derived from it, so a signature written by either
 * portal shows up in every widget on the same render.
 */
export function ClearanceAdminProvider({ children }: { children: ReactNode }) {
  const { user } = useAdminAuth();
  const { refresh: refreshAdminData } = useAdminData();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const staff = user ?? ADMIN_USERS.admin;
  const isSuperAdmin = staff.role === "admin";
  const homeOffice = isSuperAdmin ? null : staff.office;

  const [records, setRecords] = useState<ClearanceRecord[]>([]);
  const [period, setPeriodState] = useState<ClearancePeriod>(DEFAULT_PERIOD);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [checkedIds, setCheckedIds] = useState<string[]>([]);
  const [filters, setFiltersState] = useState<QueueFilters>(() =>
    filtersFromParams(searchParams, homeOffice),
  );

  /** A deep link can arrive before the data, so the target waits here. */
  const deepLink = useRef<string | null>(readDeepLink());

  const rows = useMemo(
    () => scopeRows(deriveRows(records, period.overdueDays), homeOffice),
    [records, period.overdueDays, homeOffice],
  );

  /** Office staff are hard-scoped; the URL can only narrow, never widen. */
  const effectiveFilters = useMemo<QueueFilters>(
    () => (homeOffice ? { ...filters, office: homeOffice } : filters),
    [filters, homeOffice],
  );

  const { visibleRows, pageRows, totalRows, totalPages } = useClearanceQueue(
    rows,
    effectiveFilters,
  );

  const kpis = useMemo(() => computeKpis(rows), [rows]);
  const officeLoad = useMemo(() => computeOfficeLoad(rows), [rows]);

  const load = useCallback(
    async (mode: "initial" | "refresh" | "silent") => {
      if (mode === "initial") setLoading(true);
      else if (mode === "refresh") setRefreshing(true);

      const startedAt = Date.now();
      try {
        const [nextRecords, nextPeriod, nextTimeline] = await Promise.all([
          getRecords(),
          getPeriod(),
          getAllTimeline(),
        ]);

        setRecords(nextRecords);
        setPeriodState(nextPeriod);
        setTimeline(nextTimeline);
        setError(null);

        if (deepLink.current) {
          const scoped = scopeRows(
            deriveRows(nextRecords, nextPeriod.overdueDays),
            homeOffice,
          );
          const target = deepLink.current;
          const row = target.startsWith("student:")
            ? rowForStudent(scoped, target.slice("student:".length))
            : scoped.find((entry) => entry.id === target);
          if (row) {
            setSelectedId(row.id);
            deepLink.current = null;
            setFiltersState((current) => focusRow(current, scoped, row));
          }
        }
      } catch {
        setError("We couldn't load the clearance queue. Please try again.");
      } finally {
        if (mode === "initial") {
          await pause(MIN_SKELETON_MS - (Date.now() - startedAt));
          setLoading(false);
        } else {
          setRefreshing(false);
        }
      }
    },
    [homeOffice],
  );

  useEffect(() => {
    // Initial fetch: the localStorage-backed service is the external store, so
    // this is the sanctioned "subscribe on mount" case for this provider.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load("initial");
  }, [load]);

  const { live, lastSyncedAt, markSynced } = useStorageSync((reason) => {
    void load(reason === "manual" ? "refresh" : "silent");
  });

  /* Keep the shareable view in the address bar; selection params ride along. */
  useEffect(() => {
    const next = paramsFromFilters(effectiveFilters);
    const current = new URLSearchParams(window.location.search);
    for (const key of ["request", "student"]) {
      const value = current.get(key);
      if (value) next.set(key, value);
    }
    setSearchParams(next, { replace: true });
  }, [effectiveFilters, setSearchParams]);

  /* ------------------------------------------------------------- filters */

  const setFilter = useCallback(
    <K extends keyof QueueFilters>(key: K, value: QueueFilters[K]) => {
      setFiltersState((current) => ({
        ...current,
        [key]: value,
        page: key === "page" ? (value as number) : 1,
      }));
    },
    [],
  );

  const setFilters = useCallback((patch: Partial<QueueFilters>) => {
    setFiltersState((current) => ({ ...current, ...patch, page: patch.page ?? 1 }));
  }, []);

  const baseline = useMemo<QueueFilters>(
    () => ({ ...DEFAULT_FILTERS, office: homeOffice ?? "all" }),
    [homeOffice],
  );

  const resetFilters = useCallback(() => setFiltersState(baseline), [baseline]);

  const hasActiveFilters = useMemo(
    () =>
      (
        [
          "office",
          "status",
          "query",
          "section",
          "from",
          "to",
          "overdueOnly",
          "withNotesOnly",
        ] as (keyof QueueFilters)[]
      ).some((key) => effectiveFilters[key] !== baseline[key]),
    [effectiveFilters, baseline],
  );

  const applyKpiFilter = useCallback(
    (id: KpiId) => {
      const patches: Record<KpiId, Partial<QueueFilters>> = {
        awaitingMine: { status: "requested", overdueOnly: false },
        signedToday: { status: "signed", overdueOnly: false },
        rejected: { status: "rejected", overdueOnly: false },
        overdue: { status: "requested", overdueOnly: true },
        avgTurnaround: { status: "signed", overdueOnly: false },
      };
      setFilters({ ...patches[id], page: 1 });
    },
    [setFilters],
  );

  /* ----------------------------------------------------------- selection */

  const selectRow = useCallback((id: string | null) => {
    setSelectedId(id);
  }, []);

  /** J / K walk the filtered queue so review order matches what is on screen. */
  const stepRequest = useCallback(
    (delta: 1 | -1) => {
      if (visibleRows.length === 0) return;
      const index = visibleRows.findIndex((row) => row.id === selectedId);
      const nextIndex =
        index < 0 ? 0 : Math.min(visibleRows.length - 1, Math.max(0, index + delta));
      const next = visibleRows[nextIndex];
      if (next) setSelectedId(next.id);
    },
    [selectedId, visibleRows],
  );

  const toggleChecked = useCallback((id: string) => {
    setCheckedIds((current) =>
      current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id],
    );
  }, []);

  const toggleCheckedAll = useCallback(() => {
    setCheckedIds((current) => {
      const ids = pageRows.map((row) => row.id);
      const allChecked = ids.every((id) => current.includes(id));
      if (allChecked) return current.filter((id) => !ids.includes(id));
      return Array.from(new Set([...current, ...ids]));
    });
  }, [pageRows]);

  const clearChecked = useCallback(() => setCheckedIds([]), []);

  /* ------------------------------------------------------------ mutations */

  /** Every decision ends the same way: re-read, then nudge the rest of the portal. */
  const afterDecision = useCallback(async () => {
    await load("silent");
    markSynced();
    void refreshAdminData();
  }, [load, markSynced, refreshAdminData]);

  const armUndo = useUndoAction();

  const revert = useCallback(
    async (snapshots: DecisionSnapshot[]) => {
      await undoDecision(snapshots);
      await afterDecision();
    },
    [afterDecision],
  );

  /** Auto-advance to the next pending request once this one is signed. */
  const advancePending = useCallback(
    (fromId: string) => {
      const pending = visibleRows.filter((row) => row.status === "requested");
      const index = pending.findIndex((row) => row.id === fromId);
      const next = pending[index + 1] ?? pending.find((row) => row.id !== fromId);
      setSelectedId(next ? next.id : fromId);
    },
    [visibleRows],
  );

  const approve = useCallback(
    async (row: ClearanceRequestRow, input: ApproveInput) => {
      setBusy(true);
      try {
        const outcome = await approveRequest(row.id, {
          ...input,
          signerName: staff.name,
          staffId: staff.id,
        });
        if (outcome.snapshots.length === 0) {
          toast("That request has already been handled.", "warning");
          await load("silent");
          return false;
        }

        await afterDecision();
        armUndo({
          message: `Signed ${row.studentName} · ${OFFICE_LABELS[row.office]}`,
          snapshots: outcome.snapshots,
          revert,
        });
        advancePending(row.id);
        return true;
      } catch {
        toast("We couldn't record the signature. Please try again.", "error");
        return false;
      } finally {
        setBusy(false);
      }
    },
    [
      advancePending,
      afterDecision,
      armUndo,
      load,
      revert,
      staff.id,
      staff.name,
      toast,
    ],
  );

  const reject = useCallback(
    async (row: ClearanceRequestRow, remarks: string) => {
      setBusy(true);
      try {
        const outcome = await rejectRequest(row.id, { remarks, signerName: staff.name });
        if (outcome.snapshots.length === 0) {
          toast("That request has already been handled.", "warning");
          await load("silent");
          return false;
        }

        await afterDecision();
        armUndo({
          message: `Returned ${row.studentName}'s request`,
          snapshots: outcome.snapshots,
          revert,
        });
        return true;
      } catch {
        toast("We couldn't send that back to the student. Please try again.", "error");
        return false;
      } finally {
        setBusy(false);
      }
    },
    [afterDecision, armUndo, load, revert, staff.name, toast],
  );

  const revoke = useCallback(
    async (row: ClearanceRequestRow, reason: string) => {
      if (!isSuperAdmin) {
        toast("Only an administrator can revoke a completed signature.", "warning");
        return false;
      }

      setBusy(true);
      try {
        const outcome = await revokeRequest(row.id, { reason, actorName: staff.name });
        if (outcome.snapshots.length === 0) {
          toast("That request is not signed yet.", "warning");
          await load("silent");
          return false;
        }

        await afterDecision();
        armUndo({
          message: `Revoked the ${OFFICE_LABELS[row.office]} signature`,
          snapshots: outcome.snapshots,
          revert,
        });
        return true;
      } catch {
        toast("We couldn't revoke that signature. Please try again.", "error");
        return false;
      } finally {
        setBusy(false);
      }
    },
    [afterDecision, armUndo, isSuperAdmin, load, revert, staff.name, toast],
  );

  const requestableChecked = useCallback(
    () =>
      checkedIds.filter((id) => rows.some((row) => row.id === id && row.status === "requested")),
    [checkedIds, rows],
  );

  const bulkApproveChecked = useCallback(
    async (signatureId: string) => {
      const ids = requestableChecked();
      if (ids.length === 0) {
        toast("Nothing selected is waiting for a signature.", "warning");
        return false;
      }

      setBusy(true);
      try {
        const outcome = await bulkApproveService(ids, {
          signatureId,
          staffId: staff.id,
          signerName: staff.name,
        });
        if (outcome.snapshots.length === 0) {
          toast("Pick one of your saved signatures first.", "warning");
          return false;
        }

        await afterDecision();
        clearChecked();
        armUndo({
          message: `Signed ${outcome.snapshots.length} request${
            outcome.snapshots.length === 1 ? "" : "s"
          }`,
          snapshots: outcome.snapshots,
          revert,
        });
        return true;
      } catch {
        toast("The batch didn't go through. Please try again.", "error");
        return false;
      } finally {
        setBusy(false);
      }
    },
    [
      afterDecision,
      armUndo,
      clearChecked,
      requestableChecked,
      revert,
      staff.id,
      staff.name,
      toast,
    ],
  );

  const bulkRejectChecked = useCallback(
    async (remarks: string) => {
      const ids = requestableChecked();
      if (ids.length === 0) {
        toast("Select at least one pending request.", "warning");
        return false;
      }

      setBusy(true);
      try {
        const outcome = await bulkRejectService(ids, { remarks, signerName: staff.name });
        await afterDecision();
        clearChecked();
        armUndo({
          message: `Returned ${outcome.snapshots.length} request${
            outcome.snapshots.length === 1 ? "" : "s"
          }`,
          snapshots: outcome.snapshots,
          revert,
        });
        return true;
      } catch {
        toast("The batch didn't go through. Please try again.", "error");
        return false;
      } finally {
        setBusy(false);
      }
    },
    [afterDecision, armUndo, clearChecked, requestableChecked, revert, staff.name, toast],
  );

  /* --------------------------------------------------------- signatures */

  const signatures = useSavedSignatures(staff.id);
  const { reload: reloadSignatures } = signatures;

  const addSignature = useCallback(
    async (input: NewSignatureInput) => {
      try {
        const saved = await addSavedSignature(staff.id, input);
        reloadSignatures();
        toast(`Signature "${saved.label}" saved.`, "success");
        return saved;
      } catch {
        toast("We couldn't save that signature.", "error");
        return null;
      }
    },
    [reloadSignatures, staff.id, toast],
  );

  const renameSignature = useCallback(
    async (id: string, label: string) => {
      await updateSavedSignature(staff.id, id, { label });
      reloadSignatures();
    },
    [reloadSignatures, staff.id],
  );

  const deleteSignature = useCallback(
    async (id: string) => {
      await deleteSavedSignature(staff.id, id);
      reloadSignatures();
      toast("Signature removed.", "info");
    },
    [reloadSignatures, staff.id, toast],
  );

  const makeDefaultSignature = useCallback(
    async (id: string) => {
      await updateSavedSignature(staff.id, id, { isDefault: true });
      reloadSignatures();
    },
    [reloadSignatures, staff.id],
  );

  /* --------------------------------------------------- period & reminders */

  const updatePeriod = useCallback(
    async (patch: Partial<ClearancePeriod>) => {
      try {
        const next = await setPeriodService(patch);
        setPeriodState(next);
        markSynced();
        void refreshAdminData();
        if (patch.open !== undefined) {
          toast(
            patch.open
              ? "Clearance period is open — students can request signatures."
              : "Clearance period closed — the student request buttons are disabled.",
            patch.open ? "success" : "warning",
          );
        }
      } catch {
        toast("We couldn't update the clearance period.", "error");
      }
    },
    [markSynced, refreshAdminData, toast],
  );

  const notifyOffices = useCallback(async () => {
    try {
      const count = await sendRemindersService(staff.name);
      markSynced();
      void refreshAdminData();
      toast(
        count === 0
          ? "No offices are holding requests right now."
          : `Reminders sent to ${count} office${count === 1 ? "" : "s"}.`,
        count === 0 ? "info" : "success",
      );
      return count;
    } catch {
      toast("We couldn't send the reminders.", "error");
      return 0;
    }
  }, [markSynced, refreshAdminData, staff.name, toast]);

  /* --------------------------------------------------------------- demo */

  const runStudentRequest = useCallback(async () => {
    setBusy(true);
    try {
      const row = await simulateStudentRequest(undefined, homeOffice ?? undefined);
      await afterDecision();
      if (row) {
        setSelectedId(row.id);
        toast(`New request from ${row.studentName} (${row.section})`, "info");
      } else {
        toast("Every office for that student is already signed.", "info");
      }
    } finally {
      setBusy(false);
    }
  }, [afterDecision, homeOffice, toast]);

  const runStudentCancel = useCallback(async () => {
    const target =
      rows.find((row) => row.id === selectedId && row.status === "requested") ??
      rows.find((row) => row.status === "requested");

    if (!target) {
      toast("There is no pending request to cancel.", "warning");
      return;
    }

    setBusy(true);
    try {
      await simulateStudentCancel(target.id);
      await afterDecision();
      setCheckedIds((current) => current.filter((id) => id !== target.id));
      toast(`${target.studentName} cancelled a request.`, "info");
    } finally {
      setBusy(false);
    }
  }, [afterDecision, rows, selectedId, toast]);

  const resetDemo = useCallback(async () => {
    setBusy(true);
    try {
      await resetClearanceDemo();
      setCheckedIds([]);
      setSelectedId(null);
      await afterDecision();
      toast("Demo clearance data reset.", "success");
    } finally {
      setBusy(false);
    }
  }, [afterDecision, toast]);

  const refresh = useCallback(
    async (reason: "manual" | "student" = "manual") => {
      await load(reason === "manual" ? "refresh" : "silent");
      markSynced();
    },
    [load, markSynced],
  );

  /* ------------------------------------------------------ selection view */

  const selectedRow = useMemo(
    () => rows.find((row) => row.id === selectedId) ?? null,
    [rows, selectedId],
  );

  const selectedRecord = useMemo(
    () =>
      selectedRow
        ? records.find((record) => record.studentId === selectedRow.studentId) ?? null
        : null,
    [records, selectedRow],
  );

  const selectedChecks = useMemo(
    () =>
      selectedRecord && selectedRow
        ? buildOfficeChecks(selectedRow.office, selectedRecord, staff.name)
        : [],
    [selectedRecord, selectedRow, staff.name],
  );

  const selectedTimeline = useMemo(
    () => (selectedRow ? timeline.filter((event) => event.requestId === selectedRow.id) : []),
    [selectedRow, timeline],
  );

  const value = useMemo<ClearanceAdminContextValue>(
    () => ({
      staff,
      isSuperAdmin,
      homeOffice,
      records,
      rows,
      visibleRows,
      pageRows,
      totalRows,
      totalPages,
      kpis,
      officeLoad,
      period,
      timeline,
      selectedRow,
      selectedRecord,
      selectedChecks,
      selectedTimeline,
      checkedIds,
      savedSignatures: signatures.signatures,
      defaultSignature: signatures.defaultSignature,
      loading,
      refreshing,
      busy,
      error,
      sync: { live, lastSyncedAt },
      filters: effectiveFilters,
      setFilter,
      setFilters,
      resetFilters,
      hasActiveFilters,
      applyKpiFilter,
      selectRow,
      stepRequest,
      toggleChecked,
      toggleCheckedAll,
      clearChecked,
      approve,
      reject,
      revoke,
      bulkApprove: bulkApproveChecked,
      bulkReject: bulkRejectChecked,
      addSignature,
      renameSignature,
      deleteSignature,
      makeDefaultSignature,
      setPeriod: updatePeriod,
      sendReminders: notifyOffices,
      refresh,
      simulateStudentRequest: runStudentRequest,
      simulateStudentCancel: runStudentCancel,
      resetDemo,
    }),
    [
      addSignature,
      applyKpiFilter,
      approve,
      busy,
      bulkApproveChecked,
      bulkRejectChecked,
      checkedIds,
      clearChecked,
      deleteSignature,
      effectiveFilters,
      error,
      hasActiveFilters,
      homeOffice,
      isSuperAdmin,
      kpis,
      live,
      lastSyncedAt,
      loading,
      makeDefaultSignature,
      notifyOffices,
      officeLoad,
      pageRows,
      period,
      records,
      refresh,
      refreshing,
      reject,
      renameSignature,
      resetDemo,
      resetFilters,
      revoke,
      rows,
      runStudentCancel,
      runStudentRequest,
      selectRow,
      selectedChecks,
      selectedRecord,
      selectedRow,
      selectedTimeline,
      setFilter,
      setFilters,
      signatures.signatures,
      signatures.defaultSignature,
      staff,
      stepRequest,
      timeline,
      toggleChecked,
      toggleCheckedAll,
      totalRows,
      totalPages,
      updatePeriod,
      visibleRows,
    ],
  );

  return (
    <ClearanceAdminContext.Provider value={value}>
      {children}
    </ClearanceAdminContext.Provider>
  );
}

export function useClearanceAdmin(): ClearanceAdminContextValue {
  const context = useContext(ClearanceAdminContext);
  if (!context) {
    throw new Error("useClearanceAdmin must be used inside a <ClearanceAdminProvider>.");
  }
  return context;
}
