import { useId, useState } from "react";
import { ArrowRight, Check, FileText, Paperclip, X } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { CorrectionStatusBadge } from "@/components/features/admin/student-accounts/statusBadges";
import {
  BTN,
  LABEL_BASE,
  FIELD_BASE,
  sectionText,
} from "@/components/features/admin/student-accounts/shared";
import { COURSE_LABELS } from "@/components/features/admin/student-accounts/mockStudentAccounts";
import { formatDate, formatDateTime } from "@/lib/format";
import { cn } from "@/lib/cn";
import type {
  CorrectionDecision,
  ProfileCorrectionRequest,
} from "@/components/features/admin/student-accounts/types";

type ProfileCorrectionModalProps = {
  request: ProfileCorrectionRequest;
  onClose: () => void;
  onDecide: (decision: CorrectionDecision) => void;
};

/**
 * Full request view plus the registrar's decision form. Rejecting requires
 * remarks so the student always knows what to fix.
 */
export function ProfileCorrectionModal({
  request,
  onClose,
  onDecide,
}: ProfileCorrectionModalProps) {
  const headingId = useId();
  const remarksId = useId();
  const [remarks, setRemarks] = useState("");
  const [error, setError] = useState<string | null>(null);

  const pending = request.status === "pending";

  function handleApprove() {
    onDecide({ status: "approved", adminRemarks: remarks.trim() });
  }

  function handleReject() {
    if (!remarks.trim()) {
      setError("Add a reason before rejecting this request.");
      return;
    }
    onDecide({ status: "rejected", adminRemarks: remarks.trim() });
  }

  return (
    <Modal open onClose={onClose} labelledBy={headingId} className="sm:max-w-2xl">
      <header className="border-b border-cpc-tile-border/60 px-5 py-4 pr-12">
        <p className="font-poppins text-[10px] font-bold tracking-[0.14em] text-cpc-blue-accent uppercase">
          {request.referenceNumber}
        </p>
        <h2
          id={headingId}
          className="mt-1 font-poppins text-lg leading-snug font-bold text-cpc-navy-text"
        >
          Profile correction · {request.field}
        </h2>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <CorrectionStatusBadge status={request.status} />
          <span className="font-poppins text-[11px] text-cpc-heading-soft">
            Submitted {formatDateTime(request.submittedAt)}
          </span>
        </div>
      </header>

      <div className="space-y-4 px-5 py-4">
        <section
          aria-label="Student information"
          className="rounded-xl border border-cpc-tile-border/70 bg-cpc-section-light/40 p-4"
        >
          <h3 className="font-poppins text-[10px] font-bold tracking-[0.12em] text-cpc-heading-soft uppercase">
            Student information
          </h3>
          <dl className="mt-2.5 grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
            <div className="min-w-0">
              <dt className="font-poppins text-[10px] text-cpc-heading-soft">Name</dt>
              <dd className="truncate font-poppins text-xs font-semibold text-cpc-navy-text">
                {request.studentName}
              </dd>
            </div>
            <div className="min-w-0">
              <dt className="font-poppins text-[10px] text-cpc-heading-soft">Student ID</dt>
              <dd className="truncate font-poppins text-xs font-semibold text-cpc-navy-text">
                {request.studentId}
              </dd>
            </div>
            <div className="min-w-0">
              <dt className="font-poppins text-[10px] text-cpc-heading-soft">
                Program / Year level
              </dt>
              <dd className="truncate font-poppins text-xs text-cpc-navy-text">
                {COURSE_LABELS[request.course]} · {sectionText(request.year, request.section)}
              </dd>
            </div>
            <div className="min-w-0">
              <dt className="font-poppins text-[10px] text-cpc-heading-soft">Email</dt>
              <dd
                className="truncate font-poppins text-xs text-cpc-navy-text"
                title={request.email}
              >
                {request.email}
              </dd>
            </div>
          </dl>
        </section>

        <section aria-labelledby={`${headingId}-correction`} className="space-y-3">
          <h3
            id={`${headingId}-correction`}
            className="font-poppins text-[10px] font-bold tracking-[0.12em] text-cpc-heading-soft uppercase"
          >
            Correction details
          </h3>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
            <div className="rounded-xl border border-cpc-tile-border/70 bg-white p-3">
              <p className="font-poppins text-[10px] font-bold tracking-[0.1em] text-cpc-heading-soft uppercase">
                Current value
              </p>
              <p className="mt-1 font-poppins text-xs break-words text-cpc-navy-text">
                {request.currentValue}
              </p>
            </div>
            <span
              aria-hidden
              className="hidden h-8 w-8 items-center justify-center rounded-full bg-cpc-section-light text-cpc-blue-accent sm:flex"
            >
              <ArrowRight className="h-4 w-4" />
            </span>
            <div className="rounded-xl border border-cpc-blue-accent/30 bg-cpc-blue-accent/[0.04] p-3">
              <p className="font-poppins text-[10px] font-bold tracking-[0.1em] text-cpc-blue-accent uppercase">
                Requested value
              </p>
              <p className="mt-1 font-poppins text-xs font-semibold break-words text-cpc-navy-text">
                {request.requestedValue}
              </p>
            </div>
          </div>

          <div>
            <p className="font-poppins text-[10px] text-cpc-heading-soft">
              Reason from the student
            </p>
            <p className="mt-1 rounded-xl border border-cpc-tile-border/70 bg-white p-3 font-poppins text-xs leading-relaxed text-cpc-navy-text">
              {request.reason}
            </p>
          </div>
        </section>

        <section aria-labelledby={`${headingId}-attachment`}>
          <h3
            id={`${headingId}-attachment`}
            className="mb-1.5 font-poppins text-[10px] font-bold tracking-[0.12em] text-cpc-heading-soft uppercase"
          >
            Supporting attachment
          </h3>
          {request.attachmentName ? (
            <div className="flex items-center gap-2.5 rounded-lg border border-cpc-tile-border bg-white px-3 py-2.5">
              <FileText className="h-4 w-4 shrink-0 text-cpc-blue-accent" aria-hidden />
              <div className="min-w-0">
                <p
                  className="truncate font-poppins text-xs font-semibold text-cpc-navy-text"
                  title={request.attachmentName}
                >
                  {request.attachmentName}
                </p>
                <p className="flex items-center gap-1 font-poppins text-[10px] text-cpc-heading-soft">
                  <Paperclip className="h-2.5 w-2.5 shrink-0" aria-hidden />
                  Attached by student
                </p>
              </div>
            </div>
          ) : (
            <p className="font-poppins text-xs text-cpc-heading-soft">
              No attachment was provided.
            </p>
          )}
        </section>

        {pending ? (
          <section
            aria-labelledby={`${headingId}-review`}
            className="space-y-2 rounded-xl border border-cpc-tile-border/70 p-4"
          >
            <h3
              id={`${headingId}-review`}
              className="font-poppins text-[10px] font-bold tracking-[0.12em] text-cpc-heading-soft uppercase"
            >
              Registrar remarks
            </h3>
            <label htmlFor={remarksId} className={LABEL_BASE}>
              Remarks
            </label>
            <textarea
              id={remarksId}
              rows={3}
              maxLength={500}
              value={remarks}
              onChange={(event) => {
                setRemarks(event.target.value);
                if (error) setError(null);
              }}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? `${remarksId}-error` : `${remarksId}-hint`}
              placeholder="Explain the decision or the documents the student needs to resubmit…"
              className={cn(
                FIELD_BASE,
                "resize-y leading-relaxed",
                error && "border-rose-500",
              )}
            />
            {error ? (
              <p
                id={`${remarksId}-error`}
                role="alert"
                className="font-poppins text-[11px] font-semibold text-rose-600"
              >
                {error}
              </p>
            ) : (
              <p
                id={`${remarksId}-hint`}
                className="flex items-center justify-between gap-2 font-poppins text-[10px] text-cpc-heading-soft"
              >
                <span>Required when rejecting. Optional when approving.</span>
                <span className="tabular-nums">{remarks.length}/500</span>
              </p>
            )}
          </section>
        ) : (
          <section
            aria-labelledby={`${headingId}-decision`}
            className="space-y-2 rounded-xl border border-cpc-tile-border/70 p-4"
          >
            <h3
              id={`${headingId}-decision`}
              className="font-poppins text-[10px] font-bold tracking-[0.12em] text-cpc-heading-soft uppercase"
            >
              Decision
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              <CorrectionStatusBadge status={request.status} />
              {request.reviewedAt && (
                <span className="font-poppins text-[11px] text-cpc-heading-soft">
                  Reviewed {formatDate(request.reviewedAt)}
                </span>
              )}
            </div>
            <p className="font-poppins text-xs leading-relaxed text-cpc-navy-text">
              {request.adminRemarks || "No remarks were recorded."}
            </p>
          </section>
        )}
      </div>

      <footer className="sticky bottom-0 flex flex-col-reverse gap-2 border-t border-cpc-tile-border/60 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-end">
        <button
          type="button"
          onClick={onClose}
          className="cpc-btn cpc-btn-secondary cpc-btn-sm"
        >
          Close
        </button>
        {pending && (
          <>
            <button
              type="button"
              onClick={handleReject}
              className={cn(BTN, "bg-rose-50 text-rose-700 hover:bg-rose-100")}
            >
              <X className="h-4 w-4 shrink-0" aria-hidden />
              Reject request
            </button>
            <button
              type="button"
              onClick={handleApprove}
              className={cn(BTN, "cpc-btn-primary")}
            >
              <Check className="h-4 w-4 shrink-0" aria-hidden />
              Approve request
            </button>
          </>
        )}
      </footer>
    </Modal>
  );
}
