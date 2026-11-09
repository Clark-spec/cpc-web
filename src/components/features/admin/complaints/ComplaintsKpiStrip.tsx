import { useMemo } from "react";
import { CheckCircle2, Clock3, Inbox, ScanSearch } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useCountUp } from "@/hooks/useCountUp";
import { cn } from "@/lib/cn";
import type {
  AdminComplaintRow,
  ComplaintStatusFilter,
} from "@/components/features/admin/complaints/types";

type KpiCard = {
  id: ComplaintStatusFilter;
  label: string;
  count: number;
  icon: LucideIcon;
  tone: string;
  hint: string;
};

type ComplaintsKpiStripProps = {
  rows: AdminComplaintRow[];
  /** Clicking a card narrows the table to that status. */
  onFilter: (status: ComplaintStatusFilter) => void;
};

/** One click-to-filter summary card, visually aligned with the clearance KPIs. */
function KpiCardButton({
  card,
  total,
  onFilter,
}: {
  card: KpiCard;
  total: number;
  onFilter: (status: ComplaintStatusFilter) => void;
}) {
  const count = useCountUp(card.count, 700);
  const Icon = card.icon;
  const share = total === 0 ? 0 : Math.round((card.count / total) * 100);
  const chip = card.id === "all" ? "All records" : `${share}% of total`;

  return (
    <button
      type="button"
      onClick={() => onFilter(card.id)}
      aria-label={`${card.label}: ${card.count}. ${card.hint}. Filter the table.`}
      className="flex cursor-pointer flex-col rounded-2xl border border-cpc-tile-border/70 bg-white p-5 text-left transition-all hover:-translate-y-0.5 hover:border-cpc-tile-border hover:shadow-[0_14px_36px_rgba(15,36,104,0.10)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent motion-reduce:hover:translate-y-0"
    >
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
            card.tone,
          )}
          aria-hidden
        >
          <Icon className="h-5 w-5" />
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
        <span className="inline-flex shrink-0 items-center rounded-full bg-slate-100 px-2 py-1 font-poppins text-[11px] leading-none font-semibold text-slate-600">
          {chip}
        </span>
      </div>
    </button>
  );
}

/**
 * Four summary cards (spec §3): total, pending, in review, resolved. Each card
 * is a filter shortcut — clicking it applies that status to the queue.
 */
export function ComplaintsKpiStrip({ rows, onFilter }: ComplaintsKpiStripProps) {
  const cards = useMemo<KpiCard[]>(() => {
    const pending = rows.filter((row) => row.status === "pending").length;
    const inReview = rows.filter((row) => row.status === "in_review").length;
    const resolved = rows.filter((row) => row.status === "resolved").length;

    return [
      {
        id: "all",
        label: "Total Complaints",
        count: rows.length,
        icon: Inbox,
        tone: "bg-cpc-section-light text-cpc-blue-accent",
        hint: "All complaints filed this term",
      },
      {
        id: "pending",
        label: "Pending",
        count: pending,
        icon: Clock3,
        tone: "bg-amber-50 text-amber-600",
        hint: "Awaiting first review",
      },
      {
        id: "in_review",
        label: "In Review",
        count: inReview,
        icon: ScanSearch,
        tone: "bg-cpc-section-light text-cpc-blue-accent",
        hint: "Currently being handled",
      },
      {
        id: "resolved",
        label: "Resolved",
        count: resolved,
        icon: CheckCircle2,
        tone: "bg-emerald-50 text-emerald-600",
        hint: "Closed cases",
      },
    ];
  }, [rows]);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <KpiCardButton
          key={card.id}
          card={card}
          total={rows.length}
          onFilter={onFilter}
        />
      ))}
    </div>
  );
}
