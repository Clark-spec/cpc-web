import { Eye, Inbox, SearchX } from "lucide-react";
import { EmptyState } from "@/components/common/display/EmptyState";
import { TablePagination } from "@/components/features/admin/student-accounts/TablePagination";
import { CorrectionStatusBadge } from "@/components/features/admin/student-accounts/statusBadges";
import {
  CELL,
  CARD_SHELL,
  HEADER_CELL,
  ROW_ACTION,
  initialsOf,
} from "@/components/features/admin/student-accounts/shared";
import { formatDate } from "@/lib/format";
import type { ProfileCorrectionRequest } from "@/components/features/admin/student-accounts/types";

type ProfileCorrectionsTableProps = {
  rows: ProfileCorrectionRequest[];
  totalRows: number;
  page: number;
  pageSize: number;
  hasActiveFilters: boolean;
  onView: (request: ProfileCorrectionRequest) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onClearFilters: () => void;
};

/** Correction queue table with the nine columns the registrar works from. */
export function ProfileCorrectionsTable({
  rows,
  totalRows,
  page,
  pageSize,
  hasActiveFilters,
  onView,
  onPageChange,
  onPageSizeChange,
  onClearFilters,
}: ProfileCorrectionsTableProps) {
  return (
    <section aria-label="Profile correction queue" className={CARD_SHELL}>
      {totalRows === 0 ? (
        <EmptyState
          icon={hasActiveFilters ? SearchX : Inbox}
          title={
            hasActiveFilters
              ? "No correction requests match these filters"
              : "No correction requests yet"
          }
          description={
            hasActiveFilters
              ? "Try a different search, status, course or date range."
              : "Requests submitted by students through the portal will appear here."
          }
          action={
            hasActiveFilters ? (
              <button
                type="button"
                onClick={onClearFilters}
                className="cursor-pointer rounded-lg border border-cpc-tile-border bg-white px-3 py-2 font-poppins text-xs font-semibold text-cpc-navy-text transition-colors hover:bg-cpc-section-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
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
            <table className="w-full min-w-[1230px] border-collapse">
              <caption className="sr-only">
                Profile correction requests. {totalRows} matching records, {rows.length}{" "}
                shown on this page.
              </caption>
              <thead>
                <tr className="border-b border-cpc-tile-border/60">
                  <th scope="col" className={HEADER_CELL}>
                    Request ID
                  </th>
                  <th scope="col" className={HEADER_CELL}>
                    Student Name
                  </th>
                  <th scope="col" className={HEADER_CELL}>
                    Student ID
                  </th>
                  <th scope="col" className={HEADER_CELL}>
                    Field to Correct
                  </th>
                  <th scope="col" className={HEADER_CELL}>
                    Current Value
                  </th>
                  <th scope="col" className={HEADER_CELL}>
                    Requested Value
                  </th>
                  <th scope="col" className={HEADER_CELL}>
                    Date Submitted
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
                {rows.map((request) => (
                  <tr
                    key={request.id}
                    onClick={() => onView(request)}
                    className="cursor-pointer transition-colors hover:bg-cpc-section-light/30"
                  >
                    <td className={CELL}>
                      <p className="font-poppins text-[11px] font-bold text-cpc-navy-text whitespace-nowrap">
                        {request.referenceNumber}
                      </p>
                    </td>

                    <td className={CELL}>
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span
                          aria-hidden
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cpc-navy font-poppins text-[10px] font-semibold text-white"
                        >
                          {initialsOf(request.studentName)}
                        </span>
                        <p
                          className="max-w-[15rem] truncate font-poppins text-xs font-semibold text-cpc-navy-text"
                          title={request.studentName}
                        >
                          {request.studentName}
                        </p>
                      </div>
                    </td>

                    <td className={CELL}>
                      <span className="font-poppins text-[11px] text-cpc-navy-text whitespace-nowrap">
                        {request.studentId}
                      </span>
                    </td>

                    <td className={CELL}>
                      <span className="font-poppins text-[11px] font-semibold text-cpc-navy-text whitespace-nowrap">
                        {request.field}
                      </span>
                    </td>

                    <td className={CELL}>
                      <p
                        className="max-w-[12rem] truncate font-poppins text-[11px] text-cpc-heading-soft"
                        title={request.currentValue}
                      >
                        {request.currentValue}
                      </p>
                    </td>

                    <td className={CELL}>
                      <p
                        className="max-w-[12rem] truncate font-poppins text-[11px] font-semibold text-cpc-blue-accent"
                        title={request.requestedValue}
                      >
                        {request.requestedValue}
                      </p>
                    </td>

                    <td className={CELL}>
                      <time
                        dateTime={request.submittedAt}
                        className="font-poppins text-[11px] text-cpc-navy-text whitespace-nowrap"
                      >
                        {formatDate(request.submittedAt)}
                      </time>
                    </td>

                    <td className={CELL}>
                      <CorrectionStatusBadge status={request.status} />
                    </td>

                    <td className={`${CELL} text-right`}>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onView(request);
                        }}
                        aria-label={`View ${request.referenceNumber}`}
                        className={ROW_ACTION}
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

          <TablePagination
            idPrefix="correction"
            totalRows={totalRows}
            page={page}
            pageSize={pageSize}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
          />
        </>
      )}
    </section>
  );
}
