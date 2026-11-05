import { Download, Lock, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/cn";
import { useClearance } from "../context/ClearanceContext";
import { useClearanceProgress } from "../hooks/useClearanceProgress";
import { downloadClearanceSlip } from "../utils/clearancePdf";

/** Section 2: unlocks the confirmation slip once every office has signed. */
export function ClearanceConfirmationCard() {
  const { student, offices, dateCleared, referenceNumber } = useClearance();
  const { isCleared, total } = useClearanceProgress();

  function handleDownload() {
    if (!isCleared || !dateCleared) return;
    downloadClearanceSlip({
      student,
      offices,
      referenceNumber,
      dateCleared,
    });
  }

  return (
    <section
      aria-labelledby="confirmation-heading"
      className="flex h-full flex-col rounded-xl bg-cpc-navy p-5 text-white shadow-[0_14px_36px_rgba(11,42,123,0.28)]"
    >
      <div
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-full transition-colors",
          isCleared ? "bg-emerald-400/20 text-emerald-300" : "bg-white/12 text-white",
        )}
      >
        {isCleared ? (
          <ShieldCheck className="h-6 w-6" aria-hidden />
        ) : (
          <Lock className="h-5 w-5" aria-hidden />
        )}
      </div>

      <h2
        id="confirmation-heading"
        className="mt-4 font-poppins text-lg font-semibold text-white"
      >
        Clearance Confirmation
      </h2>

      <p className="mt-2 font-poppins text-xs leading-relaxed text-white/75">
        {isCleared
          ? "Your clearance is complete. Download the signed confirmation slip with every office signature."
          : `Your confirmation slip and reference number unlock once all ${total} offices have cleared you.`}
      </p>

      {isCleared && (
        <p className="mt-3 rounded-md bg-white/10 px-3 py-2 font-poppins text-xs text-white/85">
          Reference No. <span className="font-semibold text-white">{referenceNumber}</span>
        </p>
      )}

      <div className="mt-auto pt-5">
        <button
          type="button"
          onClick={handleDownload}
          disabled={!isCleared}
          aria-disabled={!isCleared}
          className={cn(
            "inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 font-poppins text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
            isCleared
              ? "cursor-pointer bg-white text-cpc-navy hover:bg-cpc-section-light"
              : "cursor-not-allowed bg-white/15 text-white/50",
          )}
        >
          <Download className="h-4 w-4" aria-hidden />
          Download Confirmation
        </button>
      </div>
    </section>
  );
}
