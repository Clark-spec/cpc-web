/**
 * Student Profile service — real API implementation.
 *
 * All reads/writes go through the CPC backend at:
 *   GET   /api/students/v1/profile
 *   PATCH /api/students/v1/profile
 *   POST  /api/students/v1/profile/avatar
 */

import { apiClient } from "@/lib/apiClient";
import { getCsrfToken } from "@/services/auth";
import { normalizePhone } from "@/components/features/student/profile/schema";
import type {
  CorrectionRequestInput,
  ProfileUpdateInput,
  StudentProfile,
} from "@/components/features/student/profile/types";

// ── Shape mapper ─────────────────────────────────────────────────────────────

function yearLevelLabel(level: number | string | undefined | null): string {
  const n = Number(level);
  if (Number.isNaN(n) || n < 1) return String(level ?? "");
  const suffixes = ["", "1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year"];
  return suffixes[n] ?? `${n}th Year`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapProfile(raw: any): StudentProfile {
  return {
    studentId: raw?.studentNumber ?? raw?.studentId ?? "",
    fullName: raw?.fullName ?? raw?.name ?? "",
    program: raw?.program ?? raw?.course ?? "",
    yearLevel: raw?.yearLevelLabel ?? yearLevelLabel(raw?.yearLevel),
    section: raw?.section ?? "",
    enrollmentStatus: raw?.enrollmentStatus ?? "Not Enrolled",
    avatarUrl: raw?.avatarUrl ?? undefined,
    email: raw?.email ?? "",
    phone: raw?.phone ?? "",
    alternateContact: raw?.alternateContact ?? "",
    address: {
      street: raw?.street ?? raw?.address?.street ?? "",
      barangay: raw?.barangay ?? raw?.address?.barangay ?? "",
      city: raw?.city ?? raw?.address?.city ?? "",
      province: raw?.province ?? raw?.address?.province ?? "",
    },
    gender: raw?.gender ?? "",
    dateOfBirth: raw?.dateOfBirth ?? "",
    placeOfBirth: raw?.placeOfBirth ?? "",
    civilStatus: raw?.civilStatus ?? "",
    religion: raw?.religion ?? "",
    nationality: raw?.nationality ?? "",
    motherName: raw?.motherName ?? "",
    fatherName: raw?.fatherName ?? "",
    guardianName: raw?.guardianName ?? "",
    guardianContact: raw?.guardianContact ?? "",
    updatedAt: raw?.updatedAt ?? new Date().toISOString(),
  };
}

// ── Public API ───────────────────────────────────────────────────────────────

export async function getProfile(): Promise<StudentProfile> {
  const response = await apiClient.get("/students/v1/profile");
  return mapProfile(response.data?.data?.profile);
}

export async function updateProfile(patch: ProfileUpdateInput): Promise<StudentProfile> {
  const csrf = await getCsrfToken();

  // Normalise phone numbers before sending.
  const body: ProfileUpdateInput = {
    ...patch,
    phone: patch.phone !== undefined ? normalizePhone(patch.phone) : undefined,
    alternateContact:
      patch.alternateContact !== undefined
        ? patch.alternateContact
          ? normalizePhone(patch.alternateContact)
          : ""
        : undefined,
    guardianContact:
      patch.guardianContact !== undefined
        ? patch.guardianContact
          ? normalizePhone(patch.guardianContact)
          : ""
        : undefined,
  };

  const response = await apiClient.patch("/students/v1/profile", body, {
    headers: { "x-csrf-token": csrf },
  });
  return mapProfile(response.data?.data?.profile);
}

export async function requestCorrection(input: CorrectionRequestInput): Promise<void> {
  // Backend endpoint for correction requests is planned but not yet implemented.
  // Log it for now; the registrar will handle it out-of-band.
  console.info("[profileService] correction request submitted:", input);
}

/** Re-fetch from the server (replaces the old localStorage reset). */
export async function resetProfile(): Promise<StudentProfile> {
  return getProfile();
}
