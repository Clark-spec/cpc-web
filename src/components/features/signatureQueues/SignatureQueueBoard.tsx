import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { getSignatureBoards, type SignatureBoardOffice, type SignatureQueueType } from "@/services/signatureQueues/api";

const PH_TIME = "Asia/Manila";

type WorkflowLane = {
  workflow: SignatureQueueType;
  label: string;
  office: SignatureBoardOffice;
};

const OFFICE_ORDER = ["Dean", "Registrar", "Accounting", "Clinic", "Library", "SAO / SSG Adviser", "Guidance"];

function workflowLabel(workflow: SignatureQueueType) {
  return workflow === "study_load" ? "Study Load Signature" : "Clearance Request";
}

function normalizeOfficeLabel(office: string) {
  return office === "Dean & Screening" ? "Dean" : office;
}

export function SignatureQueueBoard() {
  const [lanes, setLanes] = useState<WorkflowLane[]>([]);
  const [updatedAt, setUpdatedAt] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const boards = await getSignatureBoards();
        if (!active) return;
        const nextLanes: WorkflowLane[] = [
          ...boards.officeSignatures.map((office) => ({ workflow: "office_signatures" as const, label: workflowLabel("office_signatures"), office })),
          ...boards.studyLoad.map((office) => ({ workflow: "study_load" as const, label: workflowLabel("study_load"), office })),
        ];
        nextLanes.sort((a, b) => {
          const officeDifference = OFFICE_ORDER.indexOf(normalizeOfficeLabel(a.office.office)) - OFFICE_ORDER.indexOf(normalizeOfficeLabel(b.office.office));
          return officeDifference || (a.workflow === "office_signatures" ? -1 : 1);
        });
        setLanes(nextLanes);
        setUpdatedAt(boards.updatedAt);
        setError("");
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : "The live board is temporarily unavailable.");
      }
    };
    void refresh();
    const timer = window.setInterval(() => void refresh(), 2000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);

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
      if (window.history.length > 1) window.history.back();
      else window.location.assign("/student/home");
    }, 150);
  };

  const officeGroups = lanes.reduce<Array<{ office: string; lanes: WorkflowLane[] }>>((groups, lane) => {
    const office = normalizeOfficeLabel(lane.office.office);
    const group = groups.find((entry) => entry.office === office);
    if (group) group.lanes.push(lane);
    else groups.push({ office, lanes: [lane] });
    return groups;
  }, []);
  const multiQueueOffices = officeGroups.filter(({ lanes: officeLanes }) => officeLanes.length > 1);
  const singleQueueOffices = officeGroups.filter(({ lanes: officeLanes }) => officeLanes.length === 1);

  const renderOfficeCard = ({ office, lanes: officeLanes }: { office: string; lanes: WorkflowLane[] }) => (
    <article key={office} className="group box-border flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/90 via-slate-900 to-slate-900 p-2.5 shadow-[0_12px_35px_rgba(0,0,0,0.28)] transition duration-300 hover:-translate-y-0.5 hover:border-sky-300/30 hover:shadow-[0_18px_45px_rgba(2,132,199,0.13)] sm:p-3 xl:h-[180px]">
      <h2 className="mb-1.5 flex shrink-0 items-center justify-between gap-2 border-b border-white/10 pb-1.5 text-base font-bold sm:text-lg"><span className="truncate">{office}</span><span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-slate-400">{officeLanes.length} {officeLanes.length === 1 ? "queue" : "queues"}</span></h2>
      <div className={`grid flex-1 content-center gap-1 ${officeLanes.length > 1 ? "xl:grid-cols-2" : ""}`}>
        {officeLanes.map(({ workflow, label, office: queue }) => {
          const waitingSlotCount = officeLanes.length === 1 ? 6 : office === "Dean" && workflow === "study_load" ? 2 : 4;
          const waitingGridColumns = officeLanes.length === 1 ? "grid-cols-3 grid-rows-2" : office === "Dean" && workflow === "study_load" ? "grid-cols-1 grid-rows-2" : "grid-cols-2 grid-rows-2";
          return (
          <section key={workflow} aria-label={`${office} ${label}`} className="rounded-lg border border-white/10 bg-[#070d1e]/90 p-2 shadow-inner shadow-black/20 transition-colors duration-300 group-hover:border-white/15 xl:flex xl:min-h-24 xl:flex-col xl:justify-center">
            <h3 className="mb-2 text-center text-[11px] font-bold leading-tight text-sky-100 sm:text-xs">{label}</h3>
            <div className={`grid min-w-0 flex-1 items-stretch gap-1.5 ${officeLanes.length > 1 ? "grid-cols-[minmax(60px,0.85fr)_minmax(0,1.15fr)]" : "grid-cols-[minmax(82px,0.9fr)_minmax(0,1.1fr)]"}`}>
              <div className={`flex min-w-0 flex-col items-center justify-center rounded-lg border px-1.5 py-1.5 text-center ${queue.nowServing ? "border-emerald-300/25 bg-gradient-to-br from-emerald-400/15 to-sky-500/5" : "border-slate-800 bg-slate-900/80"}`}>
                <span className={`text-[7px] font-bold uppercase tracking-wider ${queue.nowServing ? "text-emerald-200/80" : "text-slate-500"}`}>Now Processing</span>
                <span className={`mt-1 font-mono text-xl font-black leading-none ${queue.nowServing ? "text-emerald-300" : "text-slate-700"}`}>{queue.nowServing ? `#${queue.nowServing.queueNumber}` : "—"}</span>
              </div>
              <div className={`grid min-w-0 gap-1 ${waitingGridColumns}`}>
                {Array.from({ length: waitingSlotCount }, (_, index) => {
                  const ticket = queue.next[index];
                  return <div key={ticket ? `${ticket.queueDate}:${ticket.queueNumber}` : `empty-${index}`} aria-label={ticket ? `Queue ${ticket.queueNumber} waiting` : "Empty waiting slot"} className={`flex min-h-7 min-w-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.045] px-1 py-1 text-center transition hover:border-sky-300/30 hover:bg-sky-300/[0.08] ${ticket?.awaitingPayment ? "flex-row gap-1.5 whitespace-nowrap" : "flex-col"}`}>{ticket && <><span className="font-mono text-sm font-extrabold leading-none text-white">#{ticket.queueNumber}</span>{ticket.awaitingPayment && <span className="text-[7px] font-semibold leading-tight text-amber-300">Pay ₱100</span>}</>}</div>;
                })}
              </div>
            </div>
          </section>
        );})}
      </div>
    </article>
  );

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-[#050a18] p-4 font-poppins text-white sm:p-6 lg:p-8 xl:flex xl:h-dvh xl:flex-col xl:p-6">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_left,rgba(37,99,235,0.2),transparent_45%),radial-gradient(ellipse_at_bottom_right,rgba(14,165,233,0.12),transparent_42%)]" />
      <header className="mb-5 flex shrink-0 flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-start gap-4">
          <button type="button" onClick={goBack} className="mt-1 inline-flex shrink-0 items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-sm font-semibold text-slate-200 shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:border-blue-300/50 hover:bg-blue-400/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-300">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back
          </button>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-sky-300">Cordova Public College · Live Queue</p>
            <h1 className="mt-1.5 text-2xl font-extrabold tracking-tight sm:text-3xl xl:text-4xl">Clearance and Study Load Queues</h1>
            <p className="mt-1.5 text-xs text-slate-400 sm:text-sm">Public queue numbers only <span className="px-1.5 text-slate-600">·</span> Updates automatically <span className="px-1.5 text-slate-600">·</span> Philippine time</p>
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-right shadow-lg shadow-black/10 backdrop-blur-sm">
          <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-200"><span className={`h-2.5 w-2.5 rounded-full ${error ? "bg-rose-400" : "animate-pulse bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.8)]"}`} />{error ? "Reconnecting" : "Live"}</p>
          <p className="mt-1.5 text-xs text-slate-400">{updatedAt ? `Updated ${new Date(updatedAt).toLocaleTimeString("en-PH", { timeZone: PH_TIME })}` : "Connecting…"}</p>
        </div>
      </header>

      {error && <p role="status" className="mb-3 shrink-0 rounded-xl border border-rose-900 bg-rose-950/60 p-2.5 text-sm text-rose-200">The live queue is temporarily unavailable. Reconnecting automatically.</p>}
      {officeGroups.length ? (
        <section className="flex flex-col gap-4 xl:min-h-0 xl:flex-1 xl:justify-center xl:gap-5" aria-label="Live office queues">
          <div>
            <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
              {multiQueueOffices.map(renderOfficeCard)}
            </div>
          </div>
          <div>
            <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">{singleQueueOffices.map(renderOfficeCard)}</div>
          </div>
        </section>
      ) : (
        <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-800/80 to-slate-900 px-5 py-16 text-center shadow-2xl">
          <p className="text-xl font-bold">No active signature queues</p>
          <p className="mt-2 text-sm text-slate-400">Office queues will appear here when a student sends a Clearance or Study Load signature request.</p>
        </section>
      )}
      <footer className="mt-3 shrink-0 border-t border-white/10 py-2 text-center text-xs font-medium text-slate-300">Each office has separate Clearance and Study Load numbers. Check the label to identify your queue.</footer>
    </main>
  );
}
