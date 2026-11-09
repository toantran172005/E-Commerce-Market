import { useCallback, useEffect, useState } from 'react';
import { Product } from '../types';
import { ApiError } from '../services/http';
import { CatalogService } from '../services/catalogService';
import { useProductFilter } from '../context/ProductFilterContext';
import { useDebounce } from './useDebounce';

interface UseProductSearchResult {
  products: Product[];
  loading: boolean;
  error: ApiError | null;
  refresh: () => void;
}

/**
 * Gọi GET /products theo bộ lọc đang chọn.
 * Dùng cho màn Home / tìm kiếm / filter.
 */
export function useProductSearch(limit = 20): UseProductSearchResult {
  const { filters } = useProductFilter();
  const debouncedQuery = useDebounce(filters.query, 300);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const page = await CatalogService.getProducts({
        q: debouncedQuery,
        categories: filters.categoryIds,
        brands: filters.brandIds,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        minRating: filters.minRating,
        sort: filters.sort,
        page: 1,
        limit,
      });
      setProducts(page.items);
    } catch (e) {
      setError(e instanceof ApiError ? e : new ApiError('UNKNOWN_ERROR', 'Đã có lỗi xảy ra.'));
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, filters, limit]);

  useEffect(() => {
    void load();
  }, [load]);

  return { products, loading, error, refresh: load };
}
