import type { ComplaintStatus } from "./types";

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
