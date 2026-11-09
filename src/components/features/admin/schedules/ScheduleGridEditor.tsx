import { useMemo, useRef, useState } from "react";
import type {
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
} from "react";
import { CalendarOff } from "lucide-react";
import { cn } from "@/lib/cn";
import { EmptyState } from "@/components/common/display/EmptyState";
import { CardSkeleton } from "@/components/common/display/Skeleton";
import type { DayCode, ScheduleEntry, SectionId } from "@/types/schedule";
import { getEventGeometry, layoutEvents, type PositionedEvent } from "@/lib/layoutEvents";
import {
  DAY_CODES,
  DAY_END_MIN,
  DAY_FULL,
  DAY_INDEX,
  DAY_START_MIN,
  HOUR_HEIGHT,
  formatHourLabel,
  formatTimeRange,
} from "@/lib/scheduleTime";
import { useScheduleAdmin } from "@/components/features/admin/schedules/ScheduleAdminContext";
import { detectConflictsWithEntry } from "@/components/features/admin/schedules/useConflicts";
import { entriesForInstructor, entriesForRoom, snapToStep } from "@/components/features/admin/schedules/conflicts";
import { GridEventBlock } from "@/components/features/admin/schedules/GridEventBlock";

/** Shortest class the editor accepts, so a resize can never erase a block. */
const MIN_DURATION_MIN = 30;

/** How much of the day a click-to-create reserves, so the prefill ends before 8 PM. */
const NEW_CLASS_MIN = 60;

type DragMode = "move" | "resize";

type DragState = {
  entryId: string;
  section: SectionId;
  mode: DragMode;
  /** The column the drag started in — see `swapDay`. */
  originDay: DayCode;
  /** Where the pointer grabbed the block, so it does not jump under the cursor. */
  grabOffsetMin: number;
  day: DayCode;
  startMin: number;
  endMin: number;
};

/**
 * A class meets on a SET of days at one time, so pulling its Tuesday block to
 * Friday moves Tuesday: a Tue–Thu class dragged from Tuesday to Friday becomes
 * Thu–Fri rather than losing Thursday or becoming Friday alone. Dropping it on
 * a day the class already meets simply removes the day it was picked up from.
 */
function swapDay(days: DayCode[], from: DayCode, to: DayCode): DayCode[] {
  const kept = days.filter((day) => day !== from);
  return DAY_CODES.filter((day) => kept.includes(day) || day === to);
}

type ScheduleGridEditorProps = {
  /** Opens the entry form; a read-only role opens the same form in view mode. */
  onOpenEntry: (entry: ScheduleEntry, section: SectionId) => void;
  /** An empty cell was clicked: the section it belongs in, the day and the half hour. */
  onCreateAt: (slot: { day: DayCode; startMin: number; section: SectionId }) => void;
};

/**
 * The weekly grid editor (spec §7).
 *
 * GEOMETRY — the same math the student calendar uses, imported instead of
 * repeated: the window is 7:00 AM (420 min) to 8:00 PM (1200 min), one hour is
 * HOUR_HEIGHT (64px), and `layoutEvents` turns overlaps into equal lanes. Grid
 * lines, hour labels and blocks all come from `(minutes - 420) / 60 * 64`,
 * which is why a block's top always lands on its own time line.
 *
 * TWO WAYS TO EDIT — drag is the fast path, keyboard is the equal path, and
 * neither one is required:
 *   pointer  vertical drag moves the class, the bottom handle resizes it, both
 *            snapped to the same half hour the free-slot search walks.
 *   keyboard ↑/↓ shift 30 minutes, Shift+↑/↓ changes the end time, ←/→ hops the
 *            class to the next weekday, Delete removes it, Enter opens the form.
 * While a drag is in flight the block is drawn where the pointer says, dashed,
 * and turns red-dashed the moment the engine would reject that slot. Dropping
 * there is still allowed: shunting a class through a busy afternoon is real
 * work, and the conflict panel is what tells the registrar it needs fixing.
 */
