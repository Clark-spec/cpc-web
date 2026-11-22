import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, Check, ChevronDown, GraduationCap, LoaderCircle, Save, Users } from "lucide-react";
import { SectionCascadeSelect } from "@/components/common/selection/SectionCascadeSelect";
import { useAdminAuth } from "@/components/context/AdminAuthContext";
import { getGradeSections, getRegistrarStudents, getSectionSubjects, saveStudentGrades, type GradeInput, type GradeRow, type GradeStudent } from "@/services/grades/records";

type StudentGradeGroup = { student: GradeStudent; rows: GradeRow[] };

export default function GradesRecordsPage() {
  const { user } = useAdminAuth();
  const role = user?.role ?? "registrar";
  const [section, setSection] = useState("BSIT-3A");
  const [students, setStudents] = useState<GradeStudent[]>([]);
  const [savedGrades, setSavedGrades] = useState<Record<string, string>>({});
  const [acknowledgedIds, setAcknowledgedIds] = useState<Set<string>>(new Set());
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [savingStudent, setSavingStudent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const inputs = useRef<Record<string, HTMLInputElement | null>>({});
  const saveButtons = useRef<Record<string, HTMLButtonElement | null>>({});

  const refresh = useCallback(async (selectedSection: string) => {
    setLoading(true); setError(null);
    try {
      const next = await getRegistrarStudents(selectedSection, role);
      setStudents(next);
      setDrafts({});
      setSavedGrades(Object.fromEntries(next.flatMap(student => (student.grades ?? []).filter(grade => grade.grade).map(grade => [`${student.id}:${grade.subjectCode}`, grade.grade!]))));
      setAcknowledgedIds(new Set(next.flatMap(student => (student.grades ?? []).filter(grade => grade.acknowledgedAt).map(grade => `${student.id}:${grade.subjectCode}`))));
    } catch (err) {
      setStudents([]);
      setError(err instanceof Error ? err.message : "Could not load student accounts. Please retry.");
    } finally { setLoading(false); }
  }, [role]);

  useEffect(() => { void refresh(section); }, [refresh, section]);

  const groups = useMemo<StudentGradeGroup[]>(() => {
    return students.map(student => ({
      student,
      rows: (student.subjects?.length ? student.subjects.map(subject => ({ subjectCode: subject.subjectCode, subject: subject.subject, instructor: subject.instructor ?? "" })) : getSectionSubjects(section)).map(subject => {
        const id = `${student.id}:${subject.subjectCode}`;
        return { id, studentUserId: student.id, studentNumber: student.studentNumber ?? "", studentName: student.name, section, ...subject, grade: savedGrades[id] ?? null };
      }),
    }));
  }, [students, section, savedGrades]);

  const save = async (group: StudentGradeGroup) => {
    const changed: GradeInput[] = group.rows.flatMap(row => {
      const value = (drafts[row.id] ?? "").trim();
      return value && value !== (savedGrades[row.id] ?? "") ? [{ studentUserId: row.studentUserId, subjectCode: row.subjectCode, subject: row.subject, instructor: row.instructor, grade: value }] : [];
    });
    if (!changed.length) return;
    setSavingStudent(group.student.id); setNotice(null); setError(null);
    try {
      const result = await saveStudentGrades(changed, role);
      setSavedGrades(current => ({ ...current, ...Object.fromEntries(changed.map(row => [`${row.studentUserId}:${row.subjectCode}`, row.grade])) }));
      setAcknowledgedIds(current => { const next=new Set(current); changed.forEach(row=>next.delete(`${row.studentUserId}:${row.subjectCode}`)); return next; });
      setDrafts(current => { const next={...current}; changed.forEach(row => delete next[`${row.studentUserId}:${row.subjectCode}`]); return next; });
      setNotice(`${result.saved} ${result.saved === 1 ? "grade was" : "grades were"} saved. ${result.notified} student${result.notified === 1 ? " was" : "s were"} notified.`);
    } catch (err) { setError(err instanceof Error ? err.message : "Grades could not be saved. Please try again."); }
    finally { setSavingStudent(null); }
  };

  const focusNext = (group: StudentGradeGroup, rowIndex: number) => {
    const next = group.rows[rowIndex + 1];
    if (next) inputs.current[next.id]?.focus();
    else saveButtons.current[group.student.id]?.focus();
  };

  return <main className="mx-auto max-w-7xl space-y-6 p-5 md:p-8">
    <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-blue-700">Academics · Registrar</p><h1 className="mt-1 text-2xl font-bold text-slate-900">Grades Records</h1><p className="mt-1 max-w-2xl text-sm text-slate-500">Select a section, open a student, enter grades in order, then save them together.</p></div><div className="rounded-xl border bg-white px-4 py-3 text-sm text-slate-600"><span className="font-semibold text-slate-900">1st Semester</span> · AY 2026–2027</div></header>

    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-wrap items-end justify-between gap-4"><div><label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">Section Scope</label><SectionCascadeSelect value={section as never} onChange={v=>{if(v!=="all"){setSection(v);setExpandedStudent(null);setSavedGrades({});}}} sections={getGradeSections() as never[]} ariaLabel="Grade records section scope" className="w-full sm:w-80" menuClassName="sm:w-80"/></div><div className="inline-flex items-center gap-2 text-sm text-slate-500"><Users size={16}/>{loading?"Loading students…":`${students.length} ${students.length===1?"student":"students"}`}</div></div></section>

    {notice&&<p role="status" className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-sm font-medium text-emerald-800"><Check size={17}/>{notice}</p>}
    {error&&<div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-800"><AlertCircle size={17} className="mt-0.5 shrink-0"/><span>{error}</span><button type="button" onClick={()=>void refresh(section)} className="ml-auto font-semibold underline">Retry</button></div>}
    {loading?<div className="flex items-center justify-center gap-2 rounded-2xl border bg-white p-12 text-sm text-slate-500"><LoaderCircle className="animate-spin" size={18}/>Loading student accounts…</div>:!groups.length?<div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center"><Users className="mx-auto text-slate-300" size={30}/><p className="mt-3 font-semibold text-slate-700">No student accounts in {section}</p><p className="mt-1 text-sm text-slate-500">Student accounts assigned to this section will appear here.</p></div>:<div className="space-y-3">{groups.map(group=>{
      const isOpen=expandedStudent===group.student.id;
      const grades=group.rows.map(r=>drafts[r.id]??savedGrades[r.id]??"").filter(Boolean).length;
      const hasChanges=group.rows.some(row=>{const value=(drafts[row.id]??"").trim();return Boolean(value)&&value!==(savedGrades[row.id]??"");});
      const ackCount=group.rows.filter(r=>Boolean(savedGrades[r.id])).length;
      const acked=group.rows.filter(r=>acknowledgedIds.has(r.id)).length;
      const studentStatus=ackCount===0?"Grades not entered":acked===ackCount?"Acknowledged":`${acked}/${ackCount} acknowledged`;
      const statusClass=ackCount===0?"bg-slate-100 text-slate-600":acked===ackCount?"bg-emerald-50 text-emerald-700":"bg-amber-50 text-amber-800";
      return <section key={group.student.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <button type="button" aria-expanded={isOpen} onClick={()=>setExpandedStudent(isOpen?null:group.student.id)} className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-slate-50 sm:px-5"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><GraduationCap size={19}/></span><span className="min-w-0 flex-1"><span className="block truncate font-semibold text-slate-900">{group.student.name}</span><span className="mt-0.5 block text-xs text-slate-500">{group.student.studentNumber??"No student number"} · {section}</span></span><span className="hidden text-right sm:block"><span className="block text-sm font-medium text-slate-700">{group.rows.length} subjects</span><span className="block text-xs text-slate-500">{grades} grades entered</span></span><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass}`}>{studentStatus}</span><ChevronDown size={18} className={`shrink-0 text-slate-500 transition-transform ${isOpen?"rotate-180":""}`}/></button>
        {isOpen&&<div className="border-t"><div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 px-4 py-3 sm:px-5"><p className="text-sm font-medium text-slate-700">{group.rows.length} subjects · Press Enter to move to the next grade field.</p><p className="text-xs text-slate-500">Saved: {ackCount}/{group.rows.length} · Acknowledged: {acked}/{ackCount}</p></div>{group.rows.length===0?<p className="p-6 text-sm text-slate-500">No enrolled or scheduled subjects were found for this student.</p>:<><div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead className="bg-white text-[10px] font-bold uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3 sm:px-5">Subject</th><th className="px-4 py-3">Instructor</th><th className="px-4 py-3">Current grade</th><th className="px-4 py-3 sm:px-5">New grade</th></tr></thead><tbody>{group.rows.map((row,index)=><tr key={row.id} className="border-t border-slate-100"><td className="px-4 py-3 sm:px-5"><span className="font-medium text-slate-900">{row.subject}</span><span className="ml-2 text-xs text-slate-400">{row.subjectCode}</span></td><td className="px-4 py-3 text-slate-600">{row.instructor}</td><td className="px-4 py-3 font-semibold text-slate-700">{savedGrades[row.id]??"N/A"}</td><td className="px-4 py-3 sm:px-5"><input ref={el=>{inputs.current[row.id]=el;}} data-grade-input="true" aria-label={`Grade for ${row.subject} (${group.student.name})`} value={drafts[row.id]??savedGrades[row.id]??""} onChange={e=>setDrafts(d=>({...d,[row.id]:e.target.value}))} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();focusNext(group,index);}}} placeholder="Enter grade" className="w-32 rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"/></td></tr>)}</tbody></table></div><div className="flex justify-end border-t bg-white p-4 sm:px-5"><button ref={el=>{saveButtons.current[group.student.id]=el;}} type="button" onClick={()=>void save(group)} disabled={savingStudent===group.student.id||!hasChanges} className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50">{savingStudent===group.student.id?<LoaderCircle className="animate-spin" size={16}/>:<Save size={16}/>}Save grades for student</button></div></>}</div>}
      </section>;
    })}</div>}
  </main>;
}
