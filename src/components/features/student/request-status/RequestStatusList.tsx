import { Link } from "react-router";
import { ChevronDown, ChevronRight, Filter, Inbox, Search, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { StatusBadge } from "@/components/features/student/service-requests/StatusBadge";
import { formatDate, formatDateTime } from "@/components/features/student/service-requests/format";
import type { ServiceRequest } from "@/services/serviceRequests/student";
import {
  STATUS_FILTER_OPTIONS,
  type StatusCounts,
  type StatusFilter,
} from "@/components/features/student/request-status/useRequestStatus";

type RequestStatusListProps = {
  filteredRequests: ServiceRequest[];
  total: number;
  statusCounts: StatusCounts;
  loading: boolean;
  error: string | null;
  query: string;
  statusFilter: StatusFilter;
  hasFilters: boolean;
  onQueryChange: (value: string) => void;
  onStatusFilterChange: (value: StatusFilter) => void;
  onClearFilters: () => void;
  onRetry: () => void;
  onView: (id: number) => void;
};

const CONTROL_CLASSES =
  "h-9 rounded-lg border border-sr-border bg-white font-poppins text-[12px] text-sr-text outline-none transition-colors focus:border-sr-primary focus:ring-2 focus:ring-sr-primary/15";

export function RequestStatusList({
  filteredRequests,
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
}: RequestStatusListProps) {
  return (
    <section className="sr-card p-5 sm:p-6" aria-labelledby="my-requests-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2
            id="my-requests-title"
            className="font-poppins text-[15px] font-semibold text-sr-text"
          >
            My Service Requests
          </h2>
          <p className="mt-1 font-poppins text-[11px] leading-[17px] text-sr-muted">
            Search, filter, and open a request to view its tracking timeline.
          </p>
        </div>
        {!loading && !error && total > 0 && (
          <span className="rounded-full border border-sr-border bg-sr-section px-2.5 py-0.5 font-poppins text-[10px] font-semibold text-sr-navy">
            {total} {total === 1 ? "request" : "requests"}
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
            <label htmlFor="request-search" className="sr-only">
              Search requests
            </label>
            <input
              id="request-search"
              type="search"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Search by reference number or service"
              className={cn(CONTROL_CLASSES, "w-full pr-3 pl-9 placeholder:text-sr-muted")}
            />
          </div>

          <div className="relative sm:w-[190px]">
            <Filter
              className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-sr-muted"
              aria-hidden
            />
            <label htmlFor="request-status-filter" className="sr-only">
              Filter by status
            </label>
            <select
              id="request-status-filter"
              value={statusFilter}
              onChange={(event) => onStatusFilterChange(event.target.value as StatusFilter)}
              className={cn(CONTROL_CLASSES, "w-full appearance-none pr-8 pl-9")}
            >
              {STATUS_FILTER_OPTIONS.map((option) => (
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
            You don't have any service requests yet.
          </p>
          <p className="mt-1 max-w-[320px] font-poppins text-[11px] leading-[17px] text-sr-muted">
            Submit a request for a school document or service, then track its progress here.
          </p>
          <Link to="/student/service-requests" className="sr-btn-primary mt-4">
            Submit a Request
          </Link>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="mt-5 flex flex-col items-center rounded-lg border border-dashed border-sr-border bg-[#F8FAFF] px-4 py-9 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-sr-section text-sr-muted">
            <Search className="h-5 w-5" aria-hidden />
          </span>
          <p className="mt-3 font-poppins text-[13px] font-semibold text-sr-text">
            No requests match your search.
          </p>
          <p className="mt-1 max-w-[300px] font-poppins text-[11px] leading-[17px] text-sr-muted">
            Try a different reference number, service name, or status.
          </p>
          <button
            type="button"
            onClick={onClearFilters}
            className="sr-btn-secondary mt-4"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <>
          {hasFilters && (
            <p className="mt-3 font-poppins text-[10.5px] text-sr-muted" aria-live="polite">
              Showing {filteredRequests.length} of {total} requests
            </p>
          )}

          {/* Mobile and tablet: stacked records keep every field readable. */}
          <ul className="mt-3 grid gap-2.5 sm:grid-cols-2 xl:hidden">
            {filteredRequests.map((request) => (
              <li
                key={request.id}
                className="rounded-lg border border-sr-border bg-white px-3.5 py-3 transition-colors hover:border-[#C3D4EF]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-poppins text-[11px] font-bold tracking-[0.02em] text-sr-primary">
                      {request.referenceNumber}
                    </p>
                    <p className="mt-0.5 font-poppins text-[12.5px] leading-[18px] font-medium text-sr-text">
                      {request.service.name}
                    </p>
                  </div>
                  <StatusBadge status={request.status} label={request.statusLabel} />
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-poppins text-[10px] text-sr-muted">
                  <span>Submitted {formatDate(request.submittedAt)}</span>
                  <span>Updated {formatDate(request.updatedAt)}</span>
                </div>
                <button
                  type="button"
                  onClick={() => onView(request.id)}
                  className="mt-2 inline-flex items-center gap-1 rounded-md px-2 py-1 font-poppins text-[11px] font-semibold text-sr-primary transition-colors hover:bg-sr-section"
                >
                  View Details
                  <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-3 hidden overflow-x-auto rounded-lg border border-sr-border xl:block">
            <table className="w-full min-w-[880px] border-collapse text-left">
              <thead>
                <tr className="bg-sr-section">
                  {[
                    "Reference Number",
                    "Service",
                    "Date Submitted",
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
                {filteredRequests.map((request) => (
                  <tr
                    key={request.id}
                    className="border-t border-sr-border bg-white transition-colors hover:bg-[#FAFCFF]"
                  >
                    <td className="px-4 py-3 font-poppins text-[12px] font-semibold whitespace-nowrap text-sr-text">
                      {request.referenceNumber}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-poppins text-[12px] text-sr-text">
                        {request.service.name}
                      </p>
                      <p className="font-poppins text-[10px] text-sr-muted">
                        {request.copies} {request.copies === 1 ? "copy" : "copies"}
                      </p>
                    </td>
                    <td className="px-4 py-3 font-poppins text-[12px] whitespace-nowrap text-sr-muted">
                      <span title={formatDateTime(request.submittedAt)}>
                        {formatDate(request.submittedAt)}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-poppins text-[12px] whitespace-nowrap text-sr-muted">
                      <span title={formatDateTime(request.updatedAt)}>
                        {formatDate(request.updatedAt)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={request.status} label={request.statusLabel} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => onView(request.id)}
                        className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 font-poppins text-[11px] font-semibold text-sr-primary transition-colors hover:bg-sr-section"
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
