import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  ACCEPTED_DOCUMENT_TYPES,
  MAX_DOCUMENT_BYTES,
  MAX_DOCUMENT_PHOTOS,
  MIN_DOCUMENT_PHOTOS,
  type PurposeOption,
  type RequestFormValues,
  type ServiceOption,
  type ServiceRequest,
  type ServiceRequestDraft,
} from "@/services/serviceRequests/student";
import { StudentIdUpload } from "@/components/features/student/service-requests/StudentIdUpload";
import { ActionButton, useActionStatus } from "@/components/ui/action-button";
import { showError } from "@/lib/feedback";

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
  const [files, setFiles] = useState<File[]>([]);
  const [savedDocument, setSavedDocument] = useState(draft?.document ?? null);
  const [errors, setErrors] = useState<FormErrors>({});
  const appliedDraft = useRef<string | null>(null);
  const submitAction = useActionStatus();
  const draftAction = useActionStatus(1200);

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
    setFiles([]);
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

    if (requireFile && files.length + (savedDocument ? 1 : 0) < MIN_DOCUMENT_PHOTOS) {
      next.document = "Upload at least 1 photo of your student ID before submitting.";
    }

    return next;
  }

  function buildValues(): RequestFormValues {
    return {
      serviceId: serviceId === "" ? null : serviceId,
      copies: Number(copies) || 1,
      purpose,
      notes,
      documents: files,
      // The student removed the stored photo, so the draft should not keep it.
      removeDraftDocument: files.length === 0 && !savedDocument,
    };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitAction.status === "loading" || submitAction.status === "success") return;

    const nextErrors = validate(true);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    submitAction.start();
    const request = await onSubmit(buildValues());
    if (request) {
      submitAction.succeed();
      resetForm();
    } else {
      submitAction.fail();
    }
  }

  async function handleSaveDraft() {
    if (draftAction.status === "loading" || draftAction.status === "success") return;

    const nextErrors: FormErrors = {};
    const copiesValue = Number(copies);
    if (copies !== "" && (!Number.isInteger(copiesValue) || copiesValue < 1 || copiesValue > 10)) {
      nextErrors.copies = "Enter a whole number from 1 to 10.";
    }
    setErrors((current) => ({ ...current, copies: nextErrors.copies }));
    if (nextErrors.copies) return;

    draftAction.start();
    const saved = await onSaveDraft(buildValues());
    if (saved) {
      draftAction.succeed();
      setErrors({});
      // A newly uploaded photo now lives in the draft; the text fields stay as typed.
      if (files[0]) {
        setSavedDocument({ name: files[0].name, size: files[0].size, mime: files[0].type });
        setFiles([]);
      }
    } else {
      draftAction.fail();
    }
  }

  async function handleDiscardDraft() {
    const discarded = await onDiscardDraft();
    if (discarded) resetForm();
  }

  function handleAddDocuments(nextFiles: File[]) {
    if (nextFiles.length === 0) return;

    const slots = MAX_DOCUMENT_PHOTOS - files.length - (savedDocument ? 1 : 0);
    if (slots <= 0) {
      const message = `You can upload up to ${MAX_DOCUMENT_PHOTOS} photos. Remove one before adding another.`;
      setErrors((current) => ({ ...current, document: message }));
      showError("Too many photos", message);
      return;
    }

    const accepted: File[] = [];
    let error: string | undefined;

    for (const nextFile of nextFiles) {
      if (!ACCEPTED_DOCUMENT_TYPES.includes(nextFile.type)) {
        error = "Upload a PDF, PNG, or JPG file.";
        continue;
      }
      if (nextFile.size > MAX_DOCUMENT_BYTES) {
        error = "Each photo must be 5 MB or smaller.";
        continue;
      }
      accepted.push(nextFile);
    }

    if (nextFiles.length > slots) {
      error = `You can upload up to ${MAX_DOCUMENT_PHOTOS} photos of your student ID.`;
    }

    const room = accepted.slice(0, slots);
    if (room.length > 0) setFiles((current) => [...current, ...room]);
    setErrors((current) => ({ ...current, document: error }));
    if (error) showError("File not accepted", error);
  }

  function handleRemoveDocument(index: number) {
    setFiles((current) => current.filter((_, position) => position !== index));
    setErrors((current) => ({ ...current, document: undefined }));
  }

  function handleRemoveSavedDocument() {
    setSavedDocument(null);
    setErrors((current) => ({ ...current, document: undefined }));
  }

  const documentCount = files.length + (savedDocument ? 1 : 0);
  const hasDocument = documentCount > 0;

  const fieldDisabled = busy || catalogLoading || Boolean(catalogError) || services.length === 0;

  return (
    <section
      id="new-request-form"
      className="sr-card min-w-0 scroll-mt-24 p-5 sm:p-6"
      aria-labelledby="new-request-title"
    >
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
          <div className="enroll-float-field">
            <select
              id="service-select"
              className="enroll-form-select"
              value={serviceId === "" ? "" : String(serviceId)}
              data-filled={serviceId === "" ? "false" : "true"}
              onChange={(event) => {
                setServiceId(event.target.value ? Number(event.target.value) : "");
                setErrors((current) => ({ ...current, serviceId: undefined }));
              }}
              disabled={fieldDisabled}
              aria-invalid={Boolean(errors.serviceId || catalogError)}
            >
              <option value=""></option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
            <label htmlFor="service-select" className="enroll-float-label">
              Service Selection <RequiredMark />
            </label>
          </div>
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
            <div className="enroll-float-field">
              <input
                id="copies-input"
                type="number"
                inputMode="numeric"
                min={1}
                max={10}
                step={1}
                className="enroll-form-input"
                value={copies}
                data-filled={copies === "" ? "false" : "true"}
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
              <label htmlFor="copies-input" className="enroll-float-label">
                Number of Copies <RequiredMark />
              </label>
            </div>
            {errors.copies && <span className="enroll-form-error">{errors.copies}</span>}
          </div>

          <div>
            <div className="enroll-float-field">
              <select
                id="purpose-select"
                className="enroll-form-select"
                value={purpose}
                data-filled={purpose === "" ? "false" : "true"}
                onChange={(event) => {
                  setPurpose(event.target.value);
                  setErrors((current) => ({ ...current, purpose: undefined }));
                }}
                disabled={fieldDisabled}
                aria-invalid={Boolean(errors.purpose)}
              >
                <option value=""></option>
                {purposes.map((option) => (
                  <option key={option.id} value={option.label}>
                    {option.label}
                  </option>
                ))}
              </select>
              <label htmlFor="purpose-select" className="enroll-float-label">
                Purpose <RequiredMark />
              </label>
            </div>
            {errors.purpose && <span className="enroll-form-error">{errors.purpose}</span>}
          </div>
        </div>

        <div>
          <div className="enroll-float-field">
            <textarea
              id="notes-input"
              rows={3}
              maxLength={1000}
              className="enroll-form-textarea resize-y"
              placeholder=" "
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              disabled={fieldDisabled}
            />
            <label htmlFor="notes-input" className="enroll-float-label">
              Additional Notes
            </label>
          </div>
          <div className="mt-1 flex items-start justify-between gap-3 font-poppins text-[10px] text-sr-muted">
            <span className="leading-relaxed">
              Add anything else that should be noted.
            </span>
            <span className="shrink-0 tabular-nums">
              {notes.length}/1000
            </span>
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
                hasDocument
                  ? "inline-flex items-center gap-1.5 rounded-full border border-[#C4EBD9] bg-[#E3F7EE] px-2.5 py-0.5 font-poppins text-[10px] font-semibold text-[#1E8A57]"
                  : "inline-flex items-center gap-1.5 rounded-full border border-[#F6DEB4] bg-[#FEF4E2] px-2.5 py-0.5 font-poppins text-[10px] font-semibold text-[#B7791F]"
              }
            >
              <span
                aria-hidden
                className={
                  hasDocument
                    ? "h-1.5 w-1.5 rounded-full bg-[#1E8A57]"
                    : "h-1.5 w-1.5 rounded-full bg-[#D68A16]"
                }
              />
              {hasDocument ? `Uploaded ${documentCount}/${MAX_DOCUMENT_PHOTOS}` : "Missing"}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="font-poppins text-[11px] font-semibold tracking-[0.08em] text-sr-muted uppercase">
            Document Upload
          </h3>

          <StudentIdUpload
            files={files}
            savedDocument={savedDocument}
            maxFiles={MAX_DOCUMENT_PHOTOS}
            progress={progress}
            disabled={fieldDisabled}
            onAdd={handleAddDocuments}
            onRemove={handleRemoveDocument}
            onRemoveSaved={handleRemoveSavedDocument}
          />
          {errors.document && <span className="enroll-form-error">{errors.document}</span>}
        </div>

        <div className="flex flex-col gap-2.5 pt-1 sm:flex-row sm:items-center">
          <ActionButton
            type="submit"
            status={submitAction.status}
            loadingLabel="Submitting…"
            successLabel="Submitted"
            errorLabel="Try again"
            disabled={fieldDisabled}
          >
            Submit Request
          </ActionButton>
          <ActionButton
            className="cpc-btn-secondary"
            status={draftAction.status}
            loadingLabel="Saving…"
            successLabel="Draft saved"
            errorLabel="Not saved"
            onClick={handleSaveDraft}
            disabled={fieldDisabled}
          >
            Save Draft
          </ActionButton>

          {progress !== null && (
            <span className="font-poppins text-[11px] text-sr-muted">Uploading {progress}%</span>
          )}
        </div>
      </form>
    </section>
  );
}
