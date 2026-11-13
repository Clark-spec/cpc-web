import { useState, type ReactNode } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  FilterX,
  ListFilter,
  Loader2,
  Search,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { formatDateTime } from "@/lib/format";
import { EmptyState } from "@/components/common/display/EmptyState";
import { ServiceRequestStatusBadge } from "@/components/features/admin/service-requests/ServiceRequestStatusBadge";
import {
  SERVICE_STATUS_LABELS,
  SERVICE_STATUS_ORDER,
  type AdminServiceRequestFilters,
  type AdminServiceRequestPagination,
  type AdminServiceRequestRow,
  type AdminServiceRequestStatus,
} from "@/services/serviceRequests/admin";
import type { ServiceOption } from "@/services/serviceRequests/types";

type ServiceRequestTableProps = {
  requests: AdminServiceRequestRow[];
  pagination: AdminServiceRequestPagination;
  filters: AdminServiceRequestFilters;
  services: ServiceOption[];
  loading: boolean;
  onFilterChange: <K extends keyof AdminServiceRequestFilters>(
    key: K,
    value: AdminServiceRequestFilters[K],
  ) => void;
  onResetFilters: () => void;
  onPageChange: (page: number) => void;
  onView: (request: AdminServiceRequestRow) => void;
  onChangeStatus: (request: AdminServiceRequestRow, status: AdminServiceRequestStatus) => void;
  onBulkStatus: (ids: string[], status: AdminServiceRequestStatus) => void;
};

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function FilterSelect({
  id,
  label,
  value,
  onChange,
  children,
  className,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <label
        htmlFor={id}
        className="mb-1 block font-poppins text-[9px] font-bold tracking-[0.1em] text-admin-muted uppercase"
      >
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-8 w-full cursor-pointer appearance-none rounded-lg border border-white/80 bg-white/90 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%237183A6%22%20stroke-width%3D%222.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px] bg-[position:right_0.6rem_center] bg-no-repeat pr-7 pl-2.5 font-poppins text-[11px] font-medium text-admin-text shadow-xs outline-none transition-all hover:border-admin-secondary/40 focus:border-admin-secondary focus:ring-2 focus:ring-admin-secondary/15"
      >
        {children}
      </select>
    </div>
  );
}

function FilterDate({
  id,
  label,
  value,
  min,
  max,
  onChange,
  className,
}: {
  id: string;
  label: string;
  value: string;
  min?: string;
  max?: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <label
        htmlFor={id}
        className="mb-1 block font-poppins text-[9px] font-bold tracking-[0.1em] text-admin-muted uppercase"
      >
        {label}
      </label>
      <input
        id={id}
        type="date"
        value={value}
        min={min}
        max={max}
        onChange={(event) => onChange(event.target.value)}
        className="h-8 w-full rounded-lg border border-white/80 bg-white/90 px-2.5 font-poppins text-[11px] font-medium text-admin-text shadow-xs outline-none transition-all hover:border-admin-secondary/40 focus:border-admin-secondary focus:ring-2 focus:ring-admin-secondary/15"
      />
    </div>
  );
}

/**
 * Server-driven service-request queue. Search, status, service and date filters
 * run against the shared admin API; the page owns fetching so the summary cards
 * and this table always show the same snapshot.
 */
