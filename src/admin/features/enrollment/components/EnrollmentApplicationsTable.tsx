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
import { formatDate } from "@/utils/format";
import { EmptyState } from "@/components/ui/admin/EmptyState";
import { ApplicationStatusBadge } from "./ApplicationStatusBadge";
import {
  ENROLLMENT_STATUS_LABELS,
  type EnrollmentApplication,
  type EnrollmentApplicationStatus,
  type EnrollmentStatusFilter,
} from "@/data/enrollmentApplications";

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
      className="overflow-hidden rounded-[10px] border border-admin-border bg-admin-card shadow-[0_2px_12px_rgba(24,52,111,0.04)]"
    >
      <div className="flex flex-col gap-2 border-b border-admin-border/70 px-4 pt-3.5 pb-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <h2
              id="enrollment-applications-heading"
              className="font-poppins text-[15px] leading-tight font-semibold text-admin-text"
            >
              {title}
            </h2>
            <p className="mt-0.5 font-poppins text-[11px] leading-snug text-admin-muted">
              {subtitle}
            </p>
          </div>

          <label className="relative w-full sm:w-64">
            <span className="sr-only">Search enrollment applications</span>
            <Search
              className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-admin-muted"
              aria-hidden
            />
            <input
              type="search"
              value={query}
              onChange={(event) => changeQuery(event.target.value)}
              placeholder="Search ID, name, program..."
              className="h-8 w-full rounded-lg border border-admin-border bg-white pr-8 pl-8 font-poppins text-[11px] text-admin-text outline-none placeholder:text-admin-muted/80 focus:border-admin-secondary focus:ring-2 focus:ring-admin-secondary/15"
            />
            {query && (
              <button
                type="button"
                onClick={() => changeQuery("")}
                aria-label="Clear search"
                className="absolute top-1/2 right-1.5 -translate-y-1/2 cursor-pointer rounded p-0.5 text-admin-muted transition-colors hover:bg-admin-page hover:text-admin-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-info"
              >
                <X className="h-3 w-3" aria-hidden />
              </button>
            )}
          </label>
        </div>

        {!lockedStatus && (
          <div className="-mx-1 flex items-center gap-1 overflow-x-auto px-1 pb-0.5 admin-scrollbar">
          {FILTERS.map((entry) => {
            const active = activeFilter === entry.id;
            return (
              <button
                key={entry.id}
                type="button"
                onClick={() => changeFilter(entry.id)}
                aria-pressed={active}
                className={cn(
                  "inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-full border px-2.5 py-1 font-poppins text-[10.5px] font-semibold whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-info",
                  active
                    ? "border-admin-secondary bg-admin-secondary text-white"
                    : "border-admin-border bg-white text-admin-muted hover:border-admin-secondary/40 hover:text-admin-text",
                )}
              >
                {entry.label}
                <span
                  className={cn(
                    "rounded-full px-1 py-0.5 text-[9px] leading-none font-bold tabular-nums",
                    active ? "bg-white/20 text-white" : "bg-admin-page text-admin-secondary",
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
              className="mt-1 cursor-pointer rounded-md border border-admin-border bg-white px-3 py-1.5 font-poppins text-[11px] font-semibold text-admin-secondary transition-colors hover:bg-admin-page focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-info"
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
                <tr className="border-b border-admin-border/70 bg-admin-page/70">
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
                        "px-3 py-2 font-poppins text-[10px] font-bold tracking-[0.09em] text-admin-muted uppercase",
                        label === "Actions" ? "text-right" : "text-left",
                      )}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-border/60">
                {rows.map((application) => {
                  const decided = DECIDED.includes(application.status);

                  return (
                    <tr
                      key={application.id}
                      className="transition-colors hover:bg-admin-page/50"
                    >
                      <td className="px-3 py-2.5 font-poppins text-[11px] font-semibold whitespace-nowrap text-admin-secondary">
                        {application.id}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <span
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-admin-accent/60 font-poppins text-[9.5px] font-bold text-admin-secondary"
                            aria-hidden
                          >
                            {initials(application.studentName)}
                          </span>
                          <span className="min-w-0">
                            <span className="block max-w-[170px] truncate font-poppins text-[11.5px] font-semibold text-admin-text">
                              {application.studentName}
                            </span>
                            <span className="block font-poppins text-[10px] text-admin-muted">
                              {application.studentId}
                            </span>
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="block max-w-[170px] truncate font-poppins text-[11px] text-admin-text">
                          {application.program}
                        </span>
                        <span className="font-poppins text-[9.5px] font-semibold text-admin-muted">
                          {application.programCode} · {application.yearLevel}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 font-poppins text-[11px] whitespace-nowrap text-admin-muted">
                        {formatDate(application.submittedAt)}
                      </td>
                      <td className="px-3 py-2.5">
                        <ApplicationStatusBadge status={application.status} />
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => onView(application)}
                            aria-label={`View ${application.studentName}'s application`}
                            title="View details"
                            className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-admin-border bg-white text-admin-muted transition-colors hover:border-admin-secondary/40 hover:bg-admin-page hover:text-admin-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-info"
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
                                className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 text-emerald-600 transition-colors hover:bg-emerald-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                              >
                                <Check className="h-3.5 w-3.5" aria-hidden />
                              </button>
                              <button
                                type="button"
                                onClick={() => onReject(application)}
                                aria-label={`Reject ${application.studentName}'s application`}
                                title="Reject application"
                                className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-rose-200 bg-rose-50 text-rose-600 transition-colors hover:bg-rose-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600"
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
          <ul className="divide-y divide-admin-border/60 xl:hidden">
            {rows.map((application) => {
              const decided = DECIDED.includes(application.status);

              return (
                <li key={application.id} className="px-3.5 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-poppins text-[10.5px] font-semibold text-admin-secondary">
                      {application.id}
                    </span>
                    <ApplicationStatusBadge status={application.status} />
                  </div>

                  <div className="mt-1.5 flex items-center gap-2">
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-admin-accent/60 font-poppins text-[9.5px] font-bold text-admin-secondary"
                      aria-hidden
                    >
                      {initials(application.studentName)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-poppins text-[11.5px] font-semibold text-admin-text">
                        {application.studentName}
                      </p>
                      <p className="truncate font-poppins text-[10px] text-admin-muted">
                        {application.program} · {application.yearLevel}
                      </p>
                    </div>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <span className="font-poppins text-[10px] text-admin-muted">
                      Submitted {formatDate(application.submittedAt)}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onView(application)}
                        className="cursor-pointer rounded-md border border-admin-border bg-white px-2 py-1 font-poppins text-[10px] font-semibold text-admin-secondary transition-colors hover:bg-admin-page focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-info"
                      >
                        View
                      </button>
                      {!decided && (
                        <>
                          <button
                            type="button"
                            onClick={() => onApprove(application)}
                            className="cursor-pointer rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 font-poppins text-[10px] font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => onReject(application)}
                            className="cursor-pointer rounded-md border border-rose-200 bg-rose-50 px-2 py-1 font-poppins text-[10px] font-semibold text-rose-700 transition-colors hover:bg-rose-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600"
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

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-admin-border/70 px-4 py-2.5">
            <p className="font-poppins text-[10px] text-admin-muted">
              Showing{" "}
              <span className="font-semibold text-admin-text tabular-nums">
                {(safePage - 1) * PAGE_SIZE + 1}–
                {Math.min(safePage * PAGE_SIZE, filtered.length)}
              </span>{" "}
              of <span className="font-semibold text-admin-text tabular-nums">{filtered.length}</span>
              <span className="mx-1.5 text-admin-border">|</span>
              Sample data for interface review — actions stay in this browser session.
            </p>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage(Math.max(1, safePage - 1))}
                disabled={safePage <= 1}
                aria-label="Previous page"
                className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-admin-border bg-white text-admin-muted transition-colors hover:bg-admin-page hover:text-admin-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-info disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
              </button>
              <span className="px-1 font-poppins text-[10px] font-semibold text-admin-text tabular-nums">
                {safePage} / {pageCount}
              </span>
              <button
                type="button"
                onClick={() => setPage(Math.min(pageCount, safePage + 1))}
                disabled={safePage >= pageCount}
                aria-label="Next page"
                className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-admin-border bg-white text-admin-muted transition-colors hover:bg-admin-page hover:text-admin-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-info disabled:cursor-not-allowed disabled:opacity-40"
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
