import { PortalHeader } from "@/components/common/layout/PortalHeader";
import { PortalFooter } from "@/components/common/layout/PortalFooter";
import { StudentQueueView } from "@/components/features/enrollmentWorkflow/StudentQueueView";

export default function StudentQueuePage() {
  return (
    <div className="min-h-screen w-full overflow-x-clip bg-white font-poppins">
      <PortalHeader />
      <StudentQueueView />
      <PortalFooter />
    </div>
  );
}
