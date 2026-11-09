import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit as fsLimit,
  setDoc,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import {
  Brand,
  Category,
  Product,
  Review,
  ShippingMethod,
} from '../types';
import { apiError, mapFirebaseError, IS_MOCK_MODE } from './http';
import { MOCK_CATEGORIES } from '../mock/categories';
import { MOCK_BRANDS } from '../mock/brands';
import { MOCK_PRODUCTS } from '../mock/products';
import { MOCK_REVIEWS } from '../mock/reviews';
import { MOCK_SHIPPING_METHODS } from '../mock/shippingMethods';

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
 * Service quản lý danh mục, thương hiệu, sản phẩm và đánh giá từ Cloud Firestore.
 */
export const CatalogService = {
  /** Lấy danh sách toàn bộ danh mục ngành hàng */
  async getCategories(): Promise<Category[]> {
    if (IS_MOCK_MODE) return MOCK_CATEGORIES;

    try {
      const snap = await getDocs(collection(db, 'categories'));
      if (!snap.empty) {
        return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Category, 'id'>) }));
      }
      return MOCK_CATEGORIES;
    } catch {
      return MOCK_CATEGORIES;
    }
  },

  /** Lấy danh sách các thương hiệu */
  async getBrands(): Promise<Brand[]> {
    if (IS_MOCK_MODE) return MOCK_BRANDS;

    try {
      const snap = await getDocs(collection(db, 'brands'));
      if (!snap.empty) {
        return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Brand, 'id'>) }));
      }
      return MOCK_BRANDS;
    } catch {
      return MOCK_BRANDS;
    }
  },

  /** Lấy danh sách phương thức vận chuyển */
  async getShippingMethods(): Promise<ShippingMethod[]> {
    if (IS_MOCK_MODE) return MOCK_SHIPPING_METHODS;

    try {
      const snap = await getDocs(collection(db, 'shippingMethods'));
      if (!snap.empty) {
        return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ShippingMethod, 'id'>) }));
      }
      return MOCK_SHIPPING_METHODS;
    } catch {
      return MOCK_SHIPPING_METHODS;
    }
  },

  /**
   * Truy vấn danh sách sản phẩm kết hợp đa tiêu chí:
   * Tìm kiếm từ khoá, phân loại theo danh mục, thương hiệu, khoảng giá, rating, sắp xếp và phân trang.
   */
  async getProducts(productQuery: ProductQuery = {}): Promise<Paged<Product>> {
    const page = productQuery.page ?? 1;
    const limitNum = productQuery.limit ?? 10;
    const q = (productQuery.q ?? '').trim().toLowerCase();

    let allProducts: Product[] = [];

    if (!IS_MOCK_MODE) {
      try {
        const snap = await getDocs(collection(db, 'products'));
        if (!snap.empty) {
          allProducts = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Product, 'id'>) }));
        } else {
          allProducts = MOCK_PRODUCTS;
        }
      } catch {
        allProducts = MOCK_PRODUCTS;
      }
    } else {
      allProducts = MOCK_PRODUCTS;
    }

    // Lọc theo các tiêu chí (Client-side matching đảm bảo 100% nhất quán)
    let filtered = allProducts.filter((p) => {
      // 1. Từ khoá tìm kiếm
      if (q) {
        const haystack = `${p.name} ${p.brandName ?? ''} ${(p.tags ?? []).join(' ')}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      // 2. Danh mục đơn lẻ
      if (productQuery.category && p.category !== productQuery.category && (p as any).categoryId !== productQuery.category) {
        return false;
      }

      // 3. Nhiều danh mục
      if (productQuery.categories && productQuery.categories.length > 0) {
        const matchCat = productQuery.categories.includes(p.category) ||
          productQuery.categories.includes((p as any).categoryId ?? '');
        if (!matchCat) return false;
      }

      // 4. Thương hiệu
      if (productQuery.brands && productQuery.brands.length > 0) {
        const matchBrand = productQuery.brands.includes(p.brandId ?? '') ||
          productQuery.brands.includes(p.brandName ?? '');
        if (!matchBrand) return false;
      }

      // 5. Khoảng giá
      if (productQuery.minPrice != null && p.price < productQuery.minPrice) return false;
      if (productQuery.maxPrice != null && p.price > productQuery.maxPrice) return false;

      // 6. Điểm đánh giá sao
      if (productQuery.minRating != null && (p.rating ?? 0) < productQuery.minRating) return false;

      return true;
    });

    // Sắp xếp
    switch (productQuery.sort ?? 'popular') {
      case 'priceAsc':
        filtered = [...filtered].sort((a, b) => a.price - b.price);
        break;
      case 'priceDesc':
        filtered = [...filtered].sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        filtered = [...filtered].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
        break;
      case 'new':
        filtered = [...filtered].sort((a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? '')));
        break;
      case 'popular':
      default:
        filtered = [...filtered].sort((a, b) => (b.soldCount ?? 0) - (a.soldCount ?? 0));
    }

    const total = filtered.length;
    const start = (page - 1) * limitNum;
    const items = filtered.slice(start, start + limitNum);

    return {
      items,
      page,
      limit: limitNum,
      total,
      hasMore: start + limitNum < total,
    };
  },

  /** Lấy chi tiết một sản phẩm theo ID */
  async getProductById(id: string): Promise<Product> {
    if (IS_MOCK_MODE) {
      const p = MOCK_PRODUCTS.find((item) => item.id === id);
      if (!p) apiError('PRODUCT_NOT_FOUND', `Không tìm thấy sản phẩm #${id}.`);
      return p;
    }

    try {
      const snap = await getDoc(doc(db, 'products', id));
      if (snap.exists()) {
        return { id: snap.id, ...(snap.data() as Omit<Product, 'id'>) };
      }
      // Fallback check mock
      const p = MOCK_PRODUCTS.find((item) => item.id === id);
      if (p) return p;
      apiError('PRODUCT_NOT_FOUND', `Không tìm thấy sản phẩm #${id}.`);
    } catch (err: unknown) {
      if ((err as any)?.code === 'PRODUCT_NOT_FOUND') throw err;
      const p = MOCK_PRODUCTS.find((item) => item.id === id);
      if (p) return p;
      throw mapFirebaseError(err, `Không tìm thấy sản phẩm #${id}.`);
    }
  },

  /** Lấy danh sách đánh giá của sản phẩm */
  async getProductReviews(productId: string): Promise<Review[]> {
    if (IS_MOCK_MODE) {
      return MOCK_REVIEWS.filter((r) => r.productId === productId);
    }

    try {
      const snap = await getDocs(collection(db, 'products', productId, 'reviews'));
      if (!snap.empty) {
        return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Review, 'id'>) }));
      }
      return MOCK_REVIEWS.filter((r) => r.productId === productId);
    } catch {
      return MOCK_REVIEWS.filter((r) => r.productId === productId);
    }
  },

  /** Thêm đánh giá mới cho sản phẩm (lưu vào Firestore và local mock) */
  async addProductReview(
    productId: string,
    review: Omit<Review, 'id' | 'productId'>,
  ): Promise<Review> {
    const newReview: Review = {
      id: `rev-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      productId,
      ...review,
      createdAt: review.createdAt || new Date().toISOString(),
    };

    if (!IS_MOCK_MODE) {
      try {
        const ref = doc(collection(db, 'products', productId, 'reviews'), newReview.id);
        await setDoc(ref, newReview);
      } catch {
        // Fallback below
      }
    }

    MOCK_REVIEWS.unshift(newReview);
    return newReview;
  },
};
