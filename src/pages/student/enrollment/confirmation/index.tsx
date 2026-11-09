import { PortalFooter } from "@/components/common/layout/PortalFooter";
import { PortalHeader } from "@/components/common/layout/PortalHeader";
import { EnrollContent } from "@/components/features/student/enrollment/EnrollContent";
import { EnrollmentFollowUpCards } from "@/components/features/student/enrollment/EnrollmentFollowUpCards";
import { EnrollmentHero } from "@/components/features/student/enrollment/EnrollmentHero";
import { SubmissionHeading } from "@/components/features/student/enrollment/SubmissionHeading";
import { SubmissionReceiptCard } from "@/components/features/student/enrollment/SubmissionReceiptCard";
import { useLogEnrollmentSubmission } from "@/components/features/student/enrollment/useLogEnrollmentSubmission";

/** Route: /online-enrollment/confirmation */
export default function EnrollmentConfirmationPage() {
  useLogEnrollmentSubmission();

  return (
    <div className="w-full overflow-x-hidden bg-white font-poppins">
      <PortalHeader />

      <EnrollmentHero
        title="ENROLLMENT SUBMITTED!"
        subtitle="Thank you for your enrollment application"
      />

      <EnrollContent>
        <SubmissionHeading />
        <SubmissionReceiptCard />
        <EnrollmentFollowUpCards />
      </EnrollContent>

      <PortalFooter />
    </div>
  );
}
