import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Link } from "react-router";
import { cn } from "@/lib/cn";
import { EmptyState } from "@/components/common/display/EmptyState";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import type { EnrollmentOverviewRow } from "@/types/admin";

type EnrollmentOverviewTableProps = {
  rows: EnrollmentOverviewRow[];
};

const STATUS_COLORS: Record<EnrollmentOverviewRow["status"], string> = {
  submitted: "#2b4bd1",
  "for-review": "#d97706",
  approved: "#059669",
  "needs-requirements": "#e11d48",
};

/** Shorter display labels so tiles never overflow in a 4-col grid. */
const STATUS_SHORT_LABELS: Record<EnrollmentOverviewRow["status"], string> = {
  submitted: "Submitted",
  "for-review": "For Review",
  approved: "Approved",
  "needs-requirements": "Needs Req.",
};

const STATUS_TONES: Record<EnrollmentOverviewRow["status"], BadgeTone> = {
  submitted: "info",
  "for-review": "warning",
  approved: "success",
  "needs-requirements": "danger",
};

/**
 * Pipeline breakdown with exact counts and visual progress indicators.
 * Rendered directly under the chart across the full card width.
 */
export function EnrollmentOverviewTable({ rows }: EnrollmentOverviewTableProps) {
  const total = rows.reduce((sum, row) => sum + row.count, 0);

  if (rows.length === 0) {
    return (
      <EmptyState
        title="No enrollment data yet"
        description="Applications will appear here once the enrollment period opens."
      />
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {rows.map((row) => {
        const positive = row.last7Days >= 0;
        const share = total > 0 ? Math.round((row.count / total) * 100) : 0;
        const color = STATUS_COLORS[row.status];

        return (
          <Link
            key={row.status}
            to={`${row.href}?status=${row.status}`}
            className="group relative flex flex-col justify-between rounded-xl border border-white/80 bg-white/70 p-3.5 shadow-xs backdrop-blur-sm transition-all duration-200 hover:-translate-y-1 hover:border-cpc-blue-accent/30 hover:bg-white hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
          >
            {/* Status label row — uses short label so "Needs Req." never overflows */}
            <div className="flex items-center justify-between gap-1 overflow-hidden">
              <Badge tone={STATUS_TONES[row.status]} size="sm">
                {STATUS_SHORT_LABELS[row.status]}
              </Badge>
              <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-cpc-muted-blue/60 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-cpc-blue-accent" aria-hidden />
            </div>

            <div className="mt-3 flex items-baseline justify-between gap-2">
              <span className="font-poppins text-2xl font-bold text-cpc-navy-text tabular-nums transition-colors duration-200 group-hover:text-cpc-blue-accent">
                {row.count}
              </span>
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
                  positive
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200/50"
                    : "bg-rose-50 text-rose-700 border border-rose-200/50",
                )}
              >
                {positive ? (
                  <ArrowUpRight className="h-2.5 w-2.5 shrink-0" aria-hidden />
                ) : (
                  <ArrowDownRight className="h-2.5 w-2.5 shrink-0" aria-hidden />
                )}
                {positive ? "+" : ""}
                {row.last7Days}
              </span>
            </div>

            <div className="mt-2.5">
              <div className="flex items-center justify-between font-poppins text-[10px] text-cpc-heading-soft">
                <span>Share of pipeline</span>
                <span className="font-semibold text-cpc-navy-text">{share}%</span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-cpc-section-light">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${share}%`, backgroundColor: color }}
                />
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
