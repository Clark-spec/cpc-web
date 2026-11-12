import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { AlertTriangle, ArrowDown, ArrowUp, Pencil, SearchX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/common/display/EmptyState";
import { TableSkeleton } from "@/components/common/display/Skeleton";
import { ConfirmDialog } from "@/components/common/feedback/ConfirmDialog";
import { cn } from "@/lib/cn";
import type { EntryStatus, ScheduleEntry, SectionId } from "@/types/schedule";
import type { EntryPatch } from "@/types/scheduleAdmin";
import { daysToLabel, formatTime } from "@/lib/scheduleTime";
import { getSubjectColor } from "@/lib/scheduleColors";
import type { VisibleEntry } from "@/components/features/admin/schedules/ScheduleAdminContext";
import { useScheduleAdmin } from "@/components/features/admin/schedules/ScheduleAdminContext";
import { unitsFor } from "@/components/features/admin/schedules/conflicts";
import { BTN_NEUTRAL, BTN_PRIMARY, BTN_ROSE, SELECT_BASE } from "@/components/features/admin/schedules/formStyles";

type ColumnId =
  | "section"
  | "subjectCode"
  | "title"
  | "startMin"
  | "units"
  | "instructor"
  | "status";

const COLUMNS: {
  id: ColumnId | null;
  label: string;
  sortable: boolean;
  className?: string;
  /** The two columns whose header is a control, not a label. */
  slot?: "select";
}[] = [
  {
    id: null,
    label: "Select",
    sortable: false,
    className: "w-9 pr-0",
    slot: "select",
  },
  { id: "section", label: "Section", sortable: true },
  { id: "subjectCode", label: "Code", sortable: true },
  { id: "title", label: "Subject", sortable: true, className: "min-w-[14rem]" },
  { id: null, label: "Days", sortable: false },
  { id: "startMin", label: "Start", sortable: true },
  { id: null, label: "End", sortable: false },
  { id: null, label: "Room A", sortable: false },
  { id: null, label: "Room B", sortable: false },
  { id: "units", label: "Units", sortable: true },
  { id: "instructor", label: "Instructor", sortable: true },
  { id: "status", label: "Status", sortable: true },
  { id: null, label: "Actions", sortable: false, className: "w-24" },
];

/** The overload ceiling and the underload floor the registrar is warned about. */
const MAX_UNITS = 27;
const MIN_UNITS = 12;

/** The four fields quick enough to change without opening the form. */
type QuickField = "roomA" | "roomB" | "instructor" | "status";

const QUICK_LABELS: Record<QuickField, string> = {
  roomA: "Room A",
  roomB: "Room B",
  instructor: "Instructor",
  status: "Status",
};

const STATUS_OPTIONS: { value: string; text: string }[] = [
  { value: "active", text: "Active" },
  { value: "not_active", text: "Not Active" },
];

function compareRows(a: VisibleEntry, b: VisibleEntry, column: ColumnId): number {
  switch (column) {
    case "section":
      return a.section.localeCompare(b.section);
    case "subjectCode":
      return a.entry.subjectCode.localeCompare(b.entry.subjectCode);
    case "title":
      return a.entry.title.localeCompare(b.entry.title);
    case "startMin":
      return a.entry.startMin - b.entry.startMin;
    case "units":
      return a.entry.units - b.entry.units;
    case "instructor":
      return a.entry.instructor.localeCompare(b.entry.instructor);
    case "status":
      return a.entry.status.localeCompare(b.entry.status);
    default:
      return 0;
  }
}

/** One room cell: `ONLINE` and an empty set read as text, not as a blank box. */
function RoomCell({ value }: { value: string }) {
  const name = value.trim();
  return (
    <span className="font-poppins text-xs text-cpc-navy-text">
      {name === "" ? <span className="text-cpc-heading-soft">—</span> : name}
    </span>
  );
}

/** What the row prints for this field — the same words the select offers. */
function printedValue(entry: ScheduleEntry, field: QuickField): string {
  switch (field) {
    case "status":
      return entry.status === "active" ? "Active" : "Not Active";
    case "instructor":
      return entry.instructor;
    case "roomA":
      return entry.roomSetA;
    case "roomB":
      return entry.roomSetB;
  }
}

type QuickCellProps = {
  field: QuickField;
  entryId: string;
  /** Plain text of what is showing, so the control can name it out loud. */
  current: string;
  display: ReactNode;
  editing: boolean;
  editable: boolean;
  reason: string;
  options: { value: string; text: string }[];
  onStart: () => void;
  onCancel: () => void;
  onCommit: (value: string) => void;
};

/**
 * One inline quick-edit cell: a button until it is clicked, a select for as
 * long as it takes to choose, and nothing in between opens a modal. Escape and
 * blur both cancel, so a cell opened by mistake cannot write anything.
 */
function QuickCell({
  field,
  entryId,
  current,
  display,
  editing,
  editable,
  reason,
  options,
  onStart,
  onCancel,
  onCommit,
}: QuickCellProps) {
  const triggerId = `quick-${field}-${entryId}`;
  const label = QUICK_LABELS[field];

  if (!editable) {
    return (
      <span className="inline-flex items-center gap-1.5" title={reason === "" ? undefined : reason}>
        {display}
        {reason !== "" && <span className="sr-only">{reason}</span>}
      </span>
    );
  }

  if (editing) {
    return (
      <select
        id={triggerId}
        autoFocus
        value=""
        aria-label={`${label}: currently ${current}. Choose the new value. Press Escape to cancel.`}
        className={cn(SELECT_BASE, "w-auto min-w-[7rem] px-2 py-1.5 text-[11px]")}
        onChange={(event) => {
          if (event.target.value !== "") onCommit(event.target.value);
        }}
        onBlur={onCancel}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            onCancel();
          }
        }}
      >
        <option value="" disabled>
          Choose…
        </option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.text}
          </option>
        ))}
      </select>
    );
  }

  return (
    <button
      type="button"
      id={triggerId}
      onClick={onStart}
      title={`Quick edit: ${label}`}
      aria-label={`${label}: ${current}. Change ${label}.`}
      className="inline-flex min-w-0 cursor-pointer items-center gap-1.5 rounded-lg border border-transparent px-1.5 py-1 text-left transition-colors hover:border-cpc-tile-border hover:bg-cpc-section-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
    >
      {display}
      <Pencil className="h-3 w-3 shrink-0 text-cpc-muted-blue/70" aria-hidden />
    </button>
  );
}

