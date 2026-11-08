import {
  Brand,
  Category,
  Product,
  Review,
} from '../types';
import { apiError, respond } from './http';
import { MOCK_CATEGORIES } from '../mock/categories';
import { MOCK_BRANDS } from '../mock/brands';
import { MOCK_PRODUCTS } from '../mock/products';
import { MOCK_REVIEWS } from '../mock/reviews';

export interface Paged<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export type ProductSort = 'popular' | 'new' | 'priceAsc' | 'priceDesc' | 'rating';

export interface ProductQuery {
  q?: string;
  category?: string;
  categories?: string[];
  brands?: string[];
  minPrice?: number | null;
  maxPrice?: number | null;
  minRating?: number | null;
  sort?: ProductSort;
  page?: number;
  limit?: number;
}

/**
 * Giả lập Catalog API.
 *
 * GET /categories
 * GET /brands
 * GET /products?category=&q=&brand=&minPrice=&maxPrice=&minRating=&sort=&page=&limit=
 * GET /products/:id
 * GET /products/:id/reviews
 */
export const CatalogService = {
  /** GET /categories */
  async getCategories(): Promise<Category[]> {
    return respond(MOCK_CATEGORIES);
  },

  /** GET /brands */
  async getBrands(): Promise<Brand[]> {
    return respond(MOCK_BRANDS);
  },

  /** GET /products — phân trang + lọc + sắp xếp */
  async getProducts(query: ProductQuery = {}): Promise<Paged<Product>> {
    await respond(null);

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const q = (query.q ?? '').trim().toLowerCase();

    let result = MOCK_PRODUCTS.filter((p) => {
      if (q) {
        const haystack = `${p.name} ${p.brandName ?? ''} ${(p.tags ?? []).join(' ')}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (query.category && p.category !== query.category) return false;
      if (query.categories && query.categories.length > 0 && !query.categories.includes(p.category)) return false;
      if (query.brands && query.brands.length > 0 && !query.brands.includes(p.brandId ?? '')) return false;
      if (query.minPrice != null && p.price < query.minPrice) return false;
      if (query.maxPrice != null && p.price > query.maxPrice) return false;
      if (query.minRating != null && (p.rating ?? 0) < query.minRating) return false;
      return true;
    });

    switch (query.sort ?? 'popular') {
      case 'priceAsc':
        result = [...result].sort((a, b) => a.price - b.price);
        break;
      case 'priceDesc':
        result = [...result].sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        result = [...result].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
        break;
      case 'new':
        result = [...result].sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
        break;
      default:
        result = [...result].sort((a, b) => (b.soldCount ?? 0) - (a.soldCount ?? 0));
    }

    const total = result.length;
    const start = (page - 1) * limit;
    const items = result.slice(start, start + limit);
    return { items, page, limit, total, hasMore: start + limit < total };
  },

  /** GET /products/:id */
  async getProductById(id: string): Promise<Product> {
    await respond(null);
    const product = MOCK_PRODUCTS.find((p) => p.id === id);
    if (!product) apiError('PRODUCT_NOT_FOUND', `Không tìm thấy sản phẩm #${id}.`);
    return product as Product;
  },

  /** GET /products/:id/reviews */
  async getProductReviews(productId: string): Promise<Review[]> {
    await respond(null);
    return MOCK_REVIEWS.filter((r) => r.productId === productId);
  },
};
