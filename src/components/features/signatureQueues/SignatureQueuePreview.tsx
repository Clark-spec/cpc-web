import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { getSignatureBoards, type SignatureBoardOffice, type SignatureQueueType } from "@/services/signatureQueues/api";

const WORKFLOW_LABELS: Record<SignatureQueueType, string> = {
  study_load: "Study Load signature",
  office_signatures: "Clearance request",
};
const CLEARANCE_OFFICE_ORDER = ["Dean", "SAO / SSG Adviser", "Library", "Accounting", "Registrar"];
const STUDY_LOAD_OFFICE_ORDER = ["Dean", "Clinic", "Guidance", "Registrar", "Accounting"];

function normalizeOfficeLabel(office: string) {
  return office === "Dean & Screening" ? "Dean" : office;
}

export function SignatureQueuePreview({ workflow }: { workflow: SignatureQueueType }) {
  const [offices, setOffices] = useState<SignatureBoardOffice[]>([]);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const boards = await getSignatureBoards();
        if (!active) return;
        const next = workflow === "study_load" ? boards.studyLoad : boards.officeSignatures;
        // Keep every office lane visible for both workflows, even when that office has no active tickets.
        // The fixed waiting slots make the preview useful as a complete office-by-office queue overview.
        setOffices(next);
        setUnavailable(false);
      } catch {
        if (active) setUnavailable(true);
      } finally {
        if (active) setLoading(false);
      }
    };
    void refresh();
    const timer = window.setInterval(() => void refresh(), 5000);
    return () => { active = false; window.clearInterval(timer); };
  }, [workflow]);

  const openBoard = () => window.open("/display/signature-queues", "_blank", "noopener");
  const waitingSlotsFor = (office: string) => {
    if (workflow === "office_signatures") return ["Dean", "Registrar", "Accounting"].includes(office) ? 4 : 6;
    if (normalizeOfficeLabel(office) === "Dean") return 2;
    return 6;
  };
  const officeOrder = workflow === "office_signatures" ? CLEARANCE_OFFICE_ORDER : STUDY_LOAD_OFFICE_ORDER;
  const displayedOffices = [...offices].sort((a, b) => {
    const aIndex = officeOrder.indexOf(normalizeOfficeLabel(a.office));
    const bIndex = officeOrder.indexOf(normalizeOfficeLabel(b.office));
    return (aIndex < 0 ? Number.MAX_SAFE_INTEGER : aIndex) - (bIndex < 0 ? Number.MAX_SAFE_INTEGER : bIndex);
  });

  return (
    <section aria-label={`${WORKFLOW_LABELS[workflow]} live queue preview`} className="group/preview rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-sky-50/70 p-3 shadow-[0_8px_24px_rgba(37,99,235,0.06)] transition duration-300 hover:border-blue-200 hover:shadow-[0_12px_32px_rgba(37,99,235,0.1)] sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-blue-700"><span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" /><span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" /></span>Live queue preview</p>
          <h2 className="mt-1 text-base font-bold text-cpc-navy-text">{WORKFLOW_LABELS[workflow]} activity</h2>
        </div>
        <button type="button" onClick={openBoard} className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-white px-3 py-2 text-xs font-semibold text-blue-800 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue-400 hover:bg-blue-50 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
          Open full Live Queue TV <ExternalLink className="h-3.5 w-3.5" aria-hidden />
        </button>
      </div>
      {loading ? <p className="mt-3 text-xs text-slate-500">Loading live numbers…</p>
        : unavailable ? <p role="status" className="mt-3 text-xs text-rose-700">Live numbers are unavailable right now. The TV board will retry automatically.</p>
          : displayedOffices.length ? <ul className="mt-3 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-6">
            {displayedOffices.map((office, index) => {
              const waitingSlotCount = waitingSlotsFor(office.office);
              const waitingGridColumns = waitingSlotCount === 2 ? "grid-cols-1 grid-rows-2" : waitingSlotCount === 4 ? "grid-cols-2 grid-rows-2" : "grid-cols-3 grid-rows-2";
              const centeredLastRow = index === 3 ? "xl:col-span-2 xl:col-start-2" : index === 4 ? "xl:col-span-2 xl:col-start-4" : "xl:col-span-2";
              const cardPlacement = workflow === "office_signatures"
                ? centeredLastRow
                : ["Registrar", "Accounting"].includes(normalizeOfficeLabel(office.office))
                  ? centeredLastRow
                  : "xl:col-span-2";
              return (
                <li key={office.office} className={`group/card flex min-w-0 flex-col rounded-2xl border border-blue-100 bg-gradient-to-br from-white via-white to-blue-50/70 p-3 shadow-[0_8px_22px_rgba(30,64,175,0.07)] transition duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-[0_12px_28px_rgba(30,64,175,0.13)] ${cardPlacement}`}>
                  <h3 className="mb-2 flex items-center justify-between gap-2 border-b border-blue-100 pb-2 text-sm font-bold text-cpc-navy-text"><span className="truncate">{office.office}</span><span className="shrink-0 rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-[8px] font-semibold uppercase tracking-wider text-blue-700">1 queue</span></h3>
                  <section aria-label={`${office.office} ${WORKFLOW_LABELS[workflow]}`} className="rounded-xl border border-blue-100 bg-blue-50/60 p-2.5">
                    <h4 className="mb-2 text-center text-[10px] font-bold leading-tight text-blue-900">{workflow === "office_signatures" ? "Clearance Request" : "Study Load Signature"}</h4>
                    <div className="grid min-w-0 grid-cols-[minmax(76px,0.9fr)_minmax(0,1.1fr)] items-stretch gap-1.5">
                      <div className={`flex min-w-0 flex-col items-center justify-center rounded-lg border px-1.5 py-2 text-center ${office.nowServing ? "border-emerald-200 bg-gradient-to-br from-emerald-50 to-sky-50" : "border-blue-100 bg-white/80"}`}>
                        <span className={`text-[7px] font-bold uppercase tracking-wider ${office.nowServing ? "text-emerald-800" : "text-slate-500"}`}>Now Processing</span>
                        <span className={`mt-1 font-mono text-lg font-black leading-none ${office.nowServing ? "text-emerald-700" : "text-slate-300"}`}>{office.nowServing ? `#${office.nowServing.queueNumber}` : "—"}</span>
                      </div>
                      <div className={`grid min-w-0 gap-1 ${waitingGridColumns}`}>
                        {Array.from({ length: waitingSlotCount }, (_, index) => {
                          const ticket = office.next[index];
                          return <div key={ticket ? `${ticket.queueDate}:${ticket.queueNumber}` : `empty-${index}`} aria-label={ticket ? `Queue ${ticket.queueNumber} waiting` : "Empty waiting slot"} className={`flex min-h-7 min-w-0 items-center justify-center rounded-lg border border-blue-100 bg-white/80 px-1 py-1 text-center transition hover:border-blue-300 hover:bg-white ${ticket?.awaitingPayment ? "flex-row gap-1 whitespace-nowrap" : "flex-col"}`}>{ticket && <><span className="font-mono text-xs font-extrabold leading-none text-cpc-navy-text">#{ticket.queueNumber}</span>{ticket.awaitingPayment && <span className="text-[7px] font-semibold leading-tight text-amber-700">Pay ₱100</span>}</>}</div>;
                        })}
                      </div>
                    </div>
                  </section>
                </li>
              );
            })}
          </ul> : <p className="mt-3 text-xs text-slate-600">No {WORKFLOW_LABELS[workflow].toLowerCase()} numbers are waiting right now.</p>}
    </section>
  );
}
