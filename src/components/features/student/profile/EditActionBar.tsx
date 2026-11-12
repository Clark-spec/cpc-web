import { LoaderCircle, Save, X } from "lucide-react";
import { cn } from "@/lib/cn";

type EditActionBarProps = {
  /** id of the <form> the Save button submits. */
  formId: string;
  saving: boolean;
  canSave: boolean;
  onCancel: () => void;
  className?: string;
};

/** Save / Cancel controls, reused inside the hero and in the mobile sticky bar. */
export function EditActionBar({ formId, saving, canSave, onCancel, className }: EditActionBarProps) {
  return (
    <div className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:items-center", className)}>
      <button
        type="button"
        onClick={onCancel}
        disabled={saving}
        className="cpc-btn cpc-btn-secondary"
      >
        <X className="h-4 w-4" aria-hidden />
        Cancel
      </button>

      <button
        type="submit"
        form={formId}
        disabled={!canSave || saving}
        className="cpc-btn cpc-btn-primary"
      >
        {saving ? (
          <>
            <LoaderCircle className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden />
            Saving…
          </>
        ) : (
          <>
            <Save className="h-4 w-4" aria-hidden />
            Save Changes
          </>
        )}
      </button>
    </div>
  );
}
