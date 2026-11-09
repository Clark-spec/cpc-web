import type { ProgramBreakdown } from "@/services/enrollmentAdmin";

const BAR_COLORS = ["#2b4bd1", "#475da0", "#059669", "#d97706"];

type EnrollmentByProgramProps = {
  programs: ProgramBreakdown[];
};

/** Horizontal program mix; bar width follows the largest program. */
export function EnrollmentByProgram({ programs }: EnrollmentByProgramProps) {
  const max = Math.max(...programs.map((program) => program.count), 1);
  const topProgram = programs[0];

  return (
    <div className="flex h-full flex-col justify-between">
      <ul className="space-y-2">
        {programs.map((program, index) => {
          const width = Math.max(4, Math.round((program.count / max) * 100));
          const color = BAR_COLORS[index % BAR_COLORS.length];

          return (
            <li
              key={program.code}
              className="rounded-xl px-2 py-1.5 transition-colors hover:bg-white/60"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="flex min-w-0 items-center gap-1.5">
                  <span className="rounded-md border border-white/80 bg-cpc-section-light/90 px-1.5 py-0.5 font-poppins text-[9.5px] font-bold text-cpc-navy-text shadow-2xs backdrop-blur-xs">
                    {program.code}
                  </span>
                  <span className="truncate font-poppins text-xs font-medium text-cpc-navy-text">
                    {program.shortName}
                  </span>
                </span>
                <span className="shrink-0 font-poppins text-xs tabular-nums text-cpc-heading-soft">
                  <span className="font-bold text-cpc-navy-text">{program.count}</span>
                  <span className="ml-1 font-semibold text-cpc-heading-soft/90">{program.share}%</span>
                </span>
              </div>

              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full border border-cpc-tile-border/20 bg-cpc-section-light/80">
                <span
                  className="admin-bar-grow block h-full rounded-full transition-all duration-500"
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

      {topProgram && (
        <div className="mt-3 flex items-center justify-between border-t border-cpc-tile-border/40 pt-2.5 font-poppins text-[11px] text-cpc-heading-soft">
          <span className="truncate">
            Top choice: <strong className="text-cpc-navy-text">{topProgram.shortName}</strong>
          </span>
          <span className="font-semibold text-cpc-blue-accent">
            {topProgram.share}% total
          </span>
        </div>
      )}
    </div>
  );
}
