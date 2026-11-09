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

async function getPersistedReadIds(uid: string): Promise<Set<string>> {
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const raw = await AsyncStorage.getItem(`@read_notifs_${uid}`);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return new Set(arr);
    }
  } catch {}
  return new Set();
}

async function addPersistedReadId(uid: string, id: string): Promise<void> {
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const ids = await getPersistedReadIds(uid);
    ids.add(id);
    await AsyncStorage.setItem(`@read_notifs_${uid}`, JSON.stringify(Array.from(ids)));
  } catch {}
}

async function addAllPersistedReadIds(uid: string, allIds: string[]): Promise<void> {
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const ids = await getPersistedReadIds(uid);
    allIds.forEach((id) => ids.add(id));
    await AsyncStorage.setItem(`@read_notifs_${uid}`, JSON.stringify(Array.from(ids)));
  } catch {}
}

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
    const uid = getCurrentUid(userId);
    let notifs: AppNotification[] = [];

    if (IS_MOCK_MODE) {
      notifs = [...mockNotificationsDb];
    } else {
      try {
        const snap = await getDocs(collection(db, 'users', uid, 'notifications'));
        if (!snap.empty) {
          notifs = snap.docs.map((d) => {
            const data = d.data() as Partial<AppNotification>;
            return {
              id: d.id,
              type: (data.type || 'order') as NotificationType,
              title: data.title || 'Thông báo hệ thống',
              message: data.message || 'Bạn có thông báo mới từ hệ thống.',
              createdAt: data.createdAt ? String(data.createdAt) : new Date().toISOString(),
              read: Boolean(data.read),
              data: data.data || {},
            };
          });
        } else {
          notifs = [...mockNotificationsDb];
        }
      } catch {
        notifs = [...mockNotificationsDb];
      }
    }

    const readIds = await getPersistedReadIds(uid);
    if (readIds.size > 0) {
      notifs = notifs.map((n) => (readIds.has(n.id) ? { ...n, read: true } : n));
    }
    return notifs
      .map((n) => ({
        ...n,
        createdAt: n.createdAt ? String(n.createdAt) : new Date().toISOString(),
      }))
      .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
  },

  /** Đánh dấu một thông báo là đã đọc */
  async markAsRead(id: string, userId?: string): Promise<AppNotification> {
    const uid = getCurrentUid(userId);
    await addPersistedReadId(uid, id);

    if (IS_MOCK_MODE) {
      const existing = mockNotificationsDb.find((n) => n.id === id);
      if (!existing) apiError('NOTIFICATION_NOT_FOUND', 'Không tìm thấy thông báo.');
      const updated: AppNotification = { ...existing, read: true };
      mockNotificationsDb = mockNotificationsDb.map((n) => (n.id === id ? updated : n));
      return updated;
    }

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
    const uid = getCurrentUid(userId);
    mockNotificationsDb = mockNotificationsDb.map((n) => ({ ...n, read: true }));
    await addAllPersistedReadIds(uid, mockNotificationsDb.map((n) => n.id));

    if (IS_MOCK_MODE) {
      return [...mockNotificationsDb];
    }

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
