import { PortalFooter } from "@/student/layout/portal-footer";
import { PortalHeader } from "@/student/layout/portal-header";
import { useDemoModeShortcut } from "../hooks/useDemoModeShortcut";
import { ClearanceMain } from "./ClearanceMain";
import { DemoStaffPanel } from "./DemoStaffPanel";
import { NotificationBell } from "./NotificationBell";

/** Page shell for online clearance. */
export function ClearanceView() {
  useDemoModeShortcut();

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-white font-poppins">
      <PortalHeader bell={<NotificationBell />} />

      <ClearanceMain />

      <PortalFooter />
      <DemoStaffPanel />
    </div>
  );
}
