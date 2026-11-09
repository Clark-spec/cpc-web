import { useState } from "react";
import { Loader2, RotateCcw, UserRoundPlus, X } from "lucide-react";
import { ADMIN_USERS } from "@/lib/navigation";
import { useAdminAuth } from "@/components/context/AdminAuthContext";
import type { AdminRole } from "@/types/admin";
import { useClearanceAdmin } from "@/components/features/admin/clearance/ClearanceAdminContext";

const BTN =
  "inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-cpc-tile-border bg-white px-3 py-2 font-poppins text-xs font-semibold text-cpc-navy-text transition-colors hover:bg-cpc-section-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent disabled:cursor-not-allowed disabled:opacity-60";

/**
 * Demo console (spec §8), revealed by Ctrl+Shift+D. "Simulate student request"
 * writes into the same shared record the student page owns, so the row appears
 * here the moment the notification fires.
 */
export function ClearanceDemoPanel() {
  const { demoMode, user, switchRole } = useAdminAuth();
  const { busy, simulateStudentRequest, simulateStudentCancel, resetDemo } = useClearanceAdmin();
  const [pending, setPending] = useState<string | null>(null);

  if (!demoMode) return null;

  async function run(id: string, action: () => Promise<void>) {
    setPending(id);
    try {
      await action();
    } finally {
      setPending(null);
    }
  }

  return (
    <section
      aria-label="Clearance demo controls"
      className="rounded-2xl border border-white/80 bg-white/85 p-4 shadow-[0_8px_30px_rgb(15,36,104,0.04)] backdrop-blur-md"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-cpc-navy font-poppins text-[11px] font-bold text-white">
            D
          </span>
          <div>
            <p className="font-poppins text-sm font-semibold text-cpc-navy-text">Demo mode</p>
            <p className="font-poppins text-[11px] text-cpc-heading-soft">
              Switch offices or fire student actions to watch the queue update live.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => switchRole("admin")}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1 font-poppins text-[11px] font-medium text-cpc-heading-soft transition-colors hover:text-cpc-navy-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
        >
          <X className="h-3.5 w-3.5" aria-hidden />
          Back to admin
        </button>
      </div>

      <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="w-full lg:max-w-xs">
          <label
            htmlFor="demo-role"
            className="font-poppins text-[11px] font-semibold text-cpc-heading-soft"
          >
            Switch role
          </label>
          <select
            id="demo-role"
            value={user?.role ?? "admin"}
            onChange={(event) => switchRole(event.target.value as AdminRole)}
            className="mt-1 w-full cursor-pointer rounded-lg border border-cpc-input-border bg-white px-3 py-2 font-poppins text-xs font-medium text-cpc-navy-text transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
          >
            {Object.values(ADMIN_USERS).map((staff) => (
              <option key={staff.role} value={staff.role}>
                {staff.name} — {staff.title}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => run("request", simulateStudentRequest)}
            className={BTN}
          >
            {pending === "request" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            ) : (
              <UserRoundPlus className="h-3.5 w-3.5" aria-hidden />
            )}
            Simulate student request
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => run("cancel", simulateStudentCancel)}
            className={BTN}
          >
            {pending === "cancel" && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
            Simulate student cancel
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => run("reset", resetDemo)}
            className={BTN}
          >
            {pending === "reset" && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
            <RotateCcw className="h-3.5 w-3.5" aria-hidden />
            Reset demo data
          </button>
        </div>
      </div>
    </section>
  );
}
