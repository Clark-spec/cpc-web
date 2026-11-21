import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  CheckCircle2,
  CircleDollarSign,
  ClipboardCheck,
  HeartPulse,
  Send,
  ShieldCheck,
  UserRoundCheck,
} from "lucide-react";
import { useAuth } from "@/components/context/useAuth";
import { useToast } from "@/components/ui/toast";
import {
  getStudentSession,
  saveStudentSession,
  subscribeToEnrollmentQueue,
  type EnrollmentSignatureOffice,
} from "@/services/enrollmentWorkflow/service";
import { loadMyEnrollmentSession, requestSignatureFromDatabase } from "@/services/enrollmentWorkflow/database";

const REQUEST_CARDS: Array<{
  office: EnrollmentSignatureOffice;
  title: string;
  note: string;
  icon: typeof ShieldCheck;
}> = [
  {
    office: "screening",
    title: "Dean & Screening Committee",
    note: "Visit your department office (the IT office for BSIT) and pay the ₱100 fee. The Dean will sign after payment is confirmed.",
    icon: ShieldCheck,
  },
  {
    office: "guidance",
    title: "Guidance",
    note: "Send your request. Guidance staff will check your information against their office records, then sign after verification.",
    icon: UserRoundCheck,
  },
  {
    office: "clinic",
    title: "Clinic",
    note: "Visit the campus clinic for the required blood-pressure and pulse check. Clinic staff will also verify your clinic records before signing.",
    icon: HeartPulse,
  },
  {
    office: "registrar",
    title: "Registrar",
    note: "You can request this signature after Dean & Screening, Guidance, and Clinic have signed.",
    icon: ClipboardCheck,
  },
  {
    office: "accounting",
    title: "Accounting",
    note: "You can request this signature after Dean & Screening, Guidance, and Clinic have signed.",
    icon: CircleDollarSign,
  },
];

