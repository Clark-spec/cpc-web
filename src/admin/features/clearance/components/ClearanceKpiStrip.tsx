import { useMemo } from "react";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  FileSignature,
  Minus,
  Timer,
  Undo2,
} from "lucide-react";
import { StatCardSkeleton } from "@/components/ui/admin/Skeleton";
import { useCountUp } from "@/admin/hooks/useCountUp";
import { cn } from "@/lib/cn";
import { useClearanceAdmin } from "../context/ClearanceAdminContext";
import { formatTurnaround } from "../utils/sla";
import type { ClearanceRequestRow, KpiCard, KpiId } from "../types";

const DAY_MS = 86_400_000;

/** Local calendar-day key so "today" matches the staff member's clock. */
function dayKeyOf(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function dayKey(iso: string): string {
  return dayKeyOf(new Date(iso));
}

/** Days elapsed between `iso` and now; negative future stamps read as 0. */
function daysAgo(iso: string, now: number): number {
  return Math.max(0, (now - Date.parse(iso)) / DAY_MS);
}

type Trend = KpiCard["trend"];

function trendOf(current: number, previous: number): Trend {
  if (current > previous) return { direction: "up", label: `+${current - previous} vs previous` };
  if (current < previous) return { direction: "down", label: `−${previous - current} vs previous` };
  return { direction: "flat", label: "No change" };
}

/**
 * Whether "up" is good news for this metric — signed-more-today is good,
 * more-overdue / slower-turnaround is not. Keeps the chip honest: colour only
 * ever rides along with the icon + text.
 */
const POSITIVE_WHEN_UP: Record<KpiId, boolean> = {
  awaitingMine: false,
  signedToday: true,
  rejected: false,
  overdue: false,
  avgTurnaround: false,
};

/** Signed-today vs signed-yesterday, from real respondedAt buckets. */
function buildTrends(rows: ClearanceRequestRow[], overdueDays: number): Record<KpiId, Trend> {
  const now = Date.now();
  const todayKey = dayKeyOf(new Date(now));
  const yesterdayKey = dayKeyOf(new Date(now - DAY_MS));

  const signedOn = (key: string) =>
    rows.filter((row) => row.status === "signed" && row.respondedAt && dayKey(row.respondedAt) === key);

  const signedTodayBucket = signedOn(todayKey).length;
  const signedYesterdayBucket = signedOn(yesterdayKey).length;
  const signedTrend = trendOf(signedTodayBucket, signedYesterdayBucket);
  signedTrend.label =
    signedTrend.direction === "flat"
      ? "Same as yesterday"
      : `${signedTodayBucket - signedYesterdayBucket >= 0 ? "+" : "−"}${Math.abs(
          signedTodayBucket - signedYesterdayBucket,
        )} vs yesterday`;

  const arrivedToday = rows.filter(
    (row) => row.status === "requested" && row.requestedAt && dayKey(row.requestedAt) === todayKey,
  ).length;
  const arrivedYesterday = rows.filter(
    (row) => row.status === "requested" && row.requestedAt && dayKey(row.requestedAt) === yesterdayKey,
  ).length;
  const awaitingTrend = trendOf(arrivedToday, arrivedYesterday);
  awaitingTrend.label =
    awaitingTrend.direction === "flat"
      ? "Arrivals steady vs yesterday"
      : `${arrivedToday - arrivedYesterday >= 0 ? "+" : "−"}${Math.abs(
          arrivedToday - arrivedYesterday,
        )} new vs yesterday`;

  const rejectedIn = (from: number, to: number) =>
    rows.filter(
      (row) =>
        row.status === "rejected" &&
        row.respondedAt &&
        daysAgo(row.respondedAt, now) >= from &&
        daysAgo(row.respondedAt, now) < to,
    ).length;

  const rejectedWeek = rejectedIn(0, 7);
  const rejectedPrevWeek = rejectedIn(7, 14);
  const rejectedTrend = trendOf(rejectedWeek, rejectedPrevWeek);
  rejectedTrend.label =
    rejectedTrend.direction === "flat"
      ? "Even with last week"
      : `${rejectedWeek - rejectedPrevWeek >= 0 ? "+" : "−"}${Math.abs(
          rejectedWeek - rejectedPrevWeek,
        )} vs last week`;

  const overdueRows = rows.filter((row) => row.status === "requested" && row.requestedAt);
  const crossedIntoOverdue = (fromDays: number, toDays: number) =>
    overdueRows.filter((row) => {
      const hoursOverdue = daysAgo(row.requestedAt as string, now) * 24 - overdueDays * 24;
      return hoursOverdue >= fromDays * 24 && hoursOverdue < toDays * 24;
    }).length;

  const overdueNew = crossedIntoOverdue(0, 1);
  const overduePrev = crossedIntoOverdue(1, 2);
  const overdueTrend = trendOf(overdueNew, overduePrev);
  overdueTrend.label =
    overdueTrend.direction === "flat"
      ? `${overdueNew} became overdue in 24h`
      : `${overdueTrend.label} overdue in 24h`;

  const avgTurnaround = (from: number, to: number) => {
    const signed = rows.filter(
      (row) =>
        row.status === "signed" &&
        row.respondedAt &&
        row.requestedAt &&
        daysAgo(row.respondedAt, now) >= from &&
        daysAgo(row.respondedAt, now) < to,
    );
    if (signed.length === 0) return 0;
    return (
      signed.reduce(
        (sum, row) => sum + Math.max(0, Date.parse(row.respondedAt as string) - Date.parse(row.requestedAt as string)),
        0,
      ) /
      signed.length /
      DAY_MS
    );
  };

  const weekAvg = avgTurnaround(0, 7);
  const prevWeekAvg = avgTurnaround(7, 14);
  const turnaroundTrend = trendOf(
    Math.round(weekAvg * 10),
    Math.round(prevWeekAvg * 10),
  );
  turnaroundTrend.label =
    prevWeekAvg === 0 || weekAvg === 0
      ? "Last week: no data"
      : `vs ${prevWeekAvg.toFixed(1)} d last week`;

  return {
    awaitingMine: awaitingTrend,
    signedToday: signedTrend,
    rejected: rejectedTrend,
    overdue: overdueTrend,
    avgTurnaround: turnaroundTrend,
  };
}

const TREND_ICONS = {
  up: ArrowUpRight,
  down: ArrowDownRight,
  flat: Minus,
} as const;

/** One clickable KPI card; the strip maps the array of these over them. */
function KpiCardButton({ card, index }: { card: KpiCard; index: number }) {
  const { applyKpiFilter } = useClearanceAdmin();
  const count = useCountUp(card.countTo, 700 + index * 120);
  const Icon = card.icon;
  const TrendIcon = TREND_ICONS[card.trend.direction];
  const shown = card.display ?? count.toLocaleString();

  const flat = card.trend.direction === "flat";
  const good = flat ? null : (card.trend.direction === "up") === POSITIVE_WHEN_UP[card.id];
  const chipTone = flat
    ? "bg-slate-100 text-slate-600"
    : good
      ? "bg-emerald-50 text-emerald-700"
      : "bg-rose-50 text-rose-700";

  return (
    <button
      type="button"
      onClick={() => applyKpiFilter(card.id)}
      aria-label={`${card.label}: ${shown}. ${card.trend.label}. Apply this filter.`}
      className={cn(
        "flex cursor-pointer flex-col rounded-2xl border border-cpc-tile-border/70 bg-white p-5 text-left transition-all hover:-translate-y-0.5 hover:border-cpc-tile-border hover:shadow-[0_14px_36px_rgba(15,36,104,0.10)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent motion-reduce:hover:translate-y-0",
        card.alert && "border-rose-200 ring-1 ring-rose-200",
      )}
    >
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
            card.tone,
          )}
          aria-hidden
        >
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
          {shown}
        </p>
        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 font-poppins text-[11px] leading-none font-semibold",
            chipTone,
          )}
        >
          <TrendIcon className="h-3 w-3" aria-hidden />
          <span className="max-w-[120px] truncate">{card.trend.label}</span>
        </span>
      </div>
    </button>
  );
}

