import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  CheckCircle2,
  CircleDollarSign,
  ClipboardCheck,
  Download,
  HeartPulse,
  Send,
  ShieldCheck,
  UserRoundCheck,
} from "lucide-react";
import { useAuth } from "@/components/context/useAuth";
import { ConfirmDialog } from "@/components/common/feedback/ConfirmDialog";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import {
  getStudentSession,
  saveStudentSession,
  subscribeToEnrollmentQueue,
  type EnrollmentSignatureOffice,
} from "@/services/enrollmentWorkflow/service";
import { cancelSignatureRequestFromDatabase, loadMyEnrollmentSession, requestSignatureFromDatabase } from "@/services/enrollmentWorkflow/database";
import { useSSE } from "@/hooks/useSSE";
import { downloadQueueTicket } from "@/utils/downloadQueueTicket";
import { SignatureQueuePreview } from "@/components/features/signatureQueues/SignatureQueuePreview";

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
  const { showToast } = useToast();
  const studentId = user?.studentNumber || "2024-00012";
  const isDatabaseStudent = user?.role === "student" && /^\d{8}$/.test(studentId);
  const [session, setSession] = useState(() => getStudentSession(studentId));
  const [sending, setSending] = useState<EnrollmentSignatureOffice | null>(null);
  const [loadingDatabase, setLoadingDatabase] = useState(isDatabaseStudent);
  const [databaseError, setDatabaseError] = useState(false);
  const [enrollmentCompleteOpen, setEnrollmentCompleteOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ kind: "request" | "cancel"; office: EnrollmentSignatureOffice } | null>(null);

  const refresh = useCallback(() => {
    if (!isDatabaseStudent) {
      setSession(getStudentSession(studentId));
      return;
    }
    void loadMyEnrollmentSession().then((saved) => {
      if (saved?.student.studentIdNo !== studentId) throw new Error("Enrollment record was not found.");
      setSession(saved);
      setDatabaseError(false);
    }).catch(() => setDatabaseError(true)).finally(() => setLoadingDatabase(false));
  }, [isDatabaseStudent, studentId]);

  useEffect(() => {
    refresh();
    const unsub = subscribeToEnrollmentQueue(refresh);
    const timer = window.setInterval(refresh, 10000);
    return () => { unsub(); window.clearInterval(timer); };
  }, [refresh]);

  useSSE((type) => {
    if (type === "notification_created" || type === "notification_updated" || type === "enrollment_queue_updated") refresh();
  }, isDatabaseStudent, user?.id);

  const firstThreeSigned = ["screening", "guidance", "clinic"]
    .every((office) => session.steps[office as EnrollmentSignatureOffice].status === "APPROVED");
  const officiallyEnrolled = (["screening", "guidance", "clinic", "registrar", "accounting"] as EnrollmentSignatureOffice[])
    .every((office) => session.steps[office].status === "APPROVED");

  useEffect(() => {
    if (!isDatabaseStudent || loadingDatabase || databaseError || !officiallyEnrolled) return;
    const seenKey = `cpc:official-enrollment-modal:${studentId}`;
    if (window.sessionStorage.getItem(seenKey)) return;
    window.sessionStorage.setItem(seenKey, "shown");
    setEnrollmentCompleteOpen(true);
  }, [databaseError, isDatabaseStudent, loadingDatabase, officiallyEnrolled, studentId]);
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
      const officeName = REQUEST_CARDS.find((card) => card.office === office)?.title ?? office;
      showToast({
        type: "success",
        title: "Signature request sent",
        message: `Your request was sent to ${officeName}.`,
        replaceKey: "student-enrollment-signature-feedback",
      });
    } catch (error) {
      showToast({
        type: "error",
        title: "Request not sent",
        message: error instanceof Error ? error.message : "The signature request could not be sent.",
        replaceKey: "student-enrollment-signature-feedback",
      });
    } finally {
      setSending(null);
    }
  }

  async function handleCancel(office: EnrollmentSignatureOffice) {
    if (!session.signatureRequests?.[office] || session.signatureQueueProcessingOffices?.includes(office) || sending) return;
    setSending(office);
    try {
      const saved = await cancelSignatureRequestFromDatabase(studentId, office);
      saveStudentSession(saved);
      setSession(saved);
      const officeName = REQUEST_CARDS.find((card) => card.office === office)?.title ?? office;
      showToast({
        type: "success",
        title: "Request cancelled",
        message: `Your request to ${officeName} was cancelled. The office has been notified.`,
        replaceKey: "student-enrollment-signature-feedback",
      });
    } catch (error) {
      showToast({
        type: "error",
        title: "Cancellation failed",
        message: error instanceof Error ? error.message : "The signature request could not be cancelled.",
        replaceKey: "student-enrollment-signature-feedback",
      });
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

  if (loadingDatabase) {
    return <div role="status" className="mx-auto max-w-5xl px-4 py-16 text-center font-poppins text-sm text-cpc-heading-soft">Loading your enrollment requests…</div>;
  }

  if (databaseError) {
    return <div role="alert" className="mx-auto max-w-3xl px-4 py-16 text-center font-poppins"><h1 className="text-lg font-bold text-cpc-navy-text">Enrollment data unavailable</h1><p className="mt-2 text-sm text-cpc-heading-soft">Reconnect to the server and reload this page to view your saved Study Load and signature requests.</p></div>;
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

      <div className="mb-6">
        <SignatureQueuePreview workflow="study_load" />
      </div>

      {officiallyEnrolled && (
        <Modal open={enrollmentCompleteOpen} onClose={() => setEnrollmentCompleteOpen(false)} labelledBy="official-enrollment-title" className="sm:max-w-lg">
          <div className="p-6 text-center sm:p-8">
            <BadgeCheck className="mx-auto h-12 w-12 text-emerald-600" aria-hidden />
            <h2 id="official-enrollment-title" className="mt-3 text-xl font-bold text-emerald-900">Congratulations!</h2>
            <p className="mt-2 text-sm font-semibold text-cpc-navy-text">You are officially enrolled as a {session.student.section || session.form.section || "continuing"} student.</p>
            <p className="mt-2 text-xs leading-relaxed text-cpc-heading-soft">All five offices have signed your Study Load for {session.form.term}.</p>
            <Link to="/online-enrollment/status" onClick={() => setEnrollmentCompleteOpen(false)} className="mt-6 inline-flex cursor-pointer items-center justify-center rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800">
              View Enrollment Status
            </Link>
          </div>
        </Modal>
      )}

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

              {session.signatureRequests?.[card.office] && (
                <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50/60 p-3 text-xs text-cpc-navy-text">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold">Queue number: #{session.signatureQueue?.[card.office]?.number ?? "—"}{session.signatureQueue?.[card.office]?.date ? ` · ${session.signatureQueue[card.office]?.date}` : ""}</p>
                    {session.signatureQueue?.[card.office]?.number && session.signatureQueue[card.office]?.date && <button type="button" onClick={() => downloadQueueTicket("Study Load", card.title, session.signatureQueue![card.office]!.number, session.signatureQueue![card.office]!.date)} className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-cpc-blue-accent hover:bg-blue-50"><Download className="h-3.5 w-3.5" aria-hidden />Download ticket</button>}
                  </div>
                  {session.signatureQueueProcessingOffices?.includes(card.office) && <p className="mt-1 font-semibold text-emerald-800">The office is processing this request. It can no longer be cancelled; contact the office if you need help.</p>}
                  <p className="mt-1 text-cpc-heading-soft">{card.office === "screening" ? "Show this number to the Dean when you visit the department office to pay ₱100 in person. It identifies your place in the request line; it is not an appointment time." : "This is your place in the request line for this office. Requests are handled in server-received order."} Each office accepts up to 1,000 requests per day.</p>
                  {card.office === "screening" && !session.screeningFeePaidAt && session.steps.screening.status !== "APPROVED" && <p className="mt-1 font-medium text-amber-800">Your place is saved while the ₱100 payment is pending. The Dean will check payment and sign your request.</p>}
                  {card.office === "screening" && session.screeningFeePaidAt && <p className="mt-1 font-medium text-emerald-800">₱100 payment confirmed by {session.screeningFeeVerifiedBy || "the Dean"}{session.screeningFeePaidAt ? ` · ${new Date(session.screeningFeePaidAt).toLocaleString()}` : ""}. Screening signature is {session.steps.screening.status === "APPROVED" ? "signed" : "in progress"}; Guidance can see the payment update.</p>}
                </div>
              )}

              {session.steps[card.office].remarks && (
                <p className="mt-3 rounded-lg bg-rose-50 p-3 text-xs text-rose-800">
                  Office note: {session.steps[card.office].remarks}
                </p>
              )}

              {signed && (
                <div className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50/40 p-2.5">
                  <div className="flex items-center justify-between gap-3 text-[10.5px]">
                    <span className="text-emerald-800">
                      Signed by <strong className="font-semibold text-emerald-950">{session.steps[card.office].updatedBy ?? card.title}</strong>
                    </span>
                    {session.steps[card.office].updatedAt && (
                      <time className="shrink-0 text-emerald-700/80" dateTime={session.steps[card.office].updatedAt}>
                        {new Date(session.steps[card.office].updatedAt!).toLocaleDateString()}
                      </time>
                    )}
                  </div>
                  <div className="mt-2 flex h-14 items-center justify-center rounded-lg border border-emerald-200/50 bg-white/80 p-1.5">
                    {session.steps[card.office].signatureImage ? (
                      <img
                        src={session.steps[card.office].signatureImage}
                        alt={`Digital signature of ${session.steps[card.office].updatedBy ?? card.title}`}
                        className="max-h-12 w-auto max-w-full object-contain"
                      />
                    ) : (
                      <span className="select-none text-xl leading-none text-cpc-navy-text" style={{ fontFamily: '"Dancing Script", "Segoe Script", cursive' }}>
                        {session.steps[card.office].updatedBy ?? card.title}
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-4 space-y-2">
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => setPendingAction({ kind: "request", office: card.office })}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cpc-blue-accent px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600 disabled:shadow-none"
                >
                  {signed ? <CheckCircle2 className="h-4 w-4" aria-hidden /> : <Send className="h-4 w-4" aria-hidden />}
                  {signed ? "Signed" : sending === card.office && !alreadyRequested ? "Sending request…" : alreadyRequested ? "Request Sent" : "Request Signature"}
                </button>
                {alreadyRequested && !signed && !session.signatureQueueProcessingOffices?.includes(card.office) && (
                  <button
                    type="button"
                    disabled={sending !== null}
                    onClick={() => setPendingAction({ kind: "cancel", office: card.office })}
                    className="inline-flex w-full items-center justify-center rounded-xl border border-rose-200 bg-white px-4 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {sending === card.office ? "Cancelling request…" : "Cancel Request"}
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <div className="mt-7 flex justify-start border-t border-cpc-input-border/50 pt-5">
        <Link to="/student/enrollment-form?step=study-load" className="inline-flex items-center gap-2 rounded-xl bg-cpc-blue-accent px-6 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700">
          <ArrowLeft className="h-4 w-4" aria-hidden /> Go Back to Study Load
        </Link>
      </div>

      <ConfirmDialog
        open={pendingAction !== null}
        onClose={() => setPendingAction(null)}
        onConfirm={() => {
          if (!pendingAction) return;
          const action = pendingAction;
          setPendingAction(null);
          if (action.kind === "request") void handleRequest(action.office);
          else void handleCancel(action.office);
        }}
        title={pendingAction?.kind === "cancel" ? "Cancel this signature request?" : "Send this signature request?"}
        description={pendingAction?.kind === "cancel"
          ? <>Your request to <strong>{REQUEST_CARDS.find((card) => card.office === pendingAction.office)?.title}</strong> will be cancelled, and that office will be notified.</>
          : <>A signature request will be sent to <strong>{REQUEST_CARDS.find((card) => card.office === pendingAction?.office)?.title}</strong>. The office will be notified and can review your enrollment record.</>}
        confirmLabel={pendingAction?.kind === "cancel" ? "Cancel request" : "Send request"}
        danger={pendingAction?.kind === "cancel"}
      />
    </div>
  );
}
