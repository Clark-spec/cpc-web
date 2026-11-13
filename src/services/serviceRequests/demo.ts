/**
 * Demo data source for the Service Requests page.
 *
 * Used while the CPC backend is unavailable (the default). Everything is kept
 * in localStorage so the page can be reviewed end to end without an API. The
 * functions keep the same async shape as the HTTP implementation, so switching
 * `VITE_USE_DEMO_DATA=false` only swaps the adapter.
 */
import {
  STATUS_LABELS,
  type PurposeOption,
  type RequestFormValues,
  type RequestDocument,
  type RequestId,
  type ServiceOption,
  type ServiceRequest,
  type ServiceRequestDraft,
  type ServiceRequestNotification,
} from "./types";
import { buildTimeline } from "./shared";

const DEMO_SERVICES: ServiceOption[] = [
  {
    id: 1,
    code: "TOR",
    name: "Transcript of Records",
    description: "Official record of all completed coursework and grades.",
    fee: 150,
  },
  {
    id: 2,
    code: "COE",
    name: "Certificate of Enrollment",
    description: "Proof that you are currently enrolled for the semester.",
    fee: 50,
  },
  {
    id: 3,
    code: "CGMC",
    name: "Certificate of Good Moral Character",
    description: "Certification of good standing issued by student services.",
    fee: 75,
  },
  {
    id: 4,
    code: "COG",
    name: "Certificate of Graduation",
    description: "Confirms completion of your degree program.",
    fee: 100,
  },
  {
    id: 5,
    code: "HD",
    name: "Honorable Dismissal",
    description: "Transfer credential for students moving to another school.",
    fee: 100,
  },
  {
    id: 6,
    code: "COGR",
    name: "Certificate of Grades",
    description: "Summary of grades for a specific semester.",
    fee: 75,
  },
];

const DEMO_PURPOSES: PurposeOption[] = [
  { id: 1, label: "Employment (Local)" },
  { id: 2, label: "Employment (Abroad)" },
  { id: 3, label: "Further Studies" },
  { id: 4, label: "Scholarship Application" },
  { id: 5, label: "Board Examination" },
  { id: 6, label: "Transfer to Another School" },
  { id: 7, label: "Personal Records" },
];

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function simulateUpload(onProgress?: (percent: number) => void): Promise<void> {
  if (!onProgress) {
    await wait(450);
    return;
  }
  for (const percent of [30, 65, 100]) {
    onProgress(percent);
    await wait(180);
  }
}

const REQUESTS_KEY = "cpc-sr-live-requests-v3";
const NOTIFICATIONS_KEY = "cpc-sr-live-notifications-v3";
const DRAFT_KEY = "cpc-sr-live-draft-v3";

function readStore<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeStore(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Private modes can block storage; state then simply lives in memory.
  }
}

function removeStore(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore.
  }
}

let requestsState: ServiceRequest[] | null = null;
let notificationsState: ServiceRequestNotification[] | null = null;
let draftState: ServiceRequestDraft | null | undefined;

function seedRequests(): ServiceRequest[] {
  return [];
}

function seedNotifications(): ServiceRequestNotification[] {
  return [];
}

function getRequests(): ServiceRequest[] {
  if (!requestsState) {
    requestsState = readStore<ServiceRequest[]>(REQUESTS_KEY) ?? seedRequests();
    writeStore(REQUESTS_KEY, requestsState);
  }
  return requestsState;
}

function setRequests(next: ServiceRequest[]): void {
  requestsState = next;
  writeStore(REQUESTS_KEY, next);
}

function getNotificationsState(): ServiceRequestNotification[] {
  if (!notificationsState) {
    notificationsState =
      readStore<ServiceRequestNotification[]>(NOTIFICATIONS_KEY) ?? seedNotifications();
    writeStore(NOTIFICATIONS_KEY, notificationsState);
  }
  return notificationsState;
}

function setNotifications(next: ServiceRequestNotification[]): void {
  notificationsState = next;
  writeStore(NOTIFICATIONS_KEY, next);
}

function getDraftState(): ServiceRequestDraft | null {
  if (draftState === undefined) {
    draftState = readStore<ServiceRequestDraft>(DRAFT_KEY);
  }
  return draftState;
}

function setDraftState(next: ServiceRequestDraft | null): void {
  draftState = next;
  if (next) writeStore(DRAFT_KEY, next);
  else removeStore(DRAFT_KEY);
}

/* Uploaded files are kept in memory so "Download" returns the real file. */
const documentBlobs = new Map<string, Blob>();

function documentFromFile(file: File): RequestDocument {
  return { name: file.name, size: file.size, mime: file.type };
}

function nextReferenceNumber(existing: ServiceRequest[]): string {
  const year = new Date().getFullYear();
  const prefix = `SR-${year}-`;
  const highest = existing.reduce((max, item) => {
    if (!item.referenceNumber.startsWith(prefix)) return max;
    const tail = item.referenceNumber.slice(prefix.length);
    return /^\d+$/.test(tail) ? Math.max(max, Number(tail)) : max;
  }, 0);
  return `${prefix}${String(highest + 1).padStart(5, "0")}`;
}

export async function getCatalog(): Promise<{
  services: ServiceOption[];
  purposes: PurposeOption[];
}> {
  await wait(300);
  return { services: [...DEMO_SERVICES], purposes: [...DEMO_PURPOSES] };
}

