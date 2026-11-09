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
import { useCountUp } from "@/hooks/useCountUp";
import type { CalendarStats } from "../data/academicCalendar";

type CardConfig = {
  key: keyof Pick<CalendarStats, "total" | "upcoming" | "published" | "draft" | "pending">;
  label: string;
  supporting: (stats: CalendarStats) => string;
  icon: LucideIcon;
  iconTone: string;
  href: string;
};

const CARDS: CardConfig[] = [
  {
    key: "total",
    label: "Total Events",
    supporting: () => "Across academic year",
    icon: CalendarDays,
    iconTone: "bg-[#E8EFFC] text-[#2449A8]",
    href: "academic-event-management",
  },
  {
    key: "upcoming",
    label: "Upcoming Events",
    supporting: () => "Next 30 days",
    icon: CalendarClock,
    iconTone: "bg-[#F3EDFF] text-[#8B5CF6]",
    href: "calendar-overview",
  },
  {
    key: "published",
    label: "Published Events",
    supporting: () => "Visible to students",
    icon: Send,
    iconTone: "bg-[#E9F7F1] text-[#20B77A]",
    href: "publication-monitor",
  },
  {
    key: "draft",
    label: "Draft / Review",
    supporting: (stats) => `${stats.draft} draft · ${stats.pending} awaiting review`,
    icon: FileEdit,
    iconTone: "bg-[#FEF4E7] text-[#F3A43B]",
    href: "publication-monitor",
  },
];

/** One click-to-scroll KPI card, styled like the Clearance KPI strip. */
function StatTile({ config, stats, index }: { config: CardConfig; stats: CalendarStats; index: number }) {
  const value = useCountUp(stats[config.key], 700 + index * 120);
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
      aria-label={`${config.label}: ${stats[config.key]}. ${config.supporting(stats)}`}
      className="flex w-full cursor-pointer flex-col rounded-2xl border border-cpc-tile-border/70 bg-white p-5 text-left transition-all hover:-translate-y-0.5 hover:border-cpc-tile-border hover:shadow-[0_14px_36px_rgba(15,36,104,0.10)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent motion-reduce:hover:translate-y-0"
    >
      <div className="flex items-center gap-3">
        <span
          className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-full", config.iconTone)}
          aria-hidden
        >
          <Icon className="h-5 w-5" />
        </span>
        <p className="min-w-0 font-poppins text-xs leading-snug font-semibold text-cpc-heading-soft">
          {config.label}
        </p>
      </div>

      <div className="mt-4 flex items-end justify-between gap-3">
        <p
          aria-live="polite"
          aria-atomic="true"
          className="min-w-0 truncate font-poppins text-[26px] leading-none font-bold text-cpc-navy-text tabular-nums"
        >
          {value.toLocaleString()}
        </p>
        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 font-poppins text-[11px] leading-none font-semibold",
            needsAttention ? "bg-amber-50 text-amber-700" : "bg-cpc-section-light text-cpc-heading-soft",
          )}
        >
          {needsAttention && <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden />}
          <span className="max-w-[150px] truncate">{config.supporting(stats)}</span>
        </span>
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

      <div className="grid grid-cols-2 gap-2 rounded-2xl border border-cpc-tile-border/70 bg-white px-4 py-3 sm:grid-cols-4">
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
            className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-cpc-section-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
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