import type { ProfileFormState } from "@/components/features/student/profile/useProfileForm";
import type { useUnsavedChangesGuard } from "@/components/features/student/profile/useUnsavedChangesGuard";
import { ConfirmDialog } from "@/components/features/student/profile/ConfirmDialog";
import { RequestCorrectionModal } from "@/components/features/student/profile/RequestCorrectionModal";

type ProfileDialogsProps = {
  form: ProfileFormState;
  blocker: ReturnType<typeof useUnsavedChangesGuard>;
  correctionField: string | null;
  onCloseCorrection: () => void;
};

/** Discard-edits prompt, in-app navigation guard, and the correction request form. */
export function ProfileDialogs({
  form,
  blocker,
  correctionField,
  onCloseCorrection,
}: ProfileDialogsProps) {
  return (
    <>
      {/* Cancel with unsaved edits. */}
      <ConfirmDialog
        open={form.confirmOpen}
        onClose={() => form.setConfirmOpen(false)}
        onConfirm={form.confirmDiscard}
        title="Discard your changes?"
        description="Your edits haven't been saved yet. Discard them and return to view mode?"
      />

      {/* In-app navigation guard (React Router blocker). */}
      <ConfirmDialog
        open={blocker.state === "blocked"}
        onClose={() => blocker.reset?.()}
        onConfirm={() => blocker.proceed?.()}
        title="Leave without saving?"
        description="You have unsaved profile changes. If you leave this page now, your edits will be lost."
        confirmLabel="Leave page"
        cancelLabel="Stay on page"
      />

      <RequestCorrectionModal
        open={correctionField !== null}
        onClose={onCloseCorrection}
        fieldLabel={correctionField ?? ""}
      />
    </>
  );
}
