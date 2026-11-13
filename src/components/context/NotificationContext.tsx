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
import { showError, showInfo, showSuccess, showWarning } from "@/lib/feedback";
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
  /** Short event heading, e.g. "New Response from Student Support". */
  title?: string;
  message: string;
  type: NotificationType;
  /** ISO date-time. */
  createdAt: string;
  read: boolean;
  officeId?: string;
  href?: string;
  /** Created by this tab, so the bell must not re-announce it. */
  local?: boolean;
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
  isLoadingMore: boolean;
  /** True when the backend holds older pages beyond the loaded window. */
  hasMore: boolean;
  /** Adds a notification (newest first), persists it and shows a toast. */
  notify: (input: NotifyInput) => void;
  markAllRead: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  deleteAllNotifications: () => Promise<void>;
  loadMore: () => Promise<void>;
  /** Clears the list (used by "Reset demo"). */
  resetNotifications: () => void;
  refresh: () => Promise<void>;
};

const NotificationContext = createContext<NotificationContextValue | null>(null);

const PAGE_SIZE = 20;
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
  const [unreadCount, setUnreadCount] = useState<number>(
    () => readStored(storageKey).filter((notification) => !notification.read).length,
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const skipPersist = useRef(false);
  const notificationsRef = useRef(notifications);

  useEffect(() => {
    notificationsRef.current = notifications;
  }, [notifications]);

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

  /**
   * Pulls the newest page. The limit keeps any "See earlier" pages the reader
   * already expanded instead of collapsing the list on every realtime event.
   */
  const syncFeed = useCallback(async () => {
    const limit = Math.max(PAGE_SIZE, Math.min(notificationsRef.current.length, MAX_NOTIFICATIONS));
    const data = await fetchNotificationsApi({ limit });
    setNotifications(data.notifications);
    setUnreadCount(data.unread);
    setHasMore(data.hasMore);
  }, []);

  // Load from real backend endpoint
  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      await syncFeed();
    } catch {
      // Offline fallback: keep existing stored items
    } finally {
      setIsLoading(false);
    }
  }, [syncFeed]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  /**
   * Applies a pushed alert without waiting on the feed. Returns false when the
   * payload is unusable, in which case the caller falls back to a refetch.
   */
  const applyPushedNotification = useCallback((data: unknown) => {
    if (typeof data !== "object" || data === null) return false;
    const raw = data as Partial<AppNotification>;
    if (typeof raw.id !== "string" || !raw.id) return false;
    if (typeof raw.message !== "string" || !raw.message) return false;

    const incoming: AppNotification = {
      id: raw.id,
      title: typeof raw.title === "string" && raw.title ? raw.title : undefined,
      message: raw.message,
      type: raw.type === "success" || raw.type === "warning" ? raw.type : "info",
      createdAt:
        typeof raw.createdAt === "string" && raw.createdAt
          ? raw.createdAt
          : new Date().toISOString(),
      read: false,
      href: typeof raw.href === "string" && raw.href ? raw.href : undefined,
    };

    if (notificationsRef.current.some((notification) => notification.id === incoming.id)) {
      return true;
    }

    setNotifications((previous) =>
      previous.some((notification) => notification.id === incoming.id)
        ? previous
        : [incoming, ...previous].slice(0, MAX_NOTIFICATIONS),
    );
    setUnreadCount((previous) => previous + 1);
    return true;
  }, []);

  // Real-time synchronization via Server-Sent Events (SSE). `connected` also
  // fires after an automatic reconnect, so missed notifications are fetched.
  useSSE(
    useCallback(
      (type, data) => {
        if (type === "notification_created" && applyPushedNotification(data)) {
          return;
        }
        if (
          type === "connected" ||
          type === "notification_updated" ||
          type === "notification_created" ||
          type === "complaint_updated" ||
          type === "service_request_updated" ||
          type === "profile_updated"
        ) {
          void syncFeed().catch(() => {});
        }
      },
      [applyPushedNotification, syncFeed],
    ),
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
        local: true,
      };
      setNotifications((previous) => [notification, ...previous].slice(0, MAX_NOTIFICATIONS));
      setUnreadCount((previous) => previous + 1);
      if (!silent) {
        if (type === "success") showSuccess("Update", message);
        else if (type === "warning") showWarning("Heads up", message);
        else showInfo("Notification", message);
      }
    },
    [],
  );

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    try {
      const offset = notificationsRef.current.length;
      const data = await fetchNotificationsApi({ limit: PAGE_SIZE, offset });
      setNotifications((previous) => {
        const seen = new Set(previous.map((notification) => notification.id));
        return [...previous, ...data.notifications.filter((notification) => !seen.has(notification.id))];
      });
      setUnreadCount(data.unread);
      setHasMore(data.hasMore);
    } catch {
      // Keep the current page; the footer button can be retried.
    } finally {
      setIsLoadingMore(false);
    }
  }, [hasMore, isLoadingMore]);

  const markAllRead = useCallback(async () => {
    setNotifications((previous) =>
      previous.map((notification) => ({ ...notification, read: true })),
    );
    setUnreadCount(0);
    try {
      await markAllNotificationsReadApi();
    } catch {
      // Optimistic state remains
    }
  }, []);

  const markRead = useCallback(async (id: string) => {
    const wasUnread = notificationsRef.current.some(
      (notification) => notification.id === id && !notification.read,
    );
    setNotifications((previous) =>
      previous.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification,
      ),
    );
    if (wasUnread) setUnreadCount((previous) => Math.max(0, previous - 1));
    try {
      await markNotificationReadApi(id);
    } catch {
      // Optimistic state remains
    }
  }, []);

  const deleteNotification = useCallback(
    async (id: string) => {
      const previous = notificationsRef.current;
      const removed = previous.find((notification) => notification.id === id);
      setNotifications((current) => current.filter((notification) => notification.id !== id));
      if (removed && !removed.read) {
        setUnreadCount((current) => Math.max(0, current - 1));
      }
      try {
        await deleteNotificationApi(id);
        showInfo("Notification deleted", "The notification was removed from your feed.");
      } catch (err) {
        // Roll back on failure
        setNotifications(previous);
        if (removed && !removed.read) {
          setUnreadCount((current) => current + 1);
        }
        showError(
          "Could not delete notification",
          err instanceof Error ? err.message : "Please try again.",
        );
      }
    },
    [],
  );

  const deleteAllNotifications = useCallback(async () => {
    const previous = notificationsRef.current;
    const previousUnread = unreadCount;
    setNotifications([]);
    setUnreadCount(0);
    setHasMore(false);
    try {
      await deleteAllNotificationsApi();
      showInfo("Notifications cleared", "Your notification feed is now empty.");
    } catch (err) {
      setNotifications(previous);
      setUnreadCount(previousUnread);
      showError(
        "Could not clear notifications",
        err instanceof Error ? err.message : "Please try again.",
      );
    }
  }, [unreadCount]);

  const resetNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
    setHasMore(false);
  }, []);

  const value = useMemo<NotificationContextValue>(
    () => ({
      notifications,
      unreadCount,
      isLoading,
      isLoadingMore,
      hasMore,
      notify,
      markAllRead,
      markRead,
      deleteNotification,
      deleteAllNotifications,
      loadMore,
      resetNotifications,
      refresh,
    }),
    [
      notifications,
      unreadCount,
      isLoading,
      isLoadingMore,
      hasMore,
      notify,
      markAllRead,
      markRead,
      deleteNotification,
      deleteAllNotifications,
      loadMore,
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
