import { PopularSearch, SearchHistoryItem } from '../types';

export const MOCK_SEARCH_HISTORY: SearchHistoryItem[] = [
  { id: 'sh-01', keyword: 'tai nghe chống ồn', createdAt: '2026-11-03T09:00:00Z' },
  { id: 'sh-02', keyword: 'laptop gaming', createdAt: '2026-11-02T14:20:00Z' },
  { id: 'sh-03', keyword: 'đồng hồ thông minh', createdAt: '2026-11-01T20:10:00Z' },
  { id: 'sh-04', keyword: 'điện thoại 5g', createdAt: '2026-10-30T11:45:00Z' },
  { id: 'sh-05', keyword: 'bàn phím cơ', createdAt: '2026-10-28T08:30:00Z' },
  { id: 'sh-06', keyword: 'flycam 4k', createdAt: '2026-10-25T19:05:00Z' },
];

export const MOCK_POPULAR_SEARCHES: PopularSearch[] = [
  { id: 'ps-01', keyword: 'Flash sale', count: 12800 },
  { id: 'ps-02', keyword: 'NovaPhone 11 Ultra', count: 9650 },
  { id: 'ps-03', keyword: 'Tai nghe bluetooth', count: 8210 },
  { id: 'ps-04', keyword: 'Laptop gaming', count: 7940 },
  { id: 'ps-05', keyword: 'Đồng hồ thông minh', count: 6120 },
  { id: 'ps-06', keyword: 'Camera an ninh', count: 4780 },
  { id: 'ps-07', keyword: 'Bàn phím cơ', count: 3990 },
  { id: 'ps-08', keyword: 'Action camera', count: 3100 },
];
