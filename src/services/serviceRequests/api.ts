/**
 * HTTP implementation of the Service Requests data source.
 *
 * Contract (relative to `VITE_API_BASE_URL`):
 *   GET    /service-requests/v1/catalog
 *   GET    /service-requests/v1/
 *   POST   /service-requests/v1/          (JSON body)
 *   GET    /service-requests/v1/:id
 *   GET    /service-requests/v1/:id/document (binary)
 *   GET    /service-requests/v1/drafts/current
 *   PUT    /service-requests/v1/drafts    (multipart)
 *   DELETE /service-requests/v1/drafts
 *   GET    /service-requests/v1/notifications
 *   PATCH  /service-requests/v1/notifications/read
 */
import { ApiError, apiClient, unwrap } from "@/lib/apiClient";
import { getCsrfToken } from "@/services/auth";
import {
  STATUS_LABELS,
  type PurposeOption,
  type RequestDocument,
  type RequestFormValues,
  type RequestId,
  type ServiceOption,
  type ServiceRequest,
  type ServiceRequestDraft,
  type ServiceRequestNotification,
} from "./types";
import { buildTimeline, normalizeHistoryEntry, normalizeStatus, normalizeTimelineStage } from "./shared";

type Json = Record<string, unknown>;

const FALLBACK_PURPOSES: PurposeOption[] = [
  { id: 1, label: "Employment" },
  { id: 2, label: "Scholarship" },
  { id: 3, label: "School Requirement" },
  { id: 4, label: "Personal Use" },
  { id: 5, label: "Other" },
];

function asRecord(value: unknown): Json {
  return value && typeof value === "object" ? (value as Json) : {};
}

function readString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value;
  }
  return undefined;
}

function readNumber(...values: unknown[]): number | undefined {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) {
      return Number(value);
    }
  }
  return undefined;
}

function readBoolean(...values: unknown[]): boolean | undefined {
  for (const value of values) {
    if (typeof value === "boolean") return value;
    if (value === 1 || value === "1") return true;
    if (value === 0 || value === "0") return false;
  }
  return undefined;
}

function normalizeService(value: unknown): ServiceRequest["service"] {
  if (typeof value === "string") {
    return { id: 0, name: value, code: "", fee: 0 };
  }
  const raw = asRecord(value);
  return {
    id: readNumber(raw.id) ?? 0,
    name: readString(raw.name, raw.label, raw.title) ?? "Service",
    code: readString(raw.code) ?? "",
    fee: readNumber(raw.fee, raw.price) ?? 0,
  };
}

function normalizeServiceOption(value: unknown): ServiceOption {
  if (typeof value === "string") {
    return { id: 0, code: "", name: value, description: "", fee: 0 };
  }
  const raw = asRecord(value);
  return {
    id: readNumber(raw.id) ?? 0,
    code: readString(raw.code) ?? "",
    name: readString(raw.name, raw.label, raw.title) ?? "Service",
    description: readString(raw.description, raw.details) ?? "",
    fee: readNumber(raw.fee, raw.price) ?? 0,
  };
}

function normalizePurpose(value: unknown, index: number): PurposeOption {
  if (typeof value === "string") {
    return { id: index + 1, label: value };
  }
  const raw = asRecord(value);
  return {
    id: readNumber(raw.id) ?? index + 1,
    label: readString(raw.label, raw.name, raw.value) ?? String(value ?? ""),
  };
}

function normalizeDocument(value: unknown): RequestDocument {
  const raw = asRecord(value);
  return {
    name: readString(raw.name, raw.file_name, raw.filename) ?? "Student ID",
    size: readNumber(raw.size, raw.bytes) ?? 0,
    mime: readString(raw.mime, raw.mime_type, raw.type) ?? "",
  };
}

