import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router";
import { isSectionId } from "@/services/scheduleStudent/mockSchedules";
import { DAY_CODES } from "@/lib/scheduleTime";
import type { DayCode, SectionId } from "@/types/schedule";
import type {
  KpiFilterTarget,
  ScheduleEditorView,
  ScheduleFilters,
  SectionTab,
} from "./types";
import { EMPTY_FILTERS } from "./types";

export const SECTION_PARAM = "section";
export const VIEW_PARAM = "view";

export function filtersFromParams(params: URLSearchParams): ScheduleFilters {
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
export function writeFilters(params: URLSearchParams, filters: ScheduleFilters): void {
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

export function useScheduleAdminUrl(scopedSections: SectionId[], onSectionChange?: () => void) {
  const [params, setParams] = useSearchParams();

  const sectionParam = params.get(SECTION_PARAM);
  const requested: SectionTab =
    sectionParam === "all" ? "all" : isSectionId(sectionParam) ? sectionParam : "BSIT-3A";

  const section: SectionTab =
    requested === "all" || scopedSections.includes(requested)
      ? requested
      : (scopedSections[0] ?? "all");

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
      onSectionChange?.();
    },
    [onSectionChange, patchParams],
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

  const applyKpiFilter = useCallback(
    (target: KpiFilterTarget) => {
      const wanted: ScheduleFilters =
        target === "conflicts" ? { ...EMPTY_FILTERS, onlyConflicts: true } : EMPTY_FILTERS;
      const scope: SectionTab = target === "sections" || target === "conflicts" ? "all" : section;
      patchParams((next) => {
        writeFilters(next, wanted);
        next.set(SECTION_PARAM, scope);
        if (target === "rooms") next.set(VIEW_PARAM, "grid");
        else next.delete(VIEW_PARAM);
      });
      onSectionChange?.();
    },
    [onSectionChange, patchParams, section],
  );

  return {
    params,
    requested,
    section,
    view,
    filters,
    patchParams,
    setSection,
    setView,
    setFilters,
    clearFilters,
    activeFilterCount,
    applyKpiFilter,
  };
}

