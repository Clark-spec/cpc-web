import { useMemo, useState } from "react";
import type { DragEvent } from "react";
import { AlertCircle, CheckCircle2, Clock3 } from "lucide-react";
import { CardSkeleton } from "@/components/common/display/Skeleton";
import { cn } from "@/lib/cn";
import { useClearanceAdmin } from "@/components/features/admin/clearance/ClearanceAdminContext";
import { EmptyState } from "@/components/features/admin/clearance/EmptyState";
import { QueueCard } from "@/components/features/admin/clearance/QueueCard";
import type { ClearanceRequestRow } from "@/components/features/admin/clearance/types";

type QueueBoardProps = {
  onSelect: (id: string) => void;
  /** Drop / button on the Signed column — the page opens the Approve & Sign modal. */
  onSign: (row: ClearanceRequestRow) => void;
  /** Drop / button on the Rejected column — the page opens the Reject modal. */
  onReject: (row: ClearanceRequestRow) => void;
};

type BoardColumn = {
  key: "awaiting" | "signed" | "rejected";
  title: string;
  rows: ClearanceRequestRow[];
  droppable: boolean;
  icon: typeof Clock3;
};

/**
 * Kanban view (spec §3). Columns come straight from `visibleRows`; native
 * HTML5 drag and drop only starts the same modal flow the buttons use, so a
 * drop can never sign or reject on its own.
 */
export function QueueBoard({ onSelect, onSign, onReject }: QueueBoardProps) {
  const { visibleRows, selectedRow, loading, hasActiveFilters, resetFilters } = useClearanceAdmin();
  const [dragOverKey, setDragOverKey] = useState<BoardColumn["key"] | null>(null);

  const columns = useMemo<BoardColumn[]>(() => {
    const by = (status: ClearanceRequestRow["status"]) =>
      visibleRows.filter((row) => row.status === status);
    return [
      { key: "awaiting", title: "Awaiting Signature", rows: by("requested"), droppable: false, icon: Clock3 },
      { key: "signed", title: "Signed", rows: by("signed"), droppable: true, icon: CheckCircle2 },
      { key: "rejected", title: "Rejected", rows: by("rejected"), droppable: true, icon: AlertCircle },
    ];
  }, [visibleRows]);

  function handleDrop(event: DragEvent<HTMLDivElement>, column: BoardColumn) {
    event.preventDefault();
    setDragOverKey(null);
    if (!column.droppable) return;

    const id = event.dataTransfer.getData("text/plain");
    const row = columns[0].rows.find((entry) => entry.id === id);
    if (!row) return;
    if (column.key === "signed") onSign(row);
    else onReject(row);
  }

  if (loading) {
    return (
      <section
        aria-label="Clearance board"
        className="rounded-2xl border border-white/80 bg-white/85 p-4 shadow-[0_8px_30px_rgb(15,36,104,0.04)] backdrop-blur-md"
        aria-busy="true"
      >
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <CardSkeleton key={index} />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section
      aria-label="Clearance board"
      className="rounded-2xl border border-white/80 bg-white/85 p-4 shadow-[0_8px_30px_rgb(15,36,104,0.04)] backdrop-blur-md"
    >
      <p className="sr-only">
        Drag a card from the Awaiting Signature column onto Signed or Rejected to open the approval
        or rejection dialog — a confirmation modal always appears first. Dragging is optional: every
        card also has Sign and Reject buttons.
      </p>

      {visibleRows.length === 0 ? (
        <EmptyState hasActiveFilters={hasActiveFilters} onClearFilters={resetFilters} />
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-admin-border/50 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="font-poppins text-xs font-bold uppercase tracking-wider text-admin-text">
                Clearance Board View
              </span>
              <span className="inline-flex items-center rounded-full bg-cpc-blue-accent/10 px-2.5 py-0.5 text-[10.5px] font-semibold text-cpc-blue-accent">
                {visibleRows.length} Total
              </span>
            </div>
            <p className="font-poppins text-[11px] text-admin-muted">
              Drag cards to Signed or Rejected to begin endorsement
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {columns.map((column) => {
            const Icon = column.icon;
            const highlighted = dragOverKey === column.key;
            return (
              <div
                key={column.key}
                onDragOver={column.droppable ? (event) => event.preventDefault() : undefined}
                onDragEnter={column.droppable ? () => setDragOverKey(column.key) : undefined}
                onDragLeave={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                    setDragOverKey(null);
                  }
                }}
                onDrop={(event) => handleDrop(event, column)}
                className={cn(
                  "flex min-w-0 flex-col rounded-xl border bg-cpc-section-light/40 transition-colors",
                  highlighted ? "border-cpc-blue-accent ring-2 ring-cpc-blue-accent" : "border-cpc-tile-border/50",
                )}
              >
                <h3 className="flex items-center justify-between gap-2 border-b border-cpc-tile-border/50 px-3 py-2.5">
                  <span className="inline-flex min-w-0 items-center gap-1.5 font-poppins text-xs font-bold text-cpc-navy-text">
                    <Icon className="h-3.5 w-3.5 shrink-0 text-cpc-blue-accent" aria-hidden />
                    <span className="truncate">{column.title}</span>
                  </span>
                  <span
                    aria-live="polite"
                    className="inline-flex min-w-6 shrink-0 items-center justify-center rounded-full bg-white px-2 py-0.5 font-poppins text-[10px] font-bold text-cpc-blue-accent tabular-nums"
                  >
                    {column.rows.length}
                  </span>
                </h3>

                <div className="admin-scrollbar max-h-96 flex-1 space-y-2 overflow-y-auto p-3 sm:max-h-[60vh]">
                  {column.rows.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-cpc-tile-border/70 px-3 py-4 text-center font-poppins text-[11px] text-cpc-heading-soft">
                      {column.droppable ? "Drop a card here" : "Nothing here"}
                    </p>
                  ) : (
                    column.rows.map((row) => (
                      <QueueCard
                        key={row.id}
                        row={row}
                        selected={selectedRow?.id === row.id}
                        onSelect={onSelect}
                        onSign={onSign}
                        onReject={onReject}
                        onDragEnd={() => setDragOverKey(null)}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
          </div>
        </div>
      )}
    </section>
  );
}
