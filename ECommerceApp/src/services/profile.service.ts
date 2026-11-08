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
import { apiError, mapFirebaseError, IS_MOCK_MODE } from './http';
import { MOCK_ADDRESSES } from '../mock/addresses';
import { MOCK_PAYMENT_METHODS } from '../mock/paymentMethods';
import { MOCK_APP_SETTINGS } from '../mock/appSettings';

let mockAddressesDb: Address[] = [...MOCK_ADDRESSES];
let mockPaymentsDb: PaymentMethod[] = [...MOCK_PAYMENT_METHODS];
let mockSettingsDb: AppSettings = { ...MOCK_APP_SETTINGS };

function getCurrentUid(explicitUid?: string): string {
  if (explicitUid) return explicitUid;
  const current = auth.currentUser;
  if (current?.uid) return current.uid;
  return 'user_alex_carter';
}

/**
 * Service quản lý sổ địa chỉ, phương thức thanh toán và cấu hình ứng dụng từ Cloud Firestore.
 */
export const ProfileService = {
  /* ----------------------------- SỔ ĐỊA CHỈ ----------------------------- */

  /** Lấy danh sách địa chỉ giao hàng */
  async listAddresses(userId?: string): Promise<Address[]> {
    if (IS_MOCK_MODE) return [...mockAddressesDb];

    const uid = getCurrentUid(userId);
    try {
      const snap = await getDocs(collection(db, 'users', uid, 'addresses'));
      if (!snap.empty) {
        return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Address, 'id'>) }));
      }
      return userId ? [] : [...mockAddressesDb];
    } catch {
      return userId ? [] : [...mockAddressesDb];
    }
  },

  /** Thêm địa chỉ mới (đảm bảo duy nhất 1 địa chỉ mặc định) */
  async addAddress(input: Omit<Address, 'id'>, userId?: string): Promise<Address[]> {
    if (IS_MOCK_MODE) {
      const created: Address = {
        ...input,
        id: `addr-${Date.now()}`,
        isDefault: input.isDefault || mockAddressesDb.length === 0,
      };
      if (created.isDefault) {
        mockAddressesDb = mockAddressesDb.map((a) => ({ ...a, isDefault: false }));
      }
      mockAddressesDb = [...mockAddressesDb, created];
      return [...mockAddressesDb];
    }

    const uid = getCurrentUid(userId);
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
          }
        }
      }

      const newAddr: Address = {
        ...input,
        id,
        isDefault: willBeDefault,
      };

      batch.set(newRef, newAddr);
      await batch.commit();

      return await this.listAddresses(uid);
    } catch (err: unknown) {
      throw mapFirebaseError(err, 'Không thể thêm địa chỉ mới.');
    }
  },

  /** Cập nhật thông tin địa chỉ */
  async updateAddress(id: string, patch: Partial<Address>, userId?: string): Promise<Address[]> {
    if (IS_MOCK_MODE) {
      const exists = mockAddressesDb.some((a) => a.id === id);
      if (!exists) apiError('ADDRESS_NOT_FOUND', 'Không tìm thấy địa chỉ.');
      mockAddressesDb = mockAddressesDb.map((a) => (a.id === id ? { ...a, ...patch } : a));
      return [...mockAddressesDb];
    }

    const uid = getCurrentUid(userId);
    try {
      const addrRef = doc(db, 'users', uid, 'addresses', id);
      await setDoc(addrRef, patch, { merge: true });
      return await this.listAddresses(uid);
    } catch (err: unknown) {
      throw mapFirebaseError(err, 'Không thể cập nhật địa chỉ.');
    }
  },

  /** Xoá địa chỉ (tự động gán mặc định nếu xoá địa chỉ mặc định) */
  async deleteAddress(id: string, userId?: string): Promise<Address[]> {
    if (IS_MOCK_MODE) {
      const removing = mockAddressesDb.find((a) => a.id === id);
      if (!removing) apiError('ADDRESS_NOT_FOUND', 'Không tìm thấy địa chỉ.');
      mockAddressesDb = mockAddressesDb.filter((a) => a.id !== id);
      if (removing.isDefault && mockAddressesDb.length > 0) {
        mockAddressesDb = mockAddressesDb.map((a, index) => ({ ...a, isDefault: index === 0 }));
      }
      return [...mockAddressesDb];
    }

    const uid = getCurrentUid(userId);
    try {
      const addresses = await this.listAddresses(uid);
      const target = addresses.find((a) => a.id === id);
      if (!target) apiError('ADDRESS_NOT_FOUND', 'Không tìm thấy địa chỉ cần xoá.');

      const remaining = addresses.filter((a) => a.id !== id);
      const batch = writeBatch(db);

      batch.delete(doc(db, 'users', uid, 'addresses', id));

      if (target.isDefault && remaining.length > 0) {
        batch.set(doc(db, 'users', uid, 'addresses', remaining[0].id), { isDefault: true }, { merge: true });
      }

      await batch.commit();
      return await this.listAddresses(uid);
    } catch (err: unknown) {
      throw mapFirebaseError(err, 'Không thể xoá địa chỉ.');
    }
  },

  /** Đặt làm địa chỉ mặc định duy nhất */
  async setDefaultAddress(id: string, userId?: string): Promise<Address[]> {
    if (IS_MOCK_MODE) {
      const exists = mockAddressesDb.some((a) => a.id === id);
      if (!exists) apiError('ADDRESS_NOT_FOUND', 'Không tìm thấy địa chỉ.');
      mockAddressesDb = mockAddressesDb.map((a) => ({ ...a, isDefault: a.id === id }));
      return [...mockAddressesDb];
    }

    const uid = getCurrentUid(userId);
    try {
      const addresses = await this.listAddresses(uid);
      const exists = addresses.some((a) => a.id === id);
      if (!exists) apiError('ADDRESS_NOT_FOUND', 'Không tìm thấy địa chỉ.');

      const batch = writeBatch(db);
      for (const a of addresses) {
        batch.set(doc(db, 'users', uid, 'addresses', a.id), { isDefault: a.id === id }, { merge: true });
      }
      await batch.commit();

      return await this.listAddresses(uid);
    } catch (err: unknown) {
      throw mapFirebaseError(err, 'Không thể đặt địa chỉ mặc định.');
    }
  },

  /* ----------------------- PHƯƠNG THỨC THANH TOÁN ----------------------- */

  /** Lấy danh sách phương thức thanh toán đã lưu */
  async listPaymentMethods(userId?: string): Promise<PaymentMethod[]> {
    if (IS_MOCK_MODE) return [...mockPaymentsDb];

    const uid = getCurrentUid(userId);
    try {
      const snap = await getDocs(collection(db, 'users', uid, 'paymentMethods'));
      if (!snap.empty) {
        return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<PaymentMethod, 'id'>) }));
      }
      return userId ? [] : [...mockPaymentsDb];
    } catch {
      return userId ? [] : [...mockPaymentsDb];
    }
  },

  /** Thêm thẻ thanh toán mới (Chỉ lưu 4 số cuối last4, bảo mật tuyệt đối) */
  async addPaymentMethod(input: Omit<PaymentMethod, 'id'>, userId?: string): Promise<PaymentMethod[]> {
    if (IS_MOCK_MODE) {
      const created: PaymentMethod = {
        ...input,
        id: `pay-${Date.now()}`,
        isDefault: input.isDefault || mockPaymentsDb.length === 0,
      };
      if (created.isDefault) {
        mockPaymentsDb = mockPaymentsDb.map((p) => ({ ...p, isDefault: false }));
      }
      mockPaymentsDb = [...mockPaymentsDb, created];
      return [...mockPaymentsDb];
    }

    const uid = getCurrentUid(userId);
    try {
      const methods = await this.listPaymentMethods(uid);
      const isFirst = methods.length === 0;
      const willBeDefault = input.isDefault || isFirst;

      const batch = writeBatch(db);
      const newRef = doc(collection(db, 'users', uid, 'paymentMethods'));
      const id = newRef.id;

      if (willBeDefault) {
        for (const m of methods) {
          if (m.isDefault) {
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

  /** Xoá phương thức thanh toán */
  async deletePaymentMethod(id: string, userId?: string): Promise<PaymentMethod[]> {
    if (IS_MOCK_MODE) {
      const removing = mockPaymentsDb.find((p) => p.id === id);
      if (!removing) apiError('PAYMENT_NOT_FOUND', 'Không tìm thấy phương thức thanh toán.');
      mockPaymentsDb = mockPaymentsDb.filter((p) => p.id !== id);
      if (removing.isDefault && mockPaymentsDb.length > 0) {
        mockPaymentsDb = mockPaymentsDb.map((p, index) => ({ ...p, isDefault: index === 0 }));
      }
      return [...mockPaymentsDb];
    }

    const uid = getCurrentUid(userId);
    try {
      const methods = await this.listPaymentMethods(uid);
      const target = methods.find((p) => p.id === id);
      if (!target) apiError('PAYMENT_NOT_FOUND', 'Không tìm thấy phương thức thanh toán cần xoá.');

      const remaining = methods.filter((p) => p.id !== id);
      const batch = writeBatch(db);

      batch.delete(doc(db, 'users', uid, 'paymentMethods', id));

      if (target.isDefault && remaining.length > 0) {
        batch.set(doc(db, 'users', uid, 'paymentMethods', remaining[0].id), { isDefault: true }, { merge: true });
      }

      await batch.commit();
      return await this.listPaymentMethods(uid);
    } catch (err: unknown) {
      throw mapFirebaseError(err, 'Không thể xoá phương thức thanh toán.');
    }
  },

  /** Đặt làm phương thức thanh toán mặc định duy nhất */
  async setDefaultPaymentMethod(id: string, userId?: string): Promise<PaymentMethod[]> {
    if (IS_MOCK_MODE) {
      const exists = mockPaymentsDb.some((p) => p.id === id);
      if (!exists) apiError('PAYMENT_NOT_FOUND', 'Không tìm thấy phương thức thanh toán.');
      mockPaymentsDb = mockPaymentsDb.map((p) => ({ ...p, isDefault: p.id === id }));
      return [...mockPaymentsDb];
    }

    const uid = getCurrentUid(userId);
    try {
      const methods = await this.listPaymentMethods(uid);
      const exists = methods.some((p) => p.id === id);
      if (!exists) apiError('PAYMENT_NOT_FOUND', 'Không tìm thấy phương thức thanh toán.');

      const batch = writeBatch(db);
      for (const m of methods) {
        batch.set(doc(db, 'users', uid, 'paymentMethods', m.id), { isDefault: m.id === id }, { merge: true });
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
    if (IS_MOCK_MODE) return { ...mockSettingsDb };

    const uid = getCurrentUid(userId);
    try {
      const snap = await getDoc(doc(db, 'users', uid, 'settings', 'app'));
      if (snap.exists()) {
        return snap.data() as AppSettings;
      }
      return { ...mockSettingsDb };
    } catch {
      return { ...mockSettingsDb };
    }
  },

  /** Cập nhật cài đặt ứng dụng */
  async updateSettings(patch: Partial<AppSettings>, userId?: string): Promise<AppSettings> {
    if (IS_MOCK_MODE) {
      mockSettingsDb = { ...mockSettingsDb, ...patch };
      return { ...mockSettingsDb };
    }

    const uid = getCurrentUid(userId);
    try {
      const settingRef = doc(db, 'users', uid, 'settings', 'app');
      await setDoc(settingRef, patch, { merge: true });
      return await this.getSettings(uid);
    } catch (err: unknown) {
      throw mapFirebaseError(err, 'Không thể cập nhật cài đặt.');
    }
  },
};
