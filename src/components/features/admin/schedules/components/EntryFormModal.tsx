import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/cn";
import { DAY_END_MIN, formatTimeRange } from "@/utils/scheduleTime";
import { useScheduleAdmin } from "../context/ScheduleAdminContext";
import { entryFormSchema, type EntryFormValues } from "../schema";
import { detectConflictsWithEntry } from "../hooks/useConflicts";
import { findFreeSlots, unitsFor } from "../utils/conflicts";
import { entryFromFormValues, formValuesFromEntry } from "../utils/entryForm";
import type { SectionId } from "../types";
import {
  BTN_NEUTRAL,
  BTN_PRIMARY,
  DISABLED_BASE,
  ERROR_TEXT_BASE,
  FIELD_BASE,
  HINT_TEXT_BASE,
  INVALID_BASE,
  LABEL_BASE,
  SELECT_BASE,
} from "../utils/formStyles";
import { ConflictInlineWarning, type FreeSlot } from "./ConflictInlineWarning";
import { DaysPicker } from "./DaysPicker";
import { TimeRangePicker } from "./TimeRangePicker";

/** A brand-new class opens at 8:00 AM for one hour; the grid's own first hour. */
const DEFAULT_START = 8 * 60;
const DEFAULT_DURATION = 60;

type EntryFormModalProps = {
  open: boolean;
  onClose: () => void;
  /** The row being edited; `null` means a new class. */
  entryId: string | null;
  /** What a grid click or an open filter leaves behind: day, time, sometimes a room. */
  preset?: Partial<EntryFormValues>;
  /** Where the page is looking, used as the default section for a new class. */
  defaultSection: SectionId;
};

/**
 * The entry form (spec §8).
 *
 * WHAT THE FORM STORES. Every choice is an id — `subjectId`, `instructorId`,
 * `roomAId`, `roomBId` — and never the printed string. `entryFromFormValues`
 * looks the string up in master data when it writes the row, which is what
 * lets a rename in master data propagate to every class that already used the
 * old name instead of leaving stale text behind in four sections.
 *
 * THE WARNING IS THE ENGINE, NOT A GUESS. The same pure detector that grades
 * the saved draft runs on the values while they are still in the fields, so a
 * clash is named before the Save button is reachable and disappears the moment
 * the time is fixed. "Find a free slot" walks the week in the grid's own
 * half-hour steps and returns the first five windows where the section, the
 * teacher and both room sets are simultaneously clear.
 *
 * WARNINGS DON'T BLOCK. A teacher pushed past their `maxUnits` is shown as a
 * warning and stays savable, because a ceiling is a planning signal, not a law.
 * Only values the schema rejects — no day, no subject, an end before a start —
 * stop the save.
 */
