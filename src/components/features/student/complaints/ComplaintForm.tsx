import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import {
  Camera,
  Clock,
  ImagePlus,
  MessageSquareWarning,
  Paperclip,
  Send,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { ActionButton, useActionStatus } from "@/components/ui/action-button";
import { showApiError, showError, showSuccessModal } from "@/lib/feedback";
import {
  ACCEPTED_DOCUMENT_TYPES,
  MAX_DOCUMENT_BYTES,
} from "@/services/serviceRequests";
import { formatFileSize } from "@/components/features/student/service-requests/format";
import { formatDateTime } from "@/lib/format";
import { COMPLAINT_CATEGORIES } from "./mockComplaints";
import type { ComplaintFormValues } from "./types";
import { CameraCaptureModal } from "@/components/ui/camera-capture-modal";

type ComplaintFormProps = {
  onSubmit: (values: ComplaintFormValues) => Promise<string>;
  cooldownUntil: string | null;
};

type FieldName = Exclude<keyof ComplaintFormValues, "anonymous">;
type ComplaintFormErrors = Partial<Record<FieldName, string>>;

const EMPTY_VALUES: ComplaintFormValues = {
  fullName: "",
  studentId: "",
  courseYearLevel: "",
  email: "",
  contactNumber: "",
  category: "",
  subject: "",
  description: "",
  attachment: null,
  anonymous: false,
};

const FIELD_IDS: Record<FieldName, string> = {
  fullName: "complaint-full-name",
  studentId: "complaint-student-id",
  courseYearLevel: "complaint-course-year",
  email: "complaint-email",
  contactNumber: "complaint-contact",
  category: "complaint-category",
  subject: "complaint-subject",
  description: "complaint-description",
  attachment: "complaint-attachment",
};

function formatRemaining(ms: number): string {
  const totalMinutes = Math.max(1, Math.ceil(ms / 60_000));
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0 || days > 0) parts.push(`${hours}h`);
  parts.push(`${minutes}m`);

  return parts.join(" ");
}

function validate(values: ComplaintFormValues): ComplaintFormErrors {
  const errors: ComplaintFormErrors = {};

  if (!values.category) {
    errors.category = "Select a complaint category.";
  }

  if (values.subject.trim().length < 5) {
    errors.subject = "Enter a subject of at least 5 characters.";
  }

  if (values.description.trim().length < 20) {
    errors.description = "Describe your complaint in at least 20 characters.";
  }

  if (values.attachment) {
    if (!ACCEPTED_DOCUMENT_TYPES.includes(values.attachment.type)) {
      errors.attachment = "Upload a PDF, PNG, or JPG file.";
    } else if (values.attachment.size > MAX_DOCUMENT_BYTES) {
      errors.attachment = "The file is larger than 5 MB. Please upload a smaller file.";
    }
  }

  return errors;
}

