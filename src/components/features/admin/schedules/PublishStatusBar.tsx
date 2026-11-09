import { useState } from "react";
import { History, RotateCcw, UploadCloud } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/common/feedback/ConfirmDialog";
import { cn } from "@/lib/cn";
import { useScheduleAdmin } from "@/components/features/admin/schedules/ScheduleAdminContext";

/** "Oct 04, 2026, 9:12 AM" — falls back to the raw value if the stamp is odd. */
function formatStamp(iso: string): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Publish status bar (spec §1).
 */
export function PublishStatusBar() {
  const {
    canEdit,
    conflictCount,
    discardDraft,
    dirtyCount,
    editDisabledReason,
    published,
    publishing,
  } = useScheduleAdmin();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const neverPublished = published.version === 0;
  const disabledReason = editDisabledReason();
  const discardDisabled = !canEdit || dirtyCount === 0 || publishing;

  return (
    <section
      aria-label="Publish status"
      className="flex flex-col gap-4 rounded-2xl border border-white/80 bg-white/85 p-5 shadow-[0_8px_30px_rgb(15,36,104,0.04)] backdrop-blur-md"
    >
      <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-xs ring-1 ring-black/5",
              neverPublished
                ? "bg-amber-50 text-amber-600"
                : "bg-cpc-blue-accent/10 text-cpc-blue-accent",
            )}
            aria-hidden
          >
            <UploadCloud className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-poppins text-sm leading-tight font-bold text-cpc-navy-text">
                {neverPublished ? (
                  "Draft Timetable · Not yet published"
                ) : (
                  <>Published Timetable · v{published.version}</>
                )}
              </p>
              {dirtyCount === 0 ? (
                <Badge tone="success" className="shadow-xs">
                  <History className="h-3 w-3 shrink-0" aria-hidden />
                  Live synced with v{published.version}
                </Badge>
              ) : (
                <Badge tone="warning" className="shadow-xs">
                  {dirtyCount} unpublished {dirtyCount === 1 ? "change" : "changes"}
                </Badge>
              )}
              {conflictCount > 0 ? (
                <Badge tone="danger" className="shadow-xs">
                  {conflictCount} {conflictCount === 1 ? "conflict" : "conflicts"}
                </Badge>
              ) : (
                <Badge tone="info" className="shadow-xs">No conflicts</Badge>
              )}
            </div>
            <p className="mt-1 font-poppins text-xs text-cpc-heading-soft">
              {neverPublished
                ? "Students still see the released timetable only after the first publish."
                : `Last updated ${formatStamp(published.publishedAt)} by ${published.publishedBy || "Registrar"}`}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            disabled={discardDisabled}
            title={discardDisabled && disabledReason ? disabledReason : undefined}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-white/80 bg-white/90 px-3.5 py-2 font-poppins text-xs font-semibold text-cpc-navy-text shadow-xs transition-all hover:border-cpc-blue-accent/30 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RotateCcw className="h-3.5 w-3.5 shrink-0 text-admin-muted" aria-hidden />
            Discard draft
          </button>
        </div>
      </div>

      {dirtyCount > 0 && (
        <p className="border-t border-admin-border/50 pt-3 font-poppins text-xs leading-relaxed text-admin-muted">
          Students continue seeing published v{published.version} until {dirtyCount === 1 ? "this change is" : "these changes are"}{" "}
          officially published to the live portal.
        </p>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          void discardDraft();
        }}
        title="Discard all unpublished changes?"
        description={
          <>
            The working draft will be rebuilt from published v{published.version}. Every{" "}
            {dirtyCount === 1 ? "change" : "change"} listed as unpublished will be undone —
            you can reverse this action for a few seconds from the notification.
          </>
        }
        confirmLabel="Discard draft"
        danger
        busy={publishing}
        id="schedule-discard-title"
      />
    </section>
  );
}
