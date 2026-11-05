import { useState, type ChangeEvent, type FormEvent } from "react";
import { LoaderCircle, Paperclip, Send } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { useNotifications } from "@/context/NotificationContext";
import { useProfile } from "../context/ProfileContext";
import { Modal } from "@/components/ui/modal";

const REASON_LIMIT = 200;

type RequestCorrectionModalProps = {
  open: boolean;
  onClose: () => void;
  /** Registrar-managed field the student wants corrected. */
  fieldLabel: string;
};

/**
 * Correction requests are recorded through `profileService.requestCorrection`
 * and then handed to the (out-of-scope) registrar approval flow.
 */
export function RequestCorrectionModal({ open, onClose, fieldLabel }: RequestCorrectionModalProps) {
  const { requestCorrection } = useProfile();
  const { toast } = useToast();
  const { notify } = useNotifications();

  const [correctValue, setCorrectValue] = useState("");
  const [reason, setReason] = useState("");
  const [attachmentName, setAttachmentName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  function resetAndClose() {
    setCorrectValue("");
    setReason("");
    setAttachmentName("");
    setError(null);
    setSending(false);
    onClose();
  }

  function handleAttachment(event: ChangeEvent<HTMLInputElement>) {
    setAttachmentName(event.target.files?.[0]?.name ?? "");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!correctValue.trim()) {
      setError("Enter the value that should replace the current one.");
      return;
    }
    if (!reason.trim()) {
      setError("Tell the Registrar why this needs to be corrected.");
      return;
    }
    if (reason.trim().length > REASON_LIMIT) {
      setError(`Keep the reason to ${REASON_LIMIT} characters or fewer.`);
      return;
    }

    setError(null);
    setSending(true);
    try {
      await requestCorrection({
        field: fieldLabel,
        correctValue: correctValue.trim(),
        reason: reason.trim(),
        attachmentName: attachmentName || undefined,
      });
      toast("Correction request sent to the Registrar", "success");
      notify({
        message: "Correction request sent to the Registrar",
        type: "info",
        silent: true,
      });
      resetAndClose();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "We couldn't send your request. Please try again.",
      );
      setSending(false);
    }
  }

  return (
    <Modal open={open} onClose={resetAndClose} labelledBy="correction-title">
      <form onSubmit={handleSubmit} noValidate className="p-5 sm:p-6">
        <h2
          id="correction-title"
          className="font-poppins text-lg leading-tight font-bold text-cpc-navy-text"
        >
          Request a correction
        </h2>
        <p className="mt-2 font-poppins text-sm leading-relaxed text-cpc-heading-soft">
          Registrar-managed details can only be changed by the Registrar. Send the correct value
          and a short explanation, and they will review it.
        </p>

        <div className="mt-4 rounded-lg border border-cpc-input-border bg-cpc-section-light px-3 py-2">
          <p className="font-poppins text-[11px] font-semibold tracking-wide text-cpc-heading-soft uppercase">
            Field
          </p>
          <p className="font-poppins text-sm font-semibold text-cpc-navy-text">{fieldLabel}</p>
        </div>

        <div className="mt-4 space-y-1.5">
          <label
            htmlFor="correction-value"
            className="block font-poppins text-[13px] font-semibold text-cpc-navy-text"
          >
            Correct value <span className="text-rose-600">*</span>
          </label>
          <input
            id="correction-value"
            value={correctValue}
            onChange={(event) => setCorrectValue(event.target.value)}
            autoComplete="off"
            className="w-full rounded-lg border border-cpc-input-border bg-white px-3 py-2 font-poppins text-sm text-cpc-navy-text focus:border-cpc-blue-accent focus:ring-2 focus:ring-cpc-blue-accent/25 focus:outline-none"
          />
        </div>

        <div className="mt-4 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <label
              htmlFor="correction-reason"
              className="block font-poppins text-[13px] font-semibold text-cpc-navy-text"
            >
              Reason <span className="text-rose-600">*</span>
            </label>
            <span className="font-poppins text-[11px] text-cpc-heading-soft">
              {reason.length}/{REASON_LIMIT}
            </span>
          </div>
          <textarea
            id="correction-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value.slice(0, REASON_LIMIT))}
            rows={3}
            maxLength={REASON_LIMIT}
            className="w-full resize-y rounded-lg border border-cpc-input-border bg-white px-3 py-2 font-poppins text-sm text-cpc-navy-text focus:border-cpc-blue-accent focus:ring-2 focus:ring-cpc-blue-accent/25 focus:outline-none"
          />
        </div>

        <div className="mt-4">
          <label
            htmlFor="correction-attachment"
            className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-cpc-tile-border bg-cpc-section-light/60 px-3 py-3 font-poppins text-xs text-cpc-heading-soft transition-colors hover:bg-cpc-section-light focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-cpc-blue-accent"
          >
            <Paperclip className="h-4 w-4 shrink-0 text-cpc-blue-accent" aria-hidden />
            <span className="min-w-0 truncate">
              {attachmentName || "Attach a supporting document (optional)"}
            </span>
            <input
              id="correction-attachment"
              type="file"
              accept="image/png,image/jpeg,application/pdf"
              className="sr-only"
              onChange={handleAttachment}
            />
          </label>
        </div>

        {error && (
          <p role="alert" className="mt-3 font-poppins text-xs leading-snug text-rose-600">
            {error}
          </p>
        )}

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={resetAndClose}
            disabled={sending}
            className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-cpc-tile-border bg-white px-4 py-2.5 font-poppins text-sm font-semibold text-cpc-navy-text transition-colors hover:bg-cpc-section-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={sending}
            className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-cpc-navy px-4 py-2.5 font-poppins text-sm font-semibold text-white transition-colors hover:bg-cpc-navy-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent disabled:cursor-not-allowed disabled:opacity-60"
          >
            {sending ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden />
                Sending…
              </>
            ) : (
              <>
                <Send className="h-4 w-4" aria-hidden />
                Send request
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