export async function getServiceRequests(): Promise<ServiceRequest[]> {
  await wait(300);
  return [...getRequests()];
}

export async function getServiceRequest(id: RequestId): Promise<ServiceRequest> {
  await wait(250);
  const request = getRequests().find((item) => String(item.id) === String(id));
  if (!request) throw new Error("This request could not be found.");
  return request;
}

export async function createServiceRequest(
  values: RequestFormValues,
  onProgress?: (percent: number) => void,
): Promise<ServiceRequest> {
  await simulateUpload(onProgress);

  const service = DEMO_SERVICES.find((item) => item.id === values.serviceId);
  if (!service) throw new Error("Select the service you need before submitting.");
  if (!values.purpose) throw new Error("Select the purpose of your request before submitting.");

  const document = values.documents[0]
    ? documentFromFile(values.documents[0])
    : (getDraftState()?.document ?? null);
  if (!document) throw new Error("Upload a valid student ID before submitting.");

  const existing = getRequests();
  const submittedAt = new Date().toISOString();
  const request: ServiceRequest = {
    id: existing.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1,
    referenceNumber: nextReferenceNumber(existing),
    service,
    copies: values.copies,
    purpose: values.purpose,
    notes: values.notes.trim(),
    status: "submitted",
    statusLabel: STATUS_LABELS.submitted,
    submittedAt,
    updatedAt: submittedAt,
    document,
    timeline: buildTimeline("submitted", { submitted: submittedAt }),
  };

  if (values.documents[0]) documentBlobs.set(String(request.id), values.documents[0]);

  setRequests([request, ...existing]);

  const notifications = getNotificationsState();
  const nextNotificationId =
    notifications.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1;
  setNotifications([
    {
      id: nextNotificationId,
      type: "request_submitted",
      title: "Request submitted",
      message: `We received your ${service.name} request (${request.referenceNumber}).`,
      isRead: false,
      createdAt: submittedAt,
      requestId: request.id,
      referenceNumber: request.referenceNumber,
    },
    ...notifications,
  ]);

  setDraftState(null);
  return request;
}

export async function getCurrentDraft(): Promise<ServiceRequestDraft | null> {
  await wait(150);
  return getDraftState();
}

export async function saveDraft(
  values: RequestFormValues,
  onProgress?: (percent: number) => void,
): Promise<ServiceRequestDraft> {
  await simulateUpload(onProgress);

  const existing = getDraftState();
  const document = values.removeDraftDocument
    ? null
    : values.documents[0]
      ? documentFromFile(values.documents[0])
      : (existing?.document ?? null);

  const draft: ServiceRequestDraft = {
    serviceId: values.serviceId,
    copies: values.copies,
    purpose: values.purpose,
    notes: values.notes,
    hasDocument: Boolean(document),
    document,
    updatedAt: new Date().toISOString(),
  };

  setDraftState(draft);
  return draft;
}

export async function deleteDraft(): Promise<void> {
  await wait(200);
  setDraftState(null);
}

export async function getNotifications(): Promise<{
  notifications: ServiceRequestNotification[];
  unread: number;
}> {
  await wait(300);
  const notifications = getNotificationsState();
  return {
    notifications: [...notifications],
    unread: notifications.filter((item) => !item.isRead).length,
  };
}

export async function markNotificationsRead(): Promise<void> {
  await wait(200);
  setNotifications(getNotificationsState().map((item) => ({ ...item, isRead: true })));
}

function createDemoIdCard(): Promise<Blob> {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    canvas.width = 720;
    canvas.height = 440;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      resolve(new Blob(["Cordova Public College - Student ID (demo)"], { type: "text/plain" }));
      return;
    }

    ctx.fillStyle = "#F4F7FF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#193C9A";
    ctx.fillRect(0, 0, canvas.width, 96);
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 30px Arial";
    ctx.fillText("CORDOVA PUBLIC COLLEGE", 40, 60);
    ctx.fillStyle = "#71809D";
    ctx.font = "18px Arial";
    ctx.fillText("Student Identification Card (demo file)", 40, 150);
    ctx.fillStyle = "#172B5C";
    ctx.font = "bold 22px Arial";
    ctx.fillText("Sample Student", 40, 200);
    ctx.font = "18px Arial";
    ctx.fillText("Program: BS Information Technology", 40, 238);
    ctx.fillText("Student No.: 2026-00184", 40, 270);
    ctx.fillText("Valid for the current school year", 40, 302);
    ctx.fillStyle = "#DCE6F8";
    ctx.fillRect(40, 340, 640, 2);
    ctx.fillStyle = "#71809D";
    ctx.font = "16px Arial";
    ctx.fillText("This file is generated by the page preview. It is not a real ID.", 40, 380);

    canvas.toBlob(
      (blob) => resolve(blob ?? new Blob(["Cordova Public College - Student ID (demo)"])),
      "image/png",
    );
  });
}

/**
 * Hands the stored student ID to the browser as a download. Files uploaded in
 * this session are real; seeded requests get a generated placeholder image.
 */
export async function downloadDocument(id: RequestId, fileName: string): Promise<void> {
  await wait(300);

  const stored = documentBlobs.get(String(id));
  const blob = stored ?? (await createDemoIdCard());
  const downloadName = stored
    ? fileName
    : `${fileName.replace(/\.[^.]+$/, "") || "student-id"}.png`;

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = downloadName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

