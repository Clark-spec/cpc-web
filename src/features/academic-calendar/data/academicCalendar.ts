import {
  AlarmClock,
  BookOpen,
  CalendarOff,
  ClipboardCheck,
  Sparkles,
  UserPlus,
  type LucideIcon,
} from "lucide-react";

/**
 * Frontend-only sample calendar. Every event below is local demo data for the
 * Academic Calendar page; nothing here is fetched from a backend.
 */

export type CalendarCategory =
  | "enrollment"
  | "examinations"
  | "holiday"
  | "school-events"
  | "enrollment-deadline"
  | "academic-activities";

export type AcademicEvent = {
  id: string;
  title: string;
  /** Compact label used inside month-view day cells. */
  shortTitle?: string;
  category: CalendarCategory;
  /** Inclusive start date, `YYYY-MM-DD`. */
  start: string;
  /** Inclusive end date for multi-day events, `YYYY-MM-DD`. */
  end?: string;
  allDay?: boolean;
  time?: string;
  location?: string;
  description: string;
  /** Shown in the Key Academic Dates card. */
  featured?: boolean;
  /** Shown in the Academic Reminders card. */
  reminder?: boolean;
  reminderNote?: string;
};

type CategoryMeta = {
  label: string;
  pluralLabel: string;
  icon: LucideIcon;
  /** Hex colour used by the PDF export and decorative dots. */
  color: string;
  dotClass: string;
  softClass: string;
  borderClass: string;
  textClass: string;
  badgeClass: string;
};

export const ACADEMIC_YEAR = "2026–2027";
export const ACADEMIC_YEAR_START = 2026;

export const CATEGORY_ORDER: CalendarCategory[] = [
  "enrollment",
  "examinations",
  "holiday",
  "school-events",
  "enrollment-deadline",
  "academic-activities",
];

export const CATEGORY_META: Record<CalendarCategory, CategoryMeta> = {
  enrollment: {
    label: "Enrollment",
    pluralLabel: "Enrollment",
    icon: UserPlus,
    color: "#24A56A",
    dotClass: "bg-ac-enrollment",
    softClass: "bg-ac-enrollment-soft",
    borderClass: "border-ac-enrollment/30",
    textClass: "text-ac-enrollment",
    badgeClass: "border-ac-enrollment/30 bg-ac-enrollment-soft text-ac-enrollment",
  },
  examinations: {
    label: "Examination",
    pluralLabel: "Examinations",
    icon: ClipboardCheck,
    color: "#E34B59",
    dotClass: "bg-ac-exam",
    softClass: "bg-ac-exam-soft",
    borderClass: "border-ac-exam/30",
    textClass: "text-ac-exam",
    badgeClass: "border-ac-exam/30 bg-ac-exam-soft text-ac-exam",
  },
  holiday: {
    label: "Holiday",
    pluralLabel: "Holidays",
    icon: CalendarOff,
    color: "#71809D",
    dotClass: "bg-ac-holiday",
    softClass: "bg-ac-holiday-soft",
    borderClass: "border-ac-holiday/30",
    textClass: "text-ac-holiday",
    badgeClass: "border-ac-holiday/30 bg-ac-holiday-soft text-ac-holiday",
  },
  "school-events": {
    label: "School Event",
    pluralLabel: "School Events",
    icon: Sparkles,
    color: "#9665E8",
    dotClass: "bg-ac-event",
    softClass: "bg-ac-event-soft",
    borderClass: "border-ac-event/30",
    textClass: "text-ac-event",
    badgeClass: "border-ac-event/30 bg-ac-event-soft text-ac-event",
  },
  "enrollment-deadline": {
    label: "Enrollment Deadline",
    pluralLabel: "Deadlines",
    icon: AlarmClock,
    color: "#F2A23A",
    dotClass: "bg-ac-deadline",
    softClass: "bg-ac-deadline-soft",
    borderClass: "border-ac-deadline/30",
    textClass: "text-ac-deadline",
    badgeClass: "border-ac-deadline/30 bg-ac-deadline-soft text-ac-deadline",
  },
  "academic-activities": {
    label: "Academic Activity",
    pluralLabel: "Academic Activities",
    icon: BookOpen,
    color: "#3976D9",
    dotClass: "bg-ac-activity",
    softClass: "bg-ac-activity-soft",
    borderClass: "border-ac-activity/30",
    textClass: "text-ac-activity",
    badgeClass: "border-ac-activity/30 bg-ac-activity-soft text-ac-activity",
  },
};

