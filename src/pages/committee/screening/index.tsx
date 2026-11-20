import { PortalHeader } from "@/components/common/layout/PortalHeader";
import { PortalFooter } from "@/components/common/layout/PortalFooter";
import { ScreeningCommitteeView } from "@/components/features/enrollmentWorkflow/ScreeningCommitteeView";

export default function CommitteeScreeningPage() {
  return (
    <div className="min-h-screen w-full bg-slate-50 font-poppins">
      <PortalHeader />
      <ScreeningCommitteeView />
      <PortalFooter />
    </div>
  );
}
