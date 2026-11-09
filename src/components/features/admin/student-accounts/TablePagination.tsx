import { ChevronLeft, ChevronRight } from "lucide-react";
import { NAV_BUTTON, PAGE_SIZES, rangeOf } from "@/components/features/admin/student-accounts/shared";

type TablePaginationProps = {
  idPrefix: string;
  totalRows: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
};

/** Pagination footer shared by the three Student Accounts tables. */
export function TablePagination({
  idPrefix,
  totalRows,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: TablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-cpc-tile-border/60 px-3 py-2.5">
      <p aria-live="polite" className="font-poppins text-[11px] font-medium text-cpc-heading-soft">
        Showing {rangeOf(totalRows, page, pageSize)} of {totalRows}
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <label
          htmlFor={`${idPrefix}-page-size`}
          className="font-poppins text-[11px] font-semibold text-cpc-heading-soft"
        >
          Rows per page
        </label>
        <select
          id={`${idPrefix}-page-size`}
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
            className={NAV_BUTTON}
          >
            <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
            Prev
          </button>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            aria-label="Next page"
            className={NAV_BUTTON}
          >
            Next
            <ChevronRight className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
