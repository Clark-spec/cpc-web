import type { DayCode } from "../types";

export const DAY_CODES: DayCode[] = ["MON", "TUE", "WED", "THU", "FRI", "SAT"];

export const DAY_LABELS: Record<DayCode, string> = {
  MON: "Mon",
  TUE: "Tue",
  WED: "Wed",
  THU: "Thu",
  FRI: "Fri",
  SAT: "Sat",
};

export const DAY_FULL: Record<DayCode, string> = {
  MON: "Monday",
  TUE: "Tuesday",
  WED: "Wednesday",
  THU: "Thursday",
  FRI: "Friday",
  SAT: "Saturday",
};

/** Monday-first index, used to sort rows by their first meeting day. */
export const DAY_INDEX: Record<DayCode, number> = {
  MON: 1,
  TUE: 2,
  WED: 3,
  THU: 4,
  FRI: 5,
  SAT: 6,
};

/** Calendar window: 7:00 AM to 8:00 PM. */
export const DAY_START_MIN = 7 * 60;
export const DAY_END_MIN = 20 * 60;

/** Vertical size of one hour on the weekly grid. */
export const HOUR_HEIGHT = 64;

const WEEKDAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const pad = (value: number): string => value.toString().padStart(2, "0");

/** "10:00 AM" */
export function formatTime(totalMinutes: number): string {
  const minutes = ((totalMinutes % 1440) + 1440) % 1440;
  const hour24 = Math.floor(minutes / 60);
  const minute = minutes % 60;
  const suffix = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour12}:${pad(minute)} ${suffix}`;
}

/** "10:00 AM – 11:00 AM" */
export function formatTimeRange(startMin: number, endMin: number): string {
  return `${formatTime(startMin)} – ${formatTime(endMin)}`;
}

/** Spoken form for aria-labels: "10:00 AM to 11:00 AM". */
export function formatAriaRange(startMin: number, endMin: number): string {
  return `${formatTime(startMin)} to ${formatTime(endMin)}`;
}

/** "7 AM", "12 PM", "8 PM" for the time axis. */
export function formatHourLabel(hour24: number): string {
  const suffix = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour12} ${suffix}`;
}

/** MWF / TTh / SAT, matching the registrar's shorthand. */
export function daysToLabel(days: DayCode[]): string {
  if (days.length === 1) return DAY_LABELS[days[0]].toUpperCase();
  const abbreviations: Record<DayCode, string> = {
    MON: "M",
    TUE: "T",
    WED: "W",
    THU: "Th",
    FRI: "F",
    SAT: "S",
  };
  return DAY_CODES.filter((day) => days.includes(day))
    .map((day) => abbreviations[day])
    .join("");
}

export function toMinutes(hour: number, minute = 0): number {
  return hour * 60 + minute;
}

/** The grid only shows Monday–Saturday, so Sunday maps to null. */
export function dayFromDate(date: Date): DayCode | null {
  const index = date.getDay();
  if (index === 0) return null;
  return DAY_CODES[index - 1];
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  next.setDate(next.getDate() + days);
  return next;
}

/**
 * Monday of the week containing `date`, shifted by `weekOffset` weeks.
 * Sunday belongs to the week that started the previous Monday.
 */
export function startOfWeek(date: Date, weekOffset = 0): Date {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff + weekOffset * 7);
  return start;
}

export function isSameDate(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** "Mon Oct 5" */
export function formatWeekdayDate(date: Date): string {
  return `${WEEKDAYS_SHORT[date.getDay()]} ${MONTHS_SHORT[date.getMonth()]} ${date.getDate()}`;
}

/** "Monday, October 5, 2026" */
export function formatLongDate(date: Date): string {
  const weekday = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][
    date.getDay()
  ];
  const month = [
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
  ][date.getMonth()];
  return `${weekday}, ${month} ${date.getDate()}, ${date.getFullYear()}`;
}

/** "Oct 5 – Oct 10, 2026" */
export function formatWeekRange(weekStart: Date): string {
  const weekEnd = addDays(weekStart, 5);
  return `${MONTHS_SHORT[weekStart.getMonth()]} ${weekStart.getDate()} – ${
    MONTHS_SHORT[weekEnd.getMonth()]
  } ${weekEnd.getDate()}, ${weekEnd.getFullYear()}`;
}

export function minutesSinceMidnight(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}
