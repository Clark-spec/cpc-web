import { Clock3, FileSearch, PackageCheck, RefreshCw } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useCountUp } from "@/hooks/useCountUp";
import type { AdminServiceRequestSummary } from "@/services/serviceRequests/admin";

type CardConfig = {
  key: "submitted" | "under_review" | "processing" | "ready_for_release";
  label: string;
  supporting: string;
  icon: LucideIcon;
  /** Tailwind top accent bar color (inline style fallback) */
  accent: string;
  iconBg: string;
  iconText: string;
};

const CARDS: CardConfig[] = [
  {
    key: "submitted",
    label: "New Submissions",
    supporting: "Awaiting first review",
    icon: Clock3,
    accent: "#F3A43B",
    iconBg: "bg-amber-50",
    iconText: "text-amber-500",
  },
  {
    key: "under_review",
    label: "Under Review",
    supporting: "Being checked by the office",
    icon: FileSearch,
    accent: "#38BDF8",
    iconBg: "bg-sky-50",
    iconText: "text-sky-500",
  },
  {
    key: "processing",
    label: "Processing / In-Queue",
    supporting: "Across all service windows",
    icon: RefreshCw,
    accent: "#4785F5",
    iconBg: "bg-blue-50",
    iconText: "text-blue-500",
  },
  {
    key: "ready_for_release",
    label: "Ready for Release",
    supporting: "Waiting for student pickup",
    icon: PackageCheck,
    accent: "#7C6FE0",
    iconBg: "bg-violet-50",
    iconText: "text-violet-500",
  },
];

function StatTile({
  config,
  summary,
  index,
}: {
  config: CardConfig;
  summary: AdminServiceRequestSummary;
  index: number;
}) {
  const value = useCountUp(summary[config.key], 650 + index * 110);
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
            {config.supporting}
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

/** Four compact KPIs derived from the server-side queue summary. */
export function ServiceRequestStatCards({ summary }: { summary: AdminServiceRequestSummary }) {
  return (
    <section aria-label="Service request statistics">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {CARDS.map((config, index) => (
          <StatTile key={config.key} config={config} summary={summary} index={index} />
        ))}
      </div>
    </section>
  );
}
