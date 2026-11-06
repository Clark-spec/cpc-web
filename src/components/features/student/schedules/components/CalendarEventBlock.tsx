import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";
import type { ScheduleEntry } from "@/types/schedule";
import type { PositionedEvent } from "@/utils/layoutEvents";
import { getSubjectColor } from "@/utils/scheduleColors";
import { DAY_FULL, formatAriaRange, formatTimeRange } from "@/utils/scheduleTime";

type CalendarEventBlockProps = {
  positioned: PositionedEvent;
  /** Room for the active Set A / Set B toggle. */
  room: string;
  dimmed: boolean;
  highlighted: boolean;
  onOpen: (entry: ScheduleEntry) => void;
  onHover: (id: string | null) => void;
};

/**
 * One absolutely-positioned class block. The 2px inset on every side (added to
 * the geometry from `layoutEvents`) is what creates the visible gap between
 * back-to-back classes.
 */
export function CalendarEventBlock({
  positioned,
  room,
  dimmed,
  highlighted,
  onOpen,
  onHover,
}: CalendarEventBlockProps) {
  const { entry, day, topPx, heightPx, leftPct, widthPct } = positioned;
  const color = getSubjectColor(entry.colorKey);
  const notActive = entry.status === "not_active";
  const compact = heightPx < 40;

  const style: CSSProperties = {
    top: topPx + 2,
    height: Math.max(heightPx - 4, 18),
    left: `calc(${leftPct}% + 2px)`,
    width: `calc(${widthPct}% - 4px)`,
  };

  return (
    <button
      type="button"
      onClick={() => onOpen(entry)}
      onMouseEnter={() => onHover(entry.id)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(entry.id)}
      onBlur={() => onHover(null)}
      style={style}
      aria-label={`${entry.subjectCode}, ${DAY_FULL[day]}, ${formatAriaRange(
        entry.startMin,
        entry.endMin,
      )}, ${room}`}
      title={`${entry.subjectCode} · ${entry.title} · ${formatTimeRange(
        entry.startMin,
        entry.endMin,
      )} · ${room}`}
      className={cn(
        "absolute z-10 cursor-pointer overflow-hidden rounded-md border border-l-4 px-1.5 py-1 text-left transition-all duration-150 motion-reduce:transition-none",
        "hover:z-20 hover:-translate-y-0.5 hover:shadow-lg focus-visible:z-30 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-cpc-blue-accent",
        color.block,
        color.accent,
        notActive && "border-dashed opacity-70",
        dimmed && "opacity-25 saturate-50",
        highlighted && "z-30 ring-2 ring-cpc-blue-accent ring-offset-1",
      )}
    >
      <span className="block truncate text-[10px] leading-tight font-bold">
        {entry.subjectCode}
      </span>
      <span className="block truncate text-[10px] leading-tight">{room}</span>

      {!compact && (
        <span className="mt-0.5 block truncate text-[9px] leading-tight">
          {formatTimeRange(entry.startMin, entry.endMin)}
        </span>
      )}

      {!compact && heightPx >= 64 && (
        <span className="mt-0.5 line-clamp-2 block text-[9px] leading-tight">{entry.title}</span>
      )}

      {notActive && (
        <span className="mt-0.5 inline-block rounded bg-white/80 px-1 py-0.5 text-[8px] leading-none font-semibold">
          Not Active
        </span>
      )}
    </button>
  );
}
