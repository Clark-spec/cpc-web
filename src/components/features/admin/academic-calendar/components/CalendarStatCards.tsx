import {
  AlarmClock,
  Ban,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  FileEdit,
  Send,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/badge";
import { useCountUp } from "@/hooks/useCountUp";
import type { CalendarStats } from "../data/academicCalendar";

type CardConfig = {
  key: keyof Pick<CalendarStats, "total" | "upcoming" | "published" | "draft" | "pending">;
  label: string;
  supporting: (stats: CalendarStats) => string;
  icon: LucideIcon;
  iconBg: string;
  iconText: string;
  gradient: string;
  tag: string;
  tagClass: string;
  href: string;
  getValue?: (stats: CalendarStats) => number;
};

const CARDS: CardConfig[] = [
  {
    key: "total",
    label: "Total Events",
    supporting: () => "Across academic year",
    icon: CalendarDays,
    iconBg: "bg-blue-50",
    iconText: "text-blue-600",
    gradient: "from-blue-600 to-indigo-500",
    tag: "All Events",
    tagClass: "bg-blue-50/90 text-blue-700",
    href: "academic-event-management",
  },
  {
    key: "upcoming",
    label: "Upcoming Events",
    supporting: () => "Next 30 days",
    icon: CalendarClock,
    iconBg: "bg-purple-50",
    iconText: "text-purple-600",
    gradient: "from-purple-600 to-violet-400",
    tag: "Next 30d",
    tagClass: "bg-purple-50/90 text-purple-700",
    href: "calendar-overview",
  },
  {
    key: "published",
    label: "Published Events",
    supporting: () => "Visible to students",
    icon: Send,
    iconBg: "bg-emerald-50",
    iconText: "text-emerald-600",
    gradient: "from-emerald-500 to-teal-400",
    tag: "Live",
    tagClass: "bg-emerald-50/90 text-emerald-700",
    href: "publication-monitor",
  },
  {
    key: "draft",
    label: "Draft / Review",
    supporting: (stats) => `${stats.draft} draft · ${stats.pending} awaiting review`,
    icon: FileEdit,
    iconBg: "bg-amber-50",
    iconText: "text-amber-600",
    gradient: "from-amber-500 to-orange-400",
    tag: "Needs Action",
    tagClass: "bg-amber-100/90 text-amber-800",
    href: "publication-monitor",
  },
];

/** One click-to-scroll KPI card, styled like the Clearance & Schedule KPI strips. */
function StatTile({ config, stats, index }: { config: CardConfig; stats: CalendarStats; index: number }) {
  const targetValue = config.getValue ? config.getValue(stats) : stats[config.key];
  const value = useCountUp(targetValue, 700 + index * 120);
  const Icon = config.icon;
  const needsAttention = config.key === "draft" && stats.draft + stats.pending > 0;

  return (
    <button
      type="button"
      onClick={() => {
        document.getElementById(config.href)?.scrollIntoView({
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
            ? "auto"
            : "smooth",
          block: "start",
        });
      }}
      aria-label={`${config.label}: ${targetValue}. ${config.supporting(stats)}`}
      className={cn(
        "group relative flex w-full cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border border-white/80 bg-white/85 p-5 text-left shadow-[0_8px_30px_rgb(15,36,104,0.04)] backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-cpc-blue-accent/30 hover:bg-white hover:shadow-[0_16px_36px_rgba(15,36,104,0.09)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent motion-reduce:hover:translate-y-0",
        needsAttention && "border-amber-200/90 bg-amber-50/20 ring-1 ring-amber-200/70",
      )}
    >
      {/* Top accent gradient bar */}
      <div
        className={cn(
          "absolute top-0 inset-x-0 h-1 bg-gradient-to-r opacity-80 transition-opacity group-hover:opacity-100",
          config.gradient,
        )}
      />

      {/* Decorative ambient radial glow */}
      <div className="pointer-events-none absolute -right-6 -bottom-6 h-24 w-24 rounded-full bg-cpc-blue-accent/5 blur-xl transition-all duration-500 group-hover:scale-150 group-hover:bg-cpc-blue-accent/10" />

      {/* Header: Icon + Category/Status Tag */}
      <div className="relative z-10 flex items-center justify-between gap-3">
        <span
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-xs transition-transform duration-300 group-hover:scale-105",
            config.iconBg,
            config.iconText,
          )}
          aria-hidden
        >
          <Icon className="h-5 w-5" />
        </span>
        {needsAttention ? (
          <Badge tone="warning" size="sm" pulse className="uppercase tracking-[0.06em]">
            Needs Action
          </Badge>
        ) : (
          <Badge
            tone="plain"
            size="sm"
            dot={false}
            className={cn("uppercase tracking-[0.06em]", config.tagClass)}
          >
            {config.tag}
          </Badge>
        )}
      </div>

      {/* Middle: Label + Prominent Value */}
      <div className="relative z-10 mt-3.5">
        <p className="font-poppins text-xs font-semibold text-cpc-heading-soft">
          {config.label}
        </p>
        <div className="mt-1 flex items-baseline gap-2">
          <p
            aria-live="polite"
            aria-atomic="true"
            className="font-poppins text-[30px] xl:text-[32px] font-bold leading-none text-cpc-navy-text tabular-nums tracking-tight"
          >
            {value.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Bottom: Dedicated full-width supporting badge (prevents horizontal clipping/overflow) */}
      <div className="relative z-10 mt-3.5 flex items-center">
        <Badge
          tone={needsAttention ? "warning" : config.key === "published" ? "success" : "neutral"}
          size="sm"
          pulse={needsAttention}
          dot={needsAttention || config.key === "published"}
          className="max-w-full"
        >
          <span className="truncate">{config.supporting(stats)}</span>
        </Badge>
      </div>
    </button>
  );
}

