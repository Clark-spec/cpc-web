import { ClearanceAdminProvider } from "@/components/features/admin/clearance/ClearanceAdminContext";
import { SaoActivityAttendancePage } from "@/components/features/admin/clearance/SaoActivityAttendancePage";

export default function SaoEventAttendanceAdminPage() {
  return (
    <ClearanceAdminProvider>
      <SaoActivityAttendancePage />
    </ClearanceAdminProvider>
  );
}
