import { useMemo } from "react";
import { useClearance } from "../context/ClearanceContext";

export type ClearanceProgress = {
  total: number;
  /** Offices whose signature has been received. */
  signed: number;
  /** Everything not signed yet (requested, not requested or rejected). */
  pending: number;
  /** 0–100, rounded from signed / total. */
  percent: number;
  isCleared: boolean;
};

/** Single source of truth for the status card counters and progress bar. */
export function useClearanceProgress(): ClearanceProgress {
  const { offices, isCleared } = useClearance();

  return useMemo(() => {
    const total = offices.length;
    const signed = offices.filter((office) => office.status === "signed").length;
    const pending = total - signed;
    const percent = total === 0 ? 0 : Math.round((signed / total) * 100);

    return { total, signed, pending, percent, isCleared };
  }, [offices, isCleared]);
}
