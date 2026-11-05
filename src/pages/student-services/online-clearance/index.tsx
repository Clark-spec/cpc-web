import { ToastProvider } from "@/components/ui/toast";
import { ClearanceView } from "@/features/clearance/components/ClearanceView";
import { ClearanceProvider } from "@/features/clearance/context/ClearanceContext";
import { NotificationProvider } from "@/features/clearance/context/NotificationContext";

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
