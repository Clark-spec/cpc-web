import { Badge } from "@/components/ui/badge";
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
          <Badge tone="info" pulse>
            Under Review
          </Badge>
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
        <button className="cpc-btn cpc-btn-primary">Download Receipt</button>
        <button className="cpc-btn cpc-btn-secondary">
          Contact Support
        </button>
      </div>
    </div>
  );
}
