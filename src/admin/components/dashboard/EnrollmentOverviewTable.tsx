import { ArrowRight, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Link } from "react-router";
import { StatusBadge } from "../StatusBadge";
import type { EnrollmentOverviewRow } from "../../types";

type EnrollmentOverviewTableProps = {
  rows: EnrollmentOverviewRow[];
};

/** Pipeline breakdown with exact counts; also the accessible chart summary. */
export function EnrollmentOverviewTable({ rows }: EnrollmentOverviewTableProps) {
  const total = rows.reduce((sum, row) => sum + row.count, 0);

  return (
    <div className="overflow-hidden rounded-xl border border-cpc-tile-border/70">
      <table className="w-full border-collapse">
        <caption className="sr-only">
          Enrollment overview. {total} applications across {rows.length} statuses.
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
            <th scope="col" className="w-9 px-2 py-2">
              <span className="sr-only">Open</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-cpc-tile-border/60">
          {rows.map((row) => {
            const positive = row.last7Days >= 0;
            return (
              <tr key={row.status} className="transition-colors hover:bg-cpc-section-light/40">
                <td className="px-3 py-2.5">
                  <StatusBadge status={row.status} />
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

                <td className="px-2 py-2.5">
                  <Link
                    to={row.href}
                    aria-label={`Open ${row.label} applications`}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-cpc-heading-soft transition-colors hover:bg-cpc-section-light hover:text-cpc-blue-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
                  >
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
