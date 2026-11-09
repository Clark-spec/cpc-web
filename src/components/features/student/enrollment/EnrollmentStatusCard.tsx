import { mockEnrollmentStatus } from "@/components/features/student/enrollment/mockData";
import { formatEnrollmentDate } from "@/components/features/student/enrollment/format";
import { EnrollmentTimeline } from "@/components/features/student/enrollment/EnrollmentTimeline";

/** Reference number, current state, progress rail, and receipt actions. */
export function EnrollmentStatusCard() {
  return (
    <div className="enroll-card p-8">
      <div className="mb-8 text-center">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-enroll-hero-bg px-4 py-2">
            <span className="text-sm font-semibold text-enroll-heading">Reference Number:</span>
            <span className="text-sm font-mono font-bold text-enroll-primary">
              {mockEnrollmentStatus.referenceNumber}
            </span>
          </div>
          <div className="inline-flex items-center gap-2">
            <div className="h-3 w-3 animate-pulse rounded-full bg-enroll-primary" />
            <span className="text-lg font-semibold text-enroll-primary">Under Review</span>
          </div>
        </div>
        <p className="mt-3 text-sm text-enroll-text">
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
