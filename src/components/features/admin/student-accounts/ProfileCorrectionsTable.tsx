import { ArrowRight, Eye, Inbox, SearchX } from "lucide-react";
import { EmptyState } from "@/components/common/display/EmptyState";
import { TablePagination } from "@/components/features/admin/student-accounts/TablePagination";
import { CorrectionStatusBadge } from "@/components/features/admin/student-accounts/statusBadges";
import {
  CARD_SHELL,
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

/** Compact correction request cards that fit without horizontal scrolling. */
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
          <div className="max-h-[65vh] space-y-3 overflow-y-auto p-3 sm:p-4">
            <p className="sr-only" role="status">
              {totalRows} correction requests match your filters. Showing {rows.length} on this page.
            </p>
            {rows.map((request) => (
              <article
                key={request.id}
                className="min-w-0 rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm transition-all duration-200 hover:border-cpc-blue-accent/30 hover:shadow-md sm:p-5"
              >
                <div className="mb-3 flex items-center justify-between gap-3 sm:hidden">
                  <time dateTime={request.submittedAt} className="font-poppins text-xs text-slate-500">{formatDate(request.submittedAt)}</time>
                  <CorrectionStatusBadge status={request.status} />
                </div>

                <div className="grid min-w-0 items-center gap-4 sm:grid-cols-[minmax(0,0.95fr)_minmax(0,1.25fr)_minmax(190px,auto)] sm:gap-6">
                  <div className="flex min-w-0 items-center gap-3">
                  <span aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cpc-blue-accent to-cpc-navy font-poppins text-xs font-semibold text-white shadow-sm ring-2 ring-cpc-section-light">
                    {initialsOf(request.studentName)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-poppins text-[15px] font-semibold text-slate-900" title={request.studentName}>{request.studentName}</p>
                    <p className="mt-0.5 font-poppins text-[13px] text-slate-500">ID {request.studentId}</p>
                    <p className="mt-1 inline-flex max-w-full truncate rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] text-slate-600" title={request.referenceNumber}>{request.referenceNumber}</p>
                  </div>
                </div>

                  <div className="min-w-0 rounded-lg bg-slate-50/80 px-3 py-2.5 sm:bg-transparent sm:px-0 sm:py-0">
                    <p className="font-poppins text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">{request.field}</p>
                    <div className="mt-2 flex min-w-0 items-center gap-2.5">
                    <div className="min-w-0">
                      <p className="font-poppins text-[11px] font-medium text-slate-400">Current</p>
                      <p className="line-clamp-2 break-words font-poppins text-[13px] text-slate-500" title={request.currentValue}>{request.currentValue || "Not provided"}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-slate-300" aria-hidden />
                    <div className="min-w-0 rounded-md bg-cpc-blue-accent/[0.06] px-2 py-1">
                      <p className="font-poppins text-[11px] font-medium text-slate-400">Requested</p>
                      <p className="line-clamp-2 break-words font-poppins text-[13px] font-semibold text-cpc-blue-accent" title={request.requestedValue}>{request.requestedValue}</p>
                    </div>
                  </div>
                </div>

                <div className="flex min-w-0 flex-col gap-2 sm:items-end">
                  <time dateTime={request.submittedAt} className="hidden font-poppins text-xs text-slate-500 sm:block">{formatDate(request.submittedAt)}</time>
                  <div className="flex min-w-0 items-center gap-2 sm:justify-end">
                    <span className="hidden sm:inline-flex"><CorrectionStatusBadge status={request.status} /></span>
                  <button
                    type="button"
                    onClick={() => onView(request)}
                    aria-label={`Review ${request.referenceNumber}`}
                    className="inline-flex w-full shrink-0 items-center justify-center gap-1.5 rounded-lg border border-cpc-blue-accent/25 bg-white px-3 py-2 font-poppins text-xs font-semibold text-cpc-blue-accent transition-colors hover:border-cpc-blue-accent/50 hover:bg-cpc-section-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent sm:w-auto sm:py-1.5"
                  >
                    <Eye className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    Review
                  </button>
                  </div>
                </div>
                </div>
              </article>
            ))}
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
