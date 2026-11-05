import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useClearanceAdmin } from "../context/ClearanceAdminContext";
import { OFFICE_LABELS, OFFICE_ORDER } from "../utils/officeChecks";
import type { OfficeId, OfficeLoad } from "../types";

/**
 * Hex values are the ones already used by the dashboard chart
 * (`src/admin/features/dashboard/components/EnrollmentChart.tsx`) so the two portals
 * stay one palette: amber = outstanding work, green = signed, and the grid /
 * tick / tooltip tokens match the precedent exactly.
 */
const PENDING_COLOR = "#d97706";
const SIGNED_COLOR = "#059669";
const GRID_COLOR = "#e5e9f5";
const TICK_COLOR = "#475da0";
const AXIS_LINE_COLOR = "#e0e4f2";
const TOOLTIP_BORDER = "#aebbea";
const TOOLTIP_TEXT = "#1b2f9e";
const TOOLTIP_CURSOR = "rgba(43, 75, 209, 0.06)";

/** Six categories must stay readable, so the axis uses the short office name. */
const AXIS_LABELS: Record<OfficeId, string> = {
  instructor: "Instructor",
  dean: "Dean",
  library: "Library",
  registrar: "Registrar",
  accounting: "Accounting",
  sao: "SAO/SSG",
};

const TICK_STYLE = {
  fill: TICK_COLOR,
  fontSize: 10,
  fontFamily: "Poppins, sans-serif",
};

/**
 * One row per column of the chart, so the SVG, the written summary and the
 * data-table fallback can never drift apart.
 */
type LoadDatum = {
  office: OfficeId;
  label: string;
  axisLabel: string;
  pending: number;
  signed: number;
};

type OfficeLoadChartProps = {
  /**
   * Called when a bar, or a table row's Filter button, is activated. The page
   * wires this to `setFilter("office", …)`; the widget itself stays agnostic.
   */
  onSelectOffice?: (office: OfficeId) => void;
};

function orderOfficeLoad(officeLoad: OfficeLoad[]): LoadDatum[] {
  const byOffice = new Map(officeLoad.map((entry) => [entry.office, entry]));

  // (3) The queue and this chart are both derived from the same records, and
  // the offices always appear in Form 3 order.
  return OFFICE_ORDER.map((office) => {
    const entry = byOffice.get(office);
    return {
      office,
      label: entry?.label ?? OFFICE_LABELS[office],
      axisLabel: AXIS_LABELS[office],
      pending: entry?.pending ?? 0,
      signed: entry?.signed ?? 0,
    };
  });
}

function summarySentence(datum: LoadDatum): string {
  return `${datum.label} is holding ${datum.pending} pending request${
    datum.pending === 1 ? "" : "s"
  } and has signed ${datum.signed}.`;
}

/**
 * Office workload chart (admin widgets in the spec, section 6).
 *
 * The SVG is decorative: `aria-hidden` on the chart surface, with the meaning
 * carried by a screen-reader summary plus a real `<table>` fallback, and every
 * series identified by its own text label rather than colour alone.
 */