function normalizeRequest(value: unknown): ServiceRequest {
  const raw = asRecord(value);
  const status = normalizeStatus(raw.status ?? raw.status_label ?? raw.statusLabel);
  const statusLabel =
    readString(raw.status_label, raw.statusLabel, raw.status_name) ?? STATUS_LABELS[status];
  const purposeRaw = raw.purpose;
  const purpose =
    typeof purposeRaw === "string"
      ? purposeRaw
      : (readString(asRecord(purposeRaw).label, asRecord(purposeRaw).name) ?? "");

  const submittedAt =
    readString(raw.submitted_at, raw.submittedAt, raw.created_at, raw.createdAt) ??
    new Date().toISOString();
  const updatedAt =
    readString(raw.updated_at, raw.updatedAt) ?? submittedAt;

  const rawTimeline = Array.isArray(raw.timeline)
    ? raw.timeline
    : Array.isArray(raw.stages)
      ? raw.stages
      : null;

  const timeline = rawTimeline?.length
    ? rawTimeline.map(normalizeTimelineStage)
    : buildTimeline(status, {
        submitted: readString(raw.submitted_at, raw.submittedAt, raw.created_at),
        under_review: readString(raw.under_review_at, raw.reviewed_at, raw.review_started_at),
        processing: readString(raw.processing_at, raw.processed_at),
        ready_for_release: readString(raw.ready_for_release_at, raw.ready_at),
        released: readString(raw.released_at, raw.releasedAt),
      });

  const history = Array.isArray(raw.history)
    ? raw.history.map(normalizeHistoryEntry)
    : undefined;

  const documentValue = raw.document ?? raw.student_id ?? raw.attachment;
  const documentRaw = asRecord(documentValue);
  const hasDocument = Boolean(readString(documentRaw.name, documentRaw.file_name, documentRaw.filename));

  return {
    id: readId(raw.id, raw.request_id),
    referenceNumber:
      readString(raw.reference_number, raw.referenceNumber, raw.reference_no, raw.code) ?? "",
    service: normalizeService(raw.service ?? raw.service_name ?? raw.serviceName),
    copies: readNumber(raw.copies, raw.number_of_copies, raw.quantity) ?? 1,
    purpose,
    notes: readString(raw.notes, raw.additional_notes) ?? "",
    remarks: readString(raw.remarks, raw.office_remarks, raw.admin_notes) ?? undefined,
    status,
    statusLabel,
    submittedAt,
    updatedAt,
    document: hasDocument ? normalizeDocument(documentValue) : null,
    timeline,
    history,
  };
}

function readId(...values: unknown[]): RequestId | "" {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim()) return value;
  }
  return "";
}

function normalizeNotification(value: unknown): ServiceRequestNotification {
  const raw = asRecord(value);
  return {
    id: readId(raw.id, raw.notification_id),
    type: readString(raw.type, raw.category) ?? "request_update",
    title: readString(raw.title, raw.subject) ?? "Request update",
    message: readString(raw.message, raw.body, raw.description) ?? "",
    isRead: readBoolean(raw.is_read, raw.isRead, raw.read) ?? false,
    createdAt:
      readString(raw.created_at, raw.createdAt, raw.timestamp) ?? new Date().toISOString(),
    requestId: readId(raw.request_id, raw.requestId) || null,
    referenceNumber: readString(raw.reference_number, raw.referenceNumber) ?? null,
  };
}

function normalizeDraft(value: unknown): ServiceRequestDraft | null {
  if (!value || typeof value !== "object") return null;
  const raw = asRecord(value);
  const documentValue = raw.document ?? raw.student_id ?? raw.attachment;
  const hasDocument =
    readBoolean(raw.has_document, raw.hasDocument) ?? Boolean(documentValue);

  return {
    serviceId: readNumber(raw.service_id, raw.serviceId) ?? null,
    copies: readNumber(raw.copies, raw.number_of_copies) ?? 1,
    purpose: readString(raw.purpose, asRecord(raw.purpose).label) ?? "",
    notes: readString(raw.notes, raw.additional_notes) ?? "",
    hasDocument,
    document: hasDocument ? normalizeDocument(documentValue) : null,
    updatedAt:
      readString(raw.updated_at, raw.updatedAt) ?? new Date().toISOString(),
  };
}

function progressHandler(onProgress?: (percent: number) => void) {
  if (!onProgress) return undefined;
  return (event: { loaded: number; total?: number }) => {
    if (!event.total) return;
    onProgress(Math.min(100, Math.round((event.loaded / event.total) * 100)));
  };
}

function isNotFound(error: unknown): boolean {
  return error instanceof ApiError && error.status === 404;
}

export async function getCatalog(): Promise<{
  services: ServiceOption[];
  purposes: PurposeOption[];
}> {
  const body = unwrap<unknown>((await apiClient.get("/service-requests/v1/catalog")).data);

  if (Array.isArray(body)) {
    return {
      services: body.map(normalizeServiceOption),
      purposes: FALLBACK_PURPOSES,
    };
  }

  const raw = asRecord(body);
  const serviceList = Array.isArray(raw.services)
    ? raw.services
    : Array.isArray(raw.service_options)
      ? raw.service_options
      : [];
  const purposeList = Array.isArray(raw.purposes)
    ? raw.purposes
    : Array.isArray(raw.purpose_options)
      ? raw.purpose_options
      : [];

  return {
    services: serviceList.map(normalizeServiceOption),
    purposes: purposeList.length
      ? purposeList.map(normalizePurpose)
      : FALLBACK_PURPOSES,
  };
}

