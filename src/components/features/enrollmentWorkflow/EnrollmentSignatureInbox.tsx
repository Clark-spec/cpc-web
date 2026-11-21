import { useCallback, useEffect, useState } from "react";
import { BadgeCheck, Clock, PenLine, RefreshCw, ShieldCheck } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { Modal } from "@/components/ui/modal";
import { SignaturePadModal } from "@/components/features/admin/clearance/SignaturePadModal";
import { useSavedSignatures } from "@/components/features/admin/clearance/useSavedSignatures";
import { useAdminAuth } from "@/components/context/AdminAuthContext";
import { getOfficeSignatureRequests, signEnrollmentInDatabase } from "@/services/enrollmentWorkflow/database";
import type { StudentEnrollmentSession } from "@/types/enrollmentWorkflow";
import type { SignatureDraft } from "@/components/features/admin/clearance/types";
import type { EnrollmentSignatureOffice } from "@/services/enrollmentWorkflow/service";

const titles: Record<EnrollmentSignatureOffice, string> = {
  screening: "Dean & Screening Committee",
  guidance: "Guidance Counselor",
  clinic: "Clinic",
  registrar: "Registrar",
  accounting: "Accounting",
};

export function EnrollmentSignatureInbox({ office }: { office: EnrollmentSignatureOffice }) {
  const { toast } = useToast();
  const { user } = useAdminAuth();
  const signatureLibrary = useSavedSignatures(user?.id ?? "");
  const [sessions, setSessions] = useState<StudentEnrollmentSession[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [activeStudentId, setActiveStudentId] = useState<string | null>(null);
  const [signatureId, setSignatureId] = useState("");
  const [captured, setCaptured] = useState<SignatureDraft | null>(null);
  const [padOpen, setPadOpen] = useState(false);
  const [feeConfirmed, setFeeConfirmed] = useState(false);
  const [certified, setCertified] = useState(false);

  const activeSession = sessions.find((session) => session.student.studentIdNo === activeStudentId) ?? null;
  const savedSignature = signatureLibrary.signatures.find((signature) => signature.id === signatureId)
    ?? signatureLibrary.defaultSignature;
  const selectedDraft: SignatureDraft | null = captured ?? (savedSignature ? {
    imageBase64: savedSignature.imageBase64,
    method: savedSignature.method,
    label: savedSignature.label,
  } : null);

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

  useEffect(() => {
    if (!signatureId && signatureLibrary.defaultSignature) setSignatureId(signatureLibrary.defaultSignature.id);
  }, [signatureId, signatureLibrary.defaultSignature]);

  function openSigning(studentId: string) {
    setActiveStudentId(studentId);
    setCaptured(null);
    setSignatureId(signatureLibrary.defaultSignature?.id ?? "");
    setFeeConfirmed(false);
    setCertified(false);
  }

  async function handleSign() {
    if (!activeSession || !selectedDraft || !certified || busy) return;
    if (office === "screening" && !feeConfirmed) return;
    const studentId = activeSession.student.studentIdNo;
    setBusy(studentId);
    try {
      if (captured?.saveAs) {
        try {
          await signatureLibrary.add({
            imageBase64: captured.imageBase64,
            method: captured.method,
            label: captured.saveAs.label,
            isDefault: captured.saveAs.isDefault,
          });
        } catch {
          // The current signature can still be applied if saving it for later fails.
        }
      }
      await signEnrollmentInDatabase(studentId, office, office === "screening" && feeConfirmed, {
        imageBase64: selectedDraft.imageBase64,
        method: selectedDraft.method,
        label: selectedDraft.label,
      });
      toast(`${titles[office]} digital signature saved.`, "success");
      setActiveStudentId(null);
      await refresh();
    } catch (cause) {
      toast(cause instanceof Error ? cause.message : "Digital signature could not be saved.", "error");
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
              <button type="button" onClick={() => openSigning(studentId)} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-cpc-blue-accent px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700">
                <PenLine className="h-4 w-4" /> Review &amp; Sign
              </button>
            </article>
          );
        })}
      </div>

      <Modal open={activeSession !== null} onClose={() => setActiveStudentId(null)} labelledBy="enrollment-sign-title" className="sm:max-w-xl">
        {activeSession && (
          <div className="p-5 sm:p-6">
            <h2 id="enrollment-sign-title" className="text-lg font-bold text-cpc-navy-text">Digitally sign Study Load</h2>
            <p className="mt-1 text-xs text-cpc-heading-soft">Signing as {user?.name ?? "Authorized Officer"} · {titles[office]}</p>
            <div className="mt-4 rounded-xl border border-cpc-input-border/60 bg-cpc-section-light/40 p-3 text-xs text-cpc-navy-text">
              <strong>{activeSession.student.name}</strong> · ID {activeSession.student.studentIdNo}<br />
              {activeSession.form.term} · {activeSession.form.totalUnits} units
            </div>
            {office === "screening" && (
              <label className="mt-4 flex items-start gap-2 text-xs text-cpc-heading-soft">
                <input type="checkbox" checked={feeConfirmed} onChange={(event) => setFeeConfirmed(event.target.checked)} />
                Confirm that the student paid the required ₱100 department fee.
              </label>
            )}
            <div className="mt-4 rounded-xl border border-cpc-input-border/60 p-3">
              <p className="text-xs font-semibold text-cpc-navy-text">Signature source</p>
              {signatureLibrary.signatures.length > 0 && !captured && (
                <label className="mt-2 block text-[11px] text-cpc-heading-soft">
                  Use a saved signature
                  <select value={savedSignature?.id ?? ""} onChange={(event) => setSignatureId(event.target.value)} className="mt-1 block w-full rounded-lg border border-cpc-input-border bg-white px-3 py-2 text-xs text-cpc-navy-text">
                    {signatureLibrary.signatures.map((signature) => <option key={signature.id} value={signature.id}>{signature.label}{signature.isDefault ? " (default)" : ""}</option>)}
                  </select>
                </label>
              )}
              {selectedDraft ? (
                <div className="mt-3 flex items-center gap-3">
                  <img src={selectedDraft.imageBase64} alt="Digital signature preview" className="h-12 max-w-40 rounded border border-cpc-input-border bg-white object-contain p-1" />
                  <span className="text-[11px] text-cpc-heading-soft">{selectedDraft.label ?? selectedDraft.method}</span>
                </div>
              ) : <p className="mt-2 text-[11px] text-cpc-heading-soft">Create a signature to continue.</p>}
              <button type="button" onClick={() => setPadOpen(true)} className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-cpc-input-border px-3 py-2 text-xs font-semibold text-cpc-blue-accent hover:bg-cpc-section-light">
                <PenLine className="h-3.5 w-3.5" /> {captured ? "Change signature" : "Draw, type or upload"}
              </button>
            </div>
            <label className="mt-4 flex cursor-pointer items-start gap-2 rounded-xl bg-cpc-section-light/50 px-3 py-2.5 text-[11px] text-cpc-navy-text">
              <input type="checkbox" checked={certified} onChange={(event) => setCertified(event.target.checked)} className="mt-0.5" />
              I confirm this is my digital signature and the Study Load has been reviewed.
            </label>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setActiveStudentId(null)} className="rounded-lg border border-cpc-input-border px-4 py-2 text-xs font-semibold text-cpc-navy-text">Cancel</button>
              <button type="button" disabled={busy === activeSession.student.studentIdNo || !selectedDraft || !certified || (office === "screening" && !feeConfirmed)} onClick={() => void handleSign()} className="inline-flex items-center gap-2 rounded-lg bg-cpc-blue-accent px-4 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
                <ShieldCheck className="h-4 w-4" /> {busy === activeSession.student.studentIdNo ? "Saving…" : "Apply Digital Signature"}
              </button>
            </div>
          </div>
        )}
      </Modal>
      <SignaturePadModal
        open={padOpen}
        onClose={() => setPadOpen(false)}
        signerName={user?.name ?? "Authorized Officer"}
        onUse={(draft) => { setCaptured(draft); setSignatureId(""); }}
      />
    </section>
  );
}
