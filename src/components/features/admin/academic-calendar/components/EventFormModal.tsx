import { useId, useState, type FormEvent } from "react";
import { AlertCircle, Check, Info, Send } from "lucide-react";
import { cn } from "@/lib/cn";
import { Modal } from "@/components/ui/modal";
import {
  CATEGORY_META,
  CATEGORY_ORDER,
  PROGRAMS,
  SEMESTERS,
  TARGET_AUDIENCES,
  ACADEMIC_YEARS,
  toDateKey,
  type AcademicYear,
  type AdminCalendarEvent,
  type EventCategory,
  type EventStatus,
  type Semester,
} from "../data/academicCalendar";
import {
  CategoryBadge,
  fieldLabelClass,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
  textareaClass,
} from "./CalendarPieces";

export type SaveMode = "draft" | "pending" | "published";

type EventFormModalProps = {
  editing: AdminCalendarEvent | null;
  initialDate?: string;
  initialYear: AcademicYear;
  initialSemester: Semester;
  onClose: () => void;
  onSave: (event: AdminCalendarEvent, mode: SaveMode) => void;
};

type FormState = {
  title: string;
  description: string;
  category: EventCategory;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  allDay: boolean;
  academicYear: AcademicYear;
  semester: Semester;
  programs: string[];
  targetAudience: string;
  status: EventStatus;
  location: string;
  organizer: string;
  department: string;
  notes: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

function buildInitialState(
  editing: AdminCalendarEvent | null,
  initialDate: string | undefined,
  initialYear: AcademicYear,
  initialSemester: Semester,
): FormState {
  if (editing) {
    return {
      title: editing.title,
      description: editing.description,
      category: editing.category,
      startDate: editing.startDate,
      endDate: editing.endDate ?? "",
      startTime: editing.startTime ?? "",
      endTime: editing.endTime ?? "",
      allDay: editing.allDay,
      academicYear: editing.academicYear,
      semester: editing.semester,
      programs: editing.programs,
      targetAudience: editing.targetAudience,
      status:
        editing.status === "archived" || editing.status === "cancelled" ? "draft" : editing.status,
      location: editing.location ?? "",
      organizer: editing.organizer ?? "",
      department: editing.department ?? "",
      notes: editing.notes ?? "",
    };
  }

  const date = initialDate ?? toDateKey(new Date());
  return {
    title: "",
    description: "",
    category: "academic-activity",
    startDate: date,
    endDate: date,
    startTime: "",
    endTime: "",
    allDay: false,
    academicYear: initialYear,
    semester: initialSemester,
    programs: [],
    targetAudience: "All Students",
    status: "published",
    location: "",
    organizer: "",
    department: "",
    notes: "",
  };
}

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {};
  if (!form.title.trim()) errors.title = "Event title is required.";
  else if (form.title.trim().length < 3) errors.title = "Use at least 3 characters.";

  if (!form.startDate) errors.startDate = "Start date is required.";

  if (form.endDate && form.startDate && form.endDate < form.startDate) {
    errors.endDate = "End date cannot be earlier than the start date.";
  }

  if (!form.allDay && form.startTime && form.endTime) {
    const sameDay = !form.endDate || form.endDate === form.startDate;
    if (sameDay && form.endTime <= form.startTime) {
      errors.endTime = "End time must be later than the start time.";
    }
  }

  if (form.category === "deadline" && !form.department.trim()) {
    errors.department = "Add the responsible office so the deadline can be monitored.";
  }

  return errors;
}

const STATUS_OPTIONS: Array<{ id: EventStatus; label: string; helper: string }> = [
  { id: "draft", label: "Save as Draft", helper: "Hidden from the student calendar." },
  { id: "pending", label: "Submit for Review", helper: "Queued for registrar approval." },
  { id: "published", label: "Publish Event", helper: "Marked visible to students." },
];

