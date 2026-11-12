import { ChevronLeft, ChevronRight, Eye, EyeOff, Inbox, SearchX } from "lucide-react";
import { EmptyState } from "@/components/common/display/EmptyState";
import { ComplaintStatusBadge } from "@/components/features/student/complaints/ComplaintStatusBadge";
import { formatDate, formatDateTime } from "@/lib/format";
import type { AdminComplaintRow } from "@/components/features/admin/complaints/types";

type ComplaintsTableProps = {
  /** Current page slice. */
  rows: AdminComplaintRow[];
  /** Filtered total across every page. */
  totalRows: number;
  page: number;
  pageSize: number;
  /** First load in flight; shows a skeleton instead of the empty state. */
  loading?: boolean;
  hasActiveFilters: boolean;
  onView: (row: AdminComplaintRow) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onClearFilters: () => void;
};

const HEADER_CELL =
  "sticky top-0 z-10 bg-cpc-section-light px-3 py-2.5 text-left font-poppins text-[10px] font-bold tracking-[0.1em] text-cpc-heading-soft uppercase whitespace-nowrap";

const CELL = "px-3 py-3 align-middle";

const PAGE_SIZES = [10, 25, 50];

function initialsOf(name: string): string {
  return name
    .split(" ")
    .map((part) => part.charAt(0))
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/**
 * Complaint queue table (spec §3): sticky light-blue header, horizontal scroll
 * inside the card, the required eight columns, and the same pagination footer
 * pattern the clearance queue uses.
 */
export function ComplaintsTable({
  rows,
  totalRows,
  page,
  pageSize,
  loading = false,
  hasActiveFilters,
  onView,
  onPageChange,
  onPageSizeChange,
  onClearFilters,
}: ComplaintsTableProps) {
  const rangeStart = totalRows === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(totalRows, page * pageSize);

  const navButton =
    "cpc-btn cpc-btn-secondary cpc-btn-sm";

  return (
    <section
      aria-label="Complaint queue"
      className="rounded-2xl border border-cpc-tile-border/70 bg-white shadow-[0_18px_50px_rgba(15,36,104,0.22)]"
    >
      {loading && totalRows === 0 ? (
        <p
          aria-live="polite"
          className="px-4 py-14 text-center font-poppins text-xs font-medium text-cpc-heading-soft"
        >
          Loading complaints…
        </p>
      ) : totalRows === 0 ? (
        <EmptyState
          icon={hasActiveFilters ? SearchX : Inbox}
          title={hasActiveFilters ? "No complaints match these filters" : "No complaints filed yet"}
          description={
            hasActiveFilters
              ? "Try a different search, status, category or date range."
              : "Complaints submitted through the student portal will appear here."
          }
          action={
            hasActiveFilters ? (
              <button
                type="button"
                onClick={onClearFilters}
                className="cpc-btn cpc-btn-secondary cpc-btn-sm"
              >
                Clear filters
              </button>
            ) : undefined
          }
          className="py-14"
        />
      ) : (
        <>
          <div className="admin-scrollbar max-h-[65vh] overflow-auto">
            <table className="w-full min-w-[1040px] border-collapse">
              <caption className="sr-only">
                Student complaints. {totalRows} matching records, {rows.length} shown on this
                page.
              </caption>
              <thead>
                <tr className="border-b border-cpc-tile-border/60">
                  <th scope="col" className={HEADER_CELL}>
                    Reference No.
                  </th>
                  <th scope="col" className={HEADER_CELL}>
                    Student Name
                  </th>
                  <th scope="col" className={HEADER_CELL}>
                    Student ID
                  </th>
                  <th scope="col" className={HEADER_CELL}>
                    Subject
                  </th>
                  <th scope="col" className={HEADER_CELL}>
                    Category
                  </th>
                  <th scope="col" className={HEADER_CELL}>
                    Date Filed
                  </th>
                  <th scope="col" className={HEADER_CELL}>
                    Status
                  </th>
                  <th scope="col" className={`${HEADER_CELL} text-right`}>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cpc-tile-border/50">
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => onView(row)}
                    className="cursor-pointer transition-colors hover:bg-cpc-section-light/30"
                  >
                    <td className={CELL}>
                      <p className="font-poppins text-[11px] font-bold text-cpc-navy-text whitespace-nowrap">
                        {row.referenceNumber}
                      </p>
                    </td>

                    <td className={CELL}>
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span
                          aria-hidden
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cpc-navy font-poppins text-[10px] font-semibold text-white"
                        >
                          {row.anonymous ? (
                            <EyeOff className="h-3.5 w-3.5" />
                          ) : (
                            initialsOf(row.studentName)
                          )}
                        </span>
                        <div className="min-w-0">
                          <p
                            className="truncate font-poppins text-xs font-semibold text-cpc-navy-text"
                            title={row.studentName}
                          >
                            {row.studentName}
                          </p>
                          {row.anonymous && (
                            <p className="flex items-center gap-1 font-poppins text-[10px] text-cpc-heading-soft">
                              <EyeOff className="h-2.5 w-2.5 shrink-0" aria-hidden />
                              Identity hidden
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className={CELL}>
                      <span className="font-poppins text-[11px] text-cpc-navy-text whitespace-nowrap">
                        {row.studentId}
                      </span>
                    </td>

                    <td className={CELL}>
                      <p
                        className="max-w-[17rem] truncate font-poppins text-[11px] font-medium text-cpc-navy-text"
                        title={row.subject}
                      >
                        {row.subject}
                      </p>
                    </td>

                    <td className={CELL}>
                      <span className="font-poppins text-[11px] text-cpc-heading-soft whitespace-nowrap">
                        {row.category}
                      </span>
                    </td>

                    <td className={CELL}>
                      <time
                        dateTime={row.filedAt}
                        title={formatDateTime(row.filedAt)}
                        className="font-poppins text-[11px] text-cpc-navy-text whitespace-nowrap"
                      >
                        {formatDate(row.filedAt)}
                      </time>
                    </td>

                    <td className={CELL}>
                      <ComplaintStatusBadge status={row.status} />
                    </td>

                    <td className={`${CELL} text-right`}>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onView(row);
                        }}
                        aria-label={`View ${row.referenceNumber}`}
                        className="cpc-btn cpc-btn-tertiary cpc-btn-sm"
                      >
                        <Eye className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-cpc-tile-border/60 px-3 py-2.5">
            <p aria-live="polite" className="font-poppins text-[11px] font-medium text-cpc-heading-soft">
              Showing {rangeStart}–{rangeEnd} of {totalRows}
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <label
                htmlFor="complaint-page-size"
                className="font-poppins text-[11px] font-semibold text-cpc-heading-soft"
              >
                Rows per page
              </label>
              <select
                id="complaint-page-size"
                value={pageSize}
                onChange={(event) => onPageSizeChange(Number(event.target.value))}
                className="cursor-pointer rounded-lg border border-cpc-input-border bg-white px-2 py-1.5 font-poppins text-[11px] text-cpc-navy-text transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
              >
                {PAGE_SIZES.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => onPageChange(page - 1)}
                  aria-label="Previous page"
                  className={navButton}
                >
                  <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
                  Prev
                </button>
                <button
                  type="button"
                  disabled={page * pageSize >= totalRows}
                  onClick={() => onPageChange(page + 1)}
                  aria-label="Next page"
                  className={navButton}
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
