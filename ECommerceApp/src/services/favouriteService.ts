import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
  writeBatch,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Product } from '../types';
import { mapFirebaseError } from './http';

/**
 * Service quản lý danh sách sản phẩm yêu thích (Favourites/Wishlist)
 * Lưu trữ đồng bộ vào root collection 'user_favourites' (chuẩn ERD)
 * và subcollection 'users/{uid}/favourites' để tối ưu hiệu năng UI.
 */
export const FavouriteService = {
  /** Lấy danh sách sản phẩm yêu thích của user */
  async listFavourites(uid: string): Promise<Product[]> {
    if (!uid) return [];
    try {
      const snap = await getDocs(collection(db, 'users', uid, 'favourites'));
      if (!snap.empty) {
        return snap.docs.map((d) => {
          const data = d.data() as Product;
          return { ...data, id: d.id };
        });
      }

      // Fallback: Nếu subcollection trống, thử đọc từ root collection user_favourites
      const q = query(collection(db, 'user_favourites'), where('userId', '==', uid));
      const rootSnap = await getDocs(q);
      if (rootSnap.empty) return [];

      const productIds = rootSnap.docs.map((d) => d.data().productId as string);
      const productDocs = await Promise.all(
        productIds.map(async (pid) => {
          try {
            const { getDoc } = await import('firebase/firestore');
            const pSnap = await getDoc(doc(db, 'products', pid));
            return pSnap.exists() ? ({ ...pSnap.data(), id: pSnap.id } as Product) : null;
          } catch {
            return null;
          }
        })
      );
      return productDocs.filter((p): p is Product => p !== null);
    } catch (err: unknown) {
      console.warn('[FavouriteService] listFavourites error:', err);
      return [];
    }
  },

  /** Thêm sản phẩm vào danh sách yêu thích */
  async addFavourite(uid: string, product: Product): Promise<void> {
    if (!uid || !product?.id) return;
    try {
      const now = new Date().toISOString();
      const batch = writeBatch(db);

      // 1. Root collection 'user_favourites' theo chuẩn ERD
      const rootFavRef = doc(db, 'user_favourites', `${uid}_${product.id}`);
      batch.set(rootFavRef, {
        userId: uid,
        productId: product.id,
        addedAt: now,
      });

      // 2. Subcollection 'users/{uid}/favourites' cho UI caching
      const subFavRef = doc(db, 'users', uid, 'favourites', product.id);
      batch.set(subFavRef, {
        ...product,
        addedAt: now,
      }, { merge: true });

      await batch.commit();
    } catch (err: unknown) {
      throw mapFirebaseError(err, 'Không thể thêm vào danh sách yêu thích.');
    }
  },

  /** Xoá sản phẩm khỏi danh sách yêu thích */
  async removeFavourite(uid: string, productId: string): Promise<void> {
    if (!uid || !productId) return;
    try {
      const batch = writeBatch(db);

      // 1. Root collection 'user_favourites'
      const rootFavRef = doc(db, 'user_favourites', `${uid}_${productId}`);
      batch.delete(rootFavRef);

      // 2. Subcollection 'users/{uid}/favourites'
      const subFavRef = doc(db, 'users', uid, 'favourites', productId);
      batch.delete(subFavRef);

      await batch.commit();
    } catch (err: unknown) {
      throw mapFirebaseError(err, 'Không thể xoá khỏi danh sách yêu thích.');
    }
  },

  /** Xoá toàn bộ danh sách yêu thích */
  async clearFavourites(uid: string): Promise<void> {
    if (!uid) return;
    try {
      const batch = writeBatch(db);

      // Xóa trong root collection user_favourites
      const q = query(collection(db, 'user_favourites'), where('userId', '==', uid));
      const rootSnap = await getDocs(q);
      rootSnap.docs.forEach((d) => batch.delete(d.ref));

      // Xóa trong subcollection
      const subSnap = await getDocs(collection(db, 'users', uid, 'favourites'));
      subSnap.docs.forEach((d) => batch.delete(d.ref));

      await batch.commit();
    } catch (err: unknown) {
      console.warn('[FavouriteService] clearFavourites error:', err);
    }
  },
};
