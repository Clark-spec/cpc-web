import { OfficeQueueConsole } from "@/components/features/enrollmentWorkflow/OfficeQueueConsole";
import { PortalHeader } from "@/components/common/layout/PortalHeader";
import { PortalFooter } from "@/components/common/layout/PortalFooter";

export default function ClinicQueuePage() {
  return (
    <div className="min-h-screen w-full bg-slate-50 font-poppins">
      <PortalHeader />
      <OfficeQueueConsole
        office="clinic"
        title="College Clinic"
        stepNumber={6}
        description="Health assessment, vitals checking, and health examination form sign-off."
      />
      <PortalFooter />
    </div>
  );
}
