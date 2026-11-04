import { Sparkles } from "lucide-react";
import { useClearance } from "../context/ClearanceContext";

/** Explains what the floating staff panel does while demo mode is on. */
export function DemoModeBanner() {
  const { demoMode } = useClearance();

  if (!demoMode) return null;

  return (
    <div
      role="status"
      className="mb-4 flex items-start gap-2 rounded-lg border border-cpc-tile-border bg-cpc-section-light px-3 py-2.5"
    >
      <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-cpc-blue-accent" aria-hidden />
      <p className="font-poppins text-xs leading-relaxed text-cpc-label">
        <span className="font-semibold">Demo mode is on.</span> Request a signature as the student,
        then approve or reject it in the floating staff panel. All six approvals unlock the
        confirmation slip.
      </p>
    </div>
  );
}
