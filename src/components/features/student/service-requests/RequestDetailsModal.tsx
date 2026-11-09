import { useEffect, useState } from "react";
import {
  downloadDocument,
  getErrorMessage,
  getServiceRequest,
  type ServiceRequest,
} from "@/services/serviceRequests/student";
import { RequestTimeline } from "@/components/features/student/service-requests/RequestTimeline";
import { StatusBadge } from "@/components/features/student/service-requests/StatusBadge";
import { formatDateTime, formatFileSize } from "@/components/features/student/service-requests/format";

type RequestDetailsModalProps = {
  requestId: number;
  onClose: () => void;
};

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      className={className}
      aria-hidden
    >
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}

function FileIcon({ className }: { className?: string }) {
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
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h6M9 16.5h4" />
    </svg>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-poppins text-[10px] font-semibold tracking-[0.06em] text-sr-muted uppercase">
        {label}
      </p>
      <p className="mt-0.5 font-poppins text-[12px] leading-[18px] text-sr-text">{value}</p>
    </div>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="m3.5 8.5 3 3 6-7" />
    </svg>
  );
}

function RequirementRow({ label, detail }: { label: string; detail: string }) {
  return (
    <li className="flex items-start gap-2">
      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#E3F7EE] text-[#1E8A57]">
        <CheckIcon className="h-2.5 w-2.5" />
      </span>
      <span className="min-w-0">
        <span className="block font-poppins text-[11.5px] leading-[16px] font-medium text-sr-text">
          {label}
        </span>
        <span className="block truncate font-poppins text-[10px] leading-[14px] text-sr-muted">
          {detail}
        </span>
      </span>
    </li>
  );
}

export function RequestDetailsModal({ requestId, onClose }: RequestDetailsModalProps) {
  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const activeStage = request?.timeline.find((stage) => stage.state === "active") ?? null;
  const officeRemarks =
    request?.remarks?.trim() ||
    activeStage?.description ||
    "No remarks from the office yet.";

  useEffect(() => {
    let active = true;

    getServiceRequest(requestId)
      .then((data) => {
        if (active) setRequest(data);
      })
      .catch((loadError) => {
        if (active) setError(getErrorMessage(loadError));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [requestId]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  async function handleDownload() {
    if (!request) return;
    setDownloading(true);
    setDownloadError(null);
    try {
      await downloadDocument(request.id, request.document.name);
    } catch (downloadFailure) {
      setDownloadError(getErrorMessage(downloadFailure));
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1F4B]/60 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="request-details-title"
        className="sr-card flex max-h-[90vh] w-full max-w-[560px] flex-col overflow-hidden"
      >
        <div className="flex items-start justify-between gap-4 border-b border-sr-border px-5 py-4">
          <div>
            <h2
              id="request-details-title"
              className="font-poppins text-[15px] font-semibold text-sr-text"
            >
              Request Details
            </h2>
            <p className="mt-0.5 font-poppins text-[11px] text-sr-muted">
              {request ? request.referenceNumber : "Loading request…"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            autoFocus
            aria-label="Close request details"
            className="rounded-md p-1.5 text-sr-muted transition-colors hover:bg-sr-page hover:text-sr-text"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4">
          {loading && (
            <div className="space-y-3" aria-hidden>
              <div className="h-4 w-1/2 animate-pulse rounded bg-sr-section" />
              <div className="h-16 animate-pulse rounded-lg bg-sr-section" />
              <div className="h-24 animate-pulse rounded-lg bg-sr-section" />
            </div>
          )}

          {!loading && error && (
            <div className="rounded-lg border border-[#F8CBCB] bg-[#FDECEC] px-3 py-3">
              <p className="font-poppins text-[11px] leading-[16px] text-[#C53030]">{error}</p>
            </div>
          )}

          {!loading && !error && request && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-sr-border bg-sr-section px-3.5 py-3">
                <div>
                  <p className="font-poppins text-[10px] font-semibold tracking-[0.08em] text-sr-muted uppercase">
                    Reference Number
                  </p>
                  <p className="mt-0.5 font-poppins text-[15px] font-bold text-sr-primary">
                    {request.referenceNumber}
                  </p>
                </div>
                <StatusBadge status={request.status} label={request.statusLabel} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Detail label="Service" value={request.service.name} />
                <Detail label="Current Status" value={request.statusLabel} />
                <Detail label="Purpose" value={request.purpose} />
                <Detail label="Number of Copies" value={String(request.copies)} />
                <Detail label="Date Submitted" value={formatDateTime(request.submittedAt)} />
                <Detail label="Last Updated" value={formatDateTime(request.updatedAt)} />
              </div>

              {request.notes && (
                <div>
                  <p className="font-poppins text-[10px] font-semibold tracking-[0.06em] text-sr-muted uppercase">
                    Additional Notes
                  </p>
                  <p className="mt-1 rounded-md bg-[#F8FAFF] px-3 py-2 font-poppins text-[12px] leading-[18px] whitespace-pre-wrap text-sr-text">
                    {request.notes}
                  </p>
                </div>
              )}

              <div>
                <p className="font-poppins text-[10px] font-semibold tracking-[0.06em] text-sr-muted uppercase">
                  Requirements Submitted
                </p>
                <ul className="mt-1.5 grid gap-2 rounded-lg border border-sr-border bg-[#FBFDFF] px-3 py-2.5 sm:grid-cols-2">
                  <RequirementRow label="Request details" detail="Service, purpose and copies" />
                  <RequirementRow
                    label="Valid student ID"
                    detail={request.document.name || "Uploaded document"}
                  />
                  <RequirementRow label="Contact details" detail="From your student account" />
                  <RequirementRow label="Submission" detail="Received by student services" />
                </ul>
              </div>

              <div>
                <p className="font-poppins text-[10px] font-semibold tracking-[0.06em] text-sr-muted uppercase">
                  Uploaded Document
                </p>
                <div className="mt-1 flex items-center gap-3 rounded-lg border border-sr-border px-3 py-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-sr-section text-sr-primary">
                    <FileIcon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-poppins text-[12px] font-medium text-sr-text">
                      {request.document.name}
                    </p>
                    <p className="font-poppins text-[10px] text-sr-muted">
                      {formatFileSize(request.document.size)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownload}
                    disabled={downloading}
                    className="rounded-md border border-sr-border px-2.5 py-1 font-poppins text-[11px] font-semibold text-sr-primary transition-colors hover:bg-sr-page disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {downloading ? "Preparing…" : "Download"}
                  </button>
                </div>
                {downloadError && (
                  <p className="mt-1 font-poppins text-[10px] text-sr-danger">{downloadError}</p>
                )}
              </div>

              <div>
                <p className="font-poppins text-[10px] font-semibold tracking-[0.06em] text-sr-muted uppercase">
                  Office Remarks
                </p>
                <p className="mt-1 rounded-lg border border-sr-border bg-[#F8FAFF] px-3 py-2 font-poppins text-[11.5px] leading-[17px] text-sr-text">
                  {officeRemarks}
                </p>
              </div>

              <div>
                <p className="font-poppins text-[10px] font-semibold tracking-[0.06em] text-sr-muted uppercase">
                  Progress
                </p>
                <RequestTimeline timeline={request.timeline} />
                {request.status === "rejected" && (
                  <div className="mt-3 rounded-md border border-[#F8CBCB] bg-[#FDECEC] px-3 py-2 font-poppins text-[11px] leading-[16px] text-[#C53030]">
                    This request was rejected. Please contact the student services office for details.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
