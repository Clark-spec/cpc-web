import { ApiError, apiClient } from "@/lib/apiClient";
import { getCsrfToken } from "@/services/auth";
import type { ClearanceRecord, OfficeId } from "@/types/clearance";

type Envelope<T> = { message?: string; data?: T };
export async function loadMyClearanceRecord(): Promise<ClearanceRecord> {
  const response = await apiClient.get<Envelope<{ record: ClearanceRecord }>>("/enrollment/v1/clearance/mine");
  if (!response.data.data?.record) throw new ApiError(response.data.message || "Clearance record was not found.");
  return response.data.data.record;
}
export async function updateMyClearance(action: "request" | "cancel", office: OfficeId, note?: string): Promise<ClearanceRecord> {
  const csrf = await getCsrfToken();
  const response = await apiClient.post<Envelope<{ record: ClearanceRecord }>>("/enrollment/v1/clearance/mine/action", { action, office, note }, { headers: { "x-csrf-token": csrf } });
  if (!response.data.data?.record) throw new ApiError(response.data.message || "Clearance update could not be saved.");
  return response.data.data.record;
}
