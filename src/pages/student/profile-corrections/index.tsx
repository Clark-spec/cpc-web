import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { ArrowLeft, Clock3, ExternalLink, RefreshCw } from "lucide-react";
import { StudentLayout } from "@/components/common/layout/StudentLayout";
import { useAuth } from "@/components/context/useAuth";
import { useSSE } from "@/hooks/useSSE";
import { formatDateTime } from "@/lib/format";
import { getMyCorrectionRequests } from "@/services/studentProfile/service";
import type { StudentProfileCorrectionRequest } from "@/components/features/student/profile/types";

const STATUS_LABELS = {
  pending: "Waiting for Registrar",
  approved: "Approved",
  rejected: "Needs follow-up",
} as const;

export default function StudentProfileCorrectionsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<StudentProfileCorrectionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setRequests(await getMyCorrectionRequests());
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load your correction requests.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSse = useCallback((type: string) => {
    if (type === "profile_correction_updated") void refresh();
  }, [refresh]);
  useSSE(handleSse, Boolean(user), user?.id);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <StudentLayout>
      <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <Link to="/my-account/profile" className="inline-flex items-center gap-2 font-poppins text-xs font-semibold text-cpc-blue-accent hover:underline">
          <ArrowLeft className="h-4 w-4" aria-hidden /> Back to profile
        </Link>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-poppins text-[10px] font-bold tracking-[0.14em] text-cpc-blue-accent uppercase">My Account</p>
            <h1 className="mt-1 font-poppins text-2xl font-bold text-cpc-navy-text">Profile correction requests</h1>
            <p className="mt-1 font-poppins text-sm text-cpc-heading-soft">Check whether the Registrar has reviewed your requested changes.</p>
          </div>
          <button type="button" onClick={() => void refresh()} className="cpc-btn cpc-btn-secondary cpc-btn-sm">
            <RefreshCw className="h-3.5 w-3.5" aria-hidden /> Refresh
          </button>
        </div>

        {loading && requests.length === 0 && <p role="status" className="mt-6 rounded-xl border border-cpc-tile-border bg-white p-4 font-poppins text-sm text-cpc-heading-soft">Loading your requests…</p>}
        {error && <div role="alert" className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 font-poppins text-sm text-rose-700"><p>{error}</p><button type="button" onClick={() => void refresh()} className="mt-2 font-semibold underline">Try again</button></div>}
        {!loading && !error && requests.length === 0 && (
          <div className="mt-6 rounded-2xl border border-cpc-tile-border bg-white p-8 text-center shadow-sm">
            <Clock3 className="mx-auto h-8 w-8 text-cpc-blue-accent" aria-hidden />
            <h2 className="mt-3 font-poppins text-base font-semibold text-cpc-navy-text">No correction requests yet</h2>
            <p className="mt-1 font-poppins text-sm text-cpc-heading-soft">Requests you send from your profile will appear here.</p>
          </div>
        )}
        <div className="mt-6 space-y-3">
          {requests.map((request) => (
            <article key={request.id} className="rounded-2xl border border-cpc-tile-border bg-white p-4 shadow-sm sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-poppins text-[10px] font-bold tracking-wide text-cpc-blue-accent">{request.referenceNumber}</p>
                  <h2 className="mt-1 font-poppins text-base font-semibold text-cpc-navy-text">{request.field}</h2>
                  <p className="mt-1 font-poppins text-xs text-cpc-heading-soft">Submitted {formatDateTime(request.submittedAt)}</p>
                </div>
                <span className={`rounded-full px-3 py-1 font-poppins text-xs font-semibold ${request.status === "approved" ? "bg-emerald-50 text-emerald-700" : request.status === "rejected" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"}`}>
                  {STATUS_LABELS[request.status]}
                </span>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-cpc-section-light/60 p-3"><p className="font-poppins text-[10px] font-bold uppercase text-cpc-heading-soft">Requested change</p><p className="mt-1 break-words font-poppins text-sm font-semibold text-cpc-navy-text">{request.currentValue || "Not provided"} <span aria-hidden>→</span> {request.requestedValue}</p></div>
                <div className="rounded-xl bg-cpc-section-light/60 p-3"><p className="font-poppins text-[10px] font-bold uppercase text-cpc-heading-soft">Your reason</p><p className="mt-1 break-words font-poppins text-sm text-cpc-navy-text">{request.reason}</p></div>
              </div>
              {request.attachmentName && (
                <div className="mt-3 rounded-xl border border-cpc-tile-border bg-white p-3">
                  <p className="font-poppins text-[10px] font-bold uppercase text-cpc-heading-soft">Supporting document · {request.attachmentName}</p>
                  {request.attachmentData && request.attachmentType?.startsWith("image/") && (
                    <img src={request.attachmentData} alt={request.attachmentName} className="mt-2 max-h-72 w-full rounded-lg bg-slate-50 object-contain" />
                  )}
                  {request.attachmentData && request.attachmentType === "application/pdf" && (
                    <a href={request.attachmentData} target="_blank" rel="noreferrer" className="mt-2 inline-flex font-poppins text-xs font-semibold text-cpc-blue-accent underline">Preview supporting PDF</a>
                  )}
                </div>
              )}
              {request.adminRemarks && <p className="mt-3 rounded-xl border border-cpc-tile-border p-3 font-poppins text-sm text-cpc-navy-text"><strong>Registrar’s note:</strong> {request.adminRemarks}</p>}
              {request.status === "approved" && <Link to="/my-account/profile" className="mt-3 inline-flex items-center gap-1.5 font-poppins text-xs font-semibold text-cpc-blue-accent hover:underline">View updated profile <ExternalLink className="h-3.5 w-3.5" aria-hidden /></Link>}
            </article>
          ))}
        </div>
      </main>
    </StudentLayout>
  );
}
