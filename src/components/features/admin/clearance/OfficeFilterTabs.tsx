import { useMemo, useRef } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { Building2, CheckCircle2, Clock3, Filter, Undo2 } from "lucide-react";
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
  const { isSuperAdmin, homeOffice, staff, rows, officeLoad, filters, setFilter } = useClearanceAdmin();
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
        icon: Clock3,
        activeClass: "bg-amber-500 text-white shadow-xs border-amber-600",
        inactiveClass: "bg-amber-50/80 text-amber-800 border-amber-200/80 hover:bg-amber-100/60",
        badgeActiveClass: "bg-white/25 text-white",
        badgeInactiveClass: "bg-amber-200/60 text-amber-900",
      },
      {
        value: "signed" as StatusFilter,
        label: "Signed",
        count: rows.filter((row) => row.status === "signed").length,
        icon: CheckCircle2,
        activeClass: "bg-emerald-600 text-white shadow-xs border-emerald-700",
        inactiveClass: "bg-emerald-50/80 text-emerald-800 border-emerald-200/80 hover:bg-emerald-100/60",
        badgeActiveClass: "bg-white/25 text-white",
        badgeInactiveClass: "bg-emerald-200/60 text-emerald-900",
      },
      {
        value: "rejected" as StatusFilter,
        label: "Rejected",
        count: rows.filter((row) => row.status === "rejected").length,
        icon: Undo2,
        activeClass: "bg-rose-500 text-white shadow-xs border-rose-600",
        inactiveClass: "bg-rose-50/80 text-rose-800 border-rose-200/80 hover:bg-rose-100/60",
        badgeActiveClass: "bg-white/25 text-white",
        badgeInactiveClass: "bg-rose-200/60 text-rose-900",
      },
      {
        value: "all" as StatusFilter,
        label: "All Records",
        count: rows.length,
        icon: Filter,
        activeClass: "bg-cpc-navy-text text-white shadow-xs border-cpc-navy-text",
        inactiveClass: "bg-white/90 text-cpc-heading-soft border-admin-border/70 hover:bg-white hover:text-cpc-navy-text",
        badgeActiveClass: "bg-white/25 text-white",
        badgeInactiveClass: "bg-admin-page text-admin-muted",
      },
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
    "inline-flex cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-1.5 font-poppins text-xs font-semibold whitespace-nowrap transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent";

  return (
    <nav
      aria-label="Filter clearance queue by office and status"
      className="rounded-2xl border border-white/80 bg-white/85 p-4 shadow-[0_8px_30px_rgb(15,36,104,0.04)] backdrop-blur-md sm:p-5"
    >
      {/* Top row: Office filters */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <div className="flex shrink-0 items-center gap-2 sm:w-28">
          <Building2 className="h-4 w-4 text-cpc-blue-accent" aria-hidden />
          <span className="font-poppins text-[11px] font-bold tracking-wider text-admin-muted uppercase">
            Office:
          </span>
        </div>

        {isSuperAdmin ? (
          <div
            role="tablist"
            aria-label="Office"
            onKeyDown={handleKeyDown}
            className="admin-scrollbar flex flex-1 flex-wrap gap-2 overflow-x-auto pb-0.5"
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
                      : "border-white/90 bg-white/90 text-cpc-navy-text shadow-xs hover:border-cpc-blue-accent/30 hover:bg-white",
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
          <p className="inline-flex w-fit items-center gap-2 rounded-xl border border-cpc-blue-accent/30 bg-cpc-blue-accent/10 px-3 py-1.5 font-poppins text-xs font-bold text-cpc-blue-accent">
            <Building2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {homeOffice === "dean" && staff.title
              ? staff.title
              : homeOffice
                ? OFFICE_TITLES[homeOffice]
                : "My Office"}
          </p>
        )}
      </div>

      {/* Divider */}
      <div className="my-3 border-t border-admin-border/50" />

      {/* Bottom row: Status filters */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <div className="flex shrink-0 items-center gap-2 sm:w-28">
          <Filter className="h-4 w-4 text-admin-muted" aria-hidden />
          <span className="font-poppins text-[11px] font-bold tracking-wider text-admin-muted uppercase">
            Status:
          </span>
        </div>

        <div
          role="group"
          aria-label="Filter by status"
          className="flex flex-1 flex-wrap gap-2"
          aria-live="polite"
        >
          {statusPills.map((pill) => {
            const active = filters.status === pill.value;
            const Icon = pill.icon;
            return (
              <button
                key={pill.value}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter("status", pill.value)}
                className={cn(
                  tabBase,
                  active ? pill.activeClass : pill.inactiveClass,
                )}
              >
                <Icon className="h-3 w-3 shrink-0" aria-hidden />
                {pill.label}
                <span
                  className={cn(
                    "inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] leading-none font-bold tabular-nums",
                    active ? pill.badgeActiveClass : pill.badgeInactiveClass,
                  )}
                >
                  {pill.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
