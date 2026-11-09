/**
 * Analytics, metrics aggregation, and activity generation for enrollment applications.
 */

import type {
  EnrollmentActivityEntry,
  EnrollmentApplication,
  EnrollmentApplicationStatus,
  EnrollmentTrendPoint,
  ProgramBreakdown,
} from "./types";
import { ENROLLMENT_PROGRAMS } from "./types";
import { ENROLLMENT_DAY_MS } from "./sample";

export function getStatusCounts(
  applications: EnrollmentApplication[],
): Record<EnrollmentApplicationStatus, number> {
  const counts: Record<EnrollmentApplicationStatus, number> = {
    pending: 0,
    "for-review": 0,
    "needs-requirements": 0,
    approved: 0,
    rejected: 0,
  };

  for (const application of applications) {
    counts[application.status] += 1;
  }

  return counts;
}

/** Applications submitted in the last seven days, grouped by current status. */
export function getNewThisWeek(
  applications: EnrollmentApplication[],
  now = Date.now(),
): Record<EnrollmentApplicationStatus, number> {
  const counts = getStatusCounts([]);
  const threshold = now - 7 * ENROLLMENT_DAY_MS;

  for (const application of applications) {
    if (new Date(application.submittedAt).getTime() >= threshold) {
      counts[application.status] += 1;
    }
  }

  return counts;
}

export function getProgramBreakdown(
  applications: EnrollmentApplication[],
): ProgramBreakdown[] {
  const total = applications.length || 1;

  return ENROLLMENT_PROGRAMS.map((program) => {
    const count = applications.filter(
      (application) => application.programCode === program.code,
    ).length;
    return { ...program, count, share: Math.round((count / total) * 100) };
  }).sort((a, b) => b.count - a.count);
}

function shortWeekLabel(date: Date): string {
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function getWeeklyTrend(
  applications: EnrollmentApplication[],
  now = Date.now(),
  weeks = 8,
): EnrollmentTrendPoint[] {
  const buckets = Array.from({ length: weeks }, (_, index) => {
    const start = new Date(now - (weeks - 1 - index) * 7 * ENROLLMENT_DAY_MS);
    return {
      label: shortWeekLabel(start),
      received: 0,
      approved: 0,
    };
  });

  const bucketFor = (value: string | undefined): number | null => {
    if (!value) return null;
    const time = new Date(value).getTime();
    if (Number.isNaN(time)) return null;
    const daysAgo = Math.floor((now - time) / ENROLLMENT_DAY_MS);
    if (daysAgo < 0) return weeks - 1;
    const bucket = weeks - 1 - Math.floor(daysAgo / 7);
    return bucket >= 0 && bucket < weeks ? bucket : null;
  };

  for (const application of applications) {
    const submitted = bucketFor(application.submittedAt);
    if (submitted !== null) buckets[submitted].received += 1;

    if (application.status === "approved") {
      const approved = bucketFor(application.respondedAt);
      if (approved !== null) buckets[approved].approved += 1;
    }
  }

  return buckets;
}

const ACTIVITY_COPY: Record<EnrollmentApplicationStatus, string> = {
  pending: "New enrollment application submitted",
  "for-review": "Application moved to For Review",
  "needs-requirements": "Additional requirements requested",
  approved: "Enrollment application approved",
  rejected: "Application returned to applicant",
};

/** Seed the feed from the newest records so it always matches the dataset. */
export function buildInitialActivity(
  applications: EnrollmentApplication[],
  limit = 6,
): EnrollmentActivityEntry[] {
  return [...applications]
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
    .slice(0, limit)
    .map((application) => ({
      id: `seed-activity-${application.id}`,
      status: application.status,
      message: ACTIVITY_COPY[application.status],
      studentName: application.studentName,
      studentId: application.studentId,
      at: application.respondedAt ?? application.submittedAt,
    }))
    .sort((a, b) => b.at.localeCompare(a.at));
}

export function activityMessageFor(status: EnrollmentApplicationStatus): string {
  return ACTIVITY_COPY[status];
}

