/* eslint-disable react-refresh/only-export-components -- provider + hook intentionally share a module */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { showInfo, showSuccess, showWarning } from "@/lib/feedback";
import { canonicalProgram } from "@/lib/programs";
import { useAuth } from "@/components/context/useAuth";
import {
  CLEARANCE_CHANNEL_NAME,
  CLEARANCE_PERIOD_KEY,
  CLEARANCE_STORAGE_KEY,
} from "@/lib/clearanceStorage";
import { createInitialState, mockStudent } from "@/services/clearanceStudent/mock";
import {
  cancelRequest as cancelRequestService,
  getClearance,
  requestSignature as requestSignatureService,
  requestSignatures as requestSignaturesService,
} from "@/services/clearanceStudent/service";
import { useNotifications } from "@/components/features/student/clearance/NotificationContext";
import type {
  ClearanceHistoryItem,
  ClearanceState,
  OfficeId,
  OfficeSignature,
  StudentProfile,
} from "@/types/clearance";

type ClearanceContextValue = {
  student: StudentProfile;
  offices: OfficeSignature[];
  saoEvents: ClearanceState["saoEvents"];
  history: ClearanceHistoryItem[];
  dateCleared: string | null;
  referenceNumber: string;
  loading: boolean;
  isCleared: boolean;
  /** False while the admin keeps the clearance period closed (shared record). */
  periodOpen: boolean;
  requestSignature: (officeId: OfficeId, note?: string) => Promise<void>;
  requestAll: (officeIds: OfficeId[]) => Promise<void>;
  cancelRequest: (officeId: OfficeId) => Promise<void>;
  highlightedOffice: OfficeId | null;
  focusOffice: (officeId: OfficeId) => void;
};

const ClearanceContext = createContext<ClearanceContextValue | null>(null);

/** Shown wherever a request action is disabled while the period is closed. */
export const CLEARANCE_CLOSED_MESSAGE = "Clearance period is closed";

const findOffice = (state: ClearanceState, officeId: OfficeId): OfficeSignature | undefined =>
  state.offices.find((office) => office.office === officeId);

