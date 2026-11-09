import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { EnrollmentTrendPoint } from "@/services/enrollmentAdmin";

type EnrollmentTrendChartProps = {
  data: EnrollmentTrendPoint[];
};

const AXIS_TICK = {
  fill: "#4b56a8",
  fontSize: 10,
  fontFamily: "Poppins, sans-serif",
  fontWeight: 500,
} as const;

/** Weekly intake vs. approvals, smooth area chart with a tooltip. */
export function EnrollmentTrendChart({ data }: EnrollmentTrendChartProps) {
  const received = data.reduce((sum, point) => sum + point.received, 0);
  const approved = data.reduce((sum, point) => sum + point.approved, 0);
  const approvalRate = received > 0 ? Math.round((approved / received) * 100) : 0;

  return (
    <div className="flex h-full flex-col justify-between">
      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white/70 px-2 py-0.5 font-poppins text-[10.5px] font-medium text-cpc-navy-text shadow-2xs backdrop-blur-xs">
              <span className="h-2 w-2 rounded-full bg-cpc-blue-accent" aria-hidden />
              Received
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white/70 px-2 py-0.5 font-poppins text-[10.5px] font-medium text-emerald-700 shadow-2xs backdrop-blur-xs">
              <span className="h-2 w-2 rounded-full bg-emerald-600" aria-hidden />
              Approved
            </span>
          </div>
          <div className="flex items-center gap-1.5 font-poppins text-[10.5px] text-cpc-heading-soft">
            <span className="font-semibold text-cpc-navy-text tabular-nums">{received}</span> rec.
            <span className="opacity-40">·</span>
            <span className="inline-flex items-center rounded-full border border-emerald-200/60 bg-emerald-50/80 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 tabular-nums">
              {approvalRate}% approved
            </span>
          </div>
        </div>

        <div aria-label="Enrollment trend area chart" aria-hidden className="h-[180px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 6, right: 6, bottom: 0, left: -22 }}>
              <defs>
                <linearGradient id="admin-trend-received" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2b4bd1" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="#2b4bd1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="admin-trend-approved" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#059669" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#059669" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 4" stroke="#e0e6f5" vertical={false} />
              <XAxis
                dataKey="label"
                tick={AXIS_TICK}
                tickLine={false}
                axisLine={{ stroke: "#d8e3f5" }}
                minTickGap={8}
                padding={{ left: 4, right: 4 }}
              />
              <YAxis
                tick={AXIS_TICK}
                tickLine={false}
                axisLine={false}
                width={36}
                allowDecimals={false}
              />
              <Tooltip
                cursor={{ stroke: "#aebbea", strokeWidth: 1 }}
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid rgba(255, 255, 255, 0.8)",
                  backgroundColor: "rgba(255, 255, 255, 0.92)",
                  backdropFilter: "blur(8px)",
                  boxShadow: "0 10px 25px -5px rgba(15, 36, 104, 0.15)",
                  fontFamily: "Poppins, sans-serif",
                  fontSize: 11,
                  color: "#1b2f9e",
                  padding: "8px 10px",
                }}
                labelStyle={{ fontWeight: 600, marginBottom: 4 }}
                formatter={(value, name) => [String(value), name]}
              />
              <Area
                type="monotone"
                dataKey="received"
                name="Received"
                stroke="#2b4bd1"
                strokeWidth={2.5}
                fill="url(#admin-trend-received)"
                activeDot={{ r: 4, strokeWidth: 2, stroke: "#ffffff" }}
                animationDuration={900}
              />
              <Area
                type="monotone"
                dataKey="approved"
                name="Approved"
                stroke="#059669"
                strokeWidth={2.5}
                fill="url(#admin-trend-approved)"
                activeDot={{ r: 4, strokeWidth: 2, stroke: "#ffffff" }}
                animationDuration={1100}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-cpc-tile-border/40 pt-2.5 font-poppins text-[11px] text-cpc-heading-soft">
        <span>
          <strong className="text-cpc-navy-text">{received}</strong> total submissions
        </span>
        <span className="font-medium text-emerald-700">
          {approved} approved
        </span>
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
