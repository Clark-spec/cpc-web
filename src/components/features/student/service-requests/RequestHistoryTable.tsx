import type { RequestId, ServiceRequest } from "@/services/serviceRequests/student";
import { StatusBadge } from "@/components/features/student/service-requests/StatusBadge";
import { formatDate } from "@/components/features/student/service-requests/format";
import { cn } from "@/lib/cn";

type RequestHistoryTableProps = {
  requests: ServiceRequest[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onView: (id: RequestId) => void;
  /** Row that just changed over SSE; flashes briefly. */
  highlightId?: string | null;
};

function HistoryIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M4 5.5h16v13H4z" />
      <path d="M4 9.5h16M9.5 9.5v9" />
    </svg>
  );
}

export function RequestHistoryTable({
  requests,
  loading,
  error,
  onRetry,
  onView,
  highlightId,
}: RequestHistoryTableProps) {
  return (
    <section className="sr-card p-5 sm:p-6" aria-labelledby="request-history-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2
            id="request-history-title"
            className="font-poppins text-[15px] font-semibold text-sr-text"
          >
            Request History
          </h2>
          <p className="mt-1 font-poppins text-[11px] leading-[17px] text-sr-muted">
            View previously submitted service requests.
          </p>
        </div>
        {!loading && !error && requests.length > 0 && (
          <span className="rounded-full border border-sr-border bg-sr-section px-2.5 py-0.5 font-poppins text-[10px] font-semibold text-sr-navy">
            {requests.length} {requests.length === 1 ? "request" : "requests"}
          </span>
        )}
      </div>

      {loading ? (
        <div className="mt-4 space-y-2" aria-hidden>
          <div className="h-9 animate-pulse rounded-md bg-sr-section" />
          <div className="h-11 animate-pulse rounded-md bg-sr-section" />
          <div className="h-11 animate-pulse rounded-md bg-sr-section" />
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
      ) : requests.length === 0 ? (
        <div className="mt-4 flex flex-col items-center rounded-lg border border-dashed border-sr-border bg-[#F8FAFF] px-4 py-9 text-center">
          <HistoryIcon className="h-7 w-7 text-sr-muted" />
          <p className="mt-2 font-poppins text-[12px] font-semibold text-sr-text">
            No service requests yet
          </p>
          <p className="mt-1 max-w-[260px] font-poppins text-[11px] leading-[16px] text-sr-muted">
            Requests you submit will be listed here with their reference numbers and status.
          </p>
        </div>
      ) : (
        <>
          {/* Mobile: stacked records so the table never overflows sideways. */}
          <ul className="mt-4 space-y-2.5 md:hidden">
            {requests.map((request) => (
              <li
                key={request.id}
                className={cn(
                  "rounded-lg border border-sr-border bg-white px-3.5 py-3",
                  highlightId === request.id && "profile-highlight",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-poppins text-[11px] font-bold tracking-[0.02em] text-sr-primary">
                      {request.referenceNumber}
                    </p>
                    <p className="mt-0.5 font-poppins text-[12px] leading-[17px] font-medium text-sr-text">
                      {request.service.name}
                    </p>
                    <p className="mt-1 font-poppins text-[10px] text-sr-muted">
                      Submitted {formatDate(request.submittedAt)}
                    </p>
                  </div>
                  <StatusBadge status={request.status} label={request.statusLabel} />
                </div>
                <button
                  type="button"
                  onClick={() => onView(request.id)}
                  className="mt-2 rounded-md px-2 py-1 font-poppins text-[11px] font-semibold text-sr-primary transition-colors hover:bg-sr-section"
                >
                  View details
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-4 hidden overflow-x-auto rounded-lg border border-sr-border md:block">
            <table className="w-full min-w-[720px] border-collapse text-left">
            <thead>
              <tr className="bg-sr-section">
                <th className="px-4 py-2.5 font-poppins text-[10px] font-semibold tracking-[0.06em] text-sr-navy uppercase">
                  Reference No.
                </th>
                <th className="px-4 py-2.5 font-poppins text-[10px] font-semibold tracking-[0.06em] text-sr-navy uppercase">
                  Service
                </th>
                <th className="px-4 py-2.5 font-poppins text-[10px] font-semibold tracking-[0.06em] text-sr-navy uppercase">
                  Date Submitted
                </th>
                <th className="px-4 py-2.5 font-poppins text-[10px] font-semibold tracking-[0.06em] text-sr-navy uppercase">
                  Status
                </th>
                <th className="px-4 py-2.5 text-right font-poppins text-[10px] font-semibold tracking-[0.06em] text-sr-navy uppercase">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr
                  key={request.id}
                  className={cn(
                    "border-t border-sr-border bg-white transition-colors hover:bg-[#FAFCFF]",
                    highlightId === request.id && "profile-highlight",
                  )}
                >
                  <td className="px-4 py-3 font-poppins text-[12px] font-semibold whitespace-nowrap text-sr-text">
                    {request.referenceNumber}
                  </td>
                  <td className="px-4 py-3 font-poppins text-[12px] text-sr-text">
                    {request.service.name}
                  </td>
                  <td className="px-4 py-3 font-poppins text-[12px] whitespace-nowrap text-sr-muted">
                    {formatDate(request.submittedAt)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={request.status} label={request.statusLabel} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => onView(request.id)}
                      className="rounded-md px-2 py-1 font-poppins text-[11px] font-semibold text-sr-primary transition-colors hover:bg-sr-section"
                    >
                      View
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
