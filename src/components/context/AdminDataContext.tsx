/* eslint-disable react-refresh/only-export-components -- provider + hook intentionally share a module */
/**
 * Read-only shell data: dashboard, bell, sidebar badges and command palette.
 * Clearance decisions live in the clearance module's own context, which writes
 * the shared record store; this provider only re-reads it, on the `storage`
 * event and whenever the workspace calls `afterDecision()`.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { CLEARANCE_NOTIFICATIONS_KEY, CLEARANCE_STORAGE_KEY } from "@/lib/clearanceStorage";
import { ADMIN_NOTIFICATIONS_KEY } from "@/services/admin/storage";
import { useAdminAuth } from "@/components/context/AdminAuthContext";
import { PENDING_PROFILE_CORRECTIONS } from "@/components/features/admin/student-accounts/mockStudentAccounts";
import {
  generateSampleRequests as generateSampleRequestsService,
  getAdminNotifications,
  getClearanceRequests,
  getDashboardStats,
  getEnrollmentOverview,
  getRecentActivity,
  markNotificationsRead as markNotificationsReadService,
  resetDemoData as resetDemoDataService,
} from "@/services/admin";
import { deleteAdminNotification as deleteAdminNotificationService } from "@/services/admin/notifications";
import {
  deleteAdminNotificationApi,
  fetchAdminNotificationFeed,
  markAdminNotificationsReadApi,
} from "@/services/admin/notificationFeed";
import type {
  ActivityItem,
  AdminBadgeCounts,
  AdminNotification,
  ClearanceRequest,
  DashboardStats,
  EnrollmentOverviewRow,
} from "@/types/admin";

type LoadMode = "initial" | "refresh" | "silent";

type AdminDataState = {
  stats: DashboardStats | null;
  enrollment: EnrollmentOverviewRow[];
  activity: ActivityItem[];
  requests: ClearanceRequest[];
  notifications: AdminNotification[];
  lastUpdated: string | null;
};

type AdminDataContextValue = AdminDataState & {
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  badges: AdminBadgeCounts;
  unreadNotifications: number;
  /** Pending profile corrections, kept in sync by the corrections page. */
  profileCorrectionsCount: number;
  setProfileCorrectionsCount: (count: number) => void;
  refresh: () => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  deleteNotification: (id: string) => void;
  generateSamples: () => Promise<void>;
  resetDemo: () => Promise<void>;
};

const EMPTY_STATE: AdminDataState = {
  stats: null,
  enrollment: [],
  activity: [],
  requests: [],
  notifications: [],
  lastUpdated: null,
};

const AdminDataContext = createContext<AdminDataContextValue | null>(null);

const MIN_INITIAL_LOAD = 800;

