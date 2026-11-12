import { useMemo, useRef } from "react";
import type { KeyboardEvent as ReactKeyboardEvent, RefObject } from "react";
import {
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  Clock3,
  Download,
  Filter,
  FilterX,
  Kanban,
  RefreshCw,
  Search,
  Table2,
  Undo2,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useClearanceAdmin } from "@/components/features/admin/clearance/ClearanceAdminContext";
import { downloadCsv, rowsToCsv } from "@/components/features/admin/clearance/csv";
import { OFFICE_LABELS, OFFICE_ORDER, OFFICE_TITLES } from "@/components/features/admin/clearance/officeChecks";
import type {
  OfficeFilter,
  QueueSort,
  QueueView,
  StatusFilter,
} from "@/components/features/admin/clearance/types";

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
 * Unified Clearance Queue Hub.
 * Integrates search, department routing, queue status filters, sorting,
 * date picker, view switching and export tools in one cohesive glass card.
 */
export function QueueToolbar({ searchInputRef }: QueueToolbarProps) {
  const {
    filters,
    setFilter,
    records,
    visibleRows,
    rows,
    officeLoad,
    isSuperAdmin,
    homeOffice,
    staff,
    refresh,
    refreshing,
    hasActiveFilters,
    resetFilters,
  } = useClearanceAdmin();

  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const sections = useMemo(
    () => Array.from(new Set(records.map((record) => record.section))).sort(),
    [records],
  );

  const tabs = useMemo(
    () => [
      {
        value: "all" as OfficeFilter,
        label: "All Offices",
        pending: officeLoad.reduce((sum, load) => sum + load.pending, 0),
      },
      ...OFFICE_ORDER.map((office) => ({
        value: office as OfficeFilter,
        label: OFFICE_LABELS[office],
        pending: officeLoad.find((load) => load.office === office)?.pending ?? 0,
      })),
    ],
    [officeLoad],
  );

  const statusPills = useMemo(
    () => [
      {
        value: "requested" as StatusFilter,
        label: "Pending",
        count: rows.filter((row) => row.status === "requested").length,
        icon: Clock3,
        activeClass: "bg-amber-500 text-white shadow-xs border-amber-600",
        inactiveClass: "bg-amber-50/80 text-amber-800 border-amber-200/80 hover:bg-amber-100/60",
        badgeActiveClass: "bg-white/25 text-white",
        badgeInactiveClass: "bg-amber-200/60 text-amber-900",
      },
      {
        value: "signed" as StatusFilter,
        label: "Signed",
        count: rows.filter((row) => row.status === "signed").length,
        icon: CheckCircle2,
        activeClass: "bg-emerald-600 text-white shadow-xs border-emerald-700",
        inactiveClass: "bg-emerald-50/80 text-emerald-800 border-emerald-200/80 hover:bg-emerald-100/60",
        badgeActiveClass: "bg-white/25 text-white",
        badgeInactiveClass: "bg-emerald-200/60 text-emerald-900",
      },
      {
        value: "rejected" as StatusFilter,
        label: "Rejected",
        count: rows.filter((row) => row.status === "rejected").length,
        icon: Undo2,
        activeClass: "bg-rose-500 text-white shadow-xs border-rose-600",
        inactiveClass: "bg-rose-50/80 text-rose-800 border-rose-200/80 hover:bg-rose-100/60",
        badgeActiveClass: "bg-white/25 text-white",
        badgeInactiveClass: "bg-rose-200/60 text-rose-900",
      },
      {
        value: "all" as StatusFilter,
        label: "All Records",
        count: rows.length,
        icon: Filter,
        activeClass: "bg-cpc-navy-text text-white shadow-xs border-cpc-navy-text",
        inactiveClass: "bg-white/90 text-cpc-heading-soft border-admin-border/70 hover:bg-white hover:text-cpc-navy-text",
        badgeActiveClass: "bg-white/25 text-white",
        badgeInactiveClass: "bg-admin-page text-admin-muted",
      },
    ],
    [rows],
  );

  const activeIndex = Math.max(
    0,
    tabs.findIndex((tab) => tab.value === filters.office),
  );

  function handleKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const step = event.key === "ArrowRight" ? 1 : -1;
    const next = (activeIndex + step + tabs.length) % tabs.length;
    setFilter("office", tabs[next].value);
    tabRefs.current[next]?.focus();
  }

  function handleExport() {
    const csv = rowsToCsv(visibleRows);
    downloadCsv(`clearance-queue-${new Date().toISOString().slice(0, 10)}.csv`, csv);
  }

  const tabBase =
    "inline-flex cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-1.5 font-poppins text-xs font-semibold whitespace-nowrap transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent";

  return (
    <section
      aria-label="Queue search and view controls"
      className="space-y-4 rounded-2xl border border-white/80 bg-white/85 p-5 shadow-[0_8px_30px_rgb(15,36,104,0.04)] backdrop-blur-md sm:p-6"
    >
      {/* 1. Header Bar: Search input + Selects + View Switcher + Action Buttons */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Search Bar */}
        <div className="relative min-w-0 flex-1 lg:max-w-md">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-cpc-blue-accent"
            aria-hidden
          />
          <input
            id="queue-search"
            ref={searchInputRef}
            type="search"
            value={filters.query}
            onChange={(event) => setFilter("query", event.target.value)}
            placeholder="Search student name, ID (e.g. STU-2026-0182) or section..."
            className="h-10 w-full rounded-xl border border-white/80 bg-white/90 pl-10 pr-10 font-poppins text-xs text-cpc-navy-text shadow-xs placeholder:text-admin-muted/70 outline-none transition-all hover:border-cpc-blue-accent/30 focus:border-cpc-blue-accent focus:ring-2 focus:ring-cpc-blue-accent/15"
          />
          {filters.query ? (
            <button
              type="button"
              onClick={() => setFilter("query", "")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer rounded-md p-1 text-admin-muted transition-colors hover:text-admin-text"
            >
              <X className="h-3.5 w-3.5" aria-hidden />
            </button>
          ) : (
            <span
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded border border-admin-border/60 bg-admin-page/70 px-1.5 py-0.5 font-poppins text-[10px] font-bold text-admin-muted"
              aria-hidden
            >
              /
            </span>
          )}
        </div>

        {/* Right Controls: Section + Sort + View switcher + Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Section dropdown */}
          <div className="flex items-center gap-1.5">
            <label
              htmlFor="queue-section"
              className="font-poppins text-[11px] font-semibold text-admin-muted"
            >
              Section:
            </label>
            <select
              id="queue-section"
              value={filters.section}
              onChange={(event) => setFilter("section", event.target.value)}
              className="h-10 cursor-pointer rounded-xl border border-white/80 bg-white/90 px-3 font-poppins text-xs font-semibold text-cpc-navy-text shadow-xs outline-none transition-all hover:border-cpc-blue-accent/40 focus:border-cpc-blue-accent focus:ring-2 focus:ring-cpc-blue-accent/15"
            >
              <option value="all">All sections</option>
              {sections.map((section) => (
                <option key={section} value={section}>
                  {section}
                </option>
              ))}
            </select>
          </div>

          {/* Sort dropdown */}
          <div className="flex items-center gap-1.5">
            <label
              htmlFor="queue-sort"
              className="font-poppins text-[11px] font-semibold text-admin-muted"
            >
              Sort:
            </label>
            <select
              id="queue-sort"
              value={filters.sort}
              onChange={(event) => setFilter("sort", event.target.value as QueueSort)}
              className="h-10 cursor-pointer rounded-xl border border-white/80 bg-white/90 px-3 font-poppins text-xs font-semibold text-cpc-navy-text shadow-xs outline-none transition-all hover:border-cpc-blue-accent/40 focus:border-cpc-blue-accent focus:ring-2 focus:ring-cpc-blue-accent/15"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* View toggle (Table / Board) */}
          <div
            role="group"
            aria-label="Queue view"
            className="inline-flex overflow-hidden rounded-xl border border-white/80 bg-white/80 p-0.5 shadow-xs"
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
                    "inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-2 font-poppins text-xs font-semibold transition-all",
                    active
                      ? "bg-cpc-blue-accent text-white shadow-xs"
                      : "text-cpc-navy-text hover:bg-white/60",
                  )}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  {option.label}
                </button>
              );
            })}
          </div>

          {/* Export CSV button */}
          <button
            type="button"
            onClick={handleExport}
            disabled={visibleRows.length === 0}
            className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-xl border border-white/80 bg-white/90 px-3.5 font-poppins text-xs font-semibold text-cpc-navy-text shadow-xs transition-all hover:border-cpc-blue-accent/40 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Export CSV
          </button>

          {/* Refresh button */}
          <button
            type="button"
            onClick={() => void refresh("manual")}
            disabled={refreshing}
            className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-xl border border-white/80 bg-white/90 px-3.5 font-poppins text-xs font-semibold text-cpc-navy-text shadow-xs transition-all hover:border-cpc-blue-accent/40 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              className={cn("h-3.5 w-3.5 shrink-0", refreshing && "animate-spin motion-reduce:animate-none")}
              aria-hidden
            />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* 2. Middle Row: Department / Office Tabs */}
      <div className="border-t border-admin-border/50 pt-3.5">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <div className="flex shrink-0 items-center gap-2 sm:w-28">
            <Building2 className="h-4 w-4 text-cpc-blue-accent" aria-hidden />
            <span className="font-poppins text-[11px] font-bold tracking-wider text-admin-muted uppercase">
              Office:
            </span>
          </div>

          {isSuperAdmin ? (
            <div
              role="tablist"
              aria-label="Office"
              onKeyDown={handleKeyDown}
              className="admin-scrollbar flex flex-1 flex-wrap gap-2 overflow-x-auto pb-0.5"
            >
              {tabs.map((tab, index) => {
                const active = filters.office === tab.value;
                return (
                  <button
                    key={tab.value}
                    ref={(element) => {
                      tabRefs.current[index] = element;
                    }}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    tabIndex={active ? 0 : -1}
                    onClick={() => setFilter("office", tab.value)}
                    className={cn(
                      tabBase,
                      active
                        ? "border-cpc-blue-accent bg-cpc-blue-accent text-white shadow-xs"
                        : "border-white/90 bg-white/90 text-cpc-navy-text shadow-xs hover:border-cpc-blue-accent/30 hover:bg-white",
                    )}
                  >
                    {tab.label}
                    <span
                      aria-live="polite"
                      className={cn(
                        "inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] leading-none font-bold tabular-nums",
                        active ? "bg-white/25 text-white" : "bg-cpc-section-light text-cpc-blue-accent",
                      )}
                    >
                      {tab.pending}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="inline-flex w-fit items-center gap-2 rounded-xl border border-cpc-blue-accent/30 bg-cpc-blue-accent/10 px-3 py-1.5 font-poppins text-xs font-bold text-cpc-blue-accent">
              <Building2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {homeOffice === "dean" && staff.title
                ? staff.title
                : homeOffice
                  ? OFFICE_TITLES[homeOffice]
                  : "My Office"}
            </p>
          )}
        </div>
      </div>

      {/* 3. Bottom Row: Queue Status + Quick Toggles + Date Picker + Results Count */}
      <div className="border-t border-admin-border/50 pt-3.5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Status & Secondary Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex shrink-0 items-center gap-2 sm:w-28">
              <Filter className="h-4 w-4 text-admin-muted" aria-hidden />
              <span className="font-poppins text-[11px] font-bold tracking-wider text-admin-muted uppercase">
                Status:
              </span>
            </div>

            {/* Status Pills */}
            <div role="group" aria-label="Filter by status" className="flex flex-wrap gap-2">
              {statusPills.map((pill) => {
                const active = filters.status === pill.value;
                const Icon = pill.icon;
                return (
                  <button
                    key={pill.value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setFilter("status", pill.value)}
                    className={cn(tabBase, active ? pill.activeClass : pill.inactiveClass)}
                  >
                    <Icon className="h-3 w-3 shrink-0" aria-hidden />
                    {pill.label}
                    <span
                      className={cn(
                        "inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] leading-none font-bold tabular-nums",
                        active ? pill.badgeActiveClass : pill.badgeInactiveClass,
                      )}
                    >
                      {pill.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Subtle Divider */}
            <span className="hidden h-5 w-px bg-admin-border/60 sm:inline-block" aria-hidden />

            {/* Quick Toggle: Overdue */}
            <button
              type="button"
              aria-pressed={filters.overdueOnly}
              onClick={() => setFilter("overdueOnly", !filters.overdueOnly)}
              className={cn(
                "inline-flex cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-1.5 font-poppins text-xs font-semibold shadow-xs transition-all",
                filters.overdueOnly
                  ? "border-amber-400 bg-amber-50 text-amber-800 ring-1 ring-amber-300/60"
                  : "border-white/80 bg-white/80 text-cpc-navy-text hover:border-cpc-blue-accent/30 hover:bg-white",
              )}
            >
              {filters.overdueOnly && <Check className="h-3.5 w-3.5 text-amber-600" aria-hidden />}
              Overdue only
            </button>

            {/* Quick Toggle: Notes */}
            <button
              type="button"
              aria-pressed={filters.withNotesOnly}
              onClick={() => setFilter("withNotesOnly", !filters.withNotesOnly)}
              className={cn(
                "inline-flex cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-1.5 font-poppins text-xs font-semibold shadow-xs transition-all",
                filters.withNotesOnly
                  ? "border-cpc-blue-accent bg-cpc-blue-accent/10 text-cpc-blue-accent ring-1 ring-cpc-blue-accent/30"
                  : "border-white/80 bg-white/80 text-cpc-navy-text hover:border-cpc-blue-accent/30 hover:bg-white",
              )}
            >
              {filters.withNotesOnly && <Check className="h-3.5 w-3.5 text-cpc-blue-accent" aria-hidden />}
              Has student note
            </button>

            {/* Inline compact Date Range Picker */}
            <div className="flex items-center gap-1.5 rounded-xl border border-white/80 bg-white/80 px-2.5 py-1 shadow-xs">
              <Calendar className="h-3.5 w-3.5 shrink-0 text-admin-muted" aria-hidden />
              <span className="font-poppins text-[11px] font-medium text-admin-muted">Date:</span>
              <input
                id="queue-from"
                type="date"
                value={filters.from}
                max={filters.to || undefined}
                onChange={(event) => setFilter("from", event.target.value)}
                aria-label="From date"
                className="h-7 w-28 rounded-lg border border-admin-border/50 bg-white px-1.5 font-poppins text-[11px] text-cpc-navy-text outline-none transition-all focus:border-cpc-blue-accent"
              />
              <span aria-hidden className="font-poppins text-xs text-admin-muted">
                –
              </span>
              <input
                id="queue-to"
                type="date"
                value={filters.to}
                min={filters.from || undefined}
                onChange={(event) => setFilter("to", event.target.value)}
                aria-label="To date"
                className="h-7 w-28 rounded-lg border border-admin-border/50 bg-white px-1.5 font-poppins text-[11px] text-cpc-navy-text outline-none transition-all focus:border-cpc-blue-accent"
              />
              {(filters.from || filters.to) && (
                <button
                  type="button"
                  onClick={() => {
                    setFilter("from", "");
                    setFilter("to", "");
                  }}
                  aria-label="Clear date range"
                  className="cursor-pointer p-0.5 text-admin-muted hover:text-admin-text"
                >
                  <X className="h-3 w-3" aria-hidden />
                </button>
              )}
            </div>
          </div>

          {/* Right: Reset Filters + Live Results Count Badge */}
          <div className="flex items-center gap-2 lg:justify-end">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex cursor-pointer items-center gap-1 rounded-xl border border-admin-border/60 bg-white px-3 py-1.5 font-poppins text-[11px] font-semibold text-admin-muted shadow-xs transition-all hover:border-admin-secondary/40 hover:text-admin-text"
              >
                <FilterX className="h-3.5 w-3.5" aria-hidden />
                Reset filters
              </button>
            )}

            <span className="inline-flex items-center rounded-full border border-admin-border/60 bg-admin-page/80 px-3.5 py-1 font-poppins text-[11px] font-semibold text-admin-muted">
              {visibleRows.length} {visibleRows.length === 1 ? "request" : "requests"}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
