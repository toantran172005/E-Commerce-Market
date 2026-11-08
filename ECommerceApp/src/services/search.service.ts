import { PopularSearch, SearchHistoryItem } from '../types';
import { respond } from './http';
import { MOCK_POPULAR_SEARCHES, MOCK_SEARCH_HISTORY } from '../mock/search';

let historyDb: SearchHistoryItem[] = [...MOCK_SEARCH_HISTORY];

/**
 * Giả lập Search API.
 *
 * GET    /search/popular
 * GET    /search/history
 * POST   /search/history
 * DELETE /search/history
 */
export const SearchService = {
  /** GET /search/popular */
  async getPopularSearches(): Promise<PopularSearch[]> {
    return respond(MOCK_POPULAR_SEARCHES);
  },

  /** GET /search/history */
  async getSearchHistory(): Promise<SearchHistoryItem[]> {
    await respond(null);
    return [...historyDb];
  },

  /** POST /search/history — lưu từ khoá vừa tìm */
  async saveSearch(keyword: string): Promise<SearchHistoryItem[]> {
    await respond(null);
    const newItem: SearchHistoryItem = {
      id: `sh-${Date.now()}`,
      keyword: keyword.trim(),
      createdAt: new Date().toISOString(),
    };
    historyDb = [
      newItem,
      ...historyDb.filter((h) => h.keyword.toLowerCase() !== newItem.keyword.toLowerCase()),
    ].slice(0, 10);
    return [...historyDb];
  },

  /** DELETE /search/history — xoá toàn bộ lịch sử */
  async clearSearchHistory(): Promise<SearchHistoryItem[]> {
    await respond(null);
    historyDb = [];
    return [];
  },
};
