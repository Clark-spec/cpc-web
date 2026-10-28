import { Footer } from "@/components/common/footer";
import { Navbar } from "@/components/common/navbar";
import { AboutSection } from "@/components/features/student/home/about-section";
import { CtaSection } from "@/components/features/student/home/cta-section";
import { HeroSection } from "@/components/features/student/home/hero-section";
import { ProgramsSection } from "@/components/features/student/home/programs-section";
import { QuickAccessCard } from "@/components/features/student/home/quick-access-card";
import { StatsBand } from "@/components/features/student/home/stats-band";
import { TopBar } from "@/components/features/student/home/top-bar";
import { useHomeFrame } from "@/components/features/student/home/use-home-frame";

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
