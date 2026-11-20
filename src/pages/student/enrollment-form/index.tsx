import { PortalHeader } from "@/components/common/layout/PortalHeader";
import { PortalFooter } from "@/components/common/layout/PortalFooter";
import { StudentEnrollmentFormView } from "@/components/features/enrollmentWorkflow/StudentEnrollmentFormView";

export default function StudentEnrollmentFormPage() {
  return (
    <div className="min-h-screen w-full overflow-x-clip bg-white font-poppins">
      <PortalHeader />
      <StudentEnrollmentFormView />
      <PortalFooter />
    </div>
  );
}
