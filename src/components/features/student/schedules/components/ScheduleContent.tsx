import { useSchedule } from "../hooks/useSchedule";
import { ConflictBanner } from "./ConflictBanner";
import { ScheduleUpdatedBanner } from "./ScheduleUpdatedBanner";
import { SubjectListCard } from "./SubjectListCard";
import { WeeklyCalendarSection } from "./WeeklyCalendarSection";

/** Page body for Class Schedules: update notice, conflict banner, subject list, and weekly calendar. */
export function ScheduleContent() {
  const { schedule, loading, showUpdateNotice, updatedCaption, dismissUpdateNotice } = useSchedule();
  const hasEntries = schedule.entries.length > 0;

  return (
    <main className="mx-auto w-full max-w-[1280px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      {!loading && showUpdateNotice && (
        <ScheduleUpdatedBanner caption={updatedCaption} onDismiss={dismissUpdateNotice} />
      )}
      {!loading && hasEntries && <ConflictBanner entries={schedule.entries} />}
      <SubjectListCard />
      <WeeklyCalendarSection />
    </main>
  );
}
