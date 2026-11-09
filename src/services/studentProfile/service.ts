/**
 * API / Mock Service layer for the Student Profile feature.
 */

import { mockProfile } from "@/components/features/student/profile/mockProfile";
import { normalizePhone } from "@/components/features/student/profile/schema";
import type {
  CorrectionRequestInput,
  ProfileUpdateInput,
  StudentProfile,
} from "@/components/features/student/profile/types";
import {
  clearStored,
  readStored,
  READ_DELAY,
  shouldFail,
  wait,
  writeStored,
  WRITE_DELAY,
} from "./storage";

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

export async function requestCorrection(input: CorrectionRequestInput): Promise<void> {
  await wait(null, WRITE_DELAY);
  // BACKEND: POST /api/students/:id/correction-requests
  // The registrar reviews the request; the student only sees "sent".
  console.info("[profileService] correction request (mock):", input);
}

export async function resetProfile(): Promise<StudentProfile> {
  clearStored();
  return wait(mockProfile, READ_DELAY);
}

