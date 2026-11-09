import { useMemo, useRef } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { Building2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { useClearanceAdmin } from "@/components/features/admin/clearance/ClearanceAdminContext";
import { OFFICE_LABELS, OFFICE_ORDER, OFFICE_TITLES } from "@/components/features/admin/clearance/officeChecks";
import type { OfficeFilter, StatusFilter } from "@/components/features/admin/clearance/types";

/**
 * Role-aware office scope + status pills (spec §2).
 *
 * Admins get an arrow-key tablist over every office with live pending counts;
 * office staff are hard-scoped to their own office and only see a title chip.
 * Both roles share the status pills underneath.
 */
export function OfficeFilterTabs() {
  const { isSuperAdmin, homeOffice, rows, officeLoad, filters, setFilter } = useClearanceAdmin();
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const tabs = useMemo(
    () => [
      {
        value: "all" as OfficeFilter,
        label: "All Offices",
        pending: officeLoad.reduce((sum, load) => sum + load.pending, 0),
      },
      ...OFFICE_ORDER.map((office) => ({
        value: office as OfficeFilter,
        label: OFFICE_LABELS[office],
        pending: officeLoad.find((load) => load.office === office)?.pending ?? 0,
      })),
    ],
    [officeLoad],
  );

  const statusPills = useMemo(
    () => [
      {
        value: "requested" as StatusFilter,
        label: "Pending",
        count: rows.filter((row) => row.status === "requested").length,
      },
      {
        value: "signed" as StatusFilter,
        label: "Signed",
        count: rows.filter((row) => row.status === "signed").length,
      },
      {
        value: "rejected" as StatusFilter,
        label: "Rejected",
        count: rows.filter((row) => row.status === "rejected").length,
      },
      { value: "all" as StatusFilter, label: "All", count: rows.length },
    ],
    [rows],
  );

  const activeIndex = Math.max(
    0,
    tabs.findIndex((tab) => tab.value === filters.office),
  );

  /** Roving focus — ArrowLeft/ArrowRight walk the tablist and apply the filter. */
  function handleKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const step = event.key === "ArrowRight" ? 1 : -1;
    const next = (activeIndex + step + tabs.length) % tabs.length;
    setFilter("office", tabs[next].value);
    tabRefs.current[next]?.focus();
  }

  const tabBase =
    "inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3.5 py-2 font-poppins text-xs font-semibold whitespace-nowrap transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent";

  return (
    <nav
      aria-label="Filter clearance queue by office and status"
      className="flex flex-col gap-3 rounded-2xl border border-white/80 bg-white/70 p-4 shadow-[0_4px_20px_rgba(15,36,104,0.04)] backdrop-blur-md"
    >
      {isSuperAdmin ? (
        <div
          role="tablist"
          aria-label="Office"
          onKeyDown={handleKeyDown}
          className="admin-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1"
        >
          {tabs.map((tab, index) => {
            const active = filters.office === tab.value;
            return (
              <button
                key={tab.value}
                ref={(element) => {
                  tabRefs.current[index] = element;
                }}
                type="button"
                role="tab"
                aria-selected={active}
                tabIndex={active ? 0 : -1}
                onClick={() => setFilter("office", tab.value)}
                className={cn(
                  tabBase,
                  active
                    ? "border-cpc-blue-accent bg-cpc-blue-accent text-white shadow-xs"
                    : "border-white/80 bg-white/80 text-cpc-navy-text shadow-xs backdrop-blur-xs hover:border-cpc-tile-border hover:bg-white",
                )}
              >
                {tab.label}
                <span
                  aria-live="polite"
                  className={cn(
                    "inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] leading-none font-bold tabular-nums",
                    active ? "bg-white/25 text-white" : "bg-cpc-section-light text-cpc-blue-accent",
                  )}
                >
                  {tab.pending}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <p className="inline-flex w-fit items-center gap-2 rounded-full border border-cpc-tile-border/70 bg-cpc-section-light px-3.5 py-2 font-poppins text-xs font-bold text-cpc-blue-accent">
          <Building2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {homeOffice ? OFFICE_TITLES[homeOffice] : "My Office"}
        </p>
      )}

      <div role="group" aria-label="Filter by status" className="flex flex-wrap gap-2" aria-live="polite">
        {statusPills.map((pill) => {
          const active = filters.status === pill.value;
          return (
            <button
              key={pill.value}
              type="button"
              aria-pressed={active}
              onClick={() => setFilter("status", pill.value)}
              className={cn(
                tabBase,
                active
                  ? "border-cpc-navy-text bg-cpc-navy-text text-white"
                  : "border-cpc-tile-border/70 bg-white text-cpc-heading-soft hover:bg-cpc-section-light",
              )}
            >
              {pill.label}
              <span
                className={cn(
                  "inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] leading-none font-bold tabular-nums",
                  active ? "bg-white/25 text-white" : "bg-cpc-section-light text-cpc-blue-accent",
                )}
              >
                {pill.count}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
