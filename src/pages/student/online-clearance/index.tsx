import { ClearanceView } from "@/components/features/student/clearance/ClearanceView";
import { ClearanceProvider } from "@/components/features/student/clearance/ClearanceContext";

/** Route: /student-services/online-clearance */
export default function ClearancePage() {
  return (
    <ClearanceProvider>
      <ClearanceView />
    </ClearanceProvider>
  );
}
