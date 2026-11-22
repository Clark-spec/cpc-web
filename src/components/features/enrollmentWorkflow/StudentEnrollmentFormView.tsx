import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileSignature,
  FileText,
  Lock,
  Plus,
  Send,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { useAuth } from "@/components/context/useAuth";
import { ConfirmDialog } from "@/components/common/feedback/ConfirmDialog";
import {
  approveClearanceStep,
  checkClearanceStatus,
  getStudentSession,
  saveEnrollmentFormSubjects,
  saveStudentSession,
  subscribeToEnrollmentQueue,
} from "@/services/enrollmentWorkflow/service";
import { loadMyEnrollmentSession, saveEnrollmentDraftToDatabase, submitEnrollmentToDatabase } from "@/services/enrollmentWorkflow/database";
import { loadMyClearanceRecord } from "@/services/clearanceStudent/database";
import { CURRICULUM_CATALOG } from "@/services/enrollmentWorkflow/seedData";
import type { EnrollmentSubjectItem } from "@/types/enrollmentWorkflow";
import type { ClearanceRecord } from "@/types/clearance";

function clearanceStatusFromRecord(record: ClearanceRecord) {
  const fallback = checkClearanceStatus(record.studentId);
  const offices = fallback.offices.map((required) => {
    const saved = record.offices.find((office) => office.office === required.office);
    return {
      ...required,
      status: saved?.status ?? "not_requested",
      signer: saved?.signerName,
    };
  });
  return {
    cleared: offices.length === 5 && offices.every((office) => office.status === "signed"),
    offices,
  };
}

