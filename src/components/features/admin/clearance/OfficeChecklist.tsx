import { useState } from "react";
import { AlertTriangle, CheckCircle2, HelpCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { useClearanceAdmin } from "@/components/features/admin/clearance/ClearanceAdminContext";
import { OFFICE_TITLES, countIssues } from "@/components/features/admin/clearance/officeChecks";
import type { OfficeCheckItem } from "@/components/features/admin/clearance/types";

const RESULT_META: Record<
  OfficeCheckItem["result"],
  { label: string; icon: LucideIcon; tone: string }
> = {
  ok: { label: "Clear", icon: CheckCircle2, tone: "text-emerald-700" },
  issue: { label: "Issue", icon: AlertTriangle, tone: "text-rose-700" },
  unknown: { label: "Unknown", icon: HelpCircle, tone: "text-slate-500" },
};

/**
 * Auto-evaluated checks for the selected request's office. The "Verified"
 * toggles are deliberately local state — the context does not persist staff
 * verification — and the page re-keys this panel whenever the selection
 * changes so the seeds below reset with each new request.
 */
export function OfficeChecklist() {
  const { selectedRow, selectedChecks } = useClearanceAdmin();

  const [verified, setVerified] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(selectedChecks.map((item) => [item.id, item.verifiedByStaff])),
  );

  if (!selectedRow) return null;

  const issues = countIssues(selectedChecks);

  return (
    <section aria-labelledby="office-checklist-heading" className="min-w-0">
      <h3
        id="office-checklist-heading"
        className="font-poppins text-[10px] font-bold tracking-[0.12em] text-cpc-heading-soft uppercase"
      >
        Office checks · {OFFICE_TITLES[selectedRow.office]}
      </h3>

      {issues > 0 && (
        <div
          role="status"
          className="mt-2 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" aria-hidden />
          <p className="font-poppins text-[11px] leading-relaxed font-medium text-amber-700">
            {issues} {issues === 1 ? "issue" : "issues"} found. You can still sign, but we
            recommend rejecting with remarks.
          </p>
        </div>
      )}

      {selectedChecks.length === 0 ? (
        <p className="mt-2 rounded-xl border border-dashed border-cpc-tile-border/70 px-3 py-2.5 font-poppins text-xs text-cpc-heading-soft italic">
          No automated checks for this office.
        </p>
      ) : (
        <ul className="mt-2 space-y-2">
          {selectedChecks.map((item) => {
            const meta = RESULT_META[item.result];
            const Icon = meta.icon;
            const isChecked = verified[item.id] ?? item.verifiedByStaff;

            return (
              <li
                key={item.id}
                className="flex items-start justify-between gap-2 rounded-xl border border-cpc-tile-border/70 bg-white px-3 py-2.5"
              >
                <div className="flex min-w-0 items-start gap-2">
                  <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", meta.tone)} aria-hidden />
                  <div className="min-w-0">
                    <p className="font-poppins text-xs font-semibold text-cpc-navy-text">
                      {item.label}
                    </p>
                    <p className="mt-0.5 font-poppins text-[11px] leading-snug break-words text-cpc-heading-soft">
                      <span className={cn("font-semibold", meta.tone)}>{meta.label}:</span>{" "}
                      {item.detail ?? "No further detail recorded."}
                    </p>
                  </div>
                </div>

                <label className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-cpc-tile-border/70 bg-cpc-section-light/60 px-2 py-1.5 transition-colors hover:bg-cpc-section-light">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() =>
                      setVerified((current) => ({
                        ...current,
                        [item.id]: !(current[item.id] ?? item.verifiedByStaff),
                      }))
                    }
                    className="h-3.5 w-3.5 cursor-pointer accent-cpc-blue-accent"
                  />
                  <span className="font-poppins text-[10px] font-bold text-cpc-label">
                    Verified
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
