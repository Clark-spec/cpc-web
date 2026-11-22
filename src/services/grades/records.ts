import { apiClient, unwrap } from "@/lib/apiClient";
import { getCsrfToken } from "@/services/auth";
import { ensureAdminSession } from "@/services/complaints/admin-session";
import type { AdminRole } from "@/types/admin";
import { SCHEDULES, SECTION_IDS, ACADEMIC_YEAR, SEMESTER } from "@/services/scheduleStudent/mockSchedules";
import { BSIT_2A_FORM3_SUBJECTS, gradeTermForSection } from "./bsit2aForm3";

export const GRADE_TERM = `${SEMESTER} · AY ${ACADEMIC_YEAR}`;
export { gradeTermForSection };
export type GradeRow = { id: string; studentUserId: string; studentNumber: string; studentName: string; section: string; subjectCode: string; subject: string; instructor: string; grade: string | null; acknowledgedAt?: string | null; updatedAt?: string };
export type StudentGradeRecord = { subjectCode: string; subjectTitle: string; instructor: string; grade: string | null; acknowledgedAt: string | null; updatedAt: string; term: string };
export type GradeStudent = { id: string; studentNumber: string | null; name: string; section: string | null; course?: string | null; yearLevel?: number | null; subjects?: Array<{subjectCode:string;subject:string;instructor:string|null}>; grades?: Array<{subjectCode:string;grade:string|null;acknowledgedAt:string|null}> };
export type GradeInput = Pick<GradeRow, "studentUserId" | "subjectCode" | "subject" | "instructor"> & { grade: string };
type Envelope<T> = { data?: T; message?: string };

export function getGradeSections() { return Array.from(new Set([...SECTION_IDS, ...SCHEDULES.map(s=>s.section)])); }
export function getSectionSubjects(section: string) {
  if (gradeTermForSection(section, GRADE_TERM) !== GRADE_TERM) return BSIT_2A_FORM3_SUBJECTS.map(({ subjectCode, subject, instructor }) => ({ subjectCode, subject, instructor }));
  const schedule = SCHEDULES.find(item => item.section === section);
  return schedule?.entries.map(item => ({ subjectCode: item.subjectCode, subject: item.title, instructor: item.instructor })) ?? [];
}
export function getCurrentStudentSection(studentId: string, fallback?: string) {
  // The authenticated account's section is authoritative; local demo/cache data
  // must not make a BSIT-2A account display another section's grades.
  if (fallback) return fallback;
  try {
    const map = JSON.parse(localStorage.getItem("cpc:student-sections.v1") ?? "{}");
    if (map[studentId]) return String(map[studentId]);
  } catch { /* ignore unreadable local section cache */ }
  return "BSIT-3A";
}

async function adminRequest<T>(path: string, role: AdminRole, body?: unknown): Promise<T> {
  const token = await ensureAdminSession(role);
  const csrf = body === undefined ? undefined : await getCsrfToken();
  const response = body === undefined
    ? await apiClient.get<Envelope<T>>(path, { headers: { Authorization: `Bearer ${token}` }, skipAuthRefresh: true })
    : await apiClient.post<Envelope<T>>(path, body, { headers: { Authorization: `Bearer ${token}`, "x-csrf-token": csrf }, skipAuthRefresh: true });
  return unwrap<T>(response.data);
}

export async function getRegistrarStudents(section: string, role: AdminRole) {
  const result = await adminRequest<{ students: GradeStudent[] }>(`/grades/v1/registrar/students?section=${encodeURIComponent(section)}`, role);
  return result.students ?? [];
}
export async function saveStudentGrades(records: GradeInput[], role: AdminRole) {
  return adminRequest<{ saved: number; notified: number }>("/grades/v1/registrar/save", role, { records: records.map(row => ({ studentUserId: row.studentUserId, subjectCode: row.subjectCode, subjectTitle: row.subject, instructor: row.instructor, grade: row.grade })) });
}
export async function getStudentGrades() {
  const response = await apiClient.get<Envelope<{ records: StudentGradeRecord[]; history: StudentGradeRecord[]; subjects: Array<{subjectCode:string;subjectTitle:string;instructor:string|null}>; term: string }>>("/grades/v1/records");
  return unwrap<{ records: StudentGradeRecord[]; history: StudentGradeRecord[]; subjects: Array<{subjectCode:string;subjectTitle:string;instructor:string|null}>; term: string }>(response.data);
}
export async function acknowledgeStudentGrades() {
  const csrf = await getCsrfToken();
  await apiClient.post("/grades/v1/acknowledge", {}, { headers: { "x-csrf-token": csrf } });
}
