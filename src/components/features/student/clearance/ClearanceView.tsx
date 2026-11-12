import { PortalFooter } from "@/components/common/layout/PortalFooter";
import { PortalHeader } from "@/components/common/layout/PortalHeader";
import { useDemoModeShortcut } from "@/components/features/student/clearance/useDemoModeShortcut";
import { ClearanceMain } from "@/components/features/student/clearance/ClearanceMain";
import { DemoStaffPanel } from "@/components/features/student/clearance/DemoStaffPanel";
import { NotificationBell } from "@/components/features/student/clearance/NotificationBell";

/** Page shell for online clearance. */
export function ClearanceView() {
  useDemoModeShortcut();

  return (
    <div className="min-h-screen w-full overflow-x-clip bg-white font-poppins">
      <PortalHeader bell={<NotificationBell />} />

      <ClearanceMain />

      <PortalFooter />
      <DemoStaffPanel />
    </div>
  );
}
