import {
  collection,
  doc,
  getDoc,
  getDocs,
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
import { apiError, mapFirebaseError } from './http';

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

const STANDARD_SHIPPING_METHODS: ShippingMethod[] = [
  {
    id: 'ship-standard',
    type: 'standard',
    name: 'Giao hàng tiêu chuẩn',
    description: 'Nhận hàng sau 3-5 ngày làm việc',
    estimatedDays: '3 - 5 ngày',
    fee: 30000,
    freeOver: 500000,
  },
  {
    id: 'ship-express',
    type: 'express',
    name: 'Giao hàng hỏa tốc',
    description: 'Nhận hàng trong 24 giờ',
    estimatedDays: '1 ngày',
    fee: 55000,
    freeOver: 1000000,
  },
  {
    id: 'ship-same-day',
    type: 'sameDay',
    name: 'Giao hàng siêu tốc 2h',
    description: 'Nhận hàng ngay trong 2 giờ',
    estimatedDays: '2 giờ',
    fee: 80000,
    freeOver: 2000000,
  },
];

/**
 * Service quản lý danh mục, thương hiệu, sản phẩm và đánh giá 100% từ Cloud Firestore.
 */
export const CatalogService = {
  /** Lấy danh sách toàn bộ danh mục ngành hàng từ Firestore */
  async getCategories(): Promise<Category[]> {
    try {
      const snap = await getDocs(collection(db, 'categories'));
      return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Category, 'id'>) }));
    } catch (err: unknown) {
      throw mapFirebaseError(err, 'Không thể tải danh mục sản phẩm từ Firestore.');
    }
  },

  /** Lấy danh sách các thương hiệu từ Firestore */
  async getBrands(): Promise<Brand[]> {
    try {
      const snap = await getDocs(collection(db, 'brands'));
      return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Brand, 'id'>) }));
    } catch (err: unknown) {
      throw mapFirebaseError(err, 'Không thể tải thương hiệu từ Firestore.');
    }
  },

  /** Lấy danh sách phương thức vận chuyển */
  async getShippingMethods(): Promise<ShippingMethod[]> {
    try {
      const snap = await getDocs(collection(db, 'shippingMethods'));
      if (!snap.empty) {
        return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ShippingMethod, 'id'>) }));
      }
      return STANDARD_SHIPPING_METHODS;
    } catch {
      return STANDARD_SHIPPING_METHODS;
    }
  },

  /**
   * Truy vấn danh sách sản phẩm kết hợp đa tiêu chí từ Firestore:
   * Tìm kiếm từ khoá, phân loại theo danh mục, thương hiệu, khoảng giá, rating, sắp xếp và phân trang.
   */
  async getProducts(productQuery: ProductQuery = {}): Promise<Paged<Product>> {
    const page = productQuery.page ?? 1;
    const limitNum = productQuery.limit ?? 10;
    const q = (productQuery.q ?? '').trim().toLowerCase();

    let allProducts: Product[] = [];
    try {
      const snap = await getDocs(collection(db, 'products'));
      allProducts = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Product, 'id'>) }));
    } catch (err: unknown) {
      throw mapFirebaseError(err, 'Không thể tải sản phẩm từ Firestore.');
    }

    // Lọc theo các tiêu chí (Client-side matching)
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
    const pagedItems = filtered.slice(start, start + limitNum);

    return {
      items: pagedItems,
      page,
      limit: limitNum,
      total,
      hasMore: start + limitNum < total,
    };
  },

  /** Lấy chi tiết một sản phẩm theo ID từ Firestore */
  async getProductById(id: string): Promise<Product> {
    try {
      const snap = await getDoc(doc(db, 'products', id));
      if (snap.exists()) {
        return { id: snap.id, ...(snap.data() as Omit<Product, 'id'>) };
      }
      apiError('PRODUCT_NOT_FOUND', `Không tìm thấy sản phẩm #${id}.`);
    } catch (err: unknown) {
      if ((err as any)?.code === 'PRODUCT_NOT_FOUND') throw err;
      throw mapFirebaseError(err, `Không tìm thấy sản phẩm #${id}.`);
    }
  },

  /** Lấy danh sách đánh giá của sản phẩm từ Firestore */
  async getProductReviews(productId: string): Promise<Review[]> {
    try {
      const snap = await getDocs(collection(db, 'products', productId, 'reviews'));
      return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Review, 'id'>) }));
    } catch {
      return [];
    }
  },

  /** Thêm đánh giá mới cho sản phẩm vào Firestore */
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

    try {
      const ref = doc(collection(db, 'products', productId, 'reviews'), newReview.id);
      await setDoc(ref, newReview);
      return newReview;
    } catch (err: unknown) {
      throw mapFirebaseError(err, 'Không thể gửi đánh giá sản phẩm.');
    }
  },

  /** Lấy danh sách thuộc tính sản phẩm từ root collection 'product_attributes' (ERD) */
  async getProductAttributes(productId: string): Promise<Array<{ id: string; productId: string; type: string; name: string; value: string }>> {
    try {
      const { query, where } = await import('firebase/firestore');
      const q = query(collection(db, 'product_attributes'), where('productId', '==', productId));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
    } catch {
      return [];
    }
  },
};
