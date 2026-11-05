import { Footer } from "@/components/ui/student/Footer";
import { StudentNavbar } from "@/components/common/navbar/StudentNavbar";
import { AboutSection } from "@/components/features/student/portal-home/components/AboutSection";
import { CtaSection } from "@/components/features/student/portal-home/components/CtaSection";
import { HeroSection } from "@/components/features/student/portal-home/components/HeroSection";
import { ProgramsSection } from "@/components/features/student/portal-home/components/ProgramsSection";
import { QuickAccessCard } from "@/components/features/student/portal-home/components/QuickAccessCard";
import { StatsBand } from "@/components/features/student/portal-home/components/StatsBand";
import { TopBar } from "@/components/ui/student/TopBar";
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
        <StudentNavbar />
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
