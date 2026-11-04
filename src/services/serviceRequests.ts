/**
 * Service Requests data source.
 *
 * TEMPORARY: this module serves local demo data so the whole page can be
 * reviewed without an API. No network request is made. Every function keeps
 * the async shape the real service layer will use, so replacing these bodies
 * with HTTP calls later only touches this file.
 *
 * Planned contract (for later):
 *   GET    /catalog
 *   GET    /service-requests
 *   POST   /service-requests            (multipart)
 *   GET    /service-requests/:id
 *   GET    /service-requests/:id/document
 *   GET    /service-requests/drafts/current
 *   PUT    /service-requests/drafts     (multipart)
 *   DELETE /service-requests/drafts
 *   GET    /service-requests/notifications
 *   PATCH  /service-requests/notifications/read
 */

export type RequestStatus =
  | "submitted"
  | "under_review"
  | "processing"
  | "ready_for_release"
  | "released"
  | "rejected";

export type StageState = "completed" | "active" | "pending";

export type TimelineStage = {
  key: Exclude<RequestStatus, "released" | "rejected">;
  label: string;
  description: string;
  state: StageState;
  timestamp: string | null;
};

export type RequestDocument = {
  name: string;
  size: number;
  mime: string;
};

export type ServiceRequest = {
  id: number;
  referenceNumber: string;
  service: {
    id: number;
    name: string;
    code: string;
    fee: number;
  };
  copies: number;
  purpose: string;
  notes: string;
  status: RequestStatus;
  statusLabel: string;
  submittedAt: string;
  updatedAt: string;
  document: RequestDocument;
  timeline: TimelineStage[];
};

export type ServiceOption = {
  id: number;
  code: string;
  name: string;
  description: string;
  fee: number;
};

export type PurposeOption = {
  id: number;
  label: string;
};

export type ServiceRequestDraft = {
  serviceId: number | null;
  copies: number;
  purpose: string;
  notes: string;
  hasDocument: boolean;
  document: RequestDocument | null;
  updatedAt: string;
};

export type ServiceRequestNotification = {
  id: number;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  requestId: number | null;
  referenceNumber: string | null;
};

export type RequestFormValues = {
  serviceId: number | null;
  copies: number;
  purpose: string;
  notes: string;
  document: File | null;
};

export const MAX_DOCUMENT_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_DOCUMENT_TYPES = ["application/pdf", "image/png", "image/jpeg"];
export const ACCEPTED_DOCUMENT_LABEL = "PDF, PNG, or JPG up to 5 MB";

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

type StageKey = TimelineStage["key"];

const STAGE_ORDER: StageKey[] = [
  "submitted",
  "under_review",
  "processing",
  "ready_for_release",
];

const STAGE_COPY: Record<StageKey, { label: string; description: string }> = {
  submitted: {
    label: "Request submitted",
    description: "Your request has been received.",
  },
  under_review: {
    label: "Under review",
    description: "Student services is reviewing your request.",
  },
  processing: {
    label: "Processing",
    description: "Your document is being prepared.",
  },
  ready_for_release: {
    label: "Ready for release",
    description: "Ready for pickup at the registrar's office.",
  },
};

const STATUS_LABELS: Record<RequestStatus, string> = {
  submitted: "Submitted",
  under_review: "Under Review",
  processing: "Processing",
  ready_for_release: "Ready for Release",
  released: "Released",
  rejected: "Rejected",
};

function buildTimeline(
  status: RequestStatus,
  timestamps: Partial<Record<StageKey, string>>,
): TimelineStage[] {
  const currentIndex = (STAGE_ORDER as readonly string[]).indexOf(status);

  return STAGE_ORDER.map((key, index) => {
    let state: StageState;
    if (status === "released") state = "completed";
    else if (status === "rejected") state = index === 0 ? "completed" : "pending";
    else if (index < currentIndex) state = "completed";
    else if (index === currentIndex) state = "active";
    else state = "pending";

    return {
      key,
      label: STAGE_COPY[key].label,
      description: STAGE_COPY[key].description,
      state,
      timestamp: state === "pending" ? null : timestamps[key] ?? null,
    };
  });
}

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

function daysAgo(days: number, hour = 9, minute = 0): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

