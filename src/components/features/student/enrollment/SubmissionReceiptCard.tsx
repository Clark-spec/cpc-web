import { useState } from "react";
import { Link } from "react-router";
import { formatEnrollmentDateTime } from "@/components/features/student/enrollment/format";
import { NextStepsList } from "@/components/features/student/enrollment/NextStepsList";
import { readEnrollmentSubmission } from "@/components/features/student/enrollment/submission";

/** Success receipt: reference number, submission time, next steps, and actions. */
export function SubmissionReceiptCard() {
  const [submission] = useState(readEnrollmentSubmission);
  const [referenceNumber] = useState(
    () => submission?.referenceNumber ?? "ENR2026-" + Math.floor(Math.random() * 90000 + 10000),
  );
  const [submissionDate] = useState(() =>
    formatEnrollmentDateTime(submission ? new Date(submission.submittedAt) : new Date()),
  );

  return (
    <div className="enroll-card p-8 text-center">
      <div className="w-20 h-20 bg-enroll-success rounded-full flex items-center justify-center mx-auto mb-6">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20,6 9,17 4,12" />
        </svg>
      </div>

      <h2 className="text-2xl font-bold text-enroll-heading mb-4">Application Successfully Submitted</h2>

      <div className="space-y-4 mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-enroll-hero-bg rounded-full">
          <span className="text-sm font-semibold text-enroll-heading">Reference Number:</span>
          <span className="text-sm font-mono font-bold text-enroll-primary">{referenceNumber}</span>
        </div>

        <p className="text-sm text-enroll-text">Submitted on {submissionDate}</p>
      </div>

      <NextStepsList />

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link to="/online-enrollment/status" className="cpc-btn cpc-btn-primary">
          View Status
        </Link>
        <button
          onClick={() => window.print()}
          className="cpc-btn cpc-btn-secondary"
        >
          Print Receipt
        </button>
      </div>
    </div>
  );
}
