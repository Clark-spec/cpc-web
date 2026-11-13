import {
  STATUS_LABELS,
  type RequestHistoryEntry,
  type RequestStatus,
  type ServiceRequest,
  type ServiceRequestUpdate,
  type StageState,
  type TimelineStage,
} from "./types";

export type StageKey = TimelineStage["key"];

export const STAGE_ORDER: StageKey[] = [
  "submitted",
  "under_review",
  "processing",
  "ready_for_release",
  "released",
];

export const STAGE_COPY: Record<StageKey, { label: string; description: string }> = {
  submitted: {
    label: "Submitted",
    description: "Your request has been received.",
  },
  under_review: {
    label: "Under Review",
    description: "Student services is reviewing your request.",
  },
  processing: {
    label: "Processing",
    description: "In progress at service office",
  },
  ready_for_release: {
    label: "Ready for Release",
    description: "Waiting for document release",
  },
  released: {
    label: "Released",
    description: "Document released to the student.",
  },
};

/**
 * Builds the four-stage progress timeline from the request status.
 * Timestamps are only shown for stages that have actually happened.
 */
export function buildTimeline(
  status: RequestStatus,
  timestamps: Partial<Record<StageKey, string>> = {},
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
      timestamp: state === "pending" ? null : (timestamps[key] ?? null),
    };
  });
}

export function statusLabel(status: RequestStatus): string {
  return STATUS_LABELS[status];
}

export function normalizeStatus(value: unknown): RequestStatus {
  if (typeof value === "number") {
    return (["submitted", "under_review", "processing", "ready_for_release", "released", "rejected"][
      value - 1
    ] ?? "submitted") as RequestStatus;
  }
  const key = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  if (key === "under_review" || key === "review" || key === "reviewing") return "under_review";
  if (key === "processing" || key === "in_progress") return "processing";
  if (key === "ready_for_release" || key === "ready" || key === "for_release") {
    return "ready_for_release";
  }
  if (key === "released" || key === "completed" || key === "done") return "released";
  if (key === "rejected" || key === "denied") return "rejected";
  return "submitted";
}

type Json = Record<string, unknown>;

function asRecord(value: unknown): Json {
  return value && typeof value === "object" ? (value as Json) : {};
}

function readString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value;
  }
  return undefined;
}

export function normalizeTimelineStage(value: unknown, index: number): TimelineStage {
  const raw = asRecord(value);
  const fallbackKey = STAGE_ORDER[index] ?? "submitted";
  const rawKey = String(readString(raw.key, raw.stage, raw.code) ?? fallbackKey)
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  const key = (STAGE_ORDER as readonly string[]).includes(rawKey)
    ? (rawKey as StageKey)
    : fallbackKey;

  const stateText = String(readString(raw.state, raw.status) ?? "").toLowerCase();
  const state =
    stateText.includes("complete") || stateText.includes("done")
      ? "completed"
      : stateText.includes("active") || stateText.includes("progress") || stateText.includes("current")
        ? "active"
        : "pending";

  return {
    key,
    label: readString(raw.label, raw.title, raw.name) ?? STAGE_ORDER[index] ?? key,
    description: readString(raw.description, raw.detail, raw.message) ?? "",
    state,
    timestamp: readString(raw.timestamp, raw.occurred_at, raw.created_at, raw.updated_at) ?? null,
  };
}

export function normalizeHistoryEntry(value: unknown, index: number): RequestHistoryEntry {
  const raw = asRecord(value);
  const status = normalizeStatus(raw.status ?? raw.newStatus ?? raw.new_status);
  const oldValue = raw.oldStatus ?? raw.old_status;
  const changedAt =
    readString(raw.changedAt, raw.changed_at, raw.createdAt, raw.created_at) ??
    new Date().toISOString();

  return {
    id: readString(raw.id) ?? `${status}-${changedAt}-${index}`,
    oldStatus: oldValue === null || oldValue === undefined ? null : normalizeStatus(oldValue),
    status,
    statusLabel: readString(raw.statusLabel, raw.status_label) ?? STATUS_LABELS[status],
    remarks: readString(raw.remarks) ?? "",
    changedByName: readString(raw.changedByName, raw.changed_by_name) ?? null,
    changedByRole: readString(raw.changedByRole, raw.changed_by_role) ?? null,
    changedAt,
  };
}

/** Parses the owner-only `service_request_updated` SSE payload. */
export function parseServiceRequestUpdate(value: unknown): ServiceRequestUpdate | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Json;
  const requestId = readString(raw.requestId, raw.request_id, raw.id);
  if (!requestId) return null;

  const status = normalizeStatus(raw.status ?? raw.newStatus);
  const timeline = Array.isArray(raw.timeline)
    ? raw.timeline.map(normalizeTimelineStage)
    : [];

  return {
    requestId,
    referenceNumber: readString(raw.referenceNumber, raw.reference_number) ?? "",
    status,
    statusLabel: readString(raw.statusLabel, raw.status_label) ?? STATUS_LABELS[status],
    updatedAt: readString(raw.updatedAt, raw.updated_at) ?? new Date().toISOString(),
    remarks: typeof raw.remarks === "string" ? raw.remarks : "",
    timeline,
    historyEntry: raw.historyEntry ? normalizeHistoryEntry(raw.historyEntry, 0) : null,
  };
}

/** Patches a request in place so open tables and modals never reload. */
export function applyRequestUpdate(
  request: ServiceRequest,
  update: ServiceRequestUpdate,
): ServiceRequest {
  const isMutation = update.timeline.length > 0 || update.historyEntry !== null;
  const history = update.historyEntry
    ? [
        ...(request.history ?? []).filter(
          (entry) => String(entry.id) !== String(update.historyEntry?.id),
        ),
        update.historyEntry,
      ]
    : request.history;

  return {
    ...request,
    status: update.status,
    statusLabel: update.statusLabel,
    updatedAt: update.updatedAt,
    remarks: isMutation ? update.remarks : (request.remarks ?? ""),
    timeline: update.timeline.length > 0 ? update.timeline : request.timeline,
    history,
  };
}

/** Message shown in the page notice and inline error states. */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return "Something went wrong. Please try again.";
}

