import { Link } from "react-router";
import { ChevronDown, ChevronRight, Filter, Inbox, Search, UserRound, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/badge";
import { ComplaintStatusBadge } from "@/components/features/student/complaints/ComplaintStatusBadge";
import {
  formatDate,
  formatDateTime,
} from "@/components/features/student/service-requests/format";
import type { StudentComplaint } from "@/services/complaints";
import {
  COMPLAINT_STATUS_FILTER_OPTIONS,
  type ComplaintStatusCounts,
  type ComplaintStatusFilter,
} from "@/components/features/student/complaint-status/useComplaintStatus";

type ComplaintStatusListProps = {
  filteredComplaints: StudentComplaint[];
  total: number;
  statusCounts: ComplaintStatusCounts;
  loading: boolean;
  error: string | null;
  query: string;
  statusFilter: ComplaintStatusFilter;
  hasFilters: boolean;
  onQueryChange: (value: string) => void;
  onStatusFilterChange: (value: ComplaintStatusFilter) => void;
  onClearFilters: () => void;
  onRetry: () => void;
  onView: (complaint: StudentComplaint) => void;
  /** Row just updated by a live office change; flashes once. */
  highlightId?: string | null;
};

const CONTROL_CLASSES =
  "h-9 rounded-lg border border-sr-border bg-white font-poppins text-[12px] text-sr-text outline-none transition-colors focus:border-sr-primary focus:ring-2 focus:ring-sr-primary/15";

export function ComplaintStatusList({
  filteredComplaints,
  total,
  statusCounts,
  loading,
  error,
  query,
  statusFilter,
  hasFilters,
  onQueryChange,
  onStatusFilterChange,
  onClearFilters,
  onRetry,
  onView,
  highlightId,
}: ComplaintStatusListProps) {
  return (
    <section className="sr-card p-5 sm:p-6" aria-labelledby="my-complaints-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2
            id="my-complaints-title"
            className="font-poppins text-[15px] font-semibold text-sr-text"
          >
            My Complaints
          </h2>
          <p className="mt-1 font-poppins text-[11px] leading-[17px] text-sr-muted">
            Search, filter, and open a complaint to view its status and response.
          </p>
        </div>
        {!loading && !error && total > 0 && (
          <span className="rounded-full border border-sr-border bg-sr-section px-2.5 py-0.5 font-poppins text-[10px] font-semibold text-sr-navy">
            {total} {total === 1 ? "complaint" : "complaints"}
          </span>
        )}
      </div>

      {!loading && !error && total > 0 && (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-sr-muted"
              aria-hidden
            />
            <label htmlFor="complaint-search" className="sr-only">
              Search complaints
            </label>
            <input
              id="complaint-search"
              type="search"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Search by reference number, subject, or category"
              className={cn(CONTROL_CLASSES, "w-full pr-3 pl-9 placeholder:text-sr-muted")}
            />
          </div>

          <div className="relative sm:w-[190px]">
            <Filter
              className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-sr-muted"
              aria-hidden
            />
            <label htmlFor="complaint-status-filter" className="sr-only">
              Filter by status
            </label>
            <select
              id="complaint-status-filter"
              value={statusFilter}
              onChange={(event) =>
                onStatusFilterChange(event.target.value as ComplaintStatusFilter)
              }
              className={cn(CONTROL_CLASSES, "w-full appearance-none pr-8 pl-9")}
            >
              {COMPLAINT_STATUS_FILTER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                  {option.value === "all" ? ` (${total})` : ` (${statusCounts[option.value]})`}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute top-1/2 right-3 h-3.5 w-3.5 -translate-y-1/2 text-sr-muted"
              aria-hidden
            />
          </div>

          {hasFilters && (
            <button
              type="button"
              onClick={onClearFilters}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-sr-border bg-white px-3 font-poppins text-[11.5px] font-semibold text-sr-primary transition-colors hover:bg-sr-page"
            >
              <X className="h-3.5 w-3.5" aria-hidden />
              Clear
            </button>
          )}
        </div>
      )}

      {loading ? (
        <div className="mt-4 space-y-2" aria-hidden>
          <div className="h-9 animate-pulse rounded-md bg-sr-section" />
          <div className="h-12 animate-pulse rounded-md bg-sr-section" />
          <div className="h-12 animate-pulse rounded-md bg-sr-section" />
          <div className="h-12 animate-pulse rounded-md bg-sr-section" />
        </div>
      ) : error ? (
        <div className="mt-4 rounded-lg border border-[#F8CBCB] bg-[#FDECEC] px-3 py-3">
          <p className="font-poppins text-[11px] leading-[16px] text-[#C53030]">{error}</p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-2 rounded-md border border-[#F8CBCB] bg-white px-2.5 py-1 font-poppins text-[11px] font-semibold text-[#C53030]"
          >
            Try again
          </button>
        </div>
      ) : total === 0 ? (
        <div className="mt-5 flex flex-col items-center rounded-lg border border-dashed border-sr-border bg-[#F8FAFF] px-4 py-10 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-sr-section text-sr-muted">
            <Inbox className="h-5 w-5" aria-hidden />
          </span>
          <p className="mt-3 font-poppins text-[13px] font-semibold text-sr-text">
            You haven't filed any complaints yet.
          </p>
          <p className="mt-1 max-w-[320px] font-poppins text-[11px] leading-[17px] text-sr-muted">
            Submit a complaint to the Student Support Office, then track its progress here.
          </p>
          <Link to="/student-support/online-complaint" className="cpc-btn cpc-btn-primary mt-4">
            File a Complaint
          </Link>
        </div>
      ) : filteredComplaints.length === 0 ? (
        <div className="mt-5 flex flex-col items-center rounded-lg border border-dashed border-sr-border bg-[#F8FAFF] px-4 py-9 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-sr-section text-sr-muted">
            <Search className="h-5 w-5" aria-hidden />
          </span>
          <p className="mt-3 font-poppins text-[13px] font-semibold text-sr-text">
            No complaints match your search.
          </p>
          <p className="mt-1 max-w-[300px] font-poppins text-[11px] leading-[17px] text-sr-muted">
            Try a different reference number, subject, category, or status.
          </p>
          <button
            type="button"
            onClick={onClearFilters}
            className="cpc-btn cpc-btn-secondary mt-4"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <>
          {hasFilters && (
            <p className="mt-3 font-poppins text-[10.5px] text-sr-muted" aria-live="polite">
              Showing {filteredComplaints.length} of {total} complaints
            </p>
          )}

          {/* Mobile and tablet: stacked records keep every field readable. */}
          <ul className="mt-3 grid gap-2.5 sm:grid-cols-2 xl:hidden">
            {filteredComplaints.map((complaint) => (
              <li
                key={complaint.id}
                onClick={() => onView(complaint)}
                className={cn(
                  "cursor-pointer rounded-lg border border-sr-border bg-white px-3.5 py-3 transition-colors hover:border-[#C3D4EF] hover:bg-[#FAFCFF]",
                  highlightId === complaint.id && "profile-highlight",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-poppins text-[11px] font-bold tracking-[0.02em] text-sr-primary">
                      {complaint.referenceNumber}
                    </p>
                    <p className="mt-0.5 font-poppins text-[12.5px] leading-[18px] font-medium text-sr-text">
                      {complaint.subject}
                    </p>
                    {complaint.anonymous && (
                      <Badge tone="neutral" className="mt-1.5 gap-1 px-2 py-0.5">
                        <UserRound className="h-3 w-3 shrink-0" aria-hidden />
                        Anonymous
                      </Badge>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onView(complaint);
                    }}
                    aria-label={`View details for complaint ${complaint.referenceNumber}`}
                    className="shrink-0 cursor-pointer rounded-full transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sr-primary"
                  >
                    <ComplaintStatusBadge status={complaint.status} />
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-poppins text-[10px] text-sr-muted">
                  <span>Filed {formatDate(complaint.filedAt)}</span>
                  <span>Updated {formatDate(complaint.updatedAt)}</span>
                </div>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onView(complaint);
                  }}
                  className="mt-2 inline-flex items-center gap-1 rounded-md px-2 py-1 font-poppins text-[11px] font-semibold text-sr-primary transition-colors hover:bg-sr-section"
                >
                  View Details
                  <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-3 hidden overflow-x-auto rounded-lg border border-sr-border xl:block">
            <table className="w-full min-w-[960px] border-collapse text-left">
              <thead>
                <tr className="bg-sr-section">
                  {[
                    "Reference Number",
                    "Subject",
                    "Category",
                    "Date Filed",
                    "Last Updated",
                    "Status",
                    "Action",
                  ].map((heading) => (
                    <th
                      key={heading}
                      scope="col"
                      className={cn(
                        "px-4 py-2.5 font-poppins text-[10px] font-semibold tracking-[0.06em] text-sr-navy uppercase",
                        heading === "Action" && "text-right",
                      )}
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredComplaints.map((complaint) => (
                  <tr
                    key={complaint.id}
                    onClick={() => onView(complaint)}
                    className={cn(
                      "cursor-pointer border-t border-sr-border bg-white transition-colors hover:bg-[#FAFCFF]",
                      highlightId === complaint.id && "profile-highlight",
                    )}
                  >
                    <td className="px-4 py-3 font-poppins text-[12px] font-semibold whitespace-nowrap text-sr-text">
                      {complaint.referenceNumber}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-poppins text-[12px] text-sr-text">
                          {complaint.subject}
                        </span>
                        {complaint.anonymous && (
                          <Badge tone="neutral" className="gap-1 px-2 py-0.5">
                            <UserRound className="h-3 w-3 shrink-0" aria-hidden />
                            Anonymous
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-poppins text-[12px] text-sr-muted">
                      {complaint.category}
                    </td>
                    <td className="px-4 py-3 font-poppins text-[12px] whitespace-nowrap text-sr-muted">
                      <span title={formatDateTime(complaint.filedAt)}>
                        {formatDate(complaint.filedAt)}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-poppins text-[12px] whitespace-nowrap text-sr-muted">
                      <span title={formatDateTime(complaint.updatedAt)}>
                        {formatDate(complaint.updatedAt)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onView(complaint);
                        }}
                        aria-label={`View details for complaint ${complaint.referenceNumber}`}
                        className="cursor-pointer rounded-full transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sr-primary"
                      >
                        <ComplaintStatusBadge status={complaint.status} />
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onView(complaint);
                        }}
                        className="inline-flex cursor-pointer items-center gap-1 rounded-md px-2.5 py-1 font-poppins text-[11px] font-semibold text-sr-primary transition-colors hover:bg-sr-section"
                      >
                        View Details
                        <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
