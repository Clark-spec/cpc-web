import { useCallback, useEffect, useRef } from "react";
import { useToast } from "@/components/ui/toast";

/** Deletes, publishes and version restores all get the same 8-second window. */
const UNDO_WINDOW_MS = 8000;

export type UndoableStep = {
  /** Toast copy, e.g. "Removed NET 2 from BSIT-3A". */
  message: string;
  tone?: "success" | "info" | "warning";
  /** Restores the store to what it was before the step. */
  revert: () => Promise<void>;
};

/**
 * Single-slot Undo: only the most recent step can be reverted.
 *
 * Toasts stack, so an older Undo button may still be on screen. Each arming
 * keeps its own token and a stale token says "that window has closed" instead
 * of replaying an old snapshot onto data that has already moved on.
 */
export function useUndoAction(): (step: UndoableStep) => void {
  const { toast } = useToast();
  const pending = useRef<UndoableStep | null>(null);

  useEffect(() => {
    return () => {
      pending.current = null;
    };
  }, []);

  return useCallback(
    (step: UndoableStep) => {
      pending.current = step;

      toast(step.message, step.tone ?? "success", {
        label: "Undo",
        durationMs: UNDO_WINDOW_MS,
        onClick: () => {
          if (pending.current !== step) {
            toast("That Undo window has closed.", "info");
            return;
          }
          pending.current = null;
          void step
            .revert()
            .then(() => toast("Change undone.", "info"))
            .catch(() => toast("We couldn't undo that. Please refresh.", "error"));
        },
      });
    },
    [toast],
  );
}