export const CALENDAR_EVENTS: AcademicEvent[] = [
  {
    id: "enrollment-first-sem",
    title: "Enrollment Period · First Semester",
    shortTitle: "1st Sem Enrollment",
    category: "enrollment",
    start: "2026-08-03",
    end: "2026-08-07",
    time: "8:00 AM – 4:00 PM",
    location: "Registrar's Office",
    description:
      "Enrollment for the first semester of A.Y. 2026–2027 opens for all year levels. Bring your admission slip and valid student ID.",
    featured: true,
  },
  {
    id: "opening-first-sem",
    title: "Opening of First Semester Classes",
    shortTitle: "Classes Begin",
    category: "academic-activities",
    start: "2026-08-10",
    time: "7:30 AM",
    location: "CPC Campus",
    description:
      "First day of classes for the first semester. Students follow their official class schedules starting today.",
    featured: true,
  },
  {
    id: "ninoy-aquino-day",
    title: "Ninoy Aquino Day",
    category: "holiday",
    start: "2026-08-21",
    allDay: true,
    description: "Regular national holiday. Offices and classes are suspended.",
  },
  {
    id: "national-heroes-day",
    title: "National Heroes Day",
    category: "holiday",
    start: "2026-08-31",
    allDay: true,
    description: "Regular national holiday honoring Filipino heroes. No classes and office work.",
  },
  {
    id: "midterm-first-sem",
    title: "Midterm Examinations · First Semester",
    shortTitle: "Midterm Exams",
    category: "examinations",
    start: "2026-09-14",
    end: "2026-09-18",
    time: "Per examination schedule",
    location: "Assigned classrooms",
    description:
      "Midterm examinations for all first-semester courses. Refer to the posted examination schedule for your room assignments.",
    featured: true,
  },
  {
    id: "dropping-deadline",
    title: "Deadline for Dropping and Withdrawal",
    shortTitle: "Dropping Deadline",
    category: "enrollment-deadline",
    start: "2026-10-02",
    time: "5:00 PM",
    location: "Registrar's Office",
    description:
      "Last day to file a dropping or withdrawal request for the first semester. Forms must be signed by your adviser.",
    featured: true,
    reminder: true,
    reminderNote: "Complete your adviser's signature before submitting the form.",
  },
  {
    id: "final-first-sem",
    title: "Final Examinations · First Semester",
    shortTitle: "Final Exams",
    category: "examinations",
    start: "2026-10-12",
    end: "2026-10-16",
    time: "Per examination schedule",
    location: "Assigned classrooms",
    description:
      "Final examinations for the first semester. Students with outstanding balances must settle their accounts before taking the exams.",
    featured: true,
    reminder: true,
    reminderNote: "Settle any outstanding balance before final examination week.",
  },
  {
    id: "semestral-break",
    title: "Semestral Break",
    category: "holiday",
    start: "2026-10-19",
    end: "2026-10-30",
    allDay: true,
    description:
      "Break between the first and second semesters. Administrative offices remain open on a shortened schedule.",
  },
  {
    id: "enrollment-second-sem",
    title: "Enrollment Period · Second Semester",
    shortTitle: "2nd Sem Enrollment",
    category: "enrollment",
    start: "2026-11-02",
    end: "2026-11-06",
    time: "8:00 AM – 4:00 PM",
    location: "Registrar's Office",
    description:
      "Enrollment for the second semester of A.Y. 2026–2027. Continuing students may enroll online or at the registrar's office.",
    featured: true,
  },
  {
    id: "opening-second-sem",
    title: "Opening of Second Semester Classes",
    shortTitle: "Classes Begin",
    category: "academic-activities",
    start: "2026-11-04",
    time: "7:30 AM",
    location: "CPC Campus",
    description:
      "First day of second-semester classes. Official schedules take effect and late enrollment begins.",
    featured: true,
  },
  {
    id: "org-fair",
    title: "Student Organization Fair",
    shortTitle: "Org Fair",
    category: "school-events",
    start: "2026-11-04",
    time: "9:00 AM – 3:00 PM",
    location: "CPC Quadrangle",
    description:
      "Meet the college's student organizations, sign up for clubs, and learn about leadership opportunities for the semester.",
  },
  {
    id: "add-drop",
    title: "Add / Drop Period",
    category: "enrollment-deadline",
    start: "2026-11-09",
    end: "2026-11-13",
    time: "5:00 PM",
    location: "Registrar's Office",
    description:
      "Students may add or drop subjects for the second semester. Requests require adviser approval and are subject to slot availability.",
    featured: true,
    reminder: true,
    reminderNote: "Last chance to adjust your load for the second semester.",
  },
  {
    id: "foundation-day",
    title: "CPC Foundation Day",
    shortTitle: "Foundation Day",
    category: "school-events",
    start: "2026-11-20",
    time: "8:00 AM – 5:00 PM",
    location: "CPC Grounds",
    description:
      "A campus-wide celebration with cultural presentations, sports exhibitions, and a student showcase. Classes follow a shortened schedule.",
    featured: true,
  },
  {
    id: "bonifacio-day",
    title: "Bonifacio Day",
    category: "holiday",
    start: "2026-11-30",
    allDay: true,
    description: "Regular national holiday. No classes and no office transactions.",
  },
  {
    id: "immaculate-conception",
    title: "Feast of the Immaculate Conception",
    shortTitle: "Immaculate Conception",
    category: "holiday",
    start: "2026-12-08",
    allDay: true,
    description: "Special non-working holiday. Classes and office work are suspended.",
  },
  {
    id: "midterm-second-sem",
    title: "Midterm Examinations · Second Semester",
    shortTitle: "Midterm Exams",
    category: "examinations",
    start: "2026-12-14",
    end: "2026-12-18",
    time: "Per examination schedule",
    location: "Assigned classrooms",
    description:
      "Midterm examinations for all second-semester courses. Check the registrar's bulletin for your schedule.",
    featured: true,
    reminder: true,
    reminderNote: "Review the posted room assignments before exam week.",
  },
  {
    id: "christmas-break",
    title: "Christmas Break",
    category: "holiday",
    start: "2026-12-19",
    end: "2027-01-03",
    allDay: true,
    description:
      "Holiday break for students and staff. Classes resume on January 4, 2027.",
  },
  {
    id: "resume-classes",
    title: "Resumption of Classes",
    category: "academic-activities",
    start: "2027-01-04",
    time: "7:30 AM",
    location: "CPC Campus",
    description: "Second-semester classes resume after the Christmas break.",
  },
  {
    id: "scholarship-deadline",
    title: "Deadline for Scholarship Applications",
    shortTitle: "Scholarship Deadline",
    category: "enrollment-deadline",
    start: "2027-01-15",
    time: "5:00 PM",
    location: "Student Affairs Office",
    description:
      "Last day to submit scholarship applications and renewal requirements for the second semester.",
    featured: true,
    reminder: true,
    reminderNote: "Prepare your grades, certificate of enrollment, and income documents.",
  },
  {
    id: "open-house",
    title: "CPC Open House and Career Fair",
    shortTitle: "Open House & Fair",
    category: "school-events",
    start: "2027-01-22",
    time: "9:00 AM – 3:00 PM",
    location: "CPC Gymnasium",
    description:
      "Prospective students, alumni, and partner employers visit the campus for guided tours and career talks.",
  },
  {
    id: "research-colloquium",
    title: "Student Research Colloquium",
    shortTitle: "Research Colloquium",
    category: "school-events",
    start: "2027-02-09",
    time: "8:00 AM – 4:00 PM",
    location: "Audio-Visual Room",
    description:
      "Undergraduate researchers present their capstone studies before faculty panels and invited guests.",
  },
  {
    id: "final-second-sem",
    title: "Final Examinations · Second Semester",
    shortTitle: "Final Exams",
    category: "examinations",
    start: "2027-02-15",
    end: "2027-02-19",
    time: "Per examination schedule",
    location: "Assigned classrooms",
    description:
      "Final examinations for the second semester. Clear all accountabilities before the examination week.",
    featured: true,
    reminder: true,
    reminderNote: "Complete your clearance requirements before taking the finals.",
  },
  {
    id: "edsa-anniversary",
    title: "EDSA People Power Anniversary",
    shortTitle: "EDSA Anniversary",
    category: "holiday",
    start: "2027-02-25",
    allDay: true,
    description: "Special non-working holiday. Classes and office transactions are suspended.",
  },
  {
    id: "summer-enrollment",
    title: "Enrollment Period · Summer Term",
    shortTitle: "Summer Enrollment",
    category: "enrollment",
    start: "2027-03-01",
    end: "2027-03-05",
    time: "8:00 AM – 4:00 PM",
    location: "Registrar's Office",
    description:
      "Enrollment for the summer term. Students who need to complete prerequisite or back subjects may enroll.",
  },
  {
    id: "commencement",
    title: "Commencement Exercises",
    shortTitle: "Commencement",
    category: "school-events",
    start: "2027-03-08",
    time: "8:00 AM",
    location: "CPC Gymnasium",
    description:
      "Graduation rites for the graduating class of A.Y. 2026–2027. Graduates must arrive one hour before the ceremony.",
    featured: true,
    reminder: true,
    reminderNote: "Claim your graduation clearance and academic attire before the ceremony.",
  },
  {
    id: "summer-classes",
    title: "Summer Term Classes",
    category: "academic-activities",
    start: "2027-03-15",
    end: "2027-04-09",
    time: "Per class schedule",
    location: "CPC Campus",
    description: "Classes for the summer term. Schedules are posted at the registrar's office.",
  },
  {
    id: "araw-ng-kagitingan",
    title: "Araw ng Kagitingan",
    category: "holiday",
    start: "2027-04-09",
    allDay: true,
    description: "Regular national holiday. Classes and office work are suspended.",
  },
  {
    id: "earth-day",
    title: "Earth Day Campus Drive",
    shortTitle: "Earth Day Drive",
    category: "school-events",
    start: "2027-04-22",
    time: "7:00 AM – 12:00 PM",
    location: "CPC Grounds",
    description:
      "Tree planting, coastal cleanup, and environmental awareness activities organized by student organizations.",
  },
  {
    id: "labor-day",
    title: "Labor Day",
    category: "holiday",
    start: "2027-05-01",
    allDay: true,
    description: "Regular national holiday. No classes and no office transactions.",
  },
  {
    id: "enrollment-next-year",
    title: "Enrollment Period · A.Y. 2027–2028",
    shortTitle: "Enrollment AY 27–28",
    category: "enrollment",
    start: "2027-05-24",
    end: "2027-05-28",
    time: "8:00 AM – 4:00 PM",
    location: "Registrar's Office",
    description:
      "Early enrollment for the next academic year. Continuing students may reserve their slots online.",
    featured: true,
  },
  {
    id: "independence-day",
    title: "Independence Day",
    category: "holiday",
    start: "2027-06-12",
    allDay: true,
    description: "Regular national holiday. Classes and office work are suspended.",
  },
  {
    id: "opening-next-year",
    title: "Opening of Classes · A.Y. 2027–2028",
    shortTitle: "Classes Begin",
    category: "academic-activities",
    start: "2027-06-14",
    time: "7:30 AM",
    location: "CPC Campus",
    description: "First day of classes for the new academic year.",
    featured: true,
  },
];

/** Events grouped for the legend and PDF summary. */
export const CATEGORY_EVENT_COUNT = CALENDAR_EVENTS.reduce<Record<string, number>>(
  (counts, event) => {
    counts[event.category] = (counts[event.category] ?? 0) + 1;
    return counts;
  },
  {},
);
