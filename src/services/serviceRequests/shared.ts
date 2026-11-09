import {
  STATUS_LABELS,
  type RequestStatus,
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

/** Message shown in the page notice and inline error states. */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return "Something went wrong. Please try again.";
}

