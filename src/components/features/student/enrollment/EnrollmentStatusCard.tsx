import { useState, useEffect } from "react";
import { Link } from "react-router";
import {
  ArrowRight,
  ExternalLink,
  QrCode,
  Ticket,
} from "lucide-react";
import { useAuth } from "@/components/context/useAuth";
import { Badge } from "@/components/ui/badge";
import {
  getStudentSession,
  subscribeToEnrollmentQueue,
} from "@/services/enrollmentWorkflow/service";

/** Reference number, current state, progress rail, and live workflow status. */
export function EnrollmentStatusCard() {
  const { user } = useAuth();
  const studentId = user?.studentNumber || "2024-00012";

  const [session, setSession] = useState(() => getStudentSession(studentId));

  useEffect(() => {
    const unsub = subscribeToEnrollmentQueue(() => {
      setSession(getStudentSession(studentId));
    });
    return unsub;
  }, [studentId]);

  const ticket = session.ticket;
  const isEnrolled = session.steps.registrar.status === "APPROVED";

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
            <Badge tone="info" pulse>
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
