import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ChevronsUpDown,
  Download,
  Printer,
  Search,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import type {
  ScheduleEntry,
  SectionSchedule,
  SortDirection,
  SortKey,
  StatusFilter,
} from "../types";
import { daysToLabel, formatTimeRange } from "../utils/time";
import { StatusBadge } from "./Badge";

type SubjectListTableProps = {
  schedule: SectionSchedule;
  onOpenEntry: (entry: ScheduleEntry) => void;
};

const STATUS_FILTERS: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "not_active", label: "Not Active" },
];

const CSV_HEADER = [
  "#",
  "Subject Code",
  "Descriptive Title",
  "Time",
  "Days",
  "Room (Set A)",
  "Room (Set B)",
  "Units",
  "Instructor",
  "Status",
];

function SortButton({
  label,
  column,
  sortKey,
  sortDirection,
  onSort,
  align = "left",
}: {
  label: string;
  column: SortKey;
  sortKey: SortKey;
  sortDirection: SortDirection;
  onSort: (column: SortKey) => void;
  align?: "left" | "center";
}) {
  const active = sortKey === column;
  const Icon = active ? (sortDirection === "asc" ? ArrowUp : ArrowDown) : ChevronsUpDown;

  return (
    <button
      type="button"
      onClick={() => onSort(column)}
      className={cn(
        "inline-flex cursor-pointer items-center gap-1 rounded px-1 py-0.5 font-poppins text-[11px] font-semibold tracking-[0.08em] uppercase transition-colors hover:text-cpc-blue-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent",
        align === "center" && "justify-center",
        active ? "text-cpc-blue-accent" : "text-cpc-heading-soft",
      )}
      aria-label={`Sort by ${label}${active ? (sortDirection === "asc" ? ", ascending" : ", descending") : ""}`}
    >
      {label}
      <Icon className="h-3 w-3" aria-hidden />
    </button>
  );
}

function escapeCsv(value: string | number): string {
  return `"${String(value).replace(/"/g, '""')}"`;
}

