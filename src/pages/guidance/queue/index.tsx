import { PortalHeader } from "@/components/common/layout/PortalHeader";
import { PortalFooter } from "@/components/common/layout/PortalFooter";
import { GuidanceQueueView } from "@/components/features/enrollmentWorkflow/GuidanceQueueView";

export default function GuidanceQueuePage() {
  return (
    <div className="min-h-screen w-full bg-slate-50 font-poppins">
      <PortalHeader />
      <GuidanceQueueView />
      <PortalFooter />
    </div>
  );
}
