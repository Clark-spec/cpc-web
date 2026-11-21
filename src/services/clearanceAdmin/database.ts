import { ApiError, apiClient } from "@/lib/apiClient";
import { getCsrfToken } from "@/services/auth";
import { ensureAdminSession, readAdminRole } from "@/services/complaints/admin-session";
import type { ClearanceRecord, OfficeId, SavedSignature } from "@/types/clearance";
import type { NewSignatureInput } from "@/components/features/admin/clearance/types";
type Envelope<T> = { message?: string; data?: T };
async function withStaff<T>(fn: (token: string) => Promise<T>): Promise<T> {
  const token = await ensureAdminSession(readAdminRole());
  return fn(token);
}
export async function getClearanceRecordsFromDatabase(): Promise<ClearanceRecord[]> {
  return withStaff(async (token) => {
    const response = await apiClient.get<Envelope<{ records: ClearanceRecord[] }>>("/enrollment/v1/clearance/records", { headers: { Authorization: `Bearer ${token}` }, skipAuthRefresh: true });
    return response.data.data?.records ?? [];
  });
}
export async function saveClearanceDecision(studentId: string, office: OfficeId, values: { action: "sign" | "reject" | "revoke"; signerName?: string; signatureImage?: string; remarks?: string }): Promise<ClearanceRecord> {
  return withStaff(async (token) => {
    const csrf = await getCsrfToken();
    const response = await apiClient.post<Envelope<{ record: ClearanceRecord }>>(`/enrollment/v1/clearance/records/${encodeURIComponent(studentId)}/action`, { office, ...values }, { headers: { Authorization: `Bearer ${token}`, "x-csrf-token": csrf }, skipAuthRefresh: true });
    if (!response.data.data?.record) throw new ApiError(response.data.message || "Clearance decision could not be saved.");
    return response.data.data.record;
  });
}

type SignatureEnvelope = Envelope<{ signatures: SavedSignature[] }>;

export async function getSavedSignaturesFromDatabase(): Promise<SavedSignature[]> {
  return withStaff(async (token) => {
    const response = await apiClient.get<SignatureEnvelope>("/enrollment/v1/signatures", {
      headers: { Authorization: `Bearer ${token}` },
      skipAuthRefresh: true,
    });
    return response.data.data?.signatures ?? [];
  });
}

export async function createSavedSignatureInDatabase(input: NewSignatureInput): Promise<SavedSignature[]> {
  return withStaff(async (token) => {
    const csrf = await getCsrfToken();
    const response = await apiClient.post<SignatureEnvelope>("/enrollment/v1/signatures", input, {
      headers: { Authorization: `Bearer ${token}`, "x-csrf-token": csrf },
      skipAuthRefresh: true,
    });
    if (!response.data.data?.signatures) throw new ApiError(response.data.message || "Saved signature could not be stored.");
    return response.data.data.signatures;
  });
}

export async function updateSavedSignatureInDatabase(id: string, patch: Partial<Pick<SavedSignature, "label" | "isDefault">>): Promise<SavedSignature[]> {
  return withStaff(async (token) => {
    const csrf = await getCsrfToken();
    const response = await apiClient.patch<SignatureEnvelope>(`/enrollment/v1/signatures/${encodeURIComponent(id)}`, patch, {
      headers: { Authorization: `Bearer ${token}`, "x-csrf-token": csrf },
      skipAuthRefresh: true,
    });
    if (!response.data.data?.signatures) throw new ApiError(response.data.message || "Saved signature could not be updated.");
    return response.data.data.signatures;
  });
}

export async function deleteSavedSignatureFromDatabase(id: string): Promise<SavedSignature[]> {
  return withStaff(async (token) => {
    const csrf = await getCsrfToken();
    const response = await apiClient.delete<SignatureEnvelope>(`/enrollment/v1/signatures/${encodeURIComponent(id)}`, {
      headers: { Authorization: `Bearer ${token}`, "x-csrf-token": csrf },
      skipAuthRefresh: true,
    });
    if (!response.data.data?.signatures) throw new ApiError(response.data.message || "Saved signature could not be deleted.");
    return response.data.data.signatures;
  });
}
