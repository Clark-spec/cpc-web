import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  /** id of the element that names the dialog. */
  labelledBy: string;
  children: ReactNode;
  className?: string;
};

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Accessible modal: ESC to close, focus trapped inside, focus restored to the
 * trigger on close, body scroll locked while open. Shared by every feature so
 * dialogs behave the same across the portal.
 */
export function Modal({ open, onClose, labelledBy, children, className }: ModalProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  // Keep the latest callback without re-running the effect on every render.
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;

    previouslyFocused.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const panel = panelRef.current;
    const focusables = (): HTMLElement[] =>
      Array.from(panel?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []).filter(
        (element) => element.offsetParent !== null,
      );

    // Move focus into the dialog (the first control, or the panel itself).
    const first = focusables()[0];
    if (first) {
      first.focus();
    } else {
      panel?.focus();
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;

      const list = focusables();
      if (list.length === 0) {
        event.preventDefault();
        return;
      }
      const firstEl = list[0];
      const lastEl = list[list.length - 1];

      if (event.shiftKey && document.activeElement === firstEl) {
        event.preventDefault();
        lastEl.focus();
      } else if (!event.shiftKey && document.activeElement === lastEl) {
        event.preventDefault();
        firstEl.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused.current?.focus();
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-cpc-navy-deep/60 p-0 backdrop-blur-sm print:hidden sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        className={cn(
          "relative max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white shadow-[0_24px_80px_rgba(15,36,104,0.35)] outline-none sm:max-w-lg sm:rounded-2xl",
          className,
        )}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-3 right-3 z-20 rounded-full p-1.5 text-cpc-heading-soft transition-colors hover:bg-cpc-section-light hover:text-cpc-navy-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cpc-blue-accent"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
        {children}
      </div>
    </div>,
    document.body,
  );
}
