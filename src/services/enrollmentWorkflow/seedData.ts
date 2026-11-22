import type {
  DepartmentCode,
  DepartmentSchedule,
  EnrollmentSubjectItem,
  MasterlistRecord,
  StudentEnrollmentSession,
} from "@/types/enrollmentWorkflow";

export const SEED_MASTERLIST: MasterlistRecord[] = [];

export const CURRICULUM_CATALOG: Record<
  DepartmentCode,
  Record<number, EnrollmentSubjectItem[]>
> = {
  BSIT: {
    2: [
      { id: "bsit2-im", code: "IM 2", title: "Information Management 2", units: 3, schedule: "MWF 10:00 - 11:00 AM", room: "LAB 2", instructor: "Prof. I. Eda" },
      { id: "bsit2-net", code: "NET 2", title: "Networking 2", units: 3, schedule: "TTH 01:30 - 03:00 PM", room: "302", instructor: "Prof. J. Cadungog" },
      { id: "bsit2-oop", code: "IT ELEC 2", title: "Object Oriented Programming 2", units: 3, schedule: "MWF 01:00 - 02:00 PM", room: "LAB 1", instructor: "Prof. I. Eda" },
      { id: "bsit2-soc", code: "SOC SCI 1", title: "Phil Constitution and Government", units: 3, schedule: "TTH 03:00 - 04:30 PM", room: "LAB 3", instructor: "Prof. B. Empaces" },
      { id: "bsit2-ias", code: "IAS 1", title: "Information Assurance and Security 1", units: 3, schedule: "TTH 04:30 - 06:00 PM", room: "LAB 2", instructor: "Prof. T. Comayas" },
      { id: "bsit2-hci", code: "HCI 1", title: "Human Computer Interaction 1", units: 3, schedule: "SAT 07:00 - 10:00 AM", room: "LAB 1", instructor: "Prof. E. Tajanlangit" },
    ],
    3: [
      { id: "bsit3-im2", code: "IM 2", title: "Information Management 2", units: 3, schedule: "7:00 AM – 10:00 AM", days: "SAT", roomSetA: "LAB 1", roomSetB: "ONLINE", instructor: "E. Tajanlangit", active: true },
      { id: "bsit3-hci1", code: "HCI 1", title: "Human Computer Interaction 1", units: 3, schedule: "10:00 AM – 11:00 AM", days: "MWF", roomSetA: "LAB 2", roomSetB: "ONLINE", instructor: "I. Eda", active: true },
      { id: "bsit3-track-el2", code: "IT TRACK EL 2", title: "Fundamentals of Business Analytics", units: 3, schedule: "10:00 AM – 1:00 PM", days: "SAT", roomSetA: "TENT 2", roomSetB: "ONLINE", instructor: "A. Entrena", active: true },
      { id: "bsit3-os", code: "OS", title: "Operating System", units: 3, schedule: "12:00 PM – 1:00 PM", days: "TTh", roomSetA: "LAB 2", roomSetB: "ONLINE", instructor: "T. Comayas", active: true },
      { id: "bsit3-it-elec2", code: "IT ELEC 2", title: "Object Oriented Programming 2", units: 3, schedule: "1:00 PM – 2:00 PM", days: "MWF", roomSetA: "LAB 1", roomSetB: "ONLINE", instructor: "I. Eda", active: true },
      { id: "bsit3-soc-sci1", code: "SOC SCI 1", title: "Phil Constitution and Government", units: 3, schedule: "1:30 PM – 3:00 PM", days: "TTh", roomSetA: "302", roomSetB: "ONLINE", instructor: "J. Cadungog", active: true },
      { id: "bsit3-ias1", code: "IAS 1", title: "Information Assurance and Security 1", units: 3, schedule: "3:00 PM – 4:30 PM", days: "TTh", roomSetA: "LAB 3", roomSetB: "ONLINE", instructor: "B. Empaces", active: true },
      { id: "bsit3-appsdev", code: "APPSDEV", title: "Application Development", units: 3, schedule: "4:00 PM – 7:00 PM", days: "SAT", roomSetA: "LAB 1", roomSetB: "ONLINE", instructor: "A. Batoon", active: true },
      { id: "bsit3-net2", code: "NET 2", title: "Networking 2", units: 3, schedule: "4:30 PM – 6:00 PM", days: "TTh", roomSetA: "LAB 2", roomSetB: "ONLINE", instructor: "T. Comayas", active: true },
    ],
    4: [
      { id: "bsit4-cap2", code: "CAPSTONE 2", title: "Capstone Project and Research 2", units: 3, schedule: "SAT 08:00 - 11:00 AM", room: "LAB 2", instructor: "Prof. B. Empaces" },
      { id: "bsit4-prac", code: "PRACTICUM", title: "Practicum / Industry Internship (486 Hours)", units: 6, schedule: "MON - FRI Full Time", room: "FIELD", instructor: "Prof. M. Santos" },
      { id: "bsit4-sem", code: "IT SEMINAR", title: "Current Trends and Emerging Technologies Seminar", units: 3, schedule: "SAT 01:00 - 04:00 PM", room: "AVR", instructor: "Prof. E. Tajanlangit" },
    ],
  },
  BEED: {
    2: [
      { id: "beed2-educ1", code: "EDUC 201", title: "Facilitating Learner-Centered Teaching", units: 3, schedule: "MWF 08:00 - 09:00 AM", room: "301", instructor: "Prof. J. Cadungog" },
      { id: "beed2-educ2", code: "EDUC 202", title: "Assessment of Learning 1", units: 3, schedule: "MWF 09:00 - 10:00 AM", room: "301", instructor: "Prof. M. Santos" },
      { id: "beed2-fil2", code: "FIL 2", title: "Panitikan ng Pilipinas", units: 3, schedule: "TTH 10:00 - 11:30 AM", room: "302", instructor: "Prof. J. Cadungog" },
      { id: "beed2-hist1", code: "HIST 1", title: "Readings in Philippine History", units: 3, schedule: "TTH 01:00 - 02:30 PM", room: "303", instructor: "Prof. M. Santos" },
      { id: "beed2-eng2", code: "ENG 2", title: "Teaching English in the Elementary Grades", units: 3, schedule: "SAT 08:00 - 11:00 AM", room: "304", instructor: "Prof. A. Entrena" },
    ],
    3: [
      { id: "beed3-math", code: "MATH ELEM", title: "Teaching Math in Primary Grades", units: 3, schedule: "MWF 10:00 - 11:00 AM", room: "302", instructor: "Prof. J. Cadungog" },
      { id: "beed3-sci", code: "SCI ELEM", title: "Teaching Science in Elementary", units: 3, schedule: "MWF 01:00 - 02:00 PM", room: "301", instructor: "Prof. M. Santos" },
      { id: "beed3-cur", code: "CURRICULUM", title: "The Teacher and the School Curriculum", units: 3, schedule: "TTH 08:30 - 10:00 AM", room: "303", instructor: "Prof. J. Cadungog" },
      { id: "beed3-tech", code: "EDTECH 2", title: "Technology for Teaching and Learning 2", units: 3, schedule: "TTH 02:00 - 03:30 PM", room: "LAB 1", instructor: "Prof. B. Empaces" },
    ],
    4: [
      { id: "beed4-fs", code: "FIELD STUDY", title: "Field Study 1 & 2 Observations", units: 6, schedule: "MWF 08:00 - 12:00 PM", room: "ELEM LAB", instructor: "Prof. M. Santos" },
      { id: "beed4-teach", code: "PRACTICE TEACH", title: "Teaching Internship", units: 6, schedule: "MON - FRI Full Time", room: "PARTNER SCHOOL", instructor: "Prof. J. Cadungog" },
    ],
  },
  BSHM: {
    2: [
      { id: "bshm2-fb1", code: "HM 101", title: "Food and Beverage Operations", units: 3, schedule: "MWF 10:00 - 11:00 AM", room: "TENT 1", instructor: "Prof. A. Entrena" },
      { id: "bshm2-cook", code: "HM 102", title: "Kitchen Essentials and Basic Food Preparation", units: 3, schedule: "TTH 01:00 - 02:30 PM", room: "303", instructor: "Prof. A. Entrena" },
      { id: "bshm2-san", code: "HM 103", title: "Sanitation and Safety in Hospitality", units: 3, schedule: "SAT 08:00 - 11:00 AM", room: "304", instructor: "Prof. M. Santos" },
      { id: "bshm2-tour", code: "TOUR 1", title: "Macro Perspective of Tourism and Hospitality", units: 3, schedule: "MWF 01:00 - 02:00 PM", room: "302", instructor: "Prof. A. Entrena" },
    ],
    3: [
      { id: "bshm3-front", code: "HM 201", title: "Front Office Operations and Management", units: 3, schedule: "MWF 08:00 - 09:00 AM", room: "HOTEL LAB", instructor: "Prof. A. Entrena" },
      { id: "bshm3-house", code: "HM 202", title: "Housekeeping Operations", units: 3, schedule: "TTH 09:00 - 10:30 AM", room: "HOTEL LAB", instructor: "Prof. M. Santos" },
      { id: "bshm3-cost", code: "HM 203", title: "Cost Control in Food and Beverage", units: 3, schedule: "TTH 01:30 - 03:00 PM", room: "301", instructor: "Prof. A. Entrena" },
    ],
    4: [
      { id: "bshm4-prac", code: "HM PRACTICUM", title: "Hospitality Industry Practicum (600 Hours)", units: 6, schedule: "MON - FRI Full Time", room: "HOTEL PARTNER", instructor: "Prof. A. Entrena" },
    ],
  },
};

