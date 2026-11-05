import { ToastProvider } from "@/components/ui/toast";
import { ClearanceView } from "@/components/features/student/clearance/components/ClearanceView";
import { ClearanceProvider } from "@/components/features/student/clearance/context/ClearanceContext";
import { NotificationProvider } from "@/components/features/student/clearance/context/NotificationContext";

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
