import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import { Modal } from "./Modal";
import { OfficeSignatureCard } from "./OfficeSignatureCard";
import { useClearance } from "../context/ClearanceContext";

/** Section 4: the six office tiles plus the bulk "Request All" action. */
export function OfficeSignatureGrid() {
  const { offices, requestAll } = useClearance();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const notRequested = offices.filter((office) => office.status === "not_requested");
  const signed = offices.filter((office) => office.status === "signed").length;

  async function handleRequestAll() {
    if (busy || notRequested.length === 0) return;
    setBusy(true);
    try {
      await requestAll(notRequested.map((office) => office.office));
      setConfirmOpen(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby="signatures-heading" className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2
            id="signatures-heading"
            className="font-poppins text-lg font-bold text-cpc-navy-text"
          >
            Signatures
          </h2>
          <p className="mt-1 font-poppins text-xs text-cpc-heading-soft">
            Request each office to sign. {signed} of {offices.length} offices have signed.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          disabled={notRequested.length === 0}
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-cpc-navy-text px-3.5 py-2 font-poppins text-xs font-semibold text-cpc-navy-text transition-colors hover:bg-cpc-section-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent disabled:cursor-not-allowed disabled:border-cpc-tile-border disabled:text-cpc-heading-soft disabled:hover:bg-transparent"
        >
          <Send className="h-3.5 w-3.5" aria-hidden />
          Request All
          {notRequested.length > 0 && (
            <span className="rounded-full bg-cpc-section-light px-1.5 py-0.5 text-[10px] font-bold text-cpc-blue-accent">
              {notRequested.length}
            </span>
          )}
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {offices.map((office) => (
          <OfficeSignatureCard key={office.office} office={office} />
        ))}
      </div>

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} labelledBy="request-all-title">
        <div className="p-5 sm:p-6">
          <h2
            id="request-all-title"
            className="pr-8 font-poppins text-lg font-semibold text-cpc-navy-text"
          >
            Request all signatures?
          </h2>
          <p className="mt-2 font-poppins text-sm leading-relaxed text-cpc-heading-soft">
            This sends a signature request to the{" "}
            <span className="font-semibold text-cpc-navy-text">
              {notRequested.length} {notRequested.length === 1 ? "office" : "offices"}
            </span>{" "}
            that {notRequested.length === 1 ? "has" : "have"} not been requested yet.
          </p>

          <ul className="mt-3 flex flex-wrap gap-1.5">
            {notRequested.map((office) => (
              <li
                key={office.office}
                className="rounded-full border border-cpc-tile-border bg-cpc-section-light px-2.5 py-1 font-poppins text-[11px] font-medium text-cpc-label"
              >
                {office.label}
              </li>
            ))}
          </ul>

          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setConfirmOpen(false)}
              disabled={busy}
              className="cursor-pointer rounded-lg border border-cpc-tile-border px-4 py-2.5 font-poppins text-sm font-medium text-cpc-label transition-colors hover:bg-cpc-section-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleRequestAll}
              disabled={busy || notRequested.length === 0}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-cpc-button px-4 py-2.5 font-poppins text-sm font-semibold text-white transition-colors hover:bg-cpc-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Send className="h-4 w-4" aria-hidden />
              )}
              {busy ? "Sending…" : "Send Requests"}
            </button>
          </div>
        </div>
      </Modal>
    </section>
  );
}
