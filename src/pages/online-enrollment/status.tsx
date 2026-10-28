import { mockEnrollmentStatus } from "@/components/features/online-enrollment/data/mockData";

export default function EnrollmentStatusPage() {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Pending";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20,6 9,17 4,12" />
          </svg>
        );
      case "active":
        return (
          <div className="w-5 h-5 rounded-full bg-enroll-primary animate-pulse" />
        );
      case "pending":
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="enroll-page-title">My Enrollment Status</h1>
        <p className="enroll-page-subtitle">Track the progress of your enrollment application</p>
      </div>

      <div className="enroll-card p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-enroll-hero-bg rounded-full mb-4">
            <span className="text-sm font-semibold text-cpc-navy">Reference Number:</span>
            <span className="text-sm font-mono font-bold text-enroll-primary">{mockEnrollmentStatus.referenceNumber}</span>
          </div>
          <div className="inline-flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-enroll-primary animate-pulse" />
            <span className="text-lg font-semibold text-enroll-primary">Under Review</span>
          </div>
          <p className="text-sm text-enroll-text mt-2">
            Submitted on {formatDate(mockEnrollmentStatus.submittedAt)}
          </p>
        </div>

        <div className="enroll-timeline">
          {mockEnrollmentStatus.steps.map((step) => (
            <div
              key={step.label}
              className={`enroll-timeline-item ${step.status === "active" ? "active" : ""} ${step.status === "completed" ? "completed" : ""}`}
            >
              <div className="enroll-timeline-dot">
                {getStatusIcon(step.status)}
              </div>
              <div className="ml-6">
                <h4 className="enroll-timeline-title">{step.label}</h4>
                <p className="enroll-timeline-time">{formatDate(step.date)}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 p-4 bg-enroll-hero-bg rounded-lg">
          <h4 className="font-semibold text-cpc-navy mb-2">Estimated Timeline</h4>
          <p className="text-sm text-enroll-text">
            Your enrollment is currently under review. You can expect a response within 3-5 business days.
            Once approved, you will receive an email notification with your enrollment confirmation.
          </p>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <button className="enroll-btn-primary">
            Download Receipt
          </button>
          <button className="px-6 py-3 text-enroll-primary border border-enroll-primary rounded-lg hover:bg-enroll-hero-bg transition-colors">
            Contact Support
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="enroll-card p-6 text-center">
          <div className="w-12 h-12 bg-enroll-hero-bg rounded-full flex items-center justify-center mx-auto mb-3">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" />
              <path d="M2 17L12 22L22 17" />
              <path d="M2 12L12 17L22 12" />
            </svg>
          </div>
          <h4 className="font-semibold text-cpc-navy mb-2">Application Received</h4>
          <p className="text-sm text-enroll-text">Your enrollment application has been received and is being processed.</p>
        </div>

        <div className="enroll-card p-6 text-center">
          <div className="w-12 h-12 bg-enroll-hero-bg rounded-full flex items-center justify-center mx-auto mb-3">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
          </div>
          <h4 className="font-semibold text-cpc-navy mb-2">Processing Time</h4>
          <p className="text-sm text-enroll-text">3-5 business days for review and verification of documents.</p>
        </div>

        <div className="enroll-card p-6 text-center">
          <div className="w-12 h-12 bg-enroll-hero-bg rounded-full flex items-center justify-center mx-auto mb-3">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
            </svg>
          </div>
          <h4 className="font-semibold text-cpc-navy mb-2">Next Steps</h4>
          <p className="text-sm text-enroll-text">Wait for approval, then complete remaining requirements.</p>
        </div>
      </div>
    </div>
  );
}