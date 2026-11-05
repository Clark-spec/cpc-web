import type { ProgramBreakdown } from "../../data/enrollmentApplications";

const BAR_COLORS = ["#102A83", "#2449A8", "#4785F5", "#8FB4F9"];

type EnrollmentByProgramProps = {
  programs: ProgramBreakdown[];
};

/** Horizontal program mix; bar width follows the largest program. */
export function EnrollmentByProgram({ programs }: EnrollmentByProgramProps) {
  const max = Math.max(...programs.map((program) => program.count), 1);

  return (
    <ul className="space-y-3">
      {programs.map((program, index) => {
        const width = Math.max(4, Math.round((program.count / max) * 100));
        const color = BAR_COLORS[index % BAR_COLORS.length];

        return (
          <li key={program.code}>
            <div className="flex items-center justify-between gap-2">
              <span className="flex min-w-0 items-center gap-1.5">
                <span className="rounded bg-admin-page px-1.5 py-0.5 font-poppins text-[9.5px] font-bold tracking-[0.04em] text-admin-secondary">
                  {program.code}
                </span>
                <span className="truncate font-poppins text-[11px] font-medium text-admin-text">
                  {program.shortName}
                </span>
              </span>
              <span className="shrink-0 font-poppins text-[10.5px] text-admin-muted tabular-nums">
                <span className="font-semibold text-admin-text">{program.count}</span>
                <span className="ml-1">{program.share}%</span>
              </span>
            </div>

            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-admin-page">
              <span
                className="admin-bar-grow block h-full rounded-full"
                style={{
                  width: `${width}%`,
                  backgroundColor: color,
                  animationDelay: `${120 + index * 110}ms`,
                }}
                aria-hidden
              />
            </div>
            <span className="sr-only">
              {program.name}: {program.count} applications, {program.share}% of the total.
            </span>
          </li>
        );
      })}
    </ul>
  );
}