const REQUESTS_KEY = "cpc-sr-demo-requests-v1";
const NOTIFICATIONS_KEY = "cpc-sr-demo-notifications-v1";
const DRAFT_KEY = "cpc-sr-demo-draft-v1";

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
  return [
    {
      id: 3,
      referenceNumber: "SR-2026-00184",
      service: DEMO_SERVICES[2],
      copies: 1,
      purpose: "Scholarship Application",
      notes: "Please address the certificate to the scholarship committee.",
      status: "processing",
      statusLabel: STATUS_LABELS.processing,
      submittedAt: daysAgo(7, 9, 15),
      updatedAt: daysAgo(3, 14, 5),
      document: { name: "student-id.png", size: 184320, mime: "image/png" },
      timeline: buildTimeline("processing", {
        submitted: daysAgo(7, 9, 15),
        under_review: daysAgo(4, 10, 40),
      }),
    },
    {
      id: 2,
      referenceNumber: "SR-2026-00152",
      service: DEMO_SERVICES[0],
      copies: 2,
      purpose: "Employment (Abroad)",
      notes: "",
      status: "ready_for_release",
      statusLabel: STATUS_LABELS.ready_for_release,
      submittedAt: daysAgo(21, 13, 0),
      updatedAt: daysAgo(11, 8, 30),
      document: { name: "student-id.png", size: 184320, mime: "image/png" },
      timeline: buildTimeline("ready_for_release", {
        submitted: daysAgo(21, 13, 0),
        under_review: daysAgo(19, 9, 10),
        processing: daysAgo(15, 11, 25),
        ready_for_release: daysAgo(11, 8, 30),
      }),
    },
    {
      id: 1,
      referenceNumber: "SR-2025-00987",
      service: DEMO_SERVICES[1],
      copies: 1,
      purpose: "Personal Records",
      notes: "",
      status: "released",
      statusLabel: STATUS_LABELS.released,
      submittedAt: daysAgo(450, 10, 0),
      updatedAt: daysAgo(447, 15, 20),
      document: { name: "student-id.png", size: 184320, mime: "image/png" },
      timeline: buildTimeline("released", {
        submitted: daysAgo(450, 10, 0),
        under_review: daysAgo(450, 14, 30),
        processing: daysAgo(448, 9, 5),
        ready_for_release: daysAgo(447, 15, 20),
      }),
    },
  ];
}

function seedNotifications(): ServiceRequestNotification[] {
  return [
    {
      id: 4,
      type: "request_ready",
      title: "Transcript is ready for release",
      message:
        "Your Transcript of Records (SR-2026-00152) is ready for pickup at the registrar's office.",
      isRead: false,
      createdAt: daysAgo(0, 8, 45),
      requestId: 2,
      referenceNumber: "SR-2026-00152",
    },
    {
      id: 3,
      type: "request_processing",
      title: "Your request is being processed",
      message:
        "We started preparing your Certificate of Good Moral Character (SR-2026-00184).",
      isRead: false,
      createdAt: daysAgo(3, 14, 5),
      requestId: 3,
      referenceNumber: "SR-2026-00184",
    },
    {
      id: 2,
      type: "request_under_review",
      title: "Request is under review",
      message:
        "Student services is reviewing your Certificate of Good Moral Character (SR-2026-00184).",
      isRead: true,
      createdAt: daysAgo(4, 10, 40),
      requestId: 3,
      referenceNumber: "SR-2026-00184",
    },
    {
      id: 1,
      type: "request_released",
      title: "Document released",
      message: "Your Certificate of Enrollment (SR-2025-00987) was released.",
      isRead: true,
      createdAt: daysAgo(447, 15, 20),
      requestId: 1,
      referenceNumber: "SR-2025-00987",
    },
  ];
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

/** Kept for the UI error paths; with demo data these almost never fire. */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return "Something went wrong. Please try again.";
}

/* Uploaded files are kept in memory so "Download" returns the real file. */
const documentBlobs = new Map<number, Blob>();

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

export async function getServiceRequest(id: number): Promise<ServiceRequest> {
  await wait(250);
  const request = getRequests().find((item) => item.id === id);
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

  const document = values.document
    ? documentFromFile(values.document)
    : getDraftState()?.document ?? null;
  if (!document) throw new Error("Upload a valid student ID before submitting.");

  const existing = getRequests();
  const submittedAt = new Date().toISOString();
  const request: ServiceRequest = {
    id: existing.reduce((max, item) => Math.max(max, item.id), 0) + 1,
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

  if (values.document) documentBlobs.set(request.id, values.document);

  setRequests([request, ...existing]);

  const notifications = getNotificationsState();
  const nextNotificationId =
    notifications.reduce((max, item) => Math.max(max, item.id), 0) + 1;
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
  const document = values.document
    ? documentFromFile(values.document)
    : existing?.document ?? null;

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
export async function downloadDocument(id: number, fileName: string): Promise<void> {
  await wait(300);

  const stored = documentBlobs.get(id);
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
