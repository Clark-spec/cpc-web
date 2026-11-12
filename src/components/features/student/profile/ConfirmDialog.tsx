import { AlertCircle } from "lucide-react";
import { Modal } from "@/components/ui/modal";

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
            className="cpc-btn cpc-btn-secondary"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="cpc-btn bg-rose-600 text-white shadow-[0_8px_20px_rgba(225,29,72,0.22)] hover:bg-rose-700 focus-visible:outline-rose-500"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
