import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { Check, Clock, Eye, MoreVertical, StickyNote, X } from "lucide-react";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/cn";
import { StatusBadge } from "@/components/features/admin/clearance/StatusBadge";
import { OFFICE_LABELS } from "@/components/features/admin/clearance/officeChecks";
import { formatAge, overdueLabel } from "@/components/features/admin/clearance/sla";
import type { ClearanceRequestRow } from "@/components/features/admin/clearance/types";

type QueueRowProps = {
  row: ClearanceRequestRow;
  /** True when this row is the one driving the review panel. */
  selected: boolean;
  /** True when the row's checkbox is ticked (bulk actions). */
  checked: boolean;
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
  onSign: (row: ClearanceRequestRow) => void;
  onReject: (row: ClearanceRequestRow) => void;
  /** Position on the page — used for ArrowUp/ArrowDown focus walking. */
  index: number;
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

const CELL = "px-3 py-3 align-middle";
const MENU_ITEM =
  "flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-left font-poppins text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-cpc-blue-accent disabled:cursor-not-allowed disabled:opacity-50";

/**
 * One queue row: keyboard reachable (tabIndex, Up/Down, Enter, Space), with a
 * quick-action kebab that closes on Escape and outside click. Status is the
 * icon + text StatusBadge plus an explicit "3d overdue" label — never colour
 * alone.
 */
export function QueueRow({
  row,
  selected,
  checked,
  onSelect,
  onToggle,
  onSign,
  onReject,
  index,
}: QueueRowProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuOpensUp, setMenuOpensUp] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const actionable = row.status === "requested";

  useEffect(() => {
    if (!menuOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        triggerRef.current?.focus();
      }
    };
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!menuRef.current?.contains(target) && !triggerRef.current?.contains(target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [menuOpen]);

  /** Move focus to the first enabled menu item whenever the kebab opens. */
  useEffect(() => {
    if (!menuOpen) return;
    menuRef.current?.querySelector<HTMLElement>("[data-menu-item]:not(:disabled)")?.focus();
  }, [menuOpen]);

  function handleKeyDown(event: ReactKeyboardEvent<HTMLTableRowElement>) {
    const tbody = event.currentTarget.closest("tbody");
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      const next = event.key === "ArrowDown" ? index + 1 : index - 1;
      const target = tbody?.querySelector<HTMLElement>(`tr[data-row-index="${next}"]`);
      if (target) {
        event.preventDefault();
        target.focus();
      }
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      onSelect(row.id);
    } else if (event.key === " ") {
      event.preventDefault();
      onToggle(row.id);
    }
  }

  /**
   * The quick-action menu lives inside the table's scroll box, so it flips
   * above the trigger when the row sits too close to the box's bottom edge —
   * otherwise the Sign/Reject items would be clipped off-screen.
   */
  function toggleMenu() {
    const trigger = triggerRef.current;
    const box = trigger?.closest<HTMLElement>(".admin-scrollbar");

    if (trigger && box) {
      const roomBelow = box.getBoundingClientRect().bottom - trigger.getBoundingClientRect().bottom;
      setMenuOpensUp(roomBelow < 150);
    }
    setMenuOpen((open) => !open);
  }

  return (
    <tr
      data-row-index={index}
      tabIndex={0}
      aria-current={selected ? "true" : undefined}
      onClick={() => onSelect(row.id)}
      onKeyDown={handleKeyDown}
      className={cn(
        "cursor-pointer transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cpc-blue-accent",
        selected
          ? "bg-cpc-section-light/50 shadow-[inset_3px_0_0_0_var(--color-cpc-blue-accent)]"
          : "hover:bg-cpc-section-light/30",
      )}
    >
      <td className={CELL} onClick={(event) => event.stopPropagation()}>
        <input
          type="checkbox"
          checked={checked}
          onChange={() => onToggle(row.id)}
          aria-label={`Select ${row.studentName}'s ${OFFICE_LABELS[row.office]} request`}
          className="h-3.5 w-3.5 cursor-pointer accent-cpc-blue-accent"
        />
      </td>

      <td className={CELL}>
        <div className="flex min-w-0 items-center gap-2.5">
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
            <p className="truncate font-poppins text-[10px] text-cpc-heading-soft">{row.studentId}</p>
          </div>
        </div>
      </td>

      <td className={cn(CELL, "whitespace-nowrap")}>
        <p className="font-poppins text-[11px] text-cpc-navy-text">{row.section}</p>
        <p className="max-w-[8rem] truncate font-poppins text-[10px] text-cpc-heading-soft" title={row.program}>
          {row.program}
        </p>
      </td>

      <td className={cn(CELL, "whitespace-nowrap")}>
        <span className="font-poppins text-[11px] font-medium text-cpc-navy-text">
          {OFFICE_LABELS[row.office]}
        </span>
      </td>

      <td className={cn(CELL, "whitespace-nowrap")}>
        {row.requestedAt ? (
          <time
            dateTime={row.requestedAt}
            title={formatDateTime(row.requestedAt)}
            className="font-poppins text-[11px] text-cpc-heading-soft"
          >
            {formatAge(row.ageHours)}
          </time>
        ) : (
          <span className="font-poppins text-[11px] text-cpc-heading-soft/70" aria-label="No request date">
            —
          </span>
        )}
      </td>

      <td className={cn(CELL, "max-w-[180px]", "hidden 2xl:table-cell")}>
        {row.studentNote ? (
          <span className="flex min-w-0 items-center gap-1.5">
            <StickyNote className="h-3.5 w-3.5 shrink-0 text-cpc-muted-blue" aria-hidden />
            <span
              className="truncate font-poppins text-[11px] text-cpc-heading-soft italic"
              title={row.studentNote}
            >
              “{row.studentNote}”
            </span>
          </span>
        ) : (
          <span className="font-poppins text-[11px] text-cpc-heading-soft/70" aria-label="No student note">
            —
          </span>
        )}
      </td>

      <td className={CELL}>
        <div className="flex flex-col items-start gap-1">
          <StatusBadge status={row.status} />
          {row.isOverdue && (
            <span className="inline-flex items-center gap-1 font-poppins text-[10px] font-semibold text-rose-700">
              <Clock className="h-3 w-3 shrink-0" aria-hidden />
              {overdueLabel(row.ageHours)}
            </span>
          )}
        </div>
      </td>

      <td className={cn(CELL, "relative text-right")} onClick={(event) => event.stopPropagation()}>
        <button
          ref={triggerRef}
          type="button"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          aria-label={`Quick actions for ${row.studentName}`}
          onClick={toggleMenu}
          className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-cpc-tile-border bg-white p-1.5 text-cpc-blue-accent transition-colors hover:bg-cpc-section-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
        >
          <MoreVertical className="h-4 w-4" aria-hidden />
        </button>

        {menuOpen && (
          <div
            ref={menuRef}
            role="menu"
            aria-label={`Quick actions for ${row.studentName}`}
            className={cn(
              "absolute right-3 z-20 w-40 rounded-xl border border-white/80 bg-white/95 p-1 shadow-[0_12px_36px_rgba(15,36,104,0.12)] backdrop-blur-md",
              menuOpensUp ? "bottom-full" : "top-full",
            )}
          >
            <button
              type="button"
              role="menuitem"
              data-menu-item
              onClick={() => {
                setMenuOpen(false);
                onSelect(row.id);
              }}
              className={cn(MENU_ITEM, "text-cpc-navy-text hover:bg-cpc-section-light")}
            >
              <Eye className="h-3.5 w-3.5 shrink-0" aria-hidden />
              Review
            </button>
            <button
              type="button"
              role="menuitem"
              data-menu-item
              disabled={!actionable}
              title={actionable ? undefined : "Only pending requests can be signed"}
              onClick={() => {
                setMenuOpen(false);
                onSign(row);
              }}
              className={cn(MENU_ITEM, "text-emerald-700 hover:bg-emerald-50")}
            >
              <Check className="h-3.5 w-3.5 shrink-0" aria-hidden />
              Sign
            </button>
            <button
              type="button"
              role="menuitem"
              data-menu-item
              disabled={!actionable}
              title={actionable ? undefined : "Only pending requests can be rejected"}
              onClick={() => {
                setMenuOpen(false);
                onReject(row);
              }}
              className={cn(MENU_ITEM, "text-rose-700 hover:bg-rose-50")}
            >
              <X className="h-3.5 w-3.5 shrink-0" aria-hidden />
              Reject
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}
