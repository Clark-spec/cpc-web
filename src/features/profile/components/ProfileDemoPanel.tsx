import { LoaderCircle, RefreshCw } from "lucide-react";

type ProfileDemoPanelProps = {
  demoMode: boolean;
  resetting: boolean;
  onReset: () => void;
};

/** Demo-mode explainer and the button that restores the original mock profile. */
export function ProfileDemoPanel({ demoMode, resetting, onReset }: ProfileDemoPanelProps) {
  if (!demoMode) return null;

  return (
    <div
      role="status"
      className="mb-4 flex flex-col gap-3 rounded-xl border border-cpc-tile-border bg-cpc-section-light px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="font-poppins text-xs leading-relaxed text-cpc-label">
        <span className="font-semibold">Demo mode is on.</span> Reset the profile to the original
        mock data at any time. Try <code>?fail=1</code> to simulate a failed save.
      </p>
      <button
        type="button"
        onClick={onReset}
        disabled={resetting}
        className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-cpc-tile-border bg-white px-3 py-1.5 font-poppins text-xs font-semibold text-cpc-blue-accent transition-colors hover:bg-cpc-bg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent disabled:cursor-wait disabled:opacity-60"
      >
        {resetting ? (
          <LoaderCircle className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" aria-hidden />
        ) : (
          <RefreshCw className="h-3.5 w-3.5" aria-hidden />
        )}
        {resetting ? "Resetting…" : "Reset demo data"}
      </button>
    </div>
  );
}
