import { ApiError, apiClient } from "@/lib/apiClient";
import { getCsrfToken } from "@/services/auth";
import { ensureAdminSession, readAdminRole } from "@/services/complaints/admin-session";

export type SignatureQueueType = "study_load" | "office_signatures";
export type QueueNumber = { queueNumber: number; queueDate: string; awaitingPayment?: boolean };
export type SignatureBoardOffice = {
  office: string;
  nowServing: QueueNumber | null;
  startedAt: string | null;
  next: QueueNumber[];
};
export type SignatureBoards = {
  studyLoad: SignatureBoardOffice[];
  officeSignatures: SignatureBoardOffice[];
  updatedAt: string;
};
type Envelope<T> = { message?: string; data?: T };

export async function getSignatureBoards(): Promise<SignatureBoards> {
  const response = await apiClient.get<Envelope<SignatureBoards>>("/enrollment/v1/signature-boards");
  if (!response.data.data) throw new ApiError(response.data.message || "The live signature boards could not be loaded.");
  return response.data.data;
}

async function staffPost<T>(path: string, body: unknown): Promise<T> {
  const token = await ensureAdminSession(readAdminRole());
  const csrf = await getCsrfToken();
  const response = await apiClient.post<Envelope<T>>(path, body, {
    headers: { Authorization: `Bearer ${token}`, "x-csrf-token": csrf },
    skipAuthRefresh: true,
  });
  if (!response.data.data) throw new ApiError(response.data.message || "The signature queue could not be updated.");
  return response.data.data;
}

export function startSignatureQueue(input: { queueType: SignatureQueueType; office: string; studentId: string; feePaidConfirmed?: boolean }) {
  return staffPost("/enrollment/v1/signature-boards/start", input);
}

export function finishSignatureQueue(input: { queueType: SignatureQueueType; office: string; studentId: string }) {
  return staffPost("/enrollment/v1/signature-boards/finish", input);
}
