import { useState, useEffect } from "react";
import { Link } from "react-router";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Circle,
  ExternalLink,
  QrCode,
  Send,
  Ticket,
} from "lucide-react";
import { useAuth } from "@/components/context/useAuth";
import { Badge } from "@/components/ui/badge";
import {
  getStudentSession,
  checkClearanceStatus,
  subscribeToEnrollmentQueue,
} from "@/services/enrollmentWorkflow/service";
import { loadMyEnrollmentSession } from "@/services/enrollmentWorkflow/database";
import { EnrollmentStatusInfoCards } from "@/components/features/student/enrollment/EnrollmentStatusInfoCards";

/** Reference number, current state, progress rail, and live workflow status. */
export function EnrollmentStatusCard() {
  const { user } = useAuth();
  const studentId = user?.studentNumber || "2024-00012";
  const isDatabaseStudent = user?.role === "student" && /^\d{8}$/.test(studentId);

  const [session, setSession] = useState(() => getStudentSession(studentId));
  const [loadingDatabase, setLoadingDatabase] = useState(isDatabaseStudent);
  const [databaseError, setDatabaseError] = useState(false);

  useEffect(() => {
    const refresh = () => {
      if (!isDatabaseStudent) {
        setSession(getStudentSession(studentId));
        return;
      }
      void loadMyEnrollmentSession().then((saved) => {
        if (saved?.student.studentIdNo !== studentId) throw new Error("Enrollment record was not found.");
        setSession(saved);
        setDatabaseError(false);
      }).catch(() => setDatabaseError(true)).finally(() => setLoadingDatabase(false));
    };
    refresh();
    const unsub = isDatabaseStudent ? () => {} : subscribeToEnrollmentQueue(refresh);
    const timer = window.setInterval(refresh, 10000);
    return () => { unsub(); window.clearInterval(timer); };
  }, [isDatabaseStudent, studentId]);

  if (loadingDatabase) {
    return <div role="status" className="enroll-card p-6 text-center font-poppins text-sm text-cpc-heading-soft">Loading enrollment status…</div>;
  }

  if (databaseError && isDatabaseStudent) {
    return <div role="alert" className="enroll-card p-6 text-center font-poppins text-sm text-cpc-heading-soft">Your enrollment status could not be loaded. Reconnect to the server and reload this page.</div>;
  }

  const ticket = session.ticket;
  const signatureSteps = [
    { key: "screening", label: "Request 1", office: "Dean & Screening Committee" },
    { key: "guidance", label: "Request 2", office: "Guidance" },
    { key: "clinic", label: "Request 3", office: "Clinic" },
    { key: "registrar", label: "Request 4", office: "Registrar" },
    { key: "accounting", label: "Request 5", office: "Accounting" },
  ] as const;
  const isEnrolled = signatureSteps.every(({ key }) => session.steps[key].status === "APPROVED");
  const submitted = session.form.status === "SUBMITTED" || session.form.status === "APPROVED";
  const firstThreeComplete = signatureSteps.slice(0, 3).every(({ key }) => session.steps[key].status === "APPROVED");
  const requestedPending = signatureSteps.filter(({ key }) =>
    Boolean(session.signatureRequests?.[key]) && session.steps[key].status !== "APPROVED",
  );
  const needsAttention = signatureSteps.filter(({ key }) =>
    session.steps[key].status === "REJECTED" || session.steps[key].status === "RESUBMIT",
  );
  const availableRequests = signatureSteps.filter(({ key }, index) =>
    submitted && session.steps[key].status !== "APPROVED" && !session.signatureRequests?.[key] &&
    (index < 3 || firstThreeComplete),
  );
  const clearanceComplete = isDatabaseStudent
    ? Boolean(session.clearance?.offices?.length === 5 && session.clearance.offices.every((office) => office.status === "signed")) || session.steps.clearance.status === "APPROVED"
    : checkClearanceStatus(studentId).cleared || session.steps.clearance.status === "APPROVED";
  const clearanceOffices = isDatabaseStudent
    ? session.clearance?.offices ?? []
    : checkClearanceStatus(studentId).offices;
  const signedClearanceCount = session.steps.clearance.status === "APPROVED"
    ? 5
    : clearanceOffices.filter((office) => office.status === "signed").length;
  const currentStep = isEnrolled
    ? "Enrollment complete"
    : submitted
      ? "Step 3 · Request Enrollment Signatures"
      : session.steps.verification.status !== "APPROVED"
        ? "Step 0 · Student Verification & Academic Standing"
        : clearanceComplete
          ? "Step 2 · Study Load"
          : "Step 1 · Online Clearance";
  const currentStepDetail = isEnrolled
    ? "All five offices have signed your Study Load."
    : submitted
      ? needsAttention.length
        ? `Action needed from: ${needsAttention.map(({ office }) => office).join(", ")}.`
        : requestedPending.length
          ? `Signature requested from: ${requestedPending.map(({ office }) => office).join(", ")}.`
          : availableRequests.length
            ? `Ready to request: ${availableRequests.map(({ office }) => office).join(", ")}.`
            : "Waiting for the earlier office signatures."
      : session.steps.verification.status !== "APPROVED"
        ? "Confirm your Registrar record to continue."
        : clearanceComplete
          ? "Online Clearance is complete. Review and submit your Study Load next."
          : `Complete all Online Clearance signatures first (${signedClearanceCount} of 5 signed).`;

  return (
    <div className="enroll-card p-6 sm:p-8 font-poppins">
      <div className="mb-8 text-center">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-enroll-hero-bg px-4 py-2">
            <span className="text-sm font-semibold text-enroll-heading">Reference:</span>
            <span className="text-sm font-mono font-bold text-enroll-primary">
              {ticket ? ticket.number : session.form.id}
            </span>
          </div>

          {isEnrolled ? (
            <Badge tone="success">Enrolled Officially</Badge>
          ) : ticket ? (
            <Badge tone="info">
              Queue Ticket Active
            </Badge>
          ) : requestedPending.length ? (
            <Badge tone="info">Waiting on {requestedPending.map(({ office }) => office).join(", ")}</Badge>
          ) : needsAttention.length ? (
            <Badge tone="warning">Office action needed</Badge>
          ) : (
            <Badge tone="warning">
              {submitted ? "Ready for office requests" : "Application In Progress"}
            </Badge>
          )}
        </div>

        <p className="mt-3 text-sm text-enroll-text">
          Continuing Enrollment for{" "}
          <strong className="text-cpc-navy-text">{session.student.name}</strong> ({session.student.course} · Year{" "}
          {session.student.yearLevel})
        </p>
      </div>

      <div className={`mb-6 rounded-2xl border p-4 ${isEnrolled ? "border-emerald-200 bg-emerald-50" : "border-blue-100 bg-blue-50/70"}`}>
        <p className={`text-[10px] font-bold uppercase tracking-wider ${isEnrolled ? "text-emerald-700" : "text-cpc-blue-accent"}`}>Current Step</p>
        <h2 className={`mt-1 text-base font-bold ${isEnrolled ? "text-emerald-900" : "text-cpc-navy-text"}`}>{currentStep}</h2>
        <p className={`mt-1 text-xs ${isEnrolled ? "text-emerald-800" : "text-cpc-heading-soft"}`}>{currentStepDetail}</p>
      </div>

      {isEnrolled && (
        <div className="mb-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center">
          <BadgeCheck className="mx-auto h-8 w-8 text-emerald-700" />
          <h2 className="mt-2 text-lg font-bold text-emerald-900">You are officially enrolled.</h2>
          <p className="mt-1 text-xs text-emerald-800">All five required offices have digitally signed your Study Load.</p>
        </div>
      )}

      {isEnrolled && (
        <section className="mb-8 rounded-2xl border border-cpc-input-border/70 bg-white p-5">
          <h3 className="text-sm font-bold text-cpc-navy-text">Completed Study Load · {session.form.term} · {session.form.section || session.student.section}</h3>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-xs">
              <thead><tr className="border-b border-cpc-input-border/60 text-[10px] uppercase text-cpc-heading-soft"><th className="py-2">Subject Code</th><th className="py-2">Descriptive Title</th><th className="py-2">Time</th><th className="py-2">Days</th><th className="py-2">Set A · F2F</th><th className="py-2">Set B · Online</th><th className="py-2">Units</th><th className="py-2">Instructor</th></tr></thead>
              <tbody className="divide-y divide-cpc-input-border/40">
                {session.form.subjects.map((subject) => <tr key={subject.code}><td className="py-2 font-bold text-cpc-blue-accent">{subject.code}</td><td className="py-2">{subject.title}</td><td className="py-2">{subject.schedule}</td><td className="py-2">{subject.days || "—"}</td><td className="py-2">{subject.roomSetA || subject.room || "—"}</td><td className="py-2">{subject.roomSetB || "ONLINE"}</td><td className="py-2">{subject.units}</td><td className="py-2">{subject.instructor || "—"}</td></tr>)}
              </tbody>
            </table>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {signatureSteps.map(({ key, label }) => {
              const step = session.steps[key];
              return <div key={key} className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-3 text-[11px]">
                <p className="font-bold text-cpc-navy-text">{label}</p>
                {step.signatureImage && <img src={step.signatureImage} alt={`Digital signature of ${step.updatedBy || "Authorized Officer"}`} className="mt-2 h-10 max-w-32 rounded border border-emerald-200 bg-white object-contain p-1" />}
                <p className="mt-1 italic text-emerald-800">Digitally signed by {step.updatedBy || "Authorized Officer"}</p>
                {step.updatedAt && <p className="text-emerald-700">{new Date(step.updatedAt).toLocaleString()}</p>}
              </div>;
            })}
          </div>
        </section>
      )}

      {/* Ticket Showcase if minted */}
      {ticket ? (
        <div className="mb-8 rounded-2xl bg-linear-to-r from-cpc-blue-accent to-[#153488] p-6 text-white shadow-md">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="rounded-full bg-white/20 px-3 py-1 text-[11px] font-bold uppercase tracking-wider">
                Issued Queue Ticket
              </span>
              <h3 className="mt-2 text-4xl font-extrabold font-mono text-white">{ticket.number}</h3>
              <p className="mt-1 text-xs text-blue-100 font-medium">
                {ticket.scheduleDate} · Time Block: {ticket.timeBlock}
              </p>
            </div>
            <Link
              to="/student/queue"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs font-bold text-cpc-blue-accent shadow-sm hover:bg-blue-50 transition"
            >
              <QrCode className="h-4 w-4" /> View QR & F2F Line Status
            </Link>
          </div>
        </div>
      ) : !isEnrolled ? (
        <div className="mb-8 flex justify-center">
          <Link
            to="/student/verify"
            className="inline-flex items-center gap-2 rounded-xl bg-cpc-blue-accent px-6 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition"
          >
            Complete Next Enrollment Step <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : null}

      {!isEnrolled && <section className="space-y-4" aria-label="Enrollment progress">
        <h3 className="text-xs font-bold uppercase tracking-wider text-cpc-heading-soft">Enrollment Progress</h3>

        <article className={`rounded-2xl border p-4 ${session.steps.verification.status === "APPROVED" ? "border-emerald-200 bg-emerald-50/50" : "border-blue-200 bg-blue-50/50 ring-1 ring-blue-200"}`}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-cpc-heading-soft">Step 0</p>
              <h4 className="mt-1 text-sm font-bold text-cpc-navy-text">Student Verification &amp; Academic Standing</h4>
              <p className="mt-1 text-xs text-cpc-heading-soft">Registrar confirms your student record and continuing-student status.</p>
            </div>
            <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${session.steps.verification.status === "APPROVED" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}`}>
              {session.steps.verification.status === "APPROVED" ? "Completed" : "Current"}
            </span>
          </div>
        </article>

        <article className={`rounded-2xl border p-4 ${clearanceComplete && submitted ? "border-emerald-200 bg-emerald-50/50" : session.steps.verification.status === "APPROVED" ? "border-blue-200 bg-blue-50/40" : "border-cpc-input-border/70 bg-slate-50/70"}`}>
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-cpc-heading-soft">Steps 1–2</p>
              <h4 className="mt-1 text-sm font-bold text-cpc-navy-text">Online Clearance &amp; Study Load</h4>
            </div>
            <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${clearanceComplete && submitted ? "bg-emerald-100 text-emerald-700" : session.steps.verification.status === "APPROVED" ? "bg-blue-100 text-blue-700" : "bg-slate-200 text-slate-600"}`}>
              {clearanceComplete && submitted ? "Completed" : session.steps.verification.status === "APPROVED" ? "In progress" : "Waiting for Step 0"}
            </span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className={`rounded-xl border p-3 ${clearanceComplete ? "border-emerald-200 bg-white" : session.steps.verification.status === "APPROVED" ? "border-blue-200 bg-white" : "border-slate-200 bg-white/70"}`}>
              <div className="flex items-center gap-2">
                {clearanceComplete ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : session.steps.verification.status === "APPROVED" ? <Circle className="h-4 w-4 text-blue-600" /> : <Circle className="h-4 w-4 text-slate-400" />}
                <p className="text-xs font-bold text-cpc-navy-text">Step 1 · Online Clearance</p>
              </div>
              <p className="mt-1 pl-6 text-[11px] text-cpc-heading-soft">{clearanceComplete ? "All five clearance offices have signed." : `${signedClearanceCount} of 5 clearance signatures completed.`}</p>
            </div>
            <div className={`rounded-xl border p-3 ${submitted ? "border-emerald-200 bg-white" : clearanceComplete ? "border-blue-200 bg-white" : "border-slate-200 bg-white/70"}`}>
              <div className="flex items-center gap-2">
                {submitted ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : clearanceComplete ? <Circle className="h-4 w-4 text-blue-600" /> : <Circle className="h-4 w-4 text-slate-400" />}
                <p className="text-xs font-bold text-cpc-navy-text">Step 2 · Study Load</p>
              </div>
              <p className="mt-1 pl-6 text-[11px] text-cpc-heading-soft">{submitted ? "Study Load submitted for office signatures." : clearanceComplete ? "Ready to review and submit your Study Load." : "Available after Online Clearance is complete."}</p>
            </div>
          </div>
        </article>

        <article className={`rounded-2xl border p-4 ${isEnrolled ? "border-emerald-200 bg-emerald-50/50" : submitted ? "border-blue-200 bg-blue-50/40 ring-1 ring-blue-200" : "border-cpc-input-border/70 bg-slate-50/70"}`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-cpc-heading-soft">Step 3</p>
              <h4 className="mt-1 text-sm font-bold text-cpc-navy-text">Request Enrollment Signatures</h4>
              <p className="mt-1 text-xs text-cpc-heading-soft">Track each office request and its signature status.</p>
            </div>
            <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${isEnrolled ? "bg-emerald-100 text-emerald-700" : submitted ? "bg-blue-100 text-blue-700" : "bg-slate-200 text-slate-600"}`}>
              {isEnrolled ? "Completed · Officially enrolled" : submitted ? "Current" : "Waiting for Study Load"}
            </span>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {signatureSteps.map(({ key, label, office }, index) => {
              const step = session.steps[key];
              const requested = Boolean(session.signatureRequests?.[key]);
              const signed = step.status === "APPROVED";
              const attention = step.status === "REJECTED" || step.status === "RESUBMIT";
              const ready = submitted && !signed && !requested && (index < 3 || firstThreeComplete);
              const stateLabel = signed ? "Signed" : attention ? "Needs attention" : requested ? "Request sent · Pending" : ready ? "Ready to request" : "Waiting for earlier steps";
              const stateClass = signed
                ? "border-emerald-200 bg-emerald-50/70"
                : attention
                  ? "border-rose-200 bg-rose-50/70"
                  : requested
                    ? "border-amber-200 bg-amber-50/70"
                    : ready
                      ? "border-blue-200 bg-blue-50/70"
                      : "border-slate-200 bg-slate-50/70";
              const stateTextClass = signed
                ? "text-emerald-700"
                : attention
                  ? "text-rose-700"
                  : requested
                    ? "text-amber-700"
                    : ready
                      ? "text-blue-700"
                      : "text-slate-500";
              return (
                <div key={key} className={`rounded-xl border p-3 ${stateClass}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-cpc-heading-soft">{label}</p>
                      <p className="mt-0.5 text-xs font-bold text-cpc-navy-text">{office}</p>
                    </div>
                    <span className={`shrink-0 text-[10px] font-bold ${stateTextClass}`}>{stateLabel}</span>
                  </div>
                  {signed ? (
                    <p className="mt-2 text-[10px] text-emerald-800">Digitally signed by {step.updatedBy ?? office}{step.updatedAt ? ` · ${new Date(step.updatedAt).toLocaleDateString()}` : ""}</p>
                  ) : requested ? (
                    <p className="mt-2 text-[10px] text-amber-800">Waiting for {office} to review and sign.</p>
                  ) : attention ? (
                    <p className="mt-2 text-[10px] text-rose-800">{step.remarks || "Review the office note and send the request again."}</p>
                  ) : !submitted ? (
                    <p className="mt-2 text-[10px] text-slate-600">Submit your Study Load before requesting signatures.</p>
                  ) : index >= 3 && !firstThreeComplete ? (
                    <p className="mt-2 text-[10px] text-slate-600">Available after Requests 1–3 are signed.</p>
                  ) : (
                    <p className="mt-2 flex items-center gap-1 text-[10px] text-blue-700"><Send className="h-3 w-3" aria-hidden /> Available to request.</p>
                  )}
                </div>
              );
            })}
          </div>
        </article>
      </section>}

      {!isEnrolled && <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center border-t border-cpc-input-border/50 pt-6">
        <Link to="/student/queue" className="cpc-btn cpc-btn-primary">
          <Ticket className="h-4 w-4" /> Request Signatures
        </Link>
        <Link to="/student/enrollment-form" className="cpc-btn cpc-btn-secondary">
          Review Form Subjects
        </Link>
        <Link to="/display" target="_blank" className="cpc-btn cpc-btn-secondary">
          <ExternalLink className="h-4 w-4" /> Live Board (/display)
        </Link>
      </div>}
      {!isEnrolled && <div className="mt-8"><EnrollmentStatusInfoCards /></div>}
    </div>
  );
}
