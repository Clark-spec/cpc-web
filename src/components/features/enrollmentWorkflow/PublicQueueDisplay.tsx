import { useState, useEffect } from "react";
import {
  HeartPulse,
  Receipt,
  Sparkles,
  UserCheck,
} from "lucide-react";
import {
  getQueueDisplay,
  subscribeToEnrollmentQueue,
} from "@/services/enrollmentWorkflow/service";
import type { QueueTicket } from "@/types/enrollmentWorkflow";

export function PublicQueueDisplay() {
  const [displayData, setDisplayData] = useState(() => getQueueDisplay());
  const [currentTime, setCurrentTime] = useState(() => new Date());

  useEffect(() => {
    const clockTimer = setInterval(() => setCurrentTime(new Date()), 1000);
    const unsub = subscribeToEnrollmentQueue(() => {
      setDisplayData(getQueueDisplay());
    });
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        setDisplayData(getQueueDisplay());
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      clearInterval(clockTimer);
      document.removeEventListener("visibilitychange", onVisibility);
      unsub();
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 font-poppins text-white p-4 sm:p-6 lg:p-8 flex flex-col justify-between">
      {/* Top Banner Bar */}
      <header className="rounded-2xl bg-slate-900 border border-slate-800 p-4 sm:p-6 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-cpc-blue-accent flex items-center justify-center font-bold text-white text-xl shadow-lg ring-2 ring-blue-400/30">
            CPC
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
              CORDOVA PUBLIC COLLEGE
              <span className="hidden sm:inline-block rounded-full bg-blue-500/20 px-2.5 py-0.5 text-xs font-bold text-blue-400 border border-blue-500/30">
                LIVE QUEUE DISPLAY
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Online Enrollment & Face-to-Face Office Station Call Board
            </p>
          </div>
        </div>

        {/* Live Clock */}
        <div className="flex items-center gap-6 font-mono text-right">
          <div>
            <div className="text-sm font-bold text-slate-300">
              {currentTime.toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-400">
              {currentTime.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </div>
          </div>
        </div>
      </header>

      {/* Main 3 Office Stations Board */}
      <main className="my-6 grid grid-cols-1 gap-6 lg:grid-cols-3 flex-1">
        {/* STATION 1: CLINIC */}
        <StationCard
          title="COLLEGE CLINIC"
          subtitle="Station 1 (Step 6)"
          icon={HeartPulse}
          tone="emerald"
          nowServing={displayData.clinic.nowServing}
          nextTickets={displayData.clinic.next}
          office="clinic"
        />

        {/* STATION 2: ACCOUNTING */}
        <StationCard
          title="ACCOUNTING OFFICE"
          subtitle="Station 2 (Step 7)"
          icon={Receipt}
          tone="amber"
          nowServing={displayData.accounting.nowServing}
          nextTickets={displayData.accounting.next}
          office="accounting"
        />

        {/* STATION 3: REGISTRAR */}
        <StationCard
          title="REGISTRAR'S OFFICE"
          subtitle="Station 3 (Step 8 - Final)"
          icon={UserCheck}
          tone="blue"
          nowServing={displayData.registrar.nowServing}
          nextTickets={displayData.registrar.next}
          office="registrar"
        />
      </main>

      {/* Footer Instructions Ticker */}
      <footer className="rounded-xl bg-slate-900/90 border border-slate-800/80 px-6 py-3 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
          <span className="font-semibold text-slate-200">Continuous Queue Protocol Active:</span>
          <span>Students are called by department number order. Please prepare your QR code.</span>
        </div>
        <div className="text-[11px] text-slate-500 font-mono">
          Cordova Public College · Enrollment Queue Engine v2.0
        </div>
      </footer>
    </div>
  );
}

interface StationCardProps {
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: "emerald" | "amber" | "blue";
  nowServing: QueueTicket | null;
  nextTickets: QueueTicket[];
  office: "clinic" | "accounting" | "registrar";
}

function StationCard({
  title,
  subtitle,
  icon: Icon,
  tone,
  nowServing,
  nextTickets,
  office,
}: StationCardProps) {
  const toneBg =
    tone === "emerald"
      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
      : tone === "amber"
      ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
      : "bg-blue-500/10 border-blue-500/30 text-blue-400";

  const numColor =
    tone === "emerald"
      ? "text-emerald-400"
      : tone === "amber"
      ? "text-amber-400"
      : "text-blue-400";

  return (
    <div className="flex flex-col justify-between rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl relative overflow-hidden">
      {/* Top station header */}
      <div>
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className={`rounded-xl p-2.5 border ${toneBg}`}>
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {subtitle}
              </span>
              <h2 className="text-lg font-extrabold text-white">{title}</h2>
            </div>
          </div>
        </div>

        {/* NOW SERVING HERO */}
        <div className="mt-6 text-center py-6 px-4 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-inner">
          <span className="text-xs font-bold tracking-widest uppercase text-slate-400 flex items-center justify-center gap-1.5">
            <Sparkles className="h-4 w-4 text-amber-400 animate-spin" /> NOW SERVING
          </span>

          {nowServing ? (
            <div className="mt-3 animate-in zoom-in-95 duration-200">
              <div className={`text-6xl sm:text-7xl font-extrabold font-mono tracking-tight ${numColor}`}>
                {nowServing.number}
              </div>
              <h3 className="mt-2 text-base font-bold text-slate-100 truncate">
                {nowServing.studentName}
              </h3>
              <p className="text-xs font-mono text-slate-400 mt-0.5">
                {nowServing.department} · Year {nowServing.yearLevel}
              </p>
            </div>
          ) : (
            <div className="mt-4 py-8">
              <span className="text-4xl font-mono font-bold text-slate-600">---</span>
              <p className="mt-2 text-xs text-slate-500">Awaiting Next Ticket</p>
            </div>
          )}
        </div>
      </div>

      {/* NEXT IN LINE LIST */}
      <div className="mt-6 border-t border-slate-800 pt-4">
        <div className="flex items-center justify-between mb-3 text-xs text-slate-400">
          <span className="font-bold tracking-wider uppercase text-[10px]">Next in Line</span>
          <span className="font-mono text-[11px]">{nextTickets.length} waiting</span>
        </div>

        <div className="space-y-2">
          {nextTickets.slice(0, 4).map((ticket, idx) => (
            <div
              key={ticket.id}
              className={`flex items-center justify-between p-2.5 rounded-xl border text-xs ${
                ticket[office].status === "MOVED_TO_LAST"
                  ? "bg-rose-950/20 border-rose-900/40 text-rose-300"
                  : idx === 0
                  ? "bg-slate-800/80 border-slate-700 text-slate-200 font-bold"
                  : "bg-slate-950/40 border-slate-800/60 text-slate-400"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="font-mono text-slate-500 text-[10px]">#{idx + 1}</span>
                <span className="font-mono font-bold text-white text-sm">{ticket.number}</span>
                <span className="text-[11px] text-slate-400 truncate max-w-[120px]">{ticket.studentName}</span>
              </div>
              <div>
                {ticket[office].status === "MOVED_TO_LAST" ? (
                  <span className="text-[9px] font-bold text-rose-400 bg-rose-950 px-1.5 py-0.5 rounded-md">
                    MOVED TO LAST
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400 font-mono">{ticket.department}</span>
                )}
              </div>
            </div>
          ))}

          {nextTickets.length === 0 && (
            <div className="py-4 text-center text-xs text-slate-600">
              No upcoming tickets in line
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
