import { Search, X } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  COURSE_CODES,
  COURSE_LABELS,
} from "@/components/features/admin/student-accounts/mockStudentAccounts";
import {
  CORRECTION_STATUS_LABELS,
} from "@/components/features/admin/student-accounts/labels";
import {
  CARD_SHELL,
  FIELD_BASE,
  LABEL_BASE,
  SELECT_BASE,
} from "@/components/features/admin/student-accounts/shared";
import type {
  CorrectionFilters,
  CorrectionStatus,
  CorrectionStatusFilter,
} from "@/components/features/admin/student-accounts/types";

const STATUS_OPTIONS: CorrectionStatus[] = ["pending", "approved", "rejected"];

type ProfileCorrectionsToolbarProps = {
  filters: CorrectionFilters;
  setFilter: <K extends keyof CorrectionFilters>(
    key: K,
    value: CorrectionFilters[K],
  ) => void;
  resetFilters: () => void;
  hasActiveFilters: boolean;
};

/** Search, status, course and submitted-date controls for the correction queue. */
export function ProfileCorrectionsToolbar({
  filters,
  setFilter,
  resetFilters,
  hasActiveFilters,
}: ProfileCorrectionsToolbarProps) {
  return (
    <section
      aria-label="Profile correction search and filters"
      className={cn(CARD_SHELL, "p-4")}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12 lg:items-start">
        <div className="sm:col-span-2 lg:col-span-4">
          <label htmlFor="correction-search" className={LABEL_BASE}>
            Search
          </label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-cpc-muted-blue"
              aria-hidden
            />
            <input
              id="correction-search"
              type="search"
              value={filters.query}
              onChange={(event) => setFilter("query", event.target.value)}
              placeholder="Request ID, student name or ID, field"
              className={cn(FIELD_BASE, "pl-8")}
            />
          </div>
        </div>

        <div className="lg:col-span-2">
          <label htmlFor="correction-status" className={LABEL_BASE}>
            Status
          </label>
          <select
            id="correction-status"
            value={filters.status}
            onChange={(event) =>
              setFilter("status", event.target.value as CorrectionStatusFilter)
            }
            className={SELECT_BASE}
          >
            <option value="all">All statuses</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {CORRECTION_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </div>

        <div className="lg:col-span-3">
          <label htmlFor="correction-course" className={LABEL_BASE}>
            Course
          </label>
          <select
            id="correction-course"
            value={filters.course}
            onChange={(event) =>
              setFilter("course", event.target.value as CorrectionFilters["course"])
            }
            className={SELECT_BASE}
          >
            <option value="all">All courses</option>
            {COURSE_CODES.map((course) => (
              <option key={course} value={course}>
                {course} — {COURSE_LABELS[course]}
              </option>
            ))}
          </select>
        </div>

        <fieldset className="min-w-0 lg:col-span-3">
          <legend className={LABEL_BASE}>Date submitted</legend>
          <div className="flex flex-wrap items-center gap-2">
            <label className="sr-only" htmlFor="correction-from">
              From date
            </label>
            <input
              id="correction-from"
              type="date"
              value={filters.from}
              max={filters.to || undefined}
              onChange={(event) => setFilter("from", event.target.value)}
              className={cn(FIELD_BASE, "min-w-[9.5rem] flex-1")}
            />
            <span aria-hidden className="font-poppins text-xs text-cpc-heading-soft">
              –
            </span>
            <label className="sr-only" htmlFor="correction-to">
              To date
            </label>
            <input
              id="correction-to"
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
