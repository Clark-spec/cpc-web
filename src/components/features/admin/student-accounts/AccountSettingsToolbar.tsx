import { Search, X } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  COURSE_CODES,
  COURSE_LABELS,
} from "@/components/features/admin/student-accounts/mockStudentAccounts";
import { ACCOUNT_STATUS_LABELS } from "@/components/features/admin/student-accounts/labels";
import {
  CARD_SHELL,
  FIELD_BASE,
  LABEL_BASE,
  SELECT_BASE,
} from "@/components/features/admin/student-accounts/shared";
import type {
  AccountFilters,
  AccountStatus,
  AccountStatusFilter,
} from "@/components/features/admin/student-accounts/types";

const STATUS_OPTIONS: AccountStatus[] = ["active", "disabled", "locked"];

type AccountSettingsToolbarProps = {
  filters: AccountFilters;
  setFilter: <K extends keyof AccountFilters>(key: K, value: AccountFilters[K]) => void;
  resetFilters: () => void;
  hasActiveFilters: boolean;
};

/** Search plus status and course filters for the account table. */
export function AccountSettingsToolbar({
  filters,
  setFilter,
  resetFilters,
  hasActiveFilters,
}: AccountSettingsToolbarProps) {
  return (
    <section aria-label="Account search and filters" className={cn(CARD_SHELL, "p-4")}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12 lg:items-start">
        <div className="sm:col-span-2 lg:col-span-5">
          <label htmlFor="account-search" className={LABEL_BASE}>
            Search
          </label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-cpc-muted-blue"
              aria-hidden
            />
            <input
              id="account-search"
              type="search"
              value={filters.query}
              onChange={(event) => setFilter("query", event.target.value)}
              placeholder="Student name, ID or email"
              className={cn(FIELD_BASE, "pl-8")}
            />
          </div>
        </div>

        <div className="lg:col-span-3">
          <label htmlFor="account-status" className={LABEL_BASE}>
            Account status
          </label>
          <select
            id="account-status"
            value={filters.status}
            onChange={(event) =>
              setFilter("status", event.target.value as AccountStatusFilter)
            }
            className={SELECT_BASE}
          >
            <option value="all">All statuses</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {ACCOUNT_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </div>

        <div className="lg:col-span-4">
          <label htmlFor="account-course" className={LABEL_BASE}>
            Course
          </label>
          <select
            id="account-course"
            value={filters.course}
            onChange={(event) =>
              setFilter("course", event.target.value as AccountFilters["course"])
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

        <div className="flex justify-end sm:col-span-2 lg:col-span-12">
          <button
            type="button"
            onClick={resetFilters}
            disabled={!hasActiveFilters}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-cpc-tile-border bg-white px-3 py-2 font-poppins text-xs font-semibold text-cpc-navy-text transition-colors hover:bg-cpc-section-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Clear filters
          </button>
        </div>
      </div>
    </section>
  );
}
