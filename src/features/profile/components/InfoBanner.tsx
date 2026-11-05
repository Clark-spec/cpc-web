import { useState } from "react";
import { Info, ShieldCheck } from "lucide-react";
import { Modal } from "@/components/ui/modal";

/** Portal-wide reminder plus a short data-privacy modal (placeholder copy). */
export function InfoBanner() {
  const [open, setOpen] = useState(false);

  return (
    <section
      aria-label="Keeping your information updated"
      className="flex items-start gap-3 rounded-xl border border-cpc-tile-border bg-cpc-section-light px-4 py-3.5"
    >
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-cpc-blue-accent">
        <Info className="h-4 w-4" aria-hidden />
      </span>

      <div className="min-w-0">
        <p className="font-poppins text-sm font-semibold text-cpc-navy-text">
          Keep your information updated
        </p>
        <p className="mt-0.5 font-poppins text-[13px] leading-relaxed text-cpc-heading-soft">
          Make sure your contact and personal information are current so we can reach you easily
          for important announcements and updates.{" "}
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="cursor-pointer rounded font-semibold text-cpc-blue-accent underline underline-offset-2 transition-colors hover:text-cpc-navy-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
          >
            How we protect your data
          </button>
        </p>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} labelledBy="privacy-title">
        <div className="p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cpc-section-light text-cpc-blue-accent">
              <ShieldCheck className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <h2
                id="privacy-title"
                className="font-poppins text-lg leading-tight font-bold text-cpc-navy-text"
              >
                How we protect your data
              </h2>
              <p className="mt-2 font-poppins text-sm leading-relaxed text-cpc-heading-soft">
                Cordova Public College handles student information in line with the{" "}
                <strong className="font-semibold text-cpc-navy-text">
                  Data Privacy Act of 2012 (Republic Act No. 10173)
                </strong>
                . Your details are used only for academic and administrative purposes, stored
                securely, and shared only with authorised offices.
              </p>
              <p className="mt-3 font-poppins text-xs leading-relaxed text-cpc-heading-soft">
                This is placeholder copy for the student portal demo. For the official privacy
                notice, contact the Registrar or the school's Data Protection Officer.
              </p>
            </div>
          </div>

          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex cursor-pointer items-center justify-center rounded-lg bg-cpc-navy px-4 py-2.5 font-poppins text-sm font-semibold text-white transition-colors hover:bg-cpc-navy-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
            >
              Got it
            </button>
          </div>
        </div>
      </Modal>
    </section>
  );
}
