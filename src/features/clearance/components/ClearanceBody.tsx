import { ClearanceSkeleton } from "./ClearanceSkeleton";
import { ClearanceStatusCard } from "./ClearanceStatusCard";
import { ClearanceConfirmationCard } from "./ClearanceConfirmationCard";
import { ClearanceForm } from "./ClearanceForm";
import { OfficeSignatureGrid } from "./OfficeSignatureGrid";
import { ClearanceHistory } from "./ClearanceHistory";
import { useInitialSkeleton } from "../hooks/useInitialSkeleton";

/** Status and confirmation cards, the request form, office signatures, and history. */
export function ClearanceBody() {
  const initializing = useInitialSkeleton();

  if (initializing) return <ClearanceSkeleton />;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-[1.55fr_1fr]">
        <ClearanceStatusCard />
        <ClearanceConfirmationCard />
      </div>

      <ClearanceForm />
      <OfficeSignatureGrid />
      <ClearanceHistory />
    </div>
  );
}
