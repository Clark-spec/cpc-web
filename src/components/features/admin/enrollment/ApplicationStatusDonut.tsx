import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { ENROLLMENT_STATUS_LABELS } from "@/services/enrollmentAdmin";
import type { EnrollmentApplicationStatus } from "@/services/enrollmentAdmin";

type DonutSegment = {
  status: Extract<
    EnrollmentApplicationStatus,
    "pending" | "for-review" | "approved" | "needs-requirements"
  >;
  value: number;
  color: string;
};

const COLORS: Record<DonutSegment["status"], string> = {
  pending: "#2b4bd1",
  "for-review": "#d97706",
  approved: "#059669",
  "needs-requirements": "#e11d48",
};

type ApplicationStatusDonutProps = {
  counts: Record<EnrollmentApplicationStatus, number>;
};

/** Pipeline mix with the undecided total in the middle and a legend. */
export function ApplicationStatusDonut({ counts }: ApplicationStatusDonutProps) {
  const segments: DonutSegment[] = (
    ["pending", "for-review", "approved", "needs-requirements"] as const
  ).map((status) => ({ status, value: counts[status], color: COLORS[status] }));

  const total = segments.reduce((sum, segment) => sum + segment.value, 0) || 1;

  return (
    <div className="flex h-full flex-col justify-between">
      <div>
        <div className="relative mx-auto h-[160px] w-full max-w-[210px]" aria-hidden>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={segments}
                dataKey="value"
                nameKey="status"
                innerRadius={50}
                outerRadius={72}
                paddingAngle={3}
                cornerRadius={5}
                stroke="none"
                animationDuration={900}
              >
                {segments.map((segment) => (
                  <Cell key={segment.status} fill={segment.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255,255,255,0.92)",
                  backdropFilter: "blur(8px)",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.8)",
                  boxShadow: "0 10px 25px -5px rgba(15, 36, 104, 0.15)",
                  fontFamily: "Poppins, sans-serif",
                  fontSize: 11,
                  color: "#1b2f9e",
                }}
                formatter={(value, name) => [
                  String(value),
                  ENROLLMENT_STATUS_LABELS[name as DonutSegment["status"]] ?? String(name),
                ]}
              />
            </PieChart>
          </ResponsiveContainer>

          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-poppins text-2xl leading-none font-bold text-cpc-navy-text tabular-nums">
              {total.toLocaleString()}
            </span>
            <span className="mt-1 font-poppins text-[9px] font-semibold tracking-wider text-cpc-heading-soft uppercase">
              Applications
            </span>
          </div>
        </div>

        <ul className="mt-2.5 space-y-1">
          {segments.map((segment) => {
            const share = Math.round((segment.value / total) * 100);
            return (
              <li
                key={segment.status}
                className="flex items-center gap-2 rounded-lg px-2 py-1 transition-colors hover:bg-white/60"
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full shadow-2xs"
                  style={{ backgroundColor: segment.color }}
                  aria-hidden
                />
                <span className="min-w-0 flex-1 truncate font-poppins text-[11px] font-medium text-cpc-navy-text">
                  {ENROLLMENT_STATUS_LABELS[segment.status]}
                </span>
                <span className="font-poppins text-[11px] font-semibold text-cpc-navy-text tabular-nums">
                  {segment.value.toLocaleString()}
                </span>
                <span className="w-9 text-right font-poppins text-[10px] font-semibold text-cpc-heading-soft tabular-nums">
                  {share}%
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-cpc-tile-border/40 pt-2.5 font-poppins text-[11px] text-cpc-heading-soft">
        <span className="truncate">Active queue mix</span>
        <span className="font-semibold text-cpc-navy-text">{total.toLocaleString()} total</span>
      </div>
    </div>
  );
}
