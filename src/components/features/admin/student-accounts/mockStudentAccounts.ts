import type { CourseCode, YearLevel } from "@/components/features/admin/student-accounts/types";

/** Reference labels and available section codes used by student account forms. */
export const COURSE_CODES: CourseCode[] = ["BSIT", "BEED", "BSED", "BSHM"];
export const COURSE_LABELS: Record<CourseCode, string> = {
  BSIT: "BS Information Technology",
  BEED: "Bachelor of Elementary Education",
  BSED: "Bachelor of Secondary Education",
  BSHM: "BS Hospitality Management",
};
export const SECTIONS_BY_COURSE: Record<CourseCode, Record<YearLevel, string[]>> = {
  BSIT: { 1: ["1A", "1B", "1C", "1D", "1E", "1F", "1G"], 2: ["2A", "2B", "2C", "2D", "2E"], 3: ["3A", "3B", "3C", "3D"], 4: ["4A", "4B", "4C", "4D"] },
  BEED: { 1: ["1A", "1B", "1C", "1D"], 2: ["2A", "2B", "2C"], 3: ["3A", "3B"], 4: ["4A", "4B"] },
  BSED: { 1: ["1A", "1B", "1C"], 2: ["2A", "2B", "2C"], 3: ["3A", "3B"], 4: ["4A", "4B"] },
  BSHM: { 1: ["1A", "1B", "1C"], 2: ["2A", "2B"], 3: ["3A", "3B"], 4: ["4A", "4B"] },
};
export const YEAR_LABELS: Record<YearLevel, string> = { 1: "1st Year", 2: "2nd Year", 3: "3rd Year", 4: "4th Year" };
export function yearLabel(year: YearLevel): string { return YEAR_LABELS[year]; }
export function getSections(course: CourseCode, year?: YearLevel | "all"): string[] {
  const byYear = SECTIONS_BY_COURSE[course];
  return year === undefined || year === "all" ? Object.values(byYear).flat() : byYear[year] ?? [];
}