export function StudentQueueView() {
  const { user } = useAuth();
  const { toast } = useToast();
  const studentId = user?.studentNumber || "2024-00012";
  const [session, setSession] = useState(() => getStudentSession(studentId));
  const [sending, setSending] = useState<EnrollmentSignatureOffice | null>(null);

  useEffect(() => {
    const refresh = () => {
      setSession(getStudentSession(studentId));
      void loadMyEnrollmentSession().then((saved) => {
        if (saved?.student.studentIdNo === studentId) {
          setSession(saved);
        }
      }).catch(() => undefined);
    };
    refresh();
    const unsub = subscribeToEnrollmentQueue(refresh);
    const timer = window.setInterval(refresh, 10000);
    return () => { unsub(); window.clearInterval(timer); };
  }, [studentId]);

  const firstThreeSigned = ["screening", "guidance", "clinic"]
    .every((office) => session.steps[office as EnrollmentSignatureOffice].status === "APPROVED");
  const formReadyForSignatures = session.form.status === "SUBMITTED" || session.form.status === "APPROVED";
  const canRequest: Record<EnrollmentSignatureOffice, boolean> = {
    screening: formReadyForSignatures && session.steps.screening.status !== "APPROVED",
    guidance: formReadyForSignatures && session.steps.guidance.status !== "APPROVED",
    clinic: formReadyForSignatures && session.steps.clinic.status !== "APPROVED",
    registrar: firstThreeSigned && session.steps.registrar.status !== "APPROVED",
    accounting: firstThreeSigned && session.steps.accounting.status !== "APPROVED",
  };

  async function handleRequest(office: EnrollmentSignatureOffice) {
    if (!canRequest[office] || sending) return;
    setSending(office);
    try {
      const saved = await requestSignatureFromDatabase(studentId, office);
      saveStudentSession(saved);
      setSession(saved);
      toast("Your signature request was sent to the assigned office.", "success");
    } catch (error) {
      toast(error instanceof Error ? error.message : "The signature request could not be sent.", "error");
    } finally {
      setSending(null);
    }
  }

  function statusFor(office: EnrollmentSignatureOffice) {
    if (session.steps[office].status === "APPROVED") return { label: "Signed", className: "bg-emerald-50 text-emerald-700" };
    if (session.steps[office].status === "RESUBMIT" || session.steps[office].status === "REJECTED") {
      return { label: "Needs attention", className: "bg-rose-50 text-rose-700" };
    }
    if (session.signatureRequests?.[office]) return { label: "Request sent", className: "bg-amber-50 text-amber-800" };
    return canRequest[office]
      ? { label: "Ready to request", className: "bg-blue-50 text-cpc-blue-accent" }
      : { label: "Waiting for earlier steps", className: "bg-slate-100 text-slate-600" };
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 font-poppins sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 rounded-full bg-cpc-blue-accent/10 px-3.5 py-1.5 text-xs font-semibold text-cpc-blue-accent">
          <BadgeCheck className="h-4 w-4" />
          Enrollment Steps 1–5 · Office Signatures
        </div>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-cpc-navy-text sm:text-3xl">
          Request Enrollment Signatures
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-cpc-heading-soft">
          Request the first three signatures in any order. Registrar and Accounting unlock after all three have signed.
        </p>
      </div>

      {session.ticket && (
        <div className="mb-6 flex flex-wrap items-center gap-2 rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-xs text-cpc-navy-text">
          <Building2 className="h-4 w-4 text-cpc-blue-accent" aria-hidden />
          Queue ticket <strong className="font-mono">{session.ticket.number}</strong> is active for your enrollment.
        </div>
      )}

      {session.form.status !== "SUBMITTED" && session.form.status !== "APPROVED" && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-relaxed text-amber-900">
          Submit your Study Load to the Dean & Screening Committee first. The first signature request will unlock after submission.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {REQUEST_CARDS.map((card, index) => {
          const Icon = card.icon;
          const status = statusFor(card.office);
          const signed = session.steps[card.office].status === "APPROVED";
          const alreadyRequested = Boolean(session.signatureRequests?.[card.office] && session.steps[card.office].status !== "RESUBMIT");
          const disabled = !canRequest[card.office] || signed || alreadyRequested || sending !== null;

          return (
            <article key={card.office} className="flex h-full flex-col rounded-2xl border border-cpc-input-border/70 bg-white p-5 shadow-sm">
              <header className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cpc-section-light text-cpc-blue-accent">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-cpc-heading-soft">Request {index + 1}</p>
                    <h2 className="mt-0.5 text-sm font-bold text-cpc-navy-text">{card.title}</h2>
                  </div>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${status.className}`}>{status.label}</span>
              </header>

              <p className="mt-4 flex-1 rounded-xl border border-cpc-tile-border/60 bg-cpc-section-light/30 p-3 text-xs leading-relaxed text-cpc-heading-soft">
                {card.note}
              </p>

              {session.steps[card.office].remarks && (
                <p className="mt-3 rounded-lg bg-rose-50 p-3 text-xs text-rose-800">
                  Office note: {session.steps[card.office].remarks}
                </p>
              )}

              <button
                type="button"
                disabled={disabled}
                onClick={() => void handleRequest(card.office)}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cpc-blue-accent px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600 disabled:shadow-none"
              >
                {signed ? <CheckCircle2 className="h-4 w-4" aria-hidden /> : <Send className="h-4 w-4" aria-hidden />}
                {signed ? "Signed" : sending === card.office ? "Sending request…" : alreadyRequested ? "Request Sent" : "Request Signature"}
              </button>
            </article>
          );
        })}
      </div>

      <div className="mt-7 flex justify-start border-t border-cpc-input-border/50 pt-5">
        <Link to="/student/enrollment-form" className="inline-flex items-center gap-2 text-xs font-semibold text-cpc-blue-accent hover:underline">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Go back to Study Load
        </Link>
      </div>
    </div>
  );
}
