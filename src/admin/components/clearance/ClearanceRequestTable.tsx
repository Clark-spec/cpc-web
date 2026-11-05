import { ArrowRight, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatDateTime, formatRelativeTime } from "@/features/clearance/lib/format";
import { StatusBadge } from "../StatusBadge";
import { EmptyState } from "../EmptyState";
import type { ClearanceRequest } from "../../types";

const OFFICE_LABELS: Record<ClearanceRequest["office"], string> = {
  instructor: "Instructor",
  dean: "Dean",
  library: "Library",
  registrar: "Registrar",
  accounting: "Accounting",
  sao: "SAO / SSG Adviser",
};

type ClearanceRequestTableProps = {
  requests: ClearanceRequest[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onToggleAll: () => void;
  onReview: (request: ClearanceRequest) => void;
};

/** Clearance queue: table on desktop, cards on phones. */
export function ClearanceRequestTable({
  requests,
  selectedIds,
  onToggle,
  onToggleAll,
  onReview,
}: ClearanceRequestTableProps) {
  if (requests.length === 0) {
    return (
      <EmptyState
        icon={ShieldCheck}
        title="No clearance requests found"
        description="Try a different tab or clear the search. New student requests appear here automatically."
      />
    );
  }

  const allSelected = requests.every((request) => selectedIds.includes(request.id));
  const someSelected = requests.some((request) => selectedIds.includes(request.id));

  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse">
          <caption className="sr-only">
            Clearance requests. {requests.length} rows shown.
          </caption>
          <thead>
            <tr className="border-b border-cpc-tile-border/60 bg-cpc-section-light/40">
              <th scope="col" className="w-10 px-3 py-2.5">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(element) => {
                    if (element) element.indeterminate = someSelected && !allSelected;
                  }}
                  onChange={onToggleAll}
                  aria-label={allSelected ? "Deselect all rows" : "Select all rows"}
                  className="h-3.5 w-3.5 cursor-pointer accent-cpc-blue-accent"
                />
              </th>
              {["Student", "Program", "Office", "Requested", "Status", ""].map((label) => (
                <th
                  key={label || "actions"}
                  scope="col"
                  className={cn(
                    "px-3 py-2.5 font-poppins text-[10px] font-bold tracking-[0.1em] text-cpc-heading-soft uppercase",
                    label === "" ? "text-right" : "text-left",
                  )}
                >
                  {label || <span className="sr-only">Actions</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-cpc-tile-border/50">
            {requests.map((request) => {
              const selected = request.status === "pending" && selectedIds.includes(request.id);
              return (
                <tr
                  key={request.id}
                  className={cn(
                    "transition-colors",
                    selected ? "bg-cpc-section-light/50" : "hover:bg-cpc-section-light/30",
                  )}
                >
                  <td className="px-3 py-3">
                    <input
                      type="checkbox"
                      checked={selected}
                      disabled={request.status !== "pending"}
                      onChange={() => onToggle(request.id)}
                      aria-label={
                        request.status === "pending"
                          ? `Select ${request.studentName}'s request`
                          : `${request.studentName}'s request is already ${request.status}`
                      }
                      className="h-3.5 w-3.5 cursor-pointer accent-cpc-blue-accent disabled:cursor-not-allowed disabled:opacity-40"
                    />
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cpc-navy font-poppins text-[10px] font-semibold text-white">
                        {request.studentName
                          .split(" ")
                          .map((part) => part.charAt(0))
                          .slice(0, 2)
                          .join("")}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-poppins text-xs font-semibold text-cpc-navy-text">
                          {request.studentName}
                        </p>
                        <p className="truncate font-poppins text-[10px] text-cpc-heading-soft">
                          {request.studentId}
                          {request.live && (
                            <span className="ml-1.5 rounded bg-emerald-50 px-1 py-0.5 text-[9px] font-semibold text-emerald-700">
                              Live
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <p className="font-poppins text-[11px] text-cpc-navy-text">{request.program}</p>
                    <p className="font-poppins text-[10px] text-cpc-heading-soft">
                      {request.section} · {request.yearLevel}
                    </p>
                  </td>
                  <td className="px-3 py-3">
                    <span className="font-poppins text-[11px] font-medium text-cpc-navy-text">
                      {OFFICE_LABELS[request.office]}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <time
                      dateTime={request.requestedAt}
                      title={formatDateTime(request.requestedAt)}
                      className="font-poppins text-[11px] whitespace-nowrap text-cpc-heading-soft"
                    >
                      {formatRelativeTime(request.requestedAt)}
                    </time>
                  </td>
                  <td className="px-3 py-3">
                    <StatusBadge status={request.status} />
                  </td>
                  <td className="px-3 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => onReview(request)}
                      className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-cpc-tile-border bg-white px-2.5 py-1.5 font-poppins text-[11px] font-semibold text-cpc-blue-accent transition-colors hover:bg-cpc-section-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
                    >
                      {request.status === "pending" ? "Review" : "View"}
                      <ArrowRight className="h-3 w-3" aria-hidden />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ul className="divide-y divide-cpc-tile-border/50 md:hidden">
        {requests.map((request) => {
          const selected = request.status === "pending" && selectedIds.includes(request.id);
          return (
            <li key={request.id} className={cn("px-4 py-3", selected && "bg-cpc-section-light/50")}>
              <div className="flex items-start gap-2.5">
                <input
                  type="checkbox"
                  checked={selected}
                  disabled={request.status !== "pending"}
                  onChange={() => onToggle(request.id)}
                  aria-label={
                    request.status === "pending"
                      ? `Select ${request.studentName}'s request`
                      : `${request.studentName}'s request is already ${request.status}`
                  }
                  className="mt-1 h-3.5 w-3.5 cursor-pointer accent-cpc-blue-accent disabled:cursor-not-allowed disabled:opacity-40"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-poppins text-xs font-semibold text-cpc-navy-text">
                        {request.studentName}
                      </p>
                      <p className="truncate font-poppins text-[10px] text-cpc-heading-soft">
                        {request.studentId} · {request.section}
                      </p>
                    </div>
                    <StatusBadge status={request.status} />
                  </div>

                  <p className="mt-1 font-poppins text-[11px] text-cpc-heading-soft">
                    {OFFICE_LABELS[request.office]} · {request.program}
                  </p>

                  <div className="mt-2 flex items-center justify-between gap-2">
                    <time
                      dateTime={request.requestedAt}
                      title={formatDateTime(request.requestedAt)}
                      className="font-poppins text-[10px] text-cpc-heading-soft"
                    >
                      {formatRelativeTime(request.requestedAt)}
                    </time>
                    <button
                      type="button"
                      onClick={() => onReview(request)}
                      className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-cpc-tile-border bg-white px-2.5 py-1.5 font-poppins text-[11px] font-semibold text-cpc-blue-accent transition-colors hover:bg-cpc-section-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
                    >
                      {request.status === "pending" ? "Review" : "View"}
                      <ArrowRight className="h-3 w-3" aria-hidden />
                    </button>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
