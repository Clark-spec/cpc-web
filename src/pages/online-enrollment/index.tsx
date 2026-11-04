import { PortalFooter } from "@/components/common/portal-footer";
import { PortalHeader } from "@/components/common/portal-header";
import { PageHeroBanner } from "@/components/features/online-enrollment/components/PageHeroBanner";
import { HeroSection } from "@/components/features/online-enrollment/components/HeroSection";
import { FeaturesGrid } from "@/components/features/online-enrollment/components/FeaturesGrid";
import cpcBg from "@/assets/cpc-bg.png";

export default function OnlineEnrollmentPage() {
  return (
    <div className="w-full overflow-x-hidden bg-white font-poppins">
      <PortalHeader />

      <PageHeroBanner
        breadcrumbItems={[
          { label: "Home", href: "/" },
          { label: "Student Services", href: "/student/home" },
          { label: "Enrollment", href: null },
        ]}
        eyebrow="ADMISSIONS"
        title="ONLINE ENROLLMENT"
        subtitle="Complete and monitor your enrollment process online."
        backgroundImage={cpcBg}
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
