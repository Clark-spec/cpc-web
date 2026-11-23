import { useState } from "react";
import { Check, Clock3, PenLine, Play, RefreshCw, Square, X } from "lucide-react";
import { ErrorCard } from "@/components/common/feedback/ErrorCard";
import { showError } from "@/lib/feedback";
import { useClearanceAdmin } from "@/components/features/admin/clearance/ClearanceAdminContext";
import { ApproveSignModal } from "@/components/features/admin/clearance/ApproveSignModal";
import { RejectModal } from "@/components/features/admin/clearance/RejectModal";
import { OFFICE_LABELS } from "@/components/features/admin/clearance/officeChecks";
import type { ClearanceRequestRow } from "@/components/features/admin/clearance/types";
import { finishSignatureQueue, startSignatureQueue } from "@/services/signatureQueues/api";
import { BSIT_SIGNATURE_SECTIONS, isBsitSignatureSection, normalizeBsitSignatureSection } from "@/lib/bsitSignatureSections";
import { SaoAttendanceEditor } from "@/components/features/admin/clearance/SaoAttendanceEditor";

export function ClearanceWorkspace() {
  const { error, loading, refresh, refreshing, visibleRows, rows, records, filters, setFilter, staff, isSuperAdmin } = useClearanceAdmin();
  const [reviewRow, setReviewRow] = useState<ClearanceRequestRow | null>(null);
  const [signRow, setSignRow] = useState<ClearanceRequestRow | null>(null);
  const [rejectRow, setRejectRow] = useState<ClearanceRequestRow | null>(null);
  const [sectionFilter, setSectionFilter] = useState("all");
  const [processingBusy, setProcessingBusy] = useState<string | null>(null);
  const matchesSection = (row: ClearanceRequestRow) => {
    const registeredSection = normalizeBsitSignatureSection(row.section);
    return sectionFilter === "all"
      ? isBsitSignatureSection(registeredSection)
      : registeredSection === sectionFilter;
  };
  const showAllSections = staff.role === "sao";
  const sectionRows = rows.filter((row) => showAllSections || matchesSection(row));
  const sectionVisibleRows = visibleRows.filter((row) => showAllSections || matchesSection(row));
  const openReview = (row: ClearanceRequestRow) => setReviewRow(row);
  const handleReject = (row: ClearanceRequestRow) => { setReviewRow(null); setRejectRow(row); };
  const statusOptions = [
    { value: "requested" as const, label: "Pending", count: sectionRows.filter((row) => row.status === "requested").length },
    { value: "signed" as const, label: "Signed", count: sectionRows.filter((row) => row.status === "signed").length },
    { value: "rejected" as const, label: "Rejected", count: sectionRows.filter((row) => row.status === "rejected").length },
    { value: "all" as const, label: "All", count: sectionRows.length },
  ];
  const statusLabel = statusOptions.find((option) => option.value === filters.status)?.label ?? "Pending";
  const reviewRecord = reviewRow ? records.find((record) => record.studentId === reviewRow.studentId) : undefined;

  async function reviewAndSign(row: ClearanceRequestRow) {
    if (processingBusy || !row.isProcessing) return;
    setReviewRow(row);
  }

  async function toggleProcessing(row: ClearanceRequestRow) {
    if (processingBusy) return;
    setProcessingBusy(row.id);
    try {
      const input = { queueType: "office_signatures" as const, office: row.office, studentId: row.studentId };
      if (row.isProcessing) await finishSignatureQueue(input);
      else await startSignatureQueue(input);
      await refresh();
    } catch (cause) {
      showError("Queue update failed", cause instanceof Error ? cause.message : "The live queue could not be updated.");
    } finally {
      setProcessingBusy(null);
    }
  }

  return <div className="space-y-5 pb-10">
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><p className="text-xs font-semibold uppercase tracking-wider text-blue-700">{isSuperAdmin ? "All offices" : staff.title || "My office"}</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Clearance Requests</h1>
          <p className="mt-1 text-sm text-slate-600">Review clearance requests for your office and digitally sign pending requests.</p></div>
        <div className="flex flex-wrap items-center gap-2">
          <a href="/display/office-signatures" target="_blank" rel="noopener" onClick={(event) => { event.preventDefault(); window.open("/display/office-signatures", "_blank", "noopener"); }} className="inline-flex items-center gap-2 rounded-lg border border-blue-200 px-3 py-2 text-sm font-semibold text-blue-800 hover:bg-blue-50">View live queue</a>
          <button type="button" onClick={() => void refresh()} disabled={refreshing} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"><RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />Refresh</button>
        </div>
      </div>
    </section>

    {error && !loading ? <ErrorCard message={error} onRetry={() => void refresh()} /> : <div className="w-full min-w-0">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <header className="border-b border-slate-200 px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2"><h2 className="font-bold text-slate-900">{statusLabel} requests</h2><span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">{sectionVisibleRows.length}</span></div>
            <div className="flex flex-wrap items-center gap-1.5">
            {!showAllSections && <label className="mr-1 text-xs font-semibold text-slate-600">Section <select aria-label="Filter clearance requests by section" value={sectionFilter} onChange={(event) => setSectionFilter(event.target.value)} className="ml-1 cursor-pointer rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-700"><option value="all">All BSIT sections</option>{BSIT_SIGNATURE_SECTIONS.map((section) => <option key={section} value={section}>{section}</option>)}</select></label>}
            <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Filter clearance requests by status">
              {statusOptions.map((option) => {
                const activeClass = option.value === "requested"
                  ? "border-amber-600 bg-amber-600 text-white"
                  : option.value === "signed"
                    ? "border-emerald-600 bg-emerald-600 text-white"
                    : option.value === "rejected"
                      ? "border-rose-600 bg-rose-600 text-white"
                      : "border-blue-700 bg-blue-700 text-white";
                const inactiveClass = option.value === "requested"
                  ? "border-amber-200 bg-white text-amber-800 hover:bg-amber-50"
                  : option.value === "signed"
                    ? "border-emerald-200 bg-white text-emerald-800 hover:bg-emerald-50"
                    : option.value === "rejected"
                      ? "border-rose-200 bg-white text-rose-800 hover:bg-rose-50"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50";
                return <button key={option.value} type="button" role="tab" aria-selected={filters.status === option.value} onClick={() => setFilter("status", option.value)} className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${filters.status === option.value ? activeClass : inactiveClass}`}>
                {option.label}<span className={`rounded-full px-1.5 py-0.5 text-[10px] ${filters.status === option.value ? "bg-white/20" : "bg-slate-100/80"}`}>{option.count}</span>
                </button>;
              })}
            </div>
            </div>
          </div>
        </header>
        {loading ? <p className="p-8 text-center text-sm text-slate-500">Loading requests…</p> : sectionVisibleRows.length === 0 ? <div className="p-10 text-center"><Check className="mx-auto h-8 w-8 text-emerald-600"/><h3 className="mt-3 font-semibold text-slate-900">No {statusLabel.toLowerCase()} requests</h3><p className="mt-1 text-sm text-slate-500">Requests in this status will appear here.</p></div> : <ul className="divide-y divide-slate-100">
          {sectionVisibleRows.map((row) => <li key={row.id}>
            <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <button type="button" onClick={() => openReview(row)} className="min-w-0 text-left">
                <span className="block truncate font-semibold text-slate-900">{row.studentName || "Student"}</span>
                <span className="mt-1 block text-xs text-slate-600">ID {row.studentId} · {row.section || "Section not listed"}</span>
                {row.queueNumber && <span className="mt-1 block font-mono text-xs font-semibold text-blue-700">Queue #{row.queueNumber} · {row.queueDate}</span>}
                <span className={`mt-1 inline-flex items-center gap-1 text-xs font-medium ${row.status === "requested" ? "text-amber-700" : row.status === "signed" ? "text-emerald-700" : "text-rose-700"}`}>{row.status === "requested" ? <Clock3 className="h-3.5 w-3.5"/> : row.status === "signed" ? <Check className="h-3.5 w-3.5"/> : <X className="h-3.5 w-3.5"/>}{OFFICE_LABELS[row.office]} · {row.status === "requested" ? "Pending signature" : row.status === "signed" ? "Signed" : "Rejected"}</span>
              </button>
              <div className="flex shrink-0 gap-2">
                {row.status === "requested" && <button type="button" disabled={processingBusy !== null} onClick={() => void toggleProcessing(row)} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold disabled:opacity-50 ${row.isProcessing ? "border border-slate-300 text-slate-700 hover:bg-slate-50" : "border border-emerald-300 text-emerald-800 hover:bg-emerald-50"}`}>{row.isProcessing ? <><Square className="h-3.5 w-3.5"/>Finish</> : <><Play className="h-3.5 w-3.5"/>Start processing</>}</button>}
                <button type="button" disabled={processingBusy !== null || (row.status === "requested" && !row.isProcessing)} onClick={() => row.status === "requested" ? void reviewAndSign(row) : openReview(row)} title={row.status === "requested" && !row.isProcessing ? "Start processing this request before reviewing and signing." : undefined} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50">{row.status === "requested" ? <><PenLine className="h-3.5 w-3.5"/>Review &amp; sign</> : "View details"}</button>
                {row.status === "requested" && <button type="button" onClick={() => handleReject(row)} aria-label={`Return ${row.studentName}'s request`} className="rounded-lg border border-slate-300 p-2 text-slate-600 hover:bg-slate-50"><X className="h-4 w-4"/></button>}
              </div>
            </div>
          </li>)}
        </ul>}
      </section>
    </div>}

    {reviewRow && <div className="fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setReviewRow(null); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="clearance-review-title" className="my-auto w-full max-w-xl rounded-2xl bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 p-5 sm:p-6">
          <div><p className="text-xs font-bold uppercase tracking-wider text-blue-700">{OFFICE_LABELS[reviewRow.office]} · {reviewRow.status === "requested" ? "Pending" : reviewRow.status === "signed" ? "Signed" : "Rejected"}</p><h2 id="clearance-review-title" className="mt-1 text-xl font-bold text-slate-900">{reviewRow.status === "requested" ? "Review clearance request" : "Clearance request details"}</h2><p className="mt-1 text-sm text-slate-500">{reviewRow.status === "requested" ? "Check the student details before signing." : "Review this request's saved status and signature details."}</p></div>
          <button type="button" aria-label="Close review" onClick={() => setReviewRow(null)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5"/></button>
        </header>
        <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6">
          <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-500">Student name</p><p className="mt-1 font-semibold text-slate-900">{reviewRow.studentName || "Student"}</p></div>
          <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-500">Student ID</p><p className="mt-1 font-semibold text-slate-900">{reviewRow.studentId}</p></div>
          <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-500">Program & section</p><p className="mt-1 font-semibold text-slate-900">{reviewRow.program || "—"} · {reviewRow.section || "—"}</p></div>
          <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-500">Term</p><p className="mt-1 font-semibold text-slate-900">{reviewRow.term} · {reviewRow.academicYear}</p></div>
          {reviewRow.studentNote && <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 sm:col-span-2"><p className="text-xs font-semibold text-blue-800">Student note</p><p className="mt-1 text-sm text-slate-700">{reviewRow.studentNote}</p></div>}
          <div className={`flex items-center gap-2 rounded-xl p-4 text-sm sm:col-span-2 ${reviewRow.status === "requested" ? "border border-amber-200 bg-amber-50 text-amber-900" : reviewRow.status === "signed" ? "border border-emerald-200 bg-emerald-50 text-emerald-900" : "border border-rose-200 bg-rose-50 text-rose-900"}`}>{reviewRow.status === "requested" ? <Clock3 className="h-4 w-4 shrink-0"/> : reviewRow.status === "signed" ? <Check className="h-4 w-4 shrink-0"/> : <X className="h-4 w-4 shrink-0"/>}{reviewRow.status === "requested" ? "The student is waiting for your office to review this request." : reviewRow.status === "signed" ? `Signed digitally by ${reviewRow.signerName || "your office"}.` : `This request was rejected${reviewRow.remarks ? `: ${reviewRow.remarks}` : "."}`}</div>
        </div>
        {reviewRow.office === "sao" && staff.role === "sao" && reviewRecord && (
          <SaoAttendanceEditor
            key={reviewRow.studentId}
            studentId={reviewRow.studentId}
            events={reviewRecord.saoEvents ?? []}
            onSaved={() => void refresh()}
          />
        )}
        <footer className="flex flex-col-reverse gap-2 border-t border-slate-200 p-5 sm:flex-row sm:justify-end sm:p-6">
          {reviewRow.status === "requested" && <><button type="button" onClick={() => handleReject(reviewRow)} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Return request</button>
          <button type="button" disabled={!reviewRow.isProcessing} title={!reviewRow.isProcessing ? "Start processing this request before signing." : undefined} onClick={() => { setSignRow(reviewRow); setReviewRow(null); }} className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"><PenLine className="h-4 w-4"/>Approve &amp; continue to signature</button></>}
        </footer>
      </section>
    </div>}
    <ApproveSignModal row={signRow} open={signRow !== null} onClose={() => setSignRow(null)} />
    <RejectModal row={rejectRow} open={rejectRow !== null} onClose={() => setRejectRow(null)} />
  </div>;
}
