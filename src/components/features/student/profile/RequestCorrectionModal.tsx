import { useState, type ChangeEvent, type FormEvent } from "react";
import { Paperclip, Send } from "lucide-react";
import { showError, showSuccess } from "@/lib/feedback";
import { useNotifications } from "@/components/context/NotificationContext";
import { useProfile } from "@/components/features/student/profile/ProfileContext";
import { Modal } from "@/components/ui/modal";
import { ActionButton, useActionStatus } from "@/components/ui/action-button";

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
  const { notify } = useNotifications();

  const [correctValue, setCorrectValue] = useState("");
  const [reason, setReason] = useState("");
  const [attachmentName, setAttachmentName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const sendAction = useActionStatus(800);

  function resetAndClose() {
    setCorrectValue("");
    setReason("");
    setAttachmentName("");
    setError(null);
    sendAction.reset();
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
    sendAction.start();
    try {
      await requestCorrection({
        field: fieldLabel,
        correctValue: correctValue.trim(),
        reason: reason.trim(),
        attachmentName: attachmentName || undefined,
      });
      sendAction.succeed();
      showSuccess(
        "Correction request saved",
        `Your request for ${fieldLabel} was recorded for the Registrar's review.`,
      );
      notify({
        message: "Correction request sent to the Registrar",
        type: "info",
        silent: true,
      });
      window.setTimeout(resetAndClose, 650);
    } catch (submitError) {
      sendAction.fail();
      const message =
        submitError instanceof Error
          ? submitError.message
          : "We couldn't send your request. Please try again.";
      setError(message);
      showError("Could not send request", message);
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

        <div className="mt-4">
          <div className="enroll-float-field">
            <input
              id="correction-value"
              value={correctValue}
              onChange={(event) => setCorrectValue(event.target.value)}
              autoComplete="off"
              placeholder=" "
              className="enroll-form-input"
            />
            <label htmlFor="correction-value" className="enroll-float-label">
              Correct value <span className="text-rose-600">*</span>
            </label>
          </div>
        </div>

        <div className="mt-4">
          <div className="enroll-float-field">
            <textarea
              id="correction-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value.slice(0, REASON_LIMIT))}
              rows={3}
              maxLength={REASON_LIMIT}
              placeholder=" "
              className="enroll-form-textarea resize-y"
            />
            <label htmlFor="correction-reason" className="enroll-float-label">
              Reason <span className="text-rose-600">*</span>
            </label>
          </div>
          <div className="mt-1 text-right font-poppins text-[11px] text-cpc-heading-soft">
            {reason.length}/{REASON_LIMIT}
          </div>
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
            disabled={sendAction.status === "loading"}
            className="cpc-btn cpc-btn-secondary"
          >
            Cancel
          </button>
          <ActionButton
            type="submit"
            status={sendAction.status}
            loadingLabel="Sending…"
            successLabel="Sent"
            errorLabel="Try again"
          >
            <Send className="h-4 w-4" aria-hidden />
            Send request
          </ActionButton>
        </div>
      </form>
    </Modal>
  );
}
