import type { ClearanceRequestRow, OfficeId, OfficeSignature } from "@/types/clearance";
import type { ApproveInput } from "@/components/features/admin/clearance/types";
import { readSavedSignatures } from "./storage";
import { saveClearanceDecision } from "./database";

export type DecisionSnapshot = {
  requestId: string;
  studentId: string;
  office: OfficeId;
  previous: OfficeSignature;
  previousReferenceNumber?: string;
  previousCompletedAt?: string;
  addedTimelineId: string;
};
export type DecisionOutcome = { rows: ClearanceRequestRow[]; snapshots: DecisionSnapshot[] };
const emptyOutcome = (): DecisionOutcome => ({ rows: [], snapshots: [] });

export function parseRowId(id: string): { studentId: string; office: OfficeId } | null {
  const sep = id.lastIndexOf(":");
  if (sep < 1) return null;
  const office = id.slice(sep + 1) as OfficeId;
  if (!["dean", "sao", "library", "accounting", "registrar"].includes(office)) return null;
  return { studentId: id.slice(0, sep), office };
}

export async function approveRequest(requestId: string, input: ApproveInput & { signerName: string }): Promise<DecisionOutcome> {
  const parsed = parseRowId(requestId);
  if (!parsed) throw new Error("Invalid clearance request.");
  await saveClearanceDecision(parsed.studentId, parsed.office, { action: "sign", signerName: input.signerName, signatureImage: input.draft.imageBase64, remarks: input.internalRemarks });
  return emptyOutcome();
}
export async function rejectRequest(requestId: string, input: { remarks: string; signerName: string }): Promise<DecisionOutcome> {
  const parsed = parseRowId(requestId);
  if (!parsed) throw new Error("Invalid clearance request.");
  await saveClearanceDecision(parsed.studentId, parsed.office, { action: "reject", signerName: input.signerName, remarks: input.remarks });
  return emptyOutcome();
}
export async function revokeRequest(requestId: string, input: { reason: string; actorName: string }): Promise<DecisionOutcome> {
  const parsed = parseRowId(requestId);
  if (!parsed) throw new Error("Invalid clearance request.");
  await saveClearanceDecision(parsed.studentId, parsed.office, { action: "revoke", signerName: input.actorName, remarks: input.reason });
  return emptyOutcome();
}
export async function bulkApprove(requestIds: string[], input: { signatureId: string; staffId: string; signerName: string }): Promise<DecisionOutcome> {
  const signature = readSavedSignatures(input.staffId).find((entry) => entry.id === input.signatureId);
  if (!signature) throw new Error("Select a saved signature first.");
  for (const id of requestIds) {
    const parsed = parseRowId(id);
    if (parsed) await saveClearanceDecision(parsed.studentId, parsed.office, { action: "sign", signerName: input.signerName, signatureImage: signature.imageBase64 });
  }
  return emptyOutcome();
}
export async function bulkReject(requestIds: string[], input: { remarks: string; signerName: string }): Promise<DecisionOutcome> {
  for (const id of requestIds) {
    const parsed = parseRowId(id);
    if (parsed) await saveClearanceDecision(parsed.studentId, parsed.office, { action: "reject", signerName: input.signerName, remarks: input.remarks });
  }
  return emptyOutcome();
}
/** Undo history is not persisted by this database workflow. */
export async function undoDecision(_snapshots: DecisionSnapshot[]): Promise<ClearanceRequestRow[]> { return []; }
