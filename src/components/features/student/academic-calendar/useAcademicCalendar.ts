import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  type AcademicEvent,
  type CalendarCategory,
} from "@/components/features/student/academic-calendar/academicCalendar";
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
} from "@/components/features/student/academic-calendar/calendar";
import { getPublishedCalendarEvents } from "@/services/academicCalendar/api";
import { useSSE } from "@/hooks/useSSE";

export type CalendarView = "month" | "week" | "list";
export type CalendarCategoryFilter = CalendarCategory | "all";

/** The single calendar state tree. `useAcademicCalendar` owns it, so it is called once per page. */
export type AcademicCalendar = ReturnType<typeof useAcademicCalendar>;

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
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [fullYearOpen, setFullYearOpen] = useState(false);
  const [fullYear, setFullYear] = useState(() => new Date().getFullYear());
  const [allEvents, setAllEvents] = useState<AcademicEvent[]>([]);
  const [category, setCategory] = useState<CalendarCategoryFilter>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadedOnceRef = useRef(false);

  /** Re-fetches without the loading skeleton so the page never flashes. */
  const refreshSilently = useCallback(async () => {
    try {
      setAllEvents(await getPublishedCalendarEvents());
      setError(null);
    } catch {
      // Keep the current list; the next push or reload retries.
    }
  }, []);

  // Admin saves/publishes arrive over SSE; `connected` also fires after a
  // reconnect, so events missed while offline are pulled in automatically.
  useSSE(
    useCallback(
      (type) => {
        if (type === "academic_calendar_updated") {
          void refreshSilently();
        } else if (type === "connected" && loadedOnceRef.current) {
          void refreshSilently();
        }
      },
      [refreshSilently],
    ),
  );

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setAllEvents(await getPublishedCalendarEvents());
    } catch (loadError) {
      setError(
        loadError instanceof Error && loadError.message
          ? loadError.message
          : "We couldn't load the academic calendar. Please try again.",
      );
    } finally {
      loadedOnceRef.current = true;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function loadInitialData() {
      try {
        const data = await getPublishedCalendarEvents();
        if (!active) return;
        setAllEvents(data);
        setError(null);
      } catch (loadError) {
        if (active) {
          setError(
            loadError instanceof Error && loadError.message
              ? loadError.message
              : "We couldn't load the academic calendar. Please try again.",
          );
        }
      } finally {
        if (active) {
          loadedOnceRef.current = true;
          setLoading(false);
        }
      }
    }

    void loadInitialData();
    return () => {
      active = false;
    };
  }, []);

  const events = useMemo(
    () =>
      category === "all"
        ? allEvents
        : allEvents.filter((event) => event.category === category),
    [allEvents, category],
  );

  /** Derived so an open details modal reflects live updates (e.g. a cancellation). */
  const selectedEvent = useMemo(
    () => (selectedEventId ? (allEvents.find((event) => event.id === selectedEventId) ?? null) : null),
    [allEvents, selectedEventId],
  );

  const categoryCounts = useMemo(
    () =>
      allEvents.reduce<Partial<Record<CalendarCategory, number>>>((counts, event) => {
        counts[event.category] = (counts[event.category] ?? 0) + 1;
        return counts;
      }, {}),
    [allEvents],
  );

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
  const openEvent = (event: AcademicEvent) => setSelectedEventId(event.id);
  const closeEvent = () => setSelectedEventId(null);

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

  const toggleCategory = (next: CalendarCategory) =>
    setCategory((current) => (current === next ? "all" : next));

  return {
    events,
    allEvents,
    categoryCounts,
    category,
    setCategory,
    toggleCategory,
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
    error,
    reload,
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
