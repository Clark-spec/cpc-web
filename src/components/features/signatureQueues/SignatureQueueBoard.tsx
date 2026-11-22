import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { getSignatureBoards, type SignatureBoardOffice, type SignatureQueueType } from "@/services/signatureQueues/api";

const PH_TIME = "Asia/Manila";

export function SignatureQueueBoard({ workflow }: { workflow: SignatureQueueType }) {
  const [offices, setOffices] = useState<SignatureBoardOffice[]>([]);
  const [updatedAt, setUpdatedAt] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const boards = await getSignatureBoards();
        if (!active) return;
        setOffices(workflow === "study_load" ? boards.studyLoad : boards.officeSignatures);
        setUpdatedAt(boards.updatedAt);
        setError("");
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : "The live board is temporarily unavailable.");
      }
    };
    void refresh();
    const timer = window.setInterval(() => void refresh(), 2000);
    return () => { active = false; window.clearInterval(timer); };
  }, [workflow]);

  const title = workflow === "study_load" ? "Study Load Signature Requests" : "Clearance · Office Signatures";

  const goBack = () => {
    window.close();
    window.setTimeout(() => {
      if (window.closed) return;
      if (document.referrer) {
        try {
          const referrer = new URL(document.referrer);
          if (referrer.origin === window.location.origin) {
            window.location.assign(referrer.href);
            return;
          }
        } catch {
          // Fall back to browser history if the referrer is not a valid URL.
        }
      }
      if (window.history.length > 1) {
        window.history.back();
        return;
      }
      window.location.assign("/student/home");
    }, 150);
  };

  return (
    <main className="min-h-screen bg-slate-950 p-4 font-poppins text-white sm:p-7 lg:p-10">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-start gap-4">
          <button type="button" onClick={goBack} className="mt-1 inline-flex shrink-0 items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-200 hover:border-slate-500 hover:bg-slate-900">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back
          </button>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-300">Cordova Public College · Live Queue</p>
            <h1 className="mt-2 text-2xl font-extrabold sm:text-4xl">{title}</h1>
            <p className="mt-2 text-sm text-slate-400">Queue numbers only · Updates automatically · Philippine time</p>
          </div>
        </div>
        <div className="text-right text-xs text-slate-400">
          <p className="inline-flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${error ? "bg-rose-400" : "animate-pulse bg-emerald-400"}`} />{error ? "Reconnecting" : "LIVE"}</p>
          <p className="mt-1">{updatedAt ? `Updated ${new Date(updatedAt).toLocaleTimeString("en-PH", { timeZone: PH_TIME })}` : "Connecting…"}</p>
        </div>
      </header>

      {error && <p role="status" className="mb-4 rounded-xl border border-rose-900 bg-rose-950/60 p-3 text-sm text-rose-200">{error}</p>}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label={`${title} office queues`}>
        {offices.map((office) => (
          <article key={office.office} className="flex min-h-[340px] flex-col rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl sm:p-6">
            <h2 className="border-b border-slate-800 pb-3 text-lg font-bold">{office.office}</h2>
            <div className="my-5 flex flex-1 flex-col items-center justify-center rounded-xl border border-blue-900/70 bg-slate-950 px-3 py-5 text-center">
              <p className="text-xs font-bold tracking-[0.2em] text-blue-300">NOW PROCESSING</p>
              {office.nowServing ? (
                <>
                  <p className="mt-3 font-mono text-6xl font-black tracking-tight text-emerald-300 sm:text-7xl">#{office.nowServing.queueNumber}</p>
                  <p className="mt-2 text-xs text-slate-400">Queue date {office.nowServing.queueDate}</p>
                </>
              ) : (
                <p className="mt-6 font-mono text-5xl font-bold text-slate-700">—</p>
              )}
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
                <h3 className="font-bold uppercase tracking-wider">Next numbers</h3>
                <span>{office.next.length} waiting</span>
              </div>
              {office.next.length ? <ol className="space-y-1.5">
                {office.next.map((ticket) => <li key={`${ticket.queueDate}:${ticket.queueNumber}`} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2">
                  <span className="flex items-center gap-2"><span className="font-mono text-lg font-bold text-slate-100">#{ticket.queueNumber}</span>{ticket.awaitingPayment && <span className="rounded-full border border-amber-700/60 bg-amber-950/60 px-2 py-1 text-[10px] font-bold text-amber-300">Awaiting payment</span>}</span>
                  <span className="text-[11px] text-slate-500">{ticket.queueDate}</span>
                </li>)}
              </ol> : <p className="rounded-lg bg-slate-950/60 px-3 py-4 text-center text-xs text-slate-500">No requests waiting</p>}
            </div>
          </article>
        ))}
      </section>
      <footer className="mt-6 text-center text-xs text-slate-500">Please wait for your queue number to appear under “Now Processing.”</footer>
    </main>
  );
}
