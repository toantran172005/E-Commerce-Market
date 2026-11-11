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
} from '../services/notificationService';
import { useAuth } from './AuthContext';

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
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);

  const loadNotifications = useCallback(async () => {
    if (!user?.uid) {
      setNotifications([]);
      return;
    }
    setLoading(true);
    try {
      const data = await NotificationService.listNotifications(user.uid);
      setNotifications(data);
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications, resetKey]);

  const markAsRead = useCallback(async (id: string) => {
    // Cập nhật lạc quan (optimistic) tức thì để biến mất red dot và đổi nền thẻ
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
    try {
      const updated = await NotificationService.markAsRead(id, user?.uid);
      setNotifications((prev) => prev.map((n) => (n.id === id ? updated : n)));
    } catch {
      // Giữ nguyên trạng thái đã đọc trên giao diện người dùng
    }
  }, [user?.uid]);

  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      const updated = await NotificationService.markAllAsRead(user?.uid);
      setNotifications(updated);
    } catch {
      // Giữ nguyên trạng thái đã đọc trên giao diện người dùng
    }
  }, [user?.uid]);

  const addNotification = useCallback(
    async (input: CreateNotificationInput) => {
      const created = await NotificationService.createNotification(input, user?.uid);
      setNotifications((prev) => [created, ...prev]);
      return created;
    },
    [user?.uid],
  );

  const reset = useCallback(() => {
    setNotifications([]);
  }, []);

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
    [
      notifications,
      unreadCount,
      loading,
      loadNotifications,
      markAsRead,
      markAllAsRead,
      addNotification,
      reset,
    ],
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications(): NotificationsContextValue {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error('useNotifications phải được dùng bên trong <NotificationsProvider>');
  }
  return ctx;
}
