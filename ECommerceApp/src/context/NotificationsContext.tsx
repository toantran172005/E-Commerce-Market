import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import { AppNotification } from '../types';
import {
  CreateNotificationInput,
  NotificationService,
} from '../services/notification.service';

interface NotificationsContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  loadNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  addNotification: (input: CreateNotificationInput) => Promise<AppNotification>;
  reset: () => void;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export function NotificationsProvider({
  children,
  resetKey = 0,
}: { children: ReactNode; resetKey?: number }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const data = await NotificationService.listNotifications();
      setNotifications(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications, resetKey]);

  const markAsRead = useCallback(async (id: string) => {
    const updated = await NotificationService.markAsRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? updated : n)));
  }, []);

  const markAllAsRead = useCallback(async () => {
    const updated = await NotificationService.markAllAsRead();
    setNotifications(updated);
  }, []);

  const addNotification = useCallback(
    async (input: CreateNotificationInput): Promise<AppNotification> => {
      const created = await NotificationService.createNotification(input);
      setNotifications((prev) => [created, ...prev]);
      return created;
    },
    [],
  );

  const reset = useCallback(() => {
    void loadNotifications();
  }, [loadNotifications]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      loading,
      loadNotifications,
      markAsRead,
      markAllAsRead,
      addNotification,
      reset,
    }),
    [notifications, unreadCount, loading, loadNotifications, markAsRead, markAllAsRead, addNotification, reset],
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications(): NotificationsContextValue {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error('useNotifications phải được dùng bên trong <NotificationsProvider>');
  }
  return ctx;
}
