/**
 * Shared types and display helpers for the admin Academic Calendar.
 *
 * These utilities are shared by database-backed calendar views.
 * Calendar records are loaded from the configured API; the same shape can
 * be reused by the presentation layer.
 */

import {
  AlarmClock,
  Archive,
  Ban,
  BookOpen,
  BriefcaseBusiness,
  CalendarCheck2,
  CalendarOff,
  ClipboardCheck,
  FileEdit,
  GraduationCap,
  Megaphone,
  PartyPopper,
  Send,
  Sparkles,
  UserPlus,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/* Event model                                                                */
/* -------------------------------------------------------------------------- */

export type EventCategory =
  | "enrollment"
  | "examination"
  | "school-event"
  | "academic-activity"
  | "holiday"
  | "deadline"
  | "orientation"
  | "graduation"
  | "faculty"
  | "student"
  | "institutional";

export type EventStatus = "draft" | "pending" | "published" | "archived" | "cancelled";

export type AcademicYear = "2025–2026" | "2026–2027" | "2027–2028";
export type Semester = "1st Semester" | "2nd Semester" | "Summer Term";

export type AdminCalendarEvent = {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  /** Inclusive start date, `YYYY-MM-DD`. */
  startDate: string;
  /** Inclusive end date, `YYYY-MM-DD`. */
  endDate?: string;
  /** 24-hour time, e.g. `"08:00"`. */
  startTime?: string;
  endTime?: string;
  allDay: boolean;
  academicYear: AcademicYear;
  semester: Semester;
  programs: string[];
  targetAudience: string;
  status: EventStatus;
  location?: string;
  organizer?: string;
  /** Responsible office for deadlines. */
  department?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type CalendarActivityAction =
  | "created"
  | "updated"
  | "published"
  | "unpublished"
  | "archived"
  | "restored"
  | "cancelled"
  | "deleted"
  | "moved";

export type CalendarActivity = {
  id: string;
  action: CalendarActivityAction;
  eventTitle: string;
  detail?: string;
  at: string;
  status?: EventStatus;
};

/* -------------------------------------------------------------------------- */
/* Category and status metadata                                               */
/* -------------------------------------------------------------------------- */

type CategoryMeta = {
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  hex: string;
  dotClass: string;
  softClass: string;
  borderClass: string;
  textClass: string;
  badgeClass: string;
  barClass: string;
};

export const CATEGORY_ORDER: EventCategory[] = [
  "enrollment",
  "examination",
  "school-event",
  "academic-activity",
  "holiday",
  "deadline",
  "orientation",
  "graduation",
  "faculty",
  "student",
  "institutional",
];

export const CATEGORY_META: Record<EventCategory, CategoryMeta> = {
  enrollment: {
    label: "Enrollment Period",
    shortLabel: "Enrollment",
    icon: UserPlus,
    hex: "#2449A8",
    dotClass: "bg-[#2449A8]",
    softClass: "bg-[#E8EFFC]",
    borderClass: "border-[#C5D6F5]",
    textClass: "text-[#1F3F96]",
    badgeClass: "border-[#C5D6F5] bg-[#E8EFFC] text-[#1F3F96]",
    barClass: "bg-[#2449A8]",
  },
  examination: {
    label: "Examination",
    shortLabel: "Examination",
    icon: ClipboardCheck,
    hex: "#E34B59",
    dotClass: "bg-[#E34B59]",
    softClass: "bg-[#FDEDEF]",
    borderClass: "border-[#F6C9CE]",
    textClass: "text-[#C23545]",
    badgeClass: "border-[#F6C9CE] bg-[#FDEDEF] text-[#C23545]",
    barClass: "bg-[#E34B59]",
  },
  "school-event": {
    label: "School Event",
    shortLabel: "School Event",
    icon: PartyPopper,
    hex: "#8B5CF6",
    dotClass: "bg-[#8B5CF6]",
    softClass: "bg-[#F3EDFF]",
    borderClass: "border-[#DDD0FB]",
    textClass: "text-[#6D3FD1]",
    badgeClass: "border-[#DDD0FB] bg-[#F3EDFF] text-[#6D3FD1]",
    barClass: "bg-[#8B5CF6]",
  },
  "academic-activity": {
    label: "Academic Activity",
    shortLabel: "Academic",
    icon: BookOpen,
    hex: "#20B77A",
    dotClass: "bg-[#20B77A]",
    softClass: "bg-[#E9F7F1]",
    borderClass: "border-[#C4EBDC]",
    textClass: "text-[#128A59]",
    badgeClass: "border-[#C4EBDC] bg-[#E9F7F1] text-[#128A59]",
    barClass: "bg-[#20B77A]",
  },
  holiday: {
    label: "Holiday / No Classes",
    shortLabel: "Holiday",
    icon: CalendarOff,
    hex: "#7183A6",
    dotClass: "bg-[#7183A6]",
    softClass: "bg-[#F0F2F6]",
    borderClass: "border-[#D8DEE9]",
    textClass: "text-[#5B6B8C]",
    badgeClass: "border-[#D8DEE9] bg-[#F0F2F6] text-[#5B6B8C]",
    barClass: "bg-[#7183A6]",
  },
  deadline: {
    label: "Academic Deadline",
    shortLabel: "Deadline",
    icon: AlarmClock,
    hex: "#F3A43B",
    dotClass: "bg-[#F3A43B]",
    softClass: "bg-[#FEF4E7]",
    borderClass: "border-[#F9DDB4]",
    textClass: "text-[#B9761B]",
    badgeClass: "border-[#F9DDB4] bg-[#FEF4E7] text-[#B9761B]",
    barClass: "bg-[#F3A43B]",
  },
  orientation: {
    label: "Orientation",
    shortLabel: "Orientation",
    icon: Megaphone,
    hex: "#06A6C4",
    dotClass: "bg-[#06A6C4]",
    softClass: "bg-[#E6F7FA]",
    borderClass: "border-[#B9E8F0]",
    textClass: "text-[#05819A]",
    badgeClass: "border-[#B9E8F0] bg-[#E6F7FA] text-[#05819A]",
    barClass: "bg-[#06A6C4]",
  },
  graduation: {
    label: "Graduation",
    shortLabel: "Graduation",
    icon: GraduationCap,
    hex: "#C79A2E",
    dotClass: "bg-[#C79A2E]",
    softClass: "bg-[#FBF4E2]",
    borderClass: "border-[#EDDCAF]",
    textClass: "text-[#9A7419]",
    badgeClass: "border-[#EDDCAF] bg-[#FBF4E2] text-[#9A7419]",
    barClass: "bg-[#C79A2E]",
  },
  faculty: {
    label: "Faculty Activity",
    shortLabel: "Faculty",
    icon: BriefcaseBusiness,
    hex: "#0E9F8A",
    dotClass: "bg-[#0E9F8A]",
    softClass: "bg-[#E6F6F3]",
    borderClass: "border-[#B7E5DD]",
    textClass: "text-[#0A7C6C]",
    badgeClass: "border-[#B7E5DD] bg-[#E6F6F3] text-[#0A7C6C]",
    barClass: "bg-[#0E9F8A]",
  },
  student: {
    label: "Student Activity",
    shortLabel: "Student",
    icon: UsersRound,
    hex: "#E05C9E",
    dotClass: "bg-[#E05C9E]",
    softClass: "bg-[#FCEBF4]",
    borderClass: "border-[#F5C7DD]",
    textClass: "text-[#B83E79]",
    badgeClass: "border-[#F5C7DD] bg-[#FCEBF4] text-[#B83E79]",
    barClass: "bg-[#E05C9E]",
  },
  institutional: {
    label: "Institutional Event",
    shortLabel: "Institutional",
    icon: CalendarCheck2,
    hex: "#4655C8",
    dotClass: "bg-[#4655C8]",
    softClass: "bg-[#EAECFB]",
    borderClass: "border-[#C9CFF3]",
    textClass: "text-[#3542A6]",
    badgeClass: "border-[#C9CFF3] bg-[#EAECFB] text-[#3542A6]",
    barClass: "bg-[#4655C8]",
  },
};

type StatusMeta = {
  label: string;
  helper: string;
  icon: LucideIcon;
  badgeClass: string;
  dotClass: string;
  barClass: string;
};

export const STATUS_META: Record<EventStatus, StatusMeta> = {
  draft: {
    label: "Draft",
    helper: "Saved but not published",
    icon: FileEdit,
    badgeClass: "border-slate-200 bg-slate-50 text-slate-600",
    dotClass: "bg-slate-400",
    barClass: "bg-slate-400",
  },
  pending: {
    label: "Pending Review",
    helper: "Waiting for approval",
    icon: Archive,
    badgeClass: "border-amber-200 bg-amber-50 text-amber-700",
    dotClass: "bg-amber-500",
    barClass: "bg-amber-400",
  },
  published: {
    label: "Published",
    helper: "Visible to students",
    icon: Send,
    badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-700",
    dotClass: "bg-emerald-500",
    barClass: "bg-emerald-500",
  },
  archived: {
    label: "Archived",
    helper: "Removed from the active calendar",
    icon: Archive,
    badgeClass: "border-slate-200 bg-slate-100 text-slate-500",
    dotClass: "bg-slate-400",
    barClass: "bg-slate-300",
  },
  cancelled: {
    label: "Cancelled",
    helper: "Event will not take place",
    icon: Ban,
    badgeClass: "border-rose-200 bg-rose-50 text-rose-700",
    dotClass: "bg-rose-500",
    barClass: "bg-rose-400",
  },
};

export const ACTIVITY_META: Record<
  CalendarActivityAction,
  { label: string; icon: LucideIcon; tone: string }
> = {
  created: { label: "Created", icon: Sparkles, tone: "bg-[#E8EFFC] text-[#2449A8]" },
  updated: { label: "Updated", icon: FileEdit, tone: "bg-slate-100 text-slate-600" },
  published: { label: "Published", icon: Send, tone: "bg-emerald-50 text-emerald-700" },
  unpublished: { label: "Unpublished", icon: FileEdit, tone: "bg-amber-50 text-amber-700" },
  archived: { label: "Archived", icon: Archive, tone: "bg-slate-100 text-slate-600" },
  restored: { label: "Restored", icon: CalendarCheck2, tone: "bg-emerald-50 text-emerald-700" },
  cancelled: { label: "Cancelled", icon: Ban, tone: "bg-rose-50 text-rose-700" },
  deleted: { label: "Deleted", icon: Ban, tone: "bg-rose-50 text-rose-700" },
  moved: { label: "Rescheduled", icon: CalendarCheck2, tone: "bg-[#F3EDFF] text-[#6D3FD1]" },
};

export const ACADEMIC_YEARS: AcademicYear[] = ["2025–2026", "2026–2027", "2027–2028"];
export const SEMESTERS: Semester[] = ["1st Semester", "2nd Semester", "Summer Term"];
export const TARGET_AUDIENCES = [
  "All Students",
  "Incoming Freshmen",
  "Continuing Students",
  "Graduating Students",
  "Faculty",
  "Staff",
  "Whole Institution",
];
export const PROGRAMS = [
  "BS Information Technology",
  "BS Education",
  "BEED",
  "BS Hospitality Management",
  "BS Business Administration",
];

/* -------------------------------------------------------------------------- */
/* Date helpers                                                               */
/* -------------------------------------------------------------------------- */

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
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
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

/** Sunday-first, matching the month grid. */
export function startOfWeek(date: Date): Date {
  const day = startOfDay(date);
  return addDays(day, -day.getDay());
}

export function getMonthGrid(monthDate: Date): Date[] {
  const gridStart = startOfWeek(startOfMonth(monthDate));
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

/** Whole calendar days from `from` to `to` (negative when `to` is in the past). */
export function daysBetween(from: Date, to: Date): number {
  const start = startOfDay(from).getTime();
  const end = startOfDay(to).getTime();
  return Math.round((end - start) / 86_400_000);
}

export function formatDateLong(date: Date): string {
  return `${MONTHS_LONG[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

export function formatDateShort(date: Date): string {
  return `${MONTHS_SHORT[date.getMonth()]} ${date.getDate()}`;
}

export function formatDateKey(key: string): string {
  return formatDateLong(parseDateKey(key));
}

export function formatDateKeyShort(key: string): string {
  return formatDateShort(parseDateKey(key));
}

export function formatMonthYear(date: Date): string {
  return `${MONTHS_LONG[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatWeekday(date: Date): string {
  return WEEKDAYS_SHORT[date.getDay()];
}

export function formatTime(time?: string): string {
  if (!time) return "";
  const [hourRaw, minute] = time.split(":").map(Number);
  const suffix = hourRaw >= 12 ? "PM" : "AM";
  const hour = hourRaw % 12 === 0 ? 12 : hourRaw % 12;
  return `${hour}:${String(minute).padStart(2, "0")} ${suffix}`;
}

export function formatTimeRange(event: Pick<AdminCalendarEvent, "allDay" | "startTime" | "endTime">) {
  if (event.allDay) return "All day";
  if (!event.startTime) return "Time to be announced";
  return event.endTime
    ? `${formatTime(event.startTime)} – ${formatTime(event.endTime)}`
    : formatTime(event.startTime);
}

export function formatDateRange(startKey: string, endKey?: string): string {
  const start = parseDateKey(startKey);
  const end = endKey ? parseDateKey(endKey) : start;
  if (isSameDay(start, end)) return formatDateLong(start);
  if (start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth()) {
    return `${MONTHS_SHORT[start.getMonth()]} ${start.getDate()} – ${end.getDate()}, ${end.getFullYear()}`;
  }
  if (start.getFullYear() === end.getFullYear()) {
    return `${MONTHS_SHORT[start.getMonth()]} ${start.getDate()} – ${MONTHS_SHORT[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}`;
  }
  return `${MONTHS_SHORT[start.getMonth()]} ${start.getDate()}, ${start.getFullYear()} – ${MONTHS_SHORT[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}`;
}

export function relativeDayLabel(dateKey: string, today = new Date()): string {
  const diff = daysBetween(today, parseDateKey(dateKey));
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  if (diff > 1) return `In ${diff} days`;
  return `${Math.abs(diff)} days ago`;
}

export function eventOccursOn(event: AdminCalendarEvent, date: Date): boolean {
  const start = parseDateKey(event.startDate).getTime();
  const end = parseDateKey(event.endDate ?? event.startDate).getTime();
  const day = startOfDay(date).getTime();
  return day >= start && day <= end;
}

export function eventsForDate(events: AdminCalendarEvent[], date: Date): AdminCalendarEvent[] {
  return sortEvents(events.filter((event) => eventOccursOn(event, date)));
}

export function sortEvents(events: AdminCalendarEvent[]): AdminCalendarEvent[] {
  return [...events].sort((a, b) => {
    const byStart = a.startDate.localeCompare(b.startDate);
    if (byStart !== 0) return byStart;
    const byTime = (a.startTime ?? "00:00").localeCompare(b.startTime ?? "00:00");
    if (byTime !== 0) return byTime;
    return a.title.localeCompare(b.title);
  });
}

export function eventEndKey(event: AdminCalendarEvent): string {
  return event.endDate ?? event.startDate;
}

export function eventDateRange(event: AdminCalendarEvent): string {
  return formatDateRange(event.startDate, event.endDate);
}

/* -------------------------------------------------------------------------- */
/* Derived dashboard data                                                     */
/* -------------------------------------------------------------------------- */

export type CalendarStats = {
  total: number;
  upcoming: number;
  published: number;
  draft: number;
  pending: number;
  thisWeek: number;
  deadlinesSoon: number;
  completed: number;
  cancelled: number;
};

export function getCalendarStats(events: AdminCalendarEvent[], today = new Date()): CalendarStats {
  const todayKey = toDateKey(today);
  const in30 = toDateKey(addDays(today, 30));
  const weekStart = toDateKey(startOfWeek(today));
  const weekEnd = toDateKey(addDays(startOfWeek(today), 6));

  const active = events.filter(
    (event) => event.status !== "archived" && event.status !== "cancelled",
  );

  return {
    total: events.length,
    upcoming: active.filter(
      (event) => eventEndKey(event) >= todayKey && event.startDate <= in30,
    ).length,
    published: events.filter((event) => event.status === "published").length,
    draft: events.filter((event) => event.status === "draft").length,
    pending: events.filter((event) => event.status === "pending").length,
    thisWeek: active.filter(
      (event) =>
        eventOccursOn(event, parseDateKey(weekStart)) ||
        (event.startDate >= weekStart && event.startDate <= weekEnd),
    ).length,
    deadlinesSoon: events.filter((event) => {
      if (event.category !== "deadline" || event.status === "archived") return false;
      const diff = daysBetween(today, parseDateKey(eventEndKey(event)));
      return diff >= 0 && diff <= 7;
    }).length,
    completed: events.filter(
      (event) => eventEndKey(event) < todayKey && event.status === "published",
    ).length,
    cancelled: events.filter((event) => event.status === "cancelled").length,
  };
}

export type DeadlineState = {
  days: number;
  tone: "overdue" | "today" | "soon" | "upcoming";
  label: string;
  badgeClass: string;
  dotClass: string;
};

export function getDeadlineState(
  event: AdminCalendarEvent,
  today = new Date(),
): DeadlineState {
  const days = daysBetween(today, parseDateKey(eventEndKey(event)));
  if (days < 0) {
    return {
      days,
      tone: "overdue",
      label: `Overdue by ${Math.abs(days)} ${Math.abs(days) === 1 ? "day" : "days"}`,
      badgeClass: "border-rose-200 bg-rose-50 text-rose-700",
      dotClass: "bg-rose-500",
    };
  }
  if (days === 0) {
    return {
      days,
      tone: "today",
      label: "Due today",
      badgeClass: "border-rose-200 bg-rose-50 text-rose-700",
      dotClass: "bg-rose-500",
    };
  }
  if (days <= 7) {
    return {
      days,
      tone: "soon",
      label: `${days} ${days === 1 ? "day" : "days"} left`,
      badgeClass: "border-amber-200 bg-amber-50 text-amber-700",
      dotClass: "bg-amber-500",
    };
  }
  return {
    days,
    tone: "upcoming",
    label: `${days} days left`,
    badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-700",
    dotClass: "bg-emerald-500",
  };
}

export function getCategoryCounts(events: AdminCalendarEvent[]): Record<EventCategory, number> {
  const counts = Object.fromEntries(
    CATEGORY_ORDER.map((category) => [category, 0]),
  ) as Record<EventCategory, number>;
  for (const event of events) counts[event.category] += 1;
  return counts;
}

export type StatusCounts = Record<EventStatus, number>;

export function getStatusCounts(events: AdminCalendarEvent[]): StatusCounts {
  const counts: StatusCounts = {
    draft: 0,
    pending: 0,
    published: 0,
    archived: 0,
    cancelled: 0,
  };
  for (const event of events) counts[event.status] += 1;
  return counts;
}

export function getCalendarRange(events: AdminCalendarEvent[]): string {
  if (events.length === 0) return "No dates in the current selection";
  const sorted = sortEvents(events);
  const first = sorted[0];
  let last = sorted[sorted.length - 1];
  for (const event of sorted) {
    if (eventEndKey(event) > eventEndKey(last)) last = event;
  }
  return formatDateRange(first.startDate, eventEndKey(last));
}
