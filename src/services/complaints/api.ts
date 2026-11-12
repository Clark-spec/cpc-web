import { apiClient, ApiError } from "@/lib/apiClient";
import { getCsrfToken } from "@/services/auth";
import type {
  ComplaintStatus,
  ComplaintSubmitInput,
  MyComplaintsResponse,
  StudentComplaint,
} from "./types";

/*
 * Student complaint contract:
 *   GET  /complaints/v1/me  → own complaints + cooldown state
 *   POST /complaints/v1/    → submit (72-hour rolling limit enforced server-side)
 */

type ApiEnvelope<T> = {
  code: number;
  status: string;
  message?: string;
  data?: T;
};

function normalizeStatus(value: unknown): ComplaintStatus {
  return value === "in_review" || value === "resolved" ? value : "pending";
}

function normalizeComplaint(raw: any): StudentComplaint {
  return {
    id: String(raw?.id ?? ""),
    referenceNumber: String(raw?.referenceNumber ?? ""),
    subject: String(raw?.subject ?? ""),
    category: String(raw?.category ?? ""),
    description: String(raw?.description ?? ""),
    filedAt: String(raw?.filedAt ?? ""),
    updatedAt: String(raw?.updatedAt ?? raw?.filedAt ?? ""),
    status: normalizeStatus(raw?.status),
    anonymous: raw?.anonymous === true,
    attachmentName: raw?.attachmentName ?? null,
    adminRemarks: String(raw?.adminRemarks ?? ""),
  };
}

export async function getMyComplaints(): Promise<MyComplaintsResponse> {
  const response = await apiClient.get<ApiEnvelope<MyComplaintsResponse>>(
    "/complaints/v1/me",
  );
  const data = response.data?.data;
  if (!data) throw new ApiError("Could not load your complaints.");

  return {
    complaints: (data.complaints ?? []).map(normalizeComplaint),
    canSubmit: data.canSubmit !== false,
    nextAllowedAt: data.nextAllowedAt ?? null,
    cooldownHours: Number(data.cooldownHours) || 72,
    serverTime: data.serverTime ?? new Date().toISOString(),
  };
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new ApiError("Could not read the attachment."));
    reader.readAsDataURL(file);
  });
}

export async function submitComplaint(
  values: ComplaintSubmitInput,
): Promise<StudentComplaint> {
  const attachment = values.attachment
    ? {
        name: values.attachment.name,
        type: values.attachment.type,
        size: values.attachment.size,
        data: await fileToDataUrl(values.attachment),
      }
    : null;

  const csrf = await getCsrfToken();
  const response = await apiClient.post<ApiEnvelope<{ complaint: any }>>(
    "/complaints/v1/",
    {
      subject: values.subject,
      category: values.category,
      description: values.description,
      isAnonymous: values.isAnonymous,
      attachment,
    },
    { headers: { "x-csrf-token": csrf } },
  );

  const complaint = response.data?.data?.complaint;
  if (!complaint) throw new ApiError("Complaint was not created.");
  return normalizeComplaint(complaint);
}
