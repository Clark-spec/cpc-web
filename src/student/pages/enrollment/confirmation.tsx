import { PortalFooter } from "@/components/common/portal-footer";
import { PortalHeader } from "@/components/common/portal-header";
import { EnrollContent } from "@/student/features/enrollment/components/EnrollContent";
import { EnrollmentFollowUpCards } from "@/student/features/enrollment/components/EnrollmentFollowUpCards";
import { EnrollmentHero } from "@/student/features/enrollment/components/EnrollmentHero";
import { SubmissionHeading } from "@/student/features/enrollment/components/SubmissionHeading";
import { SubmissionReceiptCard } from "@/student/features/enrollment/components/SubmissionReceiptCard";
import { useLogEnrollmentSubmission } from "@/student/features/enrollment/hooks/useLogEnrollmentSubmission";

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
