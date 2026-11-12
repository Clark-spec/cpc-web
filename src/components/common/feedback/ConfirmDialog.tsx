import type { ReactNode } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/cn";

type ConfirmDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  busy?: boolean;
  /** id used by the dialog's aria-labelledby. */
  id?: string;
};

/** Small confirmation dialog reused for logout, reset and bulk approve. */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
  busy = false,
  id = "admin-confirm-title",
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} labelledBy={id} className="sm:max-w-md">
      <div className="p-6">
        <div className="flex items-start gap-3">
          <span
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
              danger ? "bg-rose-50 text-rose-600" : "bg-cpc-section-light text-cpc-blue-accent",
            )}
            aria-hidden
          >
            <AlertTriangle className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h2 id={id} className="font-poppins text-lg font-semibold text-cpc-navy-text">
              {title}
            </h2>
            <div className="mt-1.5 font-poppins text-sm leading-relaxed text-cpc-heading-soft">
              {description}
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="cpc-btn cpc-btn-secondary cpc-btn-sm"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={cn(
              "cpc-btn cpc-btn-sm",
              danger
                ? "bg-rose-600 text-white hover:bg-rose-700 focus-visible:outline-rose-600"
                : "cpc-btn-primary",
            )}
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
