import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import { ProductSort } from '../services/catalogService';

export interface ProductFilterState {
  query: string;
  categoryIds: string[];
  brandIds: string[];
  minPrice: number | null;
  maxPrice: number | null;
  minRating: number | null;
  sort: ProductSort;
}

interface ProductFilterContextValue {
  filters: ProductFilterState;
  setQuery: (query: string) => void;
  setCategoryIds: (ids: string[]) => void;
  setBrandIds: (ids: string[]) => void;
  setPriceRange: (min: number | null, max: number | null) => void;
  setMinRating: (rating: number | null) => void;
  setSort: (sort: ProductSort) => void;
  /** Áp nguyên bộ lọc từ màn Filter. */
  applyFilters: (patch: Partial<ProductFilterState>) => void;
  resetFilters: () => void;
  isFiltered: boolean;
}

const INITIAL_FILTERS: ProductFilterState = {
  query: '',
  categoryIds: [],
  brandIds: [],
  minPrice: null,
  maxPrice: null,
  minRating: null,
  sort: 'popular',
};

const ProductFilterContext = createContext<ProductFilterContextValue | null>(null);

export function ProductFilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<ProductFilterState>(INITIAL_FILTERS);

  const setQuery = useCallback((query: string) => {
    setFilters((prev) => ({ ...prev, query }));
  }, []);

  const setCategoryIds = useCallback((ids: string[]) => {
    setFilters((prev) => ({ ...prev, categoryIds: ids }));
  }, []);

  const setBrandIds = useCallback((ids: string[]) => {
    setFilters((prev) => ({ ...prev, brandIds: ids }));
  }, []);

  const setPriceRange = useCallback((min: number | null, max: number | null) => {
    setFilters((prev) => ({ ...prev, minPrice: min, maxPrice: max }));
  }, []);

  const setMinRating = useCallback((rating: number | null) => {
    setFilters((prev) => ({ ...prev, minRating: rating }));
  }, []);

  const setSort = useCallback((sort: ProductSort) => {
    setFilters((prev) => ({ ...prev, sort }));
  }, []);

  const applyFilters = useCallback((patch: Partial<ProductFilterState>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(INITIAL_FILTERS);
  }, []);

  const isFiltered = useMemo(
    () =>
      filters.query.trim().length > 0 ||
      filters.categoryIds.length > 0 ||
      filters.brandIds.length > 0 ||
      filters.minPrice != null ||
      filters.maxPrice != null ||
      filters.minRating != null,
    [filters],
  );

  const value = useMemo(
    () => ({
      filters,
      setQuery,
      setCategoryIds,
      setBrandIds,
      setPriceRange,
      setMinRating,
      setSort,
      applyFilters,
      resetFilters,
      isFiltered,
    }),
    [
      filters, setQuery, setCategoryIds, setBrandIds, setPriceRange,
      setMinRating, setSort, applyFilters, resetFilters, isFiltered,
    ],
  );

  return <ProductFilterContext.Provider value={value}>{children}</ProductFilterContext.Provider>;
}

export function useProductFilter(): ProductFilterContextValue {
  const ctx = useContext(ProductFilterContext);
  if (!ctx) {
    throw new Error('useProductFilter phải được dùng bên trong <ProductFilterProvider>');
  }
  return ctx;
}
