import { createInitialOffices, createInitialState, mockHistory, officeSignerNames } from "../data/mockClearance";
import { createDemoSignature } from "../lib/demoSignature";
import type {
  AppNotification,
  ClearanceState,
  OfficeId,
  OfficeSignature,
  RequestStatus,
} from "../types";

/**
 * Mock API layer for the Online Clearance feature.
 *
 * Every read/write of persisted state goes through this module. The functions
 * are async and add a small delay so the UI exercises its real loading states.
 * When the backend exists, only this file changes: swap the localStorage calls
 * for `fetch` and keep the same signatures.
 */

const CLEARANCE_KEY = "cpc.online-clearance.v1";
const NOTIFICATIONS_KEY = "cpc.online-clearance.notifications.v1";

/** Simulated network latency (ms). */
const READ_DELAY = 350;
const WRITE_DELAY = 700;

function wait<T>(value: T, ms: number): Promise<T> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(value), ms);
  });
}

function isOfficeId(value: unknown): value is OfficeId {
  return (
    value === "instructor" ||
    value === "dean" ||
    value === "library" ||
    value === "registrar" ||
    value === "accounting" ||
    value === "sao"
  );
}

const VALID_STATUSES: RequestStatus[] = ["not_requested", "requested", "signed", "rejected"];

function normalizeStatus(value: unknown): RequestStatus {
  return VALID_STATUSES.includes(value as RequestStatus)
    ? (value as RequestStatus)
    : "not_requested";
}

/**
 * Keeps a previously stored clearance compatible with the current shape: any
 * office missing from storage is restored as `not_requested`, and labels always
 * come from the mock data.
 */
function normalizeClearance(parsed: Partial<ClearanceState>): ClearanceState {
  const defaults = createInitialOffices();
  const stored = Array.isArray(parsed.offices) ? parsed.offices : [];

  const offices = defaults.map((fallback) => {
    const match = stored.find(
      (office): office is OfficeSignature =>
        typeof office === "object" &&
        office !== null &&
        isOfficeId((office as OfficeSignature).office) &&
        (office as OfficeSignature).office === fallback.office,
    );
    return match
      ? { ...fallback, ...match, status: normalizeStatus(match.status), label: fallback.label }
      : fallback;
  });

  return {
    offices,
    history: Array.isArray(parsed.history) ? parsed.history : mockHistory,
    dateCleared: typeof parsed.dateCleared === "string" ? parsed.dateCleared : null,
  };
}

function readClearance(): ClearanceState {
  try {
    const raw = window.localStorage.getItem(CLEARANCE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<ClearanceState>;
      if (parsed && Array.isArray(parsed.offices)) {
        return normalizeClearance(parsed);
      }
    }
  } catch {
    // Corrupt JSON or blocked storage: fall back to a fresh clearance.
  }
  return createInitialState();
}

function writeClearance(state: ClearanceState): void {
  try {
    window.localStorage.setItem(CLEARANCE_KEY, JSON.stringify(state));
  } catch {
    // Ignore quota / private-mode failures; the in-memory state still works.
  }
}

const isCleared = (offices: OfficeSignature[]): boolean =>
  offices.length > 0 && offices.every((office) => office.status === "signed");

/** Stamps (or clears) `dateCleared` in the same update as the offices. */
function withClearanceDate(state: ClearanceState): ClearanceState {
  const cleared = isCleared(state.offices);
  if (cleared && state.dateCleared === null) {
    return { ...state, dateCleared: new Date().toISOString() };
  }
  if (!cleared && state.dateCleared !== null) {
    return { ...state, dateCleared: null };
  }
  return state;
}

function replaceOffice(
  state: ClearanceState,
  officeId: OfficeId,
  patch: Partial<OfficeSignature>,
): ClearanceState {
  const offices = state.offices.map((office) =>
    office.office === officeId ? { ...office, ...patch } : office,
  );
  return withClearanceDate({ ...state, offices });
}

/** Loads the student's clearance (offices, history, date cleared). */
export async function getClearance(): Promise<ClearanceState> {
  return wait(readClearance(), READ_DELAY);
}

/**
 * Sends a signature request for one office.
 *
 * Student request → status "requested" + timestamp → the office card switches
 * to "Awaiting Signature" and the student cannot send a duplicate.
 */
export async function requestSignature(
  officeId: OfficeId,
  studentNote?: string,
): Promise<ClearanceState> {
  const state = readClearance();
  const current = state.offices.find((office) => office.office === officeId);
  if (!current || current.status === "requested" || current.status === "signed") {
    return wait(state, WRITE_DELAY);
  }

  const next = replaceOffice(state, officeId, {
    status: "requested",
    requestedAt: new Date().toISOString(),
    respondedAt: undefined,
    studentNote: studentNote?.trim() || undefined,
    remarks: undefined,
  });

  writeClearance(next);
  return wait(next, WRITE_DELAY);
}