function Field({
  id,
  label,
  error,
  className,
  required = true,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  className?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <div className="enroll-float-field">
        {children}
        <label htmlFor={id} className="enroll-float-label">
          {label}
          {required && (
            <span className="text-sr-danger" aria-hidden>
              {" "}
              *
            </span>
          )}
        </label>
      </div>
      {error && (
        <span id={`${id}-error`} className="enroll-form-error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}

/** Complaint form styled with the portal's shared card and form tokens. */
export function ComplaintForm({ onSubmit, cooldownUntil }: ComplaintFormProps) {
  const [values, setValues] = useState<ComplaintFormValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<ComplaintFormErrors>({});
  const [cameraOpen, setCameraOpen] = useState(false);
  const [attachmentDrag, setAttachmentDrag] = useState(false);
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const submitAction = useActionStatus();
  const [now, setNow] = useState(() => Date.now());

  const cooldownEnd = cooldownUntil ? new Date(cooldownUntil).getTime() : 0;
  const cooldownActive = cooldownEnd > now;

  useEffect(() => {
    if (!cooldownUntil) return;

    const timer = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, [cooldownUntil]);

  function update<K extends FieldName>(field: K, value: ComplaintFormValues[K]) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => (current[field] ? { ...current, [field]: undefined } : current));
  }

  function toggleAnonymous() {
    const anonymous = !values.anonymous;
    setValues((current) => ({
      ...current,
      anonymous,
      ...(anonymous
        ? { fullName: "", studentId: "", courseYearLevel: "", email: "", contactNumber: "" }
        : {}),
    }));
    if (anonymous) {
      setErrors((current) => ({
        ...current,
        fullName: undefined,
        studentId: undefined,
        courseYearLevel: undefined,
        email: undefined,
        contactNumber: undefined,
      }));
    }
  }

  function handleAttachment(file: File) {
    if (!ACCEPTED_DOCUMENT_TYPES.includes(file.type)) {
      const message = "Upload a PDF, PNG, or JPG file.";
      setErrors((current) => ({ ...current, attachment: message }));
      showError("File not accepted", message);
      return;
    }
    if (file.size > MAX_DOCUMENT_BYTES) {
      const message = "The file is larger than 5 MB. Please upload a smaller file.";
      setErrors((current) => ({ ...current, attachment: message }));
      showError("File too large", message);
      return;
    }
    update("attachment", file);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (cooldownActive || submitAction.status === "loading" || submitAction.status === "success") {
      return;
    }

    const nextErrors = validate(values);

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      const firstInvalid = Object.keys(nextErrors)[0] as FieldName;
      document.getElementById(FIELD_IDS[firstInvalid])?.focus();
      return;
    }

    submitAction.start();
    const anonymous = values.anonymous;

    try {
      const referenceNumber = await onSubmit({
        ...values,
        fullName: values.anonymous ? "" : values.fullName.trim(),
        studentId: values.anonymous ? "" : values.studentId.trim(),
        courseYearLevel: values.anonymous ? "" : values.courseYearLevel.trim(),
        email: values.anonymous ? "" : values.email.trim(),
        contactNumber: values.anonymous ? "" : values.contactNumber.trim(),
        subject: values.subject.trim(),
        description: values.description.trim(),
      });

      submitAction.succeed();
      setValues(EMPTY_VALUES);
      setErrors({});
      showSuccessModal({
        title: "Complaint submitted",
        message: anonymous
          ? "Your anonymous complaint was filed. Your identity stays hidden from everyone."
          : "The Student Support Office has received your complaint and will review it.",
        reference: referenceNumber,
        meta: "Status: Pending · One complaint every 72 hours",
      });
    } catch (error) {
      submitAction.fail();
      showApiError(error, "Could not submit your complaint");
    }
  }

  return (
    <section
      aria-labelledby="complaint-form-heading"
      className="rounded-2xl border border-cpc-input-border bg-white shadow-[0_10px_30px_rgba(27,47,158,0.06)]"
    >
      <div className="flex flex-col gap-4 border-b border-cpc-input-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cpc-section-light text-cpc-blue-accent">
            <MessageSquareWarning className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <h2
              id="complaint-form-heading"
              className="font-poppins text-lg leading-tight font-bold text-cpc-navy-text"
            >
              File a Complaint
            </h2>
            <p className="mt-0.5 font-poppins text-xs text-cpc-heading-soft">
              Provide the details below so the Student Support Office can assist you.
            </p>
          </div>
        </div>

        <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-cpc-tile-border bg-cpc-section-light px-3 py-1 font-poppins text-[11px] font-semibold text-cpc-navy-text">
          <ShieldCheck className="h-3.5 w-3.5 text-cpc-blue-accent" aria-hidden />
          Confidential
        </span>
      </div>

      <div className="p-4 sm:p-6">
        {cooldownActive && cooldownUntil && (
          <div
            role="status"
            className="mb-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3"
          >
            <Clock className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden />
            <div className="min-w-0">
              <p className="font-poppins text-sm font-semibold text-amber-800">
                You can file one complaint every 72 hours
              </p>
              <p className="mt-0.5 font-poppins text-xs leading-relaxed text-amber-700">
                Your last complaint was filed recently. You can submit again in{" "}
                <span className="font-semibold tabular-nums">
                  {formatRemaining(cooldownEnd - now)}
                </span>{" "}
                — on{" "}
                <span className="font-semibold">{formatDateTime(cooldownUntil)}</span>.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-5 rounded-xl border border-cpc-tile-border bg-cpc-section-light/40 p-3.5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-cpc-blue-accent shadow-sm">
                  <UserRound className="h-4 w-4" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p
                    id="complaint-anonymous-label"
                    className="font-poppins text-xs font-semibold text-cpc-navy-text"
                  >
                    Send anonymously
                  </p>
                  <p
                    id="complaint-anonymous-hint"
                    className="mt-0.5 font-poppins text-[11px] leading-relaxed text-cpc-heading-soft"
                  >
                    {values.anonymous
                      ? "Anonymous mode is on — your name, student ID, and contact details are hidden from everyone."
                      : "Hide your name, student ID, and contact details. The Student Support Office will still review your complaint."}
                  </p>
                </div>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={values.anonymous}
                aria-labelledby="complaint-anonymous-label"
                aria-describedby="complaint-anonymous-hint"
                onClick={toggleAnonymous}
                className={cn(
                  "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent",
                  values.anonymous
                    ? "border-cpc-button bg-cpc-button"
                    : "border-cpc-tile-border bg-white",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transition-transform",
                    values.anonymous ? "translate-x-6" : "translate-x-1",
                  )}
                />
                <span className="sr-only">
                  {values.anonymous ? "Sending anonymously is on" : "Sending anonymously is off"}
                </span>
              </button>
            </div>
          </div>

          <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
            {values.anonymous ? (
              <div className="flex items-start gap-2.5 rounded-xl border border-cpc-tile-border bg-cpc-section-light/50 px-3.5 py-3 sm:col-span-2">
                <ShieldCheck
                  className="mt-0.5 h-4 w-4 shrink-0 text-cpc-blue-accent"
                  aria-hidden
                />
                <p className="font-poppins text-xs leading-relaxed text-cpc-navy-text">
                  Your identity fields are hidden while anonymous mode is on. Only the complaint
                  details below will be recorded.
                </p>
              </div>
            ) : (
              <>
                <Field
                  id={FIELD_IDS.fullName}
                  label="Full Name"
                  error={errors.fullName}
                  required={false}
                >
                  <input
                    id={FIELD_IDS.fullName}
                    type="text"
                    autoComplete="name"
                    placeholder=" "
                    value={values.fullName}
                    onChange={(event) => update("fullName", event.target.value)}
                    className={cn("enroll-form-input", errors.fullName && "error")}
                    aria-invalid={Boolean(errors.fullName)}
                    aria-describedby={
                      errors.fullName ? `${FIELD_IDS.fullName}-error` : undefined
                    }
                  />
                </Field>

                <Field
                  id={FIELD_IDS.studentId}
                  label="Student ID"
                  error={errors.studentId}
                  required={false}
                >
                  <input
                    id={FIELD_IDS.studentId}
                    type="text"
                    placeholder=" "
                    value={values.studentId}
                    onChange={(event) => update("studentId", event.target.value)}
                    className={cn("enroll-form-input", errors.studentId && "error")}
                    aria-invalid={Boolean(errors.studentId)}
                    aria-describedby={
                      errors.studentId ? `${FIELD_IDS.studentId}-error` : undefined
                    }
                  />
                </Field>

                <Field
                  id={FIELD_IDS.courseYearLevel}
                  label="Course / Year Level"
                  error={errors.courseYearLevel}
                  required={false}
                >
                  <input
                    id={FIELD_IDS.courseYearLevel}
                    type="text"
                    placeholder=" "
                    value={values.courseYearLevel}
                    onChange={(event) => update("courseYearLevel", event.target.value)}
                    className={cn("enroll-form-input", errors.courseYearLevel && "error")}
                    aria-invalid={Boolean(errors.courseYearLevel)}
                    aria-describedby={
                      errors.courseYearLevel
                        ? `${FIELD_IDS.courseYearLevel}-error`
                        : undefined
                    }
                  />
                </Field>

                <Field
                  id={FIELD_IDS.email}
                  label="Email"
                  error={errors.email}
                  required={false}
                >
                  <input
                    id={FIELD_IDS.email}
                    type="email"
                    autoComplete="email"
                    placeholder=" "
                    value={values.email}
                    onChange={(event) => update("email", event.target.value)}
                    className={cn("enroll-form-input", errors.email && "error")}
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? `${FIELD_IDS.email}-error` : undefined}
                  />
                </Field>

                <Field
                  id={FIELD_IDS.contactNumber}
                  label="Contact Number"
                  error={errors.contactNumber}
                  required={false}
                >
                  <input
                    id={FIELD_IDS.contactNumber}
                    type="tel"
                    autoComplete="tel"
                    placeholder=" "
                    value={values.contactNumber}
                    onChange={(event) => update("contactNumber", event.target.value)}
                    className={cn("enroll-form-input", errors.contactNumber && "error")}
                    aria-invalid={Boolean(errors.contactNumber)}
                    aria-describedby={
                      errors.contactNumber ? `${FIELD_IDS.contactNumber}-error` : undefined
                    }
                  />
                </Field>
              </>
            )}

            <Field id={FIELD_IDS.category} label="Complaint Category" error={errors.category}>
              <select
                id={FIELD_IDS.category}
                value={values.category}
                data-filled={values.category ? "true" : "false"}
                onChange={(event) => update("category", event.target.value)}
                className={cn("enroll-form-select", errors.category && "error")}
                aria-invalid={Boolean(errors.category)}
                aria-describedby={
                  errors.category ? `${FIELD_IDS.category}-error` : undefined
                }
              >
                <option value=""></option>
                {COMPLAINT_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              id={FIELD_IDS.subject}
              label="Subject"
              error={errors.subject}
              className="sm:col-span-2"
            >
              <input
                id={FIELD_IDS.subject}
                type="text"
                placeholder=" "
                value={values.subject}
                onChange={(event) => update("subject", event.target.value)}
                className={cn("enroll-form-input", errors.subject && "error")}
                aria-invalid={Boolean(errors.subject)}
                aria-describedby={
                  errors.subject ? `${FIELD_IDS.subject}-error` : undefined
                }
              />
            </Field>

            <Field
              id={FIELD_IDS.description}
              label="Detailed Description"
              error={errors.description}
              className="sm:col-span-2"
            >
              <textarea
                id={FIELD_IDS.description}
                rows={5}
                maxLength={2000}
                placeholder=" "
                value={values.description}
                onChange={(event) => update("description", event.target.value)}
                className={cn(
                  "enroll-form-textarea resize-y",
                  errors.description && "error",
                )}
                aria-invalid={Boolean(errors.description)}
                aria-describedby={
                  errors.description ? `${FIELD_IDS.description}-error` : undefined
                }
              />
              <div className="mt-1 flex items-start justify-between gap-3 font-poppins text-[10px] text-cpc-heading-soft">
                <span className="leading-relaxed">
                  Describe what happened, when and where it happened, and who was involved.
                </span>
                <span className="shrink-0 tabular-nums">
                  {values.description.length}/2000
                </span>
              </div>
            </Field>

            <div className="sm:col-span-2">
              <p className="enroll-form-label">
                Supporting Attachment{" "}
                <span className="font-normal text-cpc-heading-soft">(optional)</span>
              </p>
              <p className="mb-2 font-poppins text-[11px] leading-relaxed text-cpc-heading-soft">
                Upload a PDF, PNG, or JPG up to 5 MB, or capture a photo with your camera.
              </p>

              {values.attachment ? (
                <div className="flex flex-wrap items-center gap-3 rounded-[10px] border border-cpc-input-border bg-white px-3 py-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cpc-section-light text-cpc-blue-accent">
                    <Paperclip className="h-[18px] w-[18px]" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-poppins text-[13px] font-medium text-cpc-navy-text">
                      {values.attachment.name}
                    </p>
                    <p className="font-poppins text-[11px] text-cpc-heading-soft">
                      {formatFileSize(values.attachment.size)} · Ready to attach
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      update("attachment", null);
                      setErrors((current) => ({ ...current, attachment: undefined }));
                    }}
                    aria-label="Remove attachment"
                    title="Remove attachment"
                    className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-cpc-input-border bg-white text-cpc-heading-soft transition-colors hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
                  >
                    <X className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              ) : (
                <div
                  onDragEnter={(event) => {
                    event.preventDefault();
                    setAttachmentDrag(true);
                  }}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setAttachmentDrag(true);
                  }}
                  onDragLeave={(event) => {
                    event.preventDefault();
                    setAttachmentDrag(false);
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    setAttachmentDrag(false);
                    const file = event.dataTransfer.files?.[0];
                    if (file) handleAttachment(file);
                  }}
                  className={cn(
                    "rounded-[10px] border-2 border-dashed px-3 py-5 text-center transition-colors",
                    attachmentDrag
                      ? "border-cpc-blue-accent bg-cpc-section-light"
                      : "border-cpc-input-border bg-[#F8FAFF]",
                  )}
                >
                  <ImagePlus className="mx-auto h-7 w-7 text-cpc-blue-accent" aria-hidden />
                  <p className="mt-2 font-poppins text-[13px] font-semibold text-cpc-navy-text">
                    Add a supporting attachment
                  </p>
                  <p className="mt-0.5 font-poppins text-[11px] text-cpc-heading-soft">
                    PDF, PNG, or JPG up to 5 MB
                  </p>

                  <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => attachmentInputRef.current?.click()}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-cpc-input-border bg-white px-3 py-1.5 font-poppins text-[11px] font-semibold text-cpc-blue-accent transition-colors hover:border-cpc-blue-accent/40 hover:bg-cpc-section-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
                    >
                      <ImagePlus className="h-3.5 w-3.5" aria-hidden />
                      Upload file
                    </button>
                    <button
                      type="button"
                      onClick={() => setCameraOpen(true)}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-cpc-navy-top px-3 py-1.5 font-poppins text-[11px] font-semibold text-white shadow-[0_4px_12px_rgba(27,47,158,0.22)] transition-colors hover:bg-cpc-blue-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
                    >
                      <Camera className="h-3.5 w-3.5" aria-hidden />
                      Use camera
                    </button>
                  </div>

                  <p className="mt-2 font-poppins text-[10px] text-cpc-heading-soft">
                    You can also drag and drop the file here.
                  </p>

                  <input
                    ref={attachmentInputRef}
                    type="file"
                    className="hidden"
                    accept={ACCEPTED_DOCUMENT_TYPES.join(",")}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      event.target.value = "";
                      if (file) handleAttachment(file);
                    }}
                  />
                </div>
              )}

              {errors.attachment && (
                <span id="complaint-attachment-error" className="enroll-form-error" role="alert">
                  {errors.attachment}
                </span>
              )}
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 border-t border-cpc-input-border pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-start gap-2 font-poppins text-[11px] leading-relaxed text-cpc-heading-soft">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cpc-blue-accent" aria-hidden />
              {values.anonymous
                ? "Anonymous complaints hide your identity from everyone, including the Student Support Office."
                : "Your complaint is shared only with the Student Support Office."}
            </p>
            <ActionButton
              type="submit"
              status={submitAction.status}
              loadingLabel="Submitting…"
              successLabel="Submitted"
              errorLabel="Try again"
              disabled={cooldownActive}
              title={
                cooldownActive
                  ? "You can file one complaint every 72 hours."
                  : undefined
              }
              className="w-full sm:w-auto"
            >
              <Send className="h-4 w-4" aria-hidden />
              Submit Complaint
            </ActionButton>
          </div>
        </form>
      </div>

      {cameraOpen && (
        <CameraCaptureModal
          open
          onClose={() => setCameraOpen(false)}
          onCapture={handleAttachment}
        />
      )}
    </section>
  );
}