export function StudentEnrollmentFormView() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const studentId = user?.studentNumber || "2024-00012";
  const isDatabaseStudent = user?.role === "student" && /^\d{8}$/.test(studentId);

  const [session, setSession] = useState(() => getStudentSession(studentId));
  const [selectedSubjects, setSelectedSubjects] = useState<EnrollmentSubjectItem[]>(session.form.subjects);
  const [submitting, setSubmitting] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [loadingDatabase, setLoadingDatabase] = useState(isDatabaseStudent);
  const [databaseLoadError, setDatabaseLoadError] = useState(false);
  const [clearanceData, setClearanceData] = useState(() => checkClearanceStatus(studentId));

  useEffect(() => {
    const refresh = () => {
      if (!isDatabaseStudent) {
        const local = getStudentSession(studentId);
        setSession(local);
        setSelectedSubjects(local.form.subjects);
        setClearanceData(checkClearanceStatus(studentId));
        return;
      }
      void Promise.all([loadMyEnrollmentSession(), loadMyClearanceRecord()]).then(async ([saved, clearanceRecord]) => {
        if (saved?.student.studentIdNo !== studentId) throw new Error("Registrar enrollment record was not found.");
        setDatabaseLoadError(false);
        const currentClearance = clearanceStatusFromRecord(clearanceRecord);
        setClearanceData(currentClearance);
        setSession(saved);
        let subjects = saved.form.subjects;
        if (subjects.length === 0 && saved.form.standing === "regular") {
          subjects = CURRICULUM_CATALOG[saved.student.department]?.[saved.student.yearLevel] ?? [];
        }
        setSelectedSubjects(subjects);
        if (subjects.length > 0 && saved.form.subjects.length === 0 && saved.steps.verification.status === "APPROVED") {
          const drafted = await saveEnrollmentDraftToDatabase(subjects, currentClearance.cleared);
          setSession(drafted);
          saveStudentSession(drafted);
        }
      }).catch((error) => {
        setDatabaseLoadError(true);
        alert(error instanceof Error ? error.message : "Enrollment data could not be loaded from the database.");
      }).finally(() => setLoadingDatabase(false));
    };
    refresh();
    const unsub = subscribeToEnrollmentQueue(refresh);
    const timer = window.setInterval(refresh, 10000);
    return () => { unsub(); window.clearInterval(timer); };
  }, [isDatabaseStudent, studentId]);

  const isClearanceApproved = clearanceData.cleared || session.steps.clearance.status === "APPROVED";
  const isFormSubmitted = session.form.status === "SUBMITTED" || session.form.status === "APPROVED";
  const isFormResubmit = session.form.status === "RESUBMIT";
  const signatureSteps = [
    { key: "screening", label: "1. Screening Committee & Dean" },
    { key: "guidance", label: "2. Guidance Counselor" },
    { key: "clinic", label: "3. Clinic" },
    { key: "accounting", label: "4. Accounting" },
    { key: "registrar", label: "5. Registrar" },
  ] as const;
  const fullySigned = signatureSteps.every(({ key }) => session.steps[key].status === "APPROVED");

  const isRegular = session.student.standing === "regular";

  // Subjects state for irregular students
  const [activeTab, setActiveTab] = useState<"clearance" | "form">(
    isClearanceApproved ? "form" : "clearance",
  );

  // Available subjects for irregular students to add
  const availableCatalog = [
    ...(CURRICULUM_CATALOG[session.student.department]?.[2] || []),
    ...(CURRICULUM_CATALOG[session.student.department]?.[3] || []),
    ...(CURRICULUM_CATALOG[session.student.department]?.[4] || []),
  ];

  const totalUnits = selectedSubjects.reduce((sum, s) => sum + s.units, 0);

  const handleApproveClearance = () => {
    if (!isClearanceApproved) return;
    const updated = approveClearanceStep(studentId);
    setSession(updated);
    if (isDatabaseStudent) {
      void saveEnrollmentDraftToDatabase(selectedSubjects, true).then((saved) => {
        setSession(saved);
        saveStudentSession(saved);
      }).catch((error) => {
        alert(error instanceof Error ? error.message : "Clearance progress could not be saved.");
      });
    }
    setActiveTab("form");
  };

  const handleAddSubject = (subject: EnrollmentSubjectItem) => {
    if (selectedSubjects.some((s) => s.code === subject.code)) return;
    if (totalUnits + subject.units > 24) {
      alert("Maximum enrollment load is 24 units per semester.");
      return;
    }
    const updated = [...selectedSubjects, subject];
    void persistStudyLoad(updated);
  };

  const handleRemoveSubject = (code: string) => {
    const updated = selectedSubjects.filter((s) => s.code !== code);
    void persistStudyLoad(updated);
  };

  async function persistStudyLoad(subjects: EnrollmentSubjectItem[]) {
    setSelectedSubjects(subjects);
    if (!isDatabaseStudent) {
      const updated = saveEnrollmentFormSubjects(studentId, subjects);
      setSession(updated);
      return;
    }
    try {
      const saved = await saveEnrollmentDraftToDatabase(subjects, clearanceData.cleared);
      setSession(saved);
      saveStudentSession(saved);
    } catch (error) {
      alert(error instanceof Error ? error.message : "The Study Load draft could not be saved. Please try again.");
    }
  }

  const handleSubmitForm = async () => {
    if (selectedSubjects.length === 0) {
      alert("Please select at least one subject before submitting.");
      return;
    }
    setSubmitting(true);
    try {
      const saved = await submitEnrollmentToDatabase({
        ...session,
        form: { ...session.form, subjects: selectedSubjects, totalUnits },
      });
      saveStudentSession(saved);
      setSession(saved);
      navigate("/student/queue");
    } catch (error) {
      alert(error instanceof Error ? error.message : "The Study Load could not be saved. Check your connection and try again.");
    } finally {
      setSubmitting(false);
      setConfirmSubmit(false);
    }
  };

  if (loadingDatabase) {
    return <div role="status" className="mx-auto max-w-4xl px-4 py-16 text-center font-poppins text-sm text-cpc-heading-soft">Loading your enrollment data from the database…</div>;
  }

  if (databaseLoadError && isDatabaseStudent) {
    return <div role="alert" className="mx-auto max-w-3xl px-4 py-16 text-center font-poppins"><h1 className="text-lg font-bold text-cpc-navy-text">Enrollment data unavailable</h1><p className="mt-2 text-sm text-cpc-heading-soft">The Registrar record and saved Study Load could not be loaded. Reconnect to the server and reload this page.</p></div>;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 font-poppins">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 rounded-full bg-cpc-blue-accent/10 px-3.5 py-1.5 text-xs font-semibold text-cpc-blue-accent">
          <FileSignature className="h-4 w-4" />
          Enrollment Steps 1 & 2 · Online Clearance & Study Load
        </div>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-cpc-navy-text sm:text-3xl">
          Online Clearance & Study Load
        </h1>
        <p className="mt-2 text-sm text-cpc-heading-soft">
          Complete your Online Clearance signatures, then review and submit your fixed or customizable Study Load.
        </p>
      </div>

      {/* Workflow Tabs */}
      <div className="mb-6 flex border-b border-cpc-input-border/70">
        <button
          type="button"
          onClick={() => setActiveTab("clearance")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-xs font-bold transition-all ${
            activeTab === "clearance"
              ? "border-cpc-blue-accent text-cpc-blue-accent"
              : "border-transparent text-cpc-heading-soft hover:text-cpc-navy-text"
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          Step 1: Online Clearance
          {isClearanceApproved && (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] text-emerald-700">
              Verified
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("form")}
          disabled={!isClearanceApproved}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-xs font-bold transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
            activeTab === "form"
              ? "border-cpc-blue-accent text-cpc-blue-accent"
              : "border-transparent text-cpc-heading-soft hover:text-cpc-navy-text"
          }`}
        >
          <BookOpen className="h-4 w-4" />
          Step 2: Study Load ({isRegular ? "Fixed" : "Custom"})
          {isFormSubmitted && (
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] text-blue-700">
              Submitted
            </span>
          )}
        </button>
      </div>

      {/* Tab 1: Clearance Step */}
      {activeTab === "clearance" && (
        <div className="rounded-2xl border border-cpc-input-border/70 bg-white p-6 sm:p-8 shadow-sm">
          <div className="flex items-center justify-between border-b border-cpc-input-border/50 pb-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-cpc-heading-soft">
                Module Connection: Online Clearance
              </span>
              <h2 className="text-lg font-bold text-cpc-navy-text">E-Signed Clearance Status</h2>
            </div>
            {clearanceData.cleared ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="h-3.5 w-3.5" /> All Offices Cleared
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 border border-rose-200">
                <AlertCircle className="h-3.5 w-3.5" /> Pending Signatures
              </span>
            )}
          </div>

          <p className="mt-4 text-xs text-cpc-heading-soft leading-relaxed">
            “Pending Signatures” means one or more required offices has not e-signed your Online Clearance yet. Complete every signature below before you can open the Study Load.
          </p>

          {/* Offices List */}
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {clearanceData.offices.map((office) => (
              <div
                key={office.office}
                className="flex items-center justify-between rounded-xl border border-cpc-input-border/50 bg-cpc-section-light/40 p-3.5"
              >
                <div>
                  <p className="text-xs font-bold text-cpc-navy-text">{office.label}</p>
                  <p className="text-[11px] text-cpc-muted-blue">{office.signer ?? "Officer"}</p>
                </div>
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${office.status === "signed" ? "bg-emerald-100 text-emerald-800" : office.status === "requested" ? "bg-amber-100 text-amber-800" : office.status === "rejected" ? "bg-rose-100 text-rose-800" : "bg-slate-100 text-slate-700"}`}>
                  {office.status === "signed" ? <><CheckCircle2 className="h-3 w-3" /> Signed</> : office.status === "requested" ? <><Clock className="h-3 w-3" /> Pending</> : office.status === "rejected" ? <><AlertCircle className="h-3 w-3" /> Rejected</> : <><AlertCircle className="h-3 w-3" /> Not Sent</>}
                </span>
              </div>
            ))}
          </div>

          {/* Action */}
          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-cpc-input-border/50 pt-6">
            <Link
              to="/student-services/online-clearance"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-cpc-blue-accent hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              View full Online Clearance Certificate
            </Link>

            <button
              type="button"
              onClick={handleApproveClearance}
              disabled={!isClearanceApproved}
              className="inline-flex items-center gap-2 rounded-xl bg-cpc-blue-accent px-6 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-45"
            >
              Proceed to Study Load
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: Enrollment Form Step */}
      {activeTab === "form" && (
        <div className="space-y-6">
          {/* Standing notice */}
          {isRegular ? (
            <div className="rounded-2xl border border-blue-200 bg-blue-50/80 p-5 text-cpc-navy-text">
              <div className="flex items-start gap-3">
                <Lock className="h-5 w-5 shrink-0 text-cpc-blue-accent mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-cpc-blue-accent">Preprinted Enrollment Form (Regular Student)</h3>
                  <p className="mt-1 text-xs text-cpc-heading-soft leading-relaxed">
                    As a regular continuing student in {session.student.course}, your prescribed curriculum subjects and class schedules are automatically populated and locked according to the official timetable.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-5 text-cpc-navy-text">
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-amber-900">Blank Enrollment Form (Irregular Student)</h3>
                  <p className="mt-1 text-xs text-amber-800 leading-relaxed">
                    You have an irregular academic standing. Add or remove available subjects below based on your deficiency checklist. Maximum enrollment limit is 24 units.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Resubmit alert if referred by Screening */}
          {isFormResubmit && session.form.screeningRemarks && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-900">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-rose-900">Referred by Screening Committee / Dean</h3>
                  <p className="mt-1 text-xs text-rose-800 font-medium">Remarks: "{session.form.screeningRemarks}"</p>
                  <p className="mt-1 text-xs text-rose-700">Please adjust your subjects accordingly and re-submit.</p>
                </div>
              </div>
            </div>
          )}

          {/* Selected Subjects Table */}
          <div className="rounded-2xl border border-cpc-input-border/70 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cpc-input-border/50 pb-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-cpc-heading-soft">
                  {isRegular ? "Fixed Study Load" : "Enrolled Subject Load"}
                </span>
                <h3 className="text-base font-bold text-cpc-navy-text">
                  {user?.section ? `${user.section} · ` : ""}{session.student.course} · {session.form.term}
                </h3>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
                <div className="flex items-center gap-2">
                    <div className="h-2 w-28 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                    <div
                      className={`h-full transition-all duration-300 ${
                        !isRegular && totalUnits > 24
                          ? "bg-rose-500"
                          : isRegular || totalUnits >= 21
                            ? "bg-emerald-500"
                            : "bg-cpc-blue-accent"
                      }`}
                      style={{ width: `${Math.min(100, (totalUnits / (isRegular ? Math.max(27, totalUnits) : 24)) * 100)}%` }}
                    />
                  </div>
                </div>
                <span className="rounded-full bg-cpc-section-light px-3.5 py-1 text-xs font-bold text-cpc-navy-text border border-cpc-input-border/60">
                  Total Units:{" "}
                  <span className={!isRegular && totalUnits > 24 ? "text-rose-600 font-extrabold" : "text-cpc-blue-accent"}>
                    {totalUnits}
                  </span>{!isRegular && <> / 24 Max</>}
                </span>
              </div>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[1120px] text-left text-xs">
                <thead>
                  <tr className="border-b border-cpc-input-border/60 text-cpc-heading-soft uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 font-bold">Subject Code</th>
                    <th className="py-2.5 font-bold">Descriptive Title</th>
                    <th className="py-2.5 font-bold">Time</th>
                    <th className="py-2.5 font-bold">Days</th>
                    <th className="py-2.5 font-bold">Room (Set A)</th>
                    <th className="py-2.5 font-bold">Room (Set B)</th>
                    <th className="py-2.5 font-bold text-center">Units</th>
                    <th className="py-2.5 font-bold">Instructor</th>
                    <th className="py-2.5 font-bold">Status</th>
                    {!isRegular && !isFormSubmitted && <th className="py-2.5 font-bold text-right">Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-cpc-input-border/40">
                  {selectedSubjects.map((sub) => (
                    <tr key={sub.code} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 font-bold text-cpc-blue-accent">{sub.code}</td>
                      <td className="py-3 font-medium text-cpc-navy-text">{sub.title}</td>
                      <td className="py-3 text-cpc-heading-soft">{sub.schedule}</td>
                      <td className="py-3 text-cpc-heading-soft">{sub.days || "—"}</td>
                      <td className="py-3 text-cpc-heading-soft">{sub.roomSetA || sub.room || "—"}</td>
                      <td className="py-3 text-cpc-heading-soft">{sub.roomSetB || sub.room || "—"}</td>
                      <td className="py-3 text-center font-bold text-cpc-navy-text">{sub.units}</td>
                      <td className="py-3 text-cpc-heading-soft">{sub.instructor ?? "Assigned Staff"}</td>
                      <td className="py-3">
                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${sub.active === false ? "bg-slate-100 text-slate-600" : "bg-emerald-50 text-emerald-700"}`}>
                          {sub.active === false ? "Not Active" : "Active"}
                        </span>
                      </td>
                      {!isRegular && !isFormSubmitted && (
                        <td className="py-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveSubject(sub.code)}
                            className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 transition"
                            title="Remove subject"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                  {selectedSubjects.length === 0 && (
                    <tr>
                      <td colSpan={!isRegular && !isFormSubmitted ? 10 : 9} className="py-8 text-center text-cpc-heading-soft">
                        No subjects added to your blank enrollment form yet. Select subjects from the catalog below.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-6 border-t border-cpc-input-border/50 pt-5">
              <h4 className="text-center text-xs font-semibold text-cpc-heading-soft">STEPS: (NOTE: Please affix your signature)</h4>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {signatureSteps.map(({ key, label }) => {
                  const step = session.steps[key];
                  const signed = step.status === "APPROVED";
                  return (
                    <div key={key} className={`min-h-20 rounded-xl border p-3 ${signed ? "border-emerald-200 bg-emerald-50/70" : "border-dashed border-cpc-input-border bg-slate-50/60"}`}>
                      <p className="text-[11px] font-bold text-cpc-navy-text">{label}</p>
                      {signed ? (
                        <div className="mt-2 flex items-center gap-2">
                          {step.signatureImage && <img src={step.signatureImage} alt={`Digital signature of ${step.updatedBy || "Authorized Officer"}`} className="h-9 max-w-28 rounded border border-emerald-200 bg-white object-contain p-1" />}
                          <p className="text-[11px] font-semibold italic text-emerald-800">
                          Digitally signed by {step.updatedBy || "Authorized Officer"}
                          {step.updatedAt && <span className="mt-0.5 block not-italic font-normal text-emerald-700">{new Date(step.updatedAt).toLocaleString()}</span>}
                          </p>
                        </div>
                      ) : (
                        <p className="mt-2 text-[11px] text-cpc-muted-blue">Awaiting digital signature</p>
                      )}
                    </div>
                  );
                })}
              </div>
              {fullySigned && (
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-sm font-bold text-emerald-800">You are officially enrolled.</p>
                  <Link to="/online-enrollment/status" className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-800">
                    View Enrollment Status <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              )}
            </div>

            {/* If Irregular: Subject Catalog Selector */}
            {!isRegular && !isFormSubmitted && (
              <div className="mt-8 border-t border-cpc-input-border/60 pt-6">
                <h4 className="text-sm font-bold text-cpc-navy-text mb-3">Add Subjects from Offerings Catalog</h4>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {availableCatalog
                    .filter((cat) => !selectedSubjects.some((s) => s.code === cat.code))
                    .map((item) => (
                      <div
                        key={item.code}
                        className="flex items-center justify-between rounded-xl border border-cpc-input-border/60 p-3 bg-cpc-section-light/30 hover:bg-white transition"
                      >
                        <div>
                          <p className="text-xs font-bold text-cpc-navy-text">
                            {item.code} <span className="text-[11px] font-normal text-cpc-heading-soft">({item.units} units)</span>
                          </p>
                          <p className="text-[11px] text-cpc-heading-soft truncate max-w-[240px]">{item.title}</p>
                          <p className="text-[10px] text-cpc-muted-blue">{item.schedule}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAddSubject(item)}
                          className="inline-flex items-center gap-1 rounded-lg bg-cpc-blue-accent/10 px-2.5 py-1 text-xs font-bold text-cpc-blue-accent hover:bg-cpc-blue-accent hover:text-white transition"
                        >
                          <Plus className="h-3.5 w-3.5" /> Add
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-cpc-input-border/50 pt-6">
              <button
                type="button"
                onClick={() => setActiveTab("clearance")}
                className="text-xs font-semibold text-cpc-heading-soft hover:text-cpc-navy-text"
              >
                ← Back to Clearance
              </button>

              {isFormSubmitted ? (
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                    <CheckCircle2 className="h-4 w-4" /> Study Load submitted for office signatures
                  </span>
                  <Link
                    to="/student/queue"
                    className="inline-flex items-center gap-2 rounded-xl bg-cpc-blue-accent px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition"
                  >
                    Request Signature
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmSubmit(true)}
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-cpc-blue-accent px-6 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                  {submitting ? "Saving Study Load…" : "Request Signature"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      <ConfirmDialog
        open={confirmSubmit}
        onClose={() => setConfirmSubmit(false)}
        onConfirm={() => void handleSubmitForm()}
        title="Submit your Study Load?"
        description={<>Your <strong>{selectedSubjects.length} subjects</strong> totaling <strong>{totalUnits} units</strong> will be saved and sent into the enrollment signature process.</>}
        confirmLabel="Submit Study Load"
        loadingLabel="Submitting…"
        busy={submitting}
      />
    </div>
  );
}
