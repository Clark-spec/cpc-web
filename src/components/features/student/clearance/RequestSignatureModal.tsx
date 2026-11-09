import { useState, type FormEvent } from "react";
import { Loader2, Send } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { officeSignerNames } from "@/services/clearanceStudent/mock";
import type { OfficeSignature } from "@/types/clearance";

type RequestSignatureModalProps = {
  open: boolean;
  office: OfficeSignature;
  onClose: () => void;
  /** Resolves when the request has been persisted. */
  onSend: (note: string) => Promise<void>;
};

const NOTE_MAX_LENGTH = 200;

/**
 * Student-side request dialog. There is no signature capture here: the student
 * writes an optional note and sends the request to the office.
 */
export function RequestSignatureModal({
  open,
  office,
  onClose,
  onSend,
}: RequestSignatureModalProps) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  // The card mounts this dialog only while it is open, so state starts clean.

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    setBusy(true);
    try {
      await onSend(note);
      onClose();
    } finally {
      setBusy(false);
    }
  }

  const recipient = office.signerName ?? officeSignerNames[office.office];

  return (
    <Modal open={open} onClose={onClose} labelledBy="request-signature-title">
      <form onSubmit={handleSubmit} className="p-5 sm:p-6">
        <h2
          id="request-signature-title"
          className="pr-8 font-poppins text-lg font-semibold text-cpc-navy-text sm:text-xl"
        >
          Request Signature from {office.label}
        </h2>
        <p className="mt-1 font-poppins text-sm text-cpc-heading-soft">
          The office will review your records and sign digitally.
        </p>

        <div className="mt-4 rounded-lg border border-cpc-input-border bg-cpc-section-light/60 px-3 py-2.5">
          <p className="font-poppins text-[11px] font-semibold tracking-wide text-cpc-heading-soft uppercase">
            Recipient
          </p>
          <p className="mt-0.5 font-poppins text-sm font-medium text-cpc-navy-text">
            {recipient}
          </p>
          <p className="font-poppins text-xs text-cpc-heading-soft">{office.label} office</p>
        </div>

        <div className="mt-4">
          <label
            htmlFor="request-note"
            className="font-poppins text-sm font-medium text-cpc-label"
          >
            Note to the office <span className="font-normal text-cpc-heading-soft">(optional)</span>
          </label>
          <textarea
            id="request-note"
            value={note}
            onChange={(event) => setNote(event.target.value.slice(0, NOTE_MAX_LENGTH))}
            rows={3}
            maxLength={NOTE_MAX_LENGTH}
            placeholder="e.g. I already submitted the missing requirement last week."
            className="mt-1.5 w-full resize-none rounded-lg border border-cpc-input-border px-3 py-2 font-poppins text-sm text-cpc-navy-text outline-none transition-colors placeholder:text-cpc-heading-soft/70 focus:border-cpc-icon focus:ring-2 focus:ring-cpc-icon/30"
          />
          <p className="mt-1 text-right font-poppins text-[11px] text-cpc-heading-soft">
            {note.length}/{NOTE_MAX_LENGTH} characters
          </p>
        </div>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="cursor-pointer rounded-lg border border-cpc-tile-border px-4 py-2.5 font-poppins text-sm font-medium text-cpc-label transition-colors hover:bg-cpc-section-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-cpc-button px-4 py-2.5 font-poppins text-sm font-semibold text-white transition-colors hover:bg-cpc-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Send className="h-4 w-4" aria-hidden />
            )}
            {busy ? "Sending…" : "Send Request"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
