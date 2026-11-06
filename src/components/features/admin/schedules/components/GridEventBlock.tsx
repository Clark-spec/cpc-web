import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from "react";
import { AlertTriangle, Pencil } from "lucide-react";
import { cn } from "@/lib/cn";
import type { DayCode, ScheduleEntry, SectionId } from "@/types/schedule";
import type { PositionedEvent } from "@/utils/layoutEvents";
import { getSubjectColor } from "@/utils/scheduleColors";
import { DAY_FULL, formatAriaRange, formatTimeRange } from "@/utils/scheduleTime";

type GridEventBlockProps = {
  positioned: PositionedEvent;
  section: SectionId;
  /** The room column the Set A / Set B toggle points at. */
  room: string;
  /** The "All sections" tab needs to say which section a block belongs to. */
  showSection: boolean;
  conflictCount: number;
  /** Differs from published v(n), so the card carries a dot as well as a tooltip. */
  edited: boolean;
  selected: boolean;
  /** The block is being dragged or resized right now: it follows the pointer. */
  dragging: boolean;
  /** The slot under the pointer would clash, so the preview turns red-dashed. */
  clashPreview: boolean;
  /** Read-only role: the block still opens, but cannot be moved by pointer. */
  editable: boolean;
  editReason: string | null;
  onOpen: (entry: ScheduleEntry, section: SectionId) => void;
  onPointerDown: (
    mode: "move" | "resize",
    entry: ScheduleEntry,
    section: SectionId,
    /** The column this block is drawn in, so a move swaps one day, not all. */
    day: DayCode,
    event: ReactPointerEvent<HTMLElement>,
  ) => void;
  onKeyDown: (
    entry: ScheduleEntry,
    section: SectionId,
    day: DayCode,
    event: ReactKeyboardEvent<HTMLElement>,
  ) => void;
};

/**
 * One class inside the weekly grid (spec §7).
 *
 * GEOMETRY
 * `layoutEvents` already turned minutes into `topPx`/`heightPx` and overlaps
 * into lanes, so this component only paints. The 2px inset on each side is what
 * keeps back-to-back classes from touching, exactly like the student block.
 *
 * The block is a real button: click opens the entry, arrow keys move it, and a
 * screen reader gets the whole booking in `aria-label`. Colour is never the only
 * signal — a clash adds an icon and the word "conflict", an unpublished change
 * adds a dot and the word "edited".
 */
export function GridEventBlock({
  positioned,
  section,
  room,
  showSection,
  conflictCount,
  edited,
  selected,
  dragging,
  clashPreview,
  editable,
  editReason,
  onOpen,
  onPointerDown,
  onKeyDown,
}: GridEventBlockProps) {
  const { entry, day, topPx, heightPx, leftPct, widthPct } = positioned;
  const color = getSubjectColor(entry.colorKey);
  const notActive = entry.status === "not_active";
  const clashing = conflictCount > 0 || clashPreview;
  const compact = heightPx < 44;

  const style: CSSProperties = {
    top: topPx + 2,
    height: Math.max(heightPx - 4, 20),
    left: `calc(${leftPct}% + 2px)`,
    width: `calc(${widthPct}% - 4px)`,
  };

  const ariaLabel = [
    entry.subjectCode,
    entry.title,
    showSection ? section : null,
    DAY_FULL[day],
    formatAriaRange(entry.startMin, entry.endMin),
    room === "" ? "no room" : room,
    entry.instructor,
    notActive ? "not active" : null,
    clashing ? "conflict" : null,
    edited ? "edited since last publish" : null,
  ]
    .filter((part) => part !== null)
    .join(", ");

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
      aria-pressed={selected}
      title={`${entry.subjectCode} · ${formatTimeRange(entry.startMin, entry.endMin)} · ${room}${
        editReason === null ? "" : ` — ${editReason}`
      }`}
      style={style}
      onClick={() => onOpen(entry, section)}
      onKeyDown={(event) => onKeyDown(entry, section, day, event)}
      onPointerDown={(event) => {
        if (!editable) return;
        onPointerDown("move", entry, section, day, event);
      }}
      className={cn(
        "absolute z-10 touch-none overflow-hidden rounded-md border border-l-4 px-1.5 py-1 text-left",
        "focus-visible:z-30 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-cpc-blue-accent",
        editable ? "cursor-grab active:cursor-grabbing" : "cursor-pointer",
        color.block,
        color.accent,
        notActive && "border-dashed opacity-70",
        clashing && "border-rose-400 ring-1 ring-rose-300",
        selected && "z-30 ring-2 ring-cpc-blue-accent ring-offset-1",
        dragging &&
          (clashing
            ? "border-dashed border-rose-500 bg-rose-50/90 opacity-90"
            : "border-dashed border-cpc-blue-accent bg-cpc-blue-accent/10 opacity-90"),
      )}
    >
      <span className="flex items-center gap-1">
        {clashing && <AlertTriangle className="h-3 w-3 shrink-0 text-rose-600" aria-hidden />}
        <span className="truncate text-[10px] leading-tight font-bold">{entry.subjectCode}</span>
        {edited && <Pencil className="h-2.5 w-2.5 shrink-0 text-cpc-blue-accent" aria-hidden />}
      </span>

      {showSection && (
        <span className="block truncate text-[9px] leading-tight font-semibold text-cpc-heading-soft">
          {section}
        </span>
      )}

      <span className="block truncate text-[10px] leading-tight">{room || "—"}</span>

      {!compact && (
        <span className="block truncate text-[9px] leading-tight">
          {formatTimeRange(entry.startMin, entry.endMin)}
        </span>
      )}

      {!compact && heightPx >= 66 && (
        <span className="block truncate text-[9px] leading-tight">{entry.instructor}</span>
      )}

      {notActive && (
        <span className="mt-0.5 inline-block rounded bg-white/80 px-1 py-0.5 text-[8px] leading-none font-semibold">
          Not Active
        </span>
      )}

      {editable && !dragging && (
        <span
          role="presentation"
          onPointerDown={(event) => {
            event.stopPropagation();
            onPointerDown("resize", entry, section, day, event);
          }}
          className="absolute inset-x-0 bottom-0 h-2 cursor-ns-resize"
        >
          <span className="mx-auto block h-0.5 w-6 rounded-full bg-current opacity-30" aria-hidden />
        </span>
      )}
    </div>
  );
}