/**
 * KPI strip (spec §1): five click-to-filter cards. Numbers come from `kpis`,
 * trend chips from real `rows` date buckets — nothing is hardcoded, and the
 * count-up reuses the dashboard hook so prefers-reduced-motion is respected.
 */
export function ClearanceKpiStrip() {
  const { kpis, rows, period, loading } = useClearanceAdmin();

  const cards = useMemo<KpiCard[]>(() => {
    const trends = buildTrends(rows, period.overdueDays);
    return [
      {
        id: "awaitingMine",
        label: "Awaiting My Signature",
        value: kpis.awaitingMine,
        countTo: kpis.awaitingMine,
        icon: FileSignature,
        tone: "bg-cpc-section-light text-cpc-blue-accent",
        trend: trends.awaitingMine,
        filter: { status: "requested", overdueOnly: false },
      },
      {
        id: "signedToday",
        label: "Signed Today",
        value: kpis.signedToday,
        countTo: kpis.signedToday,
        icon: CheckCircle2,
        tone: "bg-emerald-50 text-emerald-600",
        trend: trends.signedToday,
        filter: { status: "signed", overdueOnly: false },
      },
      {
        id: "rejected",
        label: "Rejected",
        value: kpis.rejected,
        countTo: kpis.rejected,
        icon: Undo2,
        tone: "bg-rose-50 text-rose-600",
        trend: trends.rejected,
        filter: { status: "rejected", overdueOnly: false },
      },
      {
        id: "overdue",
        label: `Overdue (> ${period.overdueDays} days)`,
        value: kpis.overdue,
        countTo: kpis.overdue,
        icon: AlertTriangle,
        tone: "bg-rose-50 text-rose-600",
        trend: trends.overdue,
        alert: kpis.overdue > 0,
        filter: { status: "requested", overdueOnly: true },
      },
      {
        id: "avgTurnaround",
        label: "Avg. Turnaround",
        value: kpis.avgTurnaroundDays,
        countTo: 0,
        display: formatTurnaround(kpis.avgTurnaroundDays),
        icon: Timer,
        tone: "bg-amber-50 text-amber-600",
        trend: trends.avgTurnaround,
        filter: { status: "signed", overdueOnly: false },
      },
    ];
  }, [kpis, rows, period.overdueDays]);

  if (loading) {
    return (
      <div
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
        aria-busy="true"
        aria-label="Loading clearance statistics"
      >
        {Array.from({ length: 5 }).map((_, index) => (
          <StatCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {cards.map((card, index) => (
        <KpiCardButton key={card.id} card={card} index={index} />
      ))}
    </div>
  );
}
