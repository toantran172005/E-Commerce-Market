import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  writeBatch,
  query,
  where,
} from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { AppNotification, NotificationType } from '../types';
import { apiError, mapFirebaseError } from './http';

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

export interface CreateNotificationInput {
  type: NotificationType;
  title: string;
  message: string;
  data?: AppNotification['data'];
}

function resolveUid(userId?: string): string {
  if (userId) return userId;
  const current = auth.currentUser;
  if (current?.uid) return current.uid;
  return 'user_test_default';
}

/**
 * Service quản lý thông báo người dùng 100% từ Cloud Firestore.
 * Đồng bộ lưu trữ tại root collection 'notifications' theo chuẩn ERD
 * và subcollection 'users/{uid}/notifications'.
 */
export const NotificationService = {
  /** Lấy danh sách toàn bộ thông báo của người dùng */
  async listNotifications(userId?: string): Promise<AppNotification[]> {
    const uid = resolveUid(userId);
    if (!uid) return [];

    let notifs: AppNotification[] = [];
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
            orderId: (data as any).orderId || data.data?.orderId,
            data: data.data || ((data as any).orderId ? { orderId: (data as any).orderId } : {}),
          };
        });
      } else {
        // Fallback: Tìm trong root collection 'notifications'
        const q = query(collection(db, 'notifications'), where('userId', '==', uid));
        const rootSnap = await getDocs(q);
        if (!rootSnap.empty) {
          notifs = rootSnap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              type: (data.type || 'order') as NotificationType,
              title: data.title || 'Thông báo hệ thống',
              message: data.message || 'Bạn có thông báo mới từ hệ thống.',
              createdAt: data.date ? String(data.date) : new Date().toISOString(),
              read: Boolean(data.isRead),
              orderId: (data as any).orderId,
              data: (data as any).orderId ? { orderId: (data as any).orderId } : {},
            };
          });
        }
      }
    } catch {
      notifs = [];
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
    const uid = resolveUid(userId);
    await addPersistedReadId(uid, id);

    try {
      const batch = writeBatch(db);
      const subRef = doc(db, 'users', uid, 'notifications', id);
      const rootRef = doc(db, 'notifications', id);

      batch.set(subRef, { read: true }, { merge: true });
      batch.set(rootRef, { isRead: true }, { merge: true });
      await batch.commit().catch(() => {});

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
      throw mapFirebaseError(err, 'Không thể cập nhật thông báo.');
    }
  },

  /** Đánh dấu toàn bộ thông báo của người dùng là đã đọc */
  async markAllAsRead(userId?: string): Promise<AppNotification[]> {
    const uid = resolveUid(userId);

    try {
      const batch = writeBatch(db);

      const subSnap = await getDocs(collection(db, 'users', uid, 'notifications'));
      subSnap.docs.forEach((d) => {
        if (!d.data().read) {
          batch.update(d.ref, { read: true });
        }
      });

      const rootQ = query(collection(db, 'notifications'), where('userId', '==', uid));
      const rootSnap = await getDocs(rootQ);
      rootSnap.docs.forEach((d) => {
        if (!d.data().isRead) {
          batch.update(d.ref, { isRead: true });
        }
      });

      await batch.commit();
      return await this.listNotifications(uid);
    } catch (err: unknown) {
      throw mapFirebaseError(err, 'Không thể đánh dấu tất cả thông báo đã đọc.');
    }
  },

  /** Tạo thông báo mới cho người dùng (ghi đồng bộ cả subcollection và root 'notifications') */
  async createNotification(input: CreateNotificationInput, userId?: string): Promise<AppNotification> {
    const uid = resolveUid(userId);
    const now = new Date().toISOString();

    const notifRef = doc(collection(db, 'users', uid, 'notifications'));
    const realId = notifRef.id;
    const dataWithId: any = {
      id: realId,
      type: input.type,
      title: input.title,
      message: input.message,
      createdAt: now,
      read: false,
    };
    if (input.data !== undefined) {
      dataWithId.data = input.data;
    }

    try {
      const batch = writeBatch(db);
      batch.set(notifRef, dataWithId);
      batch.set(doc(db, 'notifications', realId), {
        id: realId,
        userId: uid,
        title: input.title,
        message: input.message,
        isRead: false,
        type: input.type,
        date: now,
      });
      await batch.commit();

      return dataWithId as AppNotification;
    } catch (err: unknown) {
      throw mapFirebaseError(err, 'Không thể tạo thông báo.');
    }
  },
};
