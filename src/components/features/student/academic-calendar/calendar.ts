import { jsPDF } from "jspdf";
import {
  CALENDAR_EVENTS,
  CATEGORY_META,
  type AcademicEvent,
  type CalendarCategory,
} from "@/components/features/student/academic-calendar/academicCalendar";

const MONTHS_LONG = [
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

const MONTHS_SHORT = MONTHS_LONG.map((month) => month.slice(0, 3));
const WEEKDAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function parseDateKey(key: string): Date {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDays(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount);
}

export function addMonths(date: Date, amount: number): Date {
  const target = new Date(date.getFullYear(), date.getMonth() + amount, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(date.getDate(), lastDay));
  return target;
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

/** Sunday-first week start, matching the month grid. */
export function startOfWeek(date: Date): Date {
  const day = startOfDay(date);
  return addDays(day, -day.getDay());
}

/** 42 cells (six weeks) covering the month, Sunday-first. */
export function getMonthGrid(monthDate: Date): Date[] {
  const first = startOfMonth(monthDate);
  const gridStart = startOfWeek(first);
  return Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
}

export function getWeekGrid(anchor: Date): Date[] {
  const weekStart = startOfWeek(anchor);
  return Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

export function eachDay(start: Date, end: Date): Date[] {
  const days: Date[] = [];
  let cursor = startOfDay(start);
  const last = startOfDay(end);
  while (cursor <= last) {
    days.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return days;
}

export function eventOccursOn(event: AcademicEvent, date: Date): boolean {
  const start = parseDateKey(event.start);
  const end = event.end ? parseDateKey(event.end) : start;
  const day = startOfDay(date).getTime();
  return day >= start.getTime() && day <= end.getTime();
}

export function eventsForDate(events: AcademicEvent[], date: Date): AcademicEvent[] {
  return events.filter((event) => eventOccursOn(event, date));
}

export function eventsInRange(events: AcademicEvent[], start: Date, end: Date): AcademicEvent[] {
  const rangeStart = startOfDay(start).getTime();
  const rangeEnd = startOfDay(end).getTime();
  return events.filter((event) => {
    const eventStart = parseDateKey(event.start).getTime();
    const eventEnd = parseDateKey(event.end ?? event.start).getTime();
    return eventStart <= rangeEnd && eventEnd >= rangeStart;
  });
}

export function sortEvents(events: AcademicEvent[]): AcademicEvent[] {
  return [...events].sort((a, b) => {
    const byStart = a.start.localeCompare(b.start);
    if (byStart !== 0) return byStart;
    return a.title.localeCompare(b.title);
  });
}

/** Compact label for narrow day cells; falls back to the full title. */
export function eventShortTitle(event: AcademicEvent): string {
  return event.shortTitle ?? event.title;
}

export function eventsInMonth(events: AcademicEvent[], monthDate: Date): AcademicEvent[] {
  return sortEvents(eventsInRange(events, startOfMonth(monthDate), endOfMonth(monthDate)));
}

export function formatMonthYear(date: Date): string {
  return `${MONTHS_LONG[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatMonthShort(date: Date): string {
  return MONTHS_SHORT[date.getMonth()];
}

export function formatDayLabel(date: Date): string {
  const weekday = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ][date.getDay()];
  return `${weekday}, ${MONTHS_LONG[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

export function formatShortDate(date: Date): string {
  return `${MONTHS_SHORT[date.getMonth()]} ${date.getDate()}`;
}

export function formatWeekRange(days: Date[]): string {
  if (days.length === 0) return "";
  const first = days[0];
  const last = days[days.length - 1];
  if (first.getMonth() === last.getMonth()) {
    return `${MONTHS_SHORT[first.getMonth()]} ${first.getDate()} – ${last.getDate()}, ${last.getFullYear()}`;
  }
  if (first.getFullYear() === last.getFullYear()) {
    return `${MONTHS_SHORT[first.getMonth()]} ${first.getDate()} – ${MONTHS_SHORT[last.getMonth()]} ${last.getDate()}, ${last.getFullYear()}`;
  }
  return `${MONTHS_SHORT[first.getMonth()]} ${first.getDate()}, ${first.getFullYear()} – ${MONTHS_SHORT[last.getMonth()]} ${last.getDate()}, ${last.getFullYear()}`;
}

export function formatEventDate(event: AcademicEvent): string {
  const start = parseDateKey(event.start);
  const end = parseDateKey(event.end ?? event.start);
  if (isSameDay(start, end)) {
    return `${MONTHS_LONG[start.getMonth()]} ${start.getDate()}, ${start.getFullYear()}`;
  }
  if (start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth()) {
    return `${MONTHS_LONG[start.getMonth()]} ${start.getDate()} – ${end.getDate()}, ${end.getFullYear()}`;
  }
  if (start.getFullYear() === end.getFullYear()) {
    return `${MONTHS_LONG[start.getMonth()]} ${start.getDate()} – ${MONTHS_LONG[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}`;
  }
  return `${MONTHS_LONG[start.getMonth()]} ${start.getDate()}, ${start.getFullYear()} – ${MONTHS_LONG[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}`;
}

export function formatEventDateShort(event: AcademicEvent): string {
  const start = parseDateKey(event.start);
  const end = parseDateKey(event.end ?? event.start);
  if (isSameDay(start, end)) return formatShortDate(start);
  if (start.getMonth() === end.getMonth()) {
    return `${MONTHS_SHORT[start.getMonth()]} ${start.getDate()} – ${end.getDate()}`;
  }
  return `${formatShortDate(start)} – ${formatShortDate(end)}`;
}

export function formatTime(event: AcademicEvent): string {
  return event.allDay ? "All day" : (event.time ?? "Time to be announced");
}

export function formatDateBox(date: Date): { month: string; day: string; weekday: string } {
  return {
    month: MONTHS_SHORT[date.getMonth()].toUpperCase(),
    day: String(date.getDate()),
    weekday: WEEKDAYS_SHORT[date.getDay()],
  };
}

function hexToTuple(hex: string): [number, number, number] {
  const value = hex.replace("#", "");
  return [
    Number.parseInt(value.slice(0, 2), 16),
    Number.parseInt(value.slice(2, 4), 16),
    Number.parseInt(value.slice(4, 6), 16),
  ];
}

const NAVY: [number, number, number] = [16, 42, 131];
const INK: [number, number, number] = [23, 43, 92];
const MUTED: [number, number, number] = [113, 128, 157];
const LINE: [number, number, number] = [220, 230, 248];
const SOFT: [number, number, number] = [234, 241, 255];

/**
 * Builds a printable PDF of the sample academic calendar. This runs entirely in
 * the browser through jsPDF — no network request and no backend involved.
 */
export function downloadAcademicCalendarPdf(
  events: AcademicEvent[] = CALENDAR_EVENTS,
  academicYear = "2026–2027",
): string {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  const footerSpace = 16;
  let y = 0;
  let page = 1;

  const drawHeader = () => {
    doc.setFillColor(...NAVY);
    doc.rect(0, 0, pageWidth, 36, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.text("Republic of the Philippines", margin, 10);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("CORDOVA PUBLIC COLLEGE", margin, 17);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("Gabi, Cordova, Cebu  ·  Office of the Registrar", margin, 22.5);

    doc.setFontSize(7);
    doc.text("ACADEMIC CALENDAR", margin, 30);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(`A.Y. ${academicYear}`, pageWidth - margin, 17, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text("Official dates and school activities", pageWidth - margin, 22.5, { align: "right" });

    y = 44;
  };

  const drawFooter = () => {
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(...MUTED);
    doc.text("Cordova Public College · Academic Calendar", margin, pageHeight - 7.5);
    doc.text(`Page ${page}`, pageWidth - margin, pageHeight - 7.5, { align: "right" });
  };

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - footerSpace) {
      drawFooter();
      doc.addPage();
      page += 1;
      y = 20;
      doc.setTextColor(...INK);
    }
  };

  drawHeader();

  // Legend -----------------------------------------------------------------
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...INK);
  doc.text("CATEGORY LEGEND", margin, y);
  y += 5;

  let legendX = margin;
  let legendY = y;
  const legendWidth = contentWidth / 3;
  (Object.keys(CATEGORY_META) as CalendarCategory[]).forEach((key) => {
    const meta = CATEGORY_META[key];
    if (legendX + legendWidth > pageWidth - margin) {
      legendX = margin;
      legendY += 6;
    }
    doc.setFillColor(...hexToTuple(meta.color));
    doc.circle(legendX + 1.5, legendY - 1, 1.4, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...INK);
    doc.text(meta.pluralLabel, legendX + 5, legendY);
    legendX += legendWidth;
  });
  y = legendY + 8;

  // Events grouped by month ------------------------------------------------
  const ordered = sortEvents(events);
  let currentMonthKey = "";

  ordered.forEach((event) => {
    const start = parseDateKey(event.start);
    const monthKey = `${start.getFullYear()}-${start.getMonth()}`;

    if (monthKey !== currentMonthKey) {
      currentMonthKey = monthKey;
      ensureSpace(16);
      doc.setFillColor(...SOFT);
      doc.roundedRect(margin, y, contentWidth, 8, 1.5, 1.5, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...NAVY);
      doc.text(`${formatMonthYear(start).toUpperCase()}`, margin + 3, y + 5.4);
      y += 12;
    }

    ensureSpace(14);

    const meta = CATEGORY_META[event.category];
    const color = hexToTuple(meta.color);

    doc.setFillColor(...color);
    doc.rect(margin, y - 2.6, 1.4, 9, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...INK);
    doc.text(event.title, margin + 5, y);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...MUTED);
    const dateLabel = formatEventDate(event);
    const timeLabel = event.allDay ? "" : ` · ${event.time ?? "Time to be announced"}`;
    doc.text(`${dateLabel}${timeLabel}`, margin + 5, y + 4);

    doc.setTextColor(...color);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.text(meta.label.toUpperCase(), pageWidth - margin, y, { align: "right" });

    y += 11;
  });

  // Closing note -----------------------------------------------------------
  ensureSpace(18);
  y += 2;
  doc.setDrawColor(...LINE);
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(...MUTED);
  doc.text(
    "Dates are for student reference and may change. Watch official college announcements for updates.",
    margin,
    y,
  );

  drawFooter();

  const fileName = `CPC-Academic-Calendar-AY-${academicYear.replace("–", "-")}.pdf`;
  doc.save(fileName);
  return fileName;
}
