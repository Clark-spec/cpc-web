import { useState } from "react";
import { CalendarDays } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/format";
import { useClearanceAdmin } from "@/components/features/admin/clearance/ClearanceAdminContext";
import { DEFAULT_OVERDUE_DAYS, daysRemaining } from "@/components/features/admin/clearance/sla";
import type { ClearancePeriod } from "@/components/features/admin/clearance/types";

/** Threshold picker: 1–14 days, seeded from the SLA default of 3. */
const OVERDUE_CHOICES = Array.from({ length: 14 }, (_unused, index) => index + 1);

function clampDays(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_OVERDUE_DAYS;
  return Math.min(14, Math.max(1, Math.round(value)));
}

function pluralDays(count: number): string {
  return `${count} day${count === 1 ? "" : "s"}`;
}

/**
 * Admin-only clearance window settings (spec section 6).
 *
 * (1) Every write goes through the context, which persists `cpc:clearance:period`
 * — the same key the student portal reads before enabling "Request Signature" —
 * so nothing here is optimistic and no value is invented locally.
 */
export function ClearancePeriodCard() {
  const { isSuperAdmin, loading, period, setPeriod } = useClearanceAdmin();

  const [saving, setSaving] = useState(false);

  if (!isSuperAdmin) return null;

  const remaining = daysRemaining(period.closesAt);
  const windowEnded = remaining <= 0;
  const accepting = period.open && !windowEnded;

  const commitPeriod = async (patch: Partial<ClearancePeriod>) => {
    setSaving(true);
    try {
      await setPeriod(patch);
    } finally {
      setSaving(false);
    }
  };

  const shellClassName =
    "overflow-hidden rounded-2xl border border-white/80 bg-white/85 shadow-[0_8px_30px_rgb(15,36,104,0.04)] backdrop-blur-md";

  return (
    <section aria-labelledby="clearance-period-heading" className={shellClassName}>
      <header className="border-b border-white/60 bg-white/50 px-5 py-4">
        <h2
          id="clearance-period-heading"
          className="font-poppins text-sm font-semibold text-cpc-navy-text"
        >
          Clearance Period
        </h2>
        <p className="font-poppins text-[11px] text-cpc-heading-soft">
          Admin only — controls the student request window and the overdue SLA.
        </p>
      </header>

      {loading ? (
        <div className="space-y-3 p-4">
          <p className="sr-only" role="status">
            Loading clearance period.
          </p>
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
      ) : (
        <div className="space-y-4 p-4">
          {/* --- current period + days remaining ------------------------------ */}
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-poppins text-base font-bold break-words text-cpc-navy-text">
                {period.term}, AY {period.academicYear}
              </p>
              <p className="mt-0.5 flex items-center gap-1.5 font-poppins text-[11px] text-cpc-heading-soft">
                <CalendarDays className="h-3.5 w-3.5 shrink-0 text-cpc-blue-accent" aria-hidden />
                {formatDate(period.opensAt)} – {formatDate(period.closesAt)}
              </p>
            </div>

            {accepting ? (
              <Badge tone="success">{pluralDays(remaining)} remaining</Badge>
            ) : (
              <Badge tone="danger">Closed</Badge>
            )}
          </div>

          <p className="font-poppins text-[11px] leading-relaxed text-cpc-heading-soft">
            {windowEnded
              ? `The window ended on ${formatDate(period.closesAt)}, so no signature can be requested until it is reopened.`
              : accepting
                ? `Students can request signatures for the next ${pluralDays(remaining)}.`
                : `There are ${pluralDays(remaining)} left in the window, but accepting new requests is switched off.`}
          </p>

          {/* --- accept new requests ------------------------------------------ */}
          <div className="rounded-xl border border-cpc-tile-border/70 bg-cpc-section-light/30 p-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span
                id="clearance-open-switch-label"
                className="min-w-0 font-poppins text-xs font-semibold text-cpc-navy-text"
              >
                Accept new clearance requests
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={period.open}
                aria-labelledby="clearance-open-switch-label"
                aria-describedby="clearance-open-switch-hint"
                disabled={saving}
                onClick={() => void commitPeriod({ open: !period.open })}
                className={cn(
                  "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border transition-colors motion-reduce:animate-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent disabled:cursor-not-allowed disabled:opacity-60",
                  period.open
                    ? "border-cpc-button bg-cpc-button"
                    : "border-cpc-tile-border bg-white",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transition-transform motion-reduce:animate-none",
                    period.open ? "translate-x-6" : "translate-x-1",
                  )}
                />
                <span className="sr-only">
                  {period.open
                    ? "Accepting new clearance requests is on"
                    : "Accepting new clearance requests is off"}
                </span>
              </button>
            </div>

            <p
              id="clearance-open-switch-hint"
              className="mt-2 font-poppins text-[11px] leading-relaxed text-cpc-heading-soft"
            >
              {period.open
                ? "Students can send new signature requests to every office."
                : "When off, the student page disables “Request Signature” and shows “Clearance period is closed”."}
            </p>
          </div>

          {/* --- overdue threshold -------------------------------------------- */}
          <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
            <div className="min-w-0">
              <label
                htmlFor="clearance-overdue-days"
                className="block font-poppins text-xs font-semibold text-cpc-navy-text"
              >
                Overdue threshold
              </label>
              <p className="mt-1 font-poppins text-[11px] leading-relaxed text-cpc-heading-soft">
                Requests waiting longer than this are flagged as overdue. The Overdue KPI card
                counts pending requests older than {pluralDays(clampDays(period.overdueDays))} —
                the default is {pluralDays(DEFAULT_OVERDUE_DAYS)}.
              </p>
            </div>

            <select
              id="clearance-overdue-days"
              value={clampDays(period.overdueDays)}
              disabled={saving}
              onChange={(event) => {
                const next = clampDays(Number(event.target.value));
                if (next === period.overdueDays) return;
                void commitPeriod({ overdueDays: next });
              }}
              className="w-full cursor-pointer rounded-lg border border-cpc-tile-border bg-white px-3 py-2 font-poppins text-xs font-semibold text-cpc-navy-text transition-colors hover:bg-cpc-section-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {OVERDUE_CHOICES.map((days) => (
                <option key={days} value={days}>
                  {pluralDays(days)}
                </option>
              ))}
            </select>
          </div>

        </div>
      )}
    </section>
  );
}
