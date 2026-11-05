import { useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Loader2,
  PenLine,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { formatDateTime, formatRelativeTime } from "@/features/clearance/lib/format";
import { StatusBadge } from "../StatusBadge";
import { ChecklistIcon } from "../StatusBadge";
import type { ClearanceRequest } from "../../types";

const OFFICE_LABELS: Record<ClearanceRequest["office"], string> = {
  instructor: "Instructor",
  dean: "Dean",
  library: "Library",
  registrar: "Registrar",
  accounting: "Accounting",
  sao: "SAO / SSG Adviser",
};

type ReviewRequestModalProps = {
  request: ClearanceRequest | null;
  onClose: () => void;
  onApprove: (request: ClearanceRequest) => void;
  onReject: (request: ClearanceRequest, remarks: string) => Promise<void>;
  busy: boolean;
};

/** Read-only request details plus the approve / reject decision points. */
export function ReviewRequestModal({
  request,
  onClose,
  onApprove,
  onReject,
  busy,
}: ReviewRequestModalProps) {
  const [rejecting, setRejecting] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!request) return null;

  const handleReject = async () => {
    if (remarks.trim().length < 10) {
      setError("Please explain what the student needs to do (at least 10 characters).");
      return;
    }
    setError(null);
    await onReject(request, remarks.trim());
  };

  return (
    <Modal
      open={request !== null}
      onClose={onClose}
      labelledBy="review-request-title"
      className="sm:max-w-2xl"
    >
      <div className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3 pr-8">
          <div className="min-w-0">
            <p className="font-poppins text-[10px] font-bold tracking-[0.14em] text-cpc-blue-accent uppercase">
              Clearance request
            </p>
            <h2
              id="review-request-title"
              className="mt-0.5 truncate font-poppins text-lg font-semibold text-cpc-navy-text"
            >
              {request.studentName}
            </h2>
            <p className="font-poppins text-[11px] text-cpc-heading-soft">
              {request.studentId} · {request.program} · {request.section}
            </p>
          </div>
          <StatusBadge status={request.status} />
        </div>

        <dl className="mt-4 grid gap-2 rounded-xl border border-cpc-tile-border/70 bg-cpc-section-light/30 p-3 sm:grid-cols-3">
          <div>
            <dt className="font-poppins text-[9px] font-bold tracking-[0.1em] text-cpc-heading-soft uppercase">
              Office
            </dt>
            <dd className="mt-0.5 font-poppins text-xs font-semibold text-cpc-navy-text">
              {OFFICE_LABELS[request.office]}
            </dd>
          </div>
          <div>
            <dt className="font-poppins text-[9px] font-bold tracking-[0.1em] text-cpc-heading-soft uppercase">
              Requested
            </dt>
            <dd
              className="mt-0.5 font-poppins text-xs font-semibold text-cpc-navy-text"
              title={formatDateTime(request.requestedAt)}
            >
              {formatRelativeTime(request.requestedAt)}
            </dd>
          </div>
          <div>
            <dt className="font-poppins text-[9px] font-bold tracking-[0.1em] text-cpc-heading-soft uppercase">
              Email
            </dt>
            <dd className="mt-0.5 truncate font-poppins text-xs font-semibold text-cpc-navy-text">
              {request.email || "—"}
            </dd>
          </div>
        </dl>

        {request.studentNote && (
          <div className="mt-3 rounded-lg border border-cpc-tile-border/60 bg-white px-3 py-2">
            <p className="font-poppins text-[9px] font-bold tracking-[0.1em] text-cpc-heading-soft uppercase">
              Student note
            </p>
            <p className="mt-0.5 font-poppins text-[11px] leading-relaxed text-cpc-navy-text">
              {request.studentNote}
            </p>
          </div>
        )}

        <div className="mt-4">
          <h3 className="font-poppins text-[10px] font-bold tracking-[0.12em] text-cpc-heading-soft uppercase">
            Requirements checklist
          </h3>
          <ul className="mt-1.5 space-y-1.5">
            {request.checklist.map((item) => (
              <li
                key={item.label}
                className="flex items-start gap-2 rounded-lg border border-cpc-tile-border/50 px-2.5 py-2"
              >
                <ChecklistIcon done={item.done} />
                <div className="min-w-0">
                  <p className="font-poppins text-[11px] font-medium text-cpc-navy-text">
                    {item.label}
                  </p>
                  {item.note && (
                    <p className="font-poppins text-[10px] leading-relaxed text-amber-700">
                      {item.note}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>

        {request.status === "signed" && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden />
              <p className="font-poppins text-[11px] font-semibold text-emerald-800">
                Signed by {request.signerName ?? "staff"}
                {request.respondedAt ? ` · ${formatDateTime(request.respondedAt)}` : ""}
              </p>
            </div>
            {request.signatureImage && (
              <img
                src={request.signatureImage}
                alt={`Signature of ${request.signerName ?? "staff"}`}
                className="mt-2 h-16 object-contain"
              />
            )}
          </div>
        )}

        {request.status === "rejected" && (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50/70 p-3">
            <div className="flex items-start gap-1.5">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" aria-hidden />
              <div>
                <p className="font-poppins text-[11px] font-semibold text-rose-800">
                  Rejected by {request.signerName ?? "staff"}
                  {request.respondedAt ? ` · ${formatDateTime(request.respondedAt)}` : ""}
                </p>
                <p className="mt-0.5 font-poppins text-[11px] leading-relaxed text-rose-700">
                  {request.remarks ?? "No remarks were provided."}
                </p>
              </div>
            </div>
          </div>
        )}

        {request.status === "pending" && rejecting && (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50/50 p-3">
            <label className="block">
              <span className="font-poppins text-[11px] font-semibold text-rose-800">
                What does the student need to do?
              </span>
              <textarea
                value={remarks}
                onChange={(event) => setRemarks(event.target.value)}
                rows={3}
                maxLength={300}
                placeholder="e.g. Please settle the ₱350.00 laboratory fee at the Accounting Office."
                className="mt-1 w-full resize-none rounded-lg border border-rose-200 bg-white px-3 py-2 font-poppins text-xs text-cpc-navy-text outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20"
              />
            </label>
            <div className="mt-1 flex items-center justify-between">
              <span className="font-poppins text-[10px] text-rose-700">
                {remarks.length}/300
              </span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setRejecting(false);
                    setError(null);
                  }}
                  className="cursor-pointer rounded-md px-2 py-1 font-poppins text-[10px] font-semibold text-cpc-heading-soft transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleReject()}
                  disabled={busy}
                  className="inline-flex cursor-pointer items-center gap-1 rounded-md bg-rose-600 px-2.5 py-1 font-poppins text-[10px] font-semibold text-white transition-colors hover:bg-rose-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {busy ? (
                    <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
                  ) : (
                    <XCircle className="h-3 w-3" aria-hidden />
                  )}
                  Confirm rejection
                </button>
              </div>
            </div>
            {error && (
              <p role="alert" className="mt-1 font-poppins text-[10px] font-medium text-rose-700">
                {error}
              </p>
            )}
          </div>
        )}

        <div className="mt-4 flex flex-col-reverse gap-2 border-t border-cpc-tile-border/60 pt-3 sm:flex-row sm:justify-end">
          {request.status === "pending" ? (
            <>
              <button
                type="button"
                onClick={() => setRejecting((current) => !current)}
                disabled={busy}
                className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-rose-200 bg-white px-4 py-2.5 font-poppins text-sm font-semibold text-rose-700 transition-colors hover:bg-rose-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <XCircle className="h-4 w-4" aria-hidden />
                Reject
              </button>
              <button
                type="button"
                onClick={() => onApprove(request)}
                disabled={busy}
                className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-cpc-button px-4 py-2.5 font-poppins text-sm font-semibold text-white transition-colors hover:bg-cpc-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent disabled:cursor-not-allowed disabled:opacity-60"
              >
                <PenLine className="h-4 w-4" aria-hidden />
                Approve & sign
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-cpc-tile-border bg-white px-4 py-2.5 font-poppins text-sm font-semibold text-cpc-navy-text transition-colors hover:bg-cpc-section-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
            >
              <Clock3 className="h-4 w-4" aria-hidden />
              Close
            </button>
          )}
        </div>

        {request.live && (
          <p className="mt-2 flex items-center justify-center gap-1 font-poppins text-[10px] text-cpc-heading-soft">
            <ShieldCheck className="h-3 w-3 text-emerald-600" aria-hidden />
            Live request from the student Online Clearance page.
          </p>
        )}
      </div>
    </Modal>
  );
}
