import { useEffect } from "react";
import { Link } from "react-router";
import { PortalFooter } from "@/components/common/portal-footer";
import { PortalHeader } from "@/components/common/portal-header";
import { PageHeroBanner } from "@/components/features/online-enrollment/components/PageHeroBanner";
import cpcBg from "@/assets/cpc-bg.png";

export default function ConfirmationPage() {
  useEffect(() => {
    // Auto-save enrollment data and generate reference number
    const enrollmentData = localStorage.getItem("cpc_enrollment_data");
    if (enrollmentData) {
      console.log("Enrollment submitted:", JSON.parse(enrollmentData));
    }
  }, []);

  const referenceNumber = "ENR2026-" + Math.floor(Math.random() * 90000 + 10000);
  const submissionDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="w-full overflow-x-hidden bg-white font-poppins">
      <PortalHeader />

      <PageHeroBanner
        breadcrumbItems={[
          { label: "Home", href: "/" },
          { label: "Student Services", href: "/student/home" },
          { label: "Enrollment", href: null },
        ]}
        eyebrow="ENROLLMENT"
        title="ENROLLMENT SUBMITTED!"
        subtitle="Thank you for your enrollment application"
        backgroundImage={cpcBg}
      />

      <div className="enroll-layout">
        <div className="enroll-content max-w-4xl mx-auto px-4 py-8 space-y-8">
          <div className="text-center">
            <h1 className="enroll-page-title">Enrollment Submitted!</h1>
            <p className="enroll-page-subtitle">Thank you for your enrollment application</p>
          </div>

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

              <p className="text-sm text-enroll-text">
                Submitted on {submissionDate}
              </p>
            </div>

            <div className="bg-enroll-hero-bg rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-enroll-heading mb-3">What Happens Next?</h3>
              <div className="space-y-3 text-left">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-enroll-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">1</span>
                  </div>
                  <div>
                    <p className="font-medium text-enroll-heading">Document Verification</p>
                    <p className="text-sm text-enroll-text">Our team will verify your submitted documents.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-enroll-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">2</span>
                  </div>
                  <div>
                    <p className="font-medium text-enroll-heading">Approval Process</p>
                    <p className="text-sm text-enroll-text">Your application will be reviewed by the enrollment committee.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-enroll-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">3</span>
                  </div>
                  <div>
                    <p className="font-medium text-enroll-heading">Notification</p>
                    <p className="text-sm text-enroll-text">You'll receive an email with the result.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/online-enrollment/status"
                className="enroll-btn-primary"
              >
                View Status
              </Link>
              <button
                onClick={() => window.print()}
                className="cursor-pointer rounded-lg border border-cpc-button px-6 py-3 text-cpc-button transition-colors hover:bg-cpc-section-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
              >
                Print Receipt
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="enroll-card p-6">
              <h3 className="font-semibold text-enroll-heading mb-3">Important Notes</h3>
              <ul className="space-y-2 text-sm text-enroll-text">
                <li className="flex items-start gap-2">
                  <span className="text-enroll-primary">•</span>
                  Keep your reference number for future reference.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-enroll-primary">•</span>
                  Check your email regularly for updates.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-enroll-primary">•</span>
                  Complete any additional requirements if requested.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-enroll-primary">•</span>
                  Contact the registrar's office for inquiries.
                </li>
              </ul>
            </div>

            <div className="enroll-card p-6">
              <h3 className="font-semibold text-enroll-heading mb-3">Contact Information</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-medium text-enroll-heading">Registrar's Office</p>
                  <p className="text-enroll-text">+63 32 123-4567</p>
                </div>
                <div>
                  <p className="font-medium text-enroll-heading">Email</p>
                  <p className="text-enroll-text">registrar@cpc.edu.ph</p>
                </div>
                <div>
                  <p className="font-medium text-enroll-heading">Office Hours</p>
                  <p className="text-enroll-text">Monday - Friday, 8:00 AM - 5:00 PM</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <PortalFooter />
    </div>
  );
}