import { PortalFooter } from "@/components/ui/student/PortalFooter";
import { PortalHeader } from "@/components/ui/student/PortalHeader";
import { EnrollContent } from "@/components/features/student/enrollment/components/EnrollContent";
import { EnrollmentHero } from "@/components/features/student/enrollment/components/EnrollmentHero";
import { EnrollmentStatusCard } from "@/components/features/student/enrollment/components/EnrollmentStatusCard";
import { EnrollmentStatusInfoCards } from "@/components/features/student/enrollment/components/EnrollmentStatusInfoCards";

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
