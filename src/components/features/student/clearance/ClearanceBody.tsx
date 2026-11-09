import { ClearanceSkeleton } from "@/components/features/student/clearance/ClearanceSkeleton";
import { ClearanceStatusCard } from "@/components/features/student/clearance/ClearanceStatusCard";
import { ClearanceConfirmationCard } from "@/components/features/student/clearance/ClearanceConfirmationCard";
import { ClearanceForm } from "@/components/features/student/clearance/ClearanceForm";
import { OfficeSignatureGrid } from "@/components/features/student/clearance/OfficeSignatureGrid";
import { ClearanceHistory } from "@/components/features/student/clearance/ClearanceHistory";
import { useInitialSkeleton } from "@/components/features/student/clearance/useInitialSkeleton";

/** Status and confirmation cards, the request form, office signatures, and history. */
export function ClearanceBody() {
  const initializing = useInitialSkeleton();

  if (initializing) return <ClearanceSkeleton />;

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="grid items-stretch gap-6 lg:grid-cols-[1.4fr_1fr]">
        <ClearanceStatusCard />
        <ClearanceConfirmationCard />
      </div>

      <ClearanceForm />
      <OfficeSignatureGrid />
      <ClearanceHistory />
    </div>
  );
}
