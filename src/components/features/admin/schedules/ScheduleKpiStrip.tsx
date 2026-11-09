import { useMemo } from "react";
import { AlertTriangle, Building2, CalendarDays, Layers } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { StatCardSkeleton } from "@/components/common/display/Skeleton";
import { useCountUp } from "@/hooks/useCountUp";
import { cn } from "@/lib/cn";
import { ACADEMIC_YEAR, SEMESTER } from "@/services/scheduleStudent/mockSchedules";
import type { ScheduleEntry } from "@/types/schedule";
import { useScheduleAdmin } from "@/components/features/admin/schedules/ScheduleAdminContext";
import type { KpiFilterTarget } from "@/components/features/admin/schedules/types";
import { ONLINE_ROOM } from "@/components/features/admin/schedules/conflicts";

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
        tone: "bg-blue-50 text-cpc-blue-accent border border-blue-100/70",
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
        tone: "bg-emerald-50 text-emerald-600 border border-emerald-100/70",
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
        tone: "bg-rose-50 text-rose-600 border border-rose-100/70",
        alert: conflictCount > 0,
      },
      {
        id: "rooms",
        label: "Rooms in use",
        value: usedRooms.size,
        detail: `of ${physicalRooms.length} available`,
        icon: Building2,
        tone: "bg-amber-50 text-amber-600 border border-amber-100/70",
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
        "group relative flex cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border border-white/80 bg-white/85 p-5 text-left shadow-[0_8px_30px_rgb(15,36,104,0.04)] backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-cpc-blue-accent/30 hover:bg-white hover:shadow-[0_16px_36px_rgba(15,36,104,0.09)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent motion-reduce:hover:translate-y-0",
        card.alert && "border-rose-200/90 bg-rose-50/20 ring-1 ring-rose-200/70",
      )}
    >
      {/* Top accent gradient bar */}
      <div
        className={cn(
          "absolute top-0 inset-x-0 h-1 bg-gradient-to-r opacity-80 transition-opacity group-hover:opacity-100",
          card.id === "sections" && "from-cpc-blue-accent to-blue-400",
          card.id === "entries" && "from-emerald-500 to-teal-400",
          card.id === "conflicts" && "from-rose-500 to-red-400",
          card.id === "rooms" && "from-amber-500 to-orange-400",
        )}
      />

      {/* Ambient hover glow */}
      <div className="pointer-events-none absolute -right-6 -bottom-6 h-24 w-24 rounded-full bg-cpc-blue-accent/5 blur-xl transition-all duration-500 group-hover:scale-150 group-hover:bg-cpc-blue-accent/10" />

      <div className="relative z-10 flex items-center justify-between gap-3">
        <span
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-xs transition-transform duration-300 group-hover:scale-105",
            card.tone,
          )}
          aria-hidden
        >
          {card.alert ? <AlertTriangle className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
        </span>
        {card.alert ? (
          <span className="rounded-full bg-rose-100/90 px-2.5 py-0.5 font-poppins text-[10px] font-bold text-rose-700 uppercase tracking-wider">
            Needs Action
          </span>
        ) : (
          <span className="rounded-full bg-cpc-section-light/80 px-2.5 py-0.5 font-poppins text-[10px] font-semibold text-cpc-heading-soft uppercase tracking-wider">
            {card.id}
          </span>
        )}
      </div>

      <div className="relative z-10 mt-4">
        <p className="font-poppins text-xs font-semibold text-cpc-heading-soft">
          {card.label}
        </p>
        <div className="mt-1.5 flex items-baseline gap-2">
          <p
            aria-live="polite"
            aria-atomic="true"
            className="font-poppins text-[30px] xl:text-[32px] font-bold leading-none text-cpc-navy-text tabular-nums tracking-tight"
          >
            {count.toLocaleString()}
          </p>
        </div>
        <p className="mt-2.5 font-poppins text-[11px] font-medium text-cpc-heading-soft/90">
          {card.detail}
        </p>
      </div>
    </button>
  );
}
