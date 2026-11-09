import { CalendarDays } from "lucide-react";
import { useSchedule } from "@/components/features/student/schedules/useSchedule";
import { ScheduleSummaryCards } from "@/components/features/student/schedules/ScheduleSummaryCards";
import { SectionSelect } from "@/components/features/student/schedules/SectionSelect";
import { SummaryTableSkeleton } from "@/components/features/student/schedules/ScheduleSkeletons";
import { SubjectListTable } from "@/components/features/student/schedules/SubjectListTable";
import { EmptySchedule } from "@/components/features/student/schedules/EmptySchedule";

/** The "My Class Schedules" card: section picker, summary tiles, and subject table. */
export function SubjectListCard() {
  const { schedule, section, setSection, loading, openEntry, updatedCaption } = useSchedule();
  const hasEntries = schedule.entries.length > 0;

  return (
    <section
      aria-labelledby="class-schedules-heading"
      className="rounded-2xl border border-cpc-input-border bg-white shadow-[0_10px_30px_rgba(27,47,158,0.06)] print:border-0 print:shadow-none"
    >
      <div className="flex flex-col gap-4 border-b border-cpc-input-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cpc-section-light text-cpc-blue-accent">
            <CalendarDays className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <h1
              id="class-schedules-heading"
              className="font-poppins text-lg leading-tight font-bold text-cpc-navy-text"
            >
              My Class Schedules
            </h1>
            <p className="mt-0.5 font-poppins text-xs text-cpc-heading-soft">
              {schedule.semester}, AY {schedule.academicYear}
            </p>
            <p className="mt-0.5 font-poppins text-[11px] text-cpc-heading-soft">{updatedCaption}</p>
          </div>
        </div>

        <div className="print:hidden">
          <SectionSelect value={section} onChange={setSection} />
        </div>
      </div>

      <div className="p-4 sm:p-6" aria-busy={loading}>
        {loading ? (
          <SummaryTableSkeleton />
        ) : hasEntries ? (
          <div className="schedule-fade space-y-5">
            <ScheduleSummaryCards schedule={schedule} />
            <SubjectListTable schedule={schedule} onOpenEntry={openEntry} />
          </div>
        ) : (
          <EmptySchedule section={section} />
        )}
      </div>
    </section>
  );
}
