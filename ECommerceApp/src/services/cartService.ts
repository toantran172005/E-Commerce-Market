import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { CartItem } from '../types';
import { mapFirebaseError } from './http';

/**
 * Service quản lý giỏ hàng (Cart) lưu trữ bền vững trên Cloud Firestore cho từng người dùng.
 */
export const CartService = {
  /** Lấy toàn bộ sản phẩm trong giỏ hàng của user */
  async listCartItems(uid: string): Promise<CartItem[]> {
    if (!uid) return [];
    try {
      const snap = await getDocs(collection(db, 'users', uid, 'cart'));
      if (snap.empty) return [];
      return snap.docs.map((d) => {
        const data = d.data() as CartItem;
        return {
          ...data,
          id: d.id,
          selected: data.selected !== false,
        };
      });
    } catch (err: unknown) {
      console.warn('[CartService] listCartItems error:', err);
      return [];
    }
  },

  /** Lưu hoặc cập nhật một mục trong giỏ hàng */
  async saveCartItem(uid: string, item: CartItem): Promise<void> {
    if (!uid || !item?.id) return;
    try {
      const itemRef = doc(db, 'users', uid, 'cart', item.id);
      await setDoc(itemRef, {
        ...item,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    } catch (err: unknown) {
      throw mapFirebaseError(err, 'Không thể cập nhật sản phẩm trong giỏ hàng.');
    }
  },

  /** Cập nhật toàn bộ giỏ hàng (ghi đè đồng bộ) */
  async syncCart(uid: string, items: CartItem[]): Promise<void> {
    if (!uid) return;
    try {
      const snap = await getDocs(collection(db, 'users', uid, 'cart'));
      const batch = writeBatch(db);
      // Xoá các doc cũ không còn trong items
      const newIds = new Set(items.map((i) => i.id));
      snap.docs.forEach((d) => {
        if (!newIds.has(d.id)) {
          batch.delete(d.ref);
        }
      });
      // Ghi các item mới
      items.forEach((item) => {
        const itemRef = doc(collection(db, 'users', uid, 'cart'), item.id);
        batch.set(itemRef, item, { merge: true });
      });
      await batch.commit();
    } catch (err: unknown) {
      console.warn('[CartService] syncCart error:', err);
    }
  },

  /** Xoá một sản phẩm khỏi giỏ hàng */
  async removeCartItem(uid: string, itemId: string): Promise<void> {
    if (!uid || !itemId) return;
    try {
      const itemRef = doc(db, 'users', uid, 'cart', itemId);
      await deleteDoc(itemRef);
    } catch (err: unknown) {
      throw mapFirebaseError(err, 'Không thể xoá sản phẩm khỏi giỏ hàng.');
    }
  },

  /** Xoá sạch toàn bộ giỏ hàng */
  async clearCart(uid: string): Promise<void> {
    if (!uid) return;
    try {
      const snap = await getDocs(collection(db, 'users', uid, 'cart'));
      if (snap.empty) return;
      const batch = writeBatch(db);
      snap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    } catch (err: unknown) {
      console.warn('[CartService] clearCart error:', err);
    }
  },
};
