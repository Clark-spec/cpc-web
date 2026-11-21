import { useCallback, type Dispatch, type SetStateAction } from "react";
import { useToast } from "@/components/ui/toast";
import type { ClearancePeriod } from "./types";
import { setPeriod as setPeriodService } from "@/services/clearanceAdmin";

type ClearancePeriodAndDemoProps = {
  setPeriodState: Dispatch<SetStateAction<ClearancePeriod>>;
  markSynced: () => void;
  refreshAdminData: () => Promise<void> | void;
};

export function useClearancePeriodAndDemo({
  setPeriodState,
  markSynced,
  refreshAdminData,
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

  return { updatePeriod };
}

