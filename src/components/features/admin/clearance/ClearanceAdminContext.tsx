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
import { useAdminAuth } from "@/components/context/AdminAuthContext";
import { useAdminData } from "@/components/context/AdminDataContext";
import { ADMIN_USERS } from "@/lib/navigation";
import {
  DEFAULT_FILTERS,
  filterAndSortRows,
  filtersFromParams,
  paramsFromFilters,
  useClearanceQueue,
} from "./useClearanceQueue";
import { useStorageSync } from "./useStorageSync";
import {
  DEFAULT_PERIOD,
  computeKpis,
  computeOfficeLoad,
  deriveRows,
  getAllTimeline,
  getPeriod,
  getRecords,
  scopeRows,
} from "@/services/clearanceAdmin";
import { buildOfficeChecks } from "./officeChecks";
import type {
  ClearanceAdminContextValue,
  ClearancePeriod,
  ClearanceRecord,
  ClearanceRequestRow,
  KpiId,
  QueueFilters,
  TimelineEvent,
} from "./types";
import { useClearanceDecisions } from "./useClearanceDecisions";
import { useClearancePeriodAndDemo } from "./useClearancePeriodAndDemo";
import { useClearanceSignatures } from "./useClearanceSignatures";

const ClearanceAdminContext = createContext<ClearanceAdminContextValue | null>(null);

const MIN_SKELETON_MS = 800;

function pause(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, Math.max(0, ms));
  });
}

function readDeepLink(): string | null {
  const params = new URLSearchParams(window.location.search);
  const request = params.get("request");
  const student = params.get("student");
  return request ?? (student ? `student:${student}` : null);
}

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

export function ClearanceAdminProvider({ children }: { children: ReactNode }) {
  const { user } = useAdminAuth();
  const { refresh: refreshAdminData } = useAdminData();
  const [searchParams, setSearchParams] = useSearchParams();

  const staff = user ?? ADMIN_USERS.admin;
  const isSuperAdmin = staff.role === "admin";
  const homeOffice = isSuperAdmin ? null : staff.office;
  const homePrograms = isSuperAdmin ? null : (staff.homePrograms ?? null);

  const [records, setRecords] = useState<ClearanceRecord[]>([]);
  const [period, setPeriodState] = useState<ClearancePeriod>(DEFAULT_PERIOD);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [checkedIds, setCheckedIds] = useState<string[]>([]);
  const [filters, setFiltersState] = useState<QueueFilters>(() =>
    filtersFromParams(searchParams, homeOffice),
  );

  const deepLink = useRef<string | null>(readDeepLink());

  const rows = useMemo(
    () => scopeRows(deriveRows(records, period.overdueDays), homeOffice, homePrograms),
    [records, period.overdueDays, homeOffice, homePrograms],
  );

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
            homePrograms,
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
    queueMicrotask(() => {
      void load("initial");
    });
  }, [load]);

  const { live, lastSyncedAt, markSynced } = useStorageSync((reason) => {
    void load(reason === "manual" ? "refresh" : "silent");
  });

  useEffect(() => {
    const next = paramsFromFilters(effectiveFilters);
    const current = new URLSearchParams(window.location.search);
    for (const key of ["request", "student"]) {
      const value = current.get(key);
      if (value) next.set(key, value);
    }
    setSearchParams(next, { replace: true });
  }, [effectiveFilters, setSearchParams]);

  // Filters
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

  // Selection
  const selectRow = useCallback((id: string | null) => {
    setSelectedId(id);
  }, []);

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

  // Decisions
  const decisions = useClearanceDecisions({
    staff,
    isSuperAdmin,
    rows,
    visibleRows,
    checkedIds,
    clearChecked,
    setSelectedId,
    load,
    markSynced,
    refreshAdminData,
  });

  // Signatures
  const signatures = useClearanceSignatures(staff.id);

  // Period & Demo
  const periodAndDemo = useClearancePeriodAndDemo({
    staff,
    homeOffice,
    rows,
    selectedId,
    setPeriodState,
    setCheckedIds,
    setSelectedId,
    setBusy: decisions.setBusy,
    markSynced,
    refreshAdminData,
    afterDecision: decisions.afterDecision,
  });

  const refresh = useCallback(
    async (reason: "manual" | "student" = "manual") => {
      await load(reason === "manual" ? "refresh" : "silent");
      markSynced();
    },
    [load, markSynced],
  );

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
      homePrograms,
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
      savedSignatures: signatures.savedSignatures,
      defaultSignature: signatures.defaultSignature,
      loading,
      refreshing,
      busy: decisions.busy,
      error,
      sync: { live, lastSyncedAt },
      filters: effectiveFilters,
      hasActiveFilters,
      setFilter,
      setFilters,
      resetFilters,
      applyKpiFilter,
      selectedId,
      selectRow,
      stepRequest,
      toggleChecked,
      toggleCheckedAll,
      clearChecked,
      approve: decisions.approve,
      reject: decisions.reject,
      revoke: decisions.revoke,
      bulkApprove: decisions.bulkApproveChecked,
      bulkReject: decisions.bulkRejectChecked,
      addSignature: signatures.addSignature,
      renameSignature: signatures.renameSignature,
      deleteSignature: signatures.deleteSignature,
      makeDefaultSignature: signatures.makeDefaultSignature,
      setPeriod: periodAndDemo.updatePeriod,
      sendReminders: periodAndDemo.notifyOffices,
      simulateStudentRequest: periodAndDemo.runStudentRequest,
      simulateStudentCancel: periodAndDemo.runStudentCancel,
      resetDemo: periodAndDemo.resetDemo,
      refresh,
    }),
    [
      checkedIds,
      decisions,
      effectiveFilters,
      error,
      hasActiveFilters,
      homeOffice,
      homePrograms,
      isSuperAdmin,
      kpis,
      lastSyncedAt,
      live,
      loading,
      officeLoad,
      pageRows,
      period,
      periodAndDemo,
      records,
      refresh,
      resetFilters,
      rows,
      selectedChecks,
      selectedId,
      selectedRecord,
      selectedRow,
      selectedTimeline,
      setFilter,
      setFilters,
      signatures,
      staff,
      stepRequest,
      timeline,
      toggleChecked,
      toggleCheckedAll,
      totalPages,
      totalRows,
      visibleRows,
      clearChecked,
      selectRow,
      applyKpiFilter,
      refreshing,
    ],
  );

  return <ClearanceAdminContext.Provider value={value}>{children}</ClearanceAdminContext.Provider>;
}

export function useClearanceAdmin(): ClearanceAdminContextValue {
  const context = useContext(ClearanceAdminContext);
  if (context === null) {
    throw new Error("useClearanceAdmin must be used inside a <ClearanceAdminProvider>.");
  }
  return context;
}
