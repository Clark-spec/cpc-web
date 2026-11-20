import { useState } from "react";
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
import {
  approveClearanceStep,
  checkClearanceStatus,
  getStudentSession,
  saveEnrollmentFormSubjects,
  submitEnrollmentForm,
} from "@/services/enrollmentWorkflow/service";
import { CURRICULUM_CATALOG } from "@/services/enrollmentWorkflow/seedData";
import type { EnrollmentSubjectItem } from "@/types/enrollmentWorkflow";

export function StudentEnrollmentFormView() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const studentId = user?.studentNumber || "2024-00012";

  const session = getStudentSession(studentId);
  const clearanceData = checkClearanceStatus(studentId);

  const isClearanceApproved = session.steps.clearance.status === "APPROVED";
  const isFormSubmitted = session.form.status === "SUBMITTED" || session.form.status === "APPROVED";
  const isFormResubmit = session.form.status === "RESUBMIT";

  const isRegular = session.student.standing === "regular";

  // Subjects state for irregular students
  const [selectedSubjects, setSelectedSubjects] = useState<EnrollmentSubjectItem[]>(session.form.subjects);
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
    approveClearanceStep(studentId);
    setActiveTab("form");
  };

  const handleAddSubject = (subject: EnrollmentSubjectItem) => {
    if (selectedSubjects.some((s) => s.code === subject.code)) return;
    if (totalUnits + subject.units > 24) {
      alert("Maximum enrollment load is 24 units per semester.");
      return;
    }
    const updated = [...selectedSubjects, subject];
    setSelectedSubjects(updated);
    saveEnrollmentFormSubjects(studentId, updated);
  };

  const handleRemoveSubject = (code: string) => {
    const updated = selectedSubjects.filter((s) => s.code !== code);
    setSelectedSubjects(updated);
    saveEnrollmentFormSubjects(studentId, updated);
  };

  const handleSubmitForm = () => {
    if (selectedSubjects.length === 0) {
      alert("Please select at least one subject before submitting.");
      return;
    }
    submitEnrollmentForm(studentId);
    navigate("/student/queue");
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 font-poppins">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 rounded-full bg-cpc-blue-accent/10 px-3.5 py-1.5 text-xs font-semibold text-cpc-blue-accent">
          <FileSignature className="h-4 w-4" />
          Enrollment Steps 1 & 2 · Clearance & Subject Selection
        </div>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-cpc-navy-text sm:text-3xl">
          Clearance Verification & Enrollment Form
        </h1>
        <p className="mt-2 text-sm text-cpc-heading-soft">
          Verify your clearance sign-off from Online Clearance and finalize your enrolled subjects for the term.
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
          Step 2: Enrollment Form ({isRegular ? "Preprinted" : "Blank"})
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
                <AlertCircle className="h-3.5 w-3.5" /> Pending Deficiencies
              </span>
            )}
          </div>

          <p className="mt-4 text-xs text-cpc-heading-soft leading-relaxed">
            Per the Continuing Students Enrollment Spec, your clearance status is pulled directly from the Online Clearance module. All six offices must provide e-signatures before the enrollment form can be accessed.
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
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                  <CheckCircle2 className="h-3 w-3" /> Signed
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
              className="inline-flex items-center gap-2 rounded-xl bg-cpc-blue-accent px-6 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              Attach E-Signed Clearance & Proceed to Form
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
                  Enrolled Subject Load
                </span>
                <h3 className="text-base font-bold text-cpc-navy-text">
                  {session.student.course} · 1st Semester 2026-2027
                </h3>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-28 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                    <div
                      className={`h-full transition-all duration-300 ${
                        totalUnits > 24
                          ? "bg-rose-500"
                          : totalUnits >= 21
                            ? "bg-emerald-500"
                            : "bg-cpc-blue-accent"
                      }`}
                      style={{ width: `${Math.min(100, (totalUnits / 24) * 100)}%` }}
                    />
                  </div>
                </div>
                <span className="rounded-full bg-cpc-section-light px-3.5 py-1 text-xs font-bold text-cpc-navy-text border border-cpc-input-border/60">
                  Total Units:{" "}
                  <span className={totalUnits > 24 ? "text-rose-600 font-extrabold" : "text-cpc-blue-accent"}>
                    {totalUnits}
                  </span>{" "}
                  / 24 Max
                </span>
              </div>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-cpc-input-border/60 text-cpc-heading-soft uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 font-bold">Subject Code</th>
                    <th className="py-2.5 font-bold">Descriptive Title</th>
                    <th className="py-2.5 font-bold text-center">Units</th>
                    <th className="py-2.5 font-bold">Schedule & Room</th>
                    <th className="py-2.5 font-bold">Instructor</th>
                    {!isRegular && !isFormSubmitted && <th className="py-2.5 font-bold text-right">Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-cpc-input-border/40">
                  {selectedSubjects.map((sub) => (
                    <tr key={sub.code} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 font-bold text-cpc-blue-accent">{sub.code}</td>
                      <td className="py-3 font-medium text-cpc-navy-text">{sub.title}</td>
                      <td className="py-3 text-center font-bold text-cpc-navy-text">{sub.units}</td>
                      <td className="py-3 text-cpc-heading-soft">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-cpc-muted-blue shrink-0" />
                          <span>{sub.schedule}</span>
                        </div>
                        {sub.room && <span className="text-[10px] text-cpc-muted-blue font-mono">Room: {sub.room}</span>}
                      </td>
                      <td className="py-3 text-cpc-heading-soft">{sub.instructor ?? "Assigned Staff"}</td>
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
                      <td colSpan={6} className="py-8 text-center text-cpc-heading-soft">
                        No subjects added to your blank enrollment form yet. Select subjects from the catalog below.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
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
                    <CheckCircle2 className="h-4 w-4" /> Form Submitted to Screening Committee
                  </span>
                  <Link
                    to="/student/queue"
                    className="inline-flex items-center gap-2 rounded-xl bg-cpc-blue-accent px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition"
                  >
                    View Queue Ticket & Status
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmitForm}
                  className="inline-flex items-center gap-2 rounded-xl bg-cpc-blue-accent px-6 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition"
                >
                  <Send className="h-4 w-4" />
                  Submit to Screening Committee
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
