import { PortalHeader } from "@/components/common/layout/PortalHeader";
import { PortalFooter } from "@/components/common/layout/PortalFooter";
import { RegistrarVerificationView } from "@/components/features/enrollmentWorkflow/RegistrarVerificationView";

export default function RegistrarVerificationPage() {
  return (
    <div className="min-h-screen w-full bg-slate-50 font-poppins">
      <PortalHeader />
      <RegistrarVerificationView />
      <PortalFooter />
    </div>
  );
}
