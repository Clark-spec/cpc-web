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
}

export type NotifyInput = {
  message: string;
  type?: NotificationType;
  officeId?: string;
  /** Skip the toast when several notifications are created at once. */
  silent?: boolean;
};

type NotificationContextValue = {
  notifications: AppNotification[];
  unreadCount: number;
  /** Adds a notification (newest first), persists it and shows a toast. */
  notify: (input: NotifyInput) => void;
  markAllRead: () => void;
  markRead: (id: string) => void;
  /** Clears the list (used by "Reset demo"). */
  resetNotifications: () => void;
};

const NotificationContext = createContext<NotificationContextValue | null>(null);

const MAX_NOTIFICATIONS = 30;

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
  /** Each feature keeps its own persisted feed. */
  storageKey: string;
};

/**
 * Shared notification feed for the student portal. Features mount it with
 * their own `storageKey`; the top-bar bell reads it through `useNotifications`.
 */
export function NotificationProvider({ children, storageKey }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<AppNotification[]>(() => readStored(storageKey));
  const { toast } = useToast();
  // Avoid writing the value straight back when it arrived from another tab.
  const skipPersist = useRef(false);

  useEffect(() => {
    if (skipPersist.current) {
      skipPersist.current = false;
      return;
    }
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(notifications.slice(0, MAX_NOTIFICATIONS)));
    } catch {
      // Ignore storage failures (private mode / quota exceeded).
    }
  }, [notifications, storageKey]);

  // The admin portal writes staff notifications into this same key; keep both
  // tabs in sync without a manual refresh.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== storageKey) return;
      skipPersist.current = true;
      setNotifications(readStored(storageKey));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [storageKey]);

  const notify = useCallback(
    ({ message, type = "info", officeId, silent = false }: NotifyInput) => {
      const notification: AppNotification = {
        id: crypto.randomUUID(),
        message,
        type,
        createdAt: new Date().toISOString(),
        read: false,
        officeId,
      };
      setNotifications((previous) => [notification, ...previous].slice(0, MAX_NOTIFICATIONS));
      if (!silent) toast(message, type);
    },
    [toast],
  );

  const markAllRead = useCallback(() => {
    setNotifications((previous) =>
      previous.map((notification) => ({ ...notification, read: true })),
    );
  }, []);

  const markRead = useCallback((id: string) => {
    setNotifications((previous) =>
      previous.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification,
      ),
    );
  }, []);

  const resetNotifications = useCallback(() => setNotifications([]), []);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications],
  );

  const value = useMemo<NotificationContextValue>(
    () => ({
      notifications,
      unreadCount,
      notify,
      markAllRead,
      markRead,
      resetNotifications,
    }),
    [notifications, unreadCount, notify, markAllRead, markRead, resetNotifications],
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
