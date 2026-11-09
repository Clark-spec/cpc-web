import { useState } from "react";
import type { DragEvent, KeyboardEvent as ReactKeyboardEvent } from "react";
import { Check, Clock, StickyNote, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { StatusBadge } from "@/components/features/admin/clearance/StatusBadge";
import { formatAge, overdueLabel } from "@/components/features/admin/clearance/sla";
import type { ClearanceRequestRow } from "@/components/features/admin/clearance/types";

type QueueCardProps = {
  row: ClearanceRequestRow;
  selected: boolean;
  onSelect: (id: string) => void;
  onSign: (row: ClearanceRequestRow) => void;
  onReject: (row: ClearanceRequestRow) => void;
  /** Lets the board clear its drop highlight when a drag is abandoned. */
  onDragEnd: () => void;
};

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part.charAt(0))
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const CARD_BUTTON =
  "inline-flex cursor-pointer items-center gap-1 rounded-lg border px-2.5 py-1.5 font-poppins text-[11px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent";

/**
 * Kanban card. Only a pending ("requested") card is draggable; dropping it on
 * the Signed / Rejected column hands the row to the page's sign / reject
 * handler, so a modal always opens — nothing is signed silently. Sign and
 * Reject buttons are the full non-drag alternative.
 */
export function QueueCard({
  row,
  selected,
  onSelect,
  onSign,
  onReject,
  onDragEnd,
}: QueueCardProps) {
  const [dragging, setDragging] = useState(false);
  const actionable = row.status === "requested";

  function handleDragStart(event: DragEvent<HTMLDivElement>) {
    event.dataTransfer.setData("text/plain", row.id);
    event.dataTransfer.effectAllowed = "move";
    setDragging(true);
  }

  function handleKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect(row.id);
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${row.studentName}, ${row.section}, ${row.studentId}`}
      draggable={actionable}
      onDragStart={actionable ? handleDragStart : undefined}
      onDragEnd={() => {
        setDragging(false);
        onDragEnd();
      }}
      onClick={() => onSelect(row.id)}
      onKeyDown={handleKeyDown}
      className={cn(
        "cursor-pointer rounded-xl border bg-white p-3 transition-colors hover:border-cpc-tile-border focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent",
        selected
          ? "border-cpc-blue-accent bg-cpc-section-light/50 ring-1 ring-cpc-blue-accent"
          : "border-cpc-tile-border/70",
        dragging && "opacity-50",
        actionable && "cursor-grab active:cursor-grabbing",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span
            aria-hidden
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cpc-navy font-poppins text-[10px] font-semibold text-white"
          >
            {initials(row.studentName)}
          </span>
          <div className="min-w-0">
            <p className="truncate font-poppins text-xs font-semibold text-cpc-navy-text" title={row.studentName}>
              {row.studentName}
            </p>
            <p className="truncate font-poppins text-[10px] text-cpc-heading-soft">
              {row.studentId} · {row.section}
            </p>
          </div>
        </div>
        <StatusBadge status={row.status} className="shrink-0" />
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="inline-flex items-center gap-1 font-poppins text-[10px] font-medium text-cpc-heading-soft">
          <Clock className="h-3 w-3 shrink-0" aria-hidden />
          {formatAge(row.ageHours)}
        </span>
        {row.isOverdue && (
          <span className="inline-flex items-center gap-1 font-poppins text-[10px] font-semibold text-rose-700">
            <Clock className="h-3 w-3 shrink-0" aria-hidden />
            {overdueLabel(row.ageHours)}
          </span>
        )}
      </div>

      {row.studentNote && (
        <p
          title={row.studentNote}
          className="mt-2 line-clamp-2 font-poppins text-[11px] text-cpc-heading-soft italic"
        >
          <StickyNote className="mr-1 inline h-3 w-3 shrink-0 text-cpc-muted-blue" aria-hidden />
          “{row.studentNote}”
        </p>
      )}

      {actionable && (
        <div className="mt-3 flex gap-2" onClick={(event) => event.stopPropagation()}>
          <button
            type="button"
            onClick={() => onSign(row)}
            className={cn(
              CARD_BUTTON,
              "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50/70",
            )}
          >
            <Check className="h-3 w-3 shrink-0" aria-hidden />
            Sign
          </button>
          <button
            type="button"
            onClick={() => onReject(row)}
            className={cn(CARD_BUTTON, "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-50/70")}
          >
            <X className="h-3 w-3 shrink-0" aria-hidden />
            Reject
          </button>
        </div>
      )}
    </div>
  );
}
