import {
  AlertCircle,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  Eye,
  FileCheck2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link } from "react-router";
import { cn } from "@/lib/cn";
import type { EnrollmentApplicationStatus } from "@/services/enrollmentAdmin";

type QuickAction = {
  label: string;
  description: string;
  to: string;
  icon: LucideIcon;
  countKey?: EnrollmentApplicationStatus | "total";
};

const ACTIONS: QuickAction[] = [
  {
    label: "Review Pending Applications",
    description: "Verify credentials waiting for review",
    to: "/admin/enrollment/for-review",
    icon: Eye,
    countKey: "for-review",
  },
  {
    label: "View All Applications",
    description: "Browse the complete applicant list",
    to: "/admin/enrollment/applications",
    icon: ClipboardList,
    countKey: "total",
  },
  {
    label: "View Approved Applications",
    description: "See applicants cleared for enrollment",
    to: "/admin/enrollment/approved",
    icon: CheckCircle2,
    countKey: "approved",
  },
  {
    label: "Manage Enrollment Requirements",
    description: "Follow up on missing documents",
    to: "/admin/enrollment/needs-requirements",
    icon: FileCheck2,
    countKey: "needs-requirements",
  },
  {
    label: "View Academic Calendar",
    description: "Open enrollment periods and deadlines",
    to: "/admin/academics/academic-calendar",
    icon: BarChart3,
  },
];

type EnrollmentQuickActionsProps = {
  counts?: Record<EnrollmentApplicationStatus, number>;
  total?: number;
};

/** Quick actions list styled with dashboard glassmorphism and mini KPI strip. */
export function EnrollmentQuickActions({ counts, total }: EnrollmentQuickActionsProps) {
  return (
    <div className="flex h-full flex-col justify-between">
      <ul className="space-y-2">
        {ACTIONS.map((action, index) => {
          const Icon = action.icon;
          const primary = index === 0;
          const count =
            action.countKey === "total"
              ? total
              : action.countKey && counts
                ? counts[action.countKey]
                : null;

          return (
            <li key={action.to}>
              <Link
                to={action.to}
                className={cn(
                  "group flex items-start gap-2.5 rounded-xl border p-2.5 transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent",
                  primary
                    ? "border-cpc-navy/90 bg-cpc-navy text-white shadow-sm shadow-cpc-navy/20 hover:-translate-y-0.5 hover:bg-cpc-navy-deep hover:shadow-md"
                    : "border-white/80 bg-white/70 backdrop-blur-xs hover:-translate-y-0.5 hover:border-cpc-blue-accent/30 hover:bg-white hover:shadow-sm",
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-105",
                    primary ? "bg-white/15 text-white" : "bg-cpc-section-light text-cpc-blue-accent",
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      "flex items-center gap-1 font-poppins text-xs font-semibold",
                      primary ? "text-white" : "text-cpc-navy-text",
                    )}
                  >
                    {action.label}
                    <ArrowUpRight
                      className={cn(
                        "h-3 w-3 shrink-0 opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100",
                        primary ? "text-white" : "text-cpc-blue-accent",
                      )}
                      aria-hidden
                    />
                  </span>
                  <span
                    className={cn(
                      "mt-0.5 block font-poppins text-[10px] leading-snug",
                      primary ? "text-white/80" : "text-cpc-heading-soft",
                    )}
                  >
                    {action.description}
                  </span>
                </span>
                {count !== null && count !== undefined && (
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 font-poppins text-[10px] font-bold tabular-nums",
                      primary
                        ? "bg-white/20 text-white"
                        : "border border-cpc-tile-border/40 bg-cpc-section-light text-cpc-blue-accent",
                    )}
                  >
                    {count}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>

      {counts && (
        <div className="mt-3.5 grid grid-cols-3 gap-2 border-t border-cpc-tile-border/40 pt-3">
          <div className="rounded-xl border border-emerald-200/60 bg-emerald-50/80 px-2 py-2 text-center backdrop-blur-xs">
            <CheckCircle2 className="mx-auto h-3.5 w-3.5 text-emerald-600" aria-hidden />
            <p className="mt-1 font-poppins text-base font-bold text-emerald-700 tabular-nums">
              {counts.approved}
            </p>
            <p className="font-poppins text-[9px] font-medium text-emerald-700">Approved</p>
          </div>
          <div className="rounded-xl border border-amber-200/60 bg-amber-50/80 px-2 py-2 text-center backdrop-blur-xs">
            <Eye className="mx-auto h-3.5 w-3.5 text-amber-600" aria-hidden />
            <p className="mt-1 font-poppins text-base font-bold text-amber-700 tabular-nums">
              {counts["for-review"]}
            </p>
            <p className="font-poppins text-[9px] font-medium text-amber-700">For Review</p>
          </div>
          <div className="rounded-xl border border-rose-200/60 bg-rose-50/80 px-2 py-2 text-center backdrop-blur-xs">
            <AlertCircle className="mx-auto h-3.5 w-3.5 text-rose-600" aria-hidden />
            <p className="mt-1 font-poppins text-base font-bold text-rose-700 tabular-nums">
              {counts["needs-requirements"]}
            </p>
            <p className="font-poppins text-[9px] font-medium text-rose-700">Needs Req.</p>
          </div>
        </div>
      )}
    </div>
  );
}