export function ScheduleGridEditor({ onOpenEntry, onCreateAt }: ScheduleGridEditorProps) {
  const {
    canEditSection,
    deleteEntry,
    draft,
    editDisabledReason,
    loading,
    moveEntry,
    overlay,
    publishDiff,
    roomSet,
    sectionsForRole,
    selectedEntryId,
    selectEntry,
    section: activeSection,
    visibleEntries,
  } = useScheduleAdmin();

  /* Where a click-to-create class would be written: the open tab, or the first
   * section this role owns when looking at "All sections". */
  const targetSection: SectionId =
    activeSection === "all" ? sectionsForRole[0] : activeSection;
  const canCreate = canEditSection(targetSection);

  const columnsRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  /* A drag releases over empty canvas, and the browser then fires a click on
   * that canvas too. Without this gate every dropped class would also open a
   * new-class form. */
  const dragJustEndedRef = useRef(false);

  /* One class can hang in several day columns; this says which section owns it,
   * so the block and the clash check read from the same source. */
  const rowsById = useMemo(() => {
    const map = new Map<string, { entry: ScheduleEntry; section: SectionId; conflictCount: number }>();
    for (const row of visibleEntries) {
      map.set(row.entry.id, { entry: row.entry, section: row.section, conflictCount: row.conflictCount });
    }
    return map;
  }, [visibleEntries]);

  const positionedByDay = useMemo(() => {
    const entries = [...rowsById.values()].map((row) => row.entry);
    const map = new Map<DayCode, PositionedEvent[]>();
    for (const day of DAY_CODES) map.set(day, layoutEvents(entries, day));
    return map;
  }, [rowsById]);

  /* The "edited" dot comes from the publish diff, not the change log: it
   * answers "does this row differ from what students see right now". */
  const editedIds = useMemo(() => {
    const ids = new Set<string>();
    for (const diff of publishDiff) {
      for (const entry of diff.added) ids.add(entry.id);
      for (const changed of diff.edited) {
        if (changed.after !== undefined) ids.add(changed.after.id);
      }
    }
    return ids;
  }, [publishDiff]);

  /* Ghosts: everywhere else the overlaid teacher or room is already booked. */
  const ghostEntries = useMemo(() => {
    if (overlay.mode === "none" || overlay.id === "") return [];
    return overlay.mode === "instructor"
      ? entriesForInstructor(draft.schedules, overlay.id).map((row) => row.entry)
      : entriesForRoom(draft.schedules, overlay.id).map((row) => row.entry);
  }, [draft.schedules, overlay.id, overlay.mode]);

  const ghostsByDay = useMemo(() => {
    const map = new Map<DayCode, PositionedEvent[]>();
    for (const day of DAY_CODES) map.set(day, layoutEvents(ghostEntries, day));
    return map;
  }, [ghostEntries]);

  const totalHeight = ((DAY_END_MIN - DAY_START_MIN) / 60) * HOUR_HEIGHT;
  const hours = Array.from({ length: 14 }, (_, index) => 7 + index);

  /** Pointer position → the half-hour slot it is over. */
  function pointToSlot(clientX: number, clientY: number): { day: DayCode; minutes: number } {
    const box = columnsRef.current?.getBoundingClientRect();
    if (box === undefined || box === null) return { day: "MON", minutes: DAY_START_MIN };
    const dayIndex = Math.min(
      Math.max(Math.floor(((clientX - box.left) / box.width) * DAY_CODES.length), 0),
      DAY_CODES.length - 1,
    );
    return {
      day: DAY_CODES[dayIndex],
      minutes: DAY_START_MIN + ((clientY - box.top) / HOUR_HEIGHT) * 60,
    };
  }

  /**
   * The other way in: click a cell that holds nothing and the form opens
   * prefilled with that day and that half hour. The canvas itself is the
   * target, so a click that lands on a class, a ghost or a grid line is not a
   * request to create one.
   */
  function createAt(day: DayCode, event: ReactMouseEvent<HTMLDivElement>) {
    if (dragJustEndedRef.current) {
      dragJustEndedRef.current = false;
      return;
    }
    if (event.target !== event.currentTarget) return;
    const at = pointToSlot(event.clientX, event.clientY);
    onCreateAt({
      day,
      section: targetSection,
      startMin: Math.max(
        snapToStep(Math.min(at.minutes, DAY_END_MIN - NEW_CLASS_MIN)),
        DAY_START_MIN,
      ),
    });
  }

  function beginDrag(
    mode: DragMode,
    entry: ScheduleEntry,
    section: SectionId,
    originDay: DayCode,
    event: ReactPointerEvent<HTMLElement>,
  ) {
    if (!canEditSection(section)) return;
    const at = pointToSlot(event.clientX, event.clientY);
    selectEntry(entry.id);
    setDrag({
      entryId: entry.id,
      section,
      mode,
      originDay,
      grabOffsetMin: mode === "move" ? at.minutes - entry.startMin : 0,
      day: at.day,
      startMin: entry.startMin,
      endMin: entry.endMin,
    });
  }

  function updateDrag(event: ReactPointerEvent<HTMLDivElement>) {
    if (drag === null) return;
    const row = rowsById.get(drag.entryId);
    if (row === undefined) return;
    const at = pointToSlot(event.clientX, event.clientY);
    const duration = row.entry.endMin - row.entry.startMin;

    if (drag.mode === "move") {
      const start = Math.min(
        Math.max(snapToStep(at.minutes - drag.grabOffsetMin), DAY_START_MIN),
        DAY_END_MIN - duration,
      );
      setDrag({ ...drag, day: at.day, startMin: start, endMin: start + duration });
      return;
    }

    const end = Math.min(
      Math.max(snapToStep(at.minutes), row.entry.startMin + MIN_DURATION_MIN),
      DAY_END_MIN,
    );
    setDrag({ ...drag, endMin: end });
  }

  async function endDrag() {
    const current = drag;
    setDrag(null);
    if (current === null) return;
    dragJustEndedRef.current = true;
    const row = rowsById.get(current.entryId);
    if (row === undefined) return;

    const days =
      current.mode === "resize"
        ? row.entry.days
        : swapDay(row.entry.days, current.originDay, current.day);
    const sameTime = row.entry.startMin === current.startMin && row.entry.endMin === current.endMin;
    const sameDays =
      days.length === row.entry.days.length &&
      days.every((day) => row.entry.days.includes(day));
    if (sameTime && sameDays) return;

    await moveEntry(current.entryId, {
      startMin: current.startMin,
      endMin: current.endMin,
      days,
    });
  }

  /** Keyboard alternative: the same snap and the same rules, no pointer. */
  function handleKeyDown(
    entry: ScheduleEntry,
    section: SectionId,
    day: DayCode,
    event: ReactKeyboardEvent<HTMLElement>,
  ) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpenEntry(entry, section);
      return;
    }
    if (event.key === "Delete" || event.key === "Backspace") {
      if (!canEditSection(section)) return;
      event.preventDefault();
      void deleteEntry(entry, section);
      return;
    }
    if (!event.key.startsWith("Arrow") || !canEditSection(section)) return;

    const backwards = event.key === "ArrowUp" || event.key === "ArrowLeft";
    event.preventDefault();

    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      /* ←/→ hop the class to the next weekday and keep its time. */
      const index = DAY_INDEX[day] - 1 + (backwards ? -1 : 1);
      const nextDay = DAY_CODES[Math.min(Math.max(index, 0), DAY_CODES.length - 1)];
      if (nextDay === day) return;
      void moveEntry(entry.id, {
        startMin: entry.startMin,
        endMin: entry.endMin,
        days: swapDay(entry.days, day, nextDay),
      });
      return;
    }

    const delta = (backwards ? -1 : 1) * 30;
    const resize = event.shiftKey;
    const startMin = resize ? entry.startMin : entry.startMin + delta;
    const endMin = resize ? entry.endMin + delta : entry.endMin + delta;
    if (
      startMin < DAY_START_MIN ||
      endMin > DAY_END_MIN ||
      endMin - startMin < MIN_DURATION_MIN
    ) {
      return;
    }
    void moveEntry(entry.id, { startMin, endMin });
  }

  /* Checked against the whole draft, including the section being left behind,
   * so a clash is reported before the drop rather than after it. */
  const dragClash = useMemo(() => {
    if (drag === null) return false;
    const row = rowsById.get(drag.entryId);
    if (row === undefined) return false;
    const candidate: ScheduleEntry = {
      ...row.entry,
      days:
        drag.mode === "resize"
          ? row.entry.days
          : swapDay(row.entry.days, drag.originDay, drag.day),
      startMin: drag.startMin,
      endMin: drag.endMin,
    };
    return detectConflictsWithEntry(draft.schedules, drag.section, candidate).length > 0;
  }, [draft.schedules, drag, rowsById]);

  /** The block being dragged is drawn at the candidate time, not its own. */
  function previewGeometry(entry: ScheduleEntry): { topPx: number; heightPx: number } {
    if (drag === null) return { topPx: 0, heightPx: 0 };
    return getEventGeometry({ ...entry, startMin: drag.startMin, endMin: drag.endMin });
  }

  /**
   * What a column holds right now. While a move is in flight the block leaves
   * the column it started in and appears in the one under the pointer — and
   * since that class does not meet there yet, `layoutEvents` has no entry for
   * it, so the preview is synthesised at full width in the candidate slot.
   */
  function columnItems(day: DayCode): PositionedEvent[] {
    const base = (positionedByDay.get(day) ?? []).filter(
      (item) =>
        !(
          drag !== null &&
          drag.mode === "move" &&
          drag.entryId === item.entry.id &&
          day === drag.originDay &&
          drag.day !== day
        ),
    );

    if (drag === null || drag.mode !== "move" || drag.day !== day) return base;
    const row = rowsById.get(drag.entryId);
    if (row === undefined || base.some((item) => item.entry.id === drag.entryId)) return base;

    const geometry = getEventGeometry({
      ...row.entry,
      startMin: drag.startMin,
      endMin: drag.endMin,
    });
    return [
      ...base,
      {
        entry: row.entry,
        day,
        lane: 0,
        laneCount: 1,
        topPx: geometry.topPx,
        heightPx: geometry.heightPx,
        leftPct: 0,
        widthPct: 100,
      },
    ];
  }

  if (loading) {
    return (
      <section
        aria-label="Weekly grid editor"
        className="overflow-hidden rounded-2xl border border-white/80 bg-white/85 p-4 shadow-[0_8px_30px_rgb(15,36,104,0.04)] backdrop-blur-md"
      >
        <CardSkeleton />
      </section>
    );
  }

  if (visibleEntries.length === 0) {
    return (
      <section
        aria-label="Weekly grid editor"
        className="overflow-hidden rounded-2xl border border-white/80 bg-white/85 shadow-[0_8px_30px_rgb(15,36,104,0.04)] backdrop-blur-md"
      >
        <EmptyState
          icon={CalendarOff}
          title="Nothing to place on the grid"
          description="No class matches these filters, so the week is empty."
        />
      </section>
    );
  }

  return (
    <section
      aria-label="Weekly grid editor"
      className="overflow-hidden rounded-2xl border border-white/80 bg-white/85 shadow-[0_8px_30px_rgb(15,36,104,0.04)] backdrop-blur-md"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cpc-input-border/60 bg-gradient-to-r from-cpc-section-light/70 to-white/60 px-4 py-3">
        <p className="font-poppins text-xs font-semibold text-cpc-navy-text">
          {activeSection === "all" ? "All sections" : activeSection} · Mon–Sat · 7:00 AM – 8:00 PM
        </p>
        <p className="font-poppins text-[11px] text-cpc-heading-soft">
          Drag a class to move it, pull its bottom edge to resize, or use the arrow keys.
        </p>
      </div>

      <div className="overflow-x-auto p-3 sm:p-4">
        <div className="min-w-[720px]">
          <div className="flex border-b border-cpc-input-border bg-cpc-section-light">
            <div className="w-16 shrink-0 border-r border-cpc-input-border" aria-hidden />
            {DAY_CODES.map((day) => (
              <div
                key={day}
                className="min-w-0 flex-1 border-r border-cpc-input-border px-1 py-2 text-center last:border-r-0"
              >
                <p className="font-poppins text-[11px] font-semibold text-cpc-heading-soft">
                  {DAY_FULL[day]}
                </p>
              </div>
            ))}
          </div>

          <div className="flex">
            <div className="w-16 shrink-0 border-r border-cpc-input-border bg-white">
              <div className="relative" style={{ height: totalHeight }}>
                {hours.map((hour) => (
                  <span
                    key={hour}
                    className={cn(
                      "absolute right-1.5 font-poppins text-[10px] whitespace-nowrap text-cpc-heading-soft",
                      hour === 7 ? "translate-y-0" : hour === 20 ? "-translate-y-full" : "-translate-y-1/2",
                    )}
                    style={{ top: ((hour * 60 - DAY_START_MIN) / 60) * HOUR_HEIGHT }}
                  >
                    {formatHourLabel(hour)}
                  </span>
                ))}
              </div>
            </div>

            <div
              ref={columnsRef}
              className="flex flex-1 touch-none"
              onPointerMove={updateDrag}
              onPointerUp={() => void endDrag()}
              onPointerCancel={() => setDrag(null)}
              onPointerLeave={() => setDrag(null)}
            >
              {DAY_CODES.map((day) => {
                const items = columnItems(day);
                const ghosts = ghostsByDay.get(day) ?? [];

                return (
                  <div
                    key={day}
                    className="relative min-w-0 flex-1 overflow-hidden border-r border-cpc-input-border last:border-r-0"
                  >
                    <div
                      className="relative"
                      style={{ height: totalHeight, cursor: canCreate ? "pointer" : undefined }}
                      onClick={(event) => createAt(day, event)}
                    >
                      {hours.map((hour) => (
                        <div
                          key={hour}
                          className="pointer-events-none absolute inset-x-0 border-t border-cpc-input-border/60"
                          style={{ top: ((hour * 60 - DAY_START_MIN) / 60) * HOUR_HEIGHT }}
                          aria-hidden
                        />
                      ))}

                      {ghosts.map((item) => (
                        <div
                          key={`ghost-${item.entry.id}`}
                          aria-hidden
                          title={`${item.entry.subjectCode} · ${formatTimeRange(
                            item.entry.startMin,
                            item.entry.endMin,
                          )}`}
                          className="pointer-events-none absolute z-0 rounded-md border border-dashed border-cpc-blue-accent/50 bg-cpc-blue-accent/5 px-1.5 py-1 opacity-70"
                          style={{
                            top: item.topPx + 2,
                            height: Math.max(item.heightPx - 4, 18),
                            left: `calc(${item.leftPct}% + 2px)`,
                            width: `calc(${item.widthPct}% - 4px)`,
                          }}
                        >
                          <span className="block truncate text-[9px] leading-tight font-semibold text-cpc-blue-accent">
                            {item.entry.subjectCode}
                          </span>
                        </div>
                      ))}

                      {items.map((item) => {
                        const draggingThis = drag !== null && drag.entryId === item.entry.id;
                        const row = rowsById.get(item.entry.id);
                        if (row === undefined) return null;
                        const geometry = draggingThis ? previewGeometry(row.entry) : item;

                        return (
                          <GridEventBlock
                            key={item.entry.id}
                            positioned={{ ...item, topPx: geometry.topPx, heightPx: geometry.heightPx }}
                            section={row.section}
                            room={roomSet === "A" ? row.entry.roomSetA : row.entry.roomSetB}
                            showSection={activeSection === "all"}
                            conflictCount={row.conflictCount}
                            edited={editedIds.has(item.entry.id)}
                            selected={selectedEntryId === item.entry.id}
                            dragging={draggingThis}
                            clashPreview={draggingThis && dragClash}
                            editable={canEditSection(row.section)}
                            editReason={editDisabledReason(row.section)}
                            onOpen={onOpenEntry}
                            onPointerDown={beginDrag}
                            onKeyDown={handleKeyDown}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        {drag === null
          ? ""
          : `${formatTimeRange(drag.startMin, drag.endMin)} on ${DAY_FULL[drag.day]}${
              dragClash ? ", this slot clashes" : ", slot is free"
            }`}
      </p>
    </section>
  );
}
