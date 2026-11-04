import { mockEnrollmentStatus } from "../data/mockData";
import { formatEnrollmentDate } from "../lib/format";
import { EnrollmentTimeline } from "./EnrollmentTimeline";

/** Reference number, current state, progress rail, and receipt actions. */
export function EnrollmentStatusCard() {
  return (
    <div className="enroll-card p-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-enroll-hero-bg rounded-full mb-4">
          <span className="text-sm font-semibold text-enroll-heading">Reference Number:</span>
          <span className="text-sm font-mono font-bold text-enroll-primary">
            {mockEnrollmentStatus.referenceNumber}
          </span>
        </div>
        <div className="inline-flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-enroll-primary animate-pulse" />
          <span className="text-lg font-semibold text-enroll-primary">Under Review</span>
        </div>
        <p className="text-sm text-enroll-text mt-2">
          Submitted on {formatEnrollmentDate(mockEnrollmentStatus.submittedAt)}
        </p>
      </div>

      <EnrollmentTimeline steps={mockEnrollmentStatus.steps} />

      <div className="mt-8 p-4 bg-enroll-hero-bg rounded-lg">
        <h4 className="font-semibold text-enroll-heading mb-2">Estimated Timeline</h4>
        <p className="text-sm text-enroll-text">
          Your enrollment is currently under review. You can expect a response within 3-5 business
          days. Once approved, you will receive an email notification with your enrollment
          confirmation.
        </p>
      </div>

      <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
        <button className="enroll-btn-primary">Download Receipt</button>
        <button className="cursor-pointer rounded-lg border border-cpc-button px-6 py-3 text-cpc-button transition-colors hover:bg-cpc-section-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent">
          Contact Support
        </button>
      </div>
    </div>
  );
}
