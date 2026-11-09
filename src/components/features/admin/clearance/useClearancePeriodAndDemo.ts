import { useCallback, type Dispatch, type SetStateAction } from "react";
import { useToast } from "@/components/ui/toast";
import type { AdminUser } from "@/types/admin";
import type { OfficeId } from "@/types/clearance";
import type { ClearancePeriod, ClearanceRequestRow } from "./types";
import {
  resetClearanceDemo,
  sendReminders as sendRemindersService,
  setPeriod as setPeriodService,
  simulateStudentCancel,
  simulateStudentRequest,
} from "@/services/clearanceAdmin";

type ClearancePeriodAndDemoProps = {
  staff: AdminUser;
  homeOffice?: OfficeId | null;
  rows: ClearanceRequestRow[];
  selectedId: string | null;
  setPeriodState: Dispatch<SetStateAction<ClearancePeriod>>;
  setCheckedIds: Dispatch<SetStateAction<string[]>>;
  setSelectedId: (id: string | null) => void;
  setBusy: (busy: boolean) => void;
  markSynced: () => void;
  refreshAdminData: () => Promise<void> | void;
  afterDecision: () => Promise<void>;
};

export function useClearancePeriodAndDemo({
  staff,
  homeOffice,
  rows,
  selectedId,
  setPeriodState,
  setCheckedIds,
  setSelectedId,
  setBusy,
  markSynced,
  refreshAdminData,
  afterDecision,
}: ClearancePeriodAndDemoProps) {
  const { toast } = useToast();

  const updatePeriod = useCallback(
    async (patch: Partial<ClearancePeriod>) => {
      try {
        const next = await setPeriodService(patch);
        setPeriodState(next);
        markSynced();
        void refreshAdminData();
        if (patch.open !== undefined) {
          toast(
            patch.open
              ? "Clearance period is open — students can request signatures."
              : "Clearance period closed — the student request buttons are disabled.",
            patch.open ? "success" : "warning",
          );
        }
      } catch {
        toast("We couldn't update the clearance period.", "error");
      }
    },
    [markSynced, refreshAdminData, setPeriodState, toast],
  );

  const notifyOffices = useCallback(async () => {
    try {
      const count = await sendRemindersService(staff.name);
      markSynced();
      void refreshAdminData();
      toast(
        count === 0
          ? "No offices are holding requests right now."
          : `Reminders sent to ${count} office${count === 1 ? "" : "s"}.`,
        count === 0 ? "info" : "success",
      );
      return count;
    } catch {
      toast("We couldn't send the reminders.", "error");
      return 0;
    }
  }, [markSynced, refreshAdminData, staff.name, toast]);

  const runStudentRequest = useCallback(async () => {
    setBusy(true);
    try {
      const row = await simulateStudentRequest(undefined, homeOffice ?? undefined);
      await afterDecision();
      if (row) {
        setSelectedId(row.id);
        toast(`New request from ${row.studentName} (${row.section})`, "info");
      } else {
        toast("Every office for that student is already signed.", "info");
      }
    } finally {
      setBusy(false);
    }
  }, [afterDecision, homeOffice, setBusy, setSelectedId, toast]);

  const runStudentCancel = useCallback(async () => {
    const target =
      rows.find((row) => row.id === selectedId && row.status === "requested") ??
      rows.find((row) => row.status === "requested");

    if (!target) {
      toast("There is no pending request to cancel.", "warning");
      return;
    }

    setBusy(true);
    try {
      await simulateStudentCancel(target.id);
      await afterDecision();
      setCheckedIds((current) => current.filter((id) => id !== target.id));
      toast(`${target.studentName} cancelled a request.`, "info");
    } finally {
      setBusy(false);
    }
  }, [afterDecision, rows, selectedId, setBusy, setCheckedIds, toast]);

  const resetDemo = useCallback(async () => {
    setBusy(true);
    try {
      await resetClearanceDemo();
      setCheckedIds([]);
      setSelectedId(null);
      await afterDecision();
      toast("Demo clearance data reset.", "success");
    } finally {
      setBusy(false);
    }
  }, [afterDecision, setBusy, setCheckedIds, setSelectedId, toast]);

  return {
    updatePeriod,
    notifyOffices,
    runStudentRequest,
    runStudentCancel,
    resetDemo,
  };
}

