import { useMemo } from "react";
import type { RefObject } from "react";
import { Check, Download, Kanban, RefreshCw, Search, Table2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { useClearanceAdmin } from "../context/ClearanceAdminContext";
import { downloadCsv, rowsToCsv } from "../utils/csv";
import type { QueueSort, QueueView } from "../types";

const FIELD_BASE =
  "w-full rounded-lg border border-cpc-input-border bg-white px-3 py-2 font-poppins text-xs text-cpc-navy-text placeholder:text-cpc-placeholder transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent";

const LABEL_BASE =
  "mb-1 block font-poppins text-[10px] font-bold tracking-[0.12em] text-cpc-heading-soft uppercase";

const SELECT_BASE = cn(FIELD_BASE, "cursor-pointer");

const SORT_OPTIONS: { value: QueueSort; label: string }[] = [
  { value: "oldest", label: "Oldest first" },
  { value: "newest", label: "Newest first" },
  { value: "name", label: "Name A–Z" },
];

const VIEW_OPTIONS: { value: QueueView; label: string; icon: typeof Table2 }[] = [
  { value: "table", label: "Table", icon: Table2 },
  { value: "board", label: "Board", icon: Kanban },
];

type QueueToolbarProps = {
  /** The page passes this so the `/` shortcut can focus the search box. */
  searchInputRef?: RefObject<HTMLInputElement | null>;
};

/**
 * Queue controls (spec §3): search, section/date filters, toggles, sort,
 * view switch, CSV export and manual refresh. Everything reads and writes
 * `filters` through the context so the URL stays in sync.
 */
export function QueueToolbar({ searchInputRef }: QueueToolbarProps) {
  const { filters, setFilter, records, visibleRows, refresh, refreshing } = useClearanceAdmin();

  const sections = useMemo(
    () => Array.from(new Set(records.map((record) => record.section))).sort(),
    [records],
  );

  const toggleChip = (active: boolean) =>
    cn(
      "inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-2 font-poppins text-xs font-semibold whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent",
      active
        ? "border-cpc-blue-accent bg-cpc-blue-accent text-white"
        : "border-cpc-tile-border/70 bg-white text-cpc-navy-text hover:bg-cpc-section-light",
    );

  function handleExport() {
    const csv = rowsToCsv(visibleRows);
    downloadCsv(`clearance-queue-${new Date().toISOString().slice(0, 10)}.csv`, csv);
  }

  return (
    <section
      aria-label="Queue search and view controls"
      className="rounded-2xl border border-cpc-tile-border/70 bg-white p-4 shadow-[0_18px_50px_rgba(15,36,104,0.22)]"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12 lg:items-start">
        <div className="sm:col-span-2 lg:col-span-4">
          <label htmlFor="queue-search" className={LABEL_BASE}>
            Search
          </label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-cpc-muted-blue"
              aria-hidden
            />
            <input
              id="queue-search"
              ref={searchInputRef}
              type="search"
              value={filters.query}
              onChange={(event) => setFilter("query", event.target.value)}
              placeholder="Name, ID (e.g. STU-2026-0182) or section"
              className={cn(FIELD_BASE, "pl-8")}
            />
          </div>
        </div>

        <div className="lg:col-span-2">
          <label htmlFor="queue-section" className={LABEL_BASE}>
            Section
          </label>
          <select
            id="queue-section"
            value={filters.section}
            onChange={(event) => setFilter("section", event.target.value)}
            className={SELECT_BASE}
          >
            <option value="all">All sections</option>
            {sections.map((section) => (
              <option key={section} value={section}>
                {section}
              </option>
            ))}
          </select>
        </div>

        <fieldset className="min-w-0 lg:col-span-3">
          <legend className={LABEL_BASE}>Request date</legend>
          <div className="flex flex-wrap items-center gap-2">
            <label className="sr-only" htmlFor="queue-from">
              From date
            </label>
            <input
              id="queue-from"
              type="date"
              value={filters.from}
              max={filters.to || undefined}
              onChange={(event) => setFilter("from", event.target.value)}
              className={cn(FIELD_BASE, "min-w-[9.5rem] flex-1")}
            />
            <span aria-hidden className="font-poppins text-xs text-cpc-heading-soft">
              –
            </span>
            <label className="sr-only" htmlFor="queue-to">
              To date
            </label>
            <input
              id="queue-to"
              type="date"
              value={filters.to}
              min={filters.from || undefined}
              onChange={(event) => setFilter("to", event.target.value)}
              className={cn(FIELD_BASE, "min-w-[9.5rem] flex-1")}
            />
          </div>
        </fieldset>

        <div className="lg:col-span-3">
          <label htmlFor="queue-sort" className={LABEL_BASE}>
            Sort
          </label>
          <select
            id="queue-sort"
            value={filters.sort}
            onChange={(event) => setFilter("sort", event.target.value as QueueSort)}
            className={SELECT_BASE}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-7">
          <button
            type="button"
            aria-pressed={filters.overdueOnly}
            onClick={() => setFilter("overdueOnly", !filters.overdueOnly)}
            className={toggleChip(filters.overdueOnly)}
          >
            {filters.overdueOnly && <Check className="h-3.5 w-3.5 shrink-0" aria-hidden />}
            Overdue only
          </button>
          <button
            type="button"
            aria-pressed={filters.withNotesOnly}
            onClick={() => setFilter("withNotesOnly", !filters.withNotesOnly)}
            className={toggleChip(filters.withNotesOnly)}
          >
            {filters.withNotesOnly && <Check className="h-3.5 w-3.5 shrink-0" aria-hidden />}
            Has student note
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:col-span-2 lg:col-span-5 lg:justify-end">
          <div
            role="group"
            aria-label="Queue view"
            className="inline-flex overflow-hidden rounded-lg border border-cpc-tile-border"
          >
            {VIEW_OPTIONS.map((option) => {
              const active = filters.view === option.value;
              const Icon = option.icon;
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setFilter("view", option.value)}
                  className={cn(
                    "inline-flex cursor-pointer items-center gap-1.5 px-3 py-2 font-poppins text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent",
                    active
                      ? "bg-cpc-blue-accent text-white"
                      : "bg-white text-cpc-navy-text hover:bg-cpc-section-light",
                  )}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  {option.label}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleExport}
            disabled={visibleRows.length === 0}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-cpc-tile-border bg-white px-3 py-2 font-poppins text-xs font-semibold text-cpc-navy-text transition-colors hover:bg-cpc-section-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Export CSV
          </button>

          <button
            type="button"
            onClick={() => void refresh("manual")}
            disabled={refreshing}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-cpc-tile-border bg-white px-3 py-2 font-poppins text-xs font-semibold text-cpc-navy-text transition-colors hover:bg-cpc-section-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              className={cn("h-3.5 w-3.5 shrink-0", refreshing && "animate-spin motion-reduce:animate-none")}
              aria-hidden
            />
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>
    </section>
  );
}
