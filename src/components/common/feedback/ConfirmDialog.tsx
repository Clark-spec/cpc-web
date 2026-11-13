import type { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { ActionButton, type ActionStatus } from "@/components/ui/action-button";
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
  /** Drives the confirm button's idle → loading → success/error animation. */
  confirmStatus?: ActionStatus;
  loadingLabel?: string;
  successLabel?: string;
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
  confirmStatus,
  loadingLabel = "Working…",
  successLabel = "Done",
  id = "admin-confirm-title",
}: ConfirmDialogProps) {
  const status: ActionStatus = confirmStatus ?? (busy ? "loading" : "idle");
  const locked = status === "loading" || status === "success";

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
            disabled={locked}
            className="cpc-btn cpc-btn-secondary cpc-btn-sm"
          >
            {cancelLabel}
          </button>
          <ActionButton
            status={status}
            onClick={onConfirm}
            disabled={busy}
            loadingLabel={loadingLabel}
            successLabel={successLabel}
            errorLabel="Try again"
            className={cn(
              "cpc-btn-sm",
              danger &&
                "bg-rose-600! text-white! shadow-[0_8px_20px_rgba(225,29,72,0.22)] hover:bg-rose-700! focus-visible:outline-rose-500",
            )}
          >
            {confirmLabel}
          </ActionButton>
        </div>
      </div>
    </Modal>
  );
}
