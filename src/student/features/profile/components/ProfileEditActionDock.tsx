import { EditActionBar } from "./EditActionBar";

type ProfileEditActionDockProps = {
  editing: boolean;
  formId: string;
  saving: boolean;
  canSave: boolean;
  onCancel: () => void;
};

/** Mobile / tablet sticky action bar. Desktop actions live in the hero. */
export function ProfileEditActionDock({
  editing,
  formId,
  saving,
  canSave,
  onCancel,
}: ProfileEditActionDockProps) {
  if (!editing) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-cpc-input-border bg-white/95 px-4 py-3 shadow-[0_-8px_24px_rgba(15,36,104,0.12)] backdrop-blur-sm lg:hidden">
      <EditActionBar formId={formId} saving={saving} canSave={canSave} onCancel={onCancel} />
    </div>
  );
}