export function ServiceRequestTable({
  requests,
  pagination,
  filters,
  services,
  loading,
  onFilterChange,
  onResetFilters,
  onPageChange,
  onView,
  onChangeStatus,
  onBulkStatus,
}: ServiceRequestTableProps) {
  // Selections belong to the current query; a filter or page change drops them.
  const selectionKey = `${filters.page}|${filters.search}|${filters.status}|${filters.serviceId ?? "all"}|${filters.from}|${filters.to}`;
  const [selection, setSelection] = useState<{ key: string; ids: string[] }>({
    key: selectionKey,
    ids: [],
  });
  const selectedIds = selection.key === selectionKey ? selection.ids : [];

  const updateSelection = (updater: (current: string[]) => string[]) => {
    setSelection((current) => ({
      key: selectionKey,
      ids: updater(current.key === selectionKey ? current.ids : []),
    }));
  };

  const hasFilters =
    filters.search.trim().length > 0 ||
    filters.status !== "all" ||
    filters.serviceId !== null ||
    filters.from !== "" ||
    filters.to !== "";

  const safePage = Math.min(filters.page, pagination.totalPages);
  const start = pagination.total === 0 ? 0 : (safePage - 1) * pagination.pageSize + 1;
  const end = Math.min(safePage * pagination.pageSize, pagination.total);

  const visibleIds = requests.map((request) => request.id);
  const selectedOnPage = visibleIds.filter((id) => selectedIds.includes(id));
  const allOnPageSelected = visibleIds.length > 0 && selectedOnPage.length === visibleIds.length;
  const someOnPageSelected = selectedOnPage.length > 0 && !allOnPageSelected;

  const toggleRow = (id: string) => {
    updateSelection((current) =>
      current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id],
    );
  };

  const togglePage = () => {
    updateSelection((current) =>
      allOnPageSelected
        ? current.filter((id) => !visibleIds.includes(id))
        : Array.from(new Set([...current, ...visibleIds])),
    );
  };

  return (
    <section
      aria-labelledby="service-request-heading"
      className="overflow-hidden rounded-2xl border border-white/80 bg-white/85 shadow-[0_8px_30px_rgb(15,36,104,0.04)] backdrop-blur-md"
    >
      {/* Header & Search */}
      <div className="border-b border-admin-border/50 bg-white/60 px-5 pb-4 pt-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cpc-blue-accent/15 to-cpc-navy-text/10 text-cpc-blue-accent shadow-xs ring-1 ring-cpc-blue-accent/20">
                <ListFilter className="h-4 w-4" aria-hidden />
              </div>
              <div>
                <h2
                  id="service-request-heading"
                  className="font-poppins text-[15px] leading-tight font-bold text-admin-text"
                >
                  Service Request Queue
                </h2>
                <p className="mt-0.5 font-poppins text-[11px] leading-snug text-admin-muted">
                  Review, route and release student document requests across all service windows.
                </p>
              </div>
            </div>
          </div>

          {/* Search */}
          <label className="relative w-full sm:w-72">
            <span className="sr-only">Search service requests</span>
            <Search
              className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-admin-muted"
              aria-hidden
            />
            <input
              type="search"
              value={filters.search}
              onChange={(event) => onFilterChange("search", event.target.value)}
              placeholder="Search reference, student, or service..."
              className="h-9 w-full rounded-xl border border-white/80 bg-white/90 pr-8 pl-8 font-poppins text-[11px] text-admin-text shadow-xs outline-none placeholder:text-admin-muted/70 focus:border-admin-secondary focus:ring-2 focus:ring-admin-secondary/15"
            />
            {filters.search && (
              <button
                type="button"
                onClick={() => onFilterChange("search", "")}
                aria-label="Clear search"
                className="absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer rounded p-0.5 text-admin-muted transition-colors hover:bg-admin-page hover:text-admin-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-info"
              >
                <X className="h-3 w-3" aria-hidden />
              </button>
            )}
          </label>
        </div>

        {/* Filter row */}
        <div className="mt-3.5 flex flex-wrap items-end gap-2.5">
          <FilterSelect
            id="service-type-filter"
            label="Service Type"
            value={filters.serviceId === null ? "all" : String(filters.serviceId)}
            onChange={(value) =>
              onFilterChange("serviceId", value === "all" ? null : Number(value))
            }
            className="w-full sm:w-48"
          >
            <option value="all">All Services</option>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name}
              </option>
            ))}
          </FilterSelect>

          <FilterSelect
            id="service-status-filter"
            label="Status"
            value={filters.status}
            onChange={(value) =>
              onFilterChange("status", value as AdminServiceRequestFilters["status"])
            }
            className="w-full sm:w-40"
          >
            <option value="all">All Statuses</option>
            {SERVICE_STATUS_ORDER.map((option) => (
              <option key={option} value={option}>
                {SERVICE_STATUS_LABELS[option]}
              </option>
            ))}
          </FilterSelect>

          <FilterDate
            id="service-date-from"
            label="Filed From"
            value={filters.from}
            max={filters.to || undefined}
            onChange={(value) => onFilterChange("from", value)}
            className="w-full sm:w-36"
          />

          <FilterDate
            id="service-date-to"
            label="Filed To"
            value={filters.to}
            min={filters.from || undefined}
            onChange={(value) => onFilterChange("to", value)}
            className="w-full sm:w-36"
          />

          {hasFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-admin-border/60 bg-white px-3 font-poppins text-[10.5px] font-semibold text-admin-muted shadow-xs transition-all hover:border-admin-secondary/40 hover:text-admin-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-info"
            >
              <FilterX className="h-3.5 w-3.5" aria-hidden />
              Reset
            </button>
          )}

          {/* Results count chip */}
          <div className="ml-auto flex items-end">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-admin-border/60 bg-admin-page/80 px-2.5 py-1 font-poppins text-[10px] font-semibold text-admin-muted">
              {loading && <Loader2 className="h-3 w-3 animate-spin" aria-hidden />}
              {pagination.total} {pagination.total === 1 ? "result" : "results"}
            </span>
          </div>
        </div>
      </div>

      {/* Bulk-action bar */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-admin-border/50 bg-cpc-blue-accent/5 px-5 py-2.5">
          <p className="font-poppins text-[10.5px] font-semibold text-admin-text">
            <span className="tabular-nums">{selectedIds.length}</span> request
            {selectedIds.length === 1 ? "" : "s"} selected
          </p>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                onBulkStatus(selectedIds, "processing");
                updateSelection(() => []);
              }}
              className="cursor-pointer rounded-lg border border-admin-secondary/30 bg-white px-3 py-1 font-poppins text-[10px] font-semibold text-admin-secondary shadow-xs transition-all hover:bg-admin-secondary hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-info"
            >
              Mark Processing
            </button>
            <button
              type="button"
              onClick={() => updateSelection(() => [])}
              className="cursor-pointer rounded-lg px-3 py-1 font-poppins text-[10px] font-semibold text-admin-muted transition-colors hover:text-admin-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-info"
            >
              Clear selection
            </button>
          </div>
        </div>
      )}

      {/* Table or empty */}
      {requests.length === 0 ? (
        loading ? (
          <div className="flex items-center justify-center gap-2 px-5 py-14 font-poppins text-[11.5px] text-admin-muted">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Loading service requests…
          </div>
        ) : (
          <EmptyState
            icon={Search}
            title="No service requests match"
            description={
              hasFilters
                ? "Try a different reference number, student name, service, or reset the filters."
                : "There are no service requests in this queue right now."
            }
            action={
              hasFilters ? (
                <button
                  type="button"
                  onClick={onResetFilters}
                className="mt-1 cursor-pointer rounded-xl border border-admin-border bg-white px-4 py-2 font-poppins text-[11px] font-semibold text-admin-secondary shadow-xs transition-all hover:bg-admin-page focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-info"
              >
                Reset filters
              </button>
            ) : undefined
          }
        />
        )
      ) : (
        <>
          <div className={cn("relative overflow-x-auto transition-opacity", loading && "opacity-60")}>
            <table className="w-full min-w-[1000px] border-collapse font-poppins">
              <caption className="sr-only">
                Student service requests. {pagination.total} results.
              </caption>
              <thead>
                <tr className="border-b border-admin-border/50 bg-gradient-to-r from-admin-header/80 to-admin-page/60">
                  <th scope="col" className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={allOnPageSelected}
                      ref={(element) => {
                        if (element) element.indeterminate = someOnPageSelected;
                      }}
                      onChange={togglePage}
                      aria-label="Select all requests on this page"
                      className="h-3.5 w-3.5 cursor-pointer accent-admin-secondary"
                    />
                  </th>
                  {[
                    "Reference No.",
                    "Student Name & No.",
                    "Service Item",
                    "Submitted / Updated",
                    "Status",
                    "Actions",
                  ].map((label) => (
                    <th
                      key={label}
                      scope="col"
                      className={cn(
                        "px-4 py-3 font-poppins text-[9.5px] font-bold tracking-[0.1em] text-admin-muted uppercase",
                        label === "Actions" ? "text-right" : "text-left",
                      )}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-border/40">
                {requests.map((request) => (
                  <tr
                    key={request.id}
                    className={cn(
                      "transition-colors hover:bg-cpc-blue-accent/[0.03]",
                      selectedIds.includes(request.id) && "bg-cpc-blue-accent/[0.05]",
                    )}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(request.id)}
                        onChange={() => toggleRow(request.id)}
                        aria-label={`Select ${request.id}`}
                        className="h-3.5 w-3.5 cursor-pointer accent-admin-secondary"
                      />
                    </td>

                    {/* Reference */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="block font-poppins text-[11.5px] font-bold text-admin-secondary">
                        {request.referenceNumber}
                      </span>
                      {request.copies > 1 && (
                        <span className="mt-0.5 inline-flex rounded-full bg-admin-page px-1.5 py-0.5 font-poppins text-[9px] font-semibold text-admin-muted ring-1 ring-admin-border/60">
                          {request.copies} copies
                        </span>
                      )}
                    </td>

                    {/* Student */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cpc-blue-accent/20 to-cpc-navy-text/15 font-poppins text-[9.5px] font-bold text-admin-secondary"
                          aria-hidden
                        >
                          {initials(request.student.name)}
                        </span>
                        <span className="min-w-0">
                          <span className="block max-w-[160px] truncate font-poppins text-[11.5px] font-semibold text-admin-text">
                            {request.student.name || "—"}
                          </span>
                          <span className="block font-poppins text-[10px] text-admin-muted">
                            {request.student.studentNumber || "—"}
                          </span>
                        </span>
                      </div>
                    </td>

                    {/* Service */}
                    <td className="px-4 py-3">
                      <span className="block max-w-[200px] truncate font-poppins text-[11.5px] font-semibold text-admin-text">
                        {request.service.name}
                      </span>
                      <span
                        className="block max-w-[200px] truncate font-poppins text-[10px] text-admin-muted"
                        title={request.purpose}
                      >
                        {request.purpose || "No purpose stated"}
                      </span>
                    </td>

                    {/* Dates */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="block font-poppins text-[10.5px] text-admin-text">
                        {formatDateTime(request.submittedAt)}
                      </span>
                      <span className="block font-poppins text-[10px] text-admin-muted">
                        Updated {formatDateTime(request.updatedAt)}
                      </span>
                    </td>

                    {/* Status badge */}
                    <td className="px-4 py-3">
                      <ServiceRequestStatusBadge status={request.status} />
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onView(request)}
                          aria-label={`View ${request.id} details`}
                          title="View details"
                          className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-admin-border/60 bg-white/80 text-admin-muted shadow-xs transition-all hover:border-admin-secondary/40 hover:bg-admin-secondary hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-info"
                        >
                          <Eye className="h-3.5 w-3.5" aria-hidden />
                        </button>
                        <select
                          id={`status-${request.id}`}
                          value={request.status}
                          aria-label={`Change status for ${request.id}`}
                          onChange={(event) =>
                            onChangeStatus(
                              request,
                              event.target.value as AdminServiceRequestStatus,
                            )
                          }
                          className="h-7 cursor-pointer rounded-lg border border-admin-border/60 bg-white/90 px-2 font-poppins text-[10px] font-semibold text-admin-text shadow-xs outline-none transition-all hover:border-admin-secondary/40 focus:border-admin-secondary focus:ring-2 focus:ring-admin-secondary/15"
                        >
                          {SERVICE_STATUS_ORDER.map((option) => (
                            <option key={option} value={option}>
                              {SERVICE_STATUS_LABELS[option]}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-admin-border/50 bg-white/50 px-5 py-3">
            <p className="font-poppins text-[10px] text-admin-muted">
              Showing{" "}
              <span className="font-semibold text-admin-text tabular-nums">
                {start}–{end}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-admin-text tabular-nums">
                {pagination.total}
              </span>{" "}
              service requests
              <span className="mx-1.5 text-admin-border">|</span>
              Shared queue — updates sync with the student portal.
            </p>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onPageChange(Math.max(1, safePage - 1))}
                disabled={safePage <= 1 || loading}
                aria-label="Previous page"
                className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-admin-border/60 bg-white/80 text-admin-muted shadow-xs transition-all hover:bg-admin-page hover:text-admin-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-info disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
              </button>
              <span className="px-1.5 font-poppins text-[10px] font-semibold text-admin-text tabular-nums">
                {safePage} / {pagination.totalPages}
              </span>
              <button
                type="button"
                onClick={() => onPageChange(Math.min(pagination.totalPages, safePage + 1))}
                disabled={safePage >= pagination.totalPages || loading}
                aria-label="Next page"
                className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-admin-border/60 bg-white/80 text-admin-muted shadow-xs transition-all hover:bg-admin-page hover:text-admin-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-info disabled:cursor-not-allowed disabled:opacity-40"
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
