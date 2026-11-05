import { PortalFooter } from "@/components/ui/student/PortalFooter";
import { PortalHeader } from "@/components/ui/student/PortalHeader";
import { EnrollContent } from "@/components/features/student/enrollment/components/EnrollContent";
import { EnrollmentFollowUpCards } from "@/components/features/student/enrollment/components/EnrollmentFollowUpCards";
import { EnrollmentHero } from "@/components/features/student/enrollment/components/EnrollmentHero";
import { SubmissionHeading } from "@/components/features/student/enrollment/components/SubmissionHeading";
import { SubmissionReceiptCard } from "@/components/features/student/enrollment/components/SubmissionReceiptCard";
import { useLogEnrollmentSubmission } from "@/components/features/student/enrollment/hooks/useLogEnrollmentSubmission";

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
