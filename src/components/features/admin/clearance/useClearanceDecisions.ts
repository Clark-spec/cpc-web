import { useCallback, useState } from "react";
import { useToast } from "@/components/ui/toast";
import type { AdminUser } from "@/types/admin";
import type {
  ApproveInput,
  ClearanceRequestRow,
} from "./types";
import {
  approveRequest,
  bulkApprove as bulkApproveService,
  bulkReject as bulkRejectService,
  rejectRequest,
  revokeRequest,
  undoDecision,
  type DecisionSnapshot,
} from "@/services/clearanceAdmin";
import { OFFICE_LABELS } from "./officeChecks";
import { useUndoAction } from "./useUndoAction";

type ClearanceDecisionsProps = {
  staff: AdminUser;
  isSuperAdmin: boolean;
  rows: ClearanceRequestRow[];
  visibleRows: ClearanceRequestRow[];
  checkedIds: string[];
  clearChecked: () => void;
  setSelectedId: (id: string | null) => void;
  load: (mode: "initial" | "refresh" | "silent") => Promise<void>;
  markSynced: () => void;
  refreshAdminData: () => Promise<void> | void;
};

export function useClearanceDecisions({
  staff,
  isSuperAdmin,
  rows,
  visibleRows,
  checkedIds,
  clearChecked,
  setSelectedId,
  load,
  markSynced,
  refreshAdminData,
}: ClearanceDecisionsProps) {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const armUndo = useUndoAction();

  const afterDecision = useCallback(async () => {
    await load("silent");
    markSynced();
    void refreshAdminData();
  }, [load, markSynced, refreshAdminData]);

  const revert = useCallback(
    async (snapshots: DecisionSnapshot[]) => {
      await undoDecision(snapshots);
      await afterDecision();
    },
    [afterDecision],
  );

  const advancePending = useCallback(
    (fromId: string) => {
      const pending = visibleRows.filter((row) => row.status === "requested");
      const index = pending.findIndex((row) => row.id === fromId);
      const next = pending[index + 1] ?? pending.find((row) => row.id !== fromId);
      setSelectedId(next ? next.id : fromId);
    },
    [setSelectedId, visibleRows],
  );

  const approve = useCallback(
    async (row: ClearanceRequestRow, input: ApproveInput) => {
      setBusy(true);
      try {
        const outcome = await approveRequest(row.id, {
          ...input,
          signerName: staff.name,
          staffId: staff.id,
        });
        if (outcome.snapshots.length === 0) {
          toast("That request has already been handled.", "warning");
          await load("silent");
          return false;
        }

        await afterDecision();
        armUndo({
          message: `Signed ${row.studentName} · ${OFFICE_LABELS[row.office]}`,
          snapshots: outcome.snapshots,
          revert,
        });
        advancePending(row.id);
        return true;
      } catch {
        toast("We couldn't record the signature. Please try again.", "error");
        return false;
      } finally {
        setBusy(false);
      }
    },
    [
      advancePending,
      afterDecision,
      armUndo,
      load,
      revert,
      staff.id,
      staff.name,
      toast,
    ],
  );

  const reject = useCallback(
    async (row: ClearanceRequestRow, remarks: string) => {
      setBusy(true);
      try {
        const outcome = await rejectRequest(row.id, { remarks, signerName: staff.name });
        if (outcome.snapshots.length === 0) {
          toast("That request has already been handled.", "warning");
          await load("silent");
          return false;
        }

        await afterDecision();
        armUndo({
          message: `Returned ${row.studentName}'s request`,
          snapshots: outcome.snapshots,
          revert,
        });
        return true;
      } catch {
        toast("We couldn't send that back to the student. Please try again.", "error");
        return false;
      } finally {
        setBusy(false);
      }
    },
    [afterDecision, armUndo, load, revert, staff.name, toast],
  );

  const revoke = useCallback(
    async (row: ClearanceRequestRow, reason: string) => {
      if (!isSuperAdmin) {
        toast("Only an administrator can revoke a completed signature.", "warning");
        return false;
      }

      setBusy(true);
      try {
        const outcome = await revokeRequest(row.id, { reason, actorName: staff.name });
        if (outcome.snapshots.length === 0) {
          toast("That request is not signed yet.", "warning");
          await load("silent");
          return false;
        }

        await afterDecision();
        armUndo({
          message: `Revoked the ${OFFICE_LABELS[row.office]} signature`,
          snapshots: outcome.snapshots,
          revert,
        });
        return true;
      } catch {
        toast("We couldn't revoke that signature. Please try again.", "error");
        return false;
      } finally {
        setBusy(false);
      }
    },
    [afterDecision, armUndo, isSuperAdmin, load, revert, staff.name, toast],
  );

  const requestableChecked = useCallback(
    () =>
      checkedIds.filter((id) => rows.some((row) => row.id === id && row.status === "requested")),
    [checkedIds, rows],
  );

  const bulkApproveChecked = useCallback(
    async (signatureId: string) => {
      const ids = requestableChecked();
      if (ids.length === 0) {
        toast("Nothing selected is waiting for a signature.", "warning");
        return false;
      }

      setBusy(true);
      try {
        const outcome = await bulkApproveService(ids, {
          signatureId,
          staffId: staff.id,
          signerName: staff.name,
        });
        if (outcome.snapshots.length === 0) {
          toast("Pick one of your saved signatures first.", "warning");
          return false;
        }

        await afterDecision();
        clearChecked();
        armUndo({
          message: `Signed ${outcome.snapshots.length} request${
            outcome.snapshots.length === 1 ? "" : "s"
          }`,
          snapshots: outcome.snapshots,
          revert,
        });
        return true;
      } catch {
        toast("The batch didn't go through. Please try again.", "error");
        return false;
      } finally {
        setBusy(false);
      }
    },
    [
      afterDecision,
      armUndo,
      clearChecked,
      requestableChecked,
      revert,
      staff.id,
      staff.name,
      toast,
    ],
  );

  const bulkRejectChecked = useCallback(
    async (remarks: string) => {
      const ids = requestableChecked();
      if (ids.length === 0) {
        toast("Select at least one pending request.", "warning");
        return false;
      }

      setBusy(true);
      try {
        const outcome = await bulkRejectService(ids, { remarks, signerName: staff.name });
        await afterDecision();
        clearChecked();
        armUndo({
          message: `Returned ${outcome.snapshots.length} request${
            outcome.snapshots.length === 1 ? "" : "s"
          }`,
          snapshots: outcome.snapshots,
          revert,
        });
        return true;
      } catch {
        toast("The batch didn't go through. Please try again.", "error");
        return false;
      } finally {
        setBusy(false);
      }
    },
    [afterDecision, armUndo, clearChecked, requestableChecked, revert, staff.name, toast],
  );

  return {
    busy,
    setBusy,
    afterDecision,
    approve,
    reject,
    revoke,
    bulkApproveChecked,
    bulkRejectChecked,
  };
}

