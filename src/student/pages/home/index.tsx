import { Footer } from "@/components/common/footer";
import { Navbar } from "@/components/common/navbar";
import { AboutSection } from "@/student/features/portal-home/components/about-section";
import { CtaSection } from "@/student/features/portal-home/components/cta-section";
import { HeroSection } from "@/student/features/portal-home/components/hero-section";
import { ProgramsSection } from "@/student/features/portal-home/components/programs-section";
import { QuickAccessCard } from "@/student/features/portal-home/components/quick-access-card";
import { StatsBand } from "@/student/features/portal-home/components/stats-band";
import { TopBar } from "@/components/common/top-bar";
import { useHomeFrame } from "@/hooks/useHomeFrame";

export default function StudentHomePage() {
  const scale = useHomeFrame();

  return (
    <div
      className="w-full overflow-x-hidden bg-white font-poppins"
      style={{ zoom: scale }}
    >
      <header className="relative z-30">
        <TopBar />
        <Navbar />
      </header>

      <main>
        <HeroSection />
        <QuickAccessCard />
        <AboutSection />
        <ProgramsSection />
        <StatsBand />
        <CtaSection />
      </main>

      <Footer />
    </div>
  );
}
