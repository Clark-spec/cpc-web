import type {
  ClearanceRecord,
  ClearanceRequestRow,
  OfficeId,
  OfficeSignature,
  TimelineEvent,
} from "@/types/clearance";
import type { ApproveInput } from "@/components/features/admin/clearance/types";
import { OFFICE_LABELS, OFFICE_ORDER } from "@/components/features/admin/clearance/officeChecks";
import {
  WRITE_DELAY,
  announceClearanceChange,
  newId,
  wait,
} from "./primitives";
import { isFullySigned, nextReferenceSequence, referenceNumberFor } from "./seed";
import {
  appendTimeline,
  pushActivity,
  pushStudentNotification,
  readPeriod,
  readRecords,
  readSavedSignatures,
  removeTimeline,
  storeSignature,
  studentActivity,
  writeRecords,
} from "./storage";
import { deriveRows, scopeRows } from "./calculations";

export type DecisionSnapshot = {
  requestId: string;
  studentId: string;
  office: OfficeId;
  previous: OfficeSignature;
  previousReferenceNumber?: string;
  previousCompletedAt?: string;
  addedTimelineId: string;
};

export type DecisionOutcome = {
  rows: ClearanceRequestRow[];
  snapshots: DecisionSnapshot[];
};

type DecisionSpec = {
  ids: string[];
  patch: (office: OfficeSignature) => OfficeSignature;
  event: (input: {
    requestId: string;
    office: OfficeId;
    at: string;
  }) => TimelineEvent;
  /** Runs after the write so a failed batch cannot emit half-sent alerts. */
  notify?: (input: {
    record: ClearanceRecord;
    office: OfficeId;
    at: string;
  }) => void;
};

export function parseRowId(id: string): { studentId: string; office: OfficeId } | null {
  const separator = id.lastIndexOf(":");
  if (separator <= 0) return null;
  const studentId = id.slice(0, separator);
  const office = id.slice(separator + 1) as OfficeId;
  return OFFICE_ORDER.includes(office) ? { studentId, office } : null;
}

/**
 * (2) The single write path for every staff decision: mutate the office entry
 * on a copy of the record, recompute completion (3), persist once, broadcast,
 * then notify.
 */
export function applyDecision(spec: DecisionSpec): DecisionOutcome {
  const period = readPeriod();
  const records = readRecords();
  const targets: Array<{ studentId: string; office: OfficeId; requestId: string }> = [];

  for (const id of spec.ids) {
    const parsed = parseRowId(id);
    if (parsed) targets.push({ ...parsed, requestId: id });
  }

  const snapshots: DecisionSnapshot[] = [];
  const addedEvents: TimelineEvent[] = [];
  const notifyQueue: Array<{ record: ClearanceRecord; office: OfficeId; at: string }> = [];
  const touched = new Set<string>();
  let sequence = nextReferenceSequence(records);

  const next = records.map((record) => {
    const entries = targets.filter((target) => target.studentId === record.studentId);
    if (entries.length === 0) return record;

    const offices = record.offices.slice();
    const decided: OfficeId[] = [];

    for (const entry of entries) {
      const index = offices.findIndex((office) => office.office === entry.office);
      if (index < 0) continue;

      const previous = { ...offices[index] };
      const updated = spec.patch(previous);
      if (
        updated.status === previous.status &&
        updated.respondedAt === previous.respondedAt
      ) {
        continue;
      }

      const at = new Date().toISOString();
      offices[index] = updated;
      decided.push(entry.office);

      const event = spec.event({
        requestId: entry.requestId,
        office: entry.office,
        at,
      });
      addedEvents.push(event);
      snapshots.push({
        requestId: entry.requestId,
        studentId: record.studentId,
        office: entry.office,
        previous,
        previousReferenceNumber: record.referenceNumber,
        previousCompletedAt: record.completedAt,
        addedTimelineId: event.id,
      });
    }

    if (decided.length === 0) return record;

    const complete = isFullySigned(offices);
    const completedAt = new Date().toISOString();
    const result: ClearanceRecord = complete
      ? {
          ...record,
          offices,
          referenceNumber: record.referenceNumber ?? referenceNumberFor(sequence++),
          completedAt: record.completedAt ?? completedAt,
        }
      : { ...record, offices, referenceNumber: undefined, completedAt: undefined };

    touched.add(record.studentId);
    for (const office of decided) {
      notifyQueue.push({ record: result, office, at: completedAt });
    }

    return result;
  });

  if (addedEvents.length > 0) {
    appendTimeline(addedEvents);
    writeRecords(next);
    announceClearanceChange("decision");
    for (const entry of notifyQueue) spec.notify?.(entry);
  }

  return {
    rows: scopeRows(deriveRows(next, period.overdueDays), null).filter((row) =>
      touched.has(row.studentId),
    ),
    snapshots,
  };
}

