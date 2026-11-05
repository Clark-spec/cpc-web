import {
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  ClipboardList,
  Eye,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { useCountUp } from "../../../hooks/useCountUp";
import type {
  EnrollmentApplicationStatus,
  EnrollmentStatusFilter,
} from "../../../data/enrollmentApplications";

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
    accent: "#4785F5",
    iconTone: "bg-[#EAF1FF] text-[#4785F5]",
  },
  {
    status: "for-review",
    label: "For Review",
    description: "Credentials being verified",
    icon: Eye,
    accent: "#F3A43B",
    iconTone: "bg-[#FEF4E7] text-[#F3A43B]",
  },
  {
    status: "approved",
    label: "Approved",
    description: "Cleared for enrollment",
    icon: CheckCircle2,
    accent: "#20B77A",
    iconTone: "bg-[#E9F7F1] text-[#20B77A]",
  },
  {
    status: "needs-requirements",
    label: "Needs Requirements",
    description: "Missing required documents",
    icon: AlertCircle,
    accent: "#EF5365",
    iconTone: "bg-[#FDEDEF] text-[#EF5365]",
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
        "group relative overflow-hidden rounded-[10px] border bg-admin-card p-4 text-left transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-info motion-reduce:hover:translate-y-0",
        active
          ? "border-admin-secondary shadow-[0_8px_22px_rgba(36,73,168,0.14)] ring-1 ring-admin-secondary/25"
          : "border-admin-border shadow-[0_2px_12px_rgba(24,52,111,0.04)] hover:-translate-y-0.5 hover:border-admin-secondary/40 hover:shadow-[0_10px_26px_rgba(24,52,111,0.09)]",
      )}
    >
      <span
        className="absolute inset-x-0 top-0 h-[3px]"
        style={{ backgroundColor: config.accent }}
        aria-hidden
      />

      <span className="flex items-start justify-between gap-3">
        <span className={cn("flex h-9 w-9 items-center justify-center rounded-lg", config.iconTone)}>
          <Icon className="h-[18px] w-[18px]" aria-hidden />
        </span>
        <ArrowUpRight
          className={cn(
            "h-3.5 w-3.5 text-admin-muted transition-all",
            active ? "opacity-100" : "opacity-0 group-hover:opacity-100",
          )}
          aria-hidden
        />
      </span>

      <span className="mt-3 block font-poppins text-[12px] font-semibold tracking-[0.01em] text-admin-muted">
        {config.label}
      </span>
      <span className="mt-0.5 flex items-end justify-between gap-2">
        <span className="font-poppins text-[30px] leading-none font-bold text-admin-primary tabular-nums">
          {value.toLocaleString()}
        </span>
        <span className="rounded-full bg-admin-page px-1.5 py-0.5 font-poppins text-[10px] font-semibold text-admin-muted tabular-nums">
          {share}%
        </span>
      </span>

      <span className="mt-2 flex flex-wrap items-center justify-between gap-1.5">
        <span className="font-poppins text-[10.5px] leading-snug text-admin-muted">
          {config.description}
        </span>
        {weekly > 0 && (
          <span className="inline-flex items-center gap-0.5 font-poppins text-[10px] font-semibold text-admin-success">
            +{weekly} this week
          </span>
        )}
      </span>
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
