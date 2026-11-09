import { PortalFooter } from "@/components/common/PortalFooter";
import { PortalHeader } from "@/components/common/PortalHeader";
import { FeaturesGrid } from "@/components/features/student/enrollment/FeaturesGrid";
import { EnrollmentHero } from "@/components/features/student/enrollment/EnrollmentHero";
import { HeroSection } from "@/components/features/student/enrollment/HeroSection";

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
