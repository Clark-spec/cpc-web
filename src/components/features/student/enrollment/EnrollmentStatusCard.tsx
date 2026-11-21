import { useState, useEffect } from "react";
import { Link } from "react-router";
import {
  ArrowRight,
  BadgeCheck,
  ExternalLink,
  QrCode,
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
    { key: "screening", label: "1. Screening Committee & Dean" },
    { key: "guidance", label: "2. Guidance Counselor" },
    { key: "clinic", label: "3. Clinic" },
    { key: "accounting", label: "4. Accounting" },
    { key: "registrar", label: "5. Registrar" },
  ] as const;
  const isEnrolled = signatureSteps.every(({ key }) => session.steps[key].status === "APPROVED");
  const submitted = session.form.status === "SUBMITTED" || session.form.status === "APPROVED";
  const firstThree = signatureSteps.slice(0, 3);
  const lastTwo = signatureSteps.slice(3);
  const firstThreeComplete = firstThree.every(({ key }) => session.steps[key].status === "APPROVED");
  const pendingSignatures = (firstThreeComplete ? lastTwo : firstThree)
    .filter(({ key }) => session.steps[key].status !== "APPROVED");
  const requestedPending = pendingSignatures.filter(({ key }) => session.signatureRequests?.[key]);
  const clearanceComplete = isDatabaseStudent
    ? Boolean(session.clearance?.offices?.length === 5 && session.clearance.offices.every((office) => office.status === "signed"))
    : checkClearanceStatus(studentId).cleared || session.steps.clearance.status === "APPROVED";
  const currentStep = isEnrolled
    ? "Enrollment complete"
    : submitted
      ? firstThreeComplete ? "Step 4 · Final office signatures" : "Step 3 · Office signatures"
      : session.steps.verification.status !== "APPROVED"
        ? "Step 0 · Student verification"
        : clearanceComplete
          ? "Step 2 · Study Load"
          : "Step 1 · Online Clearance";
  const currentStepDetail = isEnrolled
    ? "All five offices have signed your Study Load."
    : submitted
      ? requestedPending.length
        ? `Waiting for: ${requestedPending.map(({ label }) => label.replace(/^\d\. /, "")).join(", ")}.`
        : "Send the available office signature requests to continue."
      : session.steps.verification.status !== "APPROVED"
        ? "Confirm your Registrar record to continue."
        : clearanceComplete
          ? "Open your fixed Study Load and request signatures."
          : "Complete all Online Clearance signatures first.";

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
          ) : (
            <Badge tone="warning">
              {session.steps.screening.status === "PENDING"
                ? "Under Screening Review"
                : session.steps.guidance.status === "PENDING"
                ? "Under Guidance Review"
                : "Application In Progress"}
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
          <h3 className="text-sm font-bold text-cpc-navy-text">Completed Study Load · {session.form.term}</h3>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-xs">
              <thead><tr className="border-b border-cpc-input-border/60 text-[10px] uppercase text-cpc-heading-soft"><th className="py-2">Subject Code</th><th className="py-2">Descriptive Title</th><th className="py-2">Time</th><th className="py-2">Units</th><th className="py-2">Instructor</th></tr></thead>
              <tbody className="divide-y divide-cpc-input-border/40">
                {session.form.subjects.map((subject) => <tr key={subject.code}><td className="py-2 font-bold text-cpc-blue-accent">{subject.code}</td><td className="py-2">{subject.title}</td><td className="py-2">{subject.schedule}</td><td className="py-2">{subject.units}</td><td className="py-2">{subject.instructor || "—"}</td></tr>)}
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
      ) : (
        <div className="mb-8 flex justify-center">
          <Link
            to="/student/verify"
            className="inline-flex items-center gap-2 rounded-xl bg-cpc-blue-accent px-6 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition"
          >
            Complete Next Enrollment Step <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      {/* Workflow Steps Rail */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-cpc-heading-soft">
          Sequential Approval Pipeline (Spec Section 2)
        </h4>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {Object.values(session.steps).map((step, idx) => (
            <div
              key={step.stepName}
              className={`flex items-center justify-between p-3 rounded-xl border text-xs ${
                step.status === "APPROVED"
                  ? "bg-emerald-50/60 border-emerald-200 text-emerald-900"
                  : step.status === "PENDING"
                  ? "bg-blue-50/70 border-blue-200 text-blue-900 ring-1 ring-blue-300"
                  : step.status === "RESUBMIT"
                  ? "bg-rose-50/70 border-rose-200 text-rose-900"
                  : "bg-slate-50 border-slate-200 text-slate-500 opacity-70"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] font-bold">Step {idx}:</span>
                <span className="font-semibold">{step.label}</span>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  step.status === "APPROVED"
                    ? "bg-emerald-200/80 text-emerald-800"
                    : step.status === "PENDING"
                    ? "bg-blue-200/80 text-blue-800"
                    : step.status === "RESUBMIT"
                    ? "bg-rose-200/80 text-rose-800"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {step.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center border-t border-cpc-input-border/50 pt-6">
        <Link to="/student/queue" className="cpc-btn cpc-btn-primary">
          <Ticket className="h-4 w-4" /> Request Signatures
        </Link>
        <Link to="/student/enrollment-form" className="cpc-btn cpc-btn-secondary">
          Review Form Subjects
        </Link>
        <Link to="/display" target="_blank" className="cpc-btn cpc-btn-secondary">
          <ExternalLink className="h-4 w-4" /> Live Board (/display)
        </Link>
      </div>
    </div>
  );
}
