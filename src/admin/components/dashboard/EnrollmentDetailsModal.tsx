import { useState } from "react";
import { AlertCircle, Check, CheckCircle2, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatDateTime } from "@/student/features/clearance/utils/format";
import { Modal } from "@/components/ui/modal";
import { ApplicationStatusBadge } from "./ApplicationStatusBadge";
import {
  ENROLLMENT_STATUS_LABELS,
  type EnrollmentApplication,
} from "../../data/enrollmentApplications";

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
      className="sm:max-w-[600px]"
    >
      <div className="border-b border-admin-border/70 bg-admin-header/60 px-5 py-4 pr-12">
        <div className="flex items-start gap-3">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white font-poppins text-sm font-bold text-admin-secondary shadow-sm"
            aria-hidden
          >
            {initials(application.studentName)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2
                id="enrollment-details-title"
                className="font-poppins text-[17px] leading-tight font-bold text-admin-primary"
              >
                {application.studentName}
              </h2>
              <ApplicationStatusBadge status={application.status} />
            </div>
            <p className="mt-0.5 font-poppins text-[11px] text-admin-muted">
              {application.id} · {application.studentId}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4 px-5 py-4">
        <dl className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
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
              <dt className="font-poppins text-[9.5px] font-bold tracking-[0.08em] text-admin-muted uppercase">
                {row.label}
              </dt>
              <dd className="mt-0.5 font-poppins text-[11.5px] leading-snug font-medium break-words text-admin-text">
                {row.value}
              </dd>
            </div>
          ))}
        </dl>

        <div>
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-poppins text-[11px] font-bold tracking-[0.07em] text-admin-muted uppercase">
              Requirements
            </h3>
            <span className="font-poppins text-[10px] text-admin-muted">
              {application.requirements.length - missing.length} of{" "}
              {application.requirements.length} submitted
            </span>
          </div>
          <ul className="mt-1.5 grid gap-1.5 sm:grid-cols-2">
            {application.requirements.map((requirement) => (
              <li
                key={requirement.label}
                className={cn(
                  "flex items-start gap-1.5 rounded-md border px-2 py-1.5",
                  requirement.submitted
                    ? "border-admin-border/70 bg-admin-page/50"
                    : "border-rose-200 bg-rose-50/60",
                )}
              >
                {requirement.submitted ? (
                  <CheckCircle2 className="mt-px h-3.5 w-3.5 shrink-0 text-admin-success" aria-hidden />
                ) : (
                  <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0 text-admin-error" aria-hidden />
                )}
                <span className="font-poppins text-[10.5px] leading-snug text-admin-text">
                  {requirement.label}
                  <span className="block text-[9.5px] text-admin-muted">
                    {requirement.submitted ? "Submitted" : "Missing"}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-md border border-admin-border/70 bg-admin-page/60 px-3 py-2.5">
          <p className="font-poppins text-[9.5px] font-bold tracking-[0.08em] text-admin-muted uppercase">
            Registrar Note
          </p>
          <p className="mt-1 font-poppins text-[11px] leading-relaxed text-admin-text">
            {application.note}
          </p>
        </div>

        {rejecting && !decided && (
          <div className="rounded-md border border-rose-200 bg-rose-50/70 p-3">
            <label
              htmlFor="enrollment-reject-remarks"
              className="font-poppins text-[10.5px] font-semibold text-rose-800"
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
                "mt-1 w-full resize-none rounded-md border bg-white px-2.5 py-2 font-poppins text-[11px] text-admin-text outline-none placeholder:text-admin-muted/80 focus:ring-2",
                showError
                  ? "border-rose-400 focus:border-rose-500 focus:ring-rose-200"
                  : "border-rose-200 focus:border-rose-400 focus:ring-rose-100",
              )}
            />
            {showError && (
              <p role="alert" className="mt-1 font-poppins text-[10px] font-medium text-rose-700">
                Add a short reason before rejecting the application.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col-reverse gap-2 border-t border-admin-border/70 bg-admin-page/40 px-5 py-3 sm:flex-row sm:items-center sm:justify-end">
        {decided ? (
          <button
            type="button"
            onClick={onClose}
            className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-admin-border bg-white px-4 py-2 font-poppins text-[11.5px] font-semibold text-admin-text transition-colors hover:bg-admin-page focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-info"
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
              className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-admin-border bg-white px-3.5 py-2 font-poppins text-[11.5px] font-semibold text-admin-text transition-colors hover:bg-admin-page focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-info"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleReject}
              className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 font-poppins text-[11.5px] font-semibold text-white transition-colors hover:bg-rose-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600"
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
              className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-admin-border bg-white px-3.5 py-2 font-poppins text-[11.5px] font-semibold text-admin-text transition-colors hover:bg-admin-page focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-info"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => setRejecting(true)}
              className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2 font-poppins text-[11.5px] font-semibold text-rose-700 transition-colors hover:bg-rose-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600"
            >
              <X className="h-3.5 w-3.5" aria-hidden />
              Reject
            </button>
            <button
              type="button"
              onClick={() => onApprove(application)}
              className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-admin-primary px-4 py-2 font-poppins text-[11.5px] font-semibold text-white transition-colors hover:bg-admin-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-info"
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