export function OfficeLoadChart({ onSelectOffice }: OfficeLoadChartProps) {
  const { officeLoad, loading } = useClearanceAdmin();

  const data = useMemo(() => orderOfficeLoad(officeLoad), [officeLoad]);

  const totals = useMemo(
    () => ({
      pending: data.reduce((sum, datum) => sum + datum.pending, 0),
      signed: data.reduce((sum, datum) => sum + datum.signed, 0),
    }),
    [data],
  );

  const summary = useMemo(() => {
    if (totals.pending + totals.signed === 0) {
      return "No office has received a clearance request yet this period.";
    }
    const lines = data.filter((datum) => datum.pending > 0 || datum.signed > 0);
    return `Office workload, pending versus signed. ${lines.map(summarySentence).join(" ")}`;
  }, [data, totals.signed, totals.pending]);

  const busiest = useMemo(() => {
    if (totals.pending === 0) return "";
    const top = [...data].sort((a, b) => b.pending - a.pending)[0];
    if (!top || top.pending === 0) return "";
    return ` ${top.label} holds the most pending at ${top.pending}.`;
  }, [data, totals.pending]);

  const pick = (office: OfficeId) => {
    onSelectOffice?.(office);
  };

  if (loading) {
    return (
      <section
        aria-labelledby="office-load-heading"
        className="overflow-hidden rounded-2xl border border-cpc-tile-border/70 bg-white shadow-[0_18px_50px_rgba(15,36,104,0.22)]"
      >
        <header className="border-b border-cpc-tile-border/60 px-4 py-3">
          <h2
            id="office-load-heading"
            className="font-poppins text-sm font-semibold text-cpc-navy-text"
          >
            Office Load
          </h2>
          <p className="font-poppins text-[11px] text-cpc-heading-soft">
            Pending versus signed requests per office.
          </p>
        </header>
        <div className="space-y-3 p-4">
          <p className="sr-only" role="status">
            Loading office workload.
          </p>
          <div className="flex h-48 items-end gap-3" aria-hidden>
            {OFFICE_ORDER.map((office, index) => (
              <div key={office} className="flex h-full flex-1 items-end gap-1.5">
                <Skeleton className={index % 2 === 0 ? "h-3/5 flex-1" : "h-2/5 flex-1"} />
                <Skeleton className={index % 2 === 0 ? "h-4/5 flex-1" : "h-3/5 flex-1"} />
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="office-load-heading"
      className="overflow-hidden rounded-2xl border border-cpc-tile-border/70 bg-white shadow-[0_18px_50px_rgba(15,36,104,0.22)]"
    >
      <header className="border-b border-cpc-tile-border/60 px-4 py-3">
        <h2
          id="office-load-heading"
          className="font-poppins text-sm font-semibold text-cpc-navy-text"
        >
          Office Load
        </h2>
        <p className="font-poppins text-[11px] text-cpc-heading-soft">
          Pending versus signed requests per office.{" "}
          {onSelectOffice ? "Select an office to filter the queue." : ""}
        </p>
      </header>

      <div className="space-y-4 p-4">
        {totals.pending + totals.signed === 0 ? (
          <p className="font-poppins text-xs text-cpc-heading-soft">
            No clearance requests have reached an office yet this period.
          </p>
        ) : (
          <figure className="m-0">
            {/* Screen-reader summary of every value in the chart. */}
            <p className="sr-only">{summary}</p>

            {/* Scroll happens inside the card, so six categories never clip the
                rounded container nor push a horizontal scrollbar on the page. */}
            <div className="overflow-x-auto overscroll-x-contain [&_.recharts-bar-rectangle]:cursor-pointer">
              <div aria-hidden className="h-48 w-full min-w-[420px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
                    <XAxis
                      dataKey="axisLabel"
                      tick={{ ...TICK_STYLE }}
                      tickLine={false}
                      axisLine={{ stroke: AXIS_LINE_COLOR }}
                      interval={0}
                    />
                    <YAxis
                      tick={{ ...TICK_STYLE }}
                      tickLine={false}
                      axisLine={false}
                      width={40}
                      allowDecimals={false}
                    />
                    <Tooltip
                      cursor={{ fill: TOOLTIP_CURSOR }}
                      contentStyle={{
                        borderRadius: 10,
                        border: `1px solid ${TOOLTIP_BORDER}`,
                        fontFamily: "Poppins, sans-serif",
                        fontSize: 12,
                        color: TOOLTIP_TEXT,
                      }}
                    />
                    <Legend
                      iconType="circle"
                      iconSize={9}
                      wrapperStyle={{
                        fontFamily: "Poppins, sans-serif",
                        fontSize: 11,
                        color: TICK_COLOR,
                        paddingTop: 4,
                      }}
                    />
                    <Bar
                      dataKey="pending"
                      name="Pending"
                      fill={PENDING_COLOR}
                      radius={[6, 6, 0, 0]}
                      maxBarSize={22}
                      onClick={(_datum, index) => {
                        const target = data[index];
                        if (target) pick(target.office);
                      }}
                    />
                    <Bar
                      dataKey="signed"
                      name="Signed"
                      fill={SIGNED_COLOR}
                      radius={[6, 6, 0, 0]}
                      maxBarSize={22}
                      onClick={(_datum, index) => {
                        const target = data[index];
                        if (target) pick(target.office);
                      }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <figcaption className="mt-2 font-poppins text-[11px] leading-relaxed text-cpc-heading-soft">
              {totals.pending} request{totals.pending === 1 ? "" : "s"} awaiting signature,{" "}
              {totals.signed} signed.{busiest}
            </figcaption>
          </figure>
        )}

        {/* Data-table fallback: the same numbers as the chart, always readable
            and never beside it, so nothing overlaps at 375 px. */}
        <div className="overflow-hidden rounded-xl border border-cpc-tile-border/70">
          <table className="w-full table-fixed border-collapse">
            <caption className="sr-only">
              Office workload. Pending and signed clearance requests per office.
            </caption>
            <thead>
              <tr className="bg-cpc-section-light/60">
                <th
                  scope="col"
                  className="px-3 py-2 text-left font-poppins text-[10px] font-bold tracking-[0.1em] text-cpc-heading-soft uppercase"
                >
                  Office
                </th>
                <th
                  scope="col"
                  className="px-2 py-2 text-right font-poppins text-[10px] font-bold tracking-[0.1em] text-cpc-heading-soft uppercase"
                >
                  <span className="inline-flex items-center gap-1">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: PENDING_COLOR }}
                      aria-hidden
                    />
                    Pending
                  </span>
                </th>
                <th
                  scope="col"
                  className="px-2 py-2 text-right font-poppins text-[10px] font-bold tracking-[0.1em] text-cpc-heading-soft uppercase"
                >
                  <span className="inline-flex items-center gap-1">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: SIGNED_COLOR }}
                      aria-hidden
                    />
                    Signed
                  </span>
                </th>
                <th scope="col" className="w-[72px] px-2 py-2">
                  <span className="sr-only">Filter</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cpc-tile-border/60">
              {data.map((datum) => (
                <tr
                  key={datum.office}
                  className="transition-colors hover:bg-cpc-section-light/40 focus-within:bg-cpc-section-light/40"
                >
                  <th
                    scope="row"
                    className="px-3 py-2 text-left font-poppins text-[11px] font-semibold break-words text-cpc-navy-text"
                  >
                    {datum.label}
                  </th>
                  <td className="px-2 py-2 text-right font-poppins text-xs font-semibold text-cpc-heading-soft tabular-nums">
                    {datum.pending}
                  </td>
                  <td className="px-2 py-2 text-right font-poppins text-xs font-semibold text-cpc-heading-soft tabular-nums">
                    {datum.signed}
                  </td>
                  <td className="px-2 py-2 text-right">
                    {onSelectOffice ? (
                      <button
                        type="button"
                        onClick={() => pick(datum.office)}
                        className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-cpc-tile-border bg-white px-2 py-1 font-poppins text-[10px] font-semibold text-cpc-blue-accent transition-colors hover:bg-cpc-section-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
                      >
                        Filter
                        <ArrowRight className="h-3 w-3" aria-hidden />
                        <span className="sr-only"> requests for {datum.label}</span>
                      </button>
                    ) : (
                      <span className="sr-only">No filter action available.</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