export function EntryFormModal({
  open,
  onClose,
  entryId,
  preset,
  defaultSection,
}: EntryFormModalProps) {
  const {
    canEditSection,
    draft,
    editDisabledReason,
    entriesBySection,
    master,
    saveEntryValues,
    sectionOfEntry,
    sectionsForRole,
  } = useScheduleAdmin();

  const presetKey = JSON.stringify(preset ?? {});

  const existing = useMemo(
    () =>
      entryId === null
        ? null
        : (entriesBySection(sectionOfEntry(entryId) ?? defaultSection).find(
            (item) => item.id === entryId,
          ) ?? null),
    [defaultSection, entriesBySection, entryId, sectionOfEntry],
  );

  const onlineRoomId = useMemo(
    () => master.rooms.find((room) => room.name.toUpperCase() === "ONLINE")?.id ?? "",
    [master.rooms],
  );

  /* One blank row, then the row being edited, then whatever the caller clicked.
   * Later spreads win, so a grid click can prefill a day on top of an edit. */
  const defaults = useMemo<EntryFormValues>(() => {
    const base: EntryFormValues = {
      section: defaultSection,
      subjectId: "",
      days: ["MON"],
      startMin: DEFAULT_START,
      endMin: DEFAULT_START + DEFAULT_DURATION,
      roomAId: "",
      roomBId: onlineRoomId,
      instructorId: "",
      status: "active",
      note: "",
    };
    const fromEntry =
      existing === null
        ? null
        : formValuesFromEntry(existing, sectionOfEntry(existing.id) ?? defaultSection, master);
    return { ...base, ...fromEntry, ...preset };
    // `presetKey` is the stringified preset, so the parent can pass a literal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultSection, existing, master, onlineRoomId, presetKey, sectionOfEntry]);

  const form = useForm<EntryFormValues>({
    resolver: zodResolver(entryFormSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: defaults,
  });

  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setValue,
    watch,
  } = form;

  const values = watch();
  const [saving, setSaving] = useState(false);
  const addAnother = useRef(false);

  /* The instance is mounted the whole time the page is open, so the fields are
   * rebuilt whenever the modal is pointed at a different class. The seed key is
   * the trigger, not `defaults`: after a save the draft hands back a new object
   * for the same row, and rebuilding from that would wipe the times the
   * "Save & add another" path just advanced. */
  const seedKey = `${open ? "open" : "closed"}|${entryId ?? "new"}|${presetKey}`;
  const seeded = useRef<string | null>(null);
  useEffect(() => {
    if (seeded.current === seedKey) return;
    seeded.current = seedKey;
    reset(defaults);
    // `defaults` is read from the render that changed the seed, by design.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seedKey, reset]);

  /* A suggestion is only honest for the values it was computed against, so the
   * request remembers its own key instead of being cleared by an effect. */
  const valuesKey = `${values.section}|${values.days.join(",")}|${values.startMin}|${values.endMin}|${values.instructorId}|${values.roomAId}|${values.roomBId}`;
  const [slotRequest, setSlotRequest] = useState<string | null>(null);

  const targetSection = (existing === null
    ? values.section
    : (sectionOfEntry(existing.id) ?? values.section)) as SectionId;
  const editable = canEditSection(targetSection);
  const timesLookReal = values.days.length > 0 && values.endMin > values.startMin;

  const conflicts = useMemo(() => {
    if (!open || !timesLookReal) return [];
    const candidate = entryFromFormValues(
      values,
      master,
      values.section,
      entriesBySection(values.section),
      existing?.id,
    );
    return detectConflictsWithEntry(draft.schedules, values.section, candidate);
  }, [draft.schedules, entriesBySection, existing?.id, master, open, timesLookReal, values]);

  const slots = useMemo<FreeSlot[] | null>(() => {
    const key = `${seedKey}|${valuesKey}`;
    if (slotRequest !== key || !timesLookReal) return null;
    return findFreeSlots(
      draft.schedules,
      {
        section: values.section,
        days: values.days,
        durationMin: values.endMin - values.startMin,
        instructorId: values.instructorId === "" ? undefined : values.instructorId,
        roomAId: values.roomAId === "" ? undefined : values.roomAId,
        roomBId: values.roomBId === "" ? undefined : values.roomBId,
        excludeEntryId: existing?.id,
      },
      master.rooms,
      5,
    );
  }, [
    draft.schedules,
    existing?.id,
    master.rooms,
    seedKey,
    slotRequest,
    timesLookReal,
    values.days,
    values.endMin,
    values.instructorId,
    values.roomAId,
    values.roomBId,
    values.section,
    values.startMin,
    valuesKey,
  ]);

  /* Load warning: what the teacher already carries, plus this class. */
  const loadNotice = useMemo(() => {
    if (values.instructorId === "") return null;
    const teacher = master.instructors.find((item) => item.id === values.instructorId);
    if (teacher === undefined) return null;
    const subject = master.subjects.find((item) => item.id === values.subjectId);
    const carried = unitsFor(
      draft.schedules
        .flatMap((schedule) => schedule.entries)
        .filter((entry) => entry.instructorId === teacher.id && entry.id !== existing?.id),
    );
    const projected = carried + (subject?.units ?? 0);
    if (projected <= teacher.maxUnits) return null;
    return { teacher: teacher.displayName, projected, ceiling: teacher.maxUnits };
  }, [
    draft.schedules,
    existing?.id,
    master.instructors,
    master.subjects,
    values.instructorId,
    values.subjectId,
  ]);

  const subjects = master.subjects.filter((item) => item.active);
  const instructors = master.instructors.filter((item) => item.active);
  const rooms = master.rooms.filter((item) => item.active);
  /* Editing never moves a class between sections; the row already belongs to
   * one, and the tab it is open from is the scope the staff member can see. */
  const sectionOptions: SectionId[] = existing === null ? sectionsForRole : [targetSection];

  const submit = handleSubmit(async (next) => {
    setSaving(true);
    await saveEntryValues(next, existing?.id);
    setSaving(false);
    if (!addAnother.current) {
      onClose();
      return;
    }
    addAnother.current = false;
    /* The next class starts where this one finished: the common job here is a
     * subject that meets twice, and a second block at the same hour would only
     * re-create the clash that was just avoided. */
    const duration = next.endMin - next.startMin;
    const start = next.endMin + duration <= DAY_END_MIN ? next.endMin : next.startMin;
    reset({ ...next, startMin: start, endMin: start + duration });
  });

  if (!open) return null;

  const error = (message: string | undefined, id: string) =>
    message === undefined ? null : (
      <p id={id} className={ERROR_TEXT_BASE}>
        {message}
      </p>
    );

  return (
    <Modal open onClose={onClose} labelledBy="entry-form-title" className="sm:max-w-2xl">
      <form onSubmit={(event) => void submit(event)} noValidate className="p-5 sm:p-6">
        <h2 id="entry-form-title" className="font-poppins text-base font-bold text-cpc-navy-text">
          {existing === null ? "Add a class" : `${existing.subjectCode} · ${existing.title}`}
        </h2>
        <p className="mt-1 font-poppins text-xs text-cpc-heading-soft">
          {existing === null
            ? "Times snap to the grid's half hours, and the clash check runs while you edit."
            : `Currently ${formatTimeRange(existing.startMin, existing.endMin)} on ${existing.days.join(", ")}`}
        </p>

        {!editable && (
          <p className="mt-3 rounded-lg border border-cpc-tile-border/70 bg-cpc-section-light px-3 py-2 font-poppins text-xs font-semibold text-cpc-navy-text">
            {editDisabledReason(targetSection) ?? "This class is read-only for your role."}
          </p>
        )}

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="entry-section" className={LABEL_BASE}>
              Section
            </label>
            <select
              id="entry-section"
              {...register("section")}
              disabled={!editable || existing !== null}
              aria-describedby={errors.section ? "entry-section-error" : undefined}
              className={cn(SELECT_BASE, DISABLED_BASE, errors.section && INVALID_BASE)}
            >
              {sectionOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {error(errors.section?.message, "entry-section-error")}
          </div>

          <div>
            <label htmlFor="entry-subject" className={LABEL_BASE}>
              Subject
            </label>
            <select
              id="entry-subject"
              {...register("subjectId")}
              disabled={!editable}
              aria-describedby={errors.subjectId ? "entry-subject-error" : undefined}
              className={cn(SELECT_BASE, DISABLED_BASE, errors.subjectId && INVALID_BASE)}
            >
              <option value="">Choose a subject</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.code} — {subject.title} ({subject.units} units)
                </option>
              ))}
            </select>
            {error(errors.subjectId?.message, "entry-subject-error")}
          </div>

          <div className="sm:col-span-2">
            <span className={LABEL_BASE} id="entry-days-label">
              Meets on
            </span>
            <DaysPicker
              value={values.days}
              disabled={!editable}
              labelledBy="entry-days-label"
              describedBy={errors.days?.message ? "entry-days-error" : undefined}
              invalid={errors.days !== undefined}
              onChange={(days) => setValue("days", days, { shouldValidate: true, shouldDirty: true })}
            />
            {error(errors.days?.message, "entry-days-error")}
          </div>

          <div className="sm:col-span-2">
            <TimeRangePicker
              startMin={values.startMin}
              endMin={values.endMin}
              disabled={!editable}
              startId="entry-start"
              endId="entry-end"
              startInvalid={errors.startMin !== undefined}
              endInvalid={errors.endMin !== undefined}
              describedBy={
                (errors.startMin?.message ?? errors.endMin?.message) === undefined
                  ? undefined
                  : "entry-time-error"
              }
              onChange={(next) => {
                setValue("startMin", next.startMin, { shouldValidate: true, shouldDirty: true });
                setValue("endMin", next.endMin, { shouldValidate: true, shouldDirty: true });
              }}
            />
            {error(errors.startMin?.message ?? errors.endMin?.message, "entry-time-error")}
          </div>

          <div>
            <label htmlFor="entry-room-a" className={LABEL_BASE}>
              Room · Set A
            </label>
            <select
              id="entry-room-a"
              {...register("roomAId")}
              disabled={!editable}
              aria-describedby={errors.roomAId ? "entry-room-a-error" : undefined}
              className={cn(SELECT_BASE, DISABLED_BASE, errors.roomAId && INVALID_BASE)}
            >
              <option value="">Choose a room</option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name}
                  {room.type === "online" ? " — online" : ""}
                </option>
              ))}
            </select>
            {error(errors.roomAId?.message, "entry-room-a-error")}
          </div>

          <div>
            <label htmlFor="entry-room-b" className={LABEL_BASE}>
              Room · Set B
            </label>
            <select
              id="entry-room-b"
              {...register("roomBId")}
              disabled={!editable}
              aria-describedby={errors.roomBId ? "entry-room-b-error" : undefined}
              className={cn(SELECT_BASE, DISABLED_BASE, errors.roomBId && INVALID_BASE)}
            >
              <option value="">Choose a room</option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name}
                  {room.type === "online" ? " — online" : ""}
                </option>
              ))}
            </select>
            {error(errors.roomBId?.message, "entry-room-b-error")}
          </div>

          <div>
            <label htmlFor="entry-instructor" className={LABEL_BASE}>
              Instructor
            </label>
            <select
              id="entry-instructor"
              {...register("instructorId")}
              disabled={!editable}
              aria-describedby={errors.instructorId ? "entry-instructor-error" : undefined}
              className={cn(SELECT_BASE, DISABLED_BASE, errors.instructorId && INVALID_BASE)}
            >
              <option value="">Choose an instructor</option>
              {instructors.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.displayName}
                </option>
              ))}
            </select>
            {error(errors.instructorId?.message, "entry-instructor-error")}
          </div>

          <div>
            <label htmlFor="entry-status" className={LABEL_BASE}>
              Status
            </label>
            <select
              id="entry-status"
              {...register("status")}
              disabled={!editable}
              className={cn(SELECT_BASE, DISABLED_BASE)}
            >
              <option value="active">Active</option>
              <option value="not_active">Not active</option>
            </select>
            <p className={HINT_TEXT_BASE}>
              A class marked not active keeps its row but frees its teacher and its room.
            </p>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="entry-note" className={LABEL_BASE}>
              Note
            </label>
            <textarea
              id="entry-note"
              rows={2}
              {...register("note")}
              disabled={!editable}
              placeholder="Optional — room change, borrowed teacher, why this block exists"
              aria-describedby={errors.note ? "entry-note-error" : "entry-note-hint"}
              className={cn(FIELD_BASE, "resize-y", DISABLED_BASE, errors.note && INVALID_BASE)}
            />
            <p id="entry-note-hint" className={HINT_TEXT_BASE}>
              Kept on the row for staff; students never see it.
            </p>
            {error(errors.note?.message, "entry-note-error")}
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <ConflictInlineWarning
            conflicts={conflicts}
            slots={slots}
            onFindSlots={() => setSlotRequest(`${seedKey}|${valuesKey}`)}
            onApplySlot={(slot) => {
              setValue("days", [slot.day], { shouldValidate: true, shouldDirty: true });
              setValue("startMin", slot.startMin, { shouldValidate: true, shouldDirty: true });
              setValue("endMin", slot.endMin, { shouldValidate: true, shouldDirty: true });
            }}
            disabled={!editable}
            ready={timesLookReal}
          />

          {loadNotice && (
            <Badge tone="warning">
              <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden />
              {loadNotice.teacher} reaches {loadNotice.projected} units, above their{" "}
              {loadNotice.ceiling}-unit ceiling. Saving is allowed; the load card will show it.
            </Badge>
          )}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
          <button type="button" onClick={onClose} className={BTN_NEUTRAL}>
            {editable ? "Cancel" : "Close"}
          </button>
          {editable && (
            <>
              <button
                type="button"
                disabled={saving}
                onClick={() => {
                  addAnother.current = true;
                  void submit();
                }}
                className={BTN_NEUTRAL}
              >
                Save &amp; add another
              </button>
              <button type="submit" disabled={saving} className={BTN_PRIMARY}>
                {saving ? "Saving…" : existing === null ? "Add class" : "Save changes"}
              </button>
            </>
          )}
        </div>
      </form>
    </Modal>
  );
}
