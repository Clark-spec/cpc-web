/* eslint-disable react-refresh/only-export-components -- provider + hook intentionally share a module */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useToast } from "../components/Toast";
import { getNotifications, saveNotifications } from "../services/clearanceService";
import type { AppNotification, OfficeId } from "../types";

type NotifyInput = {
  message: string;
  type: AppNotification["type"];
  officeId?: OfficeId;
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

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loaded, setLoaded] = useState(false);
  const { toast } = useToast();

  // Load once from the mock service, then persist on every change.
  useEffect(() => {
    let active = true;
    getNotifications()
      .then((items) => {
        if (active) {
          setNotifications(items);
          setLoaded(true);
        }
      })
      .catch(() => {
        if (active) setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!loaded) return;
    void saveNotifications(notifications);
  }, [notifications, loaded]);

  const notify = useCallback(
    ({ message, type, officeId, silent = false }: NotifyInput) => {
      const notification: AppNotification = {
        id: crypto.randomUUID(),
        message,
        type,
        createdAt: new Date().toISOString(),
        read: false,
        officeId,
      };
      setNotifications((previous) => [notification, ...previous].slice(0, 30));
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
