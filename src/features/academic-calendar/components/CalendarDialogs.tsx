import { eventsForDate } from "../lib/calendar";
import type { AcademicEvent } from "../data/academicCalendar";
import { DayEventsModal } from "./DayEventsModal";
import { EventDetailsModal } from "./EventDetailsModal";
import { FullYearModal } from "./FullYearModal";
import type { AcademicCalendar } from "../hooks/useAcademicCalendar";

/** The three dialogs the calendar opens: event details, day agenda, and full year. */
export function CalendarDialogs({ calendar }: { calendar: AcademicCalendar }) {
  const dayEvents =
    calendar.selectedDate === null
      ? []
      : eventsForDate(calendar.events, calendar.selectedDate);

  const handleOpenEventFromDay = (event: AcademicEvent) => {
    calendar.closeDay();
    calendar.openEvent(event);
  };

  return (
    <>
      <EventDetailsModal
        event={calendar.selectedEvent}
        onClose={calendar.closeEvent}
        onViewDay={(date) => {
          calendar.closeEvent();
          calendar.openDay(date);
        }}
      />
      <DayEventsModal
        date={calendar.selectedDate}
        events={dayEvents}
        onClose={calendar.closeDay}
        onOpenEvent={handleOpenEventFromDay}
      />
      <FullYearModal
        open={calendar.fullYearOpen}
        year={calendar.fullYear}
        events={calendar.events}
        onChangeYear={(delta) => calendar.setFullYear(calendar.fullYear + delta)}
        onSelectMonth={calendar.selectMonth}
        onClose={calendar.closeFullYear}
      />
    </>
  );
}
