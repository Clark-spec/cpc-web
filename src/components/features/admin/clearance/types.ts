/**
 * Staff-side Online Clearance module types.
 *
 * The student-facing record types are canonical in
 * `@/types/clearance` (both portals persist the same
 * `cpc:clearance:records` array); this file re-exports them so the module has
 * one import point, and adds the queue/filter/KPI shapes only staff see.
 */
import type { RefObject } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { LucideIcon } from "lucide-react";
import type { AdminUser } from "@/types/admin";

export type {
  ClearancePeriod,
  ClearanceRecord,
  ClearanceRequestRow,
  OfficeCheckItem,
  OfficeId,
  OfficeSignature,
  RequestStatus,
  SavedSignature,
  SaoEvent,
  Subject,
  TimelineEvent,
} from "@/types/clearance";

export type { AppNotification } from "@/components/context/NotificationContext";

import type {
  ClearancePeriod,
  ClearanceRecord,
  ClearanceRequestRow,
  OfficeCheckItem,
  OfficeId,
  SavedSignature,
  TimelineEvent,
} from "@/types/clearance";

/** "All Offices" is only selectable by the admin role. */
export type OfficeFilter = OfficeId | "all";

export type StatusFilter = "requested" | "signed" | "rejected" | "all";

export type QueueSort = "oldest" | "newest" | "name";

export type QueueView = "table" | "board";

export type QueueFilters = {
  office: OfficeFilter;
  status: StatusFilter;
  query: string;
  section: string;
  from: string;
  to: string;
  overdueOnly: boolean;
  withNotesOnly: boolean;
  sort: QueueSort;
  view: QueueView;
  page: number;
  pageSize: number;
};

/** Every value that can arrive through the URL so filters stay shareable. */
export type FilterKey = Exclude<keyof QueueFilters, "page">;

export type KpiId =
  | "awaitingMine"
  | "signedToday"
  | "rejected"
  | "overdue"
  | "avgTurnaround";

export type KpiSet = {
  awaitingMine: number;
  signedToday: number;
  rejected: number;
  overdue: number;
  /** Days, one decimal — rendered as "1.8 days", not a count. */
  avgTurnaroundDays: number;
};

export type KpiCard = {
  id: KpiId;
  label: string;
  /** Displayed value; the turnaround card is a formatted string. */
  value: number;
  /** Raw number used by the count-up animation. */
  countTo: number;
  display?: string;
  icon: LucideIcon;
  /** Tinted circle behind the icon. */
  tone: string;
  trend: { direction: "up" | "down" | "flat"; label: string };
  /** Shown with an alert outline instead of color alone. */
  alert?: boolean;
  /** Applied when the card is clicked. */
  filter: Partial<QueueFilters>;
};

export type OfficeLoad = {
  office: OfficeId;
  label: string;
  pending: number;
  signed: number;
};

/** Signature handed to the approve flow, whichever tab produced it. */
export type SignatureDraft = {
  imageBase64: string;
  method: SavedSignature["method"];
  label?: string;
  /** Persist it for this staff member before signing. */
  saveAs?: { label: string; isDefault: boolean };
};

export type ApproveInput = {
  draft: SignatureDraft;
  /** Internal remarks — never shown to the student. */
  internalRemarks?: string;
};

export type NewSignatureInput = {
  imageBase64: string;
  method: SavedSignature["method"];
  label: string;
  isDefault: boolean;
};

/** One stroke on the draw canvas, in CSS pixels relative to the canvas. */
export type PadPoint = { x: number; y: number };

export type SignaturePadState = {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  hasInk: boolean;
  undoDisabled: boolean;
  start: (event: ReactPointerEvent<HTMLCanvasElement>) => void;
  move: (event: ReactPointerEvent<HTMLCanvasElement>) => void;
  end: (event: ReactPointerEvent<HTMLCanvasElement>) => void;
  undo: () => void;
  clear: () => void;
  /** Transparent PNG at natural DPI, or "" when the pad is blank. */
  exportPng: () => string;
  width: number;
  height: number;
};

/** Live sync status shown by LiveSyncIndicator. */
export type SyncStatus = {
  live: boolean;
  lastSyncedAt: string | null;
};

export type ClearanceAdminContextValue = {
  /* identity & scope */
  staff: AdminUser;
  isSuperAdmin: boolean;
  /** The office a staff member belongs to; null for the admin role. */
  homeOffice: OfficeId | null;
  /** The programs a department dean oversees; null for non-dean / admin roles. */
  homePrograms: string[] | null;

  /* data */
  records: ClearanceRecord[];
  /** Role-scoped rows, unfiltered, all statuses. */
  rows: ClearanceRequestRow[];
  /** After every filter + sort. */
  visibleRows: ClearanceRequestRow[];
  /** Current page slice of visibleRows. */
  pageRows: ClearanceRequestRow[];
  totalRows: number;
  totalPages: number;
  kpis: KpiSet;
  officeLoad: OfficeLoad[];
  period: ClearancePeriod;
  timeline: TimelineEvent[];

  /* selection */
  selectedRow: ClearanceRequestRow | null;
  selectedRecord: ClearanceRecord | null;
  selectedChecks: OfficeCheckItem[];
  selectedTimeline: TimelineEvent[];
  checkedIds: string[];

  /* signatures */
  savedSignatures: SavedSignature[];
  defaultSignature: SavedSignature | null;

  /* status */
  loading: boolean;
  refreshing: boolean;
  busy: boolean;
  error: string | null;
  sync: SyncStatus;

  /* filters */
  filters: QueueFilters;
  setFilter: <K extends keyof QueueFilters>(key: K, value: QueueFilters[K]) => void;
  setFilters: (patch: Partial<QueueFilters>) => void;
  resetFilters: () => void;
  hasActiveFilters: boolean;
  applyKpiFilter: (id: KpiId) => void;

  /* selection actions */
  selectRow: (id: string | null) => void;
  stepRequest: (delta: 1 | -1) => void;
  toggleChecked: (id: string) => void;
  toggleCheckedAll: () => void;
  clearChecked: () => void;

  /* mutations (each shows its own toast, with Undo where reversible) */
  approve: (row: ClearanceRequestRow, input: ApproveInput) => Promise<boolean>;
  reject: (row: ClearanceRequestRow, remarks: string) => Promise<boolean>;
  revoke: (row: ClearanceRequestRow, reason: string) => Promise<boolean>;
  bulkApprove: (signatureId: string) => Promise<boolean>;
  bulkReject: (remarks: string) => Promise<boolean>;

  /* signature library */
  addSignature: (input: NewSignatureInput) => Promise<SavedSignature | null>;
  renameSignature: (id: string, label: string) => Promise<void>;
  deleteSignature: (id: string) => Promise<void>;
  makeDefaultSignature: (id: string) => Promise<void>;

  /* period & reminders */
  setPeriod: (patch: Partial<ClearancePeriod>) => Promise<void>;
  sendReminders: () => Promise<number>;

  /* housekeeping */
  refresh: (reason?: "manual" | "student") => Promise<void>;
  simulateStudentRequest: () => Promise<void>;
  simulateStudentCancel: () => Promise<void>;
  resetDemo: () => Promise<void>;
};
