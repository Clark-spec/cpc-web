import { OfficeQueueConsole } from "@/components/features/enrollmentWorkflow/OfficeQueueConsole";
import { PortalHeader } from "@/components/common/layout/PortalHeader";
import { PortalFooter } from "@/components/common/layout/PortalFooter";

export default function RegistrarQueuePage() {
  return (
    <div className="min-h-screen w-full bg-slate-50 font-poppins">
      <PortalHeader />
      <OfficeQueueConsole
        office="registrar"
        title="Registrar's Office"
        stepNumber={8}
        description="Final registration verification, document filing, and Certificate of Registration issuance."
      />
      <PortalFooter />
    </div>
  );
}
