import { useState } from "react";
import { History, RotateCcw, UploadCloud } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/admin/ConfirmDialog";
import { cn } from "@/lib/cn";
import { useScheduleAdmin } from "../context/ScheduleAdminContext";

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
 *
 * (2) The two numbers here answer different questions and are deliberately not
 * merged. "Version" is what students currently see — it only moves when
 * `publish()` copies the draft into the published store. "Unpublished changes"
 * is a diff against that copy, so it counts what the registrar changed since,
 * including edits still being decided on. A draft can be dirty and the students
 * none the wiser, which is exactly the guarantee this module exists to keep.
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
      className="flex flex-col gap-4 rounded-2xl border border-cpc-tile-border/70 bg-white p-4 shadow-[0_10px_30px_rgba(27,47,158,0.06)] sm:p-5"
    >
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
              neverPublished
                ? "bg-amber-50 text-amber-600"
                : "bg-cpc-section-light text-cpc-blue-accent",
            )}
            aria-hidden
          >
            <UploadCloud className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="font-poppins text-sm leading-tight font-bold text-cpc-navy-text">
              {neverPublished ? (
                "Nothing published yet"
              ) : (
                <>
                  {"Published · v"}
                  {published.version}
                </>
              )}
            </p>
            <p className="mt-0.5 font-poppins text-xs text-cpc-heading-soft">
              {neverPublished
                ? "Students still see the released timetable only after the first publish."
                : `${formatStamp(published.publishedAt)} by ${published.publishedBy || "Registrar"}`}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2" aria-live="polite">
          {dirtyCount === 0 ? (
            <Badge tone="success">
              <History className="h-3 w-3 shrink-0" aria-hidden />
              Draft matches v{published.version}
            </Badge>
          ) : (
            <Badge tone="warning">
              {dirtyCount} unpublished {dirtyCount === 1 ? "change" : "changes"}
            </Badge>
          )}
          {conflictCount > 0 ? (
            <Badge tone="danger">
              {conflictCount} {conflictCount === 1 ? "conflict" : "conflicts"}
            </Badge>
          ) : (
            <Badge tone="info">No conflicts</Badge>
          )}
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            disabled={discardDisabled}
            title={discardDisabled && disabledReason ? disabledReason : undefined}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-cpc-tile-border bg-white px-3 py-2 font-poppins text-xs font-semibold text-cpc-navy-text transition-colors hover:bg-cpc-section-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RotateCcw className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Discard draft
          </button>
        </div>
      </div>

      {dirtyCount > 0 && (
        <p className="font-poppins text-xs leading-relaxed text-cpc-heading-soft">
          Students keep seeing v{published.version} until {dirtyCount === 1 ? "this change is" : "these changes are"}{" "}
          published.
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