/** Searchable, sortable, filterable subject list with a mobile card layout. */
export function SubjectListTable({ schedule, onOpenEntry }: SubjectListTableProps) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("time");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = schedule.entries.filter((entry) => {
      const matchesQuery =
        needle.length === 0 ||
        entry.subjectCode.toLowerCase().includes(needle) ||
        entry.title.toLowerCase().includes(needle) ||
        entry.instructor.toLowerCase().includes(needle);
      const matchesStatus = statusFilter === "all" || entry.status === statusFilter;
      return matchesQuery && matchesStatus;
    });

    return [...filtered].sort((a, b) => {
      let result: number;
      if (sortKey === "time") {
        result = a.startMin - b.startMin || a.endMin - b.endMin;
      } else if (sortKey === "units") {
        result = a.units - b.units || a.subjectCode.localeCompare(b.subjectCode);
      } else {
        result = a.instructor.localeCompare(b.instructor) || a.subjectCode.localeCompare(b.subjectCode);
      }
      return sortDirection === "asc" ? result : -result;
    });
  }, [schedule.entries, query, statusFilter, sortKey, sortDirection]);

  const totalUnits = rows.reduce((sum, entry) => sum + entry.units, 0);
  const filtersActive = query.trim().length > 0 || statusFilter !== "all";

  function toggleSort(column: SortKey) {
    if (sortKey === column) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(column);
      setSortDirection("asc");
    }
  }

  function resetFilters() {
    setQuery("");
    setStatusFilter("all");
  }

  function handlePrint() {
    window.print();
  }

  function handleDownloadCsv() {
    const lines = rows.map((entry, index) => [
      index + 1,
      entry.subjectCode,
      entry.title,
      formatTimeRange(entry.startMin, entry.endMin),
      daysToLabel(entry.days),
      entry.roomSetA,
      entry.roomSetB,
      entry.units,
      entry.instructor,
      entry.status === "active" ? "Active" : "Not Active",
    ]);
    const csv = [CSV_HEADER, ...lines]
      .map((row) => row.map(escapeCsv).join(","))
      .join("\r\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `CPC-Class-Schedule-${schedule.section}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  const ariaSort = (column: SortKey): "ascending" | "descending" | "none" =>
    sortKey === column ? (sortDirection === "asc" ? "ascending" : "descending") : "none";

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 print:hidden lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-cpc-heading-soft"
              aria-hidden
            />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Search subjects by code, title, or instructor"
              placeholder="Search code, title, or instructor"
              className="h-10 w-full rounded-lg border border-cpc-input-border bg-white pr-9 pl-9 font-poppins text-sm text-cpc-navy-text shadow-sm transition-colors placeholder:text-cpc-placeholder focus-visible:border-cpc-blue-accent focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-cpc-blue-accent sm:w-72"
            />
            {query.length > 0 && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer rounded p-1 text-cpc-heading-soft transition-colors hover:text-cpc-navy-text focus-visible:outline-2 focus-visible:outline-cpc-blue-accent"
              >
                <X className="h-3.5 w-3.5" aria-hidden />
              </button>
            )}
          </div>

          <div
            role="group"
            aria-label="Filter by subject status"
            className="flex w-fit rounded-lg border border-cpc-input-border bg-white p-1 shadow-sm"
          >
            {STATUS_FILTERS.map((filter) => (
              <button
                key={filter.value}
                type="button"
                aria-pressed={statusFilter === filter.value}
                onClick={() => setStatusFilter(filter.value)}
                className={cn(
                  "cursor-pointer rounded-md px-3 py-1.5 font-poppins text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent",
                  statusFilter === filter.value
                    ? "bg-cpc-blue-accent text-white"
                    : "text-cpc-heading-soft hover:bg-cpc-section-light hover:text-cpc-navy-text",
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-cpc-button px-3 py-2 font-poppins text-xs font-semibold text-cpc-button transition-colors hover:bg-cpc-section-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
          >
            <Printer className="h-4 w-4" aria-hidden />
            Print / Save as PDF
          </button>
          <button
            type="button"
            onClick={handleDownloadCsv}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-cpc-button px-3 py-2 font-poppins text-xs font-semibold text-white transition-colors hover:bg-cpc-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
          >
            <Download className="h-4 w-4" aria-hidden />
            Download CSV
          </button>
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto rounded-xl border border-cpc-input-border print:block md:block">
        <table className="w-full min-w-[920px] border-collapse text-left">
          <thead className="bg-cpc-section-light">
            <tr>
              <th
                scope="col"
                className="w-10 px-3 py-3 text-center font-poppins text-[11px] font-semibold tracking-[0.08em] text-cpc-heading-soft uppercase"
              >
                #
              </th>
              <th
                scope="col"
                className="px-3 py-3 font-poppins text-[11px] font-semibold tracking-[0.08em] text-cpc-heading-soft uppercase"
              >
                Subject Code
              </th>
              <th
                scope="col"
                className="min-w-[210px] px-3 py-3 font-poppins text-[11px] font-semibold tracking-[0.08em] text-cpc-heading-soft uppercase"
              >
                Descriptive Title
              </th>
              <th
                scope="col"
                aria-sort={ariaSort("time")}
                className="px-3 py-3 whitespace-nowrap"
              >
                <SortButton
                  label="Time"
                  column="time"
                  sortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={toggleSort}
                />
              </th>
              <th
                scope="col"
                className="px-3 py-3 font-poppins text-[11px] font-semibold tracking-[0.08em] text-cpc-heading-soft uppercase"
              >
                Days
              </th>
              <th
                scope="col"
                className="px-3 py-3 font-poppins text-[11px] font-semibold tracking-[0.08em] text-cpc-heading-soft uppercase"
              >
                Room (Set A)
              </th>
              <th
                scope="col"
                className="px-3 py-3 font-poppins text-[11px] font-semibold tracking-[0.08em] text-cpc-heading-soft uppercase"
              >
                Room (Set B)
              </th>
              <th scope="col" aria-sort={ariaSort("units")} className="px-3 py-3 text-center">
                <SortButton
                  label="Units"
                  column="units"
                  sortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={toggleSort}
                  align="center"
                />
              </th>
              <th scope="col" aria-sort={ariaSort("instructor")} className="px-3 py-3">
                <SortButton
                  label="Instructor"
                  column="instructor"
                  sortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={toggleSort}
                />
              </th>
              <th
                scope="col"
                className="px-3 py-3 font-poppins text-[11px] font-semibold tracking-[0.08em] text-cpc-heading-soft uppercase"
              >
                Status
              </th>
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-10 text-center">
                  <p className="font-poppins text-sm text-cpc-heading-soft">
                    No subjects match your search or filter.
                  </p>
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="mt-2 cursor-pointer rounded-md border border-cpc-button px-3 py-1.5 font-poppins text-xs font-semibold text-cpc-button transition-colors hover:bg-cpc-section-light focus-visible:outline-2 focus-visible:outline-cpc-blue-accent"
                  >
                    Clear filters
                  </button>
                </td>
              </tr>
            ) : (
              rows.map((entry, index) => (
                <tr
                  key={entry.id}
                  tabIndex={0}
                  onClick={() => onOpenEntry(entry)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onOpenEntry(entry);
                    }
                  }}
                  aria-label={`View details for ${entry.subjectCode}`}
                  className="cursor-pointer border-b border-cpc-input-border/70 transition-colors last:border-b-0 hover:bg-cpc-section-light/60 focus-visible:bg-cpc-section-light focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cpc-blue-accent"
                >
                  <td className="px-3 py-3 text-center font-poppins text-xs text-cpc-heading-soft">
                    {index + 1}
                  </td>
                  <td className="px-3 py-3">
                    <span className="font-poppins text-sm font-semibold whitespace-nowrap text-cpc-navy-text">
                      {entry.subjectCode}
                    </span>
                  </td>
                  <td className="px-3 py-3 font-poppins text-sm leading-snug text-cpc-navy-text">
                    {entry.title}
                  </td>
                  <td className="px-3 py-3 font-poppins text-sm whitespace-nowrap text-cpc-heading-soft">
                    {formatTimeRange(entry.startMin, entry.endMin)}
                  </td>
                  <td className="px-3 py-3 font-poppins text-sm whitespace-nowrap text-cpc-heading-soft">
                    {daysToLabel(entry.days)}
                  </td>
                  <td className="px-3 py-3 font-poppins text-sm whitespace-nowrap text-cpc-heading-soft">
                    {entry.roomSetA}
                  </td>
                  <td className="px-3 py-3 font-poppins text-sm whitespace-nowrap text-cpc-heading-soft">
                    {entry.roomSetB}
                  </td>
                  <td className="px-3 py-3 text-center font-poppins text-sm font-medium text-cpc-navy-text">
                    {entry.units}
                  </td>
                  <td className="px-3 py-3 font-poppins text-sm whitespace-nowrap text-cpc-heading-soft">
                    {entry.instructor}
                  </td>
                  <td className="px-3 py-3">
                    <StatusBadge status={entry.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>

          <tfoot>
            <tr className="bg-cpc-section-light/80">
              <td
                colSpan={7}
                className="px-3 py-3 text-right font-poppins text-sm font-semibold text-cpc-navy-text"
              >
                Total Units
              </td>
              <td className="px-3 py-3 text-center font-poppins text-sm font-bold text-cpc-navy-text">
                {totalUnits}
              </td>
              <td colSpan={2} />
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Mobile stacked cards */}
      <div className="space-y-3 md:hidden print:hidden">
        {rows.length === 0 ? (
          <div className="rounded-xl border border-cpc-input-border bg-white p-6 text-center">
            <p className="font-poppins text-sm text-cpc-heading-soft">
              No subjects match your search or filter.
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="mt-2 cursor-pointer rounded-md border border-cpc-button px-3 py-1.5 font-poppins text-xs font-semibold text-cpc-button"
            >
              Clear filters
            </button>
          </div>
        ) : (
          rows.map((entry) => (
            <button
              key={entry.id}
              type="button"
              onClick={() => onOpenEntry(entry)}
              className="w-full cursor-pointer rounded-xl border border-cpc-input-border bg-white p-4 text-left shadow-[0_6px_18px_rgba(27,47,158,0.05)] transition-colors hover:bg-cpc-section-light/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-poppins text-sm font-bold text-cpc-navy-text">
                    {entry.subjectCode}
                  </p>
                  <p className="mt-0.5 font-poppins text-xs leading-snug text-cpc-heading-soft">
                    {entry.title}
                  </p>
                </div>
                <StatusBadge status={entry.status} />
              </div>

              <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2">
                <div>
                  <dt className="font-poppins text-[10px] font-semibold tracking-[0.1em] text-cpc-heading-soft uppercase">
                    Time
                  </dt>
                  <dd className="font-poppins text-xs text-cpc-navy-text">
                    {formatTimeRange(entry.startMin, entry.endMin)}
                  </dd>
                </div>
                <div>
                  <dt className="font-poppins text-[10px] font-semibold tracking-[0.1em] text-cpc-heading-soft uppercase">
                    Days
                  </dt>
                  <dd className="font-poppins text-xs text-cpc-navy-text">
                    {daysToLabel(entry.days)}
                  </dd>
                </div>
                <div>
                  <dt className="font-poppins text-[10px] font-semibold tracking-[0.1em] text-cpc-heading-soft uppercase">
                    Room (A)
                  </dt>
                  <dd className="font-poppins text-xs text-cpc-navy-text">{entry.roomSetA}</dd>
                </div>
                <div>
                  <dt className="font-poppins text-[10px] font-semibold tracking-[0.1em] text-cpc-heading-soft uppercase">
                    Room (B)
                  </dt>
                  <dd className="font-poppins text-xs text-cpc-navy-text">{entry.roomSetB}</dd>
                </div>
                <div>
                  <dt className="font-poppins text-[10px] font-semibold tracking-[0.1em] text-cpc-heading-soft uppercase">
                    Instructor
                  </dt>
                  <dd className="font-poppins text-xs text-cpc-navy-text">{entry.instructor}</dd>
                </div>
                <div>
                  <dt className="font-poppins text-[10px] font-semibold tracking-[0.1em] text-cpc-heading-soft uppercase">
                    Units
                  </dt>
                  <dd className="font-poppins text-xs text-cpc-navy-text">{entry.units}</dd>
                </div>
              </dl>
            </button>
          ))
        )}

        <div className="flex items-center justify-between rounded-xl border border-cpc-input-border bg-cpc-section-light px-4 py-3 font-poppins text-sm font-semibold text-cpc-navy-text">
          <span>Total Units</span>
          <span>{totalUnits}</span>
        </div>
      </div>

      {filtersActive && (
        <p className="font-poppins text-xs text-cpc-heading-soft print:hidden" role="status">
          Showing {rows.length} of {schedule.entries.length} subjects · {totalUnits} total units
        </p>
      )}
    </div>
  );
}
