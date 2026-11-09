import { ClearanceBody } from "@/components/features/student/clearance/ClearanceBody";
import { ClearanceHero } from "@/components/features/student/clearance/ClearanceHero";
import { DemoModeBanner } from "@/components/features/student/clearance/DemoModeBanner";
import { DemoModeControls } from "@/components/features/student/clearance/DemoModeControls";

/** Clearance hero plus the demo controls and the clearance cards. */
export function ClearanceMain() {
  return (
    <main>
      <ClearanceHero />

      <div className="mx-auto w-full max-w-[1280px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {/* Demo controls (the staff panel itself floats bottom-right). */}
        <DemoModeControls />
        <DemoModeBanner />
        <ClearanceBody />
      </div>
    </main>
  );
}
