import { ClearanceBody } from "./ClearanceBody";
import { ClearanceHero } from "./ClearanceHero";
import { DemoModeBanner } from "./DemoModeBanner";
import { DemoModeControls } from "./DemoModeControls";

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
