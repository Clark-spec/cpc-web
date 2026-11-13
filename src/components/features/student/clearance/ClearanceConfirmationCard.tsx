import { Download, Lock, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/badge";
import { showError, showSuccess } from "@/lib/feedback";
import { useClearance } from "@/components/features/student/clearance/ClearanceContext";
import { useClearanceProgress } from "@/components/features/student/clearance/useClearanceProgress";
import { downloadClearanceSlip } from "@/components/features/student/clearance/clearancePdf";

/** Section 2: unlocks the confirmation slip once every office has signed. */
export function ClearanceConfirmationCard() {
  const { student, offices, dateCleared, referenceNumber } = useClearance();
  const { isCleared, total, signed, percent } = useClearanceProgress();

  function handleDownload() {
    if (!isCleared || !dateCleared) return;
    try {
      downloadClearanceSlip({
        student,
        offices,
        referenceNumber,
        dateCleared,
      });
      showSuccess(
        "Clearance slip downloaded",
        `Reference ${referenceNumber} was saved to your downloads.`,
      );
    } catch {
      showError(
        "Download failed",
        "We could not create the file. Please try again.",
      );
    }
  }

  return (
    <section
      aria-labelledby="confirmation-heading"
      className="relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-cpc-navy via-cpc-navy-deep to-[#091b4c] p-5 text-white shadow-[0_14px_36px_rgba(11,42,123,0.25)] sm:p-6"
    >
      {/* Decorative ambient glow */}
      <div
        className="pointer-events-none absolute -top-12 -right-12 h-44 w-44 rounded-full bg-cpc-blue-accent/25 blur-2xl"
        aria-hidden
      />

      <div>
        <div className="flex items-center justify-between">
          <div
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-xl transition-colors shadow-xs",
              isCleared
                ? "border border-emerald-400/40 bg-emerald-400/20 text-emerald-300"
                : "border border-white/15 bg-white/10 text-white",
            )}
          >
            {isCleared ? (
              <ShieldCheck className="h-6 w-6" aria-hidden />
            ) : (
              <Lock className="h-5 w-5" aria-hidden />
            )}
          </div>
          <Badge
            tone="plain"
            size="sm"
            dot={false}
            className={cn(
              "backdrop-blur-xs",
              isCleared
                ? "border-emerald-400/40 bg-emerald-400/15 text-emerald-300"
                : "border-white/20 bg-white/10 text-white/80",
            )}
          >
            {isCleared ? "Unlocked" : `${signed}/${total} Cleared`}
          </Badge>
        </div>

        <h2
          id="confirmation-heading"
          className="mt-3.5 font-poppins text-lg font-bold text-white"
        >
          Clearance Confirmation
        </h2>

        <p className="mt-1 font-poppins text-xs leading-relaxed text-white/75">
          {isCleared
            ? "Your digital clearance is complete. Download your official signed clearance slip anytime."
            : `Official reference number and printable slip unlock once all ${total} offices clear you.`}
        </p>

        {isCleared ? (
          <div className="mt-3.5 space-y-2 rounded-xl border border-white/15 bg-white/10 p-3 backdrop-blur-xs">
            <div className="flex items-center justify-between">
              <span className="font-poppins text-[10.5px] text-white/70">Reference Number</span>
              <span className="font-poppins text-xs font-bold text-emerald-300 tabular-nums">
                {referenceNumber}
              </span>
            </div>
            {dateCleared && (
              <div className="flex items-center justify-between border-t border-white/10 pt-1.5 text-[10.5px] text-white/70">
                <span>Date Cleared</span>
                <span className="font-medium text-white">{dateCleared}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-3.5 space-y-2 rounded-xl border border-white/10 bg-white/5 p-3 backdrop-blur-xs">
            <div className="flex items-center justify-between text-[11px] font-semibold text-white/90">
              <span>Approval Progress</span>
              <span className="tabular-nums text-emerald-400">{percent}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full rounded-full bg-emerald-400 transition-all duration-500"
                style={{ width: `${percent}%` }}
              />
            </div>
            <p className="pt-0.5 font-poppins text-[10px] leading-snug text-white/60">
              Step 1: Request signature → Step 2: Office signs → Step 3: Slip unlocks.
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 pt-2">
        <button
          type="button"
          onClick={handleDownload}
          disabled={!isCleared}
          aria-disabled={!isCleared}
          className={cn(
            "inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-poppins text-xs font-semibold shadow-xs transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
            isCleared
              ? "cursor-pointer bg-white text-cpc-navy shadow-md hover:bg-cpc-section-light hover:shadow-lg"
              : "cursor-not-allowed border border-white/15 bg-white/10 text-white/45",
          )}
        >
          {isCleared ? (
            <Download className="h-4 w-4" aria-hidden />
          ) : (
            <Lock className="h-3.5 w-3.5" aria-hidden />
          )}
          {isCleared ? "Download Confirmation Slip" : "Slip Locked (Awaiting Offices)"}
        </button>
      </div>
    </section>
  );
}
