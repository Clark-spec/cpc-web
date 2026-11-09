import { Sparkles } from "lucide-react";
import { cn } from "@/lib/cn";
import { useClearance } from "@/components/features/student/clearance/ClearanceContext";

/** Demo-mode explainer and its toggle switch. */
export function DemoModeControls() {
  const { demoMode, toggleDemoMode } = useClearance();

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
      <p className="font-poppins text-xs text-cpc-heading-soft">
        {demoMode
          ? "Demo mode is on — use the staff panel to approve or reject requests."
          : "Staff responses are simulated for this demo."}
      </p>

      <button
        type="button"
        role="switch"
        aria-checked={demoMode}
        onClick={toggleDemoMode}
        title="Toggle with Ctrl+Shift+D"
        className={cn(
          "inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-2 font-poppins text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent",
          demoMode
            ? "border-cpc-blue-accent bg-cpc-blue-accent text-white"
            : "border-cpc-tile-border bg-white text-cpc-label hover:bg-cpc-section-light",
        )}
      >
        <Sparkles className="h-3.5 w-3.5" aria-hidden />
        Demo mode
        <span
          aria-hidden
          className={cn(
            "relative h-4 w-7 rounded-full transition-colors",
            demoMode ? "bg-white/35" : "bg-cpc-tile-border",
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 h-3 w-3 rounded-full bg-white shadow-sm transition-all",
              demoMode ? "left-3.5" : "left-0.5",
            )}
          />
        </span>
      </button>
    </div>
  );
}
