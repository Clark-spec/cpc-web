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
import {
  getClearanceRequests,
  getDashboardStats,
  getEnrollmentOverview,
  getRecentActivity,
  getPendingEnrollmentSignatureCount,
} from "@/services/admin";
import { normalizeDepartment } from "@/services/enrollmentWorkflow/service";
import type { DepartmentCode } from "@/types/enrollmentWorkflow";
import {
  deleteAllAdminNotificationsApi,
  deleteAdminNotificationApi,
  fetchAdminNotificationFeed,
  markAdminNotificationsReadApi,
} from "@/services/admin/notificationFeed";
import type {
  ActivityItem,
  AdminBadgeCounts,
  AdminNotification,
  AdminRole,
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
  deleteAllNotifications: () => Promise<void>;
};

export function isNotificationVisibleToRole(
  notification: AdminNotification,
  role: AdminRole,
): boolean {
  // The backend returns a staff member's own feed, so office notifications
  // (including department-scoped Dean requests) are already targeted before
  // they reach this client.
  if (notification.source === "clearance" || notification.source === "enrollment-signature") return true;

  // A clearance notification belongs to exactly one staff account — even the
  // global roles must not see another office's request. Other modules keep
  // their existing role visibility rules.
  if (
    notification.source === "clearance" &&
    notification.targetRole &&
    notification.targetRole !== role
  ) {
    return false;
  }

  // Global roles see untargeted administrative notifications.
  if (role === "admin" || role === "registrar") {
    return true;
  }

  if (notification.targetRole) return notification.targetRole === role;

  // Deans: strictly filtered to their own department!
  if (role === "dean_cs" || role === "dean_edu" || role === "dean_hm") {
    const userDept: DepartmentCode =
      role === "dean_cs" ? "BSIT" : role === "dean_edu" ? "BEED" : "BSHM";

    // Local notifications may target a dean by department.
    if (notification.department) {
      const notifDept = normalizeDepartment(notification.department);
      return notifDept === userDept;
    }

    return false;
  }

  return false;
}

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
  const [profileCorrectionsCount, setProfileCorrectionsCount] = useState(0);

  const loadNotifications = useCallback(async (): Promise<AdminNotification[]> => {
    try {
      return await fetchAdminNotificationFeed();
    } catch {
      return [];
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
      try {
        const notifications = await fetchAdminNotificationFeed();
        setState((current) => ({ ...current, notifications }));
      } catch {
        setState((current) => ({ ...current, notifications: [] }));
      }
    } catch {
      // Keep the last known feed; the next tick retries.
    }
  }, []);

  const syncClearanceRequests = useCallback(async () => {
    if (!user) return;
    try {
      const [requests, pendingEnrollments] = await Promise.all([
        getClearanceRequests(user),
        getPendingEnrollmentSignatureCount(user),
      ]);
      setState((current) => ({
        ...current,
        requests,
        stats: current.stats
          ? {
              ...current.stats,
              pendingEnrollments,
              stats: current.stats.stats.map((item) => item.id === "enrollments"
                ? { ...item, value: pendingEnrollments, sparkline: Array(7).fill(pendingEnrollments) as number[] }
                : item),
            }
          : current.stats,
      }));
    } catch {
      // Keep the current count while offline; the next visible poll retries.
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const poll = () => {
      if (document.visibilityState === "visible") {
        void syncNotifications();
        void syncClearanceRequests();
      }
    };
    const timer = window.setInterval(poll, 10_000);
    document.addEventListener("visibilitychange", poll);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", poll);
    };
  }, [syncClearanceRequests, syncNotifications, user]);

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
    const onCustomAdmin = () => {
      void load("silent");
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("cpc:admin:notification", onCustomAdmin);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("cpc:admin:notification", onCustomAdmin);
    };
  }, [load]);

  const refresh = useCallback(async () => {
    await load("refresh");
  }, [load]);

  const filteredNotifications = useMemo(() => {
    if (!user) return state.notifications;
    return state.notifications.filter((n) => isNotificationVisibleToRole(n, user.role));
  }, [state.notifications, user]);

  const markAllNotificationsRead = useCallback(async () => {
    const idsToMark = filteredNotifications.map((n) => n.id);
    try {
      await markAdminNotificationsReadApi(idsToMark);
    } catch {
      // Keep the server feed authoritative when offline.
    }
    setState((current) => ({
      ...current,
      notifications: current.notifications.map((notification) =>
        idsToMark.includes(notification.id)
          ? { ...notification, read: true }
          : notification,
      ),
    }));
  }, [filteredNotifications]);

  const markNotificationRead = useCallback(async (id: string) => {
    try {
      await markAdminNotificationsReadApi([id]);
    } catch {
      // Keep the server feed authoritative when offline.
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
    setState((current) => ({
      ...current,
      notifications: current.notifications.filter((n) => n.id !== id),
    }));
  }, []);

  const deleteAllNotifications = useCallback(async () => {
    await deleteAllAdminNotificationsApi();
    setState((current) => ({ ...current, notifications: [] }));
  }, []);

  const badges = useMemo<AdminBadgeCounts>(
    () => ({
      enrollment: state.stats?.pendingEnrollments ?? 0,
      clearance: state.requests.filter((request) => request.status === "pending").length,
      complaints: state.stats?.activeComplaints ?? 0,
      profileCorrections: profileCorrectionsCount,
    }),
    [profileCorrectionsCount, state.requests, state.stats],
  );

  const unreadNotifications = useMemo(
    () => filteredNotifications.filter((notification) => !notification.read).length,
    [filteredNotifications],
  );

  const value = useMemo<AdminDataContextValue>(
    () => ({
      ...state,
      notifications: filteredNotifications,
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
      deleteAllNotifications,
    }),
    [
      badges,
      error,
      filteredNotifications,
      loading,
      markAllNotificationsRead,
      markNotificationRead,
      deleteNotification,
      deleteAllNotifications,
      profileCorrectionsCount,
      refresh,
      refreshing,
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
