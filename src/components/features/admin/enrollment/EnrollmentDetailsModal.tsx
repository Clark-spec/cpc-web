import { useState } from "react";
import { AlertCircle, Check, CheckCircle2, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatDateTime } from "@/lib/format";
import { Modal } from "@/components/ui/modal";
import { ApplicationStatusBadge } from "@/components/features/admin/enrollment/ApplicationStatusBadge";
import {
  ENROLLMENT_STATUS_LABELS,
  type EnrollmentApplication,
} from "@/services/enrollmentAdmin";

type EnrollmentDetailsModalProps = {
  application: EnrollmentApplication;
  /** Open straight into the rejection form when launched from a row action. */
  initialIntent?: "view" | "reject";
  onClose: () => void;
  onApprove: (application: EnrollmentApplication) => void;
  onReject: (application: EnrollmentApplication, remarks: string) => void;
};

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

/** Applicant review dialog shared by the table's view, approve and reject acts. */
export function EnrollmentDetailsModal({
  application,
  initialIntent = "view",
  onClose,
  onApprove,
  onReject,
}: EnrollmentDetailsModalProps) {
  const [rejecting, setRejecting] = useState(initialIntent === "reject");
  const [remarks, setRemarks] = useState("");
  const [showError, setShowError] = useState(false);

  const decided = application.status === "approved" || application.status === "rejected";
  const missing = application.requirements.filter((item) => !item.submitted);

  const handleReject = () => {
    if (!remarks.trim()) {
      setShowError(true);
      return;
    }
    onReject(application, remarks.trim());
  };

  return (
    <Modal
      open
      onClose={onClose}
      labelledBy="enrollment-details-title"
      className="sm:max-w-[620px] overflow-hidden rounded-2xl border border-white/80 bg-white/95 shadow-2xl backdrop-blur-xl"
    >
      <div className="border-b border-cpc-tile-border/50 bg-white/70 px-6 py-4.5 pr-12 backdrop-blur-md">
        <div className="flex items-start gap-3.5">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/80 bg-cpc-section-light font-poppins text-sm font-bold text-cpc-navy-text shadow-2xs"
            aria-hidden
          >
            {initials(application.studentName)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2
                id="enrollment-details-title"
                className="font-poppins text-[17px] leading-tight font-bold text-cpc-navy-text"
              >
                {application.studentName}
              </h2>
              <ApplicationStatusBadge status={application.status} />
            </div>
            <p className="mt-0.5 font-poppins text-xs text-cpc-heading-soft">
              {application.id} · {application.studentId}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4 px-6 py-5">
        <dl className="grid grid-cols-1 gap-x-4 gap-y-3 rounded-2xl border border-white/80 bg-white/60 p-4 shadow-2xs backdrop-blur-xs sm:grid-cols-2">
          {[
            { label: "Program", value: application.program },
            { label: "Year Level", value: application.yearLevel },
            { label: "Email Address", value: application.email },
            { label: "Submitted", value: formatDateTime(application.submittedAt) },
            {
              label: "Last Update",
              value: application.respondedAt
                ? formatDateTime(application.respondedAt)
                : "Not yet reviewed",
            },
            {
              label: "Current Standing",
              value: ENROLLMENT_STATUS_LABELS[application.status],
            },
          ].map((row) => (
            <div key={row.label} className="min-w-0">
              <dt className="font-poppins text-[10px] font-bold tracking-[0.08em] text-cpc-heading-soft uppercase">
                {row.label}
              </dt>
              <dd className="mt-0.5 font-poppins text-xs leading-snug font-semibold break-words text-cpc-navy-text">
                {row.value}
              </dd>
            </div>
          ))}
        </dl>

        <div>
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-poppins text-[11px] font-bold tracking-[0.08em] text-cpc-heading-soft uppercase">
              Requirements Checklist
            </h3>
            <span className="font-poppins text-[10.5px] font-semibold text-cpc-heading-soft">
              {application.requirements.length - missing.length} of{" "}
              {application.requirements.length} submitted
            </span>
          </div>
          <ul className="mt-2 grid gap-2 sm:grid-cols-2">
            {application.requirements.map((requirement) => (
              <li
                key={requirement.label}
                className={cn(
                  "flex items-start gap-2 rounded-xl border p-2.5 backdrop-blur-xs transition-colors",
                  requirement.submitted
                    ? "border-white/80 bg-white/70 text-cpc-navy-text"
                    : "border-rose-200/80 bg-rose-50/70 text-rose-800",
                )}
              >
                {requirement.submitted ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                ) : (
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" aria-hidden />
                )}
                <span className="font-poppins text-xs leading-snug font-medium">
                  {requirement.label}
                  <span className="block text-[10px] text-cpc-heading-soft">
                    {requirement.submitted ? "Verified & complete" : "Missing / Needs upload"}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-white/80 bg-cpc-section-light/70 p-3.5 backdrop-blur-xs">
          <p className="font-poppins text-[10px] font-bold tracking-[0.08em] text-cpc-heading-soft uppercase">
            Registrar Note
          </p>
          <p className="mt-1 font-poppins text-xs leading-relaxed text-cpc-navy-text">
            {application.note}
          </p>
        </div>

        {rejecting && !decided && (
          <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-3.5 backdrop-blur-xs">
            <label
              htmlFor="enrollment-reject-remarks"
              className="font-poppins text-xs font-semibold text-rose-800"
            >
              Reason for rejection
            </label>
            <textarea
              id="enrollment-reject-remarks"
              autoFocus
              value={remarks}
              onChange={(event) => {
                setRemarks(event.target.value);
                if (event.target.value.trim()) setShowError(false);
              }}
              rows={3}
              placeholder="Explain what the applicant needs to complete or correct."
              className={cn(
                "mt-1.5 w-full resize-none rounded-xl border bg-white px-3 py-2 font-poppins text-xs text-cpc-navy-text outline-none placeholder:text-cpc-heading-soft/60 focus:ring-2",
                showError
                  ? "border-rose-400 focus:border-rose-500 focus:ring-rose-200"
                  : "border-rose-200 focus:border-rose-400 focus:ring-rose-100",
              )}
            />
            {showError && (
              <p role="alert" className="mt-1.5 font-poppins text-[10.5px] font-medium text-rose-700">
                Add a short reason before rejecting the application.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col-reverse gap-2 border-t border-cpc-tile-border/50 bg-white/60 px-6 py-3.5 backdrop-blur-md sm:flex-row sm:items-center sm:justify-end">
        {decided ? (
          <button
            type="button"
            onClick={onClose}
            className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-white/80 bg-white/80 px-4 py-2 font-poppins text-xs font-semibold text-cpc-heading-soft shadow-xs backdrop-blur-xs transition-colors hover:border-cpc-tile-border hover:bg-white hover:text-cpc-navy-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
          >
            Close
          </button>
        ) : rejecting ? (
          <>
            <button
              type="button"
              onClick={() => {
                setRejecting(false);
                setShowError(false);
              }}
              className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-white/80 bg-white/80 px-4 py-2 font-poppins text-xs font-semibold text-cpc-heading-soft shadow-xs backdrop-blur-xs transition-colors hover:border-cpc-tile-border hover:bg-white hover:text-cpc-navy-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleReject}
              className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 font-poppins text-xs font-semibold text-white shadow-sm transition-colors hover:bg-rose-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600"
            >
              <X className="h-3.5 w-3.5" aria-hidden />
              Confirm Rejection
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-white/80 bg-white/80 px-4 py-2 font-poppins text-xs font-semibold text-cpc-heading-soft shadow-xs backdrop-blur-xs transition-colors hover:border-cpc-tile-border hover:bg-white hover:text-cpc-navy-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => setRejecting(true)}
              className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 font-poppins text-xs font-semibold text-rose-700 shadow-xs backdrop-blur-xs transition-colors hover:bg-rose-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600"
            >
              <X className="h-3.5 w-3.5" aria-hidden />
              Reject
            </button>
            <button
              type="button"
              onClick={() => onApprove(application)}
              className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-cpc-navy px-4.5 py-2 font-poppins text-xs font-semibold text-white shadow-sm transition-colors hover:bg-cpc-navy-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
            >
              <Check className="h-3.5 w-3.5" aria-hidden />
              Approve Application
            </button>
          </>
        )}
      </div>
    </Modal>
  );
}
