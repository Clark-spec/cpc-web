import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, Bell, Check, CheckCircle2, Clock3, GraduationCap, BookOpen, LoaderCircle } from "lucide-react";
import cpcBg from "@/assets/cpc-bg2.png";
import { PageHeroBanner } from "@/components/common/display/PageHeroBanner";
import { PortalHeader } from "@/components/common/layout/PortalHeader";
import { PortalFooter } from "@/components/common/layout/PortalFooter";
import { ConfirmDialog } from "@/components/common/feedback/ConfirmDialog";
import { useAuth } from "@/components/context/useAuth";
import { useSSE } from "@/hooks/useSSE";
import { acknowledgeStudentGrades, getCurrentStudentSection, getSectionSubjects, getStudentGrades, GRADE_TERM, type GradeRow } from "@/services/grades/records";

const cardClass = "rounded-2xl border border-cpc-tile-border/70 bg-white shadow-[0_8px_28px_rgba(28,49,120,0.06)]";

export default function StudentGradesPage() {
  const { user } = useAuth();
  const studentId = user?.id ?? "";
  const section = getCurrentStudentSection(user?.studentNumber ?? studentId, user?.section ?? undefined);
  const [rows, setRows] = useState<GradeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [acknowledging, setAcknowledging] = useState(false);

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

  useEffect(() => { void refresh(); }, [refresh]);
  useSSE((type) => { if (type === "notification_created" || type === "connected") void refresh(); }, Boolean(studentId), studentId);

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

        {error && <div role="alert" className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"><AlertCircle size={18}/><p>{error}</p><button type="button" className="ml-auto font-semibold underline" onClick={() => void refresh()}>Retry</button></div>}

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
          {graded.length > 0 && <div className="flex flex-col gap-3 border-t border-cpc-input-border/60 bg-slate-50/70 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6"><p className="max-w-2xl text-sm text-cpc-heading-soft">Review all subjects above, then acknowledge your posted grades so the Registrar knows you have seen them.</p><button type="button" onClick={() => setConfirmOpen(true)} disabled={acknowledged} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-cpc-blue-accent px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-cpc-blue-accent/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent disabled:bg-emerald-100 disabled:text-emerald-800">{acknowledged ? <Check size={17}/> : <CheckCircle2 size={17}/>} {acknowledged ? "Grades acknowledged" : "Acknowledge posted grades"}</button></div>}
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
