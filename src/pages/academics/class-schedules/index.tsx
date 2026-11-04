import { CalendarDays } from "lucide-react";
import { PortalFooter } from "@/components/common/portal-footer";
import { PortalHeader } from "@/components/common/portal-header";
import { ConflictBanner } from "@/features/schedules/components/ConflictBanner";
import { PageHero } from "@/features/schedules/components/PageHero";
import { RegistrarHelpCard, ScheduleLegend } from "@/features/schedules/components/ScheduleLegend";
import { ScheduleSummaryCards } from "@/features/schedules/components/ScheduleSummaryCards";
import { SectionSelect } from "@/features/schedules/components/SectionSelect";
import { CalendarSkeleton, SummaryTableSkeleton } from "@/features/schedules/components/ScheduleSkeletons";
import { SubjectDetailsModal } from "@/features/schedules/components/SubjectDetailsModal";
import { SubjectListTable } from "@/features/schedules/components/SubjectListTable";
import { ToastProvider } from "@/components/ui/toast";
import { WeeklyCalendar } from "@/features/schedules/components/WeeklyCalendar";
import { ScheduleProvider, useSchedule } from "@/features/schedules/hooks/useSchedule";

/** Route: /academics/class-schedules */
export default function ClassSchedulesPage() {
  return (
    <ToastProvider>
      <ScheduleProvider>
        <ClassSchedulesContent />
      </ScheduleProvider>
    </ToastProvider>
  );
}

function ClassSchedulesContent() {
  const {
    schedule,
    section,
    setSection,
    loading,
    selectedEntry,
    openEntry,
    closeEntry,
  } = useSchedule();

  const hasEntries = schedule.entries.length > 0;

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-white font-poppins">
      <PortalHeader />
      <PageHero />

      <main className="mx-auto w-full max-w-[1280px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {!loading && hasEntries && <ConflictBanner entries={schedule.entries} />}

        {/* Subject list card */}
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

        {/* Weekly calendar + legend */}
        <section aria-labelledby="weekly-calendar-heading" className="mt-6">
          {/* Tablet / mobile: chips above the calendar. */}
          <div className="mb-4 xl:hidden print:hidden">
            <ScheduleLegend entries={schedule.entries} layout="chips" />
          </div>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_18rem]">
            <div className="min-w-0 overflow-hidden rounded-2xl border border-cpc-input-border bg-white shadow-[0_10px_30px_rgba(27,47,158,0.06)] print:border-0 print:shadow-none">
              <div className="flex items-center justify-between gap-3 border-b border-cpc-input-border px-4 py-4 sm:px-6">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cpc-section-light text-cpc-blue-accent">
                    <CalendarDays className="h-4 w-4" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <h2
                      id="weekly-calendar-heading"
                      className="font-poppins text-base leading-tight font-bold text-cpc-navy-text"
                    >
                      Weekly Calendar
                    </h2>
                    <p className="mt-0.5 font-poppins text-[11px] text-cpc-heading-soft">
                      Monday to Saturday · 7:00 AM – 8:00 PM
                    </p>
                  </div>
                </div>
              </div>

              <div aria-busy={loading}>
                {loading ? (
                  <CalendarSkeleton />
                ) : hasEntries ? (
                  <div className="schedule-fade">
                    <WeeklyCalendar schedule={schedule} onOpenEntry={openEntry} />
                  </div>
                ) : (
                  <div className="px-4 py-12 text-center">
                    <p className="font-poppins text-sm font-semibold text-cpc-navy-text">
                      No weekly calendar to show
                    </p>
                    <p className="mt-1 font-poppins text-xs text-cpc-heading-soft">
                      This section has no classes yet.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Desktop: sticky legend + registrar card. */}
            <aside className="hidden xl:block print:hidden">
              <div className="sticky top-6 space-y-4">
                <ScheduleLegend entries={schedule.entries} layout="sidebar" />
                <RegistrarHelpCard />
              </div>
            </aside>
          </div>

          {/* Tablet / mobile: registrar card below the calendar. */}
          <div className="mt-4 xl:hidden print:hidden">
            <RegistrarHelpCard />
          </div>
        </section>
      </main>

      <PortalFooter />

      <SubjectDetailsModal entry={selectedEntry} onClose={closeEntry} />
    </div>
  );
}

function EmptySchedule({ section }: { section: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-cpc-tile-border bg-cpc-section-light/40 px-4 py-12 text-center">
      <CalendarDays className="h-9 w-9 text-cpc-muted-blue" aria-hidden />
      <p className="mt-3 font-poppins text-sm font-semibold text-cpc-navy-text">
        No schedule available for {section}
      </p>
      <p className="mt-1 max-w-md font-poppins text-xs leading-relaxed text-cpc-heading-soft">
        The registrar has not published a class schedule for this section yet. Please check back
        later or contact your registrar&rsquo;s office.
      </p>
    </div>
  );
}
