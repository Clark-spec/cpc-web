import { useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Eye,
  FilterX,
  Search,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { formatDateTime } from "@/utils/format";
import { EmptyState } from "@/components/ui/admin/EmptyState";
import {
  ServicePaymentBadge,
  ServiceRequestStatusBadge,
} from "./ServiceRequestStatusBadge";
import {
  SERVICE_CATEGORY_FILTERS,
  SERVICE_PAYMENT_LABELS,
  SERVICE_STATUS_LABELS,
  SERVICE_STATUS_ORDER,
  type AdminServiceRequest,
  type AdminServiceRequestStatus,
  type ServiceCategory,
  type ServicePaymentStatus,
} from "@/data/serviceRequests";

const PAGE_SIZE = 8;

type CategoryFilter = "all" | ServiceCategory;
type StatusFilter = "all" | AdminServiceRequestStatus;
type PaymentFilter = "all" | ServicePaymentStatus;

type ServiceRequestTableProps = {
  requests: AdminServiceRequest[];
  onView: (request: AdminServiceRequest) => void;
  onChangeStatus: (request: AdminServiceRequest, status: AdminServiceRequestStatus) => void;
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
        className="h-8 w-full cursor-pointer appearance-none rounded-lg border border-admin-border bg-white bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%237183A6%22%20stroke-width%3D%222.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px] bg-[position:right_0.6rem_center] bg-no-repeat pr-7 pl-2.5 font-poppins text-[11px] font-medium text-admin-text outline-none transition-colors hover:border-admin-secondary/40 focus:border-admin-secondary focus:ring-2 focus:ring-admin-secondary/15"
      >
        {children}
      </select>
    </div>
  );
}

/**
 * Compact, filterable service-request queue. All filtering, selection and
 * paging happen in local state over the sample dataset; status changes are
 * handed back to the page so the statistics stay in sync.
 */
