import { useState } from "react";
import { AlertTriangle, Bell, UploadCloud } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/cn";
import { useScheduleAdmin } from "@/components/features/admin/schedules/ScheduleAdminContext";
import {
  BTN_NEUTRAL,
  BTN_PRIMARY,
  FIELD_BASE,
  HINT_TEXT_BASE,
  LABEL_BASE,
} from "@/components/features/admin/schedules/formStyles";

type PublishModalProps = {
  open: boolean;
  onClose: () => void;
};

export function PublishModal({ open, onClose }: PublishModalProps) {
  const {
    conflictCount,
    dirtyCount,
    publish,
    published,
    publishDiff,
    publishing,
  } = useScheduleAdmin();

  const [notifyStudents, setNotifyStudents] = useState(true);
  const [overrideConflicts, setOverrideConflicts] = useState(false);
  const [message, setMessage] = useState("");

  const nextVersion = published.version + 1;
  const hasConflicts = conflictCount > 0;
  const canSubmit = !publishing && (!hasConflicts || overrideConflicts);

  const totalAdded = publishDiff.reduce((sum, d) => sum + d.added.length, 0);
  const totalEdited = publishDiff.reduce((sum, d) => sum + d.edited.length, 0);
  const totalRemoved = publishDiff.reduce((sum, d) => sum + d.removed.length, 0);
  const affectedSections = publishDiff.map((d) => d.section);

  const handlePublish = async () => {
    if (!canSubmit) return;
    await publish({
      notifyStudents,
      overrideConflicts,
      message: message.trim() || undefined,
    });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      labelledBy="publish-schedule-modal-title"
      className="max-w-lg"
    >
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-cpc-input-border/70 pb-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cpc-blue-accent/10 text-cpc-blue-accent ring-1 ring-cpc-blue-accent/20">
            <UploadCloud className="h-6 w-6" aria-hidden />
          </span>
          <div>
            <h2
              id="publish-schedule-modal-title"
              className="font-poppins text-base font-bold text-cpc-navy-text"
            >
              Publish Class Schedule
            </h2>
            <p className="font-poppins text-xs text-cpc-heading-soft">
              Moves working draft to live portal as{" "}
              <strong className="text-cpc-navy-text">Version {nextVersion}</strong>
            </p>
          </div>
        </div>

        {/* Change Diff Summary */}
        <div className="rounded-xl border border-cpc-input-border/80 bg-slate-50/70 p-4 space-y-2.5">
          <p className="font-poppins text-xs font-semibold text-cpc-navy-text">
            Publishing summary:
          </p>
          <div className="flex flex-wrap gap-2 text-xs font-poppins">
            {totalAdded > 0 && (
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700 ring-1 ring-emerald-600/20">
                +{totalAdded} {totalAdded === 1 ? "class added" : "classes added"}
              </span>
            )}
            {totalEdited > 0 && (
              <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2.5 py-1 font-medium text-amber-700 ring-1 ring-amber-600/20">
                ~{totalEdited} {totalEdited === 1 ? "class modified" : "classes modified"}
              </span>
            )}
            {totalRemoved > 0 && (
              <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2.5 py-1 font-medium text-rose-700 ring-1 ring-rose-600/20">
                -{totalRemoved} {totalRemoved === 1 ? "class removed" : "classes removed"}
              </span>
            )}
            {totalAdded === 0 && totalEdited === 0 && totalRemoved === 0 && (
              <span className="text-cpc-heading-soft">
                {dirtyCount > 0 ? `${dirtyCount} working changes` : "Direct version refresh"}
              </span>
            )}
          </div>
          {affectedSections.length > 0 && (
            <p className="font-poppins text-[11px] text-cpc-heading-soft">
              Affects {affectedSections.length} {affectedSections.length === 1 ? "section" : "sections"}:{" "}
              <span className="font-medium text-cpc-navy-text">{affectedSections.join(", ")}</span>
            </p>
          )}
        </div>

        {/* Conflicts Warning */}
        {hasConflicts && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 space-y-2">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-poppins text-xs font-semibold text-rose-800">
                  {conflictCount} unresolved schedule {conflictCount === 1 ? "conflict" : "conflicts"}
                </p>
                <p className="font-poppins text-[11px] text-rose-700 mt-0.5">
                  Overlapping room or instructor assignments exist in this draft.
                </p>
              </div>
            </div>
            <label className="flex items-center gap-2 pt-1 cursor-pointer">
              <input
                type="checkbox"
                checked={overrideConflicts}
                onChange={(e) => setOverrideConflicts(e.target.checked)}
                className="h-4 w-4 rounded border-rose-300 text-rose-600 focus:ring-rose-500"
              />
              <span className="font-poppins text-xs font-medium text-rose-900">
                I understand there are conflicts and want to publish anyway
              </span>
            </label>
          </div>
        )}

        {/* Notification Options */}
        <div className="space-y-3">
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={notifyStudents}
              onChange={(e) => setNotifyStudents(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-cpc-input-border text-cpc-blue-accent focus:ring-cpc-blue-accent/20"
            />
            <div>
              <span className="font-poppins text-xs font-semibold text-cpc-navy-text flex items-center gap-1.5">
                <Bell className="h-3.5 w-3.5 text-cpc-blue-accent" />
                Notify enrolled students
              </span>
              <p className="font-poppins text-[11px] text-cpc-heading-soft">
                Pushes an update notification to affected students' bell feed and shows the new schedule banner.
              </p>
            </div>
          </label>

          {notifyStudents && (
            <div>
              <label htmlFor="publish-note" className={LABEL_BASE}>
                Custom announcement note (optional)
              </label>
              <input
                id="publish-note"
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="e.g. Updated room assignments for AY 2026-2027 1st Semester"
                className={FIELD_BASE}
              />
              <p className={HINT_TEXT_BASE}>
                Leaves default announcement text if empty.
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 border-t border-cpc-input-border/70 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={publishing}
            className={BTN_NEUTRAL}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handlePublish}
            disabled={!canSubmit}
            className={cn(
              BTN_PRIMARY,
              "flex items-center gap-1.5",
              hasConflicts && overrideConflicts && "!bg-amber-600 hover:!bg-amber-700"
            )}
          >
            {publishing ? (
              <>Publishing v{nextVersion}…</>
            ) : (
              <>
                <UploadCloud className="h-4 w-4" />
                Publish Schedule v{nextVersion}
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
