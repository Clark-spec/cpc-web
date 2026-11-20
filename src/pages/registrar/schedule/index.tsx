import { PortalHeader } from "@/components/common/layout/PortalHeader";
import { PortalFooter } from "@/components/common/layout/PortalFooter";
import { RegistrarScheduleView } from "@/components/features/enrollmentWorkflow/RegistrarScheduleView";

export default function RegistrarSchedulePage() {
  return (
    <div className="min-h-screen w-full bg-slate-50 font-poppins">
      <PortalHeader />
      <RegistrarScheduleView />
      <PortalFooter />
    </div>
  );
}
