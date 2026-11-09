import type {
  AccountStatus,
  CorrectionStatus,
  CourseCode,
  ProfileCorrectionRequest,
  StudentAccount,
  StudentRecord,
  StudentStatus,
  YearLevel,
} from "@/components/features/admin/student-accounts/types";

/*
 * One mock source for all three Student Accounts pages: the directory, the
 * correction queue and the login records are derived from the same students,
 * so the numbers, IDs and sections can never drift apart.
 */

export const COURSE_CODES: CourseCode[] = ["BSIT", "BEED", "BSED", "BSHM"];

export const COURSE_LABELS: Record<CourseCode, string> = {
  BSIT: "BS Information Technology",
  BEED: "Bachelor of Elementary Education",
  BSED: "Bachelor of Secondary Education",
  BSHM: "BS Hospitality Management",
};

export const SECTIONS_BY_COURSE: Record<CourseCode, Record<YearLevel, string[]>> = {
  BSIT: {
    1: ["1A", "1B", "1C", "1D", "1E", "1F", "1G"],
    2: ["2A", "2B", "2C", "2D", "2E"],
    3: ["3A", "3B", "3C", "3D"],
    4: ["4A", "4B", "4C", "4D"],
  },
  BEED: {
    1: ["1A", "1B", "1C", "1D"],
    2: ["2A", "2B", "2C"],
    3: ["3A", "3B"],
    4: ["4A", "4B"],
  },
  BSED: {
    1: ["1A", "1B", "1C"],
    2: ["2A", "2B", "2C"],
    3: ["3A", "3B"],
    4: ["4A", "4B"],
  },
  BSHM: {
    1: ["1A", "1B", "1C"],
    2: ["2A", "2B"],
    3: ["3A", "3B"],
    4: ["4A", "4B"],
  },
};

const YEAR_LEVELS: YearLevel[] = [1, 2, 3, 4];

export const YEAR_LABELS: Record<YearLevel, string> = {
  1: "1st Year",
  2: "2nd Year",
  3: "3rd Year",
  4: "4th Year",
};

export function yearLabel(year: YearLevel): string {
  return YEAR_LABELS[year];
}

/** Sections available for a course, optionally narrowed to one year level. */
export function getSections(course: CourseCode, year?: YearLevel | "all"): string[] {
  const byYear = SECTIONS_BY_COURSE[course];
  if (year === undefined || year === "all") {
    return YEAR_LEVELS.flatMap((level) => byYear[level]);
  }
  return byYear[year] ?? [];
}

function emailOf(fullName: string): string {
  const parts = fullName.toLowerCase().replace(/[^a-z\s-]/g, "").trim().split(/\s+/);
  return `${parts[0]}.${parts[parts.length - 1]}@cpc.edu.ph`;
}

function surnameOf(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  return parts[parts.length - 1];
}

const ADDRESSES = [
  "12 Mabini St., Barangay San Isidro, Quezon City",
  "48 Rizal Ave., Barangay Poblacion, Caloocan City",
  "7 Sampaguita Lane, Barangay Malanday, Valenzuela City",
  "23 Narra St., Barangay Bagong Silang, Caloocan City",
  "91 Katipunan Ext., Barangay Sta. Monica, Quezon City",
  "5 Acacia St., Barangay Ugong, Valenzuela City",
];

type StudentSeed = [
  fullName: string,
  course: CourseCode,
  year: YearLevel,
  section: string,
  status: StudentStatus,
];

