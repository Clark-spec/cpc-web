import { ToastProvider } from "@/components/ui/toast";
import { ClearanceView } from "@/components/features/student/clearance/ClearanceView";
import { ClearanceProvider } from "@/components/features/student/clearance/ClearanceContext";
import { NotificationProvider } from "@/components/features/student/clearance/NotificationContext";

/** Route: /student-services/online-clearance */
export default function ClearancePage() {
  return (
    <ToastProvider>
      <NotificationProvider>
        <ClearanceProvider>
          <ClearanceView />
        </ClearanceProvider>
      </NotificationProvider>
    </ToastProvider>
  );
}
