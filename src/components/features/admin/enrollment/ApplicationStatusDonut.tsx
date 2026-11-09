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
  pending: "#4785F5",
  "for-review": "#F3A43B",
  approved: "#20B77A",
  "needs-requirements": "#EF5365",
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
    <div>
      <div className="relative mx-auto h-[164px] w-full max-w-[220px]" aria-hidden>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={segments}
              dataKey="value"
              nameKey="status"
              innerRadius={52}
              outerRadius={74}
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
                borderRadius: 8,
                border: "1px solid #D8E3F5",
                boxShadow: "0 8px 24px rgba(24,52,111,0.10)",
                fontFamily: "Poppins, sans-serif",
                fontSize: 11,
                color: "#18346F",
              }}
              formatter={(value, name) => [
                String(value),
                ENROLLMENT_STATUS_LABELS[name as DonutSegment["status"]] ?? String(name),
              ]}
            />
          </PieChart>
        </ResponsiveContainer>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-poppins text-[24px] leading-none font-bold text-admin-primary tabular-nums">
            {total.toLocaleString()}
          </span>
          <span className="mt-1 font-poppins text-[9.5px] font-semibold tracking-[0.08em] text-admin-muted uppercase">
            Applications
          </span>
        </div>
      </div>

      <ul className="mt-3 space-y-1.5">
        {segments.map((segment) => {
          const share = Math.round((segment.value / total) * 100);
          return (
            <li key={segment.status} className="flex items-center gap-2">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: segment.color }}
                aria-hidden
              />
              <span className="min-w-0 flex-1 truncate font-poppins text-[11px] text-admin-muted">
                {ENROLLMENT_STATUS_LABELS[segment.status]}
              </span>
              <span className="font-poppins text-[11px] font-semibold text-admin-text tabular-nums">
                {segment.value.toLocaleString()}
              </span>
              <span className="w-9 text-right font-poppins text-[10px] text-admin-muted tabular-nums">
                {share}%
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
