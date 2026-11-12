import { Footer } from "@/components/common/layout/Footer";
import { StudentNavbar } from "@/components/common/navigation/StudentNavbar";
import { AboutSection } from "@/components/features/student/portal-home/AboutSection";
import { CtaSection } from "@/components/features/student/portal-home/CtaSection";
import { HeroSection } from "@/components/features/student/portal-home/HeroSection";
import { ProgramsSection } from "@/components/features/student/portal-home/ProgramsSection";
import { StatsBand } from "@/components/features/student/portal-home/StatsBand";
import { TopBar } from "@/components/common/layout/TopBar";
import { useChromeFrame } from "@/hooks/useChromeFrame";
import { useHideOnScroll } from "@/hooks/useHideOnScroll";
import { cn } from "@/lib/cn";

export default function StudentHomePage() {
  // Below the desktop breakpoint the page reflows instead of scaling its
  // 1440px frame, so phones get full-size type and the mobile navbar.
  const scale = useChromeFrame();
  const hidden = useHideOnScroll();

  return (
    <div
      className="w-full overflow-x-clip bg-white font-poppins"
      style={{ zoom: scale }}
    >
      <header
        className={cn(
          "sticky top-0 z-50 transition-transform duration-300 ease-out",
          hidden && "-translate-y-full",
        )}
      >
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
