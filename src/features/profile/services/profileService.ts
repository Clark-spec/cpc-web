import { mockProfile, PROFILE_STORAGE_KEY } from "../data/mockProfile";
import { normalizePhone } from "../schema";
import type { CorrectionRequestInput, ProfileUpdateInput, StudentProfile } from "../types";

/**
 * Mock API layer for the Student Profile feature.
 *
 * Every read/write goes through this module so the UI never touches
 * localStorage directly. Replace each function body with a `fetch` call when
 * the real API lands:
 *
 *   GET    /api/students/:id/profile
 *   PATCH  /api/students/:id/profile
 *   POST   /api/students/:id/avatar
 *   POST   /api/students/:id/correction-requests  (registrar approval flow)
 *
 * The correction request is intentionally fire-and-forget here: the registrar
 * side is out of scope, so we only record that the student sent it.
 */

/** Simulated network latency (ms). */
const READ_DELAY = 800;
const WRITE_DELAY = 1000;

export const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
export const ALLOWED_AVATAR_TYPES = ["image/png", "image/jpeg"] as const;

function wait<T>(value: T, ms: number): Promise<T> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(value), ms);
  });
}

/**
 * Demo failure switch:
 *   ?fail=1 or ?fail=save  -> saving fails
 *   ?fail=load             -> initial load fails
 */
function shouldFail(scope: "load" | "save"): boolean {
  if (typeof window === "undefined") return false;
  const mode = new URLSearchParams(window.location.search).get("fail");
  if (!mode) return false;
  if (mode === "load") return scope === "load";
  if (mode === "1" || mode === "save") return scope === "save";
  return false;
}

function readStored(): StudentProfile | null {
  try {
    const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StudentProfile;
  } catch {
    return null;
  }
}

function writeStored(profile: StudentProfile): void {
  try {
    window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // Ignore storage failures (private mode / quota exceeded).
  }
}

export async function getProfile(): Promise<StudentProfile> {
  await wait(null, READ_DELAY);
  if (shouldFail("load")) {
    throw new Error("We couldn't load your profile right now. Please try again.");
  }
  return readStored() ?? mockProfile;
}

export async function updateProfile(patch: ProfileUpdateInput): Promise<StudentProfile> {
  await wait(null, WRITE_DELAY);
  if (shouldFail("save")) {
    throw new Error("We couldn't save your changes. Please try again.");
  }

  const current = readStored() ?? mockProfile;
  const next: StudentProfile = {
    ...current,
    ...patch,
    phone: normalizePhone(patch.phone ?? current.phone),
    alternateContact:
      patch.alternateContact === undefined
        ? current.alternateContact
        : patch.alternateContact
          ? normalizePhone(patch.alternateContact)
          : "",
    guardianContact:
      patch.guardianContact === undefined
        ? current.guardianContact
        : patch.guardianContact
          ? normalizePhone(patch.guardianContact)
          : "",
    updatedAt: new Date().toISOString(),
  };

  writeStored(next);
  return next;
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("We couldn't read that image. Try another file."));
    };
    image.src = objectUrl;
  });
}

/** Center-crops the photo to a square and downsizes it to 256px. */
async function cropToSquareDataUrl(file: File, size = 256): Promise<string> {
  const image = await loadImage(file);
  const side = Math.min(image.naturalWidth, image.naturalHeight);
  const sourceX = (image.naturalWidth - side) / 2;
  const sourceY = (image.naturalHeight - side) / 2;

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Your browser can't process images right now.");

  context.drawImage(image, sourceX, sourceY, side, side, 0, 0, size, size);
  return canvas.toDataURL("image/jpeg", 0.9);
}

/** Validates, crops and returns the avatar as a base64 data URL. */
export async function uploadAvatar(file: File): Promise<string> {
  if (!ALLOWED_AVATAR_TYPES.includes(file.type as (typeof ALLOWED_AVATAR_TYPES)[number])) {
    throw new Error("Choose a PNG or JPG image.");
  }
  if (file.size > MAX_AVATAR_BYTES) {
    throw new Error("Your photo must be 2 MB or smaller.");
  }
  return cropToSquareDataUrl(file);
}

export async function requestCorrection(input: CorrectionRequestInput): Promise<void> {
  await wait(null, WRITE_DELAY);
  // BACKEND: POST /api/students/:id/correction-requests
  // The registrar reviews the request; the student only sees "sent".
  console.info("[profileService] correction request (mock):", input);
}

export async function resetProfile(): Promise<StudentProfile> {
  try {
    window.localStorage.removeItem(PROFILE_STORAGE_KEY);
  } catch {
    // Ignore storage failures.
  }
  return wait(mockProfile, READ_DELAY);
}
