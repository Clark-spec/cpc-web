import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Printer,
  QrCode,
  Sparkles,
  Ticket,
} from "lucide-react";
import { useAuth } from "@/components/context/useAuth";
import {
  getDepartmentSchedules,
  getQueueTickets,
  getStudentSession,
  subscribeToEnrollmentQueue,
} from "@/services/enrollmentWorkflow/service";

export function StudentQueueView() {
  const { user } = useAuth();
  const studentId = user?.studentNumber || "2024-00012";

  const [session, setSession] = useState(() => getStudentSession(studentId));
  const [tickets, setTickets] = useState(() => getQueueTickets());
  const schedules = getDepartmentSchedules();

  useEffect(() => {
    const unsub = subscribeToEnrollmentQueue(() => {
      setSession(getStudentSession(studentId));
      setTickets(getQueueTickets());
    });
    return unsub;
  }, [studentId]);

  const ticket = session.ticket ?? tickets.find((t) => t.studentId === studentId);

  // Calculate people ahead per office
  const getPeopleAhead = (office: "clinic" | "accounting" | "registrar") => {
    if (!ticket) return 0;
    const myPos = ticket[office].position;
    return tickets.filter(
      (t) =>
        t.department === ticket.department &&
        t.yearGroup === ticket.yearGroup &&
        (t[office].status === "WAITING" || t[office].status === "MOVED_TO_LAST") &&
        t[office].position < myPos,
    ).length;
  };

  const myDeptSchedule = schedules.find(
    (s) =>
      s.department === session.student.department &&
      s.yearGroup === (session.student.yearLevel <= 2 ? "1-2" : "3-4"),
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 font-poppins">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 rounded-full bg-cpc-blue-accent/10 px-3.5 py-1.5 text-xs font-semibold text-cpc-blue-accent">
          <Ticket className="h-4 w-4" />
          Enrollment Steps 5–8 · Queue Ticket & Face-to-Face Progress
        </div>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-cpc-navy-text sm:text-3xl">
          Department Queue Ticket & Status
        </h1>
        <p className="mt-2 text-sm text-cpc-heading-soft">
          Track your face-to-face registration sequence across the Clinic, Accounting, and Registrar offices.
        </p>
      </div>

      {/* If ticket not yet issued (Guidance pending) */}
      {!ticket && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-6 sm:p-8 text-amber-900 shadow-sm">
          <div className="flex items-start gap-4">
            <Clock className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-base font-bold text-amber-900">Queue Number Pending Guidance Approval</h3>
              <p className="mt-2 text-xs sm:text-sm text-amber-800 leading-relaxed">
                Per Section 2 & 4 of the Enrollment Spec, queue numbers are automatically minted once the{" "}
                <strong>Screening Committee</strong> and the <strong>Guidance Office</strong> sign off on your enrollment form and clearance.
              </p>

              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs">
                <div className="flex items-center gap-2 rounded-xl bg-white/80 p-3 border border-amber-200">
                  <span className={`h-2.5 w-2.5 rounded-full ${session.steps.screening.status === "APPROVED" ? "bg-emerald-500" : "bg-amber-500"}`} />
                  <div>
                    <p className="font-bold text-cpc-navy-text">Step 3: Screening Committee</p>
                    <p className="text-[11px] text-cpc-heading-soft">Status: {session.steps.screening.status}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 rounded-xl bg-white/80 p-3 border border-amber-200">
                  <span className={`h-2.5 w-2.5 rounded-full ${session.steps.guidance.status === "APPROVED" ? "bg-emerald-500" : "bg-amber-500"}`} />
                  <div>
                    <p className="font-bold text-cpc-navy-text">Step 4: Guidance Approval</p>
                    <p className="text-[11px] text-cpc-heading-soft">Status: {session.steps.guidance.status}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  to="/student/enrollment-form"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-amber-700 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-800 transition"
                >
                  Check Enrollment Form
                </Link>
                <Link
                  to="/display"
                  target="_blank"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-white px-4 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-50 transition"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> View Public Office Display
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ticket Details (When Issued) */}
      {ticket && (
        <div className="space-y-6">
          {/* Main Ticket Banner */}
          <div className="relative overflow-hidden rounded-3xl border border-cpc-blue-accent/20 bg-linear-to-br from-cpc-blue-accent via-[#18398e] to-[#0f2468] p-6 sm:p-8 text-white shadow-xl">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="text-center sm:text-left">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold tracking-wider uppercase backdrop-blur-xs">
                  <Sparkles className="h-3.5 w-3.5 text-amber-300" /> Official Enrollment Ticket
                </span>
                <h2 className="mt-2 text-4xl sm:text-5xl font-extrabold tracking-tight font-mono text-white">
                  {ticket.number}
                </h2>
                <p className="mt-1 text-sm font-semibold text-blue-100">
                  {ticket.studentName} · {ticket.department} Year {ticket.yearLevel}
                </p>
                <div className="mt-4 flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-blue-100/90 font-medium">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-amber-300" />
                    <span>{myDeptSchedule?.dayLabel ?? ticket.scheduleDate}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-amber-300" />
                    <span>Time Block: {ticket.timeBlock}</span>
                  </div>
                </div>
              </div>

              {/* QR Code Graphic */}
              <div className="shrink-0 rounded-2xl bg-white p-4 shadow-lg text-center">
                <div className="flex h-28 w-28 items-center justify-center rounded-xl bg-slate-50 border-2 border-dashed border-slate-300 text-slate-700">
                  <QrCode className="h-20 w-20 text-cpc-navy-text" />
                </div>
                <span className="mt-2 block font-mono text-[10px] font-bold text-cpc-navy-text">
                  SCAN FOR F2F QUEUE
                </span>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="mt-2.5 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 transition shadow-2xs"
                >
                  <Printer className="h-3.5 w-3.5 text-cpc-blue-accent" />
                  Print Ticket
                </button>
              </div>
            </div>
          </div>

          {/* Department Day Rule Card */}
          <div className="rounded-2xl border border-cpc-input-border/70 bg-white p-5 text-xs text-cpc-heading-soft shadow-xs">
            <p className="font-semibold text-cpc-navy-text">
              📌 Section 4 Rule: One Department per Day & Year Group Time Blocks
            </p>
            <p className="mt-1 leading-relaxed">
              Your ticket <strong className="text-cpc-navy-text font-mono">{ticket.number}</strong> is strictly valid on{" "}
              <strong>{myDeptSchedule?.dayLabel ?? ticket.scheduleDate}</strong> during your prescribed time block (
              <strong>{ticket.timeBlock}</strong>). You must present this QR / ticket number at the Clinic, Accounting, and Registrar counters in sequence.
            </p>
          </div>

          {/* Sequential Face to Face Steps (6, 7, 8) */}
          <div className="rounded-2xl border border-cpc-input-border/70 bg-white p-6 sm:p-8 shadow-sm">
            <h3 className="text-base font-bold text-cpc-navy-text border-b border-cpc-input-border/50 pb-3">
              Face-to-Face Office Station Progress
            </h3>

            <div className="mt-6 space-y-4">
              {/* Station 1: Clinic */}
              <div
                className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border p-5 transition ${
                  ticket.clinic.status === "SERVING"
                    ? "border-cpc-blue-accent bg-blue-50/70 shadow-sm ring-2 ring-cpc-blue-accent/20"
                    : ticket.clinic.status === "DONE"
                    ? "border-emerald-200 bg-emerald-50/60"
                    : "border-cpc-input-border/60 bg-cpc-section-light/30"
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`rounded-xl p-2.5 ${
                      ticket.clinic.status === "DONE"
                        ? "bg-emerald-100 text-emerald-700"
                        : ticket.clinic.status === "SERVING"
                        ? "bg-cpc-blue-accent text-white animate-pulse"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-cpc-heading-soft">
                        Station 1 (Step 6)
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          ticket.clinic.status === "DONE"
                            ? "bg-emerald-100 text-emerald-800"
                            : ticket.clinic.status === "SERVING"
                            ? "bg-blue-600 text-white"
                            : ticket.clinic.status === "CALLED"
                            ? "bg-amber-100 text-amber-800"
                            : ticket.clinic.status === "MOVED_TO_LAST"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {ticket.clinic.status === "MOVED_TO_LAST" ? "MOVED TO LAST" : ticket.clinic.status}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-cpc-navy-text mt-0.5">College Clinic · Health Record Assessment</h4>
                    <p className="text-xs text-cpc-heading-soft mt-0.5">
                      Present health examination form and undergo vitals check.
                    </p>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  {ticket.clinic.status === "DONE" ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
                      <CheckCircle2 className="h-4 w-4" /> Completed
                    </span>
                  ) : ticket.clinic.status === "SERVING" ? (
                    <span className="inline-flex items-center gap-1 rounded-xl bg-cpc-blue-accent px-3 py-1.5 text-xs font-bold text-white shadow-xs">
                      NOW SERVING AT CLINIC!
                    </span>
                  ) : (
                    <div className="text-xs text-cpc-heading-soft">
                      <span className="font-bold text-cpc-navy-text">{getPeopleAhead("clinic")}</span> people ahead in line
                    </div>
                  )}
                </div>
              </div>

              {/* Station 2: Accounting */}
              <div
                className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border p-5 transition ${
                  ticket.accounting.status === "SERVING"
                    ? "border-cpc-blue-accent bg-blue-50/70 shadow-sm ring-2 ring-cpc-blue-accent/20"
                    : ticket.accounting.status === "DONE"
                    ? "border-emerald-200 bg-emerald-50/60"
                    : "border-cpc-input-border/60 bg-cpc-section-light/30"
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`rounded-xl p-2.5 ${
                      ticket.accounting.status === "DONE"
                        ? "bg-emerald-100 text-emerald-700"
                        : ticket.accounting.status === "SERVING"
                        ? "bg-cpc-blue-accent text-white animate-pulse"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-cpc-heading-soft">
                        Station 2 (Step 7)
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          ticket.accounting.status === "DONE"
                            ? "bg-emerald-100 text-emerald-800"
                            : ticket.accounting.status === "SERVING"
                            ? "bg-blue-600 text-white"
                            : ticket.accounting.status === "CALLED"
                            ? "bg-amber-100 text-amber-800"
                            : ticket.accounting.status === "MOVED_TO_LAST"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {ticket.accounting.status === "MOVED_TO_LAST" ? "MOVED TO LAST" : ticket.accounting.status}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-cpc-navy-text mt-0.5">Accounting Office · Payment & Assessment</h4>
                    <p className="text-xs text-cpc-heading-soft mt-0.5">
                      Assessment verification and tuition/misc fee payment confirmation.
                    </p>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  {ticket.accounting.status === "DONE" ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
                      <CheckCircle2 className="h-4 w-4" /> Completed
                    </span>
                  ) : ticket.accounting.status === "SERVING" ? (
                    <span className="inline-flex items-center gap-1 rounded-xl bg-cpc-blue-accent px-3 py-1.5 text-xs font-bold text-white shadow-xs">
                      NOW SERVING AT ACCOUNTING!
                    </span>
                  ) : (
                    <div className="text-xs text-cpc-heading-soft">
                      <span className="font-bold text-cpc-navy-text">{getPeopleAhead("accounting")}</span> people ahead in line
                    </div>
                  )}
                </div>
              </div>

              {/* Station 3: Registrar */}
              <div
                className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border p-5 transition ${
                  ticket.registrar.status === "SERVING"
                    ? "border-cpc-blue-accent bg-blue-50/70 shadow-sm ring-2 ring-cpc-blue-accent/20"
                    : ticket.registrar.status === "DONE"
                    ? "border-emerald-200 bg-emerald-50/60"
                    : "border-cpc-input-border/60 bg-cpc-section-light/30"
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`rounded-xl p-2.5 ${
                      ticket.registrar.status === "DONE"
                        ? "bg-emerald-100 text-emerald-700"
                        : ticket.registrar.status === "SERVING"
                        ? "bg-cpc-blue-accent text-white animate-pulse"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-cpc-heading-soft">
                        Station 3 (Step 8 - Final)
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          ticket.registrar.status === "DONE"
                            ? "bg-emerald-100 text-emerald-800"
                            : ticket.registrar.status === "SERVING"
                            ? "bg-blue-600 text-white"
                            : ticket.registrar.status === "CALLED"
                            ? "bg-amber-100 text-amber-800"
                            : ticket.registrar.status === "MOVED_TO_LAST"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {ticket.registrar.status === "MOVED_TO_LAST" ? "MOVED TO LAST" : ticket.registrar.status}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-cpc-navy-text mt-0.5">Registrar · Final Registration & Certificate</h4>
                    <p className="text-xs text-cpc-heading-soft mt-0.5">
                      Submission of signed printed forms, final stamping, and Certificate of Registration issuance.
                    </p>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  {ticket.registrar.status === "DONE" ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
                      <CheckCircle2 className="h-4 w-4" /> Officially Enrolled!
                    </span>
                  ) : ticket.registrar.status === "SERVING" ? (
                    <span className="inline-flex items-center gap-1 rounded-xl bg-cpc-blue-accent px-3 py-1.5 text-xs font-bold text-white shadow-xs">
                      NOW SERVING AT REGISTRAR!
                    </span>
                  ) : (
                    <div className="text-xs text-cpc-heading-soft">
                      <span className="font-bold text-cpc-navy-text">{getPeopleAhead("registrar")}</span> people ahead in line
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-cpc-input-border/50 pt-5">
              <Link
                to="/student/enrollment-form"
                className="text-xs font-semibold text-cpc-blue-accent hover:underline"
              >
                ← View Enrollment Form Details
              </Link>
              <Link
                to="/display"
                target="_blank"
                className="inline-flex items-center gap-1.5 rounded-xl border border-cpc-input-border/80 bg-white px-4 py-2 text-xs font-semibold text-cpc-navy-text hover:border-cpc-blue-accent transition"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Open Live Public Screen (/display)
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
