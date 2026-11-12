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
import {
  fetchNotificationsApi,
  markNotificationReadApi,
  markAllNotificationsReadApi,
  deleteNotificationApi,
  deleteAllNotificationsApi,
} from "@/services/notifications";
import { useSSE } from "@/hooks/useSSE";

export type NotificationType = "info" | "success" | "warning";

/**
 * One notification in the student-portal feed. `officeId` is an optional
 * feature-specific target (the clearance bell uses it to scroll to an office);
 * profile notifications leave it undefined.
 */
export interface AppNotification {
  id: string;
  message: string;
  type: NotificationType;
  /** ISO date-time. */
  createdAt: string;
  read: boolean;
  officeId?: string;
  href?: string;
}

export type NotifyInput = {
  message: string;
  type?: NotificationType;
  officeId?: string;
  href?: string;
  /** Skip the toast when several notifications are created at once. */
  silent?: boolean;
};

export type NotificationContextValue = {
  notifications: AppNotification[];
  unreadCount: number;
  isLoading: boolean;
  /** Adds a notification (newest first), persists it and shows a toast. */
  notify: (input: NotifyInput) => void;
  markAllRead: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  deleteAllNotifications: () => Promise<void>;
  /** Clears the list (used by "Reset demo"). */
  resetNotifications: () => void;
  refresh: () => Promise<void>;
};

const NotificationContext = createContext<NotificationContextValue | null>(null);

const MAX_NOTIFICATIONS = 50;
const DEFAULT_STORAGE_KEY = "cpc:notifications:student";

function isNotification(value: unknown): value is AppNotification {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<AppNotification>;
  return typeof candidate.message === "string" && typeof candidate.createdAt === "string";
}

function readStored(key: string): AppNotification[] {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isNotification).slice(0, MAX_NOTIFICATIONS);
  } catch {
    return [];
  }
}

type NotificationProviderProps = {
  children: ReactNode;
  /** Optional storage key for offline fallback. Defaults to shared key. */
  storageKey?: string;
};

/**
 * Shared notification feed for the student portal. Connects to backend notifications
 * API and synchronizes in real time via Server-Sent Events (SSE).
 */
export function NotificationProvider({
  children,
  storageKey = DEFAULT_STORAGE_KEY,
}: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<AppNotification[]>(() => readStored(storageKey));
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { toast } = useToast();
  const skipPersist = useRef(false);

  // Sync to localStorage as offline cache
  useEffect(() => {
    if (skipPersist.current) {
      skipPersist.current = false;
      return;
    }
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(notifications.slice(0, MAX_NOTIFICATIONS)));
    } catch {
      // Ignore storage failures
    }
  }, [notifications, storageKey]);

  // Load from real backend endpoint
  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchNotificationsApi();
      if (Array.isArray(data.notifications)) {
        setNotifications(data.notifications);
      }
    } catch {
      // Offline fallback: keep existing stored items
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Real-time synchronization via Server-Sent Events (SSE)
  useSSE(
    useCallback((type) => {
      if (
        type === "notification_updated" ||
        type === "notification_created" ||
        type === "service_request_updated" ||
        type === "profile_updated"
      ) {
        fetchNotificationsApi()
          .then((res) => {
            if (Array.isArray(res.notifications)) {
              setNotifications(res.notifications);
            }
          })
          .catch(() => {});
      }
    }, []),
    true,
  );

  const notify = useCallback(
    ({ message, type = "info", officeId, href, silent = false }: NotifyInput) => {
      const notification: AppNotification = {
        id: crypto.randomUUID(),
        message,
        type,
        createdAt: new Date().toISOString(),
        read: false,
        officeId,
        href,
      };
      setNotifications((previous) => [notification, ...previous].slice(0, MAX_NOTIFICATIONS));
      if (!silent) toast(message, type);
    },
    [toast],
  );

  const markAllRead = useCallback(async () => {
    setNotifications((previous) =>
      previous.map((notification) => ({ ...notification, read: true })),
    );
    try {
      await markAllNotificationsReadApi();
    } catch {
      // Optimistic state remains
    }
  }, []);

  const markRead = useCallback(async (id: string) => {
    setNotifications((previous) =>
      previous.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification,
      ),
    );
    try {
      await markNotificationReadApi(id);
    } catch {
      // Optimistic state remains
    }
  }, []);

  const deleteNotification = useCallback(
    async (id: string) => {
      const prev = notifications;
      setNotifications((current) => current.filter((notification) => notification.id !== id));
      try {
        await deleteNotificationApi(id);
        toast("Notification deleted", "info");
      } catch (err) {
        // Roll back on failure
        setNotifications(prev);
        toast(err instanceof Error ? err.message : "Failed to delete notification", "warning");
      }
    },
    [notifications, toast],
  );

  const deleteAllNotifications = useCallback(async () => {
    const prev = notifications;
    setNotifications([]);
    try {
      await deleteAllNotificationsApi();
      toast("All notifications deleted", "info");
    } catch (err) {
      setNotifications(prev);
      toast(err instanceof Error ? err.message : "Failed to clear notifications", "warning");
    }
  }, [notifications, toast]);

  const resetNotifications = useCallback(() => setNotifications([]), []);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications],
  );

  const value = useMemo<NotificationContextValue>(
    () => ({
      notifications,
      unreadCount,
      isLoading,
      notify,
      markAllRead,
      markRead,
      deleteNotification,
      deleteAllNotifications,
      resetNotifications,
      refresh,
    }),
    [
      notifications,
      unreadCount,
      isLoading,
      notify,
      markAllRead,
      markRead,
      deleteNotification,
      deleteAllNotifications,
      resetNotifications,
      refresh,
    ],
  );

  return (
    <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
  );
}

export function useNotifications(): NotificationContextValue {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used inside a <NotificationProvider>.");
  }
  return context;
}
