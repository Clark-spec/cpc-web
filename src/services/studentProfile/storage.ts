/**
 * Storage and mock network simulation for student profile.
 */

import { PROFILE_STORAGE_KEY } from "@/components/features/student/profile/mockProfile";
import type { StudentProfile } from "@/components/features/student/profile/types";

/** Simulated network latency (ms). */
export const READ_DELAY = 800;
export const WRITE_DELAY = 1000;

export function wait<T>(value: T, ms: number): Promise<T> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(value), ms);
  });
}

/**
 * Demo failure switch:
 *   ?fail=1 or ?fail=save  -> saving fails
 *   ?fail=load             -> initial load fails
 */
export function shouldFail(scope: "load" | "save"): boolean {
  if (typeof window === "undefined") return false;
  const mode = new URLSearchParams(window.location.search).get("fail");
  if (!mode) return false;
  if (mode === "load") return scope === "load";
  if (mode === "1" || mode === "save") return scope === "save";
  return false;
}

export function readStored(): StudentProfile | null {
  try {
    const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StudentProfile;
  } catch {
    return null;
  }
}

export function writeStored(profile: StudentProfile): void {
  try {
    window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // Ignore storage failures (private mode / quota exceeded).
  }
}

export function clearStored(): void {
  try {
    window.localStorage.removeItem(PROFILE_STORAGE_KEY);
  } catch {
    // Ignore storage failures.
  }
}

