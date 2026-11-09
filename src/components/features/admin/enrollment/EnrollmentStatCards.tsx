import {
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  ClipboardList,
  Eye,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { useCountUp } from "@/hooks/useCountUp";
import type {
  EnrollmentApplicationStatus,
  EnrollmentStatusFilter,
} from "@/services/enrollmentAdmin";

type CardConfig = {
  status: EnrollmentApplicationStatus;
  label: string;
  description: string;
  icon: LucideIcon;
  accent: string;
  iconTone: string;
};

const CARDS: CardConfig[] = [
  {
    status: "pending",
    label: "Pending Enrollments",
    description: "Awaiting first review",
    icon: ClipboardList,
    accent: "#2b4bd1",
    iconTone: "bg-cpc-section-light text-cpc-blue-accent",
  },
  {
    status: "for-review",
    label: "For Review",
    description: "Credentials being verified",
    icon: Eye,
    accent: "#d97706",
    iconTone: "bg-amber-50 text-amber-600",
  },
  {
    status: "approved",
    label: "Approved",
    description: "Cleared for enrollment",
    icon: CheckCircle2,
    accent: "#059669",
    iconTone: "bg-emerald-50 text-emerald-600",
  },
  {
    status: "needs-requirements",
    label: "Needs Requirements",
    description: "Missing required documents",
    icon: AlertCircle,
    accent: "#e11d48",
    iconTone: "bg-rose-50 text-rose-600",
  },
];

type EnrollmentStatCardsProps = {
  counts: Record<EnrollmentApplicationStatus, number>;
  newThisWeek: Record<EnrollmentApplicationStatus, number>;
  total: number;
  activeStatus: EnrollmentStatusFilter;
  onSelect: (status: EnrollmentStatusFilter) => void;
};

function StatTile({
  config,
  count,
  weekly,
  share,
  active,
  index,
  onSelect,
}: {
  config: CardConfig;
  count: number;
  weekly: number;
  share: number;
  active: boolean;
  index: number;
  onSelect: () => void;
}) {
  const value = useCountUp(count, 650 + index * 110);
  const Icon = config.icon;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      aria-label={`${config.label}: ${count}. ${share}% of all applications. ${weekly} new this week. Open this status list.`}
      className={cn(
        "group relative flex flex-col justify-between overflow-hidden rounded-2xl border p-4.5 text-left transition-all duration-300 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent motion-reduce:hover:translate-y-0",
        active
          ? "border-cpc-blue-accent/60 bg-white/95 shadow-[0_16px_36px_rgba(43,75,209,0.14)] ring-2 ring-cpc-blue-accent/25"
          : "border-white/80 bg-white/70 shadow-[0_4px_20px_rgba(15,36,104,0.04)] backdrop-blur-md hover:-translate-y-1 hover:border-cpc-blue-accent/30 hover:bg-white/95 hover:shadow-[0_16px_36px_rgba(43,75,209,0.12)]",
      )}
    >
      <span
        className="absolute inset-x-0 top-0 h-[3px] rounded-t-2xl transition-all"
        style={{ backgroundColor: config.accent }}
        aria-hidden
      />

      {/* Top Row: Icon on left, Share / arrow badge on right - ZERO OVERLAP */}
      <div className="flex items-center justify-between gap-2">
        <span
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-xs transition-all duration-300 group-hover:scale-110 group-hover:shadow-md",
            config.iconTone,
          )}
          aria-hidden
        >
          <Icon className="h-5 w-5" />
        </span>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 font-poppins text-[11px] leading-none font-semibold transition-all duration-200 group-hover:scale-105",
            active
              ? "border-cpc-blue-accent/30 bg-cpc-section-light text-cpc-blue-accent"
              : "border-white/80 bg-white/80 text-cpc-navy-text shadow-xs backdrop-blur-xs",
          )}
        >
          <span>{share}%</span>
          <ArrowUpRight
            className={cn(
              "h-3 w-3 transition-transform duration-200",
              active
                ? "text-cpc-blue-accent"
                : "text-cpc-heading-soft group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-cpc-blue-accent",
            )}
            aria-hidden
          />
        </span>
      </div>

      <div className="mt-3">
        <p className="font-poppins text-xs font-medium text-cpc-heading-soft">
          {config.label}
        </p>
        <p className="mt-0.5 font-poppins text-2xl font-bold tracking-tight text-cpc-navy-text tabular-nums">
          {value.toLocaleString()}
        </p>
      </div>

      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-1.5 border-t border-cpc-tile-border/30 pt-2">
        <span className="font-poppins text-[11px] leading-snug text-cpc-heading-soft">
          {config.description}
        </span>
        {weekly > 0 ? (
          <span className="inline-flex items-center gap-0.5 rounded-md border border-emerald-200/60 bg-emerald-50/80 px-1.5 py-0.5 font-poppins text-[10px] font-semibold text-emerald-700 tabular-nums">
            +{weekly} this week
          </span>
        ) : (
          <span className="font-poppins text-[10px] text-cpc-heading-soft/60">
            Current queue
          </span>
        )}
      </div>
    </button>
  );
}

/** Four KPI tiles derived from the same local application store. */
export function EnrollmentStatCards({
  counts,
  newThisWeek,
  total,
  activeStatus,
  onSelect,
}: EnrollmentStatCardsProps) {
  const safeTotal = total || 1;

  return (
    <section aria-label="Enrollment statistics">
      <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        {CARDS.map((config, index) => (
          <StatTile
            key={config.status}
            config={config}
            count={counts[config.status]}
            weekly={newThisWeek[config.status]}
            share={Math.round((counts[config.status] / safeTotal) * 100)}
            active={activeStatus === config.status}
            index={index}
            onSelect={() => onSelect(config.status)}
          />
        ))}
      </div>
    </section>
  );
}
