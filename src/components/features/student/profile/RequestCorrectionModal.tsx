import { useState, type ChangeEvent, type FormEvent } from "react";
import { Link } from "react-router";
import { Camera, CheckCircle2, Eye, FileText, Paperclip, Send, X } from "lucide-react";
import { showError } from "@/lib/feedback";
import { useProfile } from "@/components/features/student/profile/ProfileContext";
import { Modal } from "@/components/ui/modal";
import { CameraCaptureModal } from "@/components/ui/camera-capture-modal";
import { ImagePreviewModal } from "@/components/ui/image-preview-modal";
import { ActionButton, useActionStatus } from "@/components/ui/action-button";

const REASON_LIMIT = 200;
const ATTACHMENT_LIMIT = 8 * 1024 * 1024;

type SupportingDocument = { name: string; type: string; data: string };

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
  const { requestCorrection, profile } = useProfile();

  const [correctValue, setCorrectValue] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [middleInitial, setMiddleInitial] = useState("");
  const [reason, setReason] = useState("");
  const [attachment, setAttachment] = useState<SupportingDocument | null>(null);
  const [documentLabel, setDocumentLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const sendAction = useActionStatus(800);

  function resetAndClose() {
    setCorrectValue("");
    setFirstName("");
    setLastName("");
    setMiddleInitial("");
    setReason("");
    setAttachment(null);
    setDocumentLabel("");
    setError(null);
    setSubmitted(false);
    setCameraOpen(false);
    setPreviewOpen(false);
    sendAction.reset();
    onClose();
  }

  async function handleSelectedFile(file?: File) {
    if (!file) return;
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      setError("Choose an image or PDF document.");
      return;
    }
    if (file.size > ATTACHMENT_LIMIT) {
      setError("The supporting document must be 8 MB or smaller.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        setError("Could not read this document. Please choose it again.");
        return;
      }
      setAttachment({ name: file.name, type: file.type, data: reader.result });
      setDocumentLabel((current) => current || file.name.replace(/\.[^.]+$/, ""));
      setError(null);
    };
    reader.onerror = () => setError("Could not read this document. Please choose it again.");
    reader.readAsDataURL(file);
  }

  function handleAttachment(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    void handleSelectedFile(file);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const requestedValue = fieldLabel === "Full Name"
      ? [firstName.trim(), middleInitial.trim() ? `${middleInitial.trim().replace(/\.$/, "")}.` : "", lastName.trim()]
          .filter(Boolean)
          .join(" ")
      : correctValue.trim();
    if (fieldLabel === "Full Name" && (!firstName.trim() || !lastName.trim())) {
      setError("Enter both a first name and a last name.");
      return;
    }
    if (!requestedValue) {
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
        currentValue: currentValueForField(profile, fieldLabel),
        correctValue: requestedValue,
        reason: reason.trim(),
        attachmentName: attachment ? (documentLabel.trim() || attachment.name) : undefined,
        attachmentType: attachment?.type,
        attachmentData: attachment?.data,
      });
      setSubmitted(true);
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
    <>
    <Modal open={open} onClose={resetAndClose} labelledBy="correction-title">
      {submitted ? (
        <section className="p-6 text-center" role="status">
          <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" aria-hidden />
          <h2 id="correction-title" className="mt-3 font-poppins text-lg font-bold text-cpc-navy-text">Request sent to the Registrar</h2>
          <p className="mt-2 font-poppins text-sm leading-relaxed text-cpc-heading-soft">Your profile has not changed yet. You can track the review and read the Registrar’s response from your request list.</p>
          <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
            <Link to="/my-account/profile-corrections" onClick={resetAndClose} className="cpc-btn cpc-btn-primary">
              Track request status
            </Link>
            <button type="button" onClick={resetAndClose} className="cpc-btn cpc-btn-secondary">Done</button>
          </div>
        </section>
      ) : <form onSubmit={handleSubmit} noValidate className="p-5 sm:p-6">
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

        {fieldLabel === "Full Name" ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="font-poppins text-xs font-semibold text-cpc-label">
              First name <span className="text-rose-600">*</span>
              <input required maxLength={60} value={firstName} onChange={(event) => setFirstName(event.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-cpc-input-border px-3 font-normal" placeholder="First name" />
            </label>
            <label className="font-poppins text-xs font-semibold text-cpc-label">
              Last name <span className="text-rose-600">*</span>
              <input required maxLength={60} value={lastName} onChange={(event) => setLastName(event.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-cpc-input-border px-3 font-normal" placeholder="Last name" />
            </label>
            <label className="font-poppins text-xs font-semibold text-cpc-label sm:col-span-2">
              Middle initial (optional)
              <input maxLength={2} value={middleInitial} onChange={(event) => setMiddleInitial(event.target.value.replace(/[^a-zA-Z.]/g, "").slice(0, 2))} className="mt-1.5 h-10 w-full rounded-lg border border-cpc-input-border px-3 font-normal uppercase sm:max-w-[calc(50%-0.375rem)]" placeholder="M.I." />
            </label>
          </div>
        ) : fieldLabel === "Gender" ? (
          <label className="mt-4 block font-poppins text-xs font-semibold text-cpc-label">
            Correct gender <span className="text-rose-600">*</span>
            <select required value={correctValue} onChange={(event) => setCorrectValue(event.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-cpc-input-border px-3 font-normal">
              <option value="" disabled>Select gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </label>
        ) : fieldLabel === "Date of Birth" ? (
          <label className="mt-4 block font-poppins text-xs font-semibold text-cpc-label">
            Correct date of birth <span className="text-rose-600">*</span>
            <input
              required
              type="date"
              value={correctValue}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(event) => setCorrectValue(event.target.value)}
              className="mt-1.5 h-10 w-full rounded-lg border border-cpc-input-border px-3 font-normal"
            />
          </label>
        ) : (
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
        )}

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

        <div className="mt-4 rounded-xl border border-dashed border-cpc-tile-border bg-cpc-section-light/50 p-3">
          <p className="font-poppins text-xs font-semibold text-cpc-navy-text">Supporting document (optional)</p>
          <p className="mt-1 font-poppins text-[11px] text-cpc-heading-soft">Example: Birth Certificate. Add a photo from your device or take one with your camera (up to 8 MB).</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <label htmlFor="correction-attachment" className="cpc-btn cpc-btn-secondary cpc-btn-sm cursor-pointer">
              <Paperclip className="h-3.5 w-3.5" aria-hidden /> Upload document
            </label>
            <input id="correction-attachment" type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf" className="sr-only" onChange={(event) => void handleAttachment(event)} />
            <button type="button" onClick={() => setCameraOpen(true)} className="cpc-btn cpc-btn-secondary cpc-btn-sm">
              <Camera className="h-3.5 w-3.5" aria-hidden /> Use camera
            </button>
          </div>
          {attachment && (
            <div className="mt-3 rounded-lg border border-cpc-tile-border bg-white p-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 shrink-0 text-cpc-blue-accent" aria-hidden />
                <input aria-label="Supporting document name" value={documentLabel} onChange={(event) => setDocumentLabel(event.target.value)} maxLength={120} className="h-9 min-w-0 flex-1 rounded-md border border-cpc-input-border px-2 font-poppins text-xs" placeholder="e.g. Birth Certificate" />
                <button type="button" onClick={() => { setAttachment(null); setDocumentLabel(""); }} aria-label="Remove supporting document" className="rounded p-1 text-cpc-heading-soft hover:bg-rose-50 hover:text-rose-600"><X className="h-4 w-4" aria-hidden /></button>
              </div>
              {attachment.type.startsWith("image/") ? (
                <button type="button" onClick={() => setPreviewOpen(true)} className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-cpc-input-border px-3 py-1.5 font-poppins text-xs font-semibold text-cpc-blue-accent hover:bg-cpc-section-light">
                  <Eye className="h-3.5 w-3.5" aria-hidden /> Preview photo
                </button>
              ) : (
                <a href={attachment.data} target="_blank" rel="noreferrer" className="mt-3 inline-flex font-poppins text-xs font-semibold text-cpc-blue-accent underline">Preview PDF: {documentLabel || attachment.name}</a>
              )}
            </div>
          )}
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
      </form>}
    </Modal>
    <CameraCaptureModal
      open={cameraOpen}
      onClose={() => setCameraOpen(false)}
      onCapture={(file) => { setCameraOpen(false); void handleSelectedFile(file); }}
      title="Photograph supporting document"
      description="Position the document in the frame and take a clear photo."
      fileNamePrefix="correction-document"
      captureLabel="Capture document"
    />
    {attachment?.type.startsWith("image/") && (
      <ImagePreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        src={attachment.data}
        alt={documentLabel || attachment.name}
        title="Supporting document preview"
        meta={documentLabel || attachment.name}
      />
    )}
    </>
  );
}

function currentValueForField(
  profile: ReturnType<typeof useProfile>["profile"],
  fieldLabel: string,
): string {
  if (!profile) return "";
  const values: Record<string, string> = {
    "Full Name": profile.fullName,
    Gender: profile.gender,
    "Date of Birth": profile.dateOfBirth,
    "Place of Birth": profile.placeOfBirth,
    "Email Address": profile.email,
  };
  return values[fieldLabel] ?? "";
}
