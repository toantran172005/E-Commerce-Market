import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch,
} from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { Address, AppSettings, PaymentMethod } from '../types';
import { apiError, mapFirebaseError } from './http';

function resolveUid(userId?: string): string {
  if (userId) return userId;
  const current = auth.currentUser;
  if (current?.uid) return current.uid;
  throw apiError('AUTH_REQUIRED', 'Vui lòng đăng nhập để thực hiện tính năng này.');
}

function stripUndefined<T extends Record<string, any>>(obj: T): Partial<T> {
  const result: any = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) {
      result[k] = v && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Date)
        ? stripUndefined(v)
        : v;
    }
  }
  return result;
}

/**
 * Service quản lý sổ địa chỉ, phương thức thanh toán và cấu hình ứng dụng từ Cloud Firestore 100% thực tế.
 */
export const ProfileService = {
  /* ----------------------------- SỔ ĐỊA CHỈ ----------------------------- */

  /** Lấy danh sách địa chỉ giao hàng của người dùng */
  async listAddresses(userId?: string): Promise<Address[]> {
    const uid = userId || auth.currentUser?.uid;
    if (!uid) return [];

    try {
      const snap = await getDocs(collection(db, 'users', uid, 'addresses'));
      if (!snap.empty) {
        return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Address, 'id'>) }));
      }

      // Fallback: Tìm trong root collection shipping_addresses theo ERD
      const { query, where } = await import('firebase/firestore');
      const q = query(collection(db, 'shipping_addresses'), where('userId', '==', uid));
      const rootSnap = await getDocs(q);
      if (!rootSnap.empty) {
        return rootSnap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            label: data.type || 'Nhà riêng',
            fullName: data.recipientName || '',
            phone: data.phoneNumber || '',
            address: data.fullAddress || '',
            isDefault: Boolean(data.isDefault),
          };
        });
      }
      return [];
    } catch (err: unknown) {
      return [];
    }
  },

  /** Thêm địa chỉ mới (đảm bảo duy nhất 1 địa chỉ mặc định) */
  async addAddress(input: Omit<Address, 'id'>, userId?: string): Promise<Address[]> {
    const uid = resolveUid(userId);
    try {
      const addresses = await this.listAddresses(uid);
      const isFirst = addresses.length === 0;
      const willBeDefault = input.isDefault || isFirst;

      const batch = writeBatch(db);
      const newRef = doc(collection(db, 'users', uid, 'addresses'));
      const id = newRef.id;

      if (willBeDefault) {
        for (const addr of addresses) {
          if (addr.isDefault) {
            batch.set(doc(db, 'users', uid, 'addresses', addr.id), { isDefault: false }, { merge: true });
            batch.set(doc(db, 'shipping_addresses', addr.id), { isDefault: false }, { merge: true });
          }
        }
      }

      const newAddr: Address = {
        ...input,
        id,
        isDefault: willBeDefault,
      };

      // Ghi subcollection và root collection shipping_addresses chuẩn ERD
      batch.set(newRef, stripUndefined(newAddr));
      batch.set(doc(db, 'shipping_addresses', id), {
        id,
        userId: uid,
        type: input.label || 'Nhà riêng',
        recipientName: input.fullName,
        phoneNumber: input.phone,
        fullAddress: input.address,
        isDefault: willBeDefault,
      });

      await batch.commit();

      return await this.listAddresses(uid);
    } catch (err: unknown) {
      throw mapFirebaseError(err, 'Không thể thêm địa chỉ mới.');
    }
  },

  /** Cập nhật thông tin địa chỉ */
  async updateAddress(
    id: string,
    patch: Partial<Address>,
    userId?: string,
  ): Promise<Address[]> {
    const uid = resolveUid(userId);
    try {
      const addresses = await this.listAddresses(uid);
      const target = addresses.find((a) => a.id === id);
      if (!target) {
        apiError('ADDRESS_NOT_FOUND', 'Không tìm thấy địa chỉ nhận hàng.');
      }

      const batch = writeBatch(db);

      if (patch.isDefault) {
        for (const addr of addresses) {
          if (addr.id !== id && addr.isDefault) {
            batch.set(doc(db, 'users', uid, 'addresses', addr.id), { isDefault: false }, { merge: true });
            batch.set(doc(db, 'shipping_addresses', addr.id), { isDefault: false }, { merge: true });
          }
        }
      }

      const updatedAddr = { ...target, ...patch, id };
      batch.set(doc(db, 'users', uid, 'addresses', id), stripUndefined(updatedAddr), { merge: true });
      batch.set(doc(db, 'shipping_addresses', id), {
        id,
        userId: uid,
        type: updatedAddr.label || 'Nhà riêng',
        recipientName: updatedAddr.fullName,
        phoneNumber: updatedAddr.phone,
        fullAddress: updatedAddr.address,
        isDefault: Boolean(updatedAddr.isDefault),
      }, { merge: true });

      await batch.commit();

      return await this.listAddresses(uid);
    } catch (err: unknown) {
      throw mapFirebaseError(err, 'Không thể cập nhật địa chỉ.');
    }
  },

  /** Xoá địa chỉ nhận hàng */
  async deleteAddress(id: string, userId?: string): Promise<Address[]> {
    const uid = resolveUid(userId);
    try {
      const addresses = await this.listAddresses(uid);
      const target = addresses.find((a) => a.id === id);
      if (!target) {
        apiError('ADDRESS_NOT_FOUND', 'Không tìm thấy địa chỉ cần xoá.');
      }

      const remaining = addresses.filter((a) => a.id !== id);
      const batch = writeBatch(db);

      batch.delete(doc(db, 'users', uid, 'addresses', id));
      batch.delete(doc(db, 'shipping_addresses', id));

      // Nếu xoá địa chỉ mặc định và còn địa chỉ khác, đặt địa chỉ đầu tiên làm mặc định mới
      if (target.isDefault && remaining.length > 0) {
        batch.set(doc(db, 'users', uid, 'addresses', remaining[0].id), { isDefault: true }, { merge: true });
        batch.set(doc(db, 'shipping_addresses', remaining[0].id), { isDefault: true }, { merge: true });
      }

      await batch.commit();
      return await this.listAddresses(uid);
    } catch (err: unknown) {
      throw mapFirebaseError(err, 'Không thể xoá địa chỉ.');
    }
  },

  /** Đặt làm địa chỉ mặc định */
  async setDefaultAddress(id: string, userId?: string): Promise<Address[]> {
    const uid = resolveUid(userId);
    try {
      const addresses = await this.listAddresses(uid);
      const exists = addresses.some((a) => a.id === id);
      if (!exists) {
        apiError('ADDRESS_NOT_FOUND', 'Không tìm thấy địa chỉ.');
      }

      const batch = writeBatch(db);
      for (const addr of addresses) {
        const isDef = addr.id === id;
        batch.set(
          doc(db, 'users', uid, 'addresses', addr.id),
          { isDefault: isDef },
          { merge: true },
        );
        batch.set(
          doc(db, 'shipping_addresses', addr.id),
          { isDefault: isDef },
          { merge: true },
        );
      }
      await batch.commit();

      return await this.listAddresses(uid);
    } catch (err: unknown) {
      throw mapFirebaseError(err, 'Không thể đặt địa chỉ mặc định.');
    }
  },

  /* ---------------------- PHƯƠNG THỨC THANH TOÁN ---------------------- */

  /** Lấy danh sách phương thức thanh toán của người dùng (COD luôn khả dụng) */
  async listPaymentMethods(userId?: string): Promise<PaymentMethod[]> {
    const codDefault: PaymentMethod = {
      id: 'pay-cod',
      type: 'cod',
      name: 'Thanh toán khi nhận hàng',
      detail: 'COD - Trả tiền mặt khi giao',
      isDefault: true,
    };

    const uid = userId || auth.currentUser?.uid;
    if (!uid) return [codDefault];

    let list: PaymentMethod[] = [];
    try {
      const snap = await getDocs(collection(db, 'users', uid, 'paymentMethods'));
      if (!snap.empty) {
        list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<PaymentMethod, 'id'>) }));
      }
    } catch {
      list = [];
    }

    // Lọc bỏ document rác nếu có
    list = list.filter((p) => p && p.name && p.detail);

    const hasCod = list.some((p) => p.id === 'pay-cod' || p.type === 'cod');
    const hasCustomDefault = list.some((p) => p.isDefault && p.id !== 'pay-cod' && p.type !== 'cod');

    if (!hasCod) {
      list = [{ ...codDefault, isDefault: !hasCustomDefault }, ...list];
    } else {
      list = list.map((p) => {
        if (p.id === 'pay-cod' || p.type === 'cod') {
          return { ...p, isDefault: !hasCustomDefault };
        }
        return p;
      });
    }
    return list;
  },

  /** Thêm thẻ thanh toán mới (Chỉ lưu 4 số cuối last4, bảo mật tuyệt đối) */
  async addPaymentMethod(input: Omit<PaymentMethod, 'id'>, userId?: string): Promise<PaymentMethod[]> {
    const uid = resolveUid(userId);
    try {
      const methods = await this.listPaymentMethods(uid);
      const isFirst = methods.length === 0;
      const willBeDefault = input.isDefault || isFirst;

      const batch = writeBatch(db);
      const newRef = doc(collection(db, 'users', uid, 'paymentMethods'));
      const id = newRef.id;

      if (willBeDefault) {
        for (const m of methods) {
          if (m.isDefault && m.id !== 'pay-cod') {
            batch.set(doc(db, 'users', uid, 'paymentMethods', m.id), { isDefault: false }, { merge: true });
          }
        }
      }

      const newMethod: PaymentMethod = {
        ...input,
        id,
        isDefault: willBeDefault,
      };

      batch.set(newRef, newMethod);
      await batch.commit();

      return await this.listPaymentMethods(uid);
    } catch (err: unknown) {
      throw mapFirebaseError(err, 'Không thể thêm phương thức thanh toán.');
    }
  },

  /** Xoá phương thức thanh toán (COD là cố định, không thể xoá) */
  async deletePaymentMethod(id: string, userId?: string): Promise<PaymentMethod[]> {
    if (id === 'pay-cod') {
      apiError('CANNOT_DELETE_COD', 'Phương thức thanh toán khi nhận hàng (COD) là mặc định của hệ thống, không thể xoá.');
    }

    const uid = resolveUid(userId);
    try {
      const methods = await this.listPaymentMethods(uid);
      const target = methods.find((p) => p.id === id);
      if (!target) apiError('PAYMENT_NOT_FOUND', 'Không tìm thấy phương thức thanh toán cần xoá.');

      const remaining = methods.filter((p) => p.id !== id);
      const batch = writeBatch(db);

      batch.delete(doc(db, 'users', uid, 'paymentMethods', id));

      if (target.isDefault && remaining.length > 0) {
        const nonCodRemaining = remaining.filter((p) => p.id !== 'pay-cod');
        if (nonCodRemaining.length > 0) {
          batch.set(doc(db, 'users', uid, 'paymentMethods', nonCodRemaining[0].id), { isDefault: true }, { merge: true });
        }
      }

      await batch.commit();
      return await this.listPaymentMethods(uid);
    } catch (err: unknown) {
      throw mapFirebaseError(err, 'Không thể xoá phương thức thanh toán.');
    }
  },

  /** Đặt làm phương thức thanh toán mặc định duy nhất */
  async setDefaultPaymentMethod(id: string, userId?: string): Promise<PaymentMethod[]> {
    const uid = resolveUid(userId);
    try {
      const methods = await this.listPaymentMethods(uid);
      const exists = methods.some((p) => p.id === id);
      if (!exists) apiError('PAYMENT_NOT_FOUND', 'Không tìm thấy phương thức thanh toán.');

      const batch = writeBatch(db);
      for (const m of methods) {
        if (m.id !== 'pay-cod') {
          batch.set(doc(db, 'users', uid, 'paymentMethods', m.id), { isDefault: m.id === id }, { merge: true });
        }
      }
      await batch.commit();

      return await this.listPaymentMethods(uid);
    } catch (err: unknown) {
      throw mapFirebaseError(err, 'Không thể đặt phương thức thanh toán mặc định.');
    }
  },

  /* ------------------------- CÀI ĐẶT ỨNG DỤNG ------------------------- */

  /** Lấy cài đặt ứng dụng cá nhân */
  async getSettings(userId?: string): Promise<AppSettings> {
    const defaultSettings: AppSettings = {
      language: 'vi',
      currency: 'VND',
      darkMode: false,
      pushEnabled: true,
      emailEnabled: true,
      biometricEnabled: false,
    };

    const uid = userId || auth.currentUser?.uid;
    if (!uid) return defaultSettings;

    try {
      const snap = await getDoc(doc(db, 'users', uid, 'settings', 'app'));
      if (snap.exists()) {
        return snap.data() as AppSettings;
      }
      return defaultSettings;
    } catch {
      return defaultSettings;
    }
  },

  /** Cập nhật cài đặt ứng dụng */
  async updateSettings(patch: Partial<AppSettings>, userId?: string): Promise<AppSettings> {
    const uid = resolveUid(userId);
    try {
      const settingRef = doc(db, 'users', uid, 'settings', 'app');
      await setDoc(settingRef, patch, { merge: true });
      return await this.getSettings(uid);
    } catch (err: unknown) {
      throw mapFirebaseError(err, 'Không thể cập nhật cài đặt.');
    }
  },
};