type MiniStat = {
  label: string;
  value: number;
  icon: LucideIcon;
  tone: string;
  target: string;
};

export function CalendarStatCards({
  stats,
}: {
  stats: CalendarStats;
}) {
  const mini: MiniStat[] = [
    {
      label: "This week",
      value: stats.thisWeek,
      icon: CalendarDays,
      tone: "text-[#2449A8]",
      target: "calendar-overview",
    },
    {
      label: "Deadlines in 7 days",
      value: stats.deadlinesSoon,
      icon: AlarmClock,
      tone: stats.deadlinesSoon > 0 ? "text-[#B9761B]" : "text-cpc-heading-soft",
      target: "academic-deadlines",
    },
    {
      label: "Completed events",
      value: stats.completed,
      icon: CheckCircle2,
      tone: "text-[#128A59]",
      target: "academic-event-management",
    },
    {
      label: "Cancelled / postponed",
      value: stats.cancelled,
      icon: Ban,
      tone: stats.cancelled > 0 ? "text-[#C23545]" : "text-cpc-heading-soft",
      target: "academic-event-management",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {CARDS.map((config, index) => (
          <StatTile key={config.key} config={config} stats={stats} index={index} />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 rounded-2xl border border-white/80 bg-white/85 px-4 py-3 shadow-[0_8px_30px_rgb(15,36,104,0.04)] backdrop-blur-md sm:grid-cols-4">
        {mini.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() =>
              document.getElementById(item.target)?.scrollIntoView({
                behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
                  ? "auto"
                  : "smooth",
                block: "start",
              })
            }
            className="flex cursor-pointer items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-all hover:bg-white/90 hover:shadow-2xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
          >
            <item.icon className={cn("h-4 w-4 shrink-0", item.tone)} aria-hidden />
            <span className="min-w-0">
              <span className="block font-poppins text-sm leading-none font-bold text-cpc-navy-text tabular-nums">
                {item.value}
              </span>
              <span className="mt-1 block truncate font-poppins text-[11px] leading-none text-cpc-heading-soft">
                {item.label}
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