/**
 * Sign one request. Real API:
 *   PATCH /clearance/:studentId/offices/:officeId
 *   { status: "signed", signatureImage, signerName, respondedAt, reviewedBy }
 */
export async function approveRequest(
  requestId: string,
  input: ApproveInput & { signerName: string; staffId: string },
): Promise<DecisionOutcome> {
  if (input.draft.saveAs) {
    storeSignature(input.staffId, {
      imageBase64: input.draft.imageBase64,
      method: input.draft.method,
      label: input.draft.saveAs.label.trim() || input.signerName,
      isDefault: input.draft.saveAs.isDefault,
    });
  }

  const outcome = applyDecision({
    ids: [requestId],
    patch: (office) => ({
      ...office,
      status: "signed" as const,
      signerName: input.signerName,
      signatureImage: input.draft.imageBase64,
      respondedAt: new Date().toISOString(),
      remarks: undefined,
    }),
    event: ({ requestId: id, office, at }) => ({
      id: newId(),
      requestId: id,
      at,
      actor: input.signerName,
      type: "signed" as const,
      detail:
        input.internalRemarks?.trim() || `${OFFICE_LABELS[office]} signature applied.`,
    }),
    notify: ({ record, office }) => {
      pushStudentNotification(record.studentId, {
        message: isFullySigned(record.offices)
          ? "Your clearance is complete. You can now download your confirmation."
          : `${OFFICE_LABELS[office]} signed your clearance.`,
        type: "success",
        officeId: office,
      });
      pushActivity(
        studentActivity(
          record,
          office,
          input.signerName,
          "completed",
          `${OFFICE_LABELS[office]} clearance signed for ${record.studentName}`,
        ),
      );
    },
  });

  return wait(outcome, WRITE_DELAY);
}

/** Real API: `PATCH /clearance/:studentId/offices/:officeId` with remarks. */
export async function rejectRequest(
  requestId: string,
  input: { remarks: string; signerName: string },
): Promise<DecisionOutcome> {
  const outcome = applyDecision({
    ids: [requestId],
    patch: (office) => ({
      ...office,
      status: "rejected" as const,
      remarks: input.remarks,
      signerName: input.signerName,
      respondedAt: new Date().toISOString(),
    }),
    event: ({ requestId: id, at }) => ({
      id: newId(),
      requestId: id,
      at,
      actor: input.signerName,
      type: "rejected" as const,
      detail: input.remarks,
    }),
    notify: ({ record, office }) => {
      pushStudentNotification(record.studentId, {
        message: `${OFFICE_LABELS[office]} needs action: ${input.remarks}`,
        type: "warning",
        officeId: office,
      });
      pushActivity(
        studentActivity(
          record,
          office,
          input.signerName,
          "pending",
          `${OFFICE_LABELS[office]} returned ${record.studentName}'s request`,
        ),
      );
    },
  });

  return wait(outcome, WRITE_DELAY);
}

/** Admin only: sends a signed request back to the office queue. */
export async function revokeRequest(
  requestId: string,
  input: { reason: string; actorName: string },
): Promise<DecisionOutcome> {
  const outcome = applyDecision({
    ids: [requestId],
    patch: (office) => ({
      ...office,
      status: "requested" as const,
      signatureImage: undefined,
      signerName: undefined,
      respondedAt: undefined,
      remarks: undefined,
    }),
    event: ({ requestId: id, at }) => ({
      id: newId(),
      requestId: id,
      at,
      actor: input.actorName,
      type: "revoked" as const,
      detail: input.reason,
    }),
    notify: ({ record, office }) => {
      pushStudentNotification(record.studentId, {
        message: `${OFFICE_LABELS[office]} revoked the signature: ${input.reason}`,
        type: "warning",
        officeId: office,
      });
      pushActivity(
        studentActivity(
          record,
          office,
          input.actorName,
          "pending",
          `${OFFICE_LABELS[office]} signature revoked for ${record.studentName}`,
        ),
      );
    },
  });

  return wait(outcome, WRITE_DELAY);
}

