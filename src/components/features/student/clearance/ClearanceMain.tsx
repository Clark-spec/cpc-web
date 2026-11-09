import { ClearanceBody } from "@/components/features/student/clearance/ClearanceBody";
import { ClearanceHero } from "@/components/features/student/clearance/ClearanceHero";
import { DemoModeBanner } from "@/components/features/student/clearance/DemoModeBanner";
import { DemoModeControls } from "@/components/features/student/clearance/DemoModeControls";

/** Clearance hero plus the demo controls and the clearance cards. */
export function ClearanceMain() {
  return (
    <main className="relative min-h-screen w-full bg-cpc-section-light/35">
      {/* Ambient background glows for visual depth and glassmorphism */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-16 -left-16 h-80 w-80 rounded-full bg-cpc-blue-accent/5 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/3 -right-16 h-96 w-96 rounded-full bg-cpc-navy/4 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-20 left-1/4 h-80 w-80 rounded-full bg-emerald-500/4 blur-3xl"
      />

      <ClearanceHero />

      <div className="relative mx-auto w-full max-w-[1360px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {/* Demo controls (the staff panel itself floats bottom-right). */}
        <DemoModeControls />
        <DemoModeBanner />
        <ClearanceBody />
      </div>
    </main>
  );
}
