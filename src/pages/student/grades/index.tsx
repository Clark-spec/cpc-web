import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, Bell, Check, CheckCircle2, Clock3, Download, GraduationCap, BookOpen, LoaderCircle } from "lucide-react";
import { jsPDF } from "jspdf";
import cpcBg from "@/assets/cpc-bg2.png";
import { PageHeroBanner } from "@/components/common/display/PageHeroBanner";
import { PortalHeader } from "@/components/common/layout/PortalHeader";
import { PortalFooter } from "@/components/common/layout/PortalFooter";
import { ConfirmDialog } from "@/components/common/feedback/ConfirmDialog";
import { useAuth } from "@/components/context/useAuth";
import { useSSE } from "@/hooks/useSSE";
import { loadMyEnrollmentSession } from "@/services/enrollmentWorkflow/database";
import type { StudentEnrollmentSession } from "@/types/enrollmentWorkflow";
import { acknowledgeStudentGrades, getCurrentStudentSection, getSectionSubjects, getStudentGrades, GRADE_TERM, type GradeRow } from "@/services/grades/records";

const cardClass = "rounded-2xl border border-cpc-tile-border/70 bg-white shadow-[0_8px_28px_rgba(28,49,120,0.06)]";

export default function StudentGradesPage() {
  const { user } = useAuth();
  const studentId = user?.id ?? "";
  const section = getCurrentStudentSection(user?.studentNumber ?? studentId, user?.section ?? undefined);
  const [rows, setRows] = useState<GradeRow[]>([]);
  const [postedGrades, setPostedGrades] = useState<Record<string, string | null>>({});
  const [enrollmentSession, setEnrollmentSession] = useState<StudentEnrollmentSession | null>(null);
  const [enrollmentChecked, setEnrollmentChecked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [acknowledging, setAcknowledging] = useState(false);
  const isOfficiallyEnrolled = Boolean(enrollmentSession && ["screening", "guidance", "clinic", "registrar", "accounting"]
    .every((office) => enrollmentSession.steps[office as "screening" | "guidance" | "clinic" | "registrar" | "accounting"].status === "APPROVED"));

  const refreshEnrollment = useCallback(async () => {
    try {
      setEnrollmentSession(await loadMyEnrollmentSession());
    } catch {
      // Keep Academic Records available if this optional enrollment lookup is unavailable.
    } finally {
      setEnrollmentChecked(true);
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!studentId) return;
    try {
      setError(null);
      const result = await getStudentGrades();
      const saved = new Map(result.records.map(record => [record.subjectCode, record]));
      const subjects = result.subjects?.length ? result.subjects.map(subject => ({ subjectCode: subject.subjectCode, subject: subject.subjectTitle, instructor: subject.instructor ?? "" })) : getSectionSubjects(section);
      const allSubjects = new Map(subjects.map(subject => [subject.subjectCode, subject]));
      result.records.forEach(record => allSubjects.set(record.subjectCode, { subjectCode: record.subjectCode, subject: record.subjectTitle, instructor: record.instructor ?? "" }));
      setRows([...allSubjects.values()].map(subject => {
        const record = saved.get(subject.subjectCode);
        return { id: subject.subjectCode, studentUserId: studentId, studentNumber: user?.studentNumber ?? "", studentName: user?.name ?? "Student", section, ...subject, grade: record?.grade ?? null, acknowledgedAt: record?.acknowledgedAt, updatedAt: record?.updatedAt };
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Academic records could not be loaded. Please try again.");
    } finally { setLoading(false); }
  }, [section, studentId, user?.name, user?.studentNumber]);

  useEffect(() => {
    void refreshEnrollment();
    const timer = window.setInterval(() => void refreshEnrollment(), 10000);
    return () => window.clearInterval(timer);
  }, [refreshEnrollment]);
  useEffect(() => {
    if (!isOfficiallyEnrolled) return;
    let current = true;
    void getStudentGrades().then((result) => {
      if (current) setPostedGrades(Object.fromEntries(result.records.map((record) => [record.subjectCode, record.grade])));
    }).catch(() => {
      // The saved Study Load remains available even if grade records are unavailable.
    });
    return () => { current = false; };
  }, [isOfficiallyEnrolled]);
  useEffect(() => { if (enrollmentChecked && !isOfficiallyEnrolled) void refresh(); }, [enrollmentChecked, isOfficiallyEnrolled, refresh]);
  useSSE((type) => { if (!isOfficiallyEnrolled && (type === "notification_created" || type === "connected")) void refresh(); }, Boolean(studentId), studentId);

  const graded = useMemo(() => rows.filter((row) => Boolean(row.grade)), [rows]);
  const pending = rows.length - graded.length;
  const awaiting = graded.filter((row) => !row.acknowledgedAt).length;
  const acknowledged = graded.length > 0 && awaiting === 0;
  const handleAcknowledge = async () => {
    setAcknowledging(true);
    try { await acknowledgeStudentGrades(); await refresh(); setConfirmOpen(false); }
    catch (err) { setError(err instanceof Error ? err.message : "Your acknowledgement could not be saved."); }
    finally { setAcknowledging(false); }
  };

  if (enrollmentChecked && isOfficiallyEnrolled && enrollmentSession) {
    const enrolledSession = enrollmentSession;
    const activeSubjects = enrolledSession.form.subjects.filter((subject) => subject.status !== "dropped");
    const numericGrades = activeSubjects.flatMap((subject) => {
      const grade = postedGrades[subject.code];
      if (grade == null || grade.trim() === "") return [];
      const value = Number(grade);
      return Number.isFinite(value) ? [{ value, units: subject.units }] : [];
    });
    const gradedUnits = numericGrades.reduce((total, item) => total + item.units, 0);
    const semesterAverage = gradedUnits > 0
      ? (numericGrades.reduce((total, item) => total + item.value * item.units, 0) / gradedUnits).toFixed(2)
      : "N/A";
    const averageDisplay = semesterAverage === "N/A"
      ? semesterAverage
      : numericGrades.length < activeSubjects.length
        ? `${semesterAverage} · Provisional`
        : semesterAverage;
    return (
      <div className="min-h-screen w-full overflow-x-clip bg-white font-poppins">
        <PortalHeader />
        <div className="print:hidden">
          <PageHeroBanner
            breadcrumbItems={[{ label: "Home", href: "/student/home" }, { label: "Academics", href: null }, { label: "Grades / Academic Records", href: null }]}
            eyebrow="ACADEMICS"
            title="ACADEMIC RECORDS"
            subtitle="Your completed, officially signed Study Load"
            backgroundImage={cpcBg}
          />
        </div>
        <main className="mx-auto w-full max-w-[1280px] space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <section className={`${cardClass} mx-auto max-w-5xl overflow-hidden p-5 sm:p-8 print:max-w-none print:border-0 print:shadow-none`}>
            <header className="border-b-2 border-violet-950 pb-4 text-center text-cpc-navy-text">
              <p className="text-xs text-cpc-heading-soft">{enrolledSession.student.course || enrolledSession.student.department}</p>
              <h1 className="mt-1 text-lg font-bold tracking-wide">GRADES</h1>
              <p className="mt-1 text-[11px] text-emerald-700">OFFICIALLY ENROLLED · All five office signatures complete</p>
            </header>
            <dl className="grid gap-x-8 gap-y-2 py-4 text-xs sm:grid-cols-2">
              <div className="flex gap-2"><dt className="font-semibold text-cpc-heading-soft">Name:</dt><dd className="font-medium text-cpc-navy-text">{enrolledSession.student.name}</dd></div>
              <div className="flex gap-2"><dt className="font-semibold text-cpc-heading-soft">Course &amp; Year:</dt><dd className="font-medium text-cpc-navy-text">{enrolledSession.student.section || `${enrolledSession.student.course} · Year ${enrolledSession.student.yearLevel}`}</dd></div>
              <div className="flex gap-2"><dt className="font-semibold text-cpc-heading-soft">ID No.:</dt><dd className="font-medium text-cpc-navy-text">{enrolledSession.student.studentIdNo}</dd></div>
              <div className="flex gap-2"><dt className="font-semibold text-cpc-heading-soft">Term &amp; Academic:</dt><dd className="font-medium text-cpc-navy-text">{enrolledSession.form.term}</dd></div>
            </dl>
            {enrolledSession.form.subjects.length === 0 ? (
              <p className="px-6 py-12 text-center text-sm text-cpc-heading-soft">No subjects were recorded on this Study Load.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] border-collapse text-left text-[11px]">
                  <thead className="bg-violet-950 text-white"><tr><th className="px-3 py-2.5">Subject Code</th><th className="px-3 py-2.5">Descriptive Title</th><th className="px-3 py-2.5">Final Grade</th><th className="px-3 py-2.5">Units Enrolled</th><th className="px-3 py-2.5">Units Earned</th><th className="px-3 py-2.5">Remarks</th><th className="px-3 py-2.5">Instructor</th></tr></thead>
                  <tbody>{enrolledSession.form.subjects.map((subject) => {
                    const grade = postedGrades[subject.code];
                    const remark = gradeRemark(grade);
                    const earnedUnits = remark === "Passed" ? subject.units : 0;
                    return <tr key={subject.code} className="border-b border-slate-200"><td className="px-3 py-2.5 font-semibold text-cpc-navy-text">{subject.code}</td><td className="px-3 py-2.5 text-cpc-navy-text">{subject.title}</td><td className="px-3 py-2.5 text-center text-cpc-navy-text">{grade || "E"}</td><td className="px-3 py-2.5 text-center text-cpc-navy-text">{subject.units}</td><td className="px-3 py-2.5 text-center text-cpc-navy-text">{earnedUnits}</td><td className={`px-3 py-2.5 ${remark === "Passed" ? "text-emerald-700" : remark === "Failed" ? "text-rose-700" : "text-cpc-heading-soft"}`}>{remark}</td><td className="px-3 py-2.5 text-cpc-navy-text">{subject.instructor || "—"}</td></tr>;
                  })}</tbody>
                  <tfoot><tr className="border-t border-slate-300 font-semibold text-cpc-navy-text"><td colSpan={3} className="px-3 py-3 text-right">Total Units</td><td className="px-3 py-3 text-center">{activeSubjects.reduce((total, subject) => total + subject.units, 0)}</td><td className="px-3 py-3 text-center">{activeSubjects.reduce((total, subject) => total + (gradeRemark(postedGrades[subject.code]) === "Passed" ? subject.units : 0), 0)}</td><td colSpan={2} className="px-3 py-3 text-right">Semester Average: {averageDisplay}</td></tr></tfoot>
                </table>
              </div>
            )}
          </section>
          <div className="mx-auto flex max-w-5xl justify-end">
            <button type="button" onClick={() => downloadGradeSheet(enrolledSession, postedGrades, averageDisplay)} className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-cpc-blue-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-cpc-blue-accent/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent">
              <Download size={17} /> Download Grades
            </button>
          </div>
        </main>
        <PortalFooter />
      </div>
    );
  }

  if (!enrollmentChecked) {
    return <div className="min-h-screen bg-white font-poppins"><PortalHeader/><main className="mx-auto max-w-5xl px-4 py-16 text-center text-sm text-cpc-heading-soft">Loading academic records…</main><PortalFooter/></div>;
  }

  return (
    <div className="min-h-screen w-full overflow-x-clip bg-white font-poppins">
      <PortalHeader />
      <div className="print:hidden">
        <PageHeroBanner
          breadcrumbItems={[
            { label: "Home", href: "/student/home" },
            { label: "Academics", href: null },
            { label: "Grades / Academic Records", href: null },
          ]}
          eyebrow="ACADEMICS"
          title="GRADES / ACADEMIC RECORDS"
          subtitle="Review your subject grades and academic standing"
          backgroundImage={cpcBg}
        />
      </div>

      <main className="mx-auto w-full max-w-[1280px] space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <section className={`${cardClass} flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6`}>
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cpc-section-light text-cpc-blue-accent"><GraduationCap size={24}/></span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.13em] text-cpc-heading-soft">Current academic record</p>
              <h1 className="mt-1 text-lg font-bold text-cpc-navy-text">{section} <span className="font-normal text-cpc-heading-soft">· {GRADE_TERM}</span></h1>
            </div>
          </div>
        </section>

        {error && <div role="alert" className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"><AlertCircle size={18}/><p>{error}</p><button type="button" className="ml-auto cursor-pointer font-semibold underline" onClick={() => void refresh()}>Retry</button></div>}

        <section aria-label="Grade summary" className="grid gap-4 sm:grid-cols-3">
          <SummaryCard icon={<BookOpen size={19}/>} label="Subjects" value={rows.length} tone="blue" />
          <SummaryCard icon={<GraduationCap size={19}/>} label="Grades posted" value={`${graded.length} of ${rows.length}`} tone="green" />
          <SummaryCard icon={<Clock3 size={19}/>} label="Awaiting acknowledgement" value={awaiting} tone="amber" />
        </section>

        {awaiting > 0 && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5 text-sm text-amber-900">
            <Bell size={18} className="mt-0.5 shrink-0"/><p><span className="font-semibold">New grades are ready for review.</span> Acknowledge them after reviewing so the Registrar knows you have seen your results.</p>
          </div>
        )}

        <section className={`${cardClass} overflow-hidden`}>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cpc-input-border/70 px-5 py-5 sm:px-6">
            <div><h2 className="text-lg font-bold text-cpc-navy-text">Subject grades</h2><p className="mt-1 text-sm text-cpc-heading-soft">Grades are added by the Registrar as they become available.</p></div>
            <div className="ml-auto flex items-center gap-3"><span className="text-xs font-medium text-cpc-heading-soft">{rows.length} {rows.length === 1 ? "subject" : "subjects"}</span><StatusPill tone={graded.length === 0 ? "muted" : acknowledged ? "green" : "amber"}>{graded.length === 0 ? "Grades pending" : acknowledged ? "Acknowledged" : "Awaiting acknowledgement"}</StatusPill></div>
          </div>
          {loading ? (
            <div className="flex items-center justify-center gap-2 px-6 py-14 text-sm text-cpc-heading-soft"><LoaderCircle className="animate-spin" size={18}/>Loading academic records…</div>
          ) : rows.length === 0 ? (
            <div className="px-6 py-14 text-center"><BookOpen className="mx-auto h-9 w-9 text-cpc-muted-blue"/><p className="mt-3 font-semibold text-cpc-navy-text">No academic records yet</p><p className="mt-1 text-sm text-cpc-heading-soft">Your enrolled subjects will appear here when records are available.</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead className="bg-cpc-section-light/60 text-[10px] font-bold tracking-[0.12em] text-cpc-heading-soft uppercase"><tr><th className="px-5 py-3.5 sm:px-6">Subject</th><th className="px-4 py-3.5">Instructor</th><th className="px-5 py-3.5 sm:px-6">Grade</th></tr></thead>
                <tbody>{rows.map((row) => <tr key={row.id} className="border-t border-cpc-input-border/60 transition-colors hover:bg-cpc-section-light/30">
                  <td className="px-5 py-4 sm:px-6"><span className="block font-semibold text-cpc-navy-text">{row.subject}</span><span className="mt-0.5 block text-xs text-cpc-heading-soft">{row.subjectCode}</span></td>
                  <td className="px-4 py-4 text-cpc-navy-text/75">{row.instructor}</td>
                  <td className="px-5 py-4 sm:px-6"><span className={`inline-flex min-w-12 justify-center rounded-lg px-3 py-1.5 font-bold tabular-nums ${row.grade ? "bg-cpc-section-light text-cpc-blue-accent" : "bg-slate-100 text-slate-500"}`}>{row.grade ?? "N/A"}</span></td>
                </tr>)}</tbody>
              </table>
            </div>
          )}
          {pending > 0 && <p className="border-t border-cpc-input-border/60 px-5 py-3 text-xs text-cpc-heading-soft sm:px-6">{pending} {pending === 1 ? "grade has" : "grades have"} not been posted yet.</p>}
          {graded.length > 0 && <div className="flex flex-col gap-3 border-t border-cpc-input-border/60 bg-slate-50/70 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6"><p className="max-w-2xl text-sm text-cpc-heading-soft">Review all subjects above, then acknowledge your posted grades so the Registrar knows you have seen them.</p><button type="button" onClick={() => setConfirmOpen(true)} disabled={acknowledged} className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-cpc-blue-accent px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-cpc-blue-accent/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent disabled:cursor-not-allowed disabled:bg-emerald-100 disabled:text-emerald-800">{acknowledged ? <Check size={17}/> : <CheckCircle2 size={17}/>} {acknowledged ? "Grades acknowledged" : "Acknowledge posted grades"}</button></div>}
        </section>
      </main>
      <PortalFooter />
      <ConfirmDialog open={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={() => void handleAcknowledge()} title="Acknowledge your grades?" description="Confirm that you have reviewed the grades currently posted in your academic records. The Registrar will be notified." confirmLabel="Yes, acknowledge grades" busy={acknowledging} loadingLabel="Saving acknowledgement…" successLabel="Acknowledged" id="student-grades-acknowledge-title" />
    </div>
  );
}

function SummaryCard({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string | number; tone: "blue" | "green" | "amber" }) {
  const toneClass = { blue: "bg-cpc-section-light text-cpc-blue-accent", green: "bg-emerald-50 text-emerald-700", amber: "bg-amber-50 text-amber-700" }[tone];
  return <div className={`${cardClass} flex items-center gap-3 p-4`}><span className={`flex h-10 w-10 items-center justify-center rounded-xl ${toneClass}`}>{icon}</span><div><p className="text-xs font-medium text-cpc-heading-soft">{label}</p><p className="mt-0.5 text-lg font-bold text-cpc-navy-text">{value}</p></div></div>;
}

function StatusPill({ children, tone }: { children: React.ReactNode; tone: "muted" | "green" | "amber" }) {
  const toneClass = { muted: "bg-slate-100 text-slate-500", green: "bg-emerald-50 text-emerald-700", amber: "bg-amber-50 text-amber-800" }[tone];
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${toneClass}`}>{children}</span>;
}

function downloadGradeSheet(session: StudentEnrollmentSession, grades: Record<string, string | null>, average: string) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;
  const columns = [27, 56, 21, 23, 23, 36, 91];
  const headings = ["Subject Code", "Descriptive Title", "Final Grade", "Units Enrolled", "Units Earned", "Remarks", "Instructor"];
  const rows = session.form.subjects.filter((subject) => subject.status !== "dropped");
  const drawTableHeader = (y: number) => {
    let x = margin;
    doc.setFillColor(55, 35, 113);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    headings.forEach((heading, index) => {
      doc.rect(x, y, columns[index], 9, "F");
      doc.text(heading, x + 2, y + 5.8, { maxWidth: columns[index] - 4 });
      x += columns[index];
    });
    return y + 9;
  };

  doc.setTextColor(75, 82, 105);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("CORDOVA PUBLIC COLLEGE", pageWidth / 2, 12, { align: "center" });
  doc.setFont("helvetica", "bold");
  doc.setTextColor(35, 31, 77);
  doc.setFontSize(14);
  doc.text("GRADES", pageWidth / 2, 19, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setTextColor(35, 31, 77);
  doc.setFontSize(8);
  doc.text(`Name: ${session.student.name}`, margin, 29);
  doc.text(`ID No.: ${session.student.studentIdNo}`, margin, 35);
  doc.text(`Course & Year: ${session.student.section || `${session.student.course} · Year ${session.student.yearLevel}`}`, pageWidth / 2, 29);
  doc.text(`Term & Academic: ${session.form.term}`, pageWidth / 2, 35);

  let y = drawTableHeader(42);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(35, 31, 50);
  for (const subject of rows) {
    const grade = grades[subject.code];
    const remark = gradeRemark(grade);
    const earnedUnits = remark === "Passed" ? subject.units : 0;
    const values = [subject.code, subject.title, grade || "E", String(subject.units), String(earnedUnits), remark, subject.instructor || "—"];
    const lines = values.map((value, index) => doc.splitTextToSize(value, columns[index] - 4) as string[]);
    const rowHeight = Math.max(8, ...lines.map((line) => line.length * 3.5 + 3));
    if (y + rowHeight > pageHeight - 20) {
      doc.addPage();
      y = drawTableHeader(12);
    }
    let x = margin;
    values.forEach((_value, index) => {
      doc.setDrawColor(215, 219, 230);
      doc.rect(x, y, columns[index], rowHeight);
      doc.text(lines[index], x + 2, y + 4.5, { maxWidth: columns[index] - 4 });
      x += columns[index];
    });
    y += rowHeight;
  }

  if (y + 12 > pageHeight - 12) {
    doc.addPage();
    y = 16;
  }
  const totalUnits = rows.reduce((total, subject) => total + subject.units, 0);
  const earnedUnits = rows.reduce((total, subject) => total + (gradeRemark(grades[subject.code]) === "Passed" ? subject.units : 0), 0);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(35, 31, 77);
  doc.text(`Total Units: ${totalUnits}    Units Earned: ${earnedUnits}    Semester Average: ${average}`, pageWidth - margin, y + 7, { align: "right" });

  const safeId = session.student.studentIdNo.replace(/[^a-zA-Z0-9-]/g, "-");
  doc.save(`CPC-Grades-${safeId}.pdf`);
}

function gradeRemark(grade: string | null | undefined): "Passed" | "Failed" | "Enrolled" | "Grade pending" {
  if (grade == null || grade.trim() === "") return "Enrolled";
  const numericGrade = Number(grade);
  if (!Number.isFinite(numericGrade)) return "Grade pending";
  return numericGrade <= 3 ? "Passed" : "Failed";
}
