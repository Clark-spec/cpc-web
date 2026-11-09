import { formatMonthYear } from "@/components/features/student/academic-calendar/calendar";
import { AcademicReminders } from "@/components/features/student/academic-calendar/AcademicReminders";
import { CalendarCard } from "@/components/features/student/academic-calendar/CalendarCard";
import { CalendarLegend } from "@/components/features/student/academic-calendar/CalendarLegend";
import { KeyAcademicDates } from "@/components/features/student/academic-calendar/KeyAcademicDates";
import { UpcomingDates } from "@/components/features/student/academic-calendar/UpcomingDates";
import type { AcademicCalendar } from "@/components/features/student/academic-calendar/useAcademicCalendar";

/** Two-column body: calendar and key dates on the left, upcoming and reminders on the right. */
export function CalendarColumns({ calendar }: { calendar: AcademicCalendar }) {
  const monthLabel = formatMonthYear(calendar.anchor);

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.9fr)_minmax(0,1fr)] xl:gap-5">
      <div className="min-w-0 space-y-4 xl:space-y-5">
        <CalendarCard
          view={calendar.view}
          onChangeView={calendar.setView}
          title={calendar.title}
          monthDate={calendar.anchor}
          weekDays={calendar.weekDays}
          events={calendar.events}
          monthEvents={calendar.monthEvents}
          loading={calendar.loading}
          onPrevious={calendar.goPrevious}
          onNext={calendar.goNext}
          onToday={calendar.goToday}
          onOpenEvent={calendar.openEvent}
          onOpenDay={calendar.openDay}
        />

        <KeyAcademicDates
          dates={calendar.keyDates}
          monthLabel={monthLabel}
          loading={calendar.loading}
          onOpenEvent={calendar.openEvent}
        />
      </div>

      <div className="min-w-0 space-y-4 xl:space-y-5">
        <UpcomingDates
          events={calendar.upcoming}
          monthLabel={monthLabel}
          loading={calendar.loading}
          onOpenEvent={calendar.openEvent}
        />
        <AcademicReminders
          reminders={calendar.reminders}
          onOpenEvent={calendar.openEvent}
        />
        <CalendarLegend />
      </div>
    </div>
  );
}
