import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  ACCEPTED_DOCUMENT_TYPES,
  MAX_DOCUMENT_BYTES,
  type PurposeOption,
  type RequestFormValues,
  type ServiceOption,
  type ServiceRequest,
  type ServiceRequestDraft,
} from "@/services/student/serviceRequests";
import { DocumentUpload } from "./DocumentUpload";

type NewRequestFormProps = {
  services: ServiceOption[];
  purposes: PurposeOption[];
  draft: ServiceRequestDraft | null;
  submitting: boolean;
  savingDraft: boolean;
  progress: number | null;
  catalogLoading: boolean;
  catalogError: string | null;
  onSubmit: (values: RequestFormValues) => Promise<ServiceRequest | null>;
  onSaveDraft: (values: RequestFormValues) => Promise<boolean>;
  onDiscardDraft: () => Promise<boolean>;
};

type FormErrors = {
  serviceId?: string;
  copies?: string;
  purpose?: string;
  document?: string;
};

function IdCardIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
      <circle cx="8.5" cy="11" r="1.8" />
      <path d="M5.8 16c.5-1.7 1.5-2.5 2.7-2.5s2.2.8 2.7 2.5" />
      <path d="M14.5 10h4M14.5 13h4M14.5 16h2.5" />
    </svg>
  );
}

function RequiredMark() {
  return <span className="text-sr-danger">*</span>;
}

