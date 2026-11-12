import { Footer } from "@/components/common/layout/Footer";
import { StudentNavbar } from "@/components/common/navigation/StudentNavbar";
import { AboutSection } from "@/components/features/student/portal-home/AboutSection";
import { CtaSection } from "@/components/features/student/portal-home/CtaSection";
import { HeroSection } from "@/components/features/student/portal-home/HeroSection";
import { ProgramsSection } from "@/components/features/student/portal-home/ProgramsSection";
import { StatsBand } from "@/components/features/student/portal-home/StatsBand";
import { TopBar } from "@/components/common/layout/TopBar";
import { useChromeFrame } from "@/hooks/useChromeFrame";

export default function StudentHomePage() {
  // Below the desktop breakpoint the page reflows instead of scaling its
  // 1440px frame, so phones get full-size type and the mobile navbar.
  const scale = useChromeFrame();

  return (
    <div
      className="w-full overflow-x-hidden bg-white font-poppins"
      style={{ zoom: scale }}
    >
      <header className="relative z-30">
        <TopBar />
        <StudentNavbar fluid />
      </header>

      <main>
        <HeroSection />
        <StatsBand />
        <AboutSection />
        <ProgramsSection />
        <CtaSection />
      </main>

      <Footer />
    </div>
  );
}
