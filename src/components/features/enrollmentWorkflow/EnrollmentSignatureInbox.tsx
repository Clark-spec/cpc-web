import { useCallback, useEffect, useState } from "react";
import { BadgeCheck, CheckCircle2, Clock, RefreshCw } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { getOfficeSignatureRequests, signEnrollmentInDatabase } from "@/services/enrollmentWorkflow/database";
import type { StudentEnrollmentSession } from "@/types/enrollmentWorkflow";
import type { EnrollmentSignatureOffice } from "@/services/enrollmentWorkflow/service";

const titles: Record<EnrollmentSignatureOffice, string> = {
  screening: "Screening Committee & Dean",
  guidance: "Guidance Counselor",
  clinic: "Clinic",
  registrar: "Registrar",
  accounting: "Accounting",
};

export function EnrollmentSignatureInbox({ office }: { office: EnrollmentSignatureOffice }) {
  const { toast } = useToast();
  const [sessions, setSessions] = useState<StudentEnrollmentSession[]>([]);
  const [feeConfirmed, setFeeConfirmed] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    try {
      setSessions(await getOfficeSignatureRequests(office));
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load database signature requests.");
    }
  }, [office]);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), 10000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  async function handleSign(studentId: string) {
    if (office === "screening" && !feeConfirmed[studentId]) return;
    setBusy(studentId);
    try {
      await signEnrollmentInDatabase(studentId, office, office === "screening" && feeConfirmed[studentId] === true);
      toast(`${titles[office]} signature saved to the database.`, "success");
      setFeeConfirmed((current) => ({ ...current, [studentId]: false }));
      await refresh();
    } catch (cause) {
      toast(cause instanceof Error ? cause.message : "Signature could not be saved.", "error");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="mb-8 rounded-2xl border border-cpc-input-border/70 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cpc-input-border/50 pb-4">
        <div className="flex items-center gap-2">
          <BadgeCheck className="h-5 w-5 text-cpc-blue-accent" />
          <div>
            <h2 className="text-sm font-bold text-cpc-navy-text">Database Signature Requests · {titles[office]}</h2>
            <p className="text-[11px] text-cpc-heading-soft">Requests from students appear here and refresh automatically.</p>
          </div>
        </div>
        <button type="button" onClick={() => void refresh()} className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold text-cpc-blue-accent hover:bg-cpc-section-light">
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>
      {error && <p className="mt-3 rounded-lg bg-rose-50 p-3 text-xs text-rose-700">{error}</p>}
      <div className="mt-4 space-y-3">
        {sessions.length === 0 ? (
          <p className="rounded-xl border border-dashed p-5 text-center text-xs text-cpc-heading-soft">No pending signature requests.</p>
        ) : sessions.map((session) => {
          const studentId = session.student.studentIdNo;
          const requestTime = session.signatureRequests?.[office];
          return (
            <article key={studentId} className="rounded-xl border border-cpc-input-border/60 bg-cpc-section-light/30 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-cpc-navy-text">{session.student.name}</p>
                  <p className="mt-0.5 text-xs text-cpc-heading-soft">ID {studentId} · {session.student.course} · {session.student.yearLevel}{session.student.yearLevel === 1 ? "st" : session.student.yearLevel === 2 ? "nd" : session.student.yearLevel === 3 ? "rd" : "th"} Year</p>
                  <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-cpc-muted-blue"><Clock className="h-3 w-3" /> Request received {requestTime ? new Date(requestTime).toLocaleString() : ""}</p>
                  <p className="mt-2 text-xs text-cpc-heading-soft">Study Load: {session.form.totalUnits} units · {session.form.term}</p>
                </div>
                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold text-amber-800">Signature requested</span>
              </div>
              {office === "screening" && (
                <label className="mt-4 flex items-start gap-2 text-xs text-cpc-heading-soft">
                  <input type="checkbox" checked={feeConfirmed[studentId] === true} onChange={(event) => setFeeConfirmed((current) => ({ ...current, [studentId]: event.target.checked }))} />
                  Confirm that the student paid the required ₱100 department fee.
                </label>
              )}
              <button type="button" disabled={busy === studentId || (office === "screening" && !feeConfirmed[studentId])} onClick={() => void handleSign(studentId)} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-cpc-blue-accent px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
                <CheckCircle2 className="h-4 w-4" /> {busy === studentId ? "Saving signature…" : "Sign Study Load"}
              </button>
              <p className="mt-2 text-[10px] text-cpc-heading-soft">Signing records your staff account and the current time in the enrollment database.</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
