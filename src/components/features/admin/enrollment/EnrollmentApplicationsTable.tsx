import { useMemo, useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  Search,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/format";
import { EmptyState } from "@/components/common/display/EmptyState";
import { ApplicationStatusBadge } from "@/components/features/admin/enrollment/ApplicationStatusBadge";
import {
  ENROLLMENT_STATUS_LABELS,
  type EnrollmentApplication,
  type EnrollmentApplicationStatus,
  type EnrollmentStatusFilter,
} from "@/services/enrollmentAdmin";

const PAGE_SIZE = 8;

const FILTERS: Array<{ id: EnrollmentStatusFilter; label: string }> = [
  { id: "all", label: "All Applications" },
  { id: "pending", label: ENROLLMENT_STATUS_LABELS.pending },
  { id: "for-review", label: ENROLLMENT_STATUS_LABELS["for-review"] },
  { id: "needs-requirements", label: ENROLLMENT_STATUS_LABELS["needs-requirements"] },
  { id: "approved", label: ENROLLMENT_STATUS_LABELS.approved },
  { id: "rejected", label: ENROLLMENT_STATUS_LABELS.rejected },
];

const DECIDED: EnrollmentApplicationStatus[] = ["approved", "rejected"];

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

type EnrollmentApplicationsTableProps = {
  applications: EnrollmentApplication[];
  counts: Record<EnrollmentApplicationStatus, number>;
  filter: EnrollmentStatusFilter;
  onFilterChange: (filter: EnrollmentStatusFilter) => void;
  onView: (application: EnrollmentApplication) => void;
  onApprove: (application: EnrollmentApplication) => void;
  onReject: (application: EnrollmentApplication) => void;
  /** Overrides the panel heading, e.g. for a status-specific page. */
  title?: string;
  subtitle?: string;
  /**
   * Pins the list to one status and hides the status chips. Used by the
   * For Review / Approved / Needs Requirements pages.
   */
  lockedStatus?: EnrollmentStatusFilter;
};

/**
 * Searchable, filterable applicant queue. All records come from the local
 * sample store and the section says so explicitly in its footer.
 */
export function EnrollmentApplicationsTable({
  applications,
  counts,
  filter,
  onFilterChange,
  onView,
  onApprove,
  onReject,
  title = "Enrollment Applications",
  subtitle = "Review, verify credentials, and update applicant standings.",
  lockedStatus,
}: EnrollmentApplicationsTableProps) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const activeFilter = lockedStatus ?? filter;

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();

    return applications
      .filter((application) => activeFilter === "all" || application.status === activeFilter)
      .filter((application) => {
        if (!term) return true;
        const haystack =
          `${application.id} ${application.studentName} ${application.studentId} ${application.program} ${application.programCode}`.toLowerCase();
        return haystack.includes(term);
      })
      .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  }, [applications, activeFilter, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const rows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const changeFilter = (next: EnrollmentStatusFilter) => {
    onFilterChange(next);
    setPage(1);
  };

  const changeQuery = (next: string) => {
    setQuery(next);
    setPage(1);
  };

  const clearAll = () => {
    setQuery("");
    if (!lockedStatus) onFilterChange("all");
    setPage(1);
  };

  const filterCount = (id: EnrollmentStatusFilter) =>
    id === "all"
      ? applications.length
      : counts[id as EnrollmentApplicationStatus];

  return (
    <section
      aria-labelledby="enrollment-applications-heading"
      className="overflow-hidden rounded-2xl border border-white/80 bg-white/75 shadow-[0_8px_30px_rgb(15,36,104,0.04)] backdrop-blur-md transition-all duration-200 hover:shadow-[0_16px_40px_rgba(15,36,104,0.08)]"
    >
      <div className="flex flex-col gap-3 border-b border-cpc-tile-border/50 bg-white/40 px-5 py-4 backdrop-blur-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h2
              id="enrollment-applications-heading"
              className="font-poppins text-[15px] leading-tight font-semibold text-cpc-navy-text"
            >
              {title}
            </h2>
            <p className="mt-0.5 font-poppins text-[11px] leading-snug text-cpc-heading-soft">
              {subtitle}
            </p>
          </div>

          <label className="relative w-full sm:w-64">
            <span className="sr-only">Search enrollment applications</span>
            <Search
              className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-cpc-heading-soft"
              aria-hidden
            />
            <input
              type="search"
              value={query}
              onChange={(event) => changeQuery(event.target.value)}
              placeholder="Search ID, name, program..."
              className="h-8.5 w-full rounded-xl border border-white/80 bg-white/70 pr-8 pl-8 font-poppins text-xs text-cpc-navy-text shadow-2xs outline-none backdrop-blur-xs placeholder:text-cpc-heading-soft/60 focus:border-cpc-blue-accent/60 focus:bg-white focus:ring-2 focus:ring-cpc-blue-accent/15"
            />
            {query && (
              <button
                type="button"
                onClick={() => changeQuery("")}
                aria-label="Clear search"
                className="absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer rounded p-0.5 text-cpc-heading-soft transition-colors hover:bg-white hover:text-cpc-navy-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
              >
                <X className="h-3 w-3" aria-hidden />
              </button>
            )}
          </label>
        </div>

        {!lockedStatus && (
          <div className="-mx-1 flex items-center gap-1.5 overflow-x-auto px-1 pb-0.5 admin-scrollbar">
            {FILTERS.map((entry) => {
              const active = activeFilter === entry.id;
              return (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => changeFilter(entry.id)}
                  aria-pressed={active}
                  className={cn(
                    "inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 font-poppins text-[11px] font-semibold whitespace-nowrap transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent",
                    active
                      ? "border-cpc-blue-accent bg-cpc-blue-accent text-white shadow-xs shadow-cpc-blue-accent/30"
                      : "border-white/80 bg-white/70 text-cpc-heading-soft backdrop-blur-xs hover:border-cpc-tile-border hover:bg-white hover:text-cpc-navy-text",
                  )}
                >
                  {entry.label}
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[9px] leading-tight font-bold tabular-nums",
                      active ? "bg-white/20 text-white" : "bg-cpc-section-light text-cpc-blue-accent",
                    )}
                  >
                    {filterCount(entry.id)}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No applications match"
          description={
            query.trim()
              ? "Try a different application ID, student name, or program."
              : "There are no applications in this status right now."
          }
          action={
            <button
              type="button"
              onClick={clearAll}
              className="mt-1 cursor-pointer rounded-lg border border-white/80 bg-white/80 px-3 py-1.5 font-poppins text-[11px] font-semibold text-cpc-navy-text shadow-xs backdrop-blur-xs transition-colors hover:border-cpc-tile-border hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
            >
              Reset filters
            </button>
          }
        />
      ) : (
        <>
          {/* Table on wide screens. */}
          <div className="hidden overflow-x-auto xl:block">
            <table className="w-full min-w-[820px] border-collapse">
              <caption className="sr-only">
                Enrollment applications awaiting processing. {filtered.length} results.
              </caption>
              <thead>
                <tr className="border-b border-cpc-tile-border/50 bg-cpc-section-light/60 backdrop-blur-xs">
                  {[
                    "Application ID",
                    "Student Name",
                    "Program",
                    "Submission Date",
                    "Status",
                    "Actions",
                  ].map((label) => (
                    <th
                      key={label}
                      scope="col"
                      className={cn(
                        "px-4 py-2.5 font-poppins text-[10px] font-bold tracking-[0.1em] text-cpc-heading-soft uppercase whitespace-nowrap",
                        label === "Actions" ? "text-right" : "text-left",
                      )}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-cpc-tile-border/40">
                {rows.map((application) => {
                  const decided = DECIDED.includes(application.status);

                  return (
                    <tr
                      key={application.id}
                      className="transition-colors hover:bg-cpc-section-light/40"
                    >
                      <td className="px-4 py-3 font-poppins text-xs font-semibold whitespace-nowrap text-cpc-blue-accent">
                        {application.id}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <span
                            className="flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-xl border border-white/80 bg-cpc-section-light font-poppins text-[10px] font-bold text-cpc-navy-text shadow-2xs"
                            aria-hidden
                          >
                            {initials(application.studentName)}
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate font-poppins text-xs font-semibold text-cpc-navy-text">
                              {application.studentName}
                            </span>
                            <span className="block font-poppins text-[10px] text-cpc-heading-soft">
                              {application.studentId}
                            </span>
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="block truncate font-poppins text-xs font-medium text-cpc-navy-text">
                          {application.program}
                        </span>
                        <span className="font-poppins text-[10px] font-semibold text-cpc-heading-soft">
                          {application.programCode} · {application.yearLevel}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-poppins text-xs whitespace-nowrap text-cpc-heading-soft">
                        {formatDate(application.submittedAt)}
                      </td>
                      <td className="px-4 py-3">
                        <ApplicationStatusBadge status={application.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onView(application)}
                            aria-label={`View ${application.studentName}'s application`}
                            title="View details"
                            className="inline-flex h-7.5 w-7.5 cursor-pointer items-center justify-center rounded-lg border border-white/80 bg-white/80 text-cpc-heading-soft shadow-xs backdrop-blur-xs transition-all hover:border-cpc-tile-border hover:bg-white hover:text-cpc-navy-text hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
                          >
                            <Eye className="h-3.5 w-3.5" aria-hidden />
                          </button>
                          {!decided && (
                            <>
                              <button
                                type="button"
                                onClick={() => onApprove(application)}
                                aria-label={`Approve ${application.studentName}'s application`}
                                title="Approve application"
                                className="inline-flex h-7.5 w-7.5 cursor-pointer items-center justify-center rounded-lg border border-emerald-200/80 bg-emerald-50/80 text-emerald-700 shadow-xs backdrop-blur-xs transition-all hover:bg-emerald-100 hover:text-emerald-800 hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                              >
                                <Check className="h-3.5 w-3.5" aria-hidden />
                              </button>
                              <button
                                type="button"
                                onClick={() => onReject(application)}
                                aria-label={`Reject ${application.studentName}'s application`}
                                title="Reject application"
                                className="inline-flex h-7.5 w-7.5 cursor-pointer items-center justify-center rounded-lg border border-rose-200/80 bg-rose-50/80 text-rose-700 shadow-xs backdrop-blur-xs transition-all hover:bg-rose-100 hover:text-rose-800 hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600"
                              >
                                <X className="h-3.5 w-3.5" aria-hidden />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Cards below the desktop breakpoint. */}
          <ul className="divide-y divide-cpc-tile-border/40 xl:hidden">
            {rows.map((application) => {
              const decided = DECIDED.includes(application.status);

              return (
                <li key={application.id} className="px-4 py-3.5 transition-colors hover:bg-cpc-section-light/30">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-poppins text-xs font-semibold text-cpc-blue-accent">
                      {application.id}
                    </span>
                    <ApplicationStatusBadge status={application.status} />
                  </div>

                  <div className="mt-2 flex items-center gap-2.5">
                    <span
                      className="flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-xl border border-white/80 bg-cpc-section-light font-poppins text-[10px] font-bold text-cpc-navy-text shadow-2xs"
                      aria-hidden
                    >
                      {initials(application.studentName)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-poppins text-xs font-semibold text-cpc-navy-text">
                        {application.studentName}
                      </p>
                      <p className="truncate font-poppins text-[10.5px] text-cpc-heading-soft">
                        {application.program} · {application.yearLevel}
                      </p>
                    </div>
                  </div>

                  <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-cpc-tile-border/30 pt-2">
                    <span className="font-poppins text-[10.5px] text-cpc-heading-soft">
                      Submitted {formatDate(application.submittedAt)}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onView(application)}
                        className="cursor-pointer rounded-lg border border-white/80 bg-white/80 px-2.5 py-1 font-poppins text-[10.5px] font-semibold text-cpc-navy-text shadow-xs backdrop-blur-xs transition-colors hover:border-cpc-tile-border hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
                      >
                        View
                      </button>
                      {!decided && (
                        <>
                          <button
                            type="button"
                            onClick={() => onApprove(application)}
                            className="cursor-pointer rounded-lg border border-emerald-200/80 bg-emerald-50/80 px-2.5 py-1 font-poppins text-[10.5px] font-semibold text-emerald-700 shadow-xs backdrop-blur-xs transition-colors hover:bg-emerald-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => onReject(application)}
                            className="cursor-pointer rounded-lg border border-rose-200/80 bg-rose-50/80 px-2.5 py-1 font-poppins text-[10.5px] font-semibold text-rose-700 shadow-xs backdrop-blur-xs transition-colors hover:bg-rose-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-cpc-tile-border/50 bg-white/40 px-5 py-3.5 backdrop-blur-xs">
            <p className="font-poppins text-[11px] text-cpc-heading-soft">
              Showing{" "}
              <span className="font-semibold text-cpc-navy-text tabular-nums">
                {(safePage - 1) * PAGE_SIZE + 1}–
                {Math.min(safePage * PAGE_SIZE, filtered.length)}
              </span>{" "}
              of <span className="font-semibold text-cpc-navy-text tabular-nums">{filtered.length}</span>
              <span className="mx-2 opacity-50">·</span>
              Applications are updated live in this session.
            </p>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPage(Math.max(1, safePage - 1))}
                disabled={safePage <= 1}
                aria-label="Previous page"
                className="inline-flex h-7.5 w-7.5 cursor-pointer items-center justify-center rounded-lg border border-white/80 bg-white/80 text-cpc-heading-soft shadow-xs backdrop-blur-xs transition-all hover:border-cpc-tile-border hover:bg-white hover:text-cpc-navy-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
              </button>
              <span className="px-1.5 font-poppins text-xs font-semibold text-cpc-navy-text tabular-nums">
                {safePage} / {pageCount}
              </span>
              <button
                type="button"
                onClick={() => setPage(Math.min(pageCount, safePage + 1))}
                disabled={safePage >= pageCount}
                aria-label="Next page"
                className="inline-flex h-7.5 w-7.5 cursor-pointer items-center justify-center rounded-lg border border-white/80 bg-white/80 text-cpc-heading-soft shadow-xs backdrop-blur-xs transition-all hover:border-cpc-tile-border hover:bg-white hover:text-cpc-navy-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight className="h-3.5 w-3.5" aria-hidden />
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
