import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch,
} from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { PopularSearch, SearchHistoryItem } from '../types';

/**
 * Service quản lý từ khoá phổ biến và lịch sử tìm kiếm người dùng 100% từ Cloud Firestore.
 */
export const SearchService = {
  /** Lấy danh sách từ khoá tìm kiếm phổ biến */
  async getPopularSearches(): Promise<PopularSearch[]> {
    try {
      const snap = await getDocs(collection(db, 'popularSearches'));
      if (!snap.empty) {
        return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<PopularSearch, 'id'>) }));
      }
      return [
        { id: 'pop-1', keyword: 'Giày sneaker', count: 1250 },
        { id: 'pop-2', keyword: 'Áo thun nam', count: 980 },
        { id: 'pop-3', keyword: 'Tai nghe bluetooth', count: 840 },
        { id: 'pop-4', keyword: 'Đồng hồ thông minh', count: 650 },
        { id: 'pop-5', keyword: 'Balo laptop', count: 520 },
      ];
    } catch {
      return [
        { id: 'pop-1', keyword: 'Giày sneaker', count: 1250 },
        { id: 'pop-2', keyword: 'Áo thun nam', count: 980 },
        { id: 'pop-3', keyword: 'Tai nghe bluetooth', count: 840 },
        { id: 'pop-4', keyword: 'Đồng hồ thông minh', count: 650 },
        { id: 'pop-5', keyword: 'Balo laptop', count: 520 },
      ];
    }
  },

  /** Lấy lịch sử tìm kiếm gần đây của người dùng (tối đa 10 mục) */
  async getSearchHistory(userId?: string): Promise<SearchHistoryItem[]> {
    const uid = userId || auth.currentUser?.uid;
    if (!uid) return [];

    try {
      const snap = await getDocs(collection(db, 'users', uid, 'searchHistory'));
      if (!snap.empty) {
        const items = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<SearchHistoryItem, 'id'>) }));
        return items
          .map((item) => ({ ...item, createdAt: item.createdAt ? String(item.createdAt) : new Date().toISOString() }))
          .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
          .slice(0, 10);
      }
      return [];
    } catch {
      return [];
    }
  },

  /**
   * Lưu từ khoá tìm kiếm mới vào Firestore:
   * Chống trùng lặp (đưa từ khoá trùng lên đầu), giới hạn tối đa 10 mục gần nhất.
   */
  async saveSearch(keyword: string, userId?: string): Promise<SearchHistoryItem[]> {
    const trimmed = keyword.trim();
    if (!trimmed) return await this.getSearchHistory(userId);

    const uid = userId || auth.currentUser?.uid;
    if (!uid) return [];

    const newItem: SearchHistoryItem = {
      id: `sh-${Date.now()}`,
      keyword: trimmed,
      createdAt: new Date().toISOString(),
    };

    try {
      const existing = await this.getSearchHistory(uid);
      const filtered = existing.filter((h) => h.keyword.toLowerCase() !== trimmed.toLowerCase());
      const updatedList = [newItem, ...filtered].slice(0, 10);

      const batch = writeBatch(db);
      const snap = await getDocs(collection(db, 'users', uid, 'searchHistory'));
      snap.docs.forEach((d) => batch.delete(d.ref));

      updatedList.forEach((item) => {
        const itemRef = doc(collection(db, 'users', uid, 'searchHistory'));
        batch.set(itemRef, { ...item, id: itemRef.id });
      });

      await batch.commit();
      return updatedList;
    } catch {
      return [];
    }
  },

  /** Xoá toàn bộ lịch sử tìm kiếm */
  async clearSearchHistory(userId?: string): Promise<SearchHistoryItem[]> {
    const uid = userId || auth.currentUser?.uid;
    if (!uid) return [];

    try {
      const snap = await getDocs(collection(db, 'users', uid, 'searchHistory'));
      const batch = writeBatch(db);
      snap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
      return [];
    } catch {
      return [];
    }
  },
};
