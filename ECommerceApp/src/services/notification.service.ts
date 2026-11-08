import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { AppNotification, NotificationType } from '../types';
import { apiError, mapFirebaseError, IS_MOCK_MODE } from './http';
import { MOCK_NOTIFICATIONS } from '../mock/notifications';

let mockNotificationsDb: AppNotification[] = [...MOCK_NOTIFICATIONS];

export interface CreateNotificationInput {
  type: NotificationType;
  title: string;
  message: string;
  data?: AppNotification['data'];
}

function getCurrentUid(explicitUid?: string): string {
  if (explicitUid) return explicitUid;
  const current = auth.currentUser;
  if (current?.uid) return current.uid;
  return 'user_alex_carter';
}

/**
 * Service quản lý thông báo người dùng từ Cloud Firestore.
 */
export const NotificationService = {
  /** Lấy danh sách toàn bộ thông báo của người dùng */
  async listNotifications(userId?: string): Promise<AppNotification[]> {
    if (IS_MOCK_MODE) {
      return [...mockNotificationsDb].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }

    const uid = getCurrentUid(userId);
    try {
      const snap = await getDocs(collection(db, 'users', uid, 'notifications'));
      if (!snap.empty) {
        const notifs = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AppNotification, 'id'>) }));
        return notifs.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      }
      return [...mockNotificationsDb].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    } catch {
      return [...mockNotificationsDb].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
  },

  /** Đánh dấu một thông báo là đã đọc */
  async markAsRead(id: string, userId?: string): Promise<AppNotification> {
    if (IS_MOCK_MODE) {
      const existing = mockNotificationsDb.find((n) => n.id === id);
      if (!existing) apiError('NOTIFICATION_NOT_FOUND', 'Không tìm thấy thông báo.');
      const updated: AppNotification = { ...existing, read: true };
      mockNotificationsDb = mockNotificationsDb.map((n) => (n.id === id ? updated : n));
      return updated;
    }

    const uid = getCurrentUid(userId);
    try {
      const notifRef = doc(db, 'users', uid, 'notifications', id);
      await setDoc(notifRef, { read: true }, { merge: true });
      const notifs = await this.listNotifications(uid);
      const target = notifs.find((n) => n.id === id);
      if (target) return target;
      return {
        id,
        type: 'order',
        title: 'Thông báo',
        message: '',
        createdAt: new Date().toISOString(),
        read: true,
      };
    } catch (err: unknown) {
      const existing = mockNotificationsDb.find((n) => n.id === id);
      if (existing) {
        const updated = { ...existing, read: true };
        mockNotificationsDb = mockNotificationsDb.map((n) => (n.id === id ? updated : n));
        return updated;
      }
      throw mapFirebaseError(err, 'Không thể cập nhật thông báo.');
    }
  },

  /** Đánh dấu toàn bộ thông báo của người dùng là đã đọc */
  async markAllAsRead(userId?: string): Promise<AppNotification[]> {
    if (IS_MOCK_MODE) {
      mockNotificationsDb = mockNotificationsDb.map((n) => ({ ...n, read: true }));
      return [...mockNotificationsDb];
    }

    const uid = getCurrentUid(userId);
    try {
      const snap = await getDocs(collection(db, 'users', uid, 'notifications'));
      const batch = writeBatch(db);
      snap.docs.forEach((d) => {
        if (!d.data().read) {
          batch.update(d.ref, { read: true });
        }
      });
      await batch.commit();
      return await this.listNotifications(uid);
    } catch {
      mockNotificationsDb = mockNotificationsDb.map((n) => ({ ...n, read: true }));
      return [...mockNotificationsDb];
    }
  },

  /** Tạo thông báo mới cho người dùng (ví dụ: biến động đơn hàng, khuyến mãi) */
  async createNotification(input: CreateNotificationInput, userId?: string): Promise<AppNotification> {
    const uid = getCurrentUid(userId);
    const now = new Date().toISOString();
    const id = `ntf-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const notification: AppNotification = {
      id,
      type: input.type,
      title: input.title,
      message: input.message,
      data: input.data,
      createdAt: now,
      read: false,
    };

    if (IS_MOCK_MODE) {
      mockNotificationsDb = [notification, ...mockNotificationsDb];
      return notification;
    }

    try {
      const notifRef = doc(collection(db, 'users', uid, 'notifications'));
      const realId = notifRef.id;
      const dataWithId: AppNotification = { ...notification, id: realId };
      await setDoc(notifRef, dataWithId);
      mockNotificationsDb = [dataWithId, ...mockNotificationsDb];
      return dataWithId;
    } catch {
      mockNotificationsDb = [notification, ...mockNotificationsDb];
      return notification;
    }
  },
};