export function ServiceRequestTable({
  requests,
  onView,
  onChangeStatus,
  onBulkStatus,
}: ServiceRequestTableProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [payment, setPayment] = useState<PaymentFilter>("all");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();

    return requests
      .filter((request) => category === "all" || request.category === category)
      .filter((request) => status === "all" || request.status === status)
      .filter((request) => payment === "all" || request.paymentStatus === payment)
      .filter((request) => {
        if (!term) return true;
        const haystack =
          `${request.id} ${request.studentName} ${request.studentNumber} ${request.service} ${request.category} ${request.kioskTicket ?? ""}`.toLowerCase();
        return haystack.includes(term);
      })
      .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  }, [requests, category, status, payment, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const rows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const resetPage = () => setPage(1);

  const clearFilters = () => {
    setQuery("");
    setCategory("all");
    setStatus("all");
    setPayment("all");
    setPage(1);
  };

  const hasFilters =
    query.trim().length > 0 || category !== "all" || status !== "all" || payment !== "all";

  const visibleIds = rows.map((request) => request.id);
  const selectedOnPage = visibleIds.filter((id) => selectedIds.includes(id));
  const allOnPageSelected = visibleIds.length > 0 && selectedOnPage.length === visibleIds.length;
  const someOnPageSelected = selectedOnPage.length > 0 && !allOnPageSelected;

  const toggleRow = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id],
    );
  };

  const togglePage = () => {
    setSelectedIds((current) =>
      allOnPageSelected
        ? current.filter((id) => !visibleIds.includes(id))
        : Array.from(new Set([...current, ...visibleIds])),
    );
  };

  return (
    <section
      aria-labelledby="service-request-heading"
      className="overflow-hidden rounded-[10px] border border-admin-border bg-admin-card shadow-[0_2px_12px_rgba(24,52,111,0.04)]"
    >
      <div className="border-b border-admin-border/70 px-4 pt-3.5 pb-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <h2
              id="service-request-heading"
              className="font-poppins text-[15px] leading-tight font-semibold text-admin-text"
            >
              Service Request Management
            </h2>
            <p className="mt-0.5 font-poppins text-[11px] leading-snug text-admin-muted">
              Review, route and release student document requests across all service windows.
            </p>
          </div>

          <label className="relative w-full sm:w-72">
            <span className="sr-only">Search service requests</span>
            <Search
              className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-admin-muted"
              aria-hidden
            />
            <input
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                resetPage();
              }}
              placeholder="Search by Request ID, Student Name, or Service..."
              className="h-8 w-full rounded-lg border border-admin-border bg-white pr-8 pl-8 font-poppins text-[11px] text-admin-text outline-none placeholder:text-admin-muted/80 focus:border-admin-secondary focus:ring-2 focus:ring-admin-secondary/15"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  resetPage();
                }}
                aria-label="Clear search"
                className="absolute top-1/2 right-1.5 -translate-y-1/2 cursor-pointer rounded p-0.5 text-admin-muted transition-colors hover:bg-admin-page hover:text-admin-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-info"
              >
                <X className="h-3 w-3" aria-hidden />
              </button>
            )}
          </label>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2.5 sm:flex sm:flex-wrap sm:items-end">
          <FilterSelect
            id="service-category-filter"
            label="Category"
            value={category}
            onChange={(value) => {
              setCategory(value as CategoryFilter);
              resetPage();
            }}
            className="sm:w-44"
          >
            <option value="all">All Categories</option>
            {SERVICE_CATEGORY_FILTERS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </FilterSelect>

          <FilterSelect
            id="service-status-filter"
            label="Status"
            value={status}
            onChange={(value) => {
              setStatus(value as StatusFilter);
              resetPage();
            }}
            className="sm:w-40"
          >
            <option value="all">All Statuses</option>
            {SERVICE_STATUS_ORDER.map((option) => (
              <option key={option} value={option}>
                {SERVICE_STATUS_LABELS[option]}
              </option>
            ))}
          </FilterSelect>

          <FilterSelect
            id="service-payment-filter"
            label="Fee Status"
            value={payment}
            onChange={(value) => {
              setPayment(value as PaymentFilter);
              resetPage();
            }}
            className="col-span-2 sm:col-span-1 sm:w-44"
          >
            <option value="all">All Payments</option>
            {(Object.keys(SERVICE_PAYMENT_LABELS) as ServicePaymentStatus[]).map((option) => (
              <option key={option} value={option}>
                {SERVICE_PAYMENT_LABELS[option]}
              </option>
            ))}
          </FilterSelect>

          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="col-span-2 inline-flex h-8 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-admin-border bg-white px-3 font-poppins text-[10.5px] font-semibold text-admin-muted transition-colors hover:border-admin-secondary/40 hover:text-admin-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-info sm:col-span-1"
            >
              <FilterX className="h-3.5 w-3.5" aria-hidden />
              Reset
            </button>
          )}
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-admin-border/70 bg-admin-header/50 px-4 py-2">
          <p className="font-poppins text-[10.5px] font-semibold text-admin-text">
            <span className="tabular-nums">{selectedIds.length}</span> request
            {selectedIds.length === 1 ? "" : "s"} selected
          </p>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                onBulkStatus(selectedIds, "processing");
                setSelectedIds([]);
              }}
              className="cursor-pointer rounded-md border border-admin-border bg-white px-2.5 py-1 font-poppins text-[10px] font-semibold text-admin-secondary transition-colors hover:bg-admin-page focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-info"
            >
              Mark Processing
            </button>
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="cursor-pointer rounded-md px-2.5 py-1 font-poppins text-[10px] font-semibold text-admin-muted transition-colors hover:text-admin-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-info"
            >
              Clear selection
            </button>
          </div>
        </div>
      )}

      {rows.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No service requests match"
          description={
            hasFilters
              ? "Try a different request ID, student name, service, or reset the filters."
              : "There are no service requests in this queue right now."
          }
          action={
            hasFilters ? (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-1 cursor-pointer rounded-md border border-admin-border bg-white px-3 py-1.5 font-poppins text-[11px] font-semibold text-admin-secondary transition-colors hover:bg-admin-page focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-info"
              >
                Reset filters
              </button>
            ) : undefined
          }
        />
      ) : (
        <>
          <div className="relative overflow-x-auto">
            <table className="w-full min-w-[980px] border-collapse">
              <caption className="sr-only">
                Student service requests. {filtered.length} results.
              </caption>
              <thead>
                <tr className="border-b border-admin-border/70 bg-admin-header/60">
                  <th scope="col" className="w-9 px-3 py-2">
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
                    "Request ID",
                    "Student Name & No.",
                    "Service Item Requested",
                    "Date & Payment Status",
                    "Status",
                    "Actions",
                  ].map((label) => (
                    <th
                      key={label}
                      scope="col"
                      className={cn(
                        "px-3 py-2 font-poppins text-[9.5px] font-bold tracking-[0.09em] text-admin-muted uppercase",
                        label === "Actions" ? "text-right" : "text-left",
                      )}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-border/60">
                {rows.map((request) => (
                  <tr
                    key={request.id}
                    className="transition-colors hover:bg-admin-page/50"
                  >
                    <td className="px-3 py-2.5">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(request.id)}
                        onChange={() => toggleRow(request.id)}
                        aria-label={`Select ${request.id}`}
                        className="h-3.5 w-3.5 cursor-pointer accent-admin-secondary"
                      />
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span className="font-poppins text-[11px] font-bold text-admin-secondary">
                        {request.id}
                      </span>
                      <span className="mt-0.5 flex flex-wrap items-center gap-1">
                        {request.overdue && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-rose-50 px-1.5 py-0.5 font-poppins text-[9px] font-bold text-rose-600">
                            <AlertTriangle className="h-2.5 w-2.5" aria-hidden />
                            Overdue
                          </span>
                        )}
                        {request.kioskTicket && (
                          <span className="rounded-full bg-admin-page px-1.5 py-0.5 font-poppins text-[9px] font-semibold text-admin-muted">
                            Ticket {request.kioskTicket}
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <span
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-admin-accent/60 font-poppins text-[9.5px] font-bold text-admin-secondary"
                          aria-hidden
                        >
                          {initials(request.studentName)}
                        </span>
                        <span className="min-w-0">
                          <span className="block max-w-[170px] truncate font-poppins text-[11.5px] font-semibold text-admin-text">
                            {request.studentName}
                          </span>
                          <span className="block font-poppins text-[10px] text-admin-muted">
                            {request.studentNumber}
                          </span>
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="block max-w-[220px] truncate font-poppins text-[11px] font-medium text-admin-text">
                        {request.service}
                      </span>
                      <span className="block max-w-[220px] truncate font-poppins text-[9.5px] text-admin-muted">
                        {request.pickupMethod}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span className="block font-poppins text-[10.5px] text-admin-muted">
                        {formatDateTime(request.submittedAt)}
                      </span>
                      <span className="mt-0.5 inline-flex">
                        <ServicePaymentBadge status={request.paymentStatus} />
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <ServiceRequestStatusBadge status={request.status} />
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onView(request)}
                          aria-label={`View ${request.id} details`}
                          title="View details"
                          className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-admin-border bg-white text-admin-muted transition-colors hover:border-admin-secondary/40 hover:bg-admin-page hover:text-admin-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-info"
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
                          className="h-7 cursor-pointer rounded-md border border-admin-border bg-white px-1.5 font-poppins text-[10px] font-semibold text-admin-text outline-none transition-colors hover:border-admin-secondary/40 focus:border-admin-secondary focus:ring-2 focus:ring-admin-secondary/15"
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

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-admin-border/70 px-4 py-2.5">
            <p className="font-poppins text-[10px] text-admin-muted">
              Showing{" "}
              <span className="font-semibold text-admin-text tabular-nums">
                {(safePage - 1) * PAGE_SIZE + 1}–
                {Math.min(safePage * PAGE_SIZE, filtered.length)}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-admin-text tabular-nums">
                {filtered.length}
              </span>{" "}
              service requests
              <span className="mx-1.5 text-admin-border">|</span>
              Sample data for interface review — changes stay in this browser session.
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
