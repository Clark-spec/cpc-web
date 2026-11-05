import { useSchedule } from "../hooks/useSchedule";
import { ConflictBanner } from "./ConflictBanner";
import { SubjectListCard } from "./SubjectListCard";
import { WeeklyCalendarSection } from "./WeeklyCalendarSection";

/** Page body for Class Schedules: conflict banner, subject list, and weekly calendar. */
export function ScheduleContent() {
  const { schedule, loading } = useSchedule();
  const hasEntries = schedule.entries.length > 0;

  return (
    <main className="mx-auto w-full max-w-[1280px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      {!loading && hasEntries && <ConflictBanner entries={schedule.entries} />}
      <SubjectListCard />
      <WeeklyCalendarSection />
    </main>
  );
}
