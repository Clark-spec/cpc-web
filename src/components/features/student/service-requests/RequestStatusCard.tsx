import { Link } from "react-router";
import { ClipboardList } from "lucide-react";
import type { ServiceRequest } from "@/services/serviceRequests";
import { RequestTimeline } from "./RequestTimeline";
import { StatusBadge } from "./StatusBadge";

type RequestStatusCardProps = {
  request: ServiceRequest | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
};

function ClockIcon({ className }: { className?: string }) {
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
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}

export function RequestStatusCard({ request, loading, error, onRetry }: RequestStatusCardProps) {
  return (
    <section className="sr-card p-5 sm:p-6" aria-labelledby="request-status-title">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2
            id="request-status-title"
            className="font-poppins text-[15px] font-semibold text-sr-text"
          >
            Track Status
          </h2>
          <p className="mt-1 truncate font-poppins text-[11px] leading-[17px] text-sr-muted">
            {request ? `Latest request: ${request.service.name}` : "Follow your request progress"}
          </p>
        </div>
        {request && <StatusBadge status={request.status} label={request.statusLabel} />}
      </div>

      {loading ? (
        <div className="mt-5 space-y-3" aria-hidden>
          <div className="h-[58px] animate-pulse rounded-lg bg-sr-section" />
          <div className="h-4 w-3/4 animate-pulse rounded bg-sr-section" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-sr-section" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-sr-section" />
        </div>
      ) : error ? (
        <div className="mt-5 rounded-lg border border-[#F8CBCB] bg-[#FDECEC] px-3 py-3">
          <p className="font-poppins text-[11px] leading-[16px] text-[#C53030]">{error}</p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-2 rounded-md border border-[#F8CBCB] bg-white px-2.5 py-1 font-poppins text-[11px] font-semibold text-[#C53030]"
          >
            Try again
          </button>
        </div>
      ) : !request ? (
        <div className="mt-5 flex flex-col items-center rounded-lg border border-dashed border-sr-border bg-[#F8FAFF] px-4 py-8 text-center">
          <ClockIcon className="h-7 w-7 text-sr-muted" />
          <p className="mt-2 font-poppins text-[12px] font-semibold text-sr-text">No requests yet</p>
          <p className="mt-1 max-w-[220px] font-poppins text-[11px] leading-[16px] text-sr-muted">
            Submit a request and its progress will appear here.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-4 rounded-lg border border-sr-border bg-sr-section px-3.5 py-3">
            <p className="font-poppins text-[10px] font-semibold tracking-[0.08em] text-sr-muted uppercase">
              Reference Number
            </p>
            <p className="mt-0.5 font-poppins text-[15px] font-bold tracking-[0.02em] text-sr-primary">
              {request.referenceNumber}
            </p>
          </div>

          <RequestTimeline timeline={request.timeline} />

          {request.status === "rejected" && (
            <div className="mt-3 rounded-md border border-[#F8CBCB] bg-[#FDECEC] px-3 py-2 font-poppins text-[11px] leading-[16px] text-[#C53030]">
              This request was rejected. Please contact the student services office for details.
            </div>
          )}
        </>
      )}

      {!loading && (
        <Link
          to="/student/request-status"
          className="sr-btn-primary mt-4 w-full transition-shadow hover:shadow-[0_6px_16px_rgba(25,60,154,0.22)]"
        >
          <ClipboardList className="h-4 w-4" aria-hidden />
          View Request Status
        </Link>
      )}
    </section>
  );
}
