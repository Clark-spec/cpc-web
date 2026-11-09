import { ArrowRight, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Link } from "react-router";
import { StatusBadge } from "@/components/common/StatusBadge";
import { EmptyState } from "@/components/common/EmptyState";
import type { EnrollmentOverviewRow } from "@/types/admin";

type EnrollmentOverviewTableProps = {
  rows: EnrollmentOverviewRow[];
};

/**
 * Pipeline breakdown with exact counts; also the accessible summary for the
 * chart. The whole row is clickable through a stretched link on the status
 * cell, so there is one focusable target per row instead of two.
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
    <div className="overflow-hidden rounded-xl border border-cpc-tile-border/70">
      <table className="w-full border-collapse">
        <caption className="sr-only">
          Enrollment overview. {total} applications across {rows.length} statuses.
          {rows.map((row) => `${row.label}: ${row.count} applications.`).join(" ")}
        </caption>
        <thead>
          <tr className="bg-cpc-section-light/60">
            <th
              scope="col"
              className="px-3 py-2 text-left font-poppins text-[10px] font-bold tracking-[0.1em] text-cpc-heading-soft uppercase"
            >
              Status
            </th>
            <th
              scope="col"
              className="px-3 py-2 text-right font-poppins text-[10px] font-bold tracking-[0.1em] text-cpc-heading-soft uppercase"
            >
              Count
            </th>
            <th
              scope="col"
              className="hidden px-3 py-2 text-right font-poppins text-[10px] font-bold tracking-[0.1em] text-cpc-heading-soft uppercase sm:table-cell"
            >
              Last 7 days
            </th>
            <th
              scope="col"
              className="px-3 py-2 text-right font-poppins text-[10px] font-bold tracking-[0.1em] text-cpc-heading-soft uppercase"
            >
              Share
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-cpc-tile-border/60">
          {rows.map((row) => {
            const positive = row.last7Days >= 0;
            const share = total > 0 ? Math.round((row.count / total) * 100) : 0;

            return (
              <tr
                key={row.status}
                className="relative transition-colors hover:bg-cpc-section-light/40 focus-within:bg-cpc-section-light/40"
              >
                <td className="px-3 py-2.5">
                  <StatusBadge status={row.status} />
                  <Link
                    to={`${row.href}?status=${row.status}`}
                    className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
                  >
                    <span className="sr-only">
                      Open {row.label} applications ({row.count})
                    </span>
                  </Link>
                </td>
                <td className="px-3 py-2.5 text-right font-poppins text-sm font-semibold text-cpc-navy-text tabular-nums">
                  {row.count}
                </td>
                <td className="hidden px-3 py-2.5 text-right sm:table-cell">
                  <span
                    className={
                      positive
                        ? "inline-flex items-center gap-0.5 font-poppins text-xs font-semibold text-emerald-700"
                        : "inline-flex items-center gap-0.5 font-poppins text-xs font-semibold text-rose-700"
                    }
                  >
                    {positive ? (
                      <ArrowUpRight className="h-3 w-3" aria-hidden />
                    ) : (
                      <ArrowDownRight className="h-3 w-3" aria-hidden />
                    )}
                    {positive ? "+" : ""}
                    {row.last7Days}
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center justify-end gap-1.5">
                    <span
                      role="img"
                      aria-label={`${share}% of all applications`}
                      className="h-1.5 w-12 overflow-hidden rounded-full bg-cpc-section-light"
                    >
                      <span
                        className="block h-full rounded-full bg-cpc-blue-accent"
                        style={{ width: `${share}%` }}
                      />
                    </span>
                    <span className="font-poppins text-[10px] font-semibold text-cpc-heading-soft tabular-nums">
                      {share}%
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-cpc-muted-blue" aria-hidden />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
