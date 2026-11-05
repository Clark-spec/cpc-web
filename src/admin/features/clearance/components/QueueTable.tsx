import { ChevronLeft, ChevronRight } from "lucide-react";
import { TableSkeleton } from "@/admin/components/Skeleton";
import { cn } from "@/lib/cn";
import { useClearanceAdmin } from "../context/ClearanceAdminContext";
import { EmptyState } from "./EmptyState";
import { QueueRow } from "./QueueRow";
import type { ClearanceRequestRow } from "../types";

type QueueTableProps = {
  /** Opens/focuses the review panel — the page owns panel state. */
  onSelect: (id: string) => void;
  /** Opens the Approve & Sign modal for this row. */
  onSign: (row: ClearanceRequestRow) => void;
  /** Opens the Reject modal for this row. */
  onReject: (row: ClearanceRequestRow) => void;
};

const HEADER_CELL =
  "sticky top-0 z-10 bg-cpc-section-light px-3 py-2.5 font-poppins text-[10px] font-bold tracking-[0.1em] text-cpc-heading-soft uppercase whitespace-nowrap";

const PAGE_SIZES = [10, 25, 50];

/**
 * Table view of the queue (spec §3): semantic table with a sticky light-blue
 * header, internal horizontal scroll (`admin-scrollbar`) so the page itself
 * never scrolls sideways, keyboard row navigation via QueueRow, and a
 * pagination footer wired to `setFilter("page" | "pageSize")`.
 */
export function QueueTable({ onSelect, onSign, onReject }: QueueTableProps) {
  const {
    isSuperAdmin,
    pageRows,
    visibleRows,
    totalRows,
    totalPages,
    selectedRow,
    checkedIds,
    filters,
    setFilter,
    toggleChecked,
    toggleCheckedAll,
    loading,
    hasActiveFilters,
    resetFilters,
  } = useClearanceAdmin();

  const allChecked = pageRows.length > 0 && pageRows.every((row) => checkedIds.includes(row.id));
  const someChecked = pageRows.some((row) => checkedIds.includes(row.id));

  const rangeStart = totalRows === 0 ? 0 : (filters.page - 1) * filters.pageSize + 1;
  const rangeEnd = Math.min(totalRows, filters.page * filters.pageSize);

  const navButton =
    "inline-flex cursor-pointer items-center gap-1 rounded-lg border border-cpc-tile-border bg-white px-2.5 py-1.5 font-poppins text-[11px] font-semibold text-cpc-navy-text transition-colors hover:bg-cpc-section-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <section
      aria-label="Clearance request queue"
      className="rounded-2xl border border-cpc-tile-border/70 bg-white shadow-[0_18px_50px_rgba(15,36,104,0.22)]"
    >
      {loading ? (
        <TableSkeleton rows={6} />
      ) : visibleRows.length === 0 ? (
        <EmptyState hasActiveFilters={hasActiveFilters} onClearFilters={resetFilters} />
      ) : (
        <>
          <div className="admin-scrollbar max-h-[65vh] overflow-auto">
            <table
              className={cn(
                "w-full border-collapse",
                isSuperAdmin ? "min-w-[880px]" : "min-w-[800px]",
              )}
            >
              <caption className="sr-only">
                Clearance requests for your office. {visibleRows.length} matching rows,{" "}
                {pageRows.length} shown on this page. Use arrow keys to move between rows,{" "}
                Enter to open a request, Space to select it.
              </caption>
              <thead>
                <tr className="border-b border-cpc-tile-border/60">
                  <th scope="col" className={cn(HEADER_CELL, "w-10 text-left")}>
                    <input
                      ref={(element) => {
                        if (element) element.indeterminate = someChecked && !allChecked;
                      }}
                      type="checkbox"
                      checked={allChecked}
                      onChange={toggleCheckedAll}
                      aria-label={allChecked ? "Deselect all rows on this page" : "Select all rows on this page"}
                      className="h-3.5 w-3.5 cursor-pointer accent-cpc-blue-accent"
                    />
                  </th>
                  <th scope="col" className={cn(HEADER_CELL, "text-left")}>
                    Student
                  </th>
                  <th scope="col" className={cn(HEADER_CELL, "text-left")}>
                    Section
                  </th>
                  {isSuperAdmin && (
                    <th scope="col" className={cn(HEADER_CELL, "text-left")}>
                      Office
                    </th>
                  )}
                  <th scope="col" className={cn(HEADER_CELL, "text-left")}>
                    Requested
                  </th>
                  <th scope="col" className={cn(HEADER_CELL, "text-left")}>
                    Note
                  </th>
                  <th scope="col" className={cn(HEADER_CELL, "text-left")}>
                    Status
                  </th>
                  <th scope="col" className={cn(HEADER_CELL, "text-right")}>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cpc-tile-border/50">
                {pageRows.map((row, index) => (
                  <QueueRow
                    key={row.id}
                    row={row}
                    index={index}
                    selected={selectedRow?.id === row.id}
                    checked={checkedIds.includes(row.id)}
                    onSelect={onSelect}
                    onToggle={toggleChecked}
                    onSign={onSign}
                    onReject={onReject}
                  />
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-cpc-tile-border/60 px-3 py-2.5">
            <p aria-live="polite" className="font-poppins text-[11px] font-medium text-cpc-heading-soft">
              Showing {rangeStart}–{rangeEnd} of {totalRows}
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <label htmlFor="queue-page-size" className="font-poppins text-[11px] font-semibold text-cpc-heading-soft">
                Rows per page
              </label>
              <select
                id="queue-page-size"
                value={filters.pageSize}
                onChange={(event) => setFilter("pageSize", Number(event.target.value))}
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
                  disabled={filters.page <= 1}
                  onClick={() => setFilter("page", Math.max(1, filters.page - 1))}
                  aria-label="Previous page"
                  className={navButton}
                >
                  <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
                  Prev
                </button>
                <button
                  type="button"
                  disabled={filters.page >= totalPages}
                  onClick={() => setFilter("page", filters.page + 1)}
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
