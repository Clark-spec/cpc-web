import { OfficeQueueConsole } from "@/components/features/enrollmentWorkflow/OfficeQueueConsole";
import { PortalHeader } from "@/components/common/layout/PortalHeader";
import { PortalFooter } from "@/components/common/layout/PortalFooter";

export default function AccountingQueuePage() {
  return (
    <div className="min-h-screen w-full bg-slate-50 font-poppins">
      <PortalHeader />
      <OfficeQueueConsole
        office="accounting"
        title="Accounting Office"
        stepNumber={7}
        description="Assessment verification, tuition fee calculation, and payment clearance."
      />
      <PortalFooter />
    </div>
  );
}
