import { useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Loader2,
  RotateCcw,
  ShieldCheck,
  X,
} from "lucide-react";
import { useClearance } from "../context/ClearanceContext";
import { officeSignerNames } from "../data/mockClearance";
import type { OfficeId } from "../types";

const REMARKS_MAX_LENGTH = 200;

/**
 * Floating stand-in for the staff/admin app.
 *
 * Visible only in demo mode: it approves (attaches a placeholder signature) or
 * rejects the offices whose status is "requested", exactly like the real staff
 * side will through the API.
 */
export function DemoStaffPanel() {
  const { demoMode, offices, demoApprove, demoReject, resetDemo } = useClearance();
  const [open, setOpen] = useState(true);
  const [busyOffice, setBusyOffice] = useState<OfficeId | null>(null);
  const [rejecting, setRejecting] = useState<OfficeId | null>(null);
  const [remarks, setRemarks] = useState("");
  const [resetting, setResetting] = useState(false);

  if (!demoMode) return null;

  const requested = offices.filter((office) => office.status === "requested");

  async function handleApprove(officeId: OfficeId) {
    setBusyOffice(officeId);
    try {
      await demoApprove(officeId);
    } finally {
      setBusyOffice(null);
    }
  }

  async function handleReject(officeId: OfficeId) {
    if (!remarks.trim()) return;
    setBusyOffice(officeId);
    try {
      await demoReject(officeId, remarks);
      setRejecting(null);
      setRemarks("");
    } finally {
      setBusyOffice(null);
    }
  }

  async function handleReset() {
    setResetting(true);
    try {
      await resetDemo();
    } finally {
      setResetting(false);
    }
  }

  return (
    <aside
      aria-label="Demo staff panel"
      className="fixed right-3 bottom-3 z-40 w-[min(22rem,calc(100vw-1.5rem))] sm:right-4 sm:bottom-4"
    >
      {open ? (
        <div className="overflow-hidden rounded-xl border border-cpc-tile-border bg-white shadow-[0_18px_48px_rgba(15,36,104,0.28)]">
          <div className="flex items-center gap-2 bg-cpc-navy px-3 py-2.5 text-white">
            <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="font-poppins text-xs font-semibold">Demo Staff Panel</p>
              <p className="font-poppins text-[10px] text-white/75">Simulates the admin side</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-expanded="true"
              aria-controls="demo-staff-body"
              aria-label="Collapse demo staff panel"
              className="rounded p-1 transition-colors hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <ChevronDown className="h-4 w-4" aria-hidden />
            </button>
          </div>

          <div id="demo-staff-body" className="max-h-[48vh] overflow-y-auto p-3">
            {requested.length === 0 ? (
              <p className="rounded-lg bg-cpc-section-light/70 px-2.5 py-3 font-poppins text-[11px] leading-relaxed text-cpc-heading-soft">
                No pending staff actions. Request a signature as the student and the office will
                appear here.
              </p>
            ) : (
              <ul className="space-y-2">
                {requested.map((office) => {
                  const busy = busyOffice === office.office;
                  const isRejecting = rejecting === office.office;

                  return (
                    <li
                      key={office.office}
                      className="rounded-lg border border-cpc-input-border p-2.5"
                    >
                      <p className="font-poppins text-xs font-semibold text-cpc-navy-text">
                        {office.label}
                      </p>
                      <p className="font-poppins text-[10px] text-cpc-heading-soft">
                        {office.signerName ?? officeSignerNames[office.office]}
                      </p>

                      {isRejecting ? (
                        <div className="mt-2">
                          <label
                            htmlFor={`reject-remarks-${office.office}`}
                            className="font-poppins text-[10px] font-medium text-cpc-label"
                          >
                            Reason for the student
                          </label>
                          <textarea
                            id={`reject-remarks-${office.office}`}
                            value={remarks}
                            onChange={(event) =>
                              setRemarks(event.target.value.slice(0, REMARKS_MAX_LENGTH))
                            }
                            rows={2}
                            maxLength={REMARKS_MAX_LENGTH}
                            placeholder="e.g. Attendance for Exhibit (Index Card) is missing"
                            className="mt-1 w-full resize-none rounded-md border border-cpc-input-border px-2 py-1.5 font-poppins text-[11px] text-cpc-navy-text outline-none focus:border-cpc-icon focus:ring-2 focus:ring-cpc-icon/30"
                          />
                          <p className="mt-0.5 text-right font-poppins text-[9px] text-cpc-heading-soft">
                            {remarks.length}/{REMARKS_MAX_LENGTH}
                          </p>
                          <div className="mt-1.5 flex gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleReject(office.office)}
                              disabled={busy || !remarks.trim()}
                              className="inline-flex flex-1 cursor-pointer items-center justify-center gap-1 rounded-md bg-rose-600 px-2 py-1.5 font-poppins text-[11px] font-semibold text-white transition-colors hover:bg-rose-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {busy ? (
                                <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
                              ) : (
                                <X className="h-3 w-3" aria-hidden />
                              )}
                              Confirm Reject
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setRejecting(null);
                                setRemarks("");
                              }}
                              disabled={busy}
                              className="cursor-pointer rounded-md border border-cpc-tile-border px-2 py-1.5 font-poppins text-[11px] font-medium text-cpc-label transition-colors hover:bg-cpc-section-light disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-2 flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleApprove(office.office)}
                            disabled={busy}
                            className="inline-flex flex-1 cursor-pointer items-center justify-center gap-1 rounded-md bg-emerald-600 px-2 py-1.5 font-poppins text-[11px] font-semibold text-white transition-colors hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {busy ? (
                              <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
                            ) : (
                              <Check className="h-3 w-3" aria-hidden />
                            )}
                            Approve (sign)
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setRejecting(office.office);
                              setRemarks("");
                            }}
                            disabled={busy}
                            className="inline-flex flex-1 cursor-pointer items-center justify-center gap-1 rounded-md border border-rose-300 px-2 py-1.5 font-poppins text-[11px] font-semibold text-rose-700 transition-colors hover:bg-rose-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <X className="h-3 w-3" aria-hidden />
                            Reject
                          </button>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}

            <button
              type="button"
              onClick={handleReset}
              disabled={resetting}
              className="mt-3 inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-md border border-cpc-tile-border px-2 py-2 font-poppins text-[11px] font-semibold text-cpc-label transition-colors hover:bg-cpc-section-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent disabled:cursor-not-allowed disabled:opacity-60"
            >
              {resetting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
              ) : (
                <RotateCcw className="h-3.5 w-3.5" aria-hidden />
              )}
              Reset demo
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-expanded="false"
          aria-controls="demo-staff-body"
          className="ml-auto flex cursor-pointer items-center gap-2 rounded-full border border-cpc-tile-border bg-cpc-navy px-3.5 py-2.5 font-poppins text-xs font-semibold text-white shadow-[0_10px_28px_rgba(15,36,104,0.32)] transition-colors hover:bg-cpc-navy-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <ShieldCheck className="h-4 w-4" aria-hidden />
          Demo Staff Panel
          {requested.length > 0 && (
            <span className="rounded-full bg-white px-1.5 py-0.5 text-[10px] font-bold text-cpc-navy">
              {requested.length}
            </span>
          )}
          <ChevronUp className="h-3.5 w-3.5" aria-hidden />
        </button>
      )}
    </aside>
  );
}
