import { useState, useEffect } from "react";
import { Link } from "react-router";
import {
  Bell,
  Building2,
  CheckCircle2,
  Clock,
  ExternalLink,
  Filter,
  Play,
  RotateCcw,
  SkipForward,
  Volume2,
} from "lucide-react";
import { useAdminAuth } from "@/components/context/AdminAuthContext";
import {
  callNextTicket,
  getQueueTickets,
  markDone,
  moveToLast,
  recallTicket,
  subscribeToEnrollmentQueue,
} from "@/services/enrollmentWorkflow/service";
import type { DepartmentCode, QueueOfficeId, QueueTicket, YearGroup } from "@/types/enrollmentWorkflow";

interface OfficeQueueConsoleProps {
  office: QueueOfficeId;
  title: string;
  stepNumber: number;
  description: string;
}

export function OfficeQueueConsole({
  office,
  title,
  stepNumber,
  description,
}: OfficeQueueConsoleProps) {
  const { user } = useAdminAuth();

  const [tickets, setTickets] = useState<QueueTicket[]>(() => getQueueTickets());
  const [filterYear, setFilterYear] = useState<YearGroup | "all">("all");
  const [filterDept, setFilterDept] = useState<DepartmentCode | "all">("all");
  const [chimeNotice, setChimeNotice] = useState<string | null>(null);

  const refresh = () => setTickets(getQueueTickets());

  useEffect(() => {
    const unsub = subscribeToEnrollmentQueue(refresh);
    return unsub;
  }, []);

  // Filter tickets for this office
  const officeTickets = tickets.filter((t) => {
    if (filterYear !== "all" && t.yearGroup !== filterYear) return false;
    if (filterDept !== "all" && t.department !== filterDept) return false;
    return true;
  });

  const nowServing = officeTickets.find(
    (t) => t[office].status === "SERVING" || t[office].status === "CALLED",
  );

  const waitingList = officeTickets
    .filter((t) => t[office].status === "WAITING" && t.id !== nowServing?.id)
    .sort((a, b) => a[office].position - b[office].position);

  const movedToLastList = officeTickets.filter(
    (t) => t[office].status === "MOVED_TO_LAST" && t.id !== nowServing?.id,
  );

  const doneList = officeTickets.filter((t) => t[office].status === "DONE");

  const playChime = (ticketNumber: string) => {
    setChimeNotice(`Now Calling Ticket ${ticketNumber}!`);
    setTimeout(() => setChimeNotice(null), 3000);
  };

  const handleCallNext = (ticketId?: string) => {
    const called = callNextTicket(office, ticketId, user?.name ?? title);
    if (called) playChime(called.number);
    refresh();
  };

  const handleRecall = () => {
    if (!nowServing) return;
    const recalled = recallTicket(office, nowServing.id, user?.name ?? title);
    if (recalled) playChime(recalled.number);
    refresh();
  };

  const handleMoveToLast = () => {
    if (!nowServing) return;
    moveToLast(office, nowServing.id, user?.name ?? title);
    refresh();
  };

  const handleMarkDone = () => {
    if (!nowServing) return;
    markDone(office, nowServing.id, user?.name ?? title);
    refresh();
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 font-poppins">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-cpc-blue-accent/10 px-3.5 py-1.5 text-xs font-semibold text-cpc-blue-accent">
            <Building2 className="h-4 w-4" />
            Step {stepNumber} Face-to-Face Station · {title}
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-cpc-navy-text sm:text-3xl">
            {title} Queue Console
          </h1>
          <p className="mt-1 text-sm text-cpc-heading-soft">{description}</p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/display"
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-xl border border-cpc-input-border/80 bg-white px-4 py-2 text-xs font-bold text-cpc-navy-text hover:border-cpc-blue-accent transition shadow-2xs"
          >
            <ExternalLink className="h-3.5 w-3.5" /> Open Public Screen
          </Link>
        </div>
      </div>

      {/* Chime Bell Banner */}
      {chimeNotice && (
        <div className="mb-6 rounded-2xl border border-blue-300 bg-blue-600 p-4 text-white shadow-md animate-bounce">
          <div className="flex items-center gap-3 font-bold text-sm">
            <Volume2 className="h-5 w-5" />
            <span>{chimeNotice}</span>
          </div>
        </div>
      )}

      {/* Main Console Top Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 mb-8">
        {/* NOW SERVING CARD (7 cols) */}
        <div className="lg:col-span-7 rounded-3xl border border-cpc-input-border/80 bg-white p-6 sm:p-8 shadow-sm">
          <div className="flex items-center justify-between border-b border-cpc-input-border/50 pb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-cpc-heading-soft">
              Station Current Action
            </span>
            {nowServing && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800 animate-pulse">
                <Play className="h-3 w-3 fill-current" /> NOW SERVING AT COUNTER
              </span>
            )}
          </div>

          {nowServing ? (
            <div className="mt-6 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-semibold text-cpc-heading-soft">Ticket Number</span>
                  <div className="text-5xl font-extrabold tracking-tight font-mono text-cpc-blue-accent mt-1">
                    {nowServing.number}
                  </div>
                  <h3 className="text-lg font-bold text-cpc-navy-text mt-2">{nowServing.studentName}</h3>
                  <p className="text-xs font-medium text-cpc-heading-soft">
                    ID: {nowServing.studentId} · {nowServing.department} (Year {nowServing.yearLevel})
                  </p>
                  <p className="text-xs text-cpc-muted-blue mt-1">Time Block: {nowServing.timeBlock}</p>
                </div>

                <div className="text-center sm:text-right rounded-2xl bg-cpc-section-light/60 p-4 border border-cpc-input-border/50">
                  <span className="text-[11px] font-bold uppercase text-cpc-heading-soft">Recalls Counter</span>
                  <p className="text-2xl font-mono font-bold text-cpc-navy-text">
                    {nowServing[office].recalls} / 3 Max
                  </p>
                  {nowServing[office].recalls >= 3 && (
                    <span className="inline-block mt-1 text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                      FLAGGED: MOVED_TO_LAST
                    </span>
                  )}
                </div>
              </div>

              {/* Station Action Buttons */}
              <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3 border-t border-cpc-input-border/50 pt-6">
                <button
                  type="button"
                  onClick={handleRecall}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-xs font-bold text-amber-800 hover:bg-amber-100 transition"
                >
                  <RotateCcw className="h-4 w-4" />
                  Recall ({nowServing[office].recalls})
                </button>

                <button
                  type="button"
                  onClick={handleMoveToLast}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-300 bg-rose-50 px-4 py-2.5 text-xs font-bold text-rose-800 hover:bg-rose-100 transition"
                >
                  <SkipForward className="h-4 w-4" />
                  Move to Last
                </button>

                <button
                  type="button"
                  onClick={handleMarkDone}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Mark Done
                </button>
              </div>
            </div>
          ) : (
            <div className="my-10 text-center">
              <Clock className="mx-auto h-12 w-12 text-slate-300" />
              <h3 className="mt-3 text-base font-bold text-cpc-navy-text">Counter Currently Idle</h3>
              <p className="mt-1 text-xs text-cpc-heading-soft">
                {waitingList.length > 0
                  ? `${waitingList.length} students waiting in line. Click 'Call Next Student' to proceed.`
                  : "No students currently in the queue line."}
              </p>
              {waitingList.length > 0 && (
                <button
                  type="button"
                  onClick={() => handleCallNext()}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-cpc-blue-accent px-6 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition"
                >
                  <Play className="h-4 w-4 fill-current" /> Call Next Student
                </button>
              )}
            </div>
          )}
        </div>

        {/* METRICS & QUICK CALL (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-3xl border border-cpc-input-border/80 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-bold text-cpc-navy-text mb-4">Queue Summary</h3>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl bg-blue-50/70 p-3 border border-blue-100">
                <span className="text-[10px] font-bold uppercase text-cpc-blue-accent">Waiting</span>
                <p className="text-2xl font-mono font-bold text-cpc-blue-accent mt-0.5">{waitingList.length}</p>
              </div>
              <div className="rounded-xl bg-rose-50/70 p-3 border border-rose-100">
                <span className="text-[10px] font-bold uppercase text-rose-700">Moved Last</span>
                <p className="text-2xl font-mono font-bold text-rose-700 mt-0.5">{movedToLastList.length}</p>
              </div>
              <div className="rounded-xl bg-emerald-50/70 p-3 border border-emerald-100">
                <span className="text-[10px] font-bold uppercase text-emerald-700">Done</span>
                <p className="text-2xl font-mono font-bold text-emerald-700 mt-0.5">{doneList.length}</p>
              </div>
            </div>

            <div className="mt-5">
              <button
                type="button"
                onClick={() => handleCallNext()}
                disabled={waitingList.length === 0 && movedToLastList.length === 0}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-cpc-blue-accent py-3 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Bell className="h-4 w-4" /> Call Next in Line
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="rounded-3xl border border-cpc-input-border/80 bg-white p-5 shadow-sm">
            <h4 className="text-xs font-bold text-cpc-navy-text mb-3 flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-cpc-muted-blue" />
              Console Year & Dept Filters
            </h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-cpc-heading-soft">Year Group</label>
                <select
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value as YearGroup | "all")}
                  className="mt-1 w-full rounded-xl border border-cpc-input-border/80 px-2.5 py-1.5 font-medium text-cpc-navy-text"
                >
                  <option value="all">All Year Groups</option>
                  <option value="1-2">Years 1 & 2</option>
                  <option value="3-4">Years 3 & 4</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-cpc-heading-soft">Department</label>
                <select
                  value={filterDept}
                  onChange={(e) => setFilterDept(e.target.value as DepartmentCode | "all")}
                  className="mt-1 w-full rounded-xl border border-cpc-input-border/80 px-2.5 py-1.5 font-medium text-cpc-navy-text"
                >
                  <option value="all">All Departments</option>
                  <option value="BSIT">BSIT</option>
                  <option value="BEED">BEED</option>
                  <option value="BSHM">BSHM</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* WAITING LIST TABLE */}
      <div className="rounded-3xl border border-cpc-input-border/80 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-cpc-input-border/50 pb-4">
          <h3 className="text-base font-bold text-cpc-navy-text">
            Waiting Queue List ({waitingList.length + movedToLastList.length})
          </h3>
          <span className="text-xs text-cpc-heading-soft">Section 4 Order of Call</span>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-cpc-input-border/60 text-cpc-heading-soft uppercase tracking-wider text-[10px]">
                <th className="py-2.5 font-bold">Ticket #</th>
                <th className="py-2.5 font-bold">Student Name</th>
                <th className="py-2.5 font-bold">Department</th>
                <th className="py-2.5 font-bold">Time Block</th>
                <th className="py-2.5 font-bold">Status</th>
                <th className="py-2.5 font-bold text-right">Quick Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cpc-input-border/40">
              {waitingList.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/60 transition">
                  <td className="py-3 font-mono font-bold text-cpc-blue-accent text-sm">{t.number}</td>
                  <td className="py-3 font-bold text-cpc-navy-text">
                    {t.studentName} <span className="text-[11px] font-mono font-normal text-cpc-heading-soft">({t.studentId})</span>
                  </td>
                  <td className="py-3 text-cpc-heading-soft">{t.department} (Yr {t.yearLevel})</td>
                  <td className="py-3 text-cpc-heading-soft">{t.timeBlock}</td>
                  <td className="py-3">
                    <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-cpc-blue-accent border border-blue-200">
                      WAITING
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleCallNext(t.id)}
                      className="rounded-lg bg-cpc-blue-accent/10 px-3 py-1 font-bold text-cpc-blue-accent hover:bg-cpc-blue-accent hover:text-white transition"
                    >
                      Call Direct
                    </button>
                  </td>
                </tr>
              ))}

              {movedToLastList.map((t) => (
                <tr key={t.id} className="bg-rose-50/30 hover:bg-rose-50/60 transition">
                  <td className="py-3 font-mono font-bold text-rose-700 text-sm">{t.number}</td>
                  <td className="py-3 font-bold text-cpc-navy-text">
                    {t.studentName} <span className="text-[11px] font-mono font-normal text-cpc-heading-soft">({t.studentId})</span>
                  </td>
                  <td className="py-3 text-cpc-heading-soft">{t.department} (Yr {t.yearLevel})</td>
                  <td className="py-3 text-cpc-heading-soft">{t.timeBlock}</td>
                  <td className="py-3">
                    <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-[10px] font-bold text-rose-800 border border-rose-300">
                      MOVED_TO_LAST
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleCallNext(t.id)}
                      className="rounded-lg bg-rose-600 px-3 py-1 font-bold text-white hover:bg-rose-700 transition"
                    >
                      Call Now
                    </button>
                  </td>
                </tr>
              ))}

              {waitingList.length === 0 && movedToLastList.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-cpc-heading-soft">
                    No tickets waiting in line for this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
