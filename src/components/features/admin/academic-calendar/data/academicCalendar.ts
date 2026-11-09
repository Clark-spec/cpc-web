/**
 * Frontend-only sample data for the admin Academic Calendar dashboard.
 *
 * These records are illustrative demo data that lives in component state.
 * Nothing in this module talks to a backend or a database; the same shape can
 * be wired to the registrar API later without touching the presentation layer.
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

/* -------------------------------------------------------------------------- */
/* Sample data                                                                */
/* -------------------------------------------------------------------------- */

function seed(partial: Omit<AdminCalendarEvent, "createdAt" | "updatedAt">): AdminCalendarEvent {
  return {
    ...partial,
    createdAt: "2026-10-01T09:00:00+08:00",
    updatedAt: "2026-10-28T15:30:00+08:00",
  };
}

/** Illustrative frontend records used until the registrar API is connected. */
export const SAMPLE_EVENTS: AdminCalendarEvent[] = [
  seed({
    id: "evt-001",
    title: "Enrollment Period · Second Semester",
    description:
      "Enrollment opens for continuing and returning students of the second semester. Walk-in and online enrollment counters are both available.",
    category: "enrollment",
    startDate: "2026-11-02",
    endDate: "2026-11-06",
    startTime: "08:00",
    endTime: "16:00",
    allDay: false,
    academicYear: "2026–2027",
    semester: "2nd Semester",
    programs: PROGRAMS,
    targetAudience: "Continuing Students",
    status: "published",
    location: "Registrar's Office",
    organizer: "Office of the Registrar",
  }),
  seed({
    id: "evt-002",
    title: "Opening of Second Semester Classes",
    description:
      "Official first day of classes for the second semester. Students follow their published class schedules.",
    category: "academic-activity",
    startDate: "2026-11-04",
    startTime: "07:30",
    allDay: false,
    academicYear: "2026–2027",
    semester: "2nd Semester",
    programs: PROGRAMS,
    targetAudience: "All Students",
    status: "published",
    location: "CPC Campus",
    organizer: "Office of the Academic Affairs",
  }),
  seed({
    id: "evt-003",
    title: "Student Organization Fair",
    description:
      "Meet the college's student organizations, sign up for clubs, and learn about leadership opportunities for the semester.",
    category: "student",
    startDate: "2026-11-04",
    startTime: "09:00",
    endTime: "15:00",
    allDay: false,
    academicYear: "2026–2027",
    semester: "2nd Semester",
    programs: PROGRAMS,
    targetAudience: "All Students",
    status: "published",
    location: "CPC Quadrangle",
    organizer: "Supreme Student Council",
  }),
  seed({
    id: "evt-004",
    title: "Enrollment Deadline · Second Semester",
    description:
      "Final day to complete enrollment for the second semester. Late enrollees must secure a signed late-enrollment slip.",
    category: "deadline",
    startDate: "2026-11-06",
    startTime: "17:00",
    allDay: false,
    academicYear: "2026–2027",
    semester: "2nd Semester",
    programs: PROGRAMS,
    targetAudience: "Continuing Students",
    status: "published",
    location: "Registrar's Office",
    organizer: "Office of the Registrar",
    department: "Registrar",
  }),
  seed({
    id: "evt-005",
    title: "Add / Drop Period",
    description:
      "Students may add or drop subjects for the second semester. Requests require adviser approval and are subject to slot availability.",
    category: "deadline",
    startDate: "2026-11-09",
    endDate: "2026-11-13",
    startTime: "17:00",
    allDay: false,
    academicYear: "2026–2027",
    semester: "2nd Semester",
    programs: PROGRAMS,
    targetAudience: "All Students",
    status: "published",
    location: "Registrar's Office",
    organizer: "Office of the Registrar",
    department: "Registrar",
  }),
  seed({
    id: "evt-006",
    title: "Submission of Midterm Grade Sheets",
    description:
      "Faculty submit encoded midterm grades through the registrar's grade portal for validation.",
    category: "deadline",
    startDate: "2026-11-11",
    startTime: "17:00",
    allDay: false,
    academicYear: "2026–2027",
    semester: "2nd Semester",
    programs: PROGRAMS,
    targetAudience: "Faculty",
    status: "pending",
    location: "Registrar's Office",
    organizer: "Office of the Registrar",
    department: "Registrar",
    notes: "Grade sheets must carry the dean's signature before submission.",
  }),
  seed({
    id: "evt-007",
    title: "Faculty Evaluation Period",
    description:
      "Students accomplish the online faculty evaluation for the second semester through the student portal.",
    category: "faculty",
    startDate: "2026-11-13",
    endDate: "2026-11-20",
    allDay: true,
    academicYear: "2026–2027",
    semester: "2nd Semester",
    programs: PROGRAMS,
    targetAudience: "All Students",
    status: "published",
    location: "Online · Student Portal",
    organizer: "Office of the Dean",
  }),
  seed({
    id: "evt-008",
    title: "Institutional Planning Workshop",
    description:
      "Administrators, deans, and program heads convene for the mid-year institutional planning workshop.",
    category: "institutional",
    startDate: "2026-11-16",
    startTime: "08:00",
    endTime: "17:00",
    allDay: false,
    academicYear: "2026–2027",
    semester: "2nd Semester",
    programs: [],
    targetAudience: "Staff",
    status: "draft",
    location: "CPC Function Hall",
    organizer: "Office of the President",
  }),
  seed({
    id: "evt-009",
    title: "CPC Research Colloquium",
    description:
      "Undergraduate researchers present their capstone studies before faculty panels and invited guests.",
    category: "academic-activity",
    startDate: "2026-11-18",
    startTime: "08:00",
    endTime: "16:00",
    allDay: false,
    academicYear: "2026–2027",
    semester: "2nd Semester",
    programs: ["BS Information Technology", "BS Education"],
    targetAudience: "All Students",
    status: "pending",
    location: "Audio-Visual Room",
    organizer: "Research and Extension Office",
  }),
  seed({
    id: "evt-010",
    title: "Guidance and Counseling Orientation",
    description:
      "Orientation on the guidance services, counselling schedule, and student wellness programs for the semester.",
    category: "orientation",
    startDate: "2026-11-19",
    startTime: "13:00",
    endTime: "16:00",
    allDay: false,
    academicYear: "2026–2027",
    semester: "2nd Semester",
    programs: ["BS Education", "BEED"],
    targetAudience: "Incoming Freshmen",
    status: "published",
    location: "CPC Gymnasium",
    organizer: "Guidance and Counseling Office",
  }),
  seed({
    id: "evt-011",
    title: "CPC Foundation Day",
    description:
      "Campus-wide celebration with cultural presentations, sports exhibitions, and a student showcase. Classes follow a shortened schedule.",
    category: "school-event",
    startDate: "2026-11-20",
    startTime: "08:00",
    endTime: "17:00",
    allDay: false,
    academicYear: "2026–2027",
    semester: "2nd Semester",
    programs: PROGRAMS,
    targetAudience: "Whole Institution",
    status: "published",
    location: "CPC Grounds",
    organizer: "Foundation Day Committee",
  }),
  seed({
    id: "evt-012",
    title: "Submission of Final Grade Sheets",
    description:
      "Final grades for the second semester are encoded and submitted for registrar validation.",
    category: "deadline",
    startDate: "2026-11-24",
    startTime: "17:00",
    allDay: false,
    academicYear: "2026–2027",
    semester: "2nd Semester",
    programs: PROGRAMS,
    targetAudience: "Faculty",
    status: "published",
    location: "Registrar's Office",
    organizer: "Office of the Registrar",
    department: "Registrar",
  }),
  seed({
    id: "evt-013",
    title: "Faculty Development Seminar",
    description:
      "Capacity-building seminar on outcomes-based assessment and inclusive classroom practices.",
    category: "faculty",
    startDate: "2026-11-26",
    startTime: "08:00",
    endTime: "16:00",
    allDay: false,
    academicYear: "2026–2027",
    semester: "2nd Semester",
    programs: [],
    targetAudience: "Faculty",
    status: "published",
    location: "CPC Function Hall",
    organizer: "Office of the Dean",
  }),
  seed({
    id: "evt-014",
    title: "Student Leadership Summit",
    description:
      "Leadership training for officers of accredited student organizations, hosted by the Supreme Student Council.",
    category: "student",
    startDate: "2026-11-27",
    startTime: "08:00",
    endTime: "17:00",
    allDay: false,
    academicYear: "2026–2027",
    semester: "2nd Semester",
    programs: PROGRAMS,
    targetAudience: "All Students",
    status: "published",
    location: "CPC Gymnasium",
    organizer: "Supreme Student Council",
  }),
  seed({
    id: "evt-015",
    title: "Bonifacio Day",
    description: "Regular national holiday. No classes and no office transactions.",
    category: "holiday",
    startDate: "2026-11-30",
    allDay: true,
    academicYear: "2026–2027",
    semester: "2nd Semester",
    programs: [],
    targetAudience: "Whole Institution",
    status: "published",
    organizer: "National Government",
  }),
  seed({
    id: "evt-016",
    title: "Clearance Submission Deadline",
    description:
      "Students with pending accountabilities must complete their online clearance before the semester ends.",
    category: "deadline",
    startDate: "2026-11-30",
    startTime: "17:00",
    allDay: false,
    academicYear: "2026–2027",
    semester: "2nd Semester",
    programs: PROGRAMS,
    targetAudience: "All Students",
    status: "published",
    location: "Student Affairs Office",
    organizer: "Student Affairs Office",
    department: "SAO",
  }),
  seed({
    id: "evt-017",
    title: "Institutional Faculty Assembly",
    description:
      "General assembly of the faculty council to discuss academic policies and the semester-end calendar.",
    category: "institutional",
    startDate: "2026-12-02",
    startTime: "09:00",
    endTime: "12:00",
    allDay: false,
    academicYear: "2026–2027",
    semester: "2nd Semester",
    programs: [],
    targetAudience: "Faculty",
    status: "published",
    location: "CPC Auditorium",
    organizer: "Faculty Council",
  }),
  seed({
    id: "evt-018",
    title: "Enrollment Period · Summer Term",
    description:
      "Enrollment for the summer term opens. Students who need prerequisite or back subjects may enroll.",
    category: "enrollment",
    startDate: "2026-12-04",
    endDate: "2026-12-09",
    startTime: "08:00",
    endTime: "16:00",
    allDay: false,
    academicYear: "2026–2027",
    semester: "Summer Term",
    programs: PROGRAMS,
    targetAudience: "Continuing Students",
    status: "draft",
    location: "Registrar's Office",
    organizer: "Office of the Registrar",
  }),
  seed({
    id: "evt-019",
    title: "Feast of the Immaculate Conception",
    description: "Special non-working holiday. Classes and office work are suspended.",
    category: "holiday",
    startDate: "2026-12-08",
    allDay: true,
    academicYear: "2026–2027",
    semester: "2nd Semester",
    programs: [],
    targetAudience: "Whole Institution",
    status: "published",
    organizer: "National Government",
  }),
  seed({
    id: "evt-020",
    title: "Graduating Students Orientation",
    description:
      "Orientation on graduation requirements, clearance, and the commencement exercises.",
    category: "orientation",
    startDate: "2026-12-10",
    startTime: "13:00",
    endTime: "16:00",
    allDay: false,
    academicYear: "2026–2027",
    semester: "2nd Semester",
    programs: PROGRAMS,
    targetAudience: "Graduating Students",
    status: "published",
    location: "CPC Auditorium",
    organizer: "Office of the Registrar",
  }),
  seed({
    id: "evt-021",
    title: "Midterm Examinations · Second Semester",
    description:
      "Midterm examinations for all second-semester courses. Check the registrar's bulletin for room assignments.",
    category: "examination",
    startDate: "2026-12-14",
    endDate: "2026-12-18",
    allDay: true,
    academicYear: "2026–2027",
    semester: "2nd Semester",
    programs: PROGRAMS,
    targetAudience: "All Students",
    status: "published",
    location: "Assigned classrooms",
    organizer: "Office of the Academic Affairs",
  }),
  seed({
    id: "evt-022",
    title: "Midterm Grade Submission Deadline",
    description: "Last day for faculty to submit midterm grades for validation.",
    category: "deadline",
    startDate: "2026-12-15",
    startTime: "17:00",
    allDay: false,
    academicYear: "2026–2027",
    semester: "2nd Semester",
    programs: PROGRAMS,
    targetAudience: "Faculty",
    status: "published",
    location: "Registrar's Office",
    organizer: "Office of the Registrar",
    department: "Registrar",
  }),
  seed({
    id: "evt-023",
    title: "Christmas Break",
    description:
      "Holiday break for students and staff. Classes resume on January 4, 2027.",
    category: "holiday",
    startDate: "2026-12-19",
    endDate: "2027-01-03",
    allDay: true,
    academicYear: "2026–2027",
    semester: "2nd Semester",
    programs: [],
    targetAudience: "Whole Institution",
    status: "published",
    organizer: "Office of the President",
  }),
  seed({
    id: "evt-024",
    title: "Faculty Evaluation Deadline",
    description:
      "Final day for students to complete the online faculty evaluation for the semester.",
    category: "deadline",
    startDate: "2026-12-21",
    startTime: "17:00",
    allDay: false,
    academicYear: "2026–2027",
    semester: "2nd Semester",
    programs: PROGRAMS,
    targetAudience: "All Students",
    status: "draft",
    location: "Online · Student Portal",
    organizer: "Office of the Dean",
    department: "Dean's Office",
  }),
  seed({
    id: "evt-025",
    title: "Resumption of Classes",
    description: "Second-semester classes resume after the Christmas break.",
    category: "academic-activity",
    startDate: "2027-01-04",
    startTime: "07:30",
    allDay: false,
    academicYear: "2026–2027",
    semester: "2nd Semester",
    programs: PROGRAMS,
    targetAudience: "All Students",
    status: "published",
    location: "CPC Campus",
    organizer: "Office of the Academic Affairs",
  }),
  seed({
    id: "evt-026",
    title: "Scholarship Application Deadline",
    description:
      "Last day to submit scholarship applications and renewal requirements for the second semester.",
    category: "deadline",
    startDate: "2027-01-08",
    startTime: "17:00",
    allDay: false,
    academicYear: "2026–2027",
    semester: "2nd Semester",
    programs: PROGRAMS,
    targetAudience: "All Students",
    status: "published",
    location: "Student Affairs Office",
    organizer: "Student Affairs Office",
    department: "SAO",
  }),
  seed({
    id: "evt-027",
    title: "Open House and Career Fair",
    description:
      "Prospective students, alumni, and partner employers visit the campus for guided tours and career talks.",
    category: "school-event",
    startDate: "2027-01-22",
    startTime: "09:00",
    endTime: "15:00",
    allDay: false,
    academicYear: "2026–2027",
    semester: "2nd Semester",
    programs: PROGRAMS,
    targetAudience: "All Students",
    status: "pending",
    location: "CPC Gymnasium",
    organizer: "Office of Student Affairs",
  }),
  seed({
    id: "evt-028",
    title: "Student Research Colloquium",
    description:
      "Undergraduate researchers present their capstone studies before faculty panels and invited guests.",
    category: "academic-activity",
    startDate: "2027-02-09",
    startTime: "08:00",
    endTime: "16:00",
    allDay: false,
    academicYear: "2026–2027",
    semester: "2nd Semester",
    programs: ["BS Information Technology", "BS Education"],
    targetAudience: "All Students",
    status: "draft",
    location: "Audio-Visual Room",
    organizer: "Research and Extension Office",
  }),
  seed({
    id: "evt-029",
    title: "Final Examinations · Second Semester",
    description:
      "Final examinations for the second semester. Clear all accountabilities before the examination week.",
    category: "examination",
    startDate: "2027-02-15",
    endDate: "2027-02-19",
    allDay: true,
    academicYear: "2026–2027",
    semester: "2nd Semester",
    programs: PROGRAMS,
    targetAudience: "All Students",
    status: "draft",
    location: "Assigned classrooms",
    organizer: "Office of the Academic Affairs",
  }),
  seed({
    id: "evt-030",
    title: "EDSA People Power Anniversary",
    description: "Special non-working holiday. Classes and office transactions are suspended.",
    category: "holiday",
    startDate: "2027-02-25",
    allDay: true,
    academicYear: "2026–2027",
    semester: "2nd Semester",
    programs: [],
    targetAudience: "Whole Institution",
    status: "published",
    organizer: "National Government",
  }),
  seed({
    id: "evt-031",
    title: "Graduation Requirements Deadline",
    description:
      "Final submission of graduation clearance, academic attire reservation, and deficiency requirements.",
    category: "deadline",
    startDate: "2027-03-02",
    startTime: "17:00",
    allDay: false,
    academicYear: "2026–2027",
    semester: "2nd Semester",
    programs: PROGRAMS,
    targetAudience: "Graduating Students",
    status: "pending",
    location: "Registrar's Office",
    organizer: "Office of the Registrar",
    department: "Registrar",
  }),
  seed({
    id: "evt-032",
    title: "Commencement Exercises",
    description:
      "Graduation rites for the graduating class of A.Y. 2026–2027. Graduates must arrive one hour before the ceremony.",
    category: "graduation",
    startDate: "2027-03-08",
    startTime: "08:00",
    allDay: false,
    academicYear: "2026–2027",
    semester: "2nd Semester",
    programs: PROGRAMS,
    targetAudience: "Graduating Students",
    status: "published",
    location: "CPC Gymnasium",
    organizer: "Office of the President",
  }),
  seed({
    id: "evt-033",
    title: "Summer Term Classes",
    description: "Classes for the summer term. Schedules are posted at the registrar's office.",
    category: "academic-activity",
    startDate: "2027-03-15",
    endDate: "2027-04-09",
    allDay: true,
    academicYear: "2026–2027",
    semester: "Summer Term",
    programs: PROGRAMS,
    targetAudience: "Continuing Students",
    status: "draft",
    location: "CPC Campus",
    organizer: "Office of the Academic Affairs",
  }),
  seed({
    id: "evt-034",
    title: "Midterm Examinations · First Semester",
    description: "Past midterm examination week retained for reference.",
    category: "examination",
    startDate: "2026-10-12",
    endDate: "2026-10-16",
    allDay: true,
    academicYear: "2026–2027",
    semester: "1st Semester",
    programs: PROGRAMS,
    targetAudience: "All Students",
    status: "archived",
    location: "Assigned classrooms",
    organizer: "Office of the Academic Affairs",
  }),
  seed({
    id: "evt-035",
    title: "Faculty Convocation · First Semester",
    description: "Opening convocation for faculty members at the start of the first semester.",
    category: "institutional",
    startDate: "2026-08-03",
    startTime: "08:00",
    endTime: "11:00",
    allDay: false,
    academicYear: "2026–2027",
    semester: "1st Semester",
    programs: [],
    targetAudience: "Faculty",
    status: "published",
    location: "CPC Auditorium",
    organizer: "Office of the President",
  }),
  seed({
    id: "evt-036",
    title: "Campus Christmas Parade",
    description: "Cancelled due to the revised holiday schedule.",
    category: "school-event",
    startDate: "2026-12-12",
    startTime: "15:00",
    endTime: "18:00",
    allDay: false,
    academicYear: "2026–2027",
    semester: "2nd Semester",
    programs: PROGRAMS,
    targetAudience: "All Students",
    status: "cancelled",
    location: "CPC Grounds",
    organizer: "Supreme Student Council",
  }),
  seed({
    id: "evt-037",
    title: "Academic Council Meeting",
    description:
      "Monthly academic council meeting on curriculum updates and student performance review.",
    category: "institutional",
    startDate: "2026-11-05",
    startTime: "14:00",
    endTime: "16:00",
    allDay: false,
    academicYear: "2026–2027",
    semester: "2nd Semester",
    programs: [],
    targetAudience: "Faculty",
    status: "published",
    location: "Board Room",
    organizer: "Office of the Academic Affairs",
  }),
  seed({
    id: "evt-038",
    title: "Barangay Education Summit",
    description: "Community engagement summit with partner barangays. Awaiting final venue confirmation.",
    category: "institutional",
    startDate: "2026-11-07",
    startTime: "08:00",
    endTime: "12:00",
    allDay: false,
    academicYear: "2026–2027",
    semester: "2nd Semester",
    programs: [],
    targetAudience: "Whole Institution",
    status: "cancelled",
    location: "Cordova Municipal Hall",
    organizer: "Community Extension Office",
  }),
];
