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
 * Compact bar chart of the enrollment pipeline. The table beside it carries
 * the exact numbers, so the chart stays decorative (`aria-hidden`) and the
 * accessible summary lives in the table caption.
 */
export function EnrollmentChart({ rows }: EnrollmentChartProps) {
  const data = rows.map((row) => ({ name: row.label, value: row.count, status: row.status }));

  return (
    <div aria-hidden className="h-56 w-full">
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
  );
}