export function NewRequestForm({
  services,
  purposes,
  draft,
  submitting,
  savingDraft,
  progress,
  catalogLoading,
  catalogError,
  onSubmit,
  onSaveDraft,
  onDiscardDraft,
}: NewRequestFormProps) {
  const [serviceId, setServiceId] = useState<number | "">("");
  const [copies, setCopies] = useState("1");
  const [purpose, setPurpose] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [savedDocument, setSavedDocument] = useState(draft?.document ?? null);
  const [errors, setErrors] = useState<FormErrors>({});
  const appliedDraft = useRef<string | null>(null);

  const busy = submitting || savingDraft;

  // Restore the saved draft once, without overwriting whatever the student is
  // currently typing if the draft object refreshes.
  useEffect(() => {
    if (!draft || appliedDraft.current === draft.updatedAt) return;
    appliedDraft.current = draft.updatedAt;
    setServiceId(draft.serviceId ?? "");
    setCopies(String(draft.copies || 1));
    setPurpose(draft.purpose || "");
    setNotes(draft.notes || "");
    setSavedDocument(draft.document);
  }, [draft]);

  function resetForm() {
    appliedDraft.current = null;
    setServiceId("");
    setCopies("1");
    setPurpose("");
    setNotes("");
    setFile(null);
    setSavedDocument(null);
    setErrors({});
  }

  function validate(requireFile: boolean): FormErrors {
    const next: FormErrors = {};
    if (!serviceId) next.serviceId = "Select the service you need.";

    const copiesValue = Number(copies);
    if (!Number.isInteger(copiesValue) || copiesValue < 1 || copiesValue > 10) {
      next.copies = "Enter a whole number from 1 to 10.";
    }

    if (!purpose) next.purpose = "Select the purpose of your request.";

    if (requireFile && !file && !savedDocument) {
      next.document = "Upload a valid student ID before submitting.";
    }

    return next;
  }

  function buildValues(): RequestFormValues {
    return {
      serviceId: serviceId === "" ? null : serviceId,
      copies: Number(copies) || 1,
      purpose,
      notes,
      document: file,
    };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validate(true);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const request = await onSubmit(buildValues());
    if (request) resetForm();
  }

  async function handleSaveDraft() {
    const nextErrors: FormErrors = {};
    const copiesValue = Number(copies);
    if (copies !== "" && (!Number.isInteger(copiesValue) || copiesValue < 1 || copiesValue > 10)) {
      nextErrors.copies = "Enter a whole number from 1 to 10.";
    }
    setErrors((current) => ({ ...current, copies: nextErrors.copies }));
    if (nextErrors.copies) return;

    const saved = await onSaveDraft(buildValues());
    if (saved) {
      setErrors({});
      // A newly uploaded file now lives in the draft; the text fields stay as typed.
      if (file) {
        setSavedDocument({ name: file.name, size: file.size, mime: file.type });
        setFile(null);
      }
    }
  }

  async function handleDiscardDraft() {
    const discarded = await onDiscardDraft();
    if (discarded) resetForm();
  }

  function handleSelectDocument(nextFile: File) {
    if (!ACCEPTED_DOCUMENT_TYPES.includes(nextFile.type)) {
      setErrors((current) => ({
        ...current,
        document: "Upload a PDF, PNG, or JPG file.",
      }));
      return;
    }
    if (nextFile.size > MAX_DOCUMENT_BYTES) {
      setErrors((current) => ({
        ...current,
        document: "The file is larger than 5 MB. Please upload a smaller file.",
      }));
      return;
    }
    setErrors((current) => ({ ...current, document: undefined }));
    setFile(nextFile);
  }

  const fieldDisabled = busy || catalogLoading || Boolean(catalogError) || services.length === 0;

  return (
    <section className="sr-card min-w-0 p-5 sm:p-6" aria-labelledby="new-request-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="new-request-title" className="font-poppins text-[15px] font-semibold text-sr-text">
            New Request
          </h2>
          <p className="mt-1 font-poppins text-[11px] leading-[17px] text-sr-muted">
            Fill out the form below to request your supporting documents.
          </p>
        </div>

        {draft && !busy && (
          <button
            type="button"
            onClick={handleDiscardDraft}
            className="rounded-md px-2 py-1 font-poppins text-[11px] font-semibold text-sr-muted transition-colors hover:bg-sr-page hover:text-sr-danger"
          >
            Discard draft
          </button>
        )}
      </div>

      <form className="sr-form mt-5 space-y-4" onSubmit={handleSubmit} noValidate>
        <div>
          <label htmlFor="service-select" className="enroll-form-label">
            Service Selection <RequiredMark />
          </label>
          <select
            id="service-select"
            className="enroll-form-select"
            value={serviceId === "" ? "" : String(serviceId)}
            onChange={(event) => {
              setServiceId(event.target.value ? Number(event.target.value) : "");
              setErrors((current) => ({ ...current, serviceId: undefined }));
            }}
            disabled={fieldDisabled}
            aria-invalid={Boolean(errors.serviceId || catalogError)}
          >
            <option value="">
              {catalogLoading ? "Loading services…" : "Select a service"}
            </option>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name}
              </option>
            ))}
          </select>
          {catalogError ? (
            <span className="enroll-form-error">
              Services could not be loaded. Please refresh the page.
            </span>
          ) : (
            errors.serviceId && <span className="enroll-form-error">{errors.serviceId}</span>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-[140px_minmax(0,1fr)]">
          <div>
            <label htmlFor="copies-input" className="enroll-form-label">
              Number of Copies <RequiredMark />
            </label>
            <input
              id="copies-input"
              type="number"
              inputMode="numeric"
              min={1}
              max={10}
              step={1}
              className="enroll-form-input"
              value={copies}
              onChange={(event) => {
                const digits = event.target.value.replace(/[^\d]/g, "");
                setCopies(digits);
                setErrors((current) => ({ ...current, copies: undefined }));
              }}
              onBlur={() => {
                const parsed = Number(copies);
                const safe = Number.isFinite(parsed) ? Math.trunc(parsed) : 1;
                setCopies(String(Math.min(10, Math.max(1, safe))));
              }}
              disabled={fieldDisabled}
              aria-invalid={Boolean(errors.copies)}
            />
            {errors.copies && <span className="enroll-form-error">{errors.copies}</span>}
          </div>

          <div>
            <label htmlFor="purpose-select" className="enroll-form-label">
              Purpose <RequiredMark />
            </label>
            <select
              id="purpose-select"
              className="enroll-form-select"
              value={purpose}
              onChange={(event) => {
                setPurpose(event.target.value);
                setErrors((current) => ({ ...current, purpose: undefined }));
              }}
              disabled={fieldDisabled}
              aria-invalid={Boolean(errors.purpose)}
            >
              <option value="">Select a purpose</option>
              {purposes.map((option) => (
                <option key={option.id} value={option.label}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.purpose && <span className="enroll-form-error">{errors.purpose}</span>}
          </div>
        </div>

        <div>
          <label htmlFor="notes-input" className="enroll-form-label">
            Additional Notes
          </label>
          <textarea
            id="notes-input"
            rows={3}
            maxLength={1000}
            className="enroll-form-textarea resize-y"
            placeholder="Add anything else that should be noted."
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            disabled={fieldDisabled}
          />
          <div className="mt-1 text-right font-poppins text-[10px] text-sr-muted">
            {notes.length}/1000
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="font-poppins text-[11px] font-semibold tracking-[0.08em] text-sr-muted uppercase">
            Requirements
          </h3>

          <div className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-sr-section px-3 py-2">
            <div className="flex items-center gap-2 text-sr-text">
              <IdCardIcon className="h-4 w-4 shrink-0 text-sr-primary" />
              <span className="font-poppins text-[12px] font-semibold">Valid Student ID</span>
              <span className="hidden font-poppins text-[11px] text-sr-muted sm:inline">
                · Clear photo or scan of your current CPC ID
              </span>
            </div>
            <span
              className={
                file || savedDocument
                  ? "inline-flex items-center gap-1.5 rounded-full border border-[#C4EBD9] bg-[#E3F7EE] px-2.5 py-0.5 font-poppins text-[10px] font-semibold text-[#1E8A57]"
                  : "inline-flex items-center gap-1.5 rounded-full border border-[#F6DEB4] bg-[#FEF4E2] px-2.5 py-0.5 font-poppins text-[10px] font-semibold text-[#B7791F]"
              }
            >
              <span
                aria-hidden
                className={
                  file || savedDocument
                    ? "h-1.5 w-1.5 rounded-full bg-[#1E8A57]"
                    : "h-1.5 w-1.5 rounded-full bg-[#D68A16]"
                }
              />
              {file || savedDocument ? "Uploaded" : "Missing"}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="font-poppins text-[11px] font-semibold tracking-[0.08em] text-sr-muted uppercase">
            Document Upload
          </h3>

          <DocumentUpload
            file={file}
            savedDocument={savedDocument}
            progress={progress}
            disabled={fieldDisabled}
            onSelect={handleSelectDocument}
            onRemove={() => setFile(null)}
          />
          {errors.document && <span className="enroll-form-error">{errors.document}</span>}
        </div>

        <div className="flex flex-col gap-2.5 pt-1 sm:flex-row sm:items-center">
          <button type="submit" className="sr-btn-primary" disabled={busy || fieldDisabled}>
            {submitting ? "Submitting…" : "Submit Request"}
          </button>
          <button
            type="button"
            className="sr-btn-secondary"
            onClick={handleSaveDraft}
            disabled={busy || fieldDisabled}
          >
            {savingDraft ? "Saving…" : "Save Draft"}
          </button>

          {progress !== null && (
            <span className="font-poppins text-[11px] text-sr-muted">Uploading {progress}%</span>
          )}
        </div>
      </form>
    </section>
  );
}
