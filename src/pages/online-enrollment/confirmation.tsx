import { PortalFooter } from "@/components/common/portal-footer";
import { PortalHeader } from "@/components/common/portal-header";
import { EnrollContent } from "@/features/online-enrollment/components/EnrollContent";
import { EnrollmentFollowUpCards } from "@/features/online-enrollment/components/EnrollmentFollowUpCards";
import { EnrollmentHero } from "@/features/online-enrollment/components/EnrollmentHero";
import { SubmissionHeading } from "@/features/online-enrollment/components/SubmissionHeading";
import { SubmissionReceiptCard } from "@/features/online-enrollment/components/SubmissionReceiptCard";
import { useLogEnrollmentSubmission } from "@/features/online-enrollment/hooks/useLogEnrollmentSubmission";

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
