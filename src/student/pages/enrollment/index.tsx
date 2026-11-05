import { PortalFooter } from "@/components/common/portal-footer";
import { PortalHeader } from "@/components/common/portal-header";
import { FeaturesGrid } from "@/student/features/enrollment/components/FeaturesGrid";
import { EnrollmentHero } from "@/student/features/enrollment/components/EnrollmentHero";
import { HeroSection } from "@/student/features/enrollment/components/HeroSection";

export default function OnlineEnrollmentPage() {
  return (
    <div className="w-full overflow-x-hidden bg-white font-poppins">
      <PortalHeader />

      <EnrollmentHero
        eyebrow="ADMISSIONS"
        title="ONLINE ENROLLMENT"
        subtitle="Complete and monitor your enrollment process online."
      />

      <div className="enroll-layout">
        <div className="enroll-content max-w-5xl mx-auto px-4 py-8 space-y-12">
          <HeroSection />
          <FeaturesGrid />
        </div>
      </div>

      <PortalFooter />
    </div>
  );
}
