import { ToastProvider } from "@/components/ui/toast";
import { ClearanceView } from "@/student/features/clearance/components/ClearanceView";
import { ClearanceProvider } from "@/student/features/clearance/context/ClearanceContext";
import { NotificationProvider } from "@/student/features/clearance/context/NotificationContext";

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
