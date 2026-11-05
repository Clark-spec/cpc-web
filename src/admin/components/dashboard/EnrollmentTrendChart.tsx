import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { EnrollmentTrendPoint } from "../../data/enrollmentApplications";

type EnrollmentTrendChartProps = {
  data: EnrollmentTrendPoint[];
};

const AXIS_TICK = {
  fill: "#7183A6",
  fontSize: 10,
  fontFamily: "Poppins, sans-serif",
} as const;

/** Weekly intake vs. approvals, smooth area chart with a tooltip. */
export function EnrollmentTrendChart({ data }: EnrollmentTrendChartProps) {
  const received = data.reduce((sum, point) => sum + point.received, 0);
  const approved = data.reduce((sum, point) => sum + point.approved, 0);
  const approvalRate = received > 0 ? Math.round((approved / received) * 100) : 0;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 font-poppins text-[10.5px] font-medium text-admin-muted">
            <span className="h-2 w-2 rounded-full bg-admin-info" aria-hidden />
            Received
          </span>
          <span className="inline-flex items-center gap-1.5 font-poppins text-[10.5px] font-medium text-admin-muted">
            <span className="h-2 w-2 rounded-full bg-admin-success" aria-hidden />
            Approved
          </span>
        </div>
        <p className="font-poppins text-[10.5px] text-admin-muted">
          <span className="font-semibold text-admin-text tabular-nums">{received}</span> received
          <span className="mx-1.5 text-admin-border">|</span>
          <span className="font-semibold text-admin-success tabular-nums">{approvalRate}%</span>{" "}
          approved
        </p>
      </div>

      <div aria-hidden className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 6, right: 6, bottom: 0, left: -22 }}>
            <defs>
              <linearGradient id="admin-trend-received" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4785F5" stopOpacity={0.28} />
                <stop offset="100%" stopColor="#4785F5" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="admin-trend-approved" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#20B77A" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#20B77A" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 4" stroke="#E7EEFA" vertical={false} />
            <XAxis
              dataKey="label"
              tick={AXIS_TICK}
              tickLine={false}
              axisLine={{ stroke: "#D8E3F5" }}
              minTickGap={8}
              padding={{ left: 4, right: 4 }}
            />
            <YAxis
              tick={AXIS_TICK}
              tickLine={false}
              axisLine={false}
              width={42}
              allowDecimals={false}
            />
            <Tooltip
              cursor={{ stroke: "#D8E3F5", strokeWidth: 1 }}
              contentStyle={{
                borderRadius: 8,
                border: "1px solid #D8E3F5",
                boxShadow: "0 8px 24px rgba(24,52,111,0.10)",
                fontFamily: "Poppins, sans-serif",
                fontSize: 11,
                color: "#18346F",
                padding: "8px 10px",
              }}
              labelStyle={{ fontWeight: 600, marginBottom: 4 }}
              formatter={(value, name) => [String(value), name]}
            />
            <Area
              type="monotone"
              dataKey="received"
              name="Received"
              stroke="#4785F5"
              strokeWidth={2.5}
              fill="url(#admin-trend-received)"
              activeDot={{ r: 4, strokeWidth: 2, stroke: "#ffffff" }}
              animationDuration={900}
            />
            <Area
              type="monotone"
              dataKey="approved"
              name="Approved"
              stroke="#20B77A"
              strokeWidth={2.5}
              fill="url(#admin-trend-approved)"
              activeDot={{ r: 4, strokeWidth: 2, stroke: "#ffffff" }}
              animationDuration={1100}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <ul className="sr-only">
        {data.map((point) => (
          <li key={point.label}>
            Week of {point.label}: {point.received} received, {point.approved} approved.
          </li>
        ))}
      </ul>
    </div>
  );
}
