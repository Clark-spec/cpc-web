import type { ComplaintStatus } from "./types";

/** Payload of the student-only `complaint_updated` SSE event. */
export type ComplaintUpdateEvent = {
  complaintId: string;
  status: ComplaintStatus;
  updatedAt: string;
  adminRemarks: string;
};

function isStatus(value: unknown): value is ComplaintStatus {
  return value === "pending" || value === "in_review" || value === "resolved";
}

/** Rejects anything that cannot safely patch a complaint row. */
export function parseComplaintUpdate(data: unknown): ComplaintUpdateEvent | null {
  if (!data || typeof data !== "object") return null;
  const value = data as Record<string, unknown>;
  if (typeof value.complaintId !== "string" || !value.complaintId) return null;
  if (!isStatus(value.status)) return null;

  return {
    complaintId: value.complaintId,
    status: value.status,
    updatedAt:
      typeof value.updatedAt === "string" && value.updatedAt
        ? value.updatedAt
        : new Date().toISOString(),
    adminRemarks:
      typeof value.adminRemarks === "string" ? value.adminRemarks : "",
  };
}
