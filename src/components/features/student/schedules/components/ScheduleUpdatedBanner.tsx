import { RefreshCw, X } from "lucide-react";

type ScheduleUpdatedBannerProps = {
  /** "Updated Oct 04, 2026 · v7" */
  caption: string;
  onDismiss: () => void;
};

/**
 * Appears the moment staff publish a newer version, including live in a tab
 * that was already open. `role="status"` is what makes a screen reader announce
 * it without stealing focus from the table the student is reading.
 */
export function ScheduleUpdatedBanner({ caption, onDismiss }: ScheduleUpdatedBannerProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="mb-4 flex items-start gap-3 rounded-2xl border border-cpc-input-border bg-cpc-section-light px-4 py-3 text-cpc-navy-text shadow-[0_6px_18px_rgba(27,47,158,0.06)] print:hidden"
    >
      <RefreshCw className="mt-0.5 h-5 w-5 shrink-0 text-cpc-blue-accent" aria-hidden />
      <div className="min-w-0">
        <p className="font-poppins text-sm font-semibold">Your schedule was updated</p>
        <p className="mt-0.5 font-poppins text-xs text-cpc-heading-soft">
          The times below are the newest version staff released — {caption}.
        </p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss schedule update notice"
        className="ml-auto shrink-0 rounded-lg p-1.5 text-cpc-heading-soft transition-colors hover:bg-white hover:text-cpc-blue-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
      >
        <X className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}
