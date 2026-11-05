import { CheckCircle2, Clock3, RefreshCw, Ticket } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useCountUp } from "@/hooks/useCountUp";
import type { getServiceRequestCounts } from "@/data/serviceRequests";

type Counts = ReturnType<typeof getServiceRequestCounts>;

type CardConfig = {
  key: "pending" | "processing" | "activeKiosk" | "completedToday";
  label: string;
  supporting: (counts: Counts) => string;
  icon: LucideIcon;
  accent: string;
  iconTone: string;
};

const CARDS: CardConfig[] = [
  {
    key: "pending",
    label: "Pending Service Requests",
    supporting: (counts) => `${counts.pendingToday} submitted today`,
    icon: Clock3,
    accent: "#F3A43B",
    iconTone: "bg-[#FEF4E7] text-[#F3A43B]",
  },
  {
    key: "processing",
    label: "Processing / In-Queue",
    supporting: () => "Across the service windows",
    icon: RefreshCw,
    accent: "#4785F5",
    iconTone: "bg-[#EAF1FF] text-[#4785F5]",
  },
  {
    key: "activeKiosk",
    label: "Active Kiosk Tickets",
    supporting: (counts) => `${counts.kioskToday} issued at the kiosk today`,
    icon: Ticket,
    accent: "#7C6FE0",
    iconTone: "bg-[#F1EEFE] text-[#7C6FE0]",
  },
  {
    key: "completedToday",
    label: "Completed Today",
    supporting: () => "Finalized across all windows",
    icon: CheckCircle2,
    accent: "#20B77A",
    iconTone: "bg-[#E9F7F1] text-[#20B77A]",
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
    <article className="relative overflow-hidden rounded-[10px] border border-admin-border bg-admin-card p-4 shadow-[0_2px_12px_rgba(24,52,111,0.04)] transition-shadow hover:shadow-[0_8px_22px_rgba(24,52,111,0.08)] motion-reduce:transition-none">
      <span
        className="absolute inset-x-0 top-0 h-[3px]"
        style={{ backgroundColor: config.accent }}
        aria-hidden
      />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-poppins text-[10.5px] leading-snug font-semibold text-admin-muted">
            {config.label}
          </p>
          <p className="mt-1 font-poppins text-[28px] leading-none font-bold text-admin-primary tabular-nums">
            {value.toLocaleString()}
          </p>
          <p className="mt-2 font-poppins text-[10px] leading-snug text-admin-muted">
            {config.supporting(counts)}
          </p>
        </div>

        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${config.iconTone}`}
          aria-hidden
        >
          <Icon className="h-[18px] w-[18px]" />
        </span>
      </div>
    </article>
  );
}

/** Four compact KPIs derived from the same local request array as the table. */
export function ServiceRequestStatCards({ counts }: { counts: Counts }) {
  return (
    <section aria-label="Service request statistics">
      <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        {CARDS.map((config, index) => (
          <StatTile key={config.key} config={config} counts={counts} index={index} />
        ))}
      </div>
    </section>
  );
}
