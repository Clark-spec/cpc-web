import { useCallback, useEffect, useState } from "react";
import { BadgeCheck, Clock, PenLine, RefreshCw, ShieldCheck, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/common/feedback/ConfirmDialog";
import { useToast } from "@/components/ui/toast";
import { Modal } from "@/components/ui/modal";
import { SignaturePadModal } from "@/components/features/admin/clearance/SignaturePadModal";
import { useSavedSignatures } from "@/components/features/admin/clearance/useSavedSignatures";
import { useAdminAuth } from "@/components/context/AdminAuthContext";
import { getOfficeSignatureRequests, signEnrollmentInDatabase } from "@/services/enrollmentWorkflow/database";
import type { StudentEnrollmentSession } from "@/types/enrollmentWorkflow";
import type { SignatureDraft } from "@/components/features/admin/clearance/types";
import type { SavedSignature } from "@/components/features/admin/clearance/types";
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
  const [statusFilter, setStatusFilter] = useState<"PENDING" | "SIGNED" | "REJECTED" | "ALL">("PENDING");
  const [sectionFilter, setSectionFilter] = useState("all");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [activeStudentId, setActiveStudentId] = useState<string | null>(null);
  const [signatureId, setSignatureId] = useState("");
  const [captured, setCaptured] = useState<SignatureDraft | null>(null);
  const [signatureSource, setSignatureSource] = useState<"saved" | "new">("saved");
  const [pendingDelete, setPendingDelete] = useState<SavedSignature | null>(null);
  const [deletingSignature, setDeletingSignature] = useState(false);
  const [padOpen, setPadOpen] = useState(false);
  const [feeConfirmed, setFeeConfirmed] = useState(false);
  const [certified, setCertified] = useState(false);

  const activeSession = sessions.find((session) => session.student.studentIdNo === activeStudentId) ?? null;
  const getStatus = (session: StudentEnrollmentSession) => {
    const status = session.steps?.[office]?.status;
    return status === "APPROVED" ? "SIGNED" : status === "REJECTED" || status === "RESUBMIT" ? "REJECTED" : "PENDING";
  };
  const matchesSection = (session: StudentEnrollmentSession) => sectionFilter === "all"
    ? /^BSIT-3[A-D]$/i.test(String(session.student.section ?? "").replace(/\s+/g, ""))
    : String(session.student.section ?? "").toUpperCase().replace(/\s+/g, "") === sectionFilter;
  const sectionSessions = sessions.filter(matchesSection);
  const visibleSessions = sectionSessions.filter((session) => statusFilter === "ALL" || getStatus(session) === statusFilter);
  const statusFilters = [
    { key: "PENDING" as const, label: "Pending", color: "amber", count: sectionSessions.filter((session) => getStatus(session) === "PENDING").length },
    { key: "SIGNED" as const, label: "Signed", color: "emerald", count: sectionSessions.filter((session) => getStatus(session) === "SIGNED").length },
    { key: "REJECTED" as const, label: "Rejected", color: "rose", count: sectionSessions.filter((session) => getStatus(session) === "REJECTED").length },
    { key: "ALL" as const, label: "All", color: "slate", count: sectionSessions.length },
  ];
  const savedSignature = signatureLibrary.signatures.find((signature) => signature.id === signatureId)
    ?? signatureLibrary.defaultSignature;
  const selectedDraft: SignatureDraft | null = signatureSource === "new" ? captured : (savedSignature ? {
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
    if (!signatureId && signatureLibrary.defaultSignature) {
      setSignatureId(signatureLibrary.defaultSignature.id);
      if (!captured) setSignatureSource("saved");
    }
  }, [captured, signatureId, signatureLibrary.defaultSignature]);

  function openSigning(studentId: string) {
    setActiveStudentId(studentId);
    setCaptured(null);
    setSignatureId(signatureLibrary.defaultSignature?.id ?? "");
    setSignatureSource(signatureLibrary.defaultSignature ? "saved" : "new");
    setFeeConfirmed(false);
    setCertified(false);
  }

  async function confirmDeleteSignature() {
    if (!pendingDelete) return;
    setDeletingSignature(true);
    try {
      await signatureLibrary.remove(pendingDelete.id);
      if (signatureId === pendingDelete.id) {
        const next = signatureLibrary.signatures.find((entry) => entry.id !== pendingDelete.id);
        setSignatureId(next?.id ?? "");
        if (!next) setSignatureSource("new");
      }
      toast("Saved signature deleted.", "success");
    } catch (cause) {
      toast(cause instanceof Error ? cause.message : "Saved signature could not be deleted.", "error");
    } finally {
      setDeletingSignature(false);
      setPendingDelete(null);
    }
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
      <div className="mt-4 overflow-hidden rounded-xl border border-cpc-input-border/60 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cpc-input-border/50 p-3">
          <div className="flex items-center gap-2"><h3 className="text-sm font-bold text-cpc-navy-text">{statusFilters.find((filter) => filter.key === statusFilter)?.label} requests</h3><span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">{visibleSessions.length}</span></div>
          <div className="flex flex-wrap items-center gap-1.5">
            <label className="mr-1 text-[11px] font-semibold text-cpc-heading-soft">Section <select aria-label="Filter enrollment requests by section" value={sectionFilter} onChange={(event) => setSectionFilter(event.target.value)} className="ml-1 cursor-pointer rounded-lg border border-cpc-input-border bg-white px-2.5 py-2 text-xs font-semibold text-cpc-navy-text"><option value="all">All BSIT sections</option>{["BSIT-3A", "BSIT-3B", "BSIT-3C", "BSIT-3D"].map((section) => <option key={section} value={section}>{section}</option>)}</select></label>
            {statusFilters.map((filter) => {
              const active = statusFilter === filter.key;
              const palette = filter.color === "amber" ? (active ? "border-amber-600 bg-amber-600 text-white" : "border-amber-200 bg-white text-amber-800") : filter.color === "emerald" ? (active ? "border-emerald-600 bg-emerald-600 text-white" : "border-emerald-200 bg-white text-emerald-800") : filter.color === "rose" ? (active ? "border-rose-600 bg-rose-600 text-white" : "border-rose-200 bg-white text-rose-800") : (active ? "border-blue-700 bg-blue-700 text-white" : "border-slate-200 bg-white text-slate-600");
              return <button key={filter.key} type="button" role="tab" aria-selected={active} onClick={() => setStatusFilter(filter.key)} className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold ${palette}`}>{filter.label}<span className={`rounded-full px-1.5 py-0.5 text-[10px] ${active ? "bg-white/20" : "bg-slate-100/80"}`}>{filter.count}</span></button>;
            })}
          </div>
        </div>
        <div className="space-y-3 p-3">
        {visibleSessions.length === 0 ? (
          <p className="rounded-xl border border-dashed p-5 text-center text-xs text-cpc-heading-soft">No {statusFilter === "ALL" ? "signature" : statusFilter.toLowerCase()} requests for this section.</p>
        ) : visibleSessions.map((session) => {
          const studentId = session.student.studentIdNo;
          const requestTime = session.signatureRequests?.[office];
          const status = getStatus(session);
          return (
            <article key={studentId} className="rounded-xl border border-cpc-input-border/60 bg-cpc-section-light/30 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-cpc-navy-text">{session.student.name}</p>
                  <p className="mt-0.5 text-xs text-cpc-heading-soft">ID {studentId} · {session.student.section || session.student.course} · {session.student.yearLevel}{session.student.yearLevel === 1 ? "st" : session.student.yearLevel === 2 ? "nd" : session.student.yearLevel === 3 ? "rd" : "th"} Year</p>
                  <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-cpc-muted-blue"><Clock className="h-3 w-3" /> Request received {requestTime ? new Date(requestTime).toLocaleString() : ""}</p>
                  <p className="mt-2 text-xs text-cpc-heading-soft">Study Load: {session.form.totalUnits} units · {session.form.term}</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${status === "PENDING" ? "bg-amber-100 text-amber-800" : status === "SIGNED" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>{status === "PENDING" ? "Pending" : status === "SIGNED" ? "Signed" : "Rejected"}</span>
              </div>
              {status === "PENDING" ? <button type="button" onClick={() => openSigning(studentId)} className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-cpc-blue-accent px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"><PenLine className="h-4 w-4" /> Review &amp; Sign</button> : <p className={`mt-3 text-xs font-semibold ${status === "SIGNED" ? "text-emerald-700" : "text-rose-700"}`}>{status === "SIGNED" ? `Digitally signed${session.steps?.[office]?.updatedBy ? ` by ${session.steps[office].updatedBy}` : ""}.` : session.steps?.[office]?.remarks || "This request was rejected or returned."}</p>}
            </article>
          );
        })}
        </div>
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
            <fieldset className="mt-4 space-y-2">
              <legend className="text-[11px] font-semibold text-cpc-navy-text">Signature source</legend>
              <div className={`rounded-2xl border p-3 ${signatureSource === "saved" ? "border-cpc-blue-accent bg-cpc-section-light/60" : "border-cpc-input-border/70 bg-white"}`}>
                <label className="flex cursor-pointer items-start gap-3">
                  <input type="radio" name="enrollment-signature-source" checked={signatureSource === "saved"} disabled={signatureLibrary.signatures.length === 0} onChange={() => setSignatureSource("saved")} className="mt-1 h-4 w-4 cursor-pointer accent-cpc-blue-accent" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-semibold text-cpc-navy-text">Use my saved signature</span>
                    <span className="mt-0.5 block text-[10px] text-cpc-heading-soft">{signatureLibrary.signatures.length ? "Fast signing: this signature is saved to your staff account and can also be used for Clearance requests." : "No saved signatures yet. Create one and save it for future requests."}</span>
                    {signatureSource === "saved" && savedSignature && (
                      <span className="mt-2 flex flex-wrap items-center gap-3">
                        <img src={savedSignature.imageBase64} alt={`Saved signature: ${savedSignature.label}`} className="h-12 max-w-40 rounded-lg border border-cpc-input-border bg-white object-contain p-1" />
                        <span className="text-[10px] text-cpc-heading-soft">{savedSignature.label} · {savedSignature.method}{savedSignature.isDefault ? " · Default" : ""}</span>
                      </span>
                    )}
                  </span>
                </label>
                {signatureSource === "saved" && signatureLibrary.signatures.length > 0 && (
                  <div className="mt-3 space-y-2 pl-7">
                    {signatureLibrary.signatures.length > 1 && (
                      <label className="block text-[10px] font-semibold text-cpc-navy-text">Choose a saved signature
                      <select value={savedSignature?.id ?? ""} onChange={(event) => setSignatureId(event.target.value)} className="mt-1 block w-full cursor-pointer rounded-lg border border-cpc-input-border bg-white px-3 py-2 text-xs text-cpc-navy-text">
                          {signatureLibrary.signatures.map((signature) => <option key={signature.id} value={signature.id}>{signature.label}{signature.isDefault ? " (default)" : ""}</option>)}
                        </select>
                      </label>
                    )}
                    {savedSignature && <button type="button" onClick={() => setPendingDelete(savedSignature)} className="inline-flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold text-rose-700 hover:bg-rose-50"><Trash2 className="h-3 w-3" /> Delete</button>}
                  </div>
                )}
              </div>

              <div className={`rounded-2xl border p-3 ${signatureSource === "new" ? "border-cpc-blue-accent bg-cpc-section-light/60" : "border-cpc-input-border/70 bg-white"}`}>
                <label className="flex cursor-pointer items-start gap-3">
                  <input type="radio" name="enrollment-signature-source" checked={signatureSource === "new"} onChange={() => setSignatureSource("new")} className="mt-1 h-4 w-4 cursor-pointer accent-cpc-blue-accent" />
                  <span><span className="block text-xs font-semibold text-cpc-navy-text">Create a new signature</span><span className="mt-0.5 block text-[10px] text-cpc-heading-soft">Draw, type, or upload a signature for this request.</span></span>
                </label>
                {signatureSource === "new" && captured && <div className="mt-2 flex items-center gap-3 pl-7"><img src={captured.imageBase64} alt="New digital signature preview" className="h-12 max-w-40 rounded border border-cpc-input-border bg-white object-contain p-1" /><span className="text-[10px] text-cpc-heading-soft">{captured.label ?? captured.method}{captured.saveAs ? ` · will save as ${captured.saveAs.label}` : ""}</span></div>}
                {signatureSource === "new" && <button type="button" onClick={() => setPadOpen(true)} className="mt-3 inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-cpc-input-border px-3 py-2 text-xs font-semibold text-cpc-blue-accent hover:bg-white"><PenLine className="h-3.5 w-3.5" />{captured ? "Change signature" : "Draw, type, or upload"}</button>}
              </div>
            </fieldset>
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
        onUse={(draft) => { setCaptured(draft); setSignatureSource("new"); setSignatureId(""); }}
      />
      <ConfirmDialog
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => void confirmDeleteSignature()}
        title="Delete this saved signature?"
        description={pendingDelete ? `“${pendingDelete.label}” will be removed from your saved signature library. Signatures already applied to Study Loads or Clearance records will remain.` : "This saved signature will be removed from your library."}
        confirmLabel="Delete signature"
        danger
        busy={deletingSignature}
      />
    </section>
  );
}
