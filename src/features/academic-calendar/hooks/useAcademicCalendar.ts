import { useEffect, useMemo, useState } from "react";
import {
  CALENDAR_EVENTS,
  type AcademicEvent,
} from "../data/academicCalendar";
import {
  addDays,
  addMonths,
  endOfMonth,
  eventsInMonth,
  eventsInRange,
  getWeekGrid,
  parseDateKey,
  sortEvents,
  startOfDay,
  startOfMonth,
} from "../lib/calendar";

export type CalendarView = "month" | "week" | "list";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function useAcademicCalendar() {
  const [view, setView] = useState<CalendarView>("month");
  const [anchor, setAnchor] = useState<Date>(() => startOfDay(new Date()));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<AcademicEvent | null>(null);
  const [fullYearOpen, setFullYearOpen] = useState(false);
  const [fullYear, setFullYear] = useState(() => new Date().getFullYear());
  const [loading, setLoading] = useState(true);

  /* Short simulated load so the skeleton state is visible on first paint. */
  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 420);
    return () => window.clearTimeout(timer);
  }, []);

  const events = CALENDAR_EVENTS;

  const monthEvents = useMemo(() => eventsInMonth(events, anchor), [events, anchor]);
  const weekDays = useMemo(() => getWeekGrid(anchor), [anchor]);

  const yearEvents = useMemo(() => {
    const start = new Date(anchor.getFullYear(), 0, 1);
    const end = new Date(anchor.getFullYear(), 11, 31);
    return eventsInRange(events, start, end);
  }, [events, anchor]);

  const featuredEvents = useMemo(
    () => sortEvents(events.filter((event) => event.featured)),
    [events],
  );

  /** Featured dates for the selected month, topped up with the next ones. */
  const keyDates = useMemo(() => {
    const monthStart = startOfMonth(anchor);
    const monthEnd = endOfMonth(anchor);
    const inMonth = featuredEvents.filter((event) => {
      const start = parseDateKey(event.start);
      const end = parseDateKey(event.end ?? event.start);
      return start <= monthEnd && end >= monthStart;
    });
    if (inMonth.length >= 5) return inMonth.slice(0, 5);
    const upcoming = featuredEvents.filter(
      (event) => parseDateKey(event.start) > monthEnd && !inMonth.includes(event),
    );
    return [...inMonth, ...upcoming].slice(0, 5);
  }, [anchor, featuredEvents]);

  /** Chronological events from the selected month onward. */
  const upcoming = useMemo(() => {
    const monthStart = startOfMonth(anchor);
    return sortEvents(
      events.filter((event) => parseDateKey(event.end ?? event.start) >= monthStart),
    );
  }, [anchor, events]);

  const reminders = useMemo(() => {
    const today = startOfDay(new Date());
    const upcomingReminders = sortEvents(
      events.filter(
        (event) =>
          event.reminder && parseDateKey(event.end ?? event.start) >= today,
      ),
    );
    return upcomingReminders.slice(0, 2);
  }, [events]);

  const title = useMemo(() => {
    if (view === "week") {
      const first = weekDays[0];
      const last = weekDays[weekDays.length - 1];
      if (first.getMonth() === last.getMonth()) {
        return `${MONTHS[first.getMonth()]} ${first.getDate()} – ${last.getDate()}, ${last.getFullYear()}`;
      }
      return `${MONTHS[first.getMonth()]} ${first.getDate()} – ${MONTHS[last.getMonth()]} ${last.getDate()}, ${last.getFullYear()}`;
    }
    return `${MONTHS[anchor.getMonth()]} ${anchor.getFullYear()}`;
  }, [anchor, view, weekDays]);

  const goPrevious = () => {
    setAnchor((current) =>
      view === "week" ? addDays(current, -7) : startOfMonth(addMonths(current, -1)),
    );
  };

  const goNext = () => {
    setAnchor((current) =>
      view === "week" ? addDays(current, 7) : startOfMonth(addMonths(current, 1)),
    );
  };

  const goToday = () => setAnchor(startOfDay(new Date()));

  const openDay = (date: Date) => setSelectedDate(startOfDay(date));
  const closeDay = () => setSelectedDate(null);
  const openEvent = (event: AcademicEvent) => setSelectedEvent(event);
  const closeEvent = () => setSelectedEvent(null);

  const openFullYear = () => {
    setFullYear(anchor.getFullYear());
    setFullYearOpen(true);
  };
  const closeFullYear = () => setFullYearOpen(false);

  const selectMonth = (date: Date) => {
    setAnchor(startOfMonth(date));
    setView("month");
    setFullYearOpen(false);
  };

  return {
    events,
    view,
    setView,
    anchor,
    title,
    weekDays,
    monthEvents,
    yearEvents,
    keyDates,
    upcoming,
    reminders,
    loading,
    selectedDate,
    selectedEvent,
    fullYearOpen,
    fullYear,
    setFullYear,
    goPrevious,
    goNext,
    goToday,
    openDay,
    closeDay,
    openEvent,
    closeEvent,
    openFullYear,
    closeFullYear,
    selectMonth,
  };
}
