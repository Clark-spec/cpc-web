import { Search, X } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  COURSE_CODES,
  COURSE_LABELS,
  getSections,
  yearLabel,
} from "@/components/features/admin/student-accounts/mockStudentAccounts";
import {
  CARD_SHELL,
  FIELD_BASE,
  LABEL_BASE,
  SELECT_BASE,
} from "@/components/features/admin/student-accounts/shared";
import type {
  StudentsFilters,
  YearLevel,
} from "@/components/features/admin/student-accounts/types";

const YEAR_OPTIONS: YearLevel[] = [1, 2, 3, 4];

type StudentsToolbarProps = {
  filters: StudentsFilters;
  setFilter: <K extends keyof StudentsFilters>(
    key: K,
    value: StudentsFilters[K],
  ) => void;
  resetFilters: () => void;
  hasActiveFilters: boolean;
};

/**
 * Directory controls: instant search plus course, year and section filters.
 * The section list only makes sense inside one program, so it stays disabled
 * until a course is picked.
 */
export function StudentsToolbar({
  filters,
  setFilter,
  resetFilters,
  hasActiveFilters,
}: StudentsToolbarProps) {
  const sections =
    filters.course === "all" ? [] : getSections(filters.course, filters.year);
  const sectionDisabled = filters.course === "all";

  return (
    <section aria-label="Student search and filters" className={cn(CARD_SHELL, "p-4")}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12 lg:items-start">
        <div className="sm:col-span-2 lg:col-span-4">
          <label htmlFor="student-search" className={LABEL_BASE}>
            Search
          </label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-cpc-muted-blue"
              aria-hidden
            />
            <input
              id="student-search"
              type="search"
              value={filters.query}
              onChange={(event) => setFilter("query", event.target.value)}
              placeholder="Name, student ID or email"
              className={cn(FIELD_BASE, "pl-8")}
            />
          </div>
        </div>

        <div className="lg:col-span-3">
          <label htmlFor="student-course" className={LABEL_BASE}>
            Course
          </label>
          <select
            id="student-course"
            value={filters.course}
            onChange={(event) =>
              setFilter("course", event.target.value as StudentsFilters["course"])
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

        <div className="lg:col-span-2">
          <label htmlFor="student-year" className={LABEL_BASE}>
            Year level
          </label>
          <select
            id="student-year"
            value={filters.year}
            onChange={(event) =>
              setFilter(
                "year",
                event.target.value === "all"
                  ? "all"
                  : (Number(event.target.value) as YearLevel),
              )
            }
            className={SELECT_BASE}
          >
            <option value="all">All year levels</option>
            {YEAR_OPTIONS.map((year) => (
              <option key={year} value={year}>
                {yearLabel(year)}
              </option>
            ))}
          </select>
        </div>

        <div className="lg:col-span-3">
          <label htmlFor="student-section" className={LABEL_BASE}>
            Section
          </label>
          <select
            id="student-section"
            value={filters.section}
            disabled={sectionDisabled}
            onChange={(event) => setFilter("section", event.target.value)}
            className={SELECT_BASE}
            title={sectionDisabled ? "Choose a course first" : undefined}
          >
            {sectionDisabled ? (
              <option value="all">Select a course first</option>
            ) : (
              <>
                <option value="all">All sections</option>
                {sections.map((section) => (
                  <option key={section} value={section}>
                    {section}
                  </option>
                ))}
              </>
            )}
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
