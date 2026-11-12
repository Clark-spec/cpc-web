import { Search, X } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  COMPLAINT_CATEGORIES,
  COMPLAINT_STATUS_LABELS,
} from "@/components/features/admin/complaints/mockComplaints";
import type {
  ComplaintFilters,
  ComplaintStatus,
  ComplaintStatusFilter,
} from "@/components/features/admin/complaints/types";

const FIELD_BASE =
  "w-full rounded-lg border border-cpc-input-border bg-white px-3 py-2 font-poppins text-xs text-cpc-navy-text placeholder:text-cpc-placeholder transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent";

const LABEL_BASE =
  "mb-1 block font-poppins text-[10px] font-bold tracking-[0.12em] text-cpc-heading-soft uppercase";

const SELECT_BASE = cn(FIELD_BASE, "cursor-pointer");

const STATUS_OPTIONS: ComplaintStatus[] = ["pending", "in_review", "resolved"];

type ComplaintsToolbarProps = {
  filters: ComplaintFilters;
  setFilter: <K extends keyof ComplaintFilters>(
    key: K,
    value: ComplaintFilters[K],
  ) => void;
  resetFilters: () => void;
  hasActiveFilters: boolean;
};

/**
 * Queue controls shared with the clearance desk (spec §3): search, status and
 * category selects, a filed-date range, and a way back out of every filter.
 */
export function ComplaintsToolbar({
  filters,
  setFilter,
  resetFilters,
  hasActiveFilters,
}: ComplaintsToolbarProps) {
  return (
    <section
      aria-label="Complaint search and filters"
      className="rounded-2xl border border-cpc-tile-border/70 bg-white p-4 shadow-[0_18px_50px_rgba(15,36,104,0.22)]"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12 lg:items-start">
        <div className="sm:col-span-2 lg:col-span-4">
          <label htmlFor="complaint-search" className={LABEL_BASE}>
            Search
          </label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-cpc-muted-blue"
              aria-hidden
            />
            <input
              id="complaint-search"
              type="search"
              value={filters.query}
              onChange={(event) => setFilter("query", event.target.value)}
              placeholder="Reference no., student name or subject"
              className={cn(FIELD_BASE, "pl-8")}
            />
          </div>
        </div>

        <div className="lg:col-span-2">
          <label htmlFor="complaint-status" className={LABEL_BASE}>
            Status
          </label>
          <select
            id="complaint-status"
            value={filters.status}
            onChange={(event) =>
              setFilter("status", event.target.value as ComplaintStatusFilter)
            }
            className={SELECT_BASE}
          >
            <option value="all">All statuses</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {COMPLAINT_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </div>

        <div className="lg:col-span-3">
          <label htmlFor="complaint-category" className={LABEL_BASE}>
            Category
          </label>
          <select
            id="complaint-category"
            value={filters.category}
            onChange={(event) => setFilter("category", event.target.value)}
            className={SELECT_BASE}
          >
            <option value="all">All categories</option>
            {COMPLAINT_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <fieldset className="min-w-0 lg:col-span-3">
          <legend className={LABEL_BASE}>Date filed</legend>
          <div className="flex flex-wrap items-center gap-2">
            <label className="sr-only" htmlFor="complaint-from">
              From date
            </label>
            <input
              id="complaint-from"
              type="date"
              value={filters.from}
              max={filters.to || undefined}
              onChange={(event) => setFilter("from", event.target.value)}
              className={cn(FIELD_BASE, "min-w-[9.5rem] flex-1")}
            />
            <span aria-hidden className="font-poppins text-xs text-cpc-heading-soft">
              –
            </span>
            <label className="sr-only" htmlFor="complaint-to">
              To date
            </label>
            <input
              id="complaint-to"
              type="date"
              value={filters.to}
              min={filters.from || undefined}
              onChange={(event) => setFilter("to", event.target.value)}
              className={cn(FIELD_BASE, "min-w-[9.5rem] flex-1")}
            />
          </div>
        </fieldset>

        <div className="flex justify-end sm:col-span-2 lg:col-span-12">
          <button
            type="button"
            onClick={resetFilters}
            disabled={!hasActiveFilters}
            className="cpc-btn cpc-btn-secondary cpc-btn-sm"
          >
            <X className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Clear filters
          </button>
        </div>
      </div>
    </section>
  );
}
