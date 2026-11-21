import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Clock,
  Edit3,
  Info,
  UserCheck,
  X,
  XCircle,
} from "lucide-react";
import { useAuth } from "@/components/context/useAuth";
import { apiClient } from "@/lib/apiClient";
import {
  cacheContinuingStudentRecord,
  checkEligibility,
  confirmVerification,
  getCorrectionRequests,
  getStudentSession,
  submitCorrectionRequest,
  subscribeToEnrollmentQueue,
  type VerificationCorrection,
} from "@/services/enrollmentWorkflow/service";
import type { MasterlistRecord } from "@/types/enrollmentWorkflow";
import type { StudentEnrollmentSession } from "@/types/enrollmentWorkflow";
import { loadMyEnrollmentSession } from "@/services/enrollmentWorkflow/database";

export function StudentVerifyView() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Use the logged-in student ID, with demo fallback only for demo identities.
  const studentId = user?.studentNumber || "2024-00012";
  const isDatabaseStudent = user?.role === "student" && /^\d{8}$/.test(studentId);
  const [session, setSession] = useState<StudentEnrollmentSession | null>(() =>
    isDatabaseStudent ? null : getStudentSession(studentId),
  );
  const [recordLoading, setRecordLoading] = useState(isDatabaseStudent);
  const [recordLoadError, setRecordLoadError] = useState(false);
  const [corrections, setCorrections] = useState<VerificationCorrection[]>(() =>
    getCorrectionRequests().filter((r) => r.studentId === studentId),
  );

  useEffect(() => {
    let active = true;
    const unsub = subscribeToEnrollmentQueue(() => {
      if (isDatabaseStudent && !checkEligibility(studentId).record) return;
      setSession(getStudentSession(studentId));
      setCorrections(getCorrectionRequests().filter((r) => r.studentId === studentId));
    });
    if (isDatabaseStudent) {
      setRecordLoading(true);
      setRecordLoadError(false);
      apiClient.get<{ data?: { record?: MasterlistRecord } }>("/students/v1/continuing-record")
        .then((response) => {
          const record = response.data?.data?.record;
          if (!active) return;
          if (!record || record.studentIdNo !== studentId) {
            setRecordLoadError(true);
            return;
          }
          cacheContinuingStudentRecord(record);
          setSession(getStudentSession(studentId));
          void loadMyEnrollmentSession().then((saved) => {
            if (active && saved?.student.studentIdNo === studentId) setSession(saved);
          }).catch(() => undefined);
          setCorrections(getCorrectionRequests().filter((r) => r.studentId === studentId));
        })
        .catch(() => {
          if (active) setRecordLoadError(true);
        })
        .finally(() => {
          if (active) setRecordLoading(false);
        });
    } else {
      setSession(getStudentSession(studentId));
    }
    return () => {
      active = false;
      unsub();
    };
  }, [isDatabaseStudent, studentId]);

  useEffect(() => {
    if (!isDatabaseStudent) return;
    let active = true;
    const refresh = () => {
      void loadMyEnrollmentSession().then((saved) => {
        if (active && saved?.student.studentIdNo === studentId) setSession(saved);
      }).catch(() => undefined);
    };
    const timer = window.setInterval(refresh, 10000);
    return () => { active = false; window.clearInterval(timer); };
  }, [isDatabaseStudent, studentId]);

  const { eligible, record, reason } = checkEligibility(studentId);

  const [modalOpen, setModalOpen] = useState(false);
  const [field, setField] = useState("Year Level");
  const [requestedValue, setRequestedValue] = useState("");
  const [correctionReason, setCorrectionReason] = useState("");
  const [correctionSuccess, setCorrectionSuccess] = useState(false);

  const latestCorrection = corrections[0];
  const isVerified = session?.steps.verification.status === "APPROVED";
  const isOfficiallyEnrolled = Boolean(session && ["screening", "guidance", "clinic", "accounting", "registrar"]
    .every((office) => session.steps[office as "screening" | "guidance" | "clinic" | "accounting" | "registrar"].status === "APPROVED"));

  const handleConfirm = () => {
    if (!session) return;
    confirmVerification(studentId);
    navigate("/student/enrollment-form");
  };

  const handleSubmitCorrection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !requestedValue.trim() || !correctionReason.trim()) return;

    submitCorrectionRequest(studentId, {
      field,
      requestedValue: requestedValue.trim(),
      reason: correctionReason.trim(),
    });
    setCorrectionSuccess(true);
    setTimeout(() => {
      setCorrectionSuccess(false);
      setModalOpen(false);
      setRequestedValue("");
      setCorrectionReason("");
    }, 1500);
  };

  if (recordLoading) {
    return <div role="status" className="mx-auto max-w-4xl px-4 py-16 text-center font-poppins text-sm text-cpc-heading-soft">Loading your official Registrar record…</div>;
  }

  if (recordLoadError || !session) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center font-poppins">
        <h1 className="text-xl font-bold text-cpc-navy-text">Registrar record unavailable</h1>
        <p className="mt-2 text-sm text-cpc-heading-soft">Online Enrollment uses the continuing-student record saved for your student ID. Please contact the Registrar if this message continues.</p>
        <Link to="/student/home" className="mt-5 inline-flex rounded-xl bg-cpc-blue-accent px-4 py-2 text-xs font-semibold text-white">Return to Student Portal</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 font-poppins">
      {/* Header */}
      <div className="mb-8 text-center sm:text-left">
        <div className="inline-flex items-center gap-2 rounded-full bg-cpc-blue-accent/10 px-3.5 py-1.5 text-xs font-semibold text-cpc-blue-accent">
          <UserCheck className="h-4 w-4" />
          Continuing Student Enrollment · Phase 0 & Step 0
        </div>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-cpc-navy-text sm:text-3xl">
          Student Verification & Academic Standing
        </h1>
        <p className="mt-2 text-sm text-cpc-heading-soft">
          Verify your student record against the Registrar masterlist before proceeding to clearance and subject selection.
        </p>
      </div>

      {isOfficiallyEnrolled && (
        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <BadgeCheck className="mt-0.5 h-6 w-6 shrink-0 text-emerald-700" />
            <div>
              <h2 className="text-base font-bold text-emerald-900">You are officially enrolled.</h2>
              <p className="mt-1 text-xs text-emerald-800">All five offices have signed your Study Load. You can review the completed enrollment status below.</p>
            </div>
          </div>
          <Link to="/online-enrollment/status" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-800">
            View Enrollment Status <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      {/* Ineligible Banner */}
      {!eligible && (
        <div className="mb-8 rounded-2xl border border-rose-200 bg-rose-50/80 p-6 text-rose-900 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-rose-100 p-2 text-rose-700">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-rose-900">Enrollment Eligibility Notice</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-rose-800">
                {reason ?? "You are not currently eligible for continuing student online enrollment."}
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  to="/student/home"
                  className="inline-flex items-center gap-2 rounded-xl bg-rose-700 px-4 py-2 text-xs font-semibold text-white transition hover:bg-rose-800"
                >
                  Return to Student Portal
                </Link>
                <a
                  href="mailto:registrar@cpc.edu.ph"
                  className="inline-flex items-center gap-2 rounded-xl border border-rose-300 bg-white px-4 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
                >
                  Contact Registrar Support
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Correction Request Status Banner */}
      {latestCorrection && (
        <div
          className={`mb-6 rounded-2xl border p-4 text-xs shadow-2xs ${
            latestCorrection.status === "approved"
              ? "border-emerald-200 bg-emerald-50/80 text-emerald-900"
              : latestCorrection.status === "rejected"
                ? "border-rose-200 bg-rose-50/80 text-rose-900"
                : "border-amber-200 bg-amber-50/80 text-amber-900"
          }`}
        >
          <div className="flex items-start gap-3">
            {latestCorrection.status === "approved" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
            ) : latestCorrection.status === "rejected" ? (
              <XCircle className="h-4 w-4 text-rose-600 mt-0.5 shrink-0" />
            ) : (
              <Clock className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
            )}
            <div className="flex-1 space-y-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold uppercase tracking-wider text-[10px]">
                  Correction Request for {latestCorrection.field} ·{" "}
                  {latestCorrection.status.toUpperCase()}
                </span>
                <span className="text-[10px] text-cpc-heading-soft">
                  Requested: {latestCorrection.requestedValue}
                </span>
              </div>
              <p>
                {latestCorrection.status === "approved"
                  ? `Your request was approved by the Registrar. Your masterlist record has been updated.`
                  : latestCorrection.status === "rejected"
                    ? `Your correction request was declined: ${latestCorrection.remarks || "Please visit the Registrar's Office in person."}`
                    : `Your request to change "${latestCorrection.field}" to "${latestCorrection.requestedValue}" is currently under Registrar review.`}
              </p>
              {latestCorrection.remarks && latestCorrection.status !== "rejected" && (
                <p className="font-semibold italic">Registrar Remarks: &ldquo;{latestCorrection.remarks}&rdquo;</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Record Card */}
      {record && (
        <div className="rounded-2xl border border-cpc-input-border/70 bg-white p-6 sm:p-8 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-cpc-input-border/50 pb-5">
            <div>
              <span className="text-xs font-semibold tracking-wider text-cpc-heading-soft uppercase">
                Masterlist Match Verified
              </span>
              <h2 className="text-xl font-bold text-cpc-navy-text">{record.name}</h2>
              <p className="text-xs font-mono text-cpc-blue-accent font-medium mt-0.5">
                Student ID: {record.studentIdNo}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                  record.standing === "regular"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-amber-50 text-amber-700 border border-amber-200"
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${record.standing === "regular" ? "bg-emerald-500" : "bg-amber-500"}`} />
                {record.standing.toUpperCase()} STUDENT
              </span>
            </div>
          </div>

          {/* Details Grid */}
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-cpc-input-border/50 bg-cpc-section-light/50 p-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-cpc-heading-soft">
                Department / Program
              </span>
              <p className="mt-1 text-sm font-bold text-cpc-navy-text">{record.course}</p>
              <p className="text-xs text-cpc-muted-blue">{record.department}</p>
            </div>

            <div className="rounded-xl border border-cpc-input-border/50 bg-cpc-section-light/50 p-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-cpc-heading-soft">
                Current Level
              </span>
              <p className="mt-1 text-sm font-bold text-cpc-navy-text">
                {(["", "1st", "2nd", "3rd", "4th"][record.yearLevel] ?? `Year ${record.yearLevel}`)} Year
              </p>
              <p className="text-xs text-cpc-muted-blue">2nd Semester · Continuing Student</p>
            </div>

            <div className="rounded-xl border border-cpc-input-border/50 bg-cpc-section-light/50 p-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-cpc-heading-soft">
                Last Enrolled Term
              </span>
              <p className="mt-1 text-sm font-bold text-cpc-navy-text">{record.lastTermEnrolled}</p>
              <p className="text-xs text-emerald-600 font-medium flex items-center gap-1 mt-0.5">
                <CheckCircle2 className="h-3.5 w-3.5" /> Enrolled
              </p>
            </div>
          </div>

          {/* Form Standing Info */}
          <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50/60 p-4 text-xs leading-relaxed text-cpc-navy-text">
            <div className="flex items-start gap-2.5">
              <Info className="h-4 w-4 shrink-0 text-cpc-blue-accent mt-0.5" />
              <div>
                <span className="font-bold text-cpc-blue-accent">Enrollment Form Workflow: </span>
                {record.standing === "regular" ? (
                  <span>
                    As a <strong>Regular Student</strong>, your prescribed curriculum subjects will be pre-printed and locked according to your department timetable.
                  </span>
                ) : (
                  <span>
                    As an <strong>Irregular Student</strong>, you will be issued a blank form allowing customized subject selection with real-time unit calculation.
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-cpc-input-border/50 pt-6">
            {isOfficiallyEnrolled ? (
              <Link to="/online-enrollment/status" className="ml-auto inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-6 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-800">
                View Enrollment Status <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl border border-cpc-input-border/80 bg-white px-4 py-2.5 text-xs font-semibold text-cpc-navy-text transition hover:border-cpc-blue-accent hover:text-cpc-blue-accent"
                >
                  <Edit3 className="h-4 w-4" />
                  Request Detail Correction
                </button>

                <button
                  type="button"
                  onClick={handleConfirm}
                  className="inline-flex items-center gap-2 rounded-xl bg-cpc-blue-accent px-6 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700"
                >
                  {isVerified ? "Continue to Clearance" : "Confirm Details & Proceed"}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Correction Request Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl animate-in fade-in-50 zoom-in-95">
            <div className="flex items-center justify-between border-b border-cpc-input-border/50 pb-4">
              <h3 className="text-base font-bold text-cpc-navy-text">Request Detail Correction</h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1 text-cpc-heading-soft hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {correctionSuccess ? (
              <div className="my-6 text-center">
                <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500 animate-bounce" />
                <h4 className="mt-3 text-sm font-bold text-cpc-navy-text">Correction Request Sent!</h4>
                <p className="mt-1 text-xs text-cpc-heading-soft">
                  The Registrar has received your correction request.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitCorrection} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-cpc-navy-text">Field to Correct</label>
                  <select
                    value={field}
                    onChange={(e) => setField(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-cpc-input-border/80 px-3 py-2 text-xs text-cpc-navy-text focus:border-cpc-blue-accent focus:outline-hidden"
                  >
                    <option value="Year Level">Year Level</option>
                    <option value="Academic Standing">Academic Standing (Regular / Irregular)</option>
                    <option value="Department / Program">Department / Program</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-cpc-navy-text">Correct Value</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 3rd Year or Irregular"
                    value={requestedValue}
                    onChange={(e) => setRequestedValue(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-cpc-input-border/80 px-3 py-2 text-xs text-cpc-navy-text focus:border-cpc-blue-accent focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-cpc-navy-text">Reason for Correction</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Briefly state why this record needs correction..."
                    value={correctionReason}
                    onChange={(e) => setCorrectionReason(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-cpc-input-border/80 px-3 py-2 text-xs text-cpc-navy-text focus:border-cpc-blue-accent focus:outline-hidden"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="rounded-xl px-4 py-2 text-xs font-semibold text-cpc-heading-soft hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-cpc-blue-accent px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700"
                  >
                    Submit Request
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
