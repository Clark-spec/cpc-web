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
import { StatCardSkeleton } from "@/components/common/display/Skeleton";
import { useCountUp } from "@/hooks/useCountUp";
import { cn } from "@/lib/cn";
import { useClearanceAdmin } from "@/components/features/admin/clearance/ClearanceAdminContext";
import { formatTurnaround } from "@/components/features/admin/clearance/sla";
import type { ClearanceRequestRow, KpiCard, KpiId } from "@/components/features/admin/clearance/types";

const DAY_MS = 86_400_000;

function dayKeyOf(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function dayKey(iso: string): string {
  return dayKeyOf(new Date(iso));
}

function daysAgo(iso: string, now: number): number {
  return Math.max(0, (now - Date.parse(iso)) / DAY_MS);
}

type Trend = KpiCard["trend"];

function trendOf(current: number, previous: number): Trend {
  if (current > previous) return { direction: "up", label: `+${current - previous} vs previous` };
  if (current < previous) return { direction: "down", label: `−${previous - current} vs previous` };
  return { direction: "flat", label: "No change" };
}

const POSITIVE_WHEN_UP: Record<KpiId, boolean> = {
  awaitingMine: false,
  signedToday: true,
  rejected: false,
  overdue: false,
  avgTurnaround: false,
};

const KPI_CONFIG: Record<
  KpiId,
  {
    accent: string;
    iconBg: string;
    iconText: string;
    glow: string;
  }
> = {
  awaitingMine: {
    accent: "#4785F5",
    iconBg: "bg-blue-50",
    iconText: "text-blue-600",
    glow: "rgba(71, 133, 245, 0.15)",
  },
  signedToday: {
    accent: "#20B77A",
    iconBg: "bg-emerald-50",
    iconText: "text-emerald-600",
    glow: "rgba(32, 183, 122, 0.15)",
  },
  rejected: {
    accent: "#EF5365",
    iconBg: "bg-rose-50",
    iconText: "text-rose-600",
    glow: "rgba(239, 83, 101, 0.15)",
  },
  overdue: {
    accent: "#F3A43B",
    iconBg: "bg-amber-50",
    iconText: "text-amber-600",
    glow: "rgba(243, 164, 59, 0.15)",
  },
  avgTurnaround: {
    accent: "#7C6FE0",
    iconBg: "bg-violet-50",
    iconText: "text-violet-600",
    glow: "rgba(124, 111, 224, 0.15)",
  },
};

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
      ? "Arrivals steady vs yest."
      : `${arrivedToday - arrivedYesterday >= 0 ? "+" : "−"}${Math.abs(
          arrivedToday - arrivedYesterday,
        )} new today`;

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
      ? `${overdueNew} overdue in 24h`
      : `${overdueTrend.label} in 24h`;

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
      ? "No prev. data"
      : `vs ${prevWeekAvg.toFixed(1)}d last week`;

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

function KpiCardButton({ card, index }: { card: KpiCard; index: number }) {
  const { applyKpiFilter, filters } = useClearanceAdmin();
  const count = useCountUp(card.countTo, 700 + index * 110);
  const Icon = card.icon;
  const TrendIcon = TREND_ICONS[card.trend.direction];
  const shown = card.display ?? count.toLocaleString();
  const config = KPI_CONFIG[card.id];

  const flat = card.trend.direction === "flat";
  const good = flat ? null : (card.trend.direction === "up") === POSITIVE_WHEN_UP[card.id];
  const chipTone = flat
    ? "bg-slate-100 text-slate-600"
    : good
      ? "bg-emerald-50 text-emerald-700"
      : "bg-rose-50 text-rose-700";

  const isActive =
    (card.id === "awaitingMine" && filters.status === "requested" && !filters.overdueOnly) ||
    (card.id === "signedToday" && filters.status === "signed") ||
    (card.id === "rejected" && filters.status === "rejected") ||
    (card.id === "overdue" && filters.overdueOnly);

  return (
    <button
      type="button"
      onClick={() => applyKpiFilter(card.id)}
      aria-label={`${card.label}: ${shown}. ${card.trend.label}. Click to filter.`}
      className={cn(
        "group relative flex cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border border-white/80 bg-white/85 p-5 text-left shadow-[0_8px_30px_rgb(15,36,104,0.04)] backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_36px_rgb(15,36,104,0.09)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent",
        isActive && "border-cpc-blue-accent/60 bg-cpc-blue-accent/[0.04] ring-2 ring-cpc-blue-accent/25",
        card.alert && !isActive && "border-amber-300/80 bg-amber-50/25",
      )}
    >
      {/* Top accent line */}
      <span
        className="absolute inset-x-0 top-0 h-[3px] rounded-t-2xl"
        style={{ backgroundColor: config.accent }}
        aria-hidden
      />

      {/* Decorative radial glow on hover */}
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-35 blur-2xl transition-opacity group-hover:opacity-60"
        style={{ backgroundColor: config.glow }}
        aria-hidden
      />

      {/* Header: Label + Icon */}
      <div className="relative flex items-start justify-between gap-2.5">
        <p className="min-w-0 font-poppins text-[11px] leading-snug font-semibold tracking-wide text-admin-muted uppercase">
          {card.label}
        </p>
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-xs ring-1 ring-black/5 transition-transform duration-200 group-hover:scale-105",
            config.iconBg,
            config.iconText,
          )}
          aria-hidden
        >
          {card.alert ? <AlertTriangle className="h-4.5 w-4.5" /> : <Icon className="h-4.5 w-4.5" />}
        </span>
      </div>

      {/* Middle: Prominent Count */}
      <div className="relative mt-2">
        <p
          aria-live="polite"
          aria-atomic="true"
          className="font-poppins text-[28px] xl:text-[32px] leading-none font-bold text-admin-primary tabular-nums"
        >
          {shown}
        </p>
      </div>

      {/* Bottom: Trend Badge */}
      <div className="relative mt-3 flex items-center">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-poppins text-[10.5px] font-semibold leading-tight",
            chipTone,
          )}
        >
          <TrendIcon className="h-3 w-3 shrink-0" aria-hidden />
          <span className="truncate">{card.trend.label}</span>
        </span>
      </div>
    </button>
  );
}

export function ClearanceKpiStrip() {
  const { kpis, rows, period, loading } = useClearanceAdmin();

  const cards = useMemo<KpiCard[]>(() => {
    const trends = buildTrends(rows, period.overdueDays);
    return [
      {
        id: "awaitingMine",
        label: "Awaiting Signature",
        value: kpis.awaitingMine,
        countTo: kpis.awaitingMine,
        icon: FileSignature,
        tone: "bg-blue-50 text-blue-600",
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
        label: "Rejected / Returned",
        value: kpis.rejected,
        countTo: kpis.rejected,
        icon: Undo2,
        tone: "bg-rose-50 text-rose-600",
        trend: trends.rejected,
        filter: { status: "rejected", overdueOnly: false },
      },
      {
        id: "overdue",
        label: `Overdue (> ${period.overdueDays}d)`,
        value: kpis.overdue,
        countTo: kpis.overdue,
        icon: AlertTriangle,
        tone: "bg-amber-50 text-amber-600",
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
        tone: "bg-violet-50 text-violet-600",
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
