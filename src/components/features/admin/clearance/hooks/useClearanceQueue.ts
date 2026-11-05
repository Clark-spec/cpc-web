import { useMemo } from "react";
import type { ClearanceRequestRow, OfficeId, QueueFilters } from "../types";

export const DEFAULT_FILTERS: QueueFilters = {
  office: "all",
  status: "requested",
  query: "",
  section: "all",
  from: "",
  to: "",
  overdueOnly: false,
  withNotesOnly: false,
  sort: "oldest",
  view: "table",
  page: 1,
  pageSize: 10,
};

/** Every filter except `page` belongs in the URL so views stay shareable. */
const URL_KEYS = [
  "office",
  "status",
  "query",
  "section",
  "from",
  "to",
  "overdueOnly",
  "withNotesOnly",
  "sort",
  "view",
  "pageSize",
] as const;

/**
 * URL -> filters. Only values that differ from the defaults are written back,
 * which keeps the address bar readable and links short.
 */
export function filtersFromParams(
  params: URLSearchParams,
  homeOffice: OfficeId | null,
): QueueFilters {
  const next: QueueFilters = {
    ...DEFAULT_FILTERS,
    office: homeOffice ?? "all",
  };

  // Office staff are hard-scoped to their own office; the URL can't widen it.
  if (homeOffice) {
    next.office = homeOffice;
  } else {
    const office = params.get("office");
    if (office && office !== "all") next.office = office as OfficeId;
  }

  const status = params.get("status");
  if (status === "signed" || status === "rejected" || status === "all") next.status = status;

  const sort = params.get("sort");
  if (sort === "newest" || sort === "name") next.sort = sort;

  const view = params.get("view");
  if (view === "board") next.view = view;

  const size = Number(params.get("pageSize"));
  if ([10, 25, 50].includes(size)) next.pageSize = size;

  next.query = params.get("query") ?? "";
  next.section = params.get("section") ?? "all";
  next.from = params.get("from") ?? "";
  next.to = params.get("to") ?? "";
  next.overdueOnly = params.get("overdueOnly") === "1";
  next.withNotesOnly = params.get("withNotesOnly") === "1";

  return next;
}

/** filters -> URL. */
export function paramsFromFilters(filters: QueueFilters): URLSearchParams {
  const params = new URLSearchParams();

  for (const key of URL_KEYS) {
    const value = filters[key];
    if (value === DEFAULT_FILTERS[key]) continue;
    if (typeof value === "boolean") {
      if (value) params.set(key, "1");
      continue;
    }
    if (String(value).length > 0) params.set(key, String(value));
  }

  return params;
}

function matchesQuery(row: ClearanceRequestRow, term: string): boolean {
  return `${row.studentName} ${row.studentId} ${row.section} ${row.program}`
    .toLowerCase()
    .includes(term);
}

function withinRange(row: ClearanceRequestRow, from: string, to: string): boolean {
  if (!from && !to) return true;
  const day = (row.requestedAt ?? row.respondedAt ?? "").slice(0, 10);
  if (!day) return false;
  if (from && day < from) return false;
  if (to && day > to) return false;
  return true;
}

/**
 * (3) The queue is derived from the shared records and filtered here; nothing
 * about filtering is persisted, so two staff members never fight over one view.
 */
export function filterAndSortRows(
  rows: ClearanceRequestRow[],
  filters: QueueFilters,
): ClearanceRequestRow[] {
  const term = filters.query.trim().toLowerCase();

  const matched = rows.filter((row) => {
    if (filters.office !== "all" && row.office !== filters.office) return false;
    if (filters.status !== "all" && row.status !== filters.status) return false;
    if (filters.section !== "all" && row.section !== filters.section) return false;
    if (filters.overdueOnly && !row.isOverdue) return false;
    if (filters.withNotesOnly && !row.studentNote) return false;
    if (!withinRange(row, filters.from, filters.to)) return false;
    if (term && !matchesQuery(row, term)) return false;
    return true;
  });

  const byAnchor = (row: ClearanceRequestRow) =>
    Date.parse(row.requestedAt ?? row.respondedAt ?? "") || 0;

  return matched.sort((a, b) => {
    if (filters.sort === "name") return a.studentName.localeCompare(b.studentName);
    const delta = byAnchor(a) - byAnchor(b);
    return filters.sort === "newest" ? -delta : delta;
  });
}

export function useClearanceQueue(
  rows: ClearanceRequestRow[],
  filters: QueueFilters,
): {
  visibleRows: ClearanceRequestRow[];
  pageRows: ClearanceRequestRow[];
  totalRows: number;
  totalPages: number;
  sections: string[];
} {
  const sections = useMemo(
    () => Array.from(new Set(rows.map((row) => row.section))).sort(),
    [rows],
  );

  const visibleRows = useMemo(
    () => filterAndSortRows(rows, filters),
    [rows, filters],
  );

  const totalPages = Math.max(
    1,
    Math.ceil(visibleRows.length / Math.max(1, filters.pageSize)),
  );
  const page = Math.min(Math.max(1, filters.page), totalPages);

  const pageRows = useMemo(
    () => visibleRows.slice((page - 1) * filters.pageSize, page * filters.pageSize),
    [visibleRows, page, filters.pageSize],
  );

  return {
    visibleRows,
    pageRows,
    totalRows: visibleRows.length,
    totalPages,
    sections,
  };
}