/**
 * Bulk variant used by "Request All": one write, one network round-trip.
 * Offices that are already requested/signed are skipped.
 */
export async function requestSignatures(officeIds: OfficeId[]): Promise<ClearanceState> {
  let state = readClearance();
  const requestedAt = new Date().toISOString();

  for (const officeId of officeIds) {
    const current = state.offices.find((office) => office.office === officeId);
    if (!current || current.status === "requested" || current.status === "signed") continue;
    state = replaceOffice(state, officeId, {
      status: "requested",
      requestedAt,
      respondedAt: undefined,
      studentNote: undefined,
      remarks: undefined,
    });
  }

  writeClearance(state);
  return wait(state, WRITE_DELAY);
}

/** Withdraws a request that is still awaiting staff action. */
export async function cancelRequest(officeId: OfficeId): Promise<ClearanceState> {
  const state = readClearance();
  const current = state.offices.find((office) => office.office === officeId);
  if (!current || current.status !== "requested") {
    return wait(state, WRITE_DELAY);
  }

  const next = replaceOffice(state, officeId, {
    status: "not_requested",
    requestedAt: undefined,
    respondedAt: undefined,
    studentNote: undefined,
  });

  writeClearance(next);
  return wait(next, WRITE_DELAY);
}

/**
 * DEMO ONLY — stands in for the staff/admin side.
 *
 * STAFF-SIDE INTEGRATION POINT: the real staff app will call something like
 *   PATCH /clearance/:studentId/offices/:officeId
 *   { status: "signed", signerName, signatureImage, respondedAt }
 * and the student page will simply read the updated clearance. Nothing in the
 * student UI needs to change: the signature image is stored on the office and
 * rendered on the card / PDF.
 */
export async function demoApprove(officeId: OfficeId): Promise<ClearanceState> {
  const state = readClearance();
  const current = state.offices.find((office) => office.office === officeId);
  if (!current || current.status !== "requested") {
    return wait(state, WRITE_DELAY);
  }

  const signerName = officeSignerNames[officeId];
  // Placeholder image; a real staff upload would arrive as base64/SVG/URL.
  const signatureImage = await createDemoSignature(signerName);

  const next = replaceOffice(state, officeId, {
    status: "signed",
    signerName,
    signatureImage,
    respondedAt: new Date().toISOString(),
    remarks: undefined,
  });

  writeClearance(next);
  return wait(next, WRITE_DELAY);
}

/** DEMO ONLY — staff rejects the request with a reason for the student. */
export async function demoReject(
  officeId: OfficeId,
  remarks: string,
): Promise<ClearanceState> {
  const state = readClearance();
  const current = state.offices.find((office) => office.office === officeId);
  if (!current || current.status !== "requested") {
    return wait(state, WRITE_DELAY);
  }

  const next = replaceOffice(state, officeId, {
    status: "rejected",
    remarks: remarks.trim() || "Please complete the missing requirement and request again.",
    respondedAt: new Date().toISOString(),
    signerName: officeSignerNames[officeId],
  });

  writeClearance(next);
  return wait(next, WRITE_DELAY);
}

/** Clears every stored key and returns the seed clearance. */
export async function resetClearance(): Promise<ClearanceState> {
  try {
    window.localStorage.removeItem(CLEARANCE_KEY);
    window.localStorage.removeItem(NOTIFICATIONS_KEY);
  } catch {
    // Ignore storage failures.
  }
  return wait(createInitialState(), WRITE_DELAY);
}

/** Reads persisted notifications, newest first. */
export async function getNotifications(): Promise<AppNotification[]> {
  try {
    const raw = window.localStorage.getItem(NOTIFICATIONS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        return wait(
          parsed
            .filter(
              (item): item is AppNotification =>
                typeof item === "object" &&
                item !== null &&
                typeof (item as AppNotification).message === "string" &&
                typeof (item as AppNotification).createdAt === "string",
            )
            .sort(
              (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
            )
            .slice(0, 30),
          READ_DELAY,
        );
      }
    }
  } catch {
    // Corrupt notifications: start empty.
  }
  return wait([], READ_DELAY);
}

/** Persists the notification list (staff-side events will reuse this shape). */
export async function saveNotifications(notifications: AppNotification[]): Promise<void> {
  try {
    window.localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications.slice(0, 30)));
  } catch {
    // Ignore storage failures.
  }
}
