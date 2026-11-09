import {
  CLEARANCE_PERIOD_KEY,
  CLEARANCE_RECORDS_KEY,
  CLEARANCE_TIMELINE_KEY,
  studentNotificationsKey,
} from "@/lib/clearanceStorage";
import type {
  ClearanceRequestRow,
  OfficeId,
} from "@/types/clearance";
import { OFFICE_LABELS } from "@/components/features/admin/clearance/officeChecks";
import {
  DEFAULT_PERIOD,
  WRITE_DELAY,
  announceClearanceChange,
  newId,
  wait,
  writeJson,
} from "./primitives";
import { NOTE_LINES, seedRecords, seedTimeline } from "./seed";
import {
  appendTimeline,
  pushActivity,
  pushAdminNotification,
  pushStudentNotification,
  queueHref,
  readPeriod,
  readRecords,
  studentActivity,
  writeRecords,
} from "./storage";
import { deriveRows } from "./calculations";
import { parseRowId } from "./decisions";

/**
 * Real API: `POST /clearance/reminders`. Nudges every office still holding
 * work and re-notifies students whose request is past the SLA.
 */
export async function sendReminders(staffName: string): Promise<number> {
  const period = readPeriod();
  const rows = deriveRows(readRecords(), period.overdueDays).filter(
    (row) => row.status === "requested",
  );

  const byOffice = new Map<OfficeId, ClearanceRequestRow[]>();
  for (const row of rows) {
    const list = byOffice.get(row.office) ?? [];
    list.push(row);
    byOffice.set(row.office, list);
  }

  for (const [office, officeRows] of byOffice) {
    pushAdminNotification(
      `Reminder sent to ${OFFICE_LABELS[office]}: ${officeRows.length} request${
        officeRows.length === 1 ? "" : "s"
      } still awaiting signature.`,
      "info",
      `/admin/clearance-requests?office=${office}&status=requested`,
    );
  }

  for (const row of rows.filter((entry) => entry.isOverdue)) {
    pushStudentNotification(row.studentId, {
      message: `${OFFICE_LABELS[row.office]} is still reviewing your request (${row.section}).`,
      type: "warning",
      officeId: row.office,
    });
  }

  pushActivity({
    id: newId(),
    type: "clearance",
    message: `Reminders sent to ${byOffice.size} offices`,
    actor: staffName,
    status: "published",
    createdAt: new Date().toISOString(),
    href: "/admin/clearance-requests",
  });

  announceClearanceChange("reminders");
  return wait(byOffice.size, WRITE_DELAY);
}

/** Real API: the student's own `POST /clearance/:studentId/offices`. */
export async function simulateStudentRequest(
  studentId?: string,
  office?: OfficeId,
): Promise<ClearanceRequestRow | null> {
  const period = readPeriod();
  const records = readRecords();
  const record =
    records.find((entry) => entry.studentId === studentId) ??
    records.filter((entry) =>
      entry.offices.some(
        (officeEntry) =>
          officeEntry.status === "not_requested" || officeEntry.status === "rejected",
      ),
    )[Math.floor(Math.random() * 40)] ??
    records[0];

  if (!record) return wait(null, WRITE_DELAY);

  const target =
    record.offices.find(
      (officeEntry) =>
        (!office || officeEntry.office === office) &&
        (officeEntry.status === "not_requested" || officeEntry.status === "rejected"),
    ) ?? record.offices.find((officeEntry) => officeEntry.status !== "signed");

  if (!target) return wait(null, WRITE_DELAY);

  const wasRejected = target.status === "rejected";
  const now = new Date().toISOString();
  const note = NOTE_LINES[Math.floor(Math.random() * NOTE_LINES.length)];

  const next = records.map((entry) =>
    entry.studentId !== record.studentId
      ? entry
      : {
          ...entry,
          offices: entry.offices.map((officeEntry) =>
            officeEntry.office !== target.office
              ? officeEntry
              : {
                  ...officeEntry,
                  status: "requested" as const,
                  requestedAt: now,
                  respondedAt: undefined,
                  remarks: undefined,
                  signerName: undefined,
                  signatureImage: undefined,
                  studentNote: note,
                },
          ),
        },
  );

  const requestId = `${record.studentId}:${target.office}`;
  appendTimeline([
    {
      id: newId(),
      requestId,
      at: now,
      actor: record.studentName,
      type: wasRejected ? "reopened" : "requested",
      detail: note,
    },
  ]);
  writeRecords(next);

  pushAdminNotification(
    `New request from ${record.studentName} (${record.section}) to ${OFFICE_LABELS[target.office]}`,
    "info",
    queueHref(requestId),
  );
  pushActivity(
    studentActivity(
      record,
      target.office,
      record.studentName,
      "new",
      `New clearance request from ${record.studentName} to ${OFFICE_LABELS[target.office]}`,
    ),
  );
  announceClearanceChange("student-request");

  const row = deriveRows(next, period.overdueDays).find(
    (entry) => entry.id === requestId,
  );

  return wait(row ?? null, WRITE_DELAY);
}

/** Real API: the student's own `DELETE /clearance/:studentId/offices/:office`. */
export async function simulateStudentCancel(
  requestId: string,
): Promise<boolean> {
  const parsed = parseRowId(requestId);
  if (!parsed) return wait(false, WRITE_DELAY);

  const records = readRecords();
  const record = records.find((entry) => entry.studentId === parsed.studentId);
  const office = record?.offices.find((entry) => entry.office === parsed.office);
  if (!record || !office || office.status !== "requested") {
    return wait(false, WRITE_DELAY);
  }

  const next = records.map((entry) =>
    entry.studentId !== record.studentId
      ? entry
      : {
          ...entry,
          offices: entry.offices.map((officeEntry) =>
            officeEntry.office !== parsed.office
              ? officeEntry
              : {
                  ...officeEntry,
                  status: "not_requested" as const,
                  requestedAt: undefined,
                  respondedAt: undefined,
                  studentNote: undefined,
                  remarks: undefined,
                },
          ),
        },
  );

  appendTimeline([
    {
      id: newId(),
      requestId,
      at: new Date().toISOString(),
      actor: record.studentName,
      type: "cancelled",
    },
  ]);
  writeRecords(next);
  pushAdminNotification(
    `${record.studentName} cancelled a ${OFFICE_LABELS[parsed.office]} request`,
    "info",
    "/admin/clearance-requests",
  );
  announceClearanceChange("student-cancel");

  return wait(true, WRITE_DELAY);
}

/** Wipes every clearance key and re-seeds from scratch. */
export async function resetClearanceDemo(): Promise<ClearanceRequestRow[]> {
  const records = seedRecords();
  writeJson(CLEARANCE_RECORDS_KEY, records);
  writeJson(CLEARANCE_TIMELINE_KEY, seedTimeline(records));
  writeJson(CLEARANCE_PERIOD_KEY, DEFAULT_PERIOD);

  for (const record of records) {
    window.localStorage.removeItem(studentNotificationsKey(record.studentId));
  }

  announceClearanceChange("reset");
  return wait(deriveRows(records, DEFAULT_PERIOD.overdueDays), WRITE_DELAY);
}

