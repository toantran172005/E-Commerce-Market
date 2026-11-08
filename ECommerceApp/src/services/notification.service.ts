import { AppNotification, NotificationType } from '../types';
import { apiError, respond } from './http';
import { MOCK_NOTIFICATIONS } from '../mock/notifications';

/** Bản sao trong bộ nhớ để trạng thái đã đọc được giữ giữa các màn hình. */
let notificationsDb: AppNotification[] = [...MOCK_NOTIFICATIONS];

export interface CreateNotificationInput {
  type: NotificationType;
  title: string;
  message: string;
  data?: AppNotification['data'];
}

/**
 * Giả lập Notification API.
 *
 * GET /notifications
 * PATCH /notifications/:id/read
 * PATCH /notifications/read-all
 * POST /notifications
 */
export const NotificationService = {
  /** GET /notifications */
  async listNotifications(): Promise<AppNotification[]> {
    await respond(null);
    return [...notificationsDb].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  /** PATCH /notifications/:id/read */
  async markAsRead(id: string): Promise<AppNotification> {
    await respond(null);
    const existing = notificationsDb.find((n) => n.id === id);
    if (!existing) apiError('NOTIFICATION_NOT_FOUND', 'Không tìm thấy thông báo.');
    const updated: AppNotification = { ...existing, read: true };
    notificationsDb = notificationsDb.map((n) => (n.id === id ? updated : n));
    return updated;
  },

  /** PATCH /notifications/read-all */
  async markAllAsRead(): Promise<AppNotification[]> {
    await respond(null);
    notificationsDb = notificationsDb.map((n) => ({ ...n, read: true }));
    return [...notificationsDb];
  },

  /** POST /notifications — tạo thông báo nội bộ (ví dụ sau khi đặt hàng) */
  async createNotification(input: CreateNotificationInput): Promise<AppNotification> {
    await respond(null);
    const notification: AppNotification = {
      id: `ntf-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type: input.type,
      title: input.title,
      message: input.message,
      data: input.data,
      createdAt: new Date().toISOString(),
      read: false,
    };
    notificationsDb = [notification, ...notificationsDb];
    return notification;
  },
};