export function AdminDataProvider({ children }: { children: ReactNode }) {
  const { user } = useAdminAuth();
  const [state, setState] = useState<AdminDataState>(EMPTY_STATE);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileCorrectionsCount, setProfileCorrectionsCount] = useState(
    PENDING_PROFILE_CORRECTIONS,
  );

  const loadNotifications = useCallback(async (): Promise<AdminNotification[]> => {
    try {
      return await fetchAdminNotificationFeed();
    } catch {
      // Backend unreachable: keep the demo bell working off local storage.
      return getAdminNotifications();
    }
  }, []);

  const load = useCallback(
    async (mode: LoadMode) => {
      if (!user) return;

      if (mode === "initial") setLoading(true);
      if (mode === "refresh") setRefreshing(true);
      setError(null);

      const started = Date.now();

      try {
        const [stats, enrollment, activity, requests, notifications] = await Promise.all([
          getDashboardStats(user),
          getEnrollmentOverview(),
          getRecentActivity(),
          getClearanceRequests(user),
          loadNotifications(),
        ]);

        // The brief skeleton makes the first paint feel like a real fetch.
        if (mode === "initial") {
          const elapsed = Date.now() - started;
          if (elapsed < MIN_INITIAL_LOAD) {
            await new Promise((resolve) =>
              window.setTimeout(resolve, MIN_INITIAL_LOAD - elapsed),
            );
          }
        }

        setState({
          stats,
          enrollment,
          activity,
          requests,
          notifications,
          lastUpdated: new Date().toISOString(),
        });
      } catch {
        setError("We couldn't load the admin data. Check your connection and try again.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [loadNotifications, user],
  );

  // Admin sessions use a bearer token, which EventSource cannot send, so the
  // staff bell polls the feed while the tab is visible.
  const syncNotifications = useCallback(async () => {
    try {
      const notifications = await fetchAdminNotificationFeed();
      setState((current) => ({ ...current, notifications }));
    } catch {
      // Keep the last known feed; the next tick retries.
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    const poll = () => {
      if (document.visibilityState === "visible") void syncNotifications();
    };
    const timer = window.setInterval(poll, 10_000);
    document.addEventListener("visibilitychange", poll);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", poll);
    };
  }, [syncNotifications, user]);

  useEffect(() => {
    // Initial fetch: the service is the external store, so this is the
    // sanctioned "subscribe on mount" case for this provider.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load("initial");
  }, [load]);

  // When the student requests/cancels a signature in another tab, refresh the
  // queue and every derived count without a page reload.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (
        event.key === CLEARANCE_STORAGE_KEY ||
        event.key === CLEARANCE_NOTIFICATIONS_KEY ||
        event.key === ADMIN_NOTIFICATIONS_KEY
      ) {
        void load("silent");
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [load]);

  const refresh = useCallback(async () => {
    await load("refresh");
  }, [load]);

  const markAllNotificationsRead = useCallback(async () => {
    try {
      await markAdminNotificationsReadApi();
    } catch {
      await markNotificationsReadService();
    }
    setState((current) => ({
      ...current,
      notifications: current.notifications.map((notification) => ({
        ...notification,
        read: true,
      })),
    }));
  }, []);

  const markNotificationRead = useCallback(async (id: string) => {
    try {
      await markAdminNotificationsReadApi([id]);
    } catch {
      await markNotificationsReadService([id]);
    }
    setState((current) => ({
      ...current,
      notifications: current.notifications.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification,
      ),
    }));
  }, []);

  const deleteNotification = useCallback((id: string) => {
    void deleteAdminNotificationApi(id).catch(() => {
      // Nothing to restore: the local copy is the fallback source.
    });
    deleteAdminNotificationService(id);
    setState((current) => ({
      ...current,
      notifications: current.notifications.filter((n) => n.id !== id),
    }));
  }, []);

  const generateSamples = useCallback(async () => {
    await generateSampleRequestsService();
    await load("silent");
  }, [load]);

  const resetDemo = useCallback(async () => {
    await resetDemoDataService();
    await load("initial");
  }, [load]);

  const badges = useMemo<AdminBadgeCounts>(
    () => ({
      enrollment: state.stats?.pendingEnrollments ?? 126,
      clearance: state.requests.filter((request) => request.status === "pending").length,
      complaints: state.stats?.activeComplaints ?? 12,
      profileCorrections: profileCorrectionsCount,
    }),
    [profileCorrectionsCount, state.requests, state.stats],
  );

  const unreadNotifications = useMemo(
    () => state.notifications.filter((notification) => !notification.read).length,
    [state.notifications],
  );

  const value = useMemo<AdminDataContextValue>(
    () => ({
      ...state,
      loading,
      refreshing,
      error,
      badges,
      unreadNotifications,
      profileCorrectionsCount,
      setProfileCorrectionsCount,
      refresh,
      markAllNotificationsRead,
      markNotificationRead,
      deleteNotification,
      generateSamples,
      resetDemo,
    }),
    [
      badges,
      error,
      generateSamples,
      loading,
      markAllNotificationsRead,
      markNotificationRead,
      deleteNotification,
      profileCorrectionsCount,
      refresh,
      refreshing,
      resetDemo,
      state,
      unreadNotifications,
    ],
  );

  return <AdminDataContext.Provider value={value}>{children}</AdminDataContext.Provider>;
}

export function useAdminData(): AdminDataContextValue {
  const context = useContext(AdminDataContext);
  if (!context) {
    throw new Error("useAdminData must be used inside an <AdminDataProvider>.");
  }
  return context;
}
