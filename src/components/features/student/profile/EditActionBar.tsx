import { Save, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { ActionButton, type ActionStatus } from "@/components/ui/action-button";

type EditActionBarProps = {
  /** id of the <form> the Save button submits. */
  formId: string;
  saving: boolean;
  canSave: boolean;
  /** Optional animated state; falls back to `saving`. */
  status?: ActionStatus;
  onCancel: () => void;
  className?: string;
};

/** Save / Cancel controls, reused inside the hero and in the mobile sticky bar. */
export function EditActionBar({
  formId,
  saving,
  canSave,
  status,
  onCancel,
  className,
}: EditActionBarProps) {
  const saveStatus: ActionStatus = status ?? (saving ? "loading" : "idle");

  return (
    <div className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:items-center", className)}>
      <button
        type="button"
        onClick={onCancel}
        disabled={saving || saveStatus === "loading" || saveStatus === "success"}
        className="cpc-btn cpc-btn-secondary"
      >
        <X className="h-4 w-4" aria-hidden />
        Cancel
      </button>

      <ActionButton
        type="submit"
        form={formId}
        status={saveStatus}
        loadingLabel="Saving…"
        successLabel="Saved"
        errorLabel="Not saved"
        disabled={!canSave}
      >
        <Save className="h-4 w-4" aria-hidden />
        Save Changes
      </ActionButton>
    </div>
  );
}
