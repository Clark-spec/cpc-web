import { PortalFooter } from "@/components/common/portal-footer";
import { PortalHeader } from "@/components/common/portal-header";
import { EnrollContent } from "@/features/online-enrollment/components/EnrollContent";
import { EnrollmentHero } from "@/features/online-enrollment/components/EnrollmentHero";
import { EnrollmentStatusCard } from "@/features/online-enrollment/components/EnrollmentStatusCard";
import { EnrollmentStatusInfoCards } from "@/features/online-enrollment/components/EnrollmentStatusInfoCards";

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
