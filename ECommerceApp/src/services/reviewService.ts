import {
  arrayUnion,
  collection,
  doc,
  getDocs,
  query,
  runTransaction,
  updateDoc,
  where,
  type DocumentData,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import type { Order, Review } from '../types';

export const REVIEWS_COLLECTION = 'reviews';
export const RATINGS_COLLECTION = REVIEWS_COLLECTION;
const ORDERS_COLLECTION = 'orders';
const PRODUCTS_COLLECTION = 'products';

export interface SubmitReviewInput {
  productId: string;
  orderId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  images?: string[];
}

export type SubmitRatingInput = SubmitReviewInput;

function toMillis(value: unknown): number {
  if (typeof value === 'number') return value;

  if (
    value &&
    typeof value === 'object' &&
    'toMillis' in value &&
    typeof (value as { toMillis?: unknown }).toMillis === 'function'
  ) {
    return (value as { toMillis: () => number }).toMillis();
  }

  if (value && typeof value === 'object' && 'seconds' in value) {
    const seconds = (value as { seconds?: unknown }).seconds;
    const nanoseconds = (value as { nanoseconds?: unknown }).nanoseconds;

    if (typeof seconds === 'number') {
      const nanos = typeof nanoseconds === 'number' ? nanoseconds : 0;
      return seconds * 1000 + Math.floor(nanos / 1_000_000);
    }
  }

  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) return parsed;
  }

  return Date.now();
}

function mapReview(id: string, data: DocumentData): Review {
  return {
    id,
    productId: data.productId,
    orderId: data.orderId,
    userId: data.userId,
    userName: data.userName ?? '',
    userAvatar: data.userAvatar ?? '',
    rating: Number(data.rating ?? 0),
    comment: data.comment ?? '',
    images: Array.isArray(data.images)
      ? data.images.filter((image: unknown): image is string => typeof image === 'string')
      : [],
    createdAt: toMillis(data.createdAt),
  };
}

/**
 * Tính toán lại điểm trung bình rating và reviewCount thật từ collection 'reviews'
 * và cập nhật document product tương ứng trong Firestore.
 */
export async function recalculateProductRating(
  productId: string
): Promise<{ rating: number; reviewCount: number }> {
  try {
    const reviewsQuery = query(
      collection(db, REVIEWS_COLLECTION),
      where('productId', '==', productId)
    );

    const snapshot = await getDocs(reviewsQuery);

    let sum = 0;
    let count = 0;

    snapshot.forEach((revDoc) => {
      const value = Number(revDoc.data().rating);
      if (Number.isFinite(value) && value >= 1 && value <= 5) {
        sum += value;
        count += 1;
      }
    });

    const rating = count > 0 ? Math.round((sum / count) * 10) / 10 : 5.0;

    await updateDoc(doc(db, PRODUCTS_COLLECTION, productId), {
      rating,
      reviewCount: count,
    }).catch(() => {});

    return { rating, reviewCount: count };
  } catch (error) {
    return { rating: 5.0, reviewCount: 0 };
  }
}

/**
 * Gửi đánh giá (review) cho một sản phẩm trong đơn hàng:
 * 1. Lưu duy nhất vào root collection 'reviews' (không có content, không có verifiedPurchase).
 * 2. Cập nhật order.reviewedItemIds trong Firestore.
 * 3. Tính toán lại rating chuẩn cho sản phẩm.
 */
export async function submitReview(input: SubmitReviewInput): Promise<Review> {
  const {
    productId,
    orderId,
    userId,
    userName,
    userAvatar,
    rating,
    comment,
    images,
  } = input;

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new Error('Đánh giá phải từ 1 đến 5 sao.');
  }

  const orderRef = doc(db, ORDERS_COLLECTION, orderId);
  const reviewRef = doc(collection(db, REVIEWS_COLLECTION));
  const now = Date.now();

  const submittedReview: Review = {
    id: reviewRef.id,
    productId,
    orderId,
    userId,
    userName,
    userAvatar: userAvatar ?? '',
    rating,
    comment: comment.trim(),
    images: images ?? [],
    createdAt: now,
  };

  await runTransaction(db, async (transaction) => {
    const orderSnapshot = await transaction.get(orderRef);

    if (!orderSnapshot.exists()) {
      throw new Error('Không tìm thấy đơn hàng.');
    }

    const orderData = orderSnapshot.data() as Order;

    const orderItems = Array.isArray(orderData.items) ? orderData.items : [];
    const hasProduct = orderItems.some((item) => item.productId === productId);

    if (!hasProduct) {
      throw new Error('Sản phẩm không tồn tại trong đơn hàng này.');
    }

    // 1 khách chỉ được đánh giá 1 lần cho mỗi sản phẩm trong đơn hàng
    if (orderData.reviewedItemIds?.includes(productId)) {
      throw new Error('Sản phẩm này trong đơn hàng đã được bạn đánh giá trước đó.');
    }

    // Ghi trực tiếp và duy nhất vào collection 'reviews'
    transaction.set(reviewRef, {
      id: reviewRef.id,
      productId,
      orderId,
      userId,
      userName,
      userAvatar: userAvatar ?? '',
      rating,
      comment: comment.trim(),
      images: images ?? [],
      createdAt: new Date(now).toISOString(),
    });

    transaction.update(orderRef, {
      reviewedItemIds: arrayUnion(productId),
      updatedAt: now,
    });
  });

  // Cập nhật rating sản phẩm dựa trên data thật
  try {
    await recalculateProductRating(productId);
  } catch {}

  return submittedReview;
}

export const submitRating = submitReview;

/**
 * Lấy đánh giá của một sản phẩm trong một đơn hàng cụ thể từ collection 'reviews'
 */
export async function getReviewByOrderAndProduct(
  orderId: string,
  productId: string
): Promise<Review | null> {
  try {
    const reviewsQuery = query(
      collection(db, REVIEWS_COLLECTION),
      where('orderId', '==', orderId)
    );

    const snapshot = await getDocs(reviewsQuery);
    const matchedDoc = snapshot.docs.find(
      (revDoc) => revDoc.data().productId === productId
    );

    if (!matchedDoc) return null;
    return mapReview(matchedDoc.id, matchedDoc.data());
  } catch {
    return null;
  }
}

export const getRatingByOrderAndProduct = getReviewByOrderAndProduct;

/**
 * Lấy tất cả các đánh giá thật của một sản phẩm từ collection 'reviews'
 */
export async function getProductReviews(productId: string): Promise<Review[]> {
  try {
    const reviewsQuery = query(
      collection(db, REVIEWS_COLLECTION),
      where('productId', '==', productId)
    );

    const snapshot = await getDocs(reviewsQuery);
    return snapshot.docs
      .map((d) => mapReview(d.id, d.data()))
      .sort((a, b) => Number(b.createdAt) - Number(a.createdAt));
  } catch {
    return [];
  }
}

export const getProductRatings = getProductReviews;
