import { useState, useEffect } from "react";
import {
  CheckCircle2,
  HeartHandshake,
  ShieldCheck,
  Sparkles,
  UserCheck,
} from "lucide-react";
import { useAdminAuth } from "@/components/context/AdminAuthContext";
import {
  approveGuidance,
  getGuidanceQueue,
  subscribeToEnrollmentQueue,
} from "@/services/enrollmentWorkflow/service";
import type { EnrollmentFormRecord, QueueTicket } from "@/types/enrollmentWorkflow";
import { EnrollmentSignatureInbox } from "./EnrollmentSignatureInbox";

export function GuidanceQueueView() {
  const { user } = useAdminAuth();
  const [queue, setQueue] = useState<EnrollmentFormRecord[]>(() => getGuidanceQueue());
  const [issuedNotice, setIssuedNotice] = useState<QueueTicket | null>(null);

  const refresh = () => setQueue(getGuidanceQueue());

  useEffect(() => {
    const unsub = subscribeToEnrollmentQueue(refresh);
    return unsub;
  }, []);

  const handleApprove = (studentId: string) => {
    const ticket = approveGuidance(studentId, user?.name ?? "Guidance Counselor");
    setIssuedNotice(ticket);
    refresh();
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 font-poppins">
      <EnrollmentSignatureInbox office="guidance" />
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 rounded-full bg-cpc-blue-accent/10 px-3.5 py-1.5 text-xs font-semibold text-cpc-blue-accent">
          <HeartHandshake className="h-4 w-4" />
          Step 4 & 5 · Guidance Office Approvals & Queue Ticket Issuance
        </div>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-cpc-navy-text sm:text-3xl">
          Guidance Approval Queue
        </h1>
        <p className="mt-1.5 text-sm text-cpc-heading-soft">
          Review approved enrollment forms and clearance status. Authorizing a form automatically generates the student's department queue ticket for face-to-face verification.
        </p>
      </div>

      {/* Ticket Issued Toast Banner */}
      {issuedNotice && (
        <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4 text-emerald-900 shadow-sm animate-in fade-in-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              <div>
                <p className="text-xs font-bold text-emerald-900">
                  Queue Ticket Issued: <span className="font-mono text-sm">{issuedNotice.number}</span>
                </p>
                <p className="text-[11px] text-emerald-800">
                  Assigned to {issuedNotice.studentName} ({issuedNotice.department} - {issuedNotice.timeBlock})
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIssuedNotice(null)}
              className="text-xs font-semibold text-emerald-700 hover:underline"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Queue List */}
      <div className="space-y-4">
        {queue.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-cpc-input-border/80 bg-white p-12 text-center shadow-xs">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500/80" />
            <h3 className="mt-3 text-base font-bold text-cpc-navy-text">Guidance Queue Up to Date</h3>
            <p className="mt-1 text-xs text-cpc-heading-soft">
              No enrollment forms are currently waiting for Guidance approval.
            </p>
          </div>
        ) : (
          queue.map((form) => (
            <div
              key={form.id}
              className="rounded-2xl border border-cpc-input-border/70 bg-white p-6 shadow-sm transition hover:shadow-md"
            >
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-cpc-input-border/40 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-cpc-navy-text">{form.studentName}</h3>
                    <span className="font-mono text-xs text-cpc-muted-blue font-medium">({form.studentId})</span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        form.standing === "regular"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                    >
                      {form.standing.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-cpc-heading-soft mt-0.5">
                    {form.course} · Year {form.yearLevel} · {form.department}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
                    <ShieldCheck className="h-3.5 w-3.5" /> Clearance Attached
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-cpc-blue-accent border border-blue-200">
                    <UserCheck className="h-3.5 w-3.5" /> Screening Passed
                  </span>
                  <button
                    type="button"
                    onClick={() => handleApprove(form.studentId)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-cpc-blue-accent px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                    Approve & Issue Queue Ticket
                  </button>
                </div>
              </div>

              {/* Summary */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-4 text-xs text-cpc-heading-soft">
                <div>
                  <span className="font-semibold text-cpc-navy-text">Enrolled Subjects: </span>
                  <span>{form.subjects.map((s) => s.code).join(", ")}</span>
                </div>
                <div>
                  <span className="font-semibold text-cpc-navy-text">Approved Load: </span>
                  <span className="font-bold text-cpc-blue-accent">{form.totalUnits} Units</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
