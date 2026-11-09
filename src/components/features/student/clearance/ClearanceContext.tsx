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
import { useToast } from "@/components/ui/toast";
import { CLEARANCE_PERIOD_KEY, CLEARANCE_STORAGE_KEY } from "@/lib/clearanceStorage";
import { createInitialState, mockStudent } from "@/services/clearanceStudent/mock";
import { useLocalStorage } from "@/lib/useLocalStorage";
import {
  cancelRequest as cancelRequestService,
  demoApprove as demoApproveService,
  demoReject as demoRejectService,
  getClearance,
  requestSignature as requestSignatureService,
  requestSignatures as requestSignaturesService,
  resetClearance as resetClearanceService,
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
  history: ClearanceHistoryItem[];
  dateCleared: string | null;
  referenceNumber: string;
  loading: boolean;
  isCleared: boolean;
  /** False while the admin keeps the clearance period closed (shared record). */
  periodOpen: boolean;
  demoMode: boolean;
  toggleDemoMode: () => void;
  requestSignature: (officeId: OfficeId, note?: string) => Promise<void>;
  requestAll: (officeIds: OfficeId[]) => Promise<void>;
  cancelRequest: (officeId: OfficeId) => Promise<void>;
  /** Demo staff panel actions (stand in for the admin side). */
  demoApprove: (officeId: OfficeId) => Promise<void>;
  demoReject: (officeId: OfficeId, remarks: string) => Promise<void>;
  resetDemo: () => Promise<void>;
  highlightedOffice: OfficeId | null;
  focusOffice: (officeId: OfficeId) => void;
};

const ClearanceContext = createContext<ClearanceContextValue | null>(null);

const DEMO_MODE_KEY = "cpc.online-clearance.demo-mode";

/** Shown wherever a request action is disabled while the period is closed. */
export const CLEARANCE_CLOSED_MESSAGE = "Clearance period is closed";

const findOffice = (state: ClearanceState, officeId: OfficeId): OfficeSignature | undefined =>
  state.offices.find((office) => office.office === officeId);

export function ClearanceProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ClearanceState>(createInitialState);
  const [loading, setLoading] = useState(true);
  // Demo mode survives a reload so testers do not have to toggle it again.
  const [demoMode, setDemoMode] = useLocalStorage<boolean>(DEMO_MODE_KEY, false);
  const [highlightedOffice, setHighlightedOffice] = useState<OfficeId | null>(null);
  const highlightTimer = useRef<number | null>(null);
  const { toast } = useToast();
  const { notify, resetNotifications } = useNotifications();

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

  // Admin/staff signatures and the period switch are written to the same keys
  // from another tab.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== CLEARANCE_STORAGE_KEY && event.key !== CLEARANCE_PERIOD_KEY) return;
      void getClearance()
        .then((next) => setState(next))
        .catch(() => {
          // Keep the current state if the cross-tab read fails.
        });
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const isCleared = useMemo(
    () => state.offices.length > 0 && state.offices.every((office) => office.status === "signed"),
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
        toast(CLEARANCE_CLOSED_MESSAGE, "warning");
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
        });
      }
    },
    [notify, state.periodOpen, toast],
  );

  /** "Request All": one service call, one summary toast, one notification each. */
  const requestAll = useCallback(
    async (officeIds: OfficeId[]) => {
      if (officeIds.length === 0) return;
      if (!state.periodOpen) {
        toast(CLEARANCE_CLOSED_MESSAGE, "warning");
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
      toast(
        officeIds.length === 1
          ? "1 signature request sent."
          : `${officeIds.length} signature requests sent.`,
        "success",
      );
    },
    [notify, state.periodOpen, toast],
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
        });
      }
    },
    [notify],
  );

  /**
   * Staff action → signature image + signer name are stored on the office.
   * The card displays the image, progress recomputes, and the final approval
   * unlocks the confirmation slip.
   */
  const demoApprove = useCallback(
    async (officeId: OfficeId) => {
      const next = await demoApproveService(officeId);
      setState(next);
      const office = findOffice(next, officeId);
      if (!office) return;

      notify({
        message: `${office.label} signed your clearance.`,
        type: "success",
        officeId,
      });

      if (next.offices.every((item) => item.status === "signed")) {
        notify({
          message: "Your clearance is complete. You can now download your confirmation.",
          type: "success",
        });
      }
    },
    [notify],
  );

  const demoReject = useCallback(
    async (officeId: OfficeId, remarks: string) => {
      const next = await demoRejectService(officeId, remarks);
      setState(next);
      const office = findOffice(next, officeId);
      if (office) {
        notify({
          message: `${office.label} needs action: ${office.remarks ?? remarks}`,
          type: "warning",
          officeId,
        });
      }
    },
    [notify],
  );

  const resetDemo = useCallback(async () => {
    const next = await resetClearanceService();
    setState(next);
    resetNotifications();
    setDemoMode(false);
    toast("Demo data reset. Everything is back to the initial state.", "info");
  }, [resetNotifications, setDemoMode, toast]);

  const toggleDemoMode = useCallback(() => {
    // Compute the next value before updating so the toast is not dispatched
    // from inside a state updater (React warns about that).
    const next = !demoMode;
    setDemoMode(next);
    toast(next ? "Demo mode on — staff actions are now available." : "Demo mode off.", "info");
  }, [demoMode, setDemoMode, toast]);

  const focusOffice = useCallback((officeId: OfficeId) => {
    setHighlightedOffice(officeId);
    if (highlightTimer.current !== null) window.clearTimeout(highlightTimer.current);
    highlightTimer.current = window.setTimeout(() => setHighlightedOffice(null), 2600);
  }, []);

  const value = useMemo<ClearanceContextValue>(
    () => ({
      student: mockStudent,
      offices: state.offices,
      history: state.history,
      dateCleared: state.dateCleared,
      referenceNumber: state.referenceNumber ?? mockStudent.referenceNumber,
      loading,
      isCleared,
      periodOpen: state.periodOpen ?? true,
      demoMode,
      toggleDemoMode,
      requestSignature,
      requestAll,
      cancelRequest,
      demoApprove,
      demoReject,
      resetDemo,
      highlightedOffice,
      focusOffice,
    }),
    [
      state,
      loading,
      isCleared,
      demoMode,
      toggleDemoMode,
      requestSignature,
      requestAll,
      cancelRequest,
      demoApprove,
      demoReject,
      resetDemo,
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
