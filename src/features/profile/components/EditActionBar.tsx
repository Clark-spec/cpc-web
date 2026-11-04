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
        className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-cpc-tile-border bg-white px-4 py-2.5 font-poppins text-sm font-semibold text-cpc-navy-text transition-colors hover:bg-cpc-section-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent disabled:cursor-not-allowed disabled:opacity-60"
      >
        <X className="h-4 w-4" aria-hidden />
        Cancel
      </button>

      <button
        type="submit"
        form={formId}
        disabled={!canSave || saving}
        className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-cpc-navy px-4 py-2.5 font-poppins text-sm font-semibold text-white shadow-[0_4px_14px_rgba(8,45,121,0.22)] transition-colors hover:bg-cpc-navy-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent disabled:cursor-not-allowed disabled:opacity-55"
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
