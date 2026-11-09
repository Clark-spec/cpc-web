import { PortalFooter } from "@/components/common/layout/PortalFooter";
import { PortalHeader } from "@/components/common/layout/PortalHeader";
import { EnrollContent } from "@/components/features/student/enrollment/EnrollContent";
import { EnrollmentHero } from "@/components/features/student/enrollment/EnrollmentHero";
import { EnrollmentStatusCard } from "@/components/features/student/enrollment/EnrollmentStatusCard";
import { EnrollmentStatusInfoCards } from "@/components/features/student/enrollment/EnrollmentStatusInfoCards";

/** Route: /online-enrollment/status */
export default function EnrollmentStatusPage() {
  return (
    <div className="w-full overflow-x-hidden bg-white font-poppins">
      <PortalHeader />

      <EnrollmentHero
        title="ENROLLMENT STATUS"
        subtitle="Track the progress of your enrollment application"
      />

      <EnrollContent>
        <EnrollmentStatusCard />
        <EnrollmentStatusInfoCards />
      </EnrollContent>

      <PortalFooter />
    </div>
  );
}