/** Bulk sign with one of the staff member's saved signatures. */
export async function bulkApprove(
  requestIds: string[],
  input: { signatureId: string; staffId: string; signerName: string },
): Promise<DecisionOutcome> {
  const signature = readSavedSignatures(input.staffId).find(
    (entry) => entry.id === input.signatureId,
  );
  if (!signature) return wait({ rows: [], snapshots: [] }, WRITE_DELAY);

  const outcome = applyDecision({
    ids: requestIds,
    patch: (office) => ({
      ...office,
      status: "signed" as const,
      signerName: input.signerName,
      signatureImage: signature.imageBase64,
      respondedAt: new Date().toISOString(),
      remarks: undefined,
    }),
    event: ({ requestId: id, at }) => ({
      id: newId(),
      requestId: id,
      at,
      actor: input.signerName,
      type: "signed" as const,
      detail: `Signed with saved signature "${signature.label}".`,
    }),
    notify: ({ record, office }) => {
      pushStudentNotification(record.studentId, {
        message: isFullySigned(record.offices)
          ? "Your clearance is complete. You can now download your confirmation."
          : `${OFFICE_LABELS[office]} signed your clearance.`,
        type: "success",
        officeId: office,
      });
    },
  });

  return wait(outcome, WRITE_DELAY);
}

/** Bulk reject with one shared remark. */
export async function bulkReject(
  requestIds: string[],
  input: { remarks: string; signerName: string },
): Promise<DecisionOutcome> {
  const outcome = applyDecision({
    ids: requestIds,
    patch: (office) => ({
      ...office,
      status: "rejected" as const,
      remarks: input.remarks,
      signerName: input.signerName,
      respondedAt: new Date().toISOString(),
    }),
    event: ({ requestId: id, at }) => ({
      id: newId(),
      requestId: id,
      at,
      actor: input.signerName,
      type: "rejected" as const,
      detail: input.remarks,
    }),
    notify: ({ record, office }) => {
      pushStudentNotification(record.studentId, {
        message: `${OFFICE_LABELS[office]} needs action: ${input.remarks}`,
        type: "warning",
        officeId: office,
      });
    },
  });

  return wait(outcome, WRITE_DELAY);
}

/**
 * Replays stored snapshots — how the 8-second Undo reverts one decision or a
 * whole batch. Real API: `POST /clearance/decisions/:id/undo`.
 */
export async function undoDecision(
  snapshots: DecisionSnapshot[],
): Promise<ClearanceRequestRow[]> {
  const period = readPeriod();
  const records = readRecords();
  const byStudent = new Map<string, DecisionSnapshot[]>();

  for (const snapshot of snapshots) {
    const list = byStudent.get(snapshot.studentId) ?? [];
    list.push(snapshot);
    byStudent.set(snapshot.studentId, list);
  }

  const next = records.map((record) => {
    const restores = byStudent.get(record.studentId);
    if (!restores) return record;

    const offices = record.offices.slice();
    for (const restore of restores) {
      const index = offices.findIndex((office) => office.office === restore.office);
      if (index >= 0) offices[index] = { ...restore.previous };
    }

    const complete = isFullySigned(offices);
    return {
      ...record,
      offices,
      referenceNumber: complete
        ? record.referenceNumber
        : restores[0]?.previousReferenceNumber,
      completedAt: complete ? record.completedAt : restores[0]?.previousCompletedAt,
    };
  });

  removeTimeline(snapshots.map((snapshot) => snapshot.addedTimelineId));
  writeRecords(next);
  announceClearanceChange("undo");

  return wait(scopeRows(deriveRows(next, period.overdueDays), null), WRITE_DELAY);
}

