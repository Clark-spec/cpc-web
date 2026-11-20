import { PortalHeader } from "@/components/common/layout/PortalHeader";
import { PortalFooter } from "@/components/common/layout/PortalFooter";
import { StudentVerifyView } from "@/components/features/enrollmentWorkflow/StudentVerifyView";

export default function StudentVerifyPage() {
  return (
    <div className="min-h-screen w-full overflow-x-clip bg-white font-poppins">
      <PortalHeader />
      <StudentVerifyView />
      <PortalFooter />
    </div>
  );
}