export const SEED_DEPARTMENT_SCHEDULES: DepartmentSchedule[] = [
  {
    id: "sched-bsit-am",
    department: "BSIT",
    departmentName: "College of Computer Studies",
    term: "1st Semester 2026-2027",
    date: "2026-11-24",
    dayLabel: "Monday, Nov 24, 2026",
    yearGroup: "1-2",
    startTime: "08:00 AM",
    endTime: "12:00 PM",
    slots: 120,
    remainingSlots: 78,
  },
  {
    id: "sched-bsit-pm",
    department: "BSIT",
    departmentName: "College of Computer Studies",
    term: "1st Semester 2026-2027",
    date: "2026-11-24",
    dayLabel: "Monday, Nov 24, 2026",
    yearGroup: "3-4",
    startTime: "01:00 PM",
    endTime: "05:00 PM",
    slots: 100,
    remainingSlots: 62,
  },
  {
    id: "sched-beed-am",
    department: "BEED",
    departmentName: "College of Teacher Education",
    term: "1st Semester 2026-2027",
    date: "2026-11-25",
    dayLabel: "Tuesday, Nov 25, 2026",
    yearGroup: "1-2",
    startTime: "08:00 AM",
    endTime: "12:00 PM",
    slots: 100,
    remainingSlots: 54,
  },
  {
    id: "sched-beed-pm",
    department: "BEED",
    departmentName: "College of Teacher Education",
    term: "1st Semester 2026-2027",
    date: "2026-11-25",
    dayLabel: "Tuesday, Nov 25, 2026",
    yearGroup: "3-4",
    startTime: "01:00 PM",
    endTime: "05:00 PM",
    slots: 90,
    remainingSlots: 41,
  },
  {
    id: "sched-bshm-am",
    department: "BSHM",
    departmentName: "College of Hospitality Management",
    term: "1st Semester 2026-2027",
    date: "2026-11-26",
    dayLabel: "Wednesday, Nov 26, 2026",
    yearGroup: "1-2",
    startTime: "08:00 AM",
    endTime: "12:00 PM",
    slots: 100,
    remainingSlots: 60,
  },
  {
    id: "sched-bshm-pm",
    department: "BSHM",
    departmentName: "College of Hospitality Management",
    term: "1st Semester 2026-2027",
    date: "2026-11-26",
    dayLabel: "Wednesday, Nov 26, 2026",
    yearGroup: "3-4",
    startTime: "01:00 PM",
    endTime: "05:00 PM",
    slots: 80,
    remainingSlots: 45,
  },
];

export const SEED_SESSIONS: Record<string, StudentEnrollmentSession> = {};
