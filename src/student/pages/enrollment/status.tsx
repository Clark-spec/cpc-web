import { PortalFooter } from "@/components/common/portal-footer";
import { PortalHeader } from "@/components/common/portal-header";
import { EnrollContent } from "@/student/features/enrollment/components/EnrollContent";
import { EnrollmentHero } from "@/student/features/enrollment/components/EnrollmentHero";
import { EnrollmentStatusCard } from "@/student/features/enrollment/components/EnrollmentStatusCard";
import { EnrollmentStatusInfoCards } from "@/student/features/enrollment/components/EnrollmentStatusInfoCards";

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
