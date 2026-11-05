import { useCallback, useEffect, useRef } from "react";
import { useToast } from "@/components/ui/toast";
import type { DecisionSnapshot } from "../services/clearanceAdminService";

/** The spec gives staff 8 seconds to change their mind about a signature. */
const UNDO_WINDOW_MS = 8000;

export type UndoableDecision = {
  /** Toast copy, e.g. "Signed for Harry Styles". */
  message: string;
  snapshots: DecisionSnapshot[];
  /** Restores the snapshots and refreshes the queue. */
  revert: (snapshots: DecisionSnapshot[]) => Promise<void>;
};

/**
 * Single-slot Undo: only the most recent decision can be reverted.
 *
 * An older Undo button may still be on screen (toasts stack), so each arming
 * takes a token and a stale token is ignored instead of replaying an old
 * snapshot onto data that has moved on.
 */
export function useUndoAction(): (decision: UndoableDecision) => void {
  const { toast } = useToast();
  const pending = useRef<UndoableDecision | null>(null);

  useEffect(() => {
    return () => {
      pending.current = null;
    };
  }, []);

  return useCallback(
    (decision: UndoableDecision) => {
      pending.current = decision;

      toast(decision.message, "success", {
        label: "Undo",
        durationMs: UNDO_WINDOW_MS,
        onClick: () => {
          if (pending.current !== decision) {
            toast("That Undo window has closed.", "info");
            return;
          }
          pending.current = null;
          void decision
            .revert(decision.snapshots)
            .then(() => toast("Decision reverted. The request is back in your queue.", "info"))
            .catch(() => toast("We couldn't undo that decision. Please refresh.", "error"));
        },
      });
    },
    [toast],
  );
}
