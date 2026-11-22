/** BSIT-2A, 2nd semester Form 3 roster shown in the student's clearance. */
export const BSIT_2A_FORM3_TERM = "2nd Semester · AY 2025-2026";

export const BSIT_2A_FORM3_SUBJECTS = [
  { subjectCode: "F3-DANCE", subject: "Dance", instructor: "Prof. R. Dela Cruz", units: 2 },
  { subjectCode: "F3-READING-VISUAL-ARTS", subject: "Reading Visual Arts", instructor: "Ms. A. Villanueva", units: 3 },
  { subjectCode: "F3-SCIENCE-TECHNOLOGY-SOCIETY", subject: "Science, Technology and Society", instructor: "Dr. M. Santos", units: 3 },
  { subjectCode: "F3-INFORMATION-MANAGEMENT", subject: "Information Management", instructor: "Mr. J. Cruz", units: 3 },
  { subjectCode: "F3-IT-TRACK-ELECTIVE-1", subject: "IT Track Elective 1", instructor: "Prof. R. Dela Cruz", units: 3 },
  { subjectCode: "F3-OBJECT-ORIENTED-PROGRAMMING", subject: "Object Oriented Programming", instructor: "Prof. R. Dela Cruz", units: 3 },
  { subjectCode: "F3-PROBABILITIES-STATISTICS", subject: "Probabilities and Statistics", instructor: "Mrs. L. Reyes", units: 3 },
  { subjectCode: "F3-DATA-COMMUNICATIONS-NETWORKING-1", subject: "Data Communications and Networking 1", instructor: "Mr. J. Cruz", units: 3 },
  { subjectCode: "F3-QUANTITATIVE-METHODS", subject: "Quantitative Methods", instructor: "Dr. M. Santos", units: 3 },
] as const;

export function isBsit2a(section: string | null | undefined) {
  return String(section ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "") === "BSIT2A";
}

export function gradeTermForSection(section: string | null | undefined, defaultTerm: string) {
  return isBsit2a(section) ? BSIT_2A_FORM3_TERM : defaultTerm;
}
