import {
  CheckCircle2,
  Clock3,
  PackageCheck,
  RefreshCw,
  Ticket,
  TrendingUp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useCountUp } from "@/hooks/useCountUp";
import type { getServiceRequestCounts } from "@/services/serviceRequests/admin";

type Counts = ReturnType<typeof getServiceRequestCounts>;

type CardConfig = {
  key: "pending" | "processing" | "activeKiosk" | "completedToday";
  label: string;
  supporting: (counts: Counts) => string;
  icon: LucideIcon;
  /** Tailwind top accent bar color (inline style fallback) */
  accent: string;
  iconBg: string;
  iconText: string;
  trendIcon: LucideIcon;
};

const CARDS: CardConfig[] = [
  {
    key: "pending",
    label: "Pending Requests",
    supporting: (counts) => `${counts.pendingToday} submitted today`,
    icon: Clock3,
    accent: "#F3A43B",
    iconBg: "bg-amber-50",
    iconText: "text-amber-500",
    trendIcon: TrendingUp,
  },
  {
    key: "processing",
    label: "Processing / In-Queue",
    supporting: () => "Across all service windows",
    icon: RefreshCw,
    accent: "#4785F5",
    iconBg: "bg-blue-50",
    iconText: "text-blue-500",
    trendIcon: TrendingUp,
  },
  {
    key: "activeKiosk",
    label: "Active Kiosk Tickets",
    supporting: (counts) => `${counts.kioskToday} issued at kiosk today`,
    icon: Ticket,
    accent: "#7C6FE0",
    iconBg: "bg-violet-50",
    iconText: "text-violet-500",
    trendIcon: TrendingUp,
  },
  {
    key: "completedToday",
    label: "Completed Today",
    supporting: () => "Finalized across all windows",
    icon: CheckCircle2,
    accent: "#20B77A",
    iconBg: "bg-emerald-50",
    iconText: "text-emerald-500",
    trendIcon: PackageCheck,
  },
];

function StatTile({
  config,
  counts,
  index,
}: {
  config: CardConfig;
  counts: Counts;
  index: number;
}) {
  const count = counts[config.key];
  const value = useCountUp(count, 650 + index * 110);
  const Icon = config.icon;

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-white/80 bg-white/85 p-5 shadow-[0_8px_30px_rgb(15,36,104,0.04)] backdrop-blur-md transition-all hover:shadow-[0_12px_36px_rgb(15,36,104,0.09)] motion-reduce:transition-none">
      {/* Top accent bar */}
      <span
        className="absolute inset-x-0 top-0 h-[3px] rounded-t-2xl"
        style={{ backgroundColor: config.accent }}
        aria-hidden
      />

      {/* Subtle decorative glow */}
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-40 blur-2xl transition-opacity group-hover:opacity-60"
        style={{ backgroundColor: config.accent + "22" }}
        aria-hidden
      />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-poppins text-[11px] leading-snug font-semibold tracking-wide text-admin-muted uppercase">
            {config.label}
          </p>
          <p className="mt-1.5 font-poppins text-[32px] leading-none font-bold text-admin-primary tabular-nums">
            {value.toLocaleString()}
          </p>
          <p className="mt-2 font-poppins text-[11px] leading-snug text-admin-muted">
            {config.supporting(counts)}
          </p>
        </div>

        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${config.iconBg} ${config.iconText} shadow-xs ring-1 ring-black/5`}
          aria-hidden
        >
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </article>
  );
}

/** Four compact KPIs derived from the same local request array as the table. */
export function ServiceRequestStatCards({ counts }: { counts: Counts }) {
  return (
    <section aria-label="Service request statistics">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {CARDS.map((config, index) => (
          <StatTile key={config.key} config={config} counts={counts} index={index} />
        ))}
      </div>
    </section>
  );
}
