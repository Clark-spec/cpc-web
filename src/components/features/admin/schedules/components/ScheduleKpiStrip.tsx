import { useMemo } from "react";
import { AlertTriangle, Building2, CalendarDays, Layers } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { StatCardSkeleton } from "@/components/ui/admin/Skeleton";
import { useCountUp } from "@/hooks/useCountUp";
import { cn } from "@/lib/cn";
import { ACADEMIC_YEAR, SEMESTER } from "@/data/mockSchedules";
import type { ScheduleEntry } from "@/types/schedule";
import { useScheduleAdmin } from "../context/ScheduleAdminContext";
import type { KpiFilterTarget } from "../types";
import { ONLINE_ROOM } from "../utils/conflicts";

type KpiCard = {
  id: KpiFilterTarget;
  label: string;
  value: number;
  detail: string;
  icon: LucideIcon;
  tone: string;
  /** Rose ring on the card itself — colour only ever rides along with the count. */
  alert?: boolean;
};

/**
 * Four clickable summary cards (spec §2).
 *
 * (1) Each card is a filter, not a link. `applyKpiFilter` writes the same URL
 * params the toolbar uses, so clicking "Conflicts" and clicking the conflicts
 * chip land on one identical address — a card never navigates somewhere the
 * toolbar cannot reproduce.
 * (2) Everything is computed from the draft, never stored: the counts describe
 * the working copy the registrar is looking at, which is what a decision to
 * publish is actually made from.
 */
export function ScheduleKpiStrip() {
  const {
    applyKpiFilter,
    conflictCount,
    conflictsBySection,
    loading,
    master,
    scopedSchedules,
  } = useScheduleAdmin();

  const clashSectionCount = useMemo(
    () => Object.values(conflictsBySection).filter((count) => count > 0).length,
    [conflictsBySection],
  );

  /* The same scoping the table applies: deans see their sections, an
   * instructor sees only their own classes, everyone else sees the college. */
  const scoped = useMemo(() => {
    const rows: ScheduleEntry[] = [];
    let sections = 0;
    for (const schedule of scopedSchedules) {
      if (schedule.entries.length > 0) sections += 1;
      rows.push(...schedule.entries);
    }
    return { rows, sections };
  }, [scopedSchedules]);

  const cards = useMemo<KpiCard[]>(() => {
    const active = scoped.rows.filter((entry) => entry.status === "active").length;
    const notActive = scoped.rows.length - active;

    const usedRooms = new Set<string>();
    for (const entry of scoped.rows) {
      for (const room of [entry.roomSetA, entry.roomSetB]) {
        const name = room.trim().toUpperCase();
        if (name !== "" && name !== ONLINE_ROOM) usedRooms.add(name);
      }
    }
    const physicalRooms = master.rooms.filter((room) => room.active && room.type !== "online");

    return [
      {
        id: "sections",
        label: "Sections in scope",
        value: scoped.sections,
        detail: `${SEMESTER} · AY ${ACADEMIC_YEAR}`,
        icon: Layers,
        tone: "bg-cpc-section-light text-cpc-blue-accent",
      },
      {
        id: "entries",
        label: "Scheduled classes",
        value: scoped.rows.length,
        detail:
          notActive > 0
            ? `${active} active · ${notActive} not active`
            : `${active} active`,
        icon: CalendarDays,
        tone: "bg-emerald-50 text-emerald-600",
      },
      {
        id: "conflicts",
        label: "Conflicts",
        value: conflictCount,
        detail:
          conflictCount === 0
            ? "every class fits"
            : `in ${clashSectionCount} ${clashSectionCount === 1 ? "section" : "sections"}`,
        icon: AlertTriangle,
        tone: "bg-rose-50 text-rose-600",
        alert: conflictCount > 0,
      },
      {
        id: "rooms",
        label: "Rooms in use",
        value: usedRooms.size,
        detail: `of ${physicalRooms.length} available`,
        icon: Building2,
        tone: "bg-amber-50 text-amber-600",
      },
    ];
  }, [clashSectionCount, conflictCount, master.rooms, scoped]);

  if (loading) {
    return (
      <div
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
        aria-busy="true"
        aria-label="Loading schedule statistics"
      >
        {Array.from({ length: 4 }).map((_, index) => (
          <StatCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card, index) => (
        <KpiCardButton key={card.id} card={card} index={index} onApply={applyKpiFilter} />
      ))}
    </div>
  );
}

function KpiCardButton({
  card,
  index,
  onApply,
}: {
  card: KpiCard;
  index: number;
  onApply: (target: KpiFilterTarget) => void;
}) {
  const count = useCountUp(card.value, 700 + index * 120);
  const Icon = card.icon;

  return (
    <button
      type="button"
      onClick={() => onApply(card.id)}
      aria-label={`${card.label}: ${count.toLocaleString()}. ${card.detail}. Apply this filter.`}
      className={cn(
        "flex cursor-pointer flex-col rounded-2xl border border-cpc-tile-border/70 bg-white p-5 text-left transition-all hover:-translate-y-0.5 hover:border-cpc-tile-border hover:shadow-[0_14px_36px_rgba(15,36,104,0.10)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent motion-reduce:hover:translate-y-0",
        card.alert && "border-rose-200 ring-1 ring-rose-200",
      )}
    >
      <div className="flex items-center gap-3">
        <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-full", card.tone)} aria-hidden>
          {card.alert ? <AlertTriangle className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
        </span>
        <p className="min-w-0 font-poppins text-xs leading-snug font-semibold text-cpc-heading-soft">
          {card.label}
        </p>
      </div>

      <div className="mt-4 flex items-end justify-between gap-3">
        <p
          aria-live="polite"
          aria-atomic="true"
          className="min-w-0 truncate font-poppins text-[26px] leading-none font-bold text-cpc-navy-text tabular-nums"
        >
          {count.toLocaleString()}
        </p>
        <p className="shrink-0 font-poppins text-[11px] leading-none font-semibold text-cpc-heading-soft">
          {card.detail}
        </p>
      </div>
    </button>
  );
}
