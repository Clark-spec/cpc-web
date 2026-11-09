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
import type { EnrollmentOverviewRow } from "@/types/admin";

const COLORS: Record<EnrollmentOverviewRow["status"], string> = {
  submitted: "#2b4bd1",
  "for-review": "#d97706",
  approved: "#059669",
  "needs-requirements": "#e11d48",
};

/** Shortened X-axis tick labels so the bar chart never clips on small screens. */
const SHORT_X_LABELS: Record<string, string> = {
  "Needs Requirements": "Needs Req.",
  "For Review": "For Review",
  Submitted: "Submitted",
  Approved: "Approved",
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
    <figure className="m-0 flex h-full flex-col justify-between">
      <div className="w-full">
        <div aria-hidden className="h-48 w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 12, right: 16, bottom: 8, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e9f5" vertical={false} />
              <XAxis
                dataKey="name"
                tickFormatter={(label: string) => SHORT_X_LABELS[label] ?? label}
                tick={{ fill: "#475da0", fontSize: 11, fontFamily: "Poppins, sans-serif", fontWeight: 500 }}
                tickLine={false}
                axisLine={{ stroke: "#e0e4f2" }}
                interval={0}
                height={36}
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
                  borderRadius: 12,
                  border: "1px solid rgba(255, 255, 255, 0.8)",
                  backgroundColor: "rgba(255, 255, 255, 0.92)",
                  backdropFilter: "blur(8px)",
                  boxShadow: "0 10px 25px -5px rgba(15, 36, 104, 0.15)",
                  fontFamily: "Poppins, sans-serif",
                  fontSize: 12,
                  color: "#1b2f9e",
                }}
                formatter={(value) => [String(value), "Applications"]}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={56}>
                {data.map((entry) => (
                  <Cell key={entry.status} fill={COLORS[entry.status]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <figcaption className="mt-2 font-poppins text-[11px] leading-snug text-cpc-heading-soft">
        <span className="font-semibold text-cpc-navy-text">{total}</span> total applications
        {" \u00B7 "}
        <span className="font-medium text-cpc-blue-accent">{busiest.label}</span> is largest at{" "}
        <span className="font-semibold text-cpc-navy-text">{busiest.count}</span>.
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