type ScheduleTableProps = {
  /** Opens the entry form for one row; a read-only role opens it in view mode. */
  onEdit: (entryId: string) => void;
};

/**
 * The working list (spec §5).
 *
 * (1) Rows come from `visibleEntries`, which is already section-scoped, role-
 * scoped and filtered in the context — this component only decides order and
 * presentation, so the table and the grid can never disagree about what is on
 * screen.
 * (2) A class marked `not_active` stays in the list with its own badge and a
 * dashed cell. It is excluded from conflict detection because it does not
 * occupy the calendar, but hiding it would lose the record of why the slot is
 * empty.
 * (3) The four fields that are usually the whole job — room A, room B, teacher,
 * status — change inline. Time, days and subject move the class around the
 * week, so they open the form instead, where the live conflict check can see
 * them before anything is written.
 * (4) A bulk action writes through the same service call as a single edit, with
 * one snapshot per batch, so Undo reverses the whole batch or none of it.
 */
export function ScheduleTable({ onEdit }: ScheduleTableProps) {
  const {
    activeFilterCount,
    bulkDelete,
    bulkUpdate,
    canEditSection,
    clearFilters,
    editDisabledReason,
    loading,
    master,
    quickEdit,
    section,
    visibleEntries,
  } = useScheduleAdmin();
  const [sort, setSort] = useState<{ column: ColumnId; direction: "asc" | "desc" }>({
    column: "startMin",
    direction: "asc",
  });

  const rows = useMemo(() => {
    const copy = [...visibleEntries];
    copy.sort((a, b) => {
      const result = compareRows(a, b, sort.column);
      if (result !== 0) return sort.direction === "asc" ? result : -result;
      return a.entry.id.localeCompare(b.entry.id);
    });
    return copy;
  }, [sort, visibleEntries]);

  const [selected, setSelected] = useState<string[]>([]);
  const [quick, setQuick] = useState<{ entryId: string; field: QuickField } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  /* A row can vanish under a selection — a filter change, a delete in another
   * tab — so the live selection reads off the screen, not off the stored ids. */
  const selectedIds = useMemo(() => {
    const onScreen = new Set(rows.map((row) => row.entry.id));
    return selected.filter((id) => onScreen.has(id));
  }, [rows, selected]);

  const allSelected = selectedIds.length > 0 && selectedIds.length === rows.length;
  const someSelected = selectedIds.length > 0 && !allSelected;

  /* A bulk write is aimed at one section — the service maps inside a single
   * section's entries — so the "All sections" tab can read but never batch. */
  const bulkLocked = section === "all";
  const bulkReason = bulkLocked ? "Open one section tab to bulk-edit." : "";

  const roomOptions = useMemo(
    () =>
      master.rooms
        .filter((room) => room.active)
        .map((room) => ({ value: room.id, text: room.name })),
    [master.rooms],
  );

  const instructorOptions = useMemo(
    () =>
      master.instructors
        .filter((instructor) => instructor.active)
        .map((instructor) => ({
          value: instructor.id,
          text: `${instructor.displayName} — ${instructor.fullName}`,
        })),
    [master.instructors],
  );

  /* The draft stores the id and the printed name together, because the name is
   * what the student page renders and the id is what a later rename follows. */
  function patchFor(field: QuickField, value: string): EntryPatch {
    switch (field) {
      case "roomA":
        return {
          roomAId: value,
          roomSetA: master.rooms.find((room) => room.id === value)?.name ?? "",
        };
      case "roomB":
        return {
          roomBId: value,
          roomSetB: master.rooms.find((room) => room.id === value)?.name ?? "",
        };
      case "instructor":
        return {
          instructorId: value,
          instructor:
            master.instructors.find((instructor) => instructor.id === value)?.displayName ?? "",
        };
      case "status":
        return { status: value as EntryStatus };
    }
  }

  function nameFor(field: QuickField, value: string): string {
    if (field === "status") return value === "active" ? "Active" : "Not Active";
    if (field === "instructor") {
      return (
        master.instructors.find((instructor) => instructor.id === value)?.displayName ??
        "the new teacher"
      );
    }
    return master.rooms.find((room) => room.id === value)?.name ?? "the new room";
  }

  function toggleSelected(entryId: string) {
    setSelected((current) =>
      current.includes(entryId) ? current.filter((id) => id !== entryId) : [...current, entryId],
    );
  }

  function toggleAll() {
    setSelected(allSelected ? [] : rows.map((row) => row.entry.id));
  }

  /** The select is about to unmount; hand focus back to the cell it opened from. */
  function closeQuick(entryId: string, field: QuickField) {
    setQuick(null);
    window.setTimeout(() => document.getElementById(`quick-${field}-${entryId}`)?.focus(), 0);
  }

  async function commitQuick(
    entry: ScheduleEntry,
    rowSection: SectionId,
    field: QuickField,
    value: string,
  ) {
    setQuick(null);
    if (nameFor(field, value) === printedValue(entry, field)) return;
    await quickEdit(
      entry,
      rowSection,
      patchFor(field, value),
      `${entry.subjectCode} → ${nameFor(field, value)}`,
    );
  }

  async function runBulk(patch: EntryPatch, label: string) {
    if (bulkLocked || selectedIds.length === 0) return;
    setBusy(true);
    try {
      await bulkUpdate(selectedIds, patch, section, label);
      setSelected([]);
    } finally {
      setBusy(false);
    }
  }

  async function deleteSelected() {
    if (bulkLocked) return;
    setBusy(true);
    try {
      await bulkDelete(selectedIds, section);
      setSelected([]);
      setConfirmDelete(false);
    } finally {
      setBusy(false);
    }
  }

  /* The unit warning belongs to one section; "All sections" would only dilute it. */
  const unitNotice = useMemo(() => {
    if (section === "all" || loading) return null;
    const total = unitsFor(rows.map((row) => row.entry));
    if (total > MAX_UNITS) {
      return {
        tone: "danger" as const,
        text: `${section} totals ${total} units — above the ${MAX_UNITS}-unit ceiling.`,
      };
    }
    if (total < MIN_UNITS) {
      return {
        tone: "warning" as const,
        text: `${section} totals ${total} units — below the ${MIN_UNITS}-unit minimum load.`,
      };
    }
    return { tone: "info" as const, text: `${section} totals ${total} units.` };
  }, [loading, rows, section]);

  if (loading) {
    return (
      <section
        aria-label="Schedule entries"
        className="overflow-hidden rounded-2xl border border-white/80 bg-white/85 shadow-[0_8px_30px_rgb(15,36,104,0.04)] backdrop-blur-md"
      >
        <div className="border-b border-cpc-input-border/60 bg-gradient-to-r from-cpc-section-light/70 to-white/60 px-4 py-3">
          <p className="font-poppins text-xs font-semibold text-cpc-heading-soft">
            Loading schedule…
          </p>
        </div>
        <TableSkeleton rows={8} />
      </section>
    );
  }

  if (rows.length === 0) {
    return (
      <section
        aria-label="Schedule entries"
        className="overflow-hidden rounded-2xl border border-white/80 bg-white/85 shadow-[0_8px_30px_rgb(15,36,104,0.04)] backdrop-blur-md"
      >
        <EmptyState
          icon={SearchX}
          title="No classes match these filters"
          description={
            activeFilterCount > 0
              ? "Widen the filters to see the rest of the section."
              : "This section has no entries yet. Add a class to start building the timetable."
          }
          action={
            activeFilterCount > 0 ? (
              <button
                type="button"
                onClick={clearFilters}
                className="cpc-btn cpc-btn-secondary cpc-btn-sm mt-1"
              >
                Clear filters
              </button>
            ) : undefined
          }
        />
      </section>
    );
  }

  const headerCell = (column: (typeof COLUMNS)[number]) => {
    const active = column.id !== null && sort.column === column.id;
    const Arrow = active && sort.direction === "desc" ? ArrowDown : ArrowUp;
    /* Only the two columns this table adds on top of the published layout carry a
     * width of their own, so only they compose it with the shared header class. */
    const sizedClass = cn(
      "px-3 py-2.5 text-left font-poppins text-[11px] font-bold tracking-[0.08em] text-cpc-blue-accent uppercase whitespace-nowrap",
      column.className,
    );

    if (column.slot === "select") {
      return (
        <th key={column.label} scope="col" className={sizedClass}>
          <span className="sr-only">Select every class shown</span>
          <input
            id="schedule-select-all"
            type="checkbox"
            checked={allSelected}
            ref={(element) => {
              if (element) element.indeterminate = someSelected;
            }}
            disabled={bulkLocked}
            title={bulkLocked ? bulkReason : undefined}
            onChange={toggleAll}
            aria-label="Select every class shown"
            className="h-3.5 w-3.5 cursor-pointer accent-cpc-blue-accent disabled:cursor-not-allowed"
          />
        </th>
      );
    }

    if (column.className !== undefined) {
      return (
        <th key={column.label} scope="col" className={sizedClass}>
          {column.label}
        </th>
      );
    }

    return (
      <th
        key={column.label}
        scope="col"
        aria-sort={
          active ? (sort.direction === "asc" ? "ascending" : "descending") : undefined
        }
        className="px-3 py-2.5 text-left font-poppins text-[11px] font-bold tracking-[0.08em] text-cpc-blue-accent uppercase whitespace-nowrap"
      >
        {column.sortable && column.id !== null ? (
          <button
            type="button"
            onClick={() =>
              setSort((current) =>
                current.column === column.id
                  ? { column: current.column, direction: current.direction === "asc" ? "desc" : "asc" }
                  : { column: column.id as ColumnId, direction: "asc" },
              )
            }
            className="inline-flex cursor-pointer items-center gap-1 rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
          >
            {column.label}
            <Arrow
              className={cn("h-3 w-3 shrink-0", active ? "text-cpc-blue-accent" : "text-cpc-muted-blue/50")}
              aria-hidden
            />
          </button>
        ) : (
          column.label
        )}
      </th>
    );
  };

  const quickCell = (
    row: VisibleEntry,
    field: QuickField,
    display: ReactNode,
    options: { value: string; text: string }[],
  ) => {
    const printed = printedValue(row.entry, field);
    return (
      <QuickCell
        field={field}
        entryId={row.entry.id}
        current={printed === "" ? "empty" : printed}
        display={display}
        editing={quick !== null && quick.entryId === row.entry.id && quick.field === field}
        editable={canEditSection(row.section)}
        reason={editDisabledReason(row.section) ?? ""}
        options={options}
        onStart={() => setQuick({ entryId: row.entry.id, field })}
        onCancel={() => closeQuick(row.entry.id, field)}
        onCommit={(value) => void commitQuick(row.entry, row.section, field, value)}
      />
    );
  };

  return (
    <section
      aria-label="Schedule entries"
      className="overflow-hidden rounded-2xl border border-white/80 bg-white/85 shadow-[0_8px_30px_rgb(15,36,104,0.04)] backdrop-blur-md"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cpc-input-border/60 bg-gradient-to-r from-cpc-section-light/70 to-white/60 px-4 py-3">
        <h2 className="font-poppins text-sm font-bold text-cpc-navy-text">
          {section === "all" ? "All sections" : section}
          <span className="ml-2 font-poppins text-xs font-semibold text-cpc-heading-soft">
            {rows.length} {rows.length === 1 ? "class" : "classes"}
          </span>
        </h2>
        {unitNotice && (
          <span aria-live="polite">
            <Badge tone={unitNotice.tone}>
              {unitNotice.tone !== "info" && <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden />}
              {unitNotice.text}
            </Badge>
          </span>
        )}
      </div>

      {/* The bulk row only exists while something is selected, so the keyboard
          never tabs through controls that currently do nothing. */}
      {selectedIds.length > 0 && (
        <div
          role="region"
          aria-label="Bulk actions"
          aria-live="polite"
          className="flex flex-wrap items-center gap-2 border-b border-cpc-input-border bg-cpc-section-light/70 px-4 py-2.5"
        >
          <p className="mr-1 font-poppins text-xs font-semibold text-cpc-navy-text">
            {selectedIds.length} of {rows.length} selected
            {bulkLocked && (
              <span className="ml-2 block font-poppins text-[11px] font-normal text-rose-700">
                {bulkReason}
              </span>
            )}
          </p>

          <button
            type="button"
            disabled={bulkLocked || busy}
            title={bulkLocked ? bulkReason : undefined}
            onClick={() => void runBulk({ status: "active" }, `${selectedIds.length} classes set to Active`)}
            className={BTN_NEUTRAL}
          >
            Set active
          </button>
          <button
            type="button"
            disabled={bulkLocked || busy}
            title={bulkLocked ? bulkReason : undefined}
            onClick={() =>
              void runBulk({ status: "not_active" }, `${selectedIds.length} classes set to Not Active`)
            }
            className={BTN_NEUTRAL}
          >
            Set not active
          </button>

          <select
            id="bulk-instructor"
            value=""
            disabled={bulkLocked || busy}
            title={bulkLocked ? bulkReason : undefined}
            aria-label="Reassign the selected classes to another instructor"
            onChange={(event) => {
              const value = event.target.value;
              if (value === "" || bulkLocked) return;
              void runBulk(
                patchFor("instructor", value),
                `${selectedIds.length} classes reassigned to ${nameFor("instructor", value)}`,
              );
            }}
            className={cn(SELECT_BASE, "w-auto max-w-[13rem] px-2 py-1.5 text-[11px]")}
          >
            <option value="">Reassign teacher…</option>
            {instructorOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.text}
              </option>
            ))}
          </select>

          <select
            id="bulk-room-a"
            value=""
            disabled={bulkLocked || busy}
            title={bulkLocked ? bulkReason : undefined}
            aria-label="Move the selected classes to another room in Set A"
            onChange={(event) => {
              const value = event.target.value;
              if (value === "" || bulkLocked) return;
              void runBulk(
                patchFor("roomA", value),
                `${selectedIds.length} classes moved to ${nameFor("roomA", value)}`,
              );
            }}
            className={cn(SELECT_BASE, "w-auto max-w-[13rem] px-2 py-1.5 text-[11px]")}
          >
            <option value="">Move to room…</option>
            {roomOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.text}
              </option>
            ))}
          </select>

          <button
            type="button"
            disabled={bulkLocked || busy}
            title={bulkLocked ? bulkReason : undefined}
            onClick={() => setConfirmDelete(true)}
            className={BTN_ROSE}
          >
            Delete selected
          </button>
          <button type="button" onClick={() => setSelected([])} className={BTN_NEUTRAL}>
            Clear selection
          </button>
        </div>
      )}

      {/* Desktop: one row per class. */}
      <div className="hidden md:block">
        <table className="w-full border-collapse">
          <caption className="sr-only">
            Scheduled classes for {section === "all" ? "all sections" : section}, sortable by
            section, code, subject, start time, units, instructor and status.
          </caption>
          <thead className="bg-cpc-section-light">
            <tr>{COLUMNS.map(headerCell)}</tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const { entry, section: rowSection, conflictCount } = row;
              const color = getSubjectColor(entry.colorKey);
              const inactive = entry.status === "not_active";
              const editable = canEditSection(rowSection);
              const checked = selectedIds.includes(entry.id);
              return (
                <tr
                  key={entry.id}
                  className="border-b border-cpc-input-border/70 last:border-b-0 even:bg-cpc-section-light/30"
                >
                  <td className="px-3 py-2.5">
                    <input
                      id={`select-${entry.id}`}
                      type="checkbox"
                      checked={checked}
                      disabled={bulkLocked}
                      title={bulkLocked ? bulkReason : undefined}
                      onChange={() => toggleSelected(entry.id)}
                      aria-label={`Select ${entry.subjectCode} for bulk actions`}
                      className="h-3.5 w-3.5 cursor-pointer accent-cpc-blue-accent disabled:cursor-not-allowed"
                    />
                  </td>
                  <td className="px-3 py-2.5 font-poppins text-xs font-semibold text-cpc-navy-text whitespace-nowrap">
                    {rowSection}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <span className="inline-flex items-center gap-2">
                      <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", color.dot)} aria-hidden />
                      <button
                        type="button"
                        onClick={() => onEdit(entry.id)}
                        aria-label={`Open ${entry.subjectCode} for editing`}
                        className="cursor-pointer rounded underline-offset-4 transition-colors hover:text-cpc-blue-accent hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
                      >
                        <span className="font-poppins text-xs font-semibold text-cpc-navy-text">
                          {entry.subjectCode}
                        </span>
                      </button>
                    </span>
                  </td>
                  <td className="px-3 py-2.5 font-poppins text-xs text-cpc-navy-text">{entry.title}</td>
                  <td className="px-3 py-2.5 font-poppins text-xs text-cpc-navy-text tabular-nums whitespace-nowrap">
                    {daysToLabel(entry.days)}
                  </td>
                  <td className="px-3 py-2.5 font-poppins text-xs text-cpc-navy-text tabular-nums whitespace-nowrap">
                    {formatTime(entry.startMin)}
                  </td>
                  <td className="px-3 py-2.5 font-poppins text-xs text-cpc-navy-text tabular-nums whitespace-nowrap">
                    {formatTime(entry.endMin)}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    {quickCell(row, "roomA", <RoomCell value={entry.roomSetA} />, roomOptions)}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    {quickCell(row, "roomB", <RoomCell value={entry.roomSetB} />, roomOptions)}
                  </td>
                  <td className="px-3 py-2.5 font-poppins text-xs text-cpc-navy-text tabular-nums">
                    {entry.units}
                  </td>
                  <td className="px-3 py-2.5 font-poppins text-xs text-cpc-navy-text whitespace-nowrap">
                    {quickCell(row, "instructor", entry.instructor, instructorOptions)}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    {quickCell(
                      row,
                      "status",
                      <span className="inline-flex items-center gap-1.5">
                        <Badge tone={inactive ? "neutral" : "success"}>
                          {inactive ? "Not active" : "Active"}
                        </Badge>
                        {conflictCount > 0 && (
                          <Badge tone="danger">
                            <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden />
                            {conflictCount} clash{conflictCount === 1 ? "" : "es"}
                          </Badge>
                        )}
                      </span>,
                      STATUS_OPTIONS,
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => onEdit(entry.id)}
                      aria-label={`${editable ? "Edit" : "View"} ${entry.subjectCode} on ${rowSection}`}
                      className={BTN_NEUTRAL}
                    >
                      <Pencil className="h-3 w-3 shrink-0" aria-hidden />
                      {editable ? "Edit" : "View"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile: the same rows as stacked cards, never a horizontal scroll. */}
      <ul className="space-y-3 p-4 md:hidden">
        {rows.map(({ entry, section: rowSection, conflictCount }) => {
          const color = getSubjectColor(entry.colorKey);
          const inactive = entry.status === "not_active";
          const editable = canEditSection(rowSection);
          const checked = selectedIds.includes(entry.id);
          return (
            <li
              key={entry.id}
              className={cn(
                "rounded-xl border border-cpc-input-border/70 bg-white/95 p-3.5 shadow-2xs",
                inactive && "border-dashed",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="inline-flex items-center gap-2 font-poppins text-xs font-bold text-cpc-navy-text">
                    <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", color.dot)} aria-hidden />
                    <span className="truncate">{entry.subjectCode}</span>
                  </p>
                  <p className="mt-1 font-poppins text-sm leading-snug font-semibold text-cpc-navy-text">
                    {entry.title}
                  </p>
                </div>
                <Badge tone={inactive ? "neutral" : "success"}>
                  {inactive ? "Not active" : "Active"}
                </Badge>
              </div>

              <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 font-poppins text-xs">
                <div className="flex gap-1.5">
                  <dt className="text-cpc-heading-soft">Section</dt>
                  <dd className="font-semibold text-cpc-navy-text">{rowSection}</dd>
                </div>
                <div className="flex gap-1.5">
                  <dt className="text-cpc-heading-soft">Days</dt>
                  <dd className="font-semibold text-cpc-navy-text tabular-nums">
                    {daysToLabel(entry.days)}
                  </dd>
                </div>
                <div className="col-span-2 flex gap-1.5">
                  <dt className="text-cpc-heading-soft">Time</dt>
                  <dd className="font-semibold text-cpc-navy-text tabular-nums">
                    {formatTime(entry.startMin)} – {formatTime(entry.endMin)}
                  </dd>
                </div>
                <div className="flex gap-1.5">
                  <dt className="text-cpc-heading-soft">Room A</dt>
                  <dd className="font-semibold text-cpc-navy-text">{entry.roomSetA || "—"}</dd>
                </div>
                <div className="flex gap-1.5">
                  <dt className="text-cpc-heading-soft">Room B</dt>
                  <dd className="font-semibold text-cpc-navy-text">{entry.roomSetB || "—"}</dd>
                </div>
                <div className="flex gap-1.5">
                  <dt className="text-cpc-heading-soft">Units</dt>
                  <dd className="font-semibold text-cpc-navy-text tabular-nums">{entry.units}</dd>
                </div>
                <div className="flex gap-1.5">
                  <dt className="text-cpc-heading-soft">Teacher</dt>
                  <dd className="min-w-0 truncate font-semibold text-cpc-navy-text">
                    {entry.instructor}
                  </dd>
                </div>
              </dl>

              {conflictCount > 0 && (
                <p className="mt-3 font-poppins text-xs font-semibold text-amber-700">
                  {conflictCount} schedule clash{conflictCount === 1 ? "" : "es"} — open the
                  conflict panel to see what overlaps.
                </p>
              )}

              {/* No inline selects here: on a phone a chip-sized tap target is
                  the only honest quick edit, so the form carries the change. */}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => onEdit(entry.id)}
                  aria-label={`${editable ? "Edit" : "View"} ${entry.subjectCode} on ${rowSection}`}
                  className={BTN_PRIMARY}
                >
                  <Pencil className="h-3 w-3 shrink-0" aria-hidden />
                  {editable ? "Edit" : "View"}
                </button>
                <button
                  type="button"
                  aria-pressed={checked}
                  disabled={bulkLocked}
                  title={bulkLocked ? bulkReason : undefined}
                  onClick={() => toggleSelected(entry.id)}
                  className={BTN_NEUTRAL}
                >
                  {checked ? "Deselect" : "Select"}
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <ConfirmDialog
        id="schedule-bulk-delete-title"
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => void deleteSelected()}
        title={`Delete ${selectedIds.length} ${selectedIds.length === 1 ? "class" : "classes"}?`}
        description={
          <>
            These leave {section} in the draft. Students keep seeing the published schedule
            until someone publishes, and one Undo brings the whole batch back.
          </>
        }
        confirmLabel="Delete"
        danger
        busy={busy}
      />
    </section>
  );
}
