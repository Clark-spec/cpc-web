import {
  ArrowDownRight,
  ArrowUpRight,
  ClipboardList,
  MessageSquareWarning,
  Minus,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link } from "react-router";
import { cn } from "@/lib/cn";
import { useCountUp } from "@/hooks/useCountUp";
import type { DashboardStat } from "@/types/admin";

const ICONS: Record<DashboardStat["id"], LucideIcon> = {
  enrollments: ClipboardList,
  clearance: ShieldCheck,
  requests: Wrench,
  complaints: MessageSquareWarning,
};

const ICON_TONES: Record<DashboardStat["id"], string> = {
  enrollments: "bg-cpc-section-light text-cpc-blue-accent",
  clearance: "bg-emerald-50 text-emerald-600",
  requests: "bg-amber-50 text-amber-600",
  complaints: "bg-rose-50 text-rose-600",
};

const SPARK_TONES: Record<DashboardStat["id"], string> = {
  enrollments: "#2b4bd1",
  clearance: "#059669",
  requests: "#d97706",
  complaints: "#e11d48",
};

type StatCardProps = {
  stat: DashboardStat;
  /** Stagger the count-up so the four cards animate in sequence. */
  index?: number;
};

function buildSparkline(values: number[]): string {
  const width = 96;
  const height = 32;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;

  return values
    .map((value, index) => {
      const x = values.length === 1 ? width / 2 : (index / (values.length - 1)) * width;
      const y = height - ((value - min) / span) * (height - 4) - 2;
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

/** One KPI card: count-up value, weekly trend chip and a sparkline. */
export function StatCard({ stat, index = 0 }: StatCardProps) {
  const value = useCountUp(stat.value, 700 + index * 120);
  const Icon = ICONS[stat.id];
  const TrendIcon =
    stat.trend === "up" ? ArrowUpRight : stat.trend === "down" ? ArrowDownRight : Minus;
  const trendLabel =
    stat.trend === "flat" ? "No change" : `${stat.change > 0 ? "+" : ""}${stat.change}%`;
  const trendTone =
    stat.trend === "up"
      ? "bg-emerald-50 text-emerald-700 border border-emerald-200/50"
      : stat.trend === "down"
        ? "bg-rose-50 text-rose-700 border border-rose-200/50"
        : "bg-slate-100 text-slate-600 border border-slate-200/50";
  const sparkPath = buildSparkline(stat.sparkline);
  const sparkId = `spark-${stat.id}`;

  return (
    <Link
      to={stat.href}
      aria-label={`${stat.label}: ${stat.value}. ${trendLabel} versus last week. View details.`}
      className="group relative flex flex-col justify-between rounded-2xl border border-white/80 bg-white/70 p-4.5 shadow-[0_4px_20px_rgba(15,36,104,0.04)] backdrop-blur-md transition-all duration-300 ease-out hover:-translate-y-1 hover:border-cpc-blue-accent/30 hover:bg-white/95 hover:shadow-[0_16px_36px_rgba(43,75,209,0.12)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent motion-reduce:hover:translate-y-0"
    >
      {/* Top Row: Icon on left, Trend badge on right - ZERO OVERLAP */}
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-xs transition-all duration-300 group-hover:scale-110 group-hover:shadow-md",
            ICON_TONES[stat.id],
          )}
          aria-hidden
        >
          <Icon className="h-5 w-5" />
        </span>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-poppins text-[11px] leading-none font-semibold transition-transform duration-200 group-hover:scale-105",
            trendTone,
          )}
        >
          <TrendIcon className="h-3 w-3" aria-hidden />
          {trendLabel}
        </span>
      </div>

      {/* Middle: Metric value */}
      <div className="mt-3">
        <p className="font-poppins text-3xl font-bold leading-tight text-cpc-navy-text tabular-nums transition-colors duration-200 group-hover:text-cpc-blue-accent">
          {value.toLocaleString()}
        </p>
      </div>

      {/* Bottom Row: Label on left, Sparkline curve on right - ZERO OVERLAP */}
      <div className="mt-2 flex items-end justify-between gap-2 border-t border-cpc-tile-border/40 pt-2.5">
        <div className="min-w-0 pr-2">
          <p className="truncate font-poppins text-xs font-semibold tracking-[0.01em] text-cpc-navy-text">
            {stat.label}
          </p>
          <p className="mt-0.5 font-poppins text-[10px] text-cpc-heading-soft">
            vs. last week
          </p>
        </div>

        <div className="shrink-0">
          <svg
            viewBox="0 0 96 32"
            aria-hidden
            className="h-7 w-20 overflow-visible transition-transform duration-300 group-hover:scale-105"
          >
            <defs>
              <linearGradient id={sparkId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={SPARK_TONES[stat.id]} stopOpacity="0.28" />
                <stop offset="100%" stopColor={SPARK_TONES[stat.id]} stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d={`${sparkPath} L96 32 L0 32 Z`}
              fill={`url(#${sparkId})`}
              stroke="none"
            />
            <path
              d={sparkPath}
              fill="none"
              stroke={SPARK_TONES[stat.id]}
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </Link>
  );
}