const STUDENT_SEEDS: StudentSeed[] = [
  ["Aaron Miguel Dela Cruz", "BSIT", 1, "1A", "active"],
  ["Bianca Rose Santos", "BSIT", 1, "1B", "active"],
  ["Carlo Emmanuel Reyes", "BSIT", 1, "1C", "inactive"],
  ["Daniella Mae Garcia", "BSIT", 1, "1D", "active"],
  ["Elijah James Mendoza", "BSIT", 1, "1E", "active"],
  ["Faith Angelica Torres", "BSIT", 1, "1F", "active"],
  ["Gabriel Luis Flores", "BSIT", 1, "1G", "inactive"],
  ["Hannah Nicole Ramos", "BSIT", 2, "2A", "active"],
  ["Ian Christopher Bautista", "BSIT", 2, "2B", "active"],
  ["Jasmine Althea Navarro", "BSIT", 2, "2C", "active"],
  ["Kevin Adrian Villanueva", "BSIT", 2, "2D", "inactive"],
  ["Liza Marie Aquino", "BSIT", 2, "2E", "active"],
  ["Marco Paolo Castillo", "BSIT", 3, "3A", "active"],
  ["Nadine Claire Domingo", "BSIT", 3, "3B", "active"],
  ["Oliver John Salazar", "BSIT", 3, "3C", "inactive"],
  ["Patricia Anne Mercado", "BSIT", 3, "3D", "active"],
  ["Rafael Miguel Padilla", "BSIT", 4, "4A", "active"],
  ["Sofia Isabel Rivera", "BSIT", 4, "4B", "active"],
  ["Timothy James Soriano", "BSIT", 4, "4C", "inactive"],
  ["Vanessa Kaye Lim", "BSIT", 4, "4D", "active"],
  ["Angela Marie Espinosa", "BEED", 1, "1A", "active"],
  ["Benjamin Joseph Cruz", "BEED", 1, "1B", "active"],
  ["Camille Joy Tobias", "BEED", 1, "1C", "inactive"],
  ["Dominic Paul Ramos", "BEED", 1, "1D", "active"],
  ["Erica Mae Fernandez", "BEED", 2, "2A", "active"],
  ["Francis Leo Manalo", "BEED", 2, "2B", "active"],
  ["Grace Anne Villamor", "BEED", 2, "2C", "inactive"],
  ["Henry David Ocampo", "BEED", 3, "3A", "active"],
  ["Isabella Rose Yu", "BEED", 3, "3B", "active"],
  ["Joshua Caleb Abad", "BEED", 4, "4A", "active"],
  ["Katherine Mae Salcedo", "BEED", 4, "4B", "active"],
  ["Lorenzo Miguel Tan", "BSED", 1, "1A", "active"],
  ["Maria Clara Bautista", "BSED", 1, "1B", "active"],
  ["Nathaniel James Ong", "BSED", 1, "1C", "inactive"],
  ["Olivia Grace Chua", "BSED", 2, "2A", "active"],
  ["Patrick John Luna", "BSED", 2, "2B", "active"],
  ["Queenie Rose Palma", "BSED", 2, "2C", "active"],
  ["Ricardo Antonio Mariño", "BSED", 3, "3A", "inactive"],
  ["Samantha Nicole Sy", "BSED", 3, "3B", "active"],
  ["Teresa Marie Co", "BSED", 4, "4A", "active"],
  ["Ulysses Grant Villareal", "BSED", 4, "4B", "active"],
  ["Valerie Anne Go", "BSHM", 1, "1A", "active"],
  ["Wesley John Uy", "BSHM", 1, "1B", "active"],
  ["Ximena Rose Cruz", "BSHM", 1, "1C", "inactive"],
  ["Ysabel Marie Lim", "BSHM", 2, "2A", "active"],
  ["Zachary Paul Tan", "BSHM", 2, "2B", "active"],
  ["Alyssa Mae Delos Santos", "BSHM", 3, "3A", "active"],
  ["Bryan Christopher Reyes", "BSHM", 3, "3B", "active"],
  ["Chloe Ann Mercado", "BSHM", 4, "4A", "active"],
  ["Daniel James Villanueva", "BSHM", 4, "4B", "inactive"],
];

export const STUDENTS: StudentRecord[] = STUDENT_SEEDS.map((seed, index) => {
  const [fullName, course, year, section, status] = seed;
  const birthYear = 2008 - year;
  const month = String((index % 12) + 1).padStart(2, "0");
  const day = String((index % 27) + 1).padStart(2, "0");

  return {
    id: `stu-${String(index + 1).padStart(3, "0")}`,
    studentId: `STU-2026-${String(index + 1).padStart(4, "0")}`,
    fullName,
    course,
    year,
    section,
    status,
    email: emailOf(fullName),
    contactNumber: `+63 917 ${String(2000000 + index * 137).padStart(7, "0")}`,
    address: ADDRESSES[index % ADDRESSES.length],
    guardianName: `Mr. & Mrs. ${surnameOf(fullName)}`,
    birthDate: `${birthYear}-${month}-${day}`,
    enrolledAt: `2026-08-${String((index % 20) + 1).padStart(2, "0")}`,
  };
});

type CorrectionSeed = [
  studentIndex: number,
  field: string,
  currentValue: string,
  requestedValue: string,
  reason: string,
  submittedAt: string,
  status: CorrectionStatus,
  attachmentName: string | null,
  adminRemarks?: string,
];

