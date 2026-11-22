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
import { getStudentGrades } from "@/services/grades/records";
import { useSSE } from "@/hooks/useSSE";
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
  gradeAcknowledgementStatus: "loading" | "ready" | "needs_acknowledgement" | "unavailable";
  postedGradeCount: number;
  unacknowledgedGradeCount: number;
  refreshGradeAcknowledgement: () => Promise<void>;
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
  const [gradeAcknowledgementStatus, setGradeAcknowledgementStatus] = useState<ClearanceContextValue["gradeAcknowledgementStatus"]>("loading");
  const [postedGradeCount, setPostedGradeCount] = useState(0);
  const [unacknowledgedGradeCount, setUnacknowledgedGradeCount] = useState(0);
  const [highlightedOffice, setHighlightedOffice] = useState<OfficeId | null>(null);
  const highlightTimer = useRef<number | null>(null);
  const { notifications, removeLocalNotification } = useNotifications();
  const notificationListRef = useRef(notifications);
  notificationListRef.current = notifications;

  const removeResolvedLocalRequestNotices = useCallback((next: ClearanceState) => {
    for (const office of next.offices) {
      if (office.status === "requested") continue;
      const legacyMessages = new Set([
        `Request sent to ${office.label}`,
        `${office.label} request cancelled.`,
      ]);
      notificationListRef.current
        .filter((notification) => notification.local && notification.officeId === office.office && legacyMessages.has(notification.message))
        .forEach((notification) => removeLocalNotification(notification.id));
    }
  }, [removeLocalNotification]);

  const refreshGradeAcknowledgement = useCallback(async () => {
    if (user?.role !== "student") {
      setGradeAcknowledgementStatus("ready");
      setPostedGradeCount(0);
      setUnacknowledgedGradeCount(0);
      return;
    }
    try {
      const { records } = await getStudentGrades();
      const posted = records.filter((record) => Boolean(record.grade));
      const pending = posted.filter((record) => !record.acknowledgedAt).length;
      setPostedGradeCount(posted.length);
      setUnacknowledgedGradeCount(pending);
      setGradeAcknowledgementStatus(pending ? "needs_acknowledgement" : "ready");
    } catch {
      setGradeAcknowledgementStatus("unavailable");
    }
  }, [user?.id, user?.role]);
  useEffect(() => { void refreshGradeAcknowledgement(); }, [refreshGradeAcknowledgement]);
  useSSE((type) => {
    if (type === "connected" || type === "notification_created" || type === "notification_updated") {
      void refreshGradeAcknowledgement();
    }
  }, user?.role === "student", user?.id);

  const student = useMemo<StudentProfile>(() => {
    if (user && user.role === "student") {
      const snapshot = state.studentSnapshot;
      return {
        name: snapshot?.name || user.name || mockStudent.name,
        studentId: snapshot?.studentId || user.studentNumber || user.id || mockStudent.studentId,
        section: snapshot?.section || user.section || "",
        yearLevel: snapshot?.yearLevel ? `${snapshot.yearLevel} Year` : user.yearLevel ? `${user.yearLevel} Year` : mockStudent.yearLevel,
        course: snapshot?.course || user.course || mockStudent.course,
        program: snapshot?.program || canonicalProgram(user.course || mockStudent.program),
        academicYear: snapshot?.academicYear || mockStudent.academicYear,
        semester: snapshot?.semester || mockStudent.semester,
        term: snapshot?.term || mockStudent.term,
        graduating: mockStudent.graduating,
        date: new Date().toISOString().split("T")[0],
        referenceNumber: state.referenceNumber ?? mockStudent.referenceNumber,
      };
    }
    return {
      ...mockStudent,
      referenceNumber: state.referenceNumber ?? mockStudent.referenceNumber,
    };
  }, [user, state.referenceNumber, state.studentSnapshot]);

  // Initial fetch through the mock service.
  useEffect(() => {
    let active = true;
    getClearance()
      .then((next) => {
        if (active) {
          setState(next);
          removeResolvedLocalRequestNotices(next);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [removeResolvedLocalRequestNotices]);

  useEffect(() => {
    return () => {
      if (highlightTimer.current !== null) window.clearTimeout(highlightTimer.current);
    };
  }, []);

  // Refresh database-backed office decisions across separate devices.
  useEffect(() => {
    const refresh = () => {
      void getClearance()
        .then((next) => {
          setState(next);
          removeResolvedLocalRequestNotices(next);
        })
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
  }, [removeResolvedLocalRequestNotices]);

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
      if (officeId === "registrar" && gradeAcknowledgementStatus !== "ready") {
        showWarning("Acknowledge posted grades first", "Review and acknowledge posted grades before requesting the Registrar signature.");
        return;
      }
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
        showSuccess(
          "Signature request sent",
          `${office.label} will review your clearance and sign it digitally.`,
          { replaceKey: "student-clearance-signature-request" },
        );
      }
    },
    [gradeAcknowledgementStatus, state.periodOpen],
  );

  /** "Request All": one service call, one summary toast, one notification each. */
  const requestAll = useCallback(
    async (officeIds: OfficeId[]) => {
      if (officeIds.length === 0) return;
      officeIds = officeIds.filter((officeId) => officeId !== "registrar" || gradeAcknowledgementStatus === "ready");
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
      const sent = officeIds.length;
      showSuccess(
        sent === 1 ? "Signature request sent" : "Signature requests sent",
        sent === 1
          ? "1 office will review your clearance and sign it digitally."
          : `${sent} offices will review your clearance and sign it digitally.`,
      );
    },
    [gradeAcknowledgementStatus, state.periodOpen],
  );

  const cancelRequest = useCallback(
    async (officeId: OfficeId) => {
      const next = await cancelRequestService(officeId);
      setState(next);
      removeResolvedLocalRequestNotices(next);
      const office = findOffice(next, officeId);
      if (office) {
        showInfo(
          "Request cancelled",
          `${office.label} will no longer review this request. You can send it again anytime.`,
        );
      }
    },
    [removeResolvedLocalRequestNotices],
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
      gradeAcknowledgementStatus,
      postedGradeCount,
      unacknowledgedGradeCount,
      refreshGradeAcknowledgement,
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
      gradeAcknowledgementStatus,
      postedGradeCount,
      unacknowledgedGradeCount,
      refreshGradeAcknowledgement,
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
