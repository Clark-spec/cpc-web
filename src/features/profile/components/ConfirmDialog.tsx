import { AlertCircle } from "lucide-react";
import { Modal } from "./Modal";

type ConfirmDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
};

/** Small confirmation dialog used by Cancel and the in-app navigation guard. */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Discard changes",
  cancelLabel = "Keep editing",
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} labelledBy="profile-confirm-title">
      <div className="p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600">
            <AlertCircle className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <h2
              id="profile-confirm-title"
              className="font-poppins text-lg leading-tight font-bold text-cpc-navy-text"
            >
              {title}
            </h2>
            <p className="mt-2 font-poppins text-sm leading-relaxed text-cpc-heading-soft">
              {description}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-cpc-tile-border bg-white px-4 py-2.5 font-poppins text-sm font-semibold text-cpc-navy-text transition-colors hover:bg-cpc-section-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex cursor-pointer items-center justify-center rounded-lg bg-rose-600 px-4 py-2.5 font-poppins text-sm font-semibold text-white transition-colors hover:bg-rose-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
