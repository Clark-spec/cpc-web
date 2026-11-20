import { useState, useEffect } from "react";
import {
  CheckCircle2,
  Clock,
  Filter,
  GraduationCap,
  RotateCcw,
} from "lucide-react";
import { useAdminAuth } from "@/components/context/AdminAuthContext";
import {
  approveScreening,
  getScreeningQueue,
  referScreening,
  subscribeToEnrollmentQueue,
} from "@/services/enrollmentWorkflow/service";
import type { DepartmentCode, EnrollmentFormRecord } from "@/types/enrollmentWorkflow";

const DEPT_LABELS: Record<DepartmentCode, string> = {
  BSIT: "Computer Studies (BSIT)",
  BEED: "Teacher Education (BEED)",
  BSHM: "Hospitality Management (BSHM)",
};

export function ScreeningCommitteeView() {
  const { user } = useAdminAuth();

  // Scoped strictly by dean role: BSIT for dean_cs, BEED for dean_edu, BSHM for dean_hm
  const deanDept: DepartmentCode | undefined =
    user?.role === "dean_cs"
      ? "BSIT"
      : user?.role === "dean_edu"
      ? "BEED"
      : user?.role === "dean_hm"
      ? "BSHM"
      : undefined;

  const isDean = Boolean(deanDept);
  const [selectedDept, setSelectedDept] = useState<DepartmentCode | "all">(deanDept ?? "all");

  // Keep state locked to dean's department if user is a Dean
  const activeDept: DepartmentCode | "all" = isDean ? deanDept! : selectedDept;

  const [queue, setQueue] = useState<EnrollmentFormRecord[]>(() =>
    getScreeningQueue(activeDept === "all" ? undefined : activeDept),
  );

  useEffect(() => {
    if (deanDept) {
      setSelectedDept(deanDept);
    }
  }, [deanDept]);

  const [referModal, setReferModal] = useState<{ open: boolean; formId: string; studentName: string }>({
    open: false,
    formId: "",
    studentName: "",
  });
  const [referRemarks, setReferRemarks] = useState("");

  const refresh = () => {
    setQueue(getScreeningQueue(activeDept === "all" ? undefined : activeDept));
  };

  useEffect(() => {
    const unsub = subscribeToEnrollmentQueue(refresh);
    return unsub;
  }, [activeDept]);

  const allCount = getScreeningQueue().length;
  const bsitCount = getScreeningQueue("BSIT").length;
  const beedCount = getScreeningQueue("BEED").length;
  const bshmCount = getScreeningQueue("BSHM").length;

  const handleApprove = (studentId: string) => {
    approveScreening(studentId, user?.name ?? "Screening Committee", user?.role ?? undefined);
    refresh();
  };

  const handleReferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!referRemarks.trim()) return;
    referScreening(referModal.formId, referRemarks.trim(), user?.name ?? "Screening Committee", user?.role ?? undefined);
    setReferModal({ open: false, formId: "", studentName: "" });
    setReferRemarks("");
    refresh();
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 font-poppins">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-cpc-blue-accent/10 px-3.5 py-1.5 text-xs font-semibold text-cpc-blue-accent">
            <GraduationCap className="h-4 w-4" />
            Step 3 · Screening Committee & Dean Approval
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-cpc-navy-text sm:text-3xl">
            {isDean ? `${DEPT_LABELS[deanDept!]} Screening` : "Enrollment Subject Screening"}
          </h1>
          <p className="mt-1.5 text-sm text-cpc-heading-soft">
            {isDean
              ? `Review and verify course loads for continuing ${deanDept} students. Approved forms advance to Guidance review.`
              : "Review submitted student enrollment forms across departments, verify unit counts, and approve forms or refer concerns back."}
          </p>
        </div>

        {/* Dept Filter: Locked badge for Deans, selector for Admins/Registrars */}
        {isDean ? (
          <div className="flex items-center gap-2 rounded-xl border border-cpc-blue-accent/30 bg-cpc-blue-accent/5 px-3.5 py-2 text-xs font-semibold text-cpc-navy-text shadow-2xs">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>
              Scope: <strong className="text-cpc-blue-accent">{DEPT_LABELS[deanDept!]}</strong>
            </span>
            <span className="rounded-full bg-cpc-blue-accent px-2 py-0.5 text-[10px] font-bold text-white">
              {queue.length} Pending
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-cpc-muted-blue" />
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value as DepartmentCode | "all")}
              className="rounded-xl border border-cpc-input-border/80 bg-white px-3.5 py-2 text-xs font-semibold text-cpc-navy-text shadow-2xs focus:border-cpc-blue-accent focus:outline-hidden"
            >
              <option value="all">All Departments ({allCount})</option>
              <option value="BSIT">Computer Studies (BSIT) ({bsitCount})</option>
              <option value="BEED">Teacher Education (BEED) ({beedCount})</option>
              <option value="BSHM">Hospitality Mgmt (BSHM) ({bshmCount})</option>
            </select>
          </div>
        )}
      </div>

      {/* Queue Cards */}
      <div className="space-y-4">
        {queue.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-cpc-input-border/80 bg-white p-12 text-center shadow-xs">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500/80" />
            <h3 className="mt-3 text-base font-bold text-cpc-navy-text">Screening Queue Cleared</h3>
            <p className="mt-1 text-xs text-cpc-heading-soft">
              {isDean
                ? `No enrollment forms are currently pending review for ${DEPT_LABELS[deanDept!]}. All student applications in your college have been processed.`
                : `No enrollment forms are currently pending Screening Committee review for ${selectedDept === "all" ? "any department" : selectedDept}.`}
            </p>
            {!isDean && selectedDept !== "all" && allCount > 0 && (
              <button
                type="button"
                onClick={() => setSelectedDept("all")}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-cpc-blue-accent px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 transition"
              >
                View Other Departments ({allCount} pending)
              </button>
            )}
          </div>
        ) : (
          queue.map((form) => (
            <div
              key={form.id}
              className="rounded-2xl border border-cpc-input-border/70 bg-white p-6 shadow-sm transition hover:shadow-md"
            >
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-cpc-input-border/40 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-cpc-navy-text">{form.studentName}</h3>
                    <span className="font-mono text-xs text-cpc-muted-blue font-medium">({form.studentId})</span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        form.standing === "regular"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                    >
                      {form.standing.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-cpc-heading-soft mt-0.5">
                    {form.course} · Year {form.yearLevel} · {form.term}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-cpc-section-light px-3 py-1 text-xs font-bold text-cpc-navy-text border border-cpc-input-border/60">
                    Units: <strong className="text-cpc-blue-accent">{form.totalUnits}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => setReferModal({ open: true, formId: form.studentId, studentName: form.studentName })}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50/80 px-3.5 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 transition"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Refer with Concerns
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApprove(form.studentId)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-cpc-blue-accent px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Approve Form
                  </button>
                </div>
              </div>

              {/* Subjects List */}
              <div className="mt-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-cpc-heading-soft mb-2">
                  Submitted Subject Load ({form.subjects.length} subjects)
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {form.subjects.map((s) => (
                    <div
                      key={s.code}
                      className="rounded-xl border border-cpc-input-border/50 bg-cpc-section-light/40 p-3 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-cpc-blue-accent">{s.code}</span>
                        <span className="rounded-md bg-white px-1.5 py-0.5 font-bold text-cpc-navy-text border border-cpc-input-border/40">
                          {s.units}u
                        </span>
                      </div>
                      <p className="mt-1 font-medium text-cpc-navy-text truncate">{s.title}</p>
                      <p className="mt-0.5 text-[11px] text-cpc-heading-soft flex items-center gap-1">
                        <Clock className="h-3 w-3 text-cpc-muted-blue shrink-0" /> {s.schedule}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Refer Concerns Modal */}
      {referModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl animate-in fade-in-50 zoom-in-95">
            <h3 className="text-base font-bold text-cpc-navy-text">
              Refer Form to {referModal.studentName}
            </h3>
            <p className="mt-1 text-xs text-cpc-heading-soft">
              Provide specific remarks for why this form needs adjustment (e.g. prerequisite deficiency, overload, conflict).
            </p>

            <form onSubmit={handleReferSubmit} className="mt-4 space-y-4">
              <textarea
                required
                rows={4}
                placeholder="e.g. IM 2 has a prerequisite clash with your 1st year standing. Please adjust to 18 units max."
                value={referRemarks}
                onChange={(e) => setReferRemarks(e.target.value)}
                className="w-full rounded-xl border border-cpc-input-border/80 p-3 text-xs text-cpc-navy-text focus:border-cpc-blue-accent focus:outline-hidden"
              />

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setReferModal({ open: false, formId: "", studentName: "" })}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-cpc-heading-soft hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-rose-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-rose-700"
                >
                  Confirm Referral
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