export function ClearanceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [state, setState] = useState<ClearanceState>(createInitialState);
  const [loading, setLoading] = useState(true);
  const [highlightedOffice, setHighlightedOffice] = useState<OfficeId | null>(null);
  const highlightTimer = useRef<number | null>(null);
  const { notify } = useNotifications();

  const student = useMemo<StudentProfile>(() => {
    if (user && user.role === "student") {
      return {
        name: user.name || mockStudent.name,
        studentId: user.studentNumber || user.id || mockStudent.studentId,
        yearLevel: user.yearLevel ? `${user.yearLevel}rd Year` : mockStudent.yearLevel,
        course: user.course || mockStudent.course,
        program: canonicalProgram(user.course || mockStudent.program),
        academicYear: mockStudent.academicYear,
        semester: mockStudent.semester,
        term: mockStudent.term,
        graduating: mockStudent.graduating,
        date: new Date().toISOString().split("T")[0],
        referenceNumber: state.referenceNumber ?? mockStudent.referenceNumber,
      };
    }
    return {
      ...mockStudent,
      referenceNumber: state.referenceNumber ?? mockStudent.referenceNumber,
    };
  }, [user, state.referenceNumber]);

  // Initial fetch through the mock service.
  useEffect(() => {
    let active = true;
    getClearance()
      .then((next) => {
        if (active) {
          setState(next);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (highlightTimer.current !== null) window.clearTimeout(highlightTimer.current);
    };
  }, []);

  // Refresh database-backed office decisions across separate devices.
  useEffect(() => {
    const refresh = () => {
      void getClearance()
        .then((next) => setState(next))
        .catch(() => {
          // Keep current state on error
        });
    };

    const onStorage = (event: StorageEvent) => {
      if (event.key !== CLEARANCE_STORAGE_KEY && event.key !== CLEARANCE_PERIOD_KEY) return;
      refresh();
    };

    let channel: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== "undefined") {
      channel = new BroadcastChannel(CLEARANCE_CHANNEL_NAME);
      channel.onmessage = () => {
        refresh();
      };
    }

    window.addEventListener("storage", onStorage);
    const poll = window.setInterval(refresh, 10000);
    return () => {
      window.clearInterval(poll);
      window.removeEventListener("storage", onStorage);
      channel?.close();
    };
  }, []);

  const isCleared = useMemo(
    () => state.offices.length === 5 && state.offices.every((office) => office.status === "signed"),
    [state.offices],
  );

  /**
   * Request flow: the modal calls this → the service flips the office to
   * "requested" and persists it → the notification appears in the bell and as
   * a toast → the card re-renders as "Awaiting Signature".
   *
   * (1) `period.open` is the admin's switch in the shared record; a closed
   * period never reaches the staff queue.
   */
  const requestSignature = useCallback(
    async (officeId: OfficeId, note?: string) => {
      if (!state.periodOpen) {
        showWarning(
          "Clearance period is closed",
          "Signature requests reopen when the next clearance window opens.",
        );
        return;
      }
      const next = await requestSignatureService(officeId, note);
      setState(next);
      const office = findOffice(next, officeId);
      if (office && office.status === "requested") {
        notify({
          message: `Request sent to ${office.label}`,
          type: "info",
          officeId,
          silent: true,
        });
        showSuccess(
          "Signature request sent",
          `${office.label} will review your clearance and sign it digitally.`,
          { replaceKey: "student-clearance-signature-request" },
        );
      }
    },
    [notify, state.periodOpen],
  );

  /** "Request All": one service call, one summary toast, one notification each. */
  const requestAll = useCallback(
    async (officeIds: OfficeId[]) => {
      if (officeIds.length === 0) return;
      if (!state.periodOpen) {
        showWarning(
          "Clearance period is closed",
          "Signature requests reopen when the next clearance window opens.",
        );
        return;
      }
      const next = await requestSignaturesService(officeIds);
      setState(next);
      officeIds.forEach((officeId) => {
        const office = findOffice(next, officeId);
        if (!office || office.status !== "requested") return;
        notify({
          message: `Request sent to ${office.label}`,
          type: "info",
          officeId,
          silent: true,
        });
      });
      const sent = officeIds.length;
      showSuccess(
        sent === 1 ? "Signature request sent" : "Signature requests sent",
        sent === 1
          ? "1 office will review your clearance and sign it digitally."
          : `${sent} offices will review your clearance and sign it digitally.`,
      );
    },
    [notify, state.periodOpen],
  );

  const cancelRequest = useCallback(
    async (officeId: OfficeId) => {
      const next = await cancelRequestService(officeId);
      setState(next);
      const office = findOffice(next, officeId);
      if (office) {
        notify({
          message: `${office.label} request cancelled.`,
          type: "warning",
          officeId,
          silent: true,
        });
        showInfo(
          "Request cancelled",
          `${office.label} will no longer review this request. You can send it again anytime.`,
        );
      }
    },
    [notify],
  );

  /**
   * Staff action → signature image + signer name are stored on the office.
   * The card displays the image, progress recomputes, and the final approval
   * unlocks the confirmation slip.
   */
  const focusOffice = useCallback((officeId: OfficeId) => {
    setHighlightedOffice(officeId);
    if (highlightTimer.current !== null) window.clearTimeout(highlightTimer.current);
    highlightTimer.current = window.setTimeout(() => setHighlightedOffice(null), 2600);
  }, []);

  const value = useMemo<ClearanceContextValue>(
    () => ({
      student,
      offices: state.offices,
      saoEvents: state.saoEvents,
      history: state.history,
      dateCleared: state.dateCleared,
      referenceNumber: state.referenceNumber ?? student.referenceNumber,
      loading,
      isCleared,
      periodOpen: state.periodOpen ?? true,
      requestSignature,
      requestAll,
      cancelRequest,
      highlightedOffice,
      focusOffice,
    }),
    [
      student,
      state,
      loading,
      isCleared,
      requestSignature,
      requestAll,
      cancelRequest,
      highlightedOffice,
      focusOffice,
    ],
  );

  return <ClearanceContext.Provider value={value}>{children}</ClearanceContext.Provider>;
}

export function useClearance(): ClearanceContextValue {
  const context = useContext(ClearanceContext);
  if (!context) {
    throw new Error("useClearance must be used inside a <ClearanceProvider>.");
  }
  return context;
}
