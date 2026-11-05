import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { EnrollmentOverviewRow } from "../../types";

const COLORS: Record<EnrollmentOverviewRow["status"], string> = {
  submitted: "#2b4bd1",
  "for-review": "#d97706",
  approved: "#059669",
  "needs-requirements": "#e11d48",
};

type EnrollmentChartProps = {
  rows: EnrollmentOverviewRow[];
};

/**
 * Compact bar chart of the enrollment pipeline. The SVG itself is decorative;
 * the meaning is carried by a written summary and a screen-reader data table,
 * so the chart never relies on colour alone.
 */
export function EnrollmentChart({ rows }: EnrollmentChartProps) {
  const data = rows.map((row) => ({ name: row.label, value: row.count, status: row.status }));
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  const busiest = [...rows].sort((a, b) => b.count - a.count)[0];

  if (rows.length === 0) {
    return (
      <p className="font-poppins text-xs text-cpc-heading-soft">
        No enrollment stages to chart yet.
      </p>
    );
  }

  return (
    <figure className="m-0">
      {/* The chart scrolls inside the card, so the four pipeline labels never
          overlap each other in a phone-width column. */}
      <div className="overflow-x-auto overscroll-x-contain">
        <div aria-hidden className="h-48 w-full min-w-[440px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e9f5" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fill: "#475da0", fontSize: 10, fontFamily: "Poppins, sans-serif" }}
                tickLine={false}
                axisLine={{ stroke: "#e0e4f2" }}
                interval={0}
              />
              <YAxis
                tick={{ fill: "#475da0", fontSize: 10, fontFamily: "Poppins, sans-serif" }}
                tickLine={false}
                axisLine={false}
                width={40}
              />
              <Tooltip
                cursor={{ fill: "rgba(43, 75, 209, 0.06)" }}
                contentStyle={{
                  borderRadius: 10,
                  border: "1px solid #aebbea",
                  fontFamily: "Poppins, sans-serif",
                  fontSize: 12,
                  color: "#1b2f9e",
                }}
                formatter={(value) => [String(value), "Applications"]}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={44}>
                {data.map((entry) => (
                  <Cell key={entry.status} fill={COLORS[entry.status]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <figcaption className="mt-2 font-poppins text-[11px] leading-relaxed text-cpc-heading-soft">
        {total} applications in progress. {busiest.label} is the largest group at{" "}
        {busiest.count}. {rows.map((row) => `${row.label}: ${row.count}`).join(", ")}.
      </figcaption>

      {/* Data-table fallback for the charted values. */}
      <table className="sr-only">
        <caption>Enrollment applications by status</caption>
        <thead>
          <tr>
            <th scope="col">Status</th>
            <th scope="col">Applications</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.status}>
              <th scope="row">{row.label}</th>
              <td>{row.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
