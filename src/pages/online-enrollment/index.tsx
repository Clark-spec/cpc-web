import { HeroSection } from "@/components/features/online-enrollment/components/HeroSection";
import { FeaturesGrid } from "@/components/features/online-enrollment/components/FeaturesGrid";

export default function OnlineEnrollmentPage() {
  return (
    <div className="space-y-12">
      <HeroSection />
      <FeaturesGrid />
    </div>
  );
}