const CORRECTION_SEEDS: CorrectionSeed[] = [
  [
    0,
    "Last Name",
    "Dela Cruz",
    "Dela Cruz-Santos",
    "The surname on my PSA birth certificate was updated after my parents' marriage was recorded.",
    "2026-11-08T09:20:00+08:00",
    "pending",
    "psa-birth-certificate.pdf",
  ],
  [
    1,
    "Email Address",
    "bianca.santos@cpc.edu.ph",
    "bianca.rose.santos@gmail.com",
    "I can no longer access my old school email and use this address for all notices.",
    "2026-11-07T14:05:00+08:00",
    "pending",
    null,
  ],
  [
    7,
    "Date of Birth",
    "2006-08-08",
    "2006-09-08",
    "My birthday was encoded one month early. The correct date is on my PSA certificate.",
    "2026-11-06T10:42:00+08:00",
    "pending",
    "psa-birth-certificate.pdf",
  ],
  [
    18,
    "Home Address",
    "23 Narra St., Barangay Bagong Silang, Caloocan City",
    "56 Molave St., Barangay 176, Caloocan City",
    "We relocated last month. Attached is our barangay certificate of residency.",
    "2026-11-05T16:18:00+08:00",
    "pending",
    "barangay-residency.jpg",
  ],
  [
    40,
    "Zip Code",
    "1100",
    "1128",
    "The zip code on my record does not match my current barangay.",
    "2026-11-04T08:55:00+08:00",
    "pending",
    null,
  ],
  [
    21,
    "Guardian Name",
    "Mr. & Mrs. Cruz",
    "Mr. Benjamin Cruz Sr.",
    "My father is my sole legal guardian and should be the emergency contact.",
    "2026-11-03T11:30:00+08:00",
    "approved",
    "guardian-id.pdf",
    "Verified against the submitted guardian ID. Record updated.",
  ],
  [
    25,
    "Middle Name",
    "Fernandez",
    "Ferrer",
    "My middle name was misspelled during enrollment.",
    "2026-11-02T13:12:00+08:00",
    "rejected",
    null,
    "The submitted document still shows “Fernandez”. Please provide a corrected PSA certificate.",
  ],
  [
    30,
    "Civil Status",
    "Single",
    "Married",
    "I got married last October and need my records updated.",
    "2026-10-30T09:05:00+08:00",
    "rejected",
    "marriage-certificate.pdf",
    "Marriage certificate is unreadable. Please upload a clearer scan.",
  ],
  [
    35,
    "Place of Birth",
    "Quezon City",
    "Caloocan City",
    "My place of birth was incorrectly encoded as Quezon City.",
    "2026-10-28T15:40:00+08:00",
    "approved",
    "psa-birth-certificate.pdf",
    "PSA record confirms Caloocan City. Updated.",
  ],
  [
    44,
    "Email Address",
    "ysabel.lim@cpc.edu.ph",
    "ysabel.lim01@outlook.com",
    "Requesting to use my personal email for account recovery.",
    "2026-10-25T10:25:00+08:00",
    "approved",
    null,
    "Email updated. Student was notified through the portal.",
  ],
  [
    48,
    "Contact Number",
    "+63 917 2000000",
    "+63 917 884 5521",
    "My old number was disconnected.",
    "2026-10-23T17:08:00+08:00",
    "rejected",
    null,
    "The new number is already linked to another student record. Please visit the registrar.",
  ],
  [
    12,
    "Contact Number",
    "+63 917 2000000",
    "+63 998 412 7781",
    "Updating my active mobile number for text notifications.",
    "2026-10-21T08:30:00+08:00",
    "approved",
    null,
    "Contact number updated after verification call.",
  ],
];

export const PROFILE_CORRECTION_REQUESTS: ProfileCorrectionRequest[] =
  CORRECTION_SEEDS.map((seed, index) => {
    const [
      studentIndex,
      field,
      currentValue,
      requestedValue,
      reason,
      submittedAt,
      status,
      attachmentName,
      adminRemarks,
    ] = seed;
    const student = STUDENTS[studentIndex];

    return {
      id: `pcr-${String(index + 1).padStart(3, "0")}`,
      referenceNumber: `PCR-2026-${String(24 - index).padStart(4, "0")}`,
      studentId: student.studentId,
      studentName: student.fullName,
      course: student.course,
      year: student.year,
      section: student.section,
      email: student.email,
      field,
      currentValue,
      requestedValue,
      reason,
      attachmentName,
      submittedAt,
      status,
      adminRemarks: adminRemarks ?? "",
      reviewedAt:
        status === "pending"
          ? null
          : new Date(Date.parse(submittedAt) + 86_400_000 * 2).toISOString(),
    };
  });

export const PENDING_PROFILE_CORRECTIONS = PROFILE_CORRECTION_REQUESTS.filter(
  (request) => request.status === "pending",
).length;

const BASE_LOGIN_MS = Date.parse("2026-11-08T19:45:00+08:00");
const HOUR_MS = 3_600_000;
const DAY_MS = 86_400_000;

function accountStatusFor(student: StudentRecord, index: number): AccountStatus {
  if (student.status === "inactive") return index % 2 === 0 ? "locked" : "disabled";
  if (index % 17 === 3) return "locked";
  if (index % 19 === 11) return "disabled";
  return "active";
}

export const STUDENT_ACCOUNTS: StudentAccount[] = STUDENTS.map((student, index) => {
  const status = accountStatusFor(student, index);
  const offlineDays = status === "active" ? 0 : status === "locked" ? 9 : 21;
  const lastLogin = new Date(
    BASE_LOGIN_MS - index * 3 * HOUR_MS - offlineDays * DAY_MS,
  ).toISOString();

  return {
    id: `acct-${student.id}`,
    studentId: student.studentId,
    name: student.fullName,
    email: student.email,
    course: student.course,
    year: student.year,
    section: student.section,
    status,
    lastLogin,
  };
});
