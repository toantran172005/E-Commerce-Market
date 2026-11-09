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
import { IS_MOCK_MODE } from './http';
import { MOCK_POPULAR_SEARCHES, MOCK_SEARCH_HISTORY } from '../mock/search';

let mockHistoryDb: SearchHistoryItem[] = [...MOCK_SEARCH_HISTORY];

function getCurrentUid(explicitUid?: string): string {
  if (explicitUid) return explicitUid;
  const current = auth.currentUser;
  if (current?.uid) return current.uid;
  return 'user_alex_carter';
}

/**
 * Service quản lý từ khoá phổ biến và lịch sử tìm kiếm người dùng.
 */
export const SearchService = {
  /** Lấy danh sách từ khoá tìm kiếm phổ biến */
  async getPopularSearches(): Promise<PopularSearch[]> {
    if (IS_MOCK_MODE) return MOCK_POPULAR_SEARCHES;

    try {
      const snap = await getDocs(collection(db, 'popularSearches'));
      if (!snap.empty) {
        return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<PopularSearch, 'id'>) }));
      }
      return MOCK_POPULAR_SEARCHES;
    } catch {
      return MOCK_POPULAR_SEARCHES;
    }
  },

  /** Lấy lịch sử tìm kiếm gần đây của người dùng (tối đa 10 mục) */
  async getSearchHistory(userId?: string): Promise<SearchHistoryItem[]> {
    if (IS_MOCK_MODE) return [...mockHistoryDb];

    const uid = getCurrentUid(userId);
    try {
      const snap = await getDocs(collection(db, 'users', uid, 'searchHistory'));
      if (!snap.empty) {
        const items = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<SearchHistoryItem, 'id'>) }));
        return items
          .map((item) => ({ ...item, createdAt: item.createdAt ? String(item.createdAt) : new Date().toISOString() }))
          .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
          .slice(0, 10);
      }
      return [...mockHistoryDb];
    } catch {
      return [...mockHistoryDb];
    }
  },

  /**
   * Lưu từ khoá tìm kiếm mới:
   * Chống trùng lặp (đưa từ khoá trùng lên đầu), giới hạn tối đa 10 mục gần nhất.
   */
  async saveSearch(keyword: string, userId?: string): Promise<SearchHistoryItem[]> {
    const trimmed = keyword.trim();
    if (!trimmed) return await this.getSearchHistory(userId);

    const newItem: SearchHistoryItem = {
      id: `sh-${Date.now()}`,
      keyword: trimmed,
      createdAt: new Date().toISOString(),
    };

    if (IS_MOCK_MODE) {
      mockHistoryDb = [
        newItem,
        ...mockHistoryDb.filter((h) => h.keyword.toLowerCase() !== trimmed.toLowerCase()),
      ].slice(0, 10);
      return [...mockHistoryDb];
    }

    const uid = getCurrentUid(userId);
    try {
      const existing = await this.getSearchHistory(uid);
      const filtered = existing.filter((h) => h.keyword.toLowerCase() !== trimmed.toLowerCase());
      const updatedList = [newItem, ...filtered].slice(0, 10);

      const batch = writeBatch(db);
      // Clear old and rewrite top 10
      const snap = await getDocs(collection(db, 'users', uid, 'searchHistory'));
      snap.docs.forEach((d) => batch.delete(d.ref));

      updatedList.forEach((item) => {
        const itemRef = doc(collection(db, 'users', uid, 'searchHistory'));
        batch.set(itemRef, { ...item, id: itemRef.id });
      });

      await batch.commit();
      mockHistoryDb = updatedList;
      return updatedList;
    } catch {
      mockHistoryDb = [
        newItem,
        ...mockHistoryDb.filter((h) => h.keyword.toLowerCase() !== trimmed.toLowerCase()),
      ].slice(0, 10);
      return [...mockHistoryDb];
    }
  },

  /** Xoá toàn bộ lịch sử tìm kiếm của người dùng */
  async clearSearchHistory(userId?: string): Promise<SearchHistoryItem[]> {
    if (IS_MOCK_MODE) {
      mockHistoryDb = [];
      return [];
    }

    const uid = getCurrentUid(userId);
    try {
      const snap = await getDocs(collection(db, 'users', uid, 'searchHistory'));
      const batch = writeBatch(db);
      snap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
      mockHistoryDb = [];
      return [];
    } catch {
      mockHistoryDb = [];
      return [];
    }
  },
};