/** Polished add/edit modal split into the five requested sections. */
export function EventFormModal({
  editing,
  initialDate,
  initialYear,
  initialSemester,
  onClose,
  onSave,
}: EventFormModalProps) {
  const formId = useId();
  const [form, setForm] = useState<FormState>(() =>
    buildInitialState(editing, initialDate, initialYear, initialSemester),
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    if (errors[key]) setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const toggleProgram = (program: string) => {
    setForm((current) => ({
      ...current,
      programs: current.programs.includes(program)
        ? current.programs.filter((entry) => entry !== program)
        : [...current.programs, program],
    }));
  };

  const submit = (mode: SaveMode) => {
    const nextErrors = validate(form);
    setErrors(nextErrors);
    setSubmitted(true);
    if (Object.keys(nextErrors).length > 0) return;

    const now = new Date().toISOString();
    const event: AdminCalendarEvent = {
      id: editing?.id ?? `evt-${crypto.randomUUID()}`,
      title: form.title.trim(),
      description: form.description.trim() || "No description provided.",
      category: form.category,
      startDate: form.startDate,
      endDate: form.endDate && form.endDate !== form.startDate ? form.endDate : undefined,
      startTime: form.allDay ? undefined : form.startTime || undefined,
      endTime: form.allDay ? undefined : form.endTime || undefined,
      allDay: form.allDay,
      academicYear: form.academicYear,
      semester: form.semester,
      programs: form.programs,
      targetAudience: form.targetAudience,
      status: mode,
      location: form.location.trim() || undefined,
      organizer: form.organizer.trim() || undefined,
      department: form.department.trim() || undefined,
      notes: form.notes.trim() || undefined,
      createdAt: editing?.createdAt ?? now,
      updatedAt: now,
    };

    onSave(event, mode);
  };

  const handleSubmit = (submitEvent: FormEvent) => {
    submitEvent.preventDefault();
    submit(form.status === "pending" ? "pending" : form.status === "published" ? "published" : "draft");
  };

  const errorCount = Object.values(errors).filter(Boolean).length;
  const isInactive = editing?.status === "archived" || editing?.status === "cancelled";

  return (
    <Modal
      open
      onClose={onClose}
      labelledBy={`${formId}-title`}
      className="sm:max-w-3xl"
    >
      <form onSubmit={handleSubmit} noValidate>
        <div className="border-b border-cpc-tile-border/60 bg-cpc-bg/60 px-5 py-4 pr-12">
          <p className="font-poppins text-[11px] font-bold tracking-[0.12em] text-cpc-blue-accent uppercase">
            {editing ? "Edit Academic Event" : "Add Academic Event"}
          </p>
          <h2
            id={`${formId}-title`}
            className="mt-0.5 font-poppins text-lg leading-tight font-bold text-cpc-blue-accent"
          >
            {editing ? editing.title : "Create a new calendar event"}
          </h2>
          <p className="mt-1 font-poppins text-xs leading-relaxed text-cpc-heading-soft">
            Changes are saved to the in-browser demo calendar only. Required fields are marked with
            an asterisk.
          </p>
        </div>

        <div className="space-y-4 px-5 py-4">
          {submitted && errorCount > 0 && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 font-poppins text-xs leading-relaxed text-rose-700"
            >
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
              Please fix {errorCount} {errorCount === 1 ? "field" : "fields"} before saving this
              event.
            </div>
          )}

          {isInactive && (
            <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 font-poppins text-xs leading-relaxed text-amber-800">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
              This event is currently {editing?.status}. Choosing a new publication status below
              restores it to the active calendar.
            </div>
          )}

          {/* Section A */}
          <fieldset className="space-y-2.5">
            <legend className="font-poppins text-[11px] font-bold text-cpc-navy-text">
              A. Event Details
            </legend>

            <div>
              <label htmlFor={`${formId}-title-input`} className={fieldLabelClass}>
                Event Title <span className="text-rose-500">*</span>
              </label>
              <input
                id={`${formId}-title-input`}
                autoFocus
                value={form.title}
                onChange={(event) => update("title", event.target.value)}
                aria-invalid={Boolean(errors.title)}
                placeholder="e.g. Final Examinations · Second Semester"
                className={cn(inputClass, errors.title && "border-rose-400 ring-2 ring-rose-100")}
              />
              {errors.title && (
                <p className="mt-1 font-poppins text-[11px] text-rose-600">{errors.title}</p>
              )}
            </div>

            <div>
              <label htmlFor={`${formId}-description`} className={fieldLabelClass}>
                Description
              </label>
              <textarea
                id={`${formId}-description`}
                value={form.description}
                onChange={(event) => update("description", event.target.value)}
                placeholder="What happens during this event and who should attend?"
                className={textareaClass}
              />
            </div>

            <div className="grid gap-2.5 sm:grid-cols-2">
              <div>
                <label htmlFor={`${formId}-category`} className={fieldLabelClass}>
                  Category <span className="text-rose-500">*</span>
                </label>
                <select
                  id={`${formId}-category`}
                  value={form.category}
                  onChange={(event) => update("category", event.target.value as EventCategory)}
                  className={inputClass}
                >
                  {CATEGORY_ORDER.map((category) => (
                    <option key={category} value={category}>
                      {CATEGORY_META[category].label}
                    </option>
                  ))}
                </select>
                <div className="mt-1.5">
                  <CategoryBadge category={form.category} />
                </div>
              </div>

              <div>
                <label htmlFor={`${formId}-audience`} className={fieldLabelClass}>
                  Target Audience
                </label>
                <select
                  id={`${formId}-audience`}
                  value={form.targetAudience}
                  onChange={(event) => update("targetAudience", event.target.value)}
                  className={inputClass}
                >
                  {TARGET_AUDIENCES.map((audience) => (
                    <option key={audience} value={audience}>
                      {audience}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </fieldset>

          {/* Section B */}
          <fieldset className="space-y-2.5 border-t border-cpc-tile-border/60 pt-3.5">
            <legend className="font-poppins text-[11px] font-bold text-cpc-navy-text">
              B. Date and Time
            </legend>

            <div className="grid gap-2.5 sm:grid-cols-2">
              <div>
                <label htmlFor={`${formId}-start-date`} className={fieldLabelClass}>
                  Start Date <span className="text-rose-500">*</span>
                </label>
                <input
                  id={`${formId}-start-date`}
                  type="date"
                  value={form.startDate}
                  onChange={(event) => update("startDate", event.target.value)}
                  aria-invalid={Boolean(errors.startDate)}
                  className={cn(
                    inputClass,
                    errors.startDate && "border-rose-400 ring-2 ring-rose-100",
                  )}
                />
                {errors.startDate && (
                  <p className="mt-1 font-poppins text-[11px] text-rose-600">{errors.startDate}</p>
                )}
              </div>

              <div>
                <label htmlFor={`${formId}-end-date`} className={fieldLabelClass}>
                  End Date
                </label>
                <input
                  id={`${formId}-end-date`}
                  type="date"
                  min={form.startDate || undefined}
                  value={form.endDate}
                  onChange={(event) => update("endDate", event.target.value)}
                  aria-invalid={Boolean(errors.endDate)}
                  className={cn(inputClass, errors.endDate && "border-rose-400 ring-2 ring-rose-100")}
                />
                {errors.endDate && (
                  <p className="mt-1 font-poppins text-[11px] text-rose-600">{errors.endDate}</p>
                )}
              </div>
            </div>

            <div className="grid gap-2.5 sm:grid-cols-2">
              <div>
                <label htmlFor={`${formId}-start-time`} className={fieldLabelClass}>
                  Start Time
                </label>
                <input
                  id={`${formId}-start-time`}
                  type="time"
                  value={form.startTime}
                  disabled={form.allDay}
                  onChange={(event) => update("startTime", event.target.value)}
                  className={cn(inputClass, form.allDay && "bg-cpc-section-light opacity-60")}
                />
              </div>

              <div>
                <label htmlFor={`${formId}-end-time`} className={fieldLabelClass}>
                  End Time
                </label>
                <input
                  id={`${formId}-end-time`}
                  type="time"
                  value={form.endTime}
                  disabled={form.allDay}
                  onChange={(event) => update("endTime", event.target.value)}
                  aria-invalid={Boolean(errors.endTime)}
                  className={cn(
                    inputClass,
                    form.allDay && "bg-cpc-section-light opacity-60",
                    errors.endTime && "border-rose-400 ring-2 ring-rose-100",
                  )}
                />
                {errors.endTime && (
                  <p className="mt-1 font-poppins text-[11px] text-rose-600">{errors.endTime}</p>
                )}
              </div>
            </div>

            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-cpc-tile-border bg-cpc-section-light/60 px-2.5 py-2 font-poppins text-xs font-semibold text-cpc-navy-text">
              <input
                type="checkbox"
                checked={form.allDay}
                onChange={(event) => update("allDay", event.target.checked)}
                className="h-3.5 w-3.5 accent-cpc-blue-accent"
              />
              All-day event
              <span className="font-normal text-cpc-heading-soft">(times are ignored)</span>
            </label>
          </fieldset>

          {/* Section C */}
          <fieldset className="space-y-2.5 border-t border-cpc-tile-border/60 pt-3.5">
            <legend className="font-poppins text-[11px] font-bold text-cpc-navy-text">
              C. Academic Details
            </legend>

            <div className="grid gap-2.5 sm:grid-cols-2">
              <div>
                <label htmlFor={`${formId}-year`} className={fieldLabelClass}>
                  Academic Year <span className="text-rose-500">*</span>
                </label>
                <select
                  id={`${formId}-year`}
                  value={form.academicYear}
                  onChange={(event) => update("academicYear", event.target.value as AcademicYear)}
                  className={inputClass}
                >
                  {ACADEMIC_YEARS.map((year) => (
                    <option key={year} value={year}>
                      A.Y. {year}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor={`${formId}-semester`} className={fieldLabelClass}>
                  Semester <span className="text-rose-500">*</span>
                </label>
                <select
                  id={`${formId}-semester`}
                  value={form.semester}
                  onChange={(event) => update("semester", event.target.value as Semester)}
                  className={inputClass}
                >
                  {SEMESTERS.map((semester) => (
                    <option key={semester} value={semester}>
                      {semester}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <span className={fieldLabelClass}>Applicable Programs</span>
              <div className="flex flex-wrap gap-1.5">
                {PROGRAMS.map((program) => {
                  const selected = form.programs.includes(program);
                  return (
                    <button
                      key={program}
                      type="button"
                      onClick={() => toggleProgram(program)}
                      aria-pressed={selected}
                      className={cn(
                        "inline-flex cursor-pointer items-center gap-1 rounded-full border px-2.5 py-1 font-poppins text-[11px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-cpc-blue-accent",
                        selected
                          ? "border-cpc-blue-accent bg-cpc-section-light text-cpc-blue-accent"
                          : "border-cpc-tile-border bg-white text-cpc-heading-soft hover:border-cpc-blue-accent/40",
                      )}
                    >
                      {selected && <Check className="h-3 w-3" aria-hidden />}
                      {program}
                    </button>
                  );
                })}
              </div>
              <p className="mt-1 font-poppins text-[11px] text-cpc-heading-soft">
                Leave empty when the event applies to the whole institution.
              </p>
            </div>
          </fieldset>

          {/* Section D */}
          <fieldset className="space-y-2.5 border-t border-cpc-tile-border/60 pt-3.5">
            <legend className="font-poppins text-[11px] font-bold text-cpc-navy-text">
              D. Additional Information
            </legend>

            <div className="grid gap-2.5 sm:grid-cols-2">
              <div>
                <label htmlFor={`${formId}-location`} className={fieldLabelClass}>
                  Location
                </label>
                <input
                  id={`${formId}-location`}
                  value={form.location}
                  onChange={(event) => update("location", event.target.value)}
                  placeholder="e.g. CPC Gymnasium"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor={`${formId}-organizer`} className={fieldLabelClass}>
                  Organizer
                </label>
                <input
                  id={`${formId}-organizer`}
                  value={form.organizer}
                  onChange={(event) => update("organizer", event.target.value)}
                  placeholder="e.g. Office of the Registrar"
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label htmlFor={`${formId}-department`} className={fieldLabelClass}>
                Responsible Office {form.category === "deadline" && <span className="text-rose-500">*</span>}
              </label>
              <input
                id={`${formId}-department`}
                value={form.department}
                onChange={(event) => update("department", event.target.value)}
                aria-invalid={Boolean(errors.department)}
                placeholder="Used by the Academic Deadlines monitor"
                className={cn(
                  inputClass,
                  errors.department && "border-rose-400 ring-2 ring-rose-100",
                )}
              />
              {errors.department && (
                <p className="mt-1 font-poppins text-[11px] text-rose-600">{errors.department}</p>
              )}
            </div>

            <div>
              <label htmlFor={`${formId}-notes`} className={fieldLabelClass}>
                Additional Notes
              </label>
              <textarea
                id={`${formId}-notes`}
                value={form.notes}
                onChange={(event) => update("notes", event.target.value)}
                placeholder="Internal reminders for the calendar team."
                className={textareaClass}
              />
            </div>
          </fieldset>

          {/* Section E */}
          <fieldset className="space-y-2 border-t border-cpc-tile-border/60 pt-3.5">
            <legend className="font-poppins text-[11px] font-bold text-cpc-navy-text">
              E. Publication Settings
            </legend>
            <div className="grid gap-1.5 sm:grid-cols-3">
              {STATUS_OPTIONS.map((option) => {
                const selected = form.status === option.id;
                return (
                  <label
                    key={option.id}
                    className={cn(
                      "flex cursor-pointer items-start gap-2 rounded-lg border p-2.5 transition-colors",
                      selected
                        ? "border-cpc-blue-accent bg-cpc-section-light/60"
                        : "border-cpc-tile-border bg-white hover:bg-cpc-section-light/60",
                    )}
                  >
                    <input
                      type="radio"
                      name={`${formId}-status`}
                      value={option.id}
                      checked={selected}
                      onChange={() => update("status", option.id)}
                      className="mt-0.5 h-3.5 w-3.5 accent-cpc-blue-accent"
                    />
                    <span className="min-w-0">
                      <span className="block font-poppins text-xs font-semibold text-cpc-navy-text">
                        {option.label}
                      </span>
                      <span className="mt-0.5 block font-poppins text-[11px] leading-snug text-cpc-heading-soft">
                        {option.helper}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        </div>

        <div className="sticky bottom-0 flex flex-col-reverse gap-2 border-t border-cpc-tile-border/60 bg-white/95 px-5 py-3 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <p className="font-poppins text-[11px] text-cpc-heading-soft">
            Frontend demo only — nothing is sent to a server.
          </p>
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <button type="button" onClick={onClose} className={secondaryButtonClass()}>
              Cancel
            </button>
            <button type="button" onClick={() => submit("draft")} className={secondaryButtonClass()}>
              Save Draft
            </button>
            <button type="submit" className={primaryButtonClass()}>
              <Send className="h-3.5 w-3.5" aria-hidden />
              Save Event
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