export async function getServiceRequests(): Promise<ServiceRequest[]> {
  const body = unwrap<unknown>((await apiClient.get("/service-requests/v1/")).data);
  const raw = asRecord(body);
  const list = Array.isArray(body)
    ? body
    : Array.isArray(raw.requests)
      ? raw.requests
      : Array.isArray(raw.items)
        ? raw.items
        : [];

  return list.map(normalizeRequest).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
}

export async function getServiceRequest(id: RequestId): Promise<ServiceRequest> {
  const body = unwrap<unknown>(
    (await apiClient.get(`/service-requests/v1/${encodeURIComponent(String(id))}`)).data,
  );
  const requestBody = asRecord(body).request ?? body;
  return normalizeRequest(requestBody);
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new ApiError("Could not read the uploaded document."));
    reader.readAsDataURL(file);
  });
}

export async function createServiceRequest(
  values: RequestFormValues,
  onProgress?: (percent: number) => void,
): Promise<ServiceRequest> {
  const csrf = await getCsrfToken();
  const document = values.documents[0];
  const attachment = document
    ? {
        name: document.name,
        type: document.type,
        size: document.size,
        data: await fileToDataUrl(document),
      }
    : null;

  const body = unwrap<unknown>(
    (
      await apiClient.post(
        "/service-requests/v1/",
        {
          serviceId: values.serviceId,
          copies: values.copies,
          purpose: values.purpose,
          notes: values.notes,
          attachment,
        },
        {
          headers: { "x-csrf-token": csrf },
          onUploadProgress: progressHandler(onProgress),
        },
      )
    ).data,
  );
  const requestBody = asRecord(body).request ?? body;
  return normalizeRequest(requestBody);
}

export async function getCurrentDraft(): Promise<ServiceRequestDraft | null> {
  try {
    const body = unwrap<unknown>((await apiClient.get("/service-requests/v1/drafts/current")).data);
    const raw = asRecord(body);
    // `draft: null` means the student has no saved draft.
    return normalizeDraft("draft" in raw ? raw.draft : body);
  } catch (error) {
    if (isNotFound(error)) return null;
    throw error;
  }
}

export async function saveDraft(
  values: RequestFormValues,
  onProgress?: (percent: number) => void,
): Promise<ServiceRequestDraft> {
  const csrf = await getCsrfToken();
  const document = values.documents[0];
  const attachment = document
    ? {
        name: document.name,
        type: document.type,
        size: document.size,
        data: await fileToDataUrl(document),
      }
    : null;

  const body = unwrap<unknown>(
    (
      await apiClient.put(
        "/service-requests/v1/drafts",
        {
          serviceId: values.serviceId,
          copies: values.copies,
          purpose: values.purpose,
          notes: values.notes,
          attachment,
          removeAttachment: !attachment && Boolean(values.removeDraftDocument),
        },
        {
          headers: { "x-csrf-token": csrf },
          onUploadProgress: progressHandler(onProgress),
        },
      )
    ).data,
  );
  const draft = normalizeDraft(asRecord(body).draft ?? body);
  if (!draft) throw new ApiError("The draft could not be saved. Please try again.");
  return draft;
}

export async function deleteDraft(): Promise<void> {
  try {
    const csrf = await getCsrfToken();
    await apiClient.delete("/service-requests/v1/drafts", {
      headers: { "x-csrf-token": csrf },
    });
  } catch (error) {
    if (isNotFound(error)) return;
    throw error;
  }
}

export async function getNotifications(): Promise<{
  notifications: ServiceRequestNotification[];
  unread: number;
}> {
  const body = unwrap<unknown>((await apiClient.get("/service-requests/v1/notifications")).data);
  const raw = asRecord(body);
  const list = Array.isArray(body)
    ? body
    : Array.isArray(raw.notifications)
      ? raw.notifications
      : [];

  const notifications = list
    .map(normalizeNotification)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return {
    notifications,
    unread:
      readNumber(raw.unread, raw.unread_count, raw.unreadCount) ??
      notifications.filter((item) => !item.isRead).length,
  };
}

export async function markNotificationsRead(): Promise<void> {
  const csrf = await getCsrfToken();
  await apiClient.patch(
    "/service-requests/v1/notifications/read",
    {},
    {
      headers: { "x-csrf-token": csrf },
    },
  );
}

export async function downloadDocument(id: RequestId, fileName: string): Promise<void> {
  const response = await apiClient.get(
    `/service-requests/v1/${encodeURIComponent(String(id))}/document`,
    {
      responseType: "blob",
    },
  );

  const blob = response.data as Blob;
  const disposition = String(response.headers["content-disposition"] ?? "");
  const headerName = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition)?.[1];

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = headerName ? decodeURIComponent(headerName) : fileName || "student-id";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

