import type { Complaint, ComplaintStatus } from "./types";

export const COMPLAINT_CATEGORIES = [
  "Academic Concern",
  "Facilities & Maintenance",
  "Student Conduct",
  "Financial / Billing",
  "Health & Safety",
  "Discrimination or Harassment",
  "Other",
];

export const COMPLAINT_STATUS_LABELS: Record<ComplaintStatus, string> = {
  pending: "Pending",
  in_review: "In Review",
  resolved: "Resolved",
};

export const MOCK_COMPLAINTS: Complaint[] = [
  {
    id: "cmp-2026-0014",
    referenceNumber: "CMP-2026-0014",
    subject: "Broken air-conditioning unit in Room 204",
    category: "Facilities & Maintenance",
    filedAt: "2026-11-06T09:15:00+08:00",
    status: "pending",
    anonymous: false,
  },
  {
    id: "cmp-2026-0011",
    referenceNumber: "CMP-2026-0011",
    subject: "Incorrect grade posted for IT 201",
    category: "Academic Concern",
    filedAt: "2026-10-29T14:40:00+08:00",
    status: "in_review",
    anonymous: false,
  },
  {
    id: "cmp-2026-0008",
    referenceNumber: "CMP-2026-0008",
    subject: "Unclear laboratory fee breakdown",
    category: "Financial / Billing",
    filedAt: "2026-10-14T10:05:00+08:00",
    status: "resolved",
    anonymous: true,
  },
];

export const COMPLAINT_COOLDOWN_MS = 3 * 24 * 60 * 60 * 1000;

const SUBMISSIONS_STORAGE_KEY = "cpc.online-complaints.submissions.v1";

function isStoredComplaint(value: unknown): value is Complaint {
  if (!value || typeof value !== "object") return false;

  const complaint = value as Record<string, unknown>;
  return (
    typeof complaint.id === "string" &&
    typeof complaint.referenceNumber === "string" &&
    typeof complaint.subject === "string" &&
    typeof complaint.category === "string" &&
    typeof complaint.filedAt === "string" &&
    !Number.isNaN(new Date(complaint.filedAt).getTime()) &&
    (complaint.status === "pending" ||
      complaint.status === "in_review" ||
      complaint.status === "resolved")
  );
}

/** Complaints saved in this browser, newest first. Mocks are not stored. */
export function loadSubmittedComplaints(): Complaint[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(SUBMISSIONS_STORAGE_KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(isStoredComplaint)
      .map((complaint) => ({ ...complaint, anonymous: complaint.anonymous === true }))
      .sort((a, b) => new Date(b.filedAt).getTime() - new Date(a.filedAt).getTime());
  } catch {
    return [];
  }
}

export function saveSubmittedComplaints(complaints: Complaint[]): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(SUBMISSIONS_STORAGE_KEY, JSON.stringify(complaints));
  } catch {
    // Storage can be unavailable (private mode/quota); the session still works.
  }
}

/** Earliest time the student may file again, based on the latest submission. */
export function getSubmissionCooldownUntil(complaints: Complaint[]): string | null {
  const latest = complaints.reduce((max, complaint) => {
    const filedAt = new Date(complaint.filedAt).getTime();
    return Number.isFinite(filedAt) ? Math.max(max, filedAt) : max;
  }, 0);

  return latest > 0 ? new Date(latest + COMPLAINT_COOLDOWN_MS).toISOString() : null;
}

/** Continues the CMP-YYYY-#### sequence from the highest reference already filed. */
export function nextComplaintReference(complaints: Complaint[], now = new Date()): string {
  const highest = complaints.reduce((max, complaint) => {
    const match = complaint.referenceNumber.match(/(\d+)$/);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);

  return `CMP-${now.getFullYear()}-${String(highest + 1).padStart(4, "0")}`;
}
