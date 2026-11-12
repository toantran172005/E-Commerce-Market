Below is the complete production implementation for all required files.

> Assumes Firebase is initialized at `src/config/firebase.ts` and exports `db`.  
> No extra composite indexes are required by the queries below because sorting/filtering is done client-side where necessary.

---

## `ECommerceApp/src/types/index.ts`

```ts
export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export interface OrderTimelineStep {
  status: OrderStatus;
  label?: string;
  title?: string;
  timestamp?: number | string;
  completed: boolean;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
  variantName?: string;
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  canCancel?: boolean;
  timeline?: OrderTimelineStep[];
  reviewedItemIds?: string[];
  createdAt: number | string;
  updatedAt?: number | string;
  nextStatusAt?: number | null;

  // Optional fields used by other parts of the marketplace.
  shippingAddress?: unknown;
  paymentMethod?: string;
  note?: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  rating?: number;
  reviewCount?: number;
  categoryId?: string;
  description?: string;
  stock?: number;
  sold?: number;
  [key: string]: unknown;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  content: string;
  createdAt: number | string;
  images?: string[];
  userAvatar?: string;
  orderId?: string;
}

export interface Rating {
  id: string;
  productId: string;
  orderId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  images: string[];
  createdAt: number;
}

export interface AppNotification {
  id?: string;
  userId: string;
  orderId?: string;
  status?: OrderStatus;
  title: string;
  body: string;
  type: 'order_status' | string;
  read: boolean;
  createdAt: number;
}
```

---

## `ECommerceApp/src/services/orderService.ts`

```ts
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  setDoc,
  Timestamp,
  where,
  type DocumentData,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type {
  Order,
  OrderItem,
  OrderStatus,
  OrderTimelineStep,
} from '../types';

const ORDERS_COLLECTION = 'orders';
const NOTIFICATIONS_COLLECTION = 'notifications';
const STATUS_TRANSITION_MS = 5000;

const STATUS_STEPS: Array<{ status: OrderStatus; label: string }> = [
  { status: 'pending', label: 'Chờ xử lý' },
  { status: 'processing', label: 'Đã xác nhận' },
  { status: 'shipped', label: 'Đang vận chuyển' },
  { status: 'delivered', label: 'Đã giao hàng' },
];

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'Chờ xử lý',
  processing: 'Đã xác nhận',
  shipped: 'Đang vận chuyển',
  delivered: 'Đã giao hàng',
  cancelled: 'Đã huỷ',
};

export interface CreateOrderInput {
  userId: string;
  items: OrderItem[];
  totalAmount: number;
  shippingAddress?: unknown;
  paymentMethod?: string;
  note?: string;
}

function toMillis(value: unknown): number | string {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return value;

  if (value instanceof Timestamp) {
    return value.toMillis();
  }

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

  return Date.now();
}

function createdAtToNumber(value: number | string): number {
  if (typeof value === 'number') return value;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function getNextStatus(status: OrderStatus): OrderStatus | null {
  switch (status) {
    case 'pending':
      return 'processing';
    case 'processing':
      return 'shipped';
    case 'shipped':
      return 'delivered';
    default:
      return null;
  }
}

function buildInitialTimeline(now: number): OrderTimelineStep[] {
  return STATUS_STEPS.map((step, index) => {
    const timelineStep: OrderTimelineStep = {
      status: step.status,
      label: step.label,
      title: step.label,
      completed: index === 0,
    };

    if (index === 0) {
      timelineStep.timestamp = now;
    }

    return timelineStep;
  });
}

function completeTimeline(
  timeline: OrderTimelineStep[] | undefined,
  nextStatus: OrderStatus,
  now: number
): OrderTimelineStep[] {
  const defaultTimeline = buildInitialTimeline(now);
  const existingTimeline = Array.isArray(timeline) ? timeline : [];

  const merged = defaultTimeline.map((defaultStep) => {
    const existingStep = existingTimeline.find(
      (step) => step.status === defaultStep.status
    );

    return existingStep ? { ...defaultStep, ...existingStep } : defaultStep;
  });

  if (nextStatus === 'cancelled') {
    const existingCancelled = existingTimeline.find(
      (step) => step.status === 'cancelled'
    );

    const cancelledStep: OrderTimelineStep = existingCancelled
      ? {
          ...existingCancelled,
          label: existingCancelled.label ?? 'Đã huỷ',
          title: existingCancelled.title ?? 'Đã huỷ',
          completed: true,
          timestamp: existingCancelled.timestamp ?? now,
        }
      : {
          status: 'cancelled',
          label: 'Đã huỷ',
          title: 'Đã huỷ',
          completed: true,
          timestamp: now,
        };

    return [...merged, cancelledStep];
  }

  const nextIndex = STATUS_STEPS.findIndex(
    (step) => step.status === nextStatus
  );

  return merged.map((step) => {
    const stepIndex = STATUS_STEPS.findIndex(
      (statusStep) => statusStep.status === step.status
    );

    if (stepIndex === -1) return step;

    if (stepIndex < nextIndex) {
      return {
        ...step,
        completed: true,
        timestamp: step.timestamp ?? now,
      };
    }

    if (stepIndex === nextIndex) {
      return {
        ...step,
        completed: true,
        timestamp: now,
        label: step.label ?? STATUS_STEPS[stepIndex].label,
        title: step.title ?? STATUS_STEPS[stepIndex].label,
      };
    }

    return {
      ...step,
      completed: false,
    };
  });
}

function sanitizeItems(items: OrderItem[]): OrderItem[] {
  return items.map((item) => {
    const sanitized: OrderItem = {
      productId: item.productId,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      imageUrl: item.imageUrl,
    };

    if (item.variantName) {
      sanitized.variantName = item.variantName;
    }

    return sanitized;
  });
}

function mapOrder(id: string, data: DocumentData): Order {
  return {
    id,
    userId: data.userId,
    items: Array.isArray(data.items)
      ? data.items.map((item: Partial<OrderItem>) => ({
          productId: item.productId ?? '',
          name: item.name ?? '',
          price: Number(item.price ?? 0),
          quantity: Number(item.quantity ?? 0),
          imageUrl: item.imageUrl ?? '',
          ...(item.variantName ? { variantName: item.variantName } : {}),
        }))
      : [],
    totalAmount: Number(data.totalAmount ?? 0),
    status: (data.status as OrderStatus) ?? 'pending',
    canCancel: Boolean(data.canCancel),
    timeline: Array.isArray(data.timeline)
      ? data.timeline.map((step: Partial<OrderTimelineStep>) => {
          const status = (step.status as OrderStatus) ?? 'pending';

          return {
            status,
            label:
              step.label ??
              step.title ??
              ORDER_STATUS_LABEL[status] ??
              status,
            title:
              step.title ??
              step.label ??
              ORDER_STATUS_LABEL[status] ??
              status,
            completed: Boolean(step.completed),
            ...(step.timestamp !== undefined && step.timestamp !== null
              ? { timestamp: toMillis(step.timestamp) }
              : {}),
          };
        })
      : undefined,
    reviewedItemIds: Array.isArray(data.reviewedItemIds)
      ? data.reviewedItemIds.filter(
          (itemId: unknown): itemId is string => typeof itemId === 'string'
        )
      : [],
    createdAt: toMillis(data.createdAt),
    ...(data.updatedAt !== undefined
      ? { updatedAt: toMillis(data.updatedAt) }
      : {}),
    nextStatusAt:
      typeof data.nextStatusAt === 'number' ? data.nextStatusAt : null,
    ...(data.shippingAddress !== undefined
      ? { shippingAddress: data.shippingAddress }
      : {}),
    ...(data.paymentMethod !== undefined
      ? { paymentMethod: data.paymentMethod }
      : {}),
    ...(data.note !== undefined ? { note: data.note } : {}),
  };
}

export function getOrderCode(orderId: string): string {
  return `#ORD-${orderId.slice(-6).toUpperCase()}`;
}

async function addOrderNotification(
  userId: string,
  orderId: string,
  status: OrderStatus,
  title: string,
  body: string
): Promise<void> {
  await addDoc(collection(db, NOTIFICATIONS_COLLECTION), {
    userId,
    orderId,
    status,
    title,
    body,
    type: 'order_status',
    read: false,
    createdAt: Date.now(),
  });
}

export function createOrder(input: CreateOrderInput): Promise<Order>;
export function createOrder(
  userId: string,
  items: OrderItem[],
  totalAmount: number
): Promise<Order>;
export async function createOrder(
  inputOrUserId: CreateOrderInput | string,
  items?: OrderItem[],
  totalAmount?: number
): Promise<Order> {
  const input: CreateOrderInput =
    typeof inputOrUserId === 'string'
      ? {
          userId: inputOrUserId,
          items: items ?? [],
          totalAmount: totalAmount ?? 0,
        }
      : inputOrUserId;

  const now = Date.now();
  const orderRef = doc(collection(db, ORDERS_COLLECTION));

  const orderData: Omit<Order, 'id'> = {
    userId: input.userId,
    items: sanitizeItems(input.items),
    totalAmount: Number(input.totalAmount ?? 0),
    status: 'pending',
    canCancel: true,
    timeline: buildInitialTimeline(now),
    reviewedItemIds: [],
    createdAt: now,
    updatedAt: now,
    nextStatusAt: now + STATUS_TRANSITION_MS,
    ...(input.shippingAddress !== undefined
      ? { shippingAddress: input.shippingAddress }
      : {}),
    ...(input.paymentMethod !== undefined
      ? { paymentMethod: input.paymentMethod }
      : {}),
    ...(input.note !== undefined ? { note: input.note } : {}),
  };

  await setDoc(orderRef, orderData);

  await addOrderNotification(
    input.userId,
    orderRef.id,
    'pending',
    'Đặt hàng thành công',
    `Đơn hàng ${getOrderCode(orderRef.id)} đã được tạo và đang chờ xử lý.`
  );

  return {
    id: orderRef.id,
    ...orderData,
  };
}

export async function listOrders(userId: string): Promise<Order[]> {
  const q = query(
    collection(db, ORDERS_COLLECTION),
    where('userId', '==', userId)
  );

  const snapshot = await getDocs(q);
  const orders = snapshot.docs.map((orderDoc) =>
    mapOrder(orderDoc.id, orderDoc.data())
  );

  orders.sort(
    (a, b) =>
      createdAtToNumber(b.createdAt) - createdAtToNumber(a.createdAt)
  );

  return orders;
}

export async function getOrder(orderId: string): Promise<Order> {
  const orderRef = doc(db, ORDERS_COLLECTION, orderId);
  const snapshot = await getDoc(orderRef);

  if (!snapshot.exists()) {
    throw new Error('Không tìm thấy đơn hàng.');
  }

  return mapOrder(snapshot.id, snapshot.data());
}

export function subscribeOrders(
  userId: string,
  onNext: (orders: Order[]) => void,
  onError?: (error: Error) => void
): () => void {
  const q = query(
    collection(db, ORDERS_COLLECTION),
    where('userId', '==', userId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const orders = snapshot.docs.map((orderDoc) =>
        mapOrder(orderDoc.id, orderDoc.data())
      );

      orders.sort(
        (a, b) =>
          createdAtToNumber(b.createdAt) - createdAtToNumber(a.createdAt)
      );

      onNext(orders);
    },
    (error) => {
      onError?.(error);
    }
  );
}

export async function advanceOrderStatusIfDue(
  orderId: string
): Promise<Order | null> {
  const orderRef = doc(db, ORDERS_COLLECTION, orderId);

  return runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(orderRef);

    if (!snapshot.exists()) {
      return null;
    }

    const data = snapshot.data();
    const currentStatus = (data.status as OrderStatus) ?? 'pending';

    if (currentStatus === 'cancelled' || currentStatus === 'delivered') {
      return null;
    }

    const now = Date.now();
    const nextStatusAt =
      typeof data.nextStatusAt === 'number' ? data.nextStatusAt : null;

    if (nextStatusAt === null) {
      transaction.update(orderRef, {
        nextStatusAt: now + STATUS_TRANSITION_MS,
      });
      return null;
    }

    if (now < nextStatusAt) {
      return null;
    }

    const nextStatus = getNextStatus(currentStatus);

    if (!nextStatus) {
      return null;
    }

    const timeline = completeTimeline(
      Array.isArray(data.timeline)
        ? (data.timeline as OrderTimelineStep[])
        : undefined,
      nextStatus,
      now
    );

    const canCancel =
      nextStatus === 'pending' || nextStatus === 'processing';

    const updatedNextStatusAt =
      nextStatus === 'delivered'
        ? null
        : now + STATUS_TRANSITION_MS;

    transaction.update(orderRef, {
      status: nextStatus,
      canCancel,
      timeline,
      updatedAt: now,
      nextStatusAt: updatedNextStatusAt,
    });

    const notificationRef = doc(collection(db, NOTIFICATIONS_COLLECTION));

    transaction.set(notificationRef, {
      userId: data.userId,
      orderId,
      status: nextStatus,
      title: ORDER_STATUS_LABEL[nextStatus],
      body: `Đơn hàng ${getOrderCode(orderId)} ${ORDER_STATUS_LABEL[
        nextStatus
      ].toLowerCase()}.`,
      type: 'order_status',
      read: false,
      createdAt: now,
    });

    return mapOrder(orderId, {
      ...data,
      status: nextStatus,
      canCancel,
      timeline,
      updatedAt: now,
      nextStatusAt: updatedNextStatusAt,
    });
  });
}

export async function cancelOrder(
  orderId: string,
  userId?: string
): Promise<Order> {
  const orderRef = doc(db, ORDERS_COLLECTION, orderId);

  return runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(orderRef);

    if (!snapshot.exists()) {
      throw new Error('Không tìm thấy đơn hàng.');
    }

    const data = snapshot.data();
    const currentStatus = (data.status as OrderStatus) ?? 'pending';

    if (userId && data.userId !== userId) {
      throw new Error('Bạn không có quyền huỷ đơn hàng này.');
    }

    if (currentStatus === 'cancelled') {
      return mapOrder(orderId, data);
    }

    if (currentStatus === 'delivered') {
      throw new Error('Đơn hàng đã giao, không thể huỷ.');
    }

    if (!data.canCancel) {
      throw new Error('Đơn hàng không thể huỷ ở trạng thái hiện tại.');
    }

    if (currentStatus !== 'pending' && currentStatus !== 'processing') {
      throw new Error('Đơn hàng đã được xác nhận vận chuyển, không thể huỷ.');
    }

    const now = Date.now();

    const timeline = completeTimeline(
      Array.isArray(data.timeline)
        ? (data.timeline as OrderTimelineStep[])
        : undefined,
      'cancelled',
      now
    );

    transaction.update(orderRef, {
      status: 'cancelled',
      canCancel: false,
      timeline,
      updatedAt: now,
      nextStatusAt: null,
    });

    const notificationRef = doc(collection(db, NOTIFICATIONS_COLLECTION));

    transaction.set(notificationRef, {
      userId: data.userId,
      orderId,
      status: 'cancelled',
      title: 'Đơn hàng đã huỷ',
      body: `Đơn hàng ${getOrderCode(orderId)} đã được huỷ.`,
      type: 'order_status',
      read: false,
      createdAt: now,
    });

    return mapOrder(orderId, {
      ...data,
      status: 'cancelled',
      canCancel: false,
      timeline,
      updatedAt: now,
      nextStatusAt: null,
    });
  });
}

export async function reorder(orderId: string): Promise<Order> {
  const originalOrder = await getOrder(orderId);

  return createOrder({
    userId: originalOrder.userId,
    items: originalOrder.items,
    totalAmount: originalOrder.totalAmount,
  });
}
```

---

## `ECommerceApp/src/services/ratingService.ts`

```ts
import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  updateDoc,
  where,
  type DocumentData,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Order, Rating } from '../types';

const RATINGS_COLLECTION = 'ratings';
const ORDERS_COLLECTION = 'orders';
const PRODUCTS_COLLECTION = 'products';

export interface SubmitRatingInput {
  productId: string;
  orderId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  images?: string[];
}

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

  return Date.now();
}

function mapRating(id: string, data: DocumentData): Rating {
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
      ? data.images.filter(
          (image: unknown): image is string => typeof image === 'string'
        )
      : [],
    createdAt: toMillis(data.createdAt),
  };
}

export async function recalculateProductRating(
  productId: string
): Promise<{ rating: number; reviewCount: number }> {
  const ratingsQuery = query(
    collection(db, RATINGS_COLLECTION),
    where('productId', '==', productId)
  );

  const snapshot = await getDocs(ratingsQuery);

  let sum = 0;
  let count = 0;

  snapshot.forEach((ratingDoc) => {
    const value = Number(ratingDoc.data().rating);

    if (Number.isFinite(value) && value >= 1 && value <= 5) {
      sum += value;
      count += 1;
    }
  });

  const rating =
    count > 0 ? Math.round((sum / count) * 10) / 10 : 0;

  await updateDoc(doc(db, PRODUCTS_COLLECTION, productId), {
    rating,
    reviewCount: count,
  });

  return { rating, reviewCount: count };
}

export async function submitRating(
  input: SubmitRatingInput
): Promise<Rating> {
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
  const ratingRef = doc(collection(db, RATINGS_COLLECTION));
  const now = Date.now();

  const submittedRating: Rating = {
    id: ratingRef.id,
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

    if (orderData.userId !== userId) {
      throw new Error('Bạn không có quyền đánh giá đơn hàng này.');
    }

    if (orderData.status !== 'delivered') {
      throw new Error('Chỉ có thể đánh giá sản phẩm trong đơn hàng đã giao.');
    }

    const orderItems = Array.isArray(orderData.items)
      ? orderData.items
      : [];

    const hasProduct = orderItems.some(
      (item) => item.productId === productId
    );

    if (!hasProduct) {
      throw new Error('Sản phẩm không tồn tại trong đơn hàng này.');
    }

    const reviewedItemIds = Array.isArray(orderData.reviewedItemIds)
      ? orderData.reviewedItemIds
      : [];

    if (reviewedItemIds.includes(productId)) {
      throw new Error('Bạn đã đánh giá sản phẩm này trong đơn hàng.');
    }

    transaction.set(ratingRef, {
      productId,
      orderId,
      userId,
      userName,
      userAvatar: userAvatar ?? '',
      rating,
      comment: comment.trim(),
      images: images ?? [],
      createdAt: now,
    });

    transaction.update(orderRef, {
      reviewedItemIds: arrayUnion(productId),
      updatedAt: now,
    });
  });

  // The ratings collection is the source of truth.
  // Product rating is recalculated from real rating records.
  try {
    await recalculateProductRating(productId);
  } catch (error) {
    // Product aggregates are denormalized. Even if this write fails,
    // catalogService recomputes actual rating from the ratings collection.
    console.warn('Failed to update product rating aggregate:', error);
  }

  return submittedRating;
}

export async function getRatingByOrderAndProduct(
  orderId: string,
  productId: string
): Promise<Rating | null> {
  // Query by orderId only to avoid requiring a composite index.
  // An order has a small number of items.
  const ratingsQuery = query(
    collection(db, RATINGS_COLLECTION),
    where('orderId', '==', orderId)
  );

  const snapshot = await getDocs(ratingsQuery);

  const matchedDoc = snapshot.docs.find(
    (ratingDoc) => ratingDoc.data().productId === productId
  );

  if (!matchedDoc) {
    return null;
  }

  return mapRating(matchedDoc.id, matchedDoc.data());
}

export async function getProductRatings(
  productId: string
): Promise<Rating[]> {
  const ratingsQuery = query(
    collection(db, RATINGS_COLLECTION),
    where('productId', '==', productId)
  );

  const snapshot = await getDocs(ratingsQuery);

  return snapshot.docs
    .map((ratingDoc) => mapRating(ratingDoc.id, ratingDoc.data()))
    .sort((a, b) => b.createdAt - a.createdAt);
}
```

---

## `ECommerceApp/src/services/catalogService.ts`

```ts
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  type DocumentData,
  type QueryConstraint,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Product, Rating, Review } from '../types';

const PRODUCTS_COLLECTION = 'products';
const RATINGS_COLLECTION = 'ratings';

export interface ProductQuery {
  categoryId?: string;
  search?: string;
  sortBy?: 'newest' | 'price_asc' | 'price_desc' | 'rating_desc';
  limit?: number;
  minPrice?: number;
  maxPrice?: number;
}

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

  return Date.now();
}

function mapProduct(id: string, data: DocumentData): Product {
  return {
    ...data,
    id,
  } as Product;
}

function mapRating(id: string, data: DocumentData): Rating {
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
      ? data.images.filter(
          (image: unknown): image is string => typeof image === 'string'
        )
      : [],
    createdAt: toMillis(data.createdAt),
  };
}

async function fetchRatingsForProductIds(
  productIds: string[]
): Promise<Rating[]> {
  const uniqueIds = Array.from(
    new Set(productIds.filter((id): id is string => Boolean(id)))
  );

  if (uniqueIds.length === 0) {
    return [];
  }

  const ratings: Rating[] = [];

  // Firestore `in` supports max 10 values.
  for (let index = 0; index < uniqueIds.length; index += 10) {
    const chunk = uniqueIds.slice(index, index + 10);

    const ratingsQuery = query(
      collection(db, RATINGS_COLLECTION),
      where('productId', 'in', chunk)
    );

    const snapshot = await getDocs(ratingsQuery);

    snapshot.docs.forEach((ratingDoc) => {
      ratings.push(mapRating(ratingDoc.id, ratingDoc.data()));
    });
  }

  return ratings;
}

async function attachActualRatings(products: Product[]): Promise<Product[]> {
  if (products.length === 0) {
    return products;
  }

  const ratings = await fetchRatingsForProductIds(
    products.map((product) => product.id)
  );

  const stats = new Map<string, { sum: number; count: number }>();

  ratings.forEach((rating) => {
    const current = stats.get(rating.productId) ?? {
      sum: 0,
      count: 0,
    };

    current.sum += rating.rating;
    current.count += 1;

    stats.set(rating.productId, current);
  });

  return products.map((product) => {
    const productStats = stats.get(product.id);
    const reviewCount = productStats?.count ?? 0;
    const rating =
      productStats && reviewCount > 0
        ? Math.round((productStats.sum / reviewCount) * 10) / 10
        : 0;

    return {
      ...product,
      rating,
      reviewCount,
    };
  });
}

export async function getProductById(
  id: string
): Promise<Product | null> {
  const productRef = doc(db, PRODUCTS_COLLECTION, id);
  const snapshot = await getDoc(productRef);

  if (!snapshot.exists()) {
    return null;
  }

  const product = mapProduct(snapshot.id, snapshot.data());
  const productsWithRatings = await attachActualRatings([product]);

  return productsWithRatings[0];
}

export async function getProducts(
  queryParams: ProductQuery = {}
): Promise<Product[]> {
  const constraints: QueryConstraint[] = [];

  // Single-field filter only to avoid requiring composite indexes.
  if (queryParams.categoryId) {
    constraints.push(where('categoryId', '==', queryParams.categoryId));
  }

  const productsRef = collection(db, PRODUCTS_COLLECTION);

  const productsQuery =
    constraints.length > 0
      ? query(productsRef, ...constraints)
      : productsRef;

  const snapshot = await getDocs(productsQuery);

  let products = snapshot.docs.map((productDoc) =>
    mapProduct(productDoc.id, productDoc.data())
  );

  if (queryParams.minPrice !== undefined) {
    products = products.filter(
      (product) => product.price >= queryParams.minPrice!
    );
  }

  if (queryParams.maxPrice !== undefined) {
    products = products.filter(
      (product) => product.price <= queryParams.maxPrice!
    );
  }

  if (queryParams.search?.trim()) {
    const search = queryParams.search.trim().toLowerCase();

    products = products.filter((product) =>
      product.name.toLowerCase().includes(search)
    );
  }

  switch (queryParams.sortBy) {
    case 'price_asc':
      products.sort((a, b) => a.price - b.price);
      break;
    case 'price_desc':
      products.sort((a, b) => b.price - a.price);
      break;
    case 'rating_desc':
      products.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
      break;
    case 'newest':
    default:
      break;
  }

  if (queryParams.limit !== undefined && queryParams.limit > 0) {
    products = products.slice(0, queryParams.limit);
  }

  return attachActualRatings(products);
}

export async function getProductReviews(
  productId: string
): Promise<Review[]> {
  // Query by productId only and sort client-side to avoid composite index.
  const ratingsQuery = query(
    collection(db, RATINGS_COLLECTION),
    where('productId', '==', productId)
  );

  const snapshot = await getDocs(ratingsQuery);

  return snapshot.docs
    .map((ratingDoc) => {
      const rating = mapRating(ratingDoc.id, ratingDoc.data());

      const review: Review = {
        id: rating.id,
        productId: rating.productId,
        userId: rating.userId,
        userName: rating.userName,
        rating: rating.rating,
        content: rating.comment,
        createdAt: rating.createdAt,
        images: rating.images,
        userAvatar: rating.userAvatar,
        orderId: rating.orderId,
      };

      return review;
    })
    .sort((a, b) => {
      const aTime =
        typeof a.createdAt === 'number'
          ? a.createdAt
          : Date.parse(a.createdAt);
      const bTime =
        typeof b.createdAt === 'number'
          ? b.createdAt
          : Date.parse(b.createdAt);

      return (Number.isNaN(bTime) ? 0 : bTime) -
        (Number.isNaN(aTime) ? 0 : aTime);
    });
}
```

---

## `ECommerceApp/src/context/OrdersContext.tsx`

```tsx
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import '../config/firebase';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import {
  advanceOrderStatusIfDue,
  cancelOrder as cancelOrderService,
  getOrder,
  listOrders,
  reorder as reorderService,
  subscribeOrders,
} from '../services/orderService';
import type { Order } from '../types';

interface OrdersContextValue {
  orders: Order[];
  loading: boolean;
  error: string | null;
  loadOrders: () => Promise<void>;
  refreshOrder: (orderId: string) => Promise<Order | null>;
  cancelOrder: (orderId: string) => Promise<void>;
  reorder: (orderId: string) => Promise<Order>;
  clearError: () => void;
}

const OrdersContext = createContext<OrdersContextValue | undefined>(
  undefined
);

const auth = getAuth();

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'Đã xảy ra lỗi. Vui lòng thử lại.';
}

export function OrdersProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(
    auth.currentUser?.uid ?? null
  );

  const transitionInFlightRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserId(user?.uid ?? null);

      if (!user) {
        setOrders([]);
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!userId) {
      setOrders([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribe = subscribeOrders(
      userId,
      (nextOrders) => {
        setOrders(nextOrders);
        setLoading(false);
        setError(null);
      },
      (subscriptionError) => {
        setError(subscriptionError.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    const interval = setInterval(() => {
      const now = Date.now();

      orders.forEach((order) => {
        const isActive =
          order.status === 'pending' ||
          order.status === 'processing' ||
          order.status === 'shipped';

        const isDue =
          typeof order.nextStatusAt === 'number' &&
          order.nextStatusAt <= now;

        if (!isActive || !isDue) return;

        if (transitionInFlightRef.current.has(order.id)) return;

        transitionInFlightRef.current.add(order.id);

        advanceOrderStatusIfDue(order.id)
          .catch((transitionError) => {
            setError(getErrorMessage(transitionError));
          })
          .finally(() => {
            transitionInFlightRef.current.delete(order.id);
          });
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [orders, userId]);

  const loadOrders = useCallback(async () => {
    if (!userId) {
      setOrders([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const nextOrders = await listOrders(userId);
      setOrders(nextOrders);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const refreshOrder = useCallback(
    async (orderId: string): Promise<Order | null> => {
      try {
        const updatedOrder = await getOrder(orderId);

        setOrders((currentOrders) =>
          currentOrders.map((order) =>
            order.id === orderId ? updatedOrder : order
          )
        );

        return updatedOrder;
      } catch (refreshError) {
        setError(getErrorMessage(refreshError));
        return null;
      }
    },
    []
  );

  const cancelOrder = useCallback(
    async (orderId: string): Promise<void> => {
      if (!userId) {
        throw new Error('Bạn cần đăng nhập để huỷ đơn hàng.');
      }

      setError(null);

      try {
        const updatedOrder = await cancelOrderService(orderId, userId);

        setOrders((currentOrders) =>
          currentOrders.map((order) =>
            order.id === orderId ? updatedOrder : order
          )
        );
      } catch (cancelError) {
        const message = getErrorMessage(cancelError);
        setError(message);
        throw cancelError;
      }
    },
    [userId]
  );

  const reorder = useCallback(
    async (orderId: string): Promise<Order> => {
      if (!userId) {
        throw new Error('Bạn cần đăng nhập để mua lại.');
      }

      setError(null);

      try {
        const newOrder = await reorderService(orderId);

        setOrders((currentOrders) => [newOrder, ...currentOrders]);

        return newOrder;
      } catch (reorderError) {
        const message = getErrorMessage(reorderError);
        setError(message);
        throw reorderError;
      }
    },
    [userId]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value = useMemo<OrdersContextValue>(
    () => ({
      orders,
      loading,
      error,
      loadOrders,
      refreshOrder,
      cancelOrder,
      reorder,
      clearError,
    }),
    [
      orders,
      loading,
      error,
      loadOrders,
      refreshOrder,
      cancelOrder,
      reorder,
      clearError,
    ]
  );

  return (
    <OrdersContext.Provider value={value}>
      {children}
    </OrdersContext.Provider>
  );
}

export function useOrders(): OrdersContextValue {
  const context = useContext(OrdersContext);

  if (!context) {
    throw new Error('useOrders must be used within an OrdersProvider');
  }

  return context;
}
```

---

## `ECommerceApp/src/components/ReviewModal.tsx`

```tsx
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import {
  getDownloadURL,
  getStorage,
  ref as storageRef,
  uploadBytes,
} from 'firebase/storage';
import '../config/firebase';
import { submitRating } from '../services/ratingService';

export interface ReviewModalProps {
  visible: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
  orderId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  onSubmitted?: () => void;
}

export default function ReviewModal({
  visible,
  onClose,
  productId,
  productName,
  orderId,
  userId,
  userName,
  userAvatar,
  onSubmitted,
}: ReviewModalProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!visible) return;

    setRating(5);
    setComment('');
    setImages([]);
    setSubmitting(false);
  }, [visible, productId, orderId]);

  const pickImages = async () => {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        'Quyền truy cập ảnh',
        'Vui lòng cấp quyền truy cập thư viện ảnh để thêm ảnh đánh giá.'
      );
      return;
    }

    const remaining = 5 - images.length;

    if (remaining <= 0) {
      Alert.alert('Giới hạn ảnh', 'Bạn chỉ có thể thêm tối đa 5 ảnh.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 0.7,
    });

    if (!result.canceled) {
      const pickedUris = result.assets.map((asset) => asset.uri);

      setImages((currentImages) =>
        [...currentImages, ...pickedUris].slice(0, 5)
      );
    }
  };

  const uploadImages = async (): Promise<string[]> => {
    if (images.length === 0) {
      return [];
    }

    const storage = getStorage();
    const uploadedUrls: string[] = [];

    for (let index = 0; index < images.length; index += 1) {
      const uri = images[index];
      const response = await fetch(uri);
      const blob = await response.blob();

      const rawExtension = uri.split('.').pop()?.split('?')[0] ?? 'jpg';
      const extension = rawExtension.length <= 5 ? rawExtension : 'jpg';

      const path = `ratings/${orderId}/${productId}/${Date.now()}-${index}.${extension}`;
      const imageRef = storageRef(storage, path);

      await uploadBytes(imageRef, blob, {
        contentType: blob.type || 'image/jpeg',
      });

      const downloadUrl = await getDownloadURL(imageRef);
      uploadedUrls.push(downloadUrl);
    }

    return uploadedUrls;
  };

  const handleSubmit = async () => {
    if (submitting) return;

    setSubmitting(true);

    try {
      const uploadedImageUrls = await uploadImages();

      await submitRating({
        productId,
        orderId,
        userId,
        userName,
        userAvatar,
        rating,
        comment,
        images: uploadedImageUrls,
      });

      Alert.alert(
        'Cảm ơn bạn!',
        'Đánh giá của bạn đã được gửi thành công.'
      );

      onSubmitted?.();
      onClose();
    } catch (error) {
      Alert.alert(
        'Không thể gửi đánh giá',
        error instanceof Error
          ? error.message
          : 'Đã xảy ra lỗi. Vui lòng thử lại.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const removeImage = (uri: string) => {
    setImages((currentImages) =>
      currentImages.filter((imageUri) => imageUri !== uri)
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Đánh giá sản phẩm</Text>

            <TouchableOpacity
              onPress={onClose}
              disabled={submitting}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            <Text numberOfLines={2} style={styles.productName}>
              {productName}
            </Text>

            <View style={styles.stars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setRating(star)}
                  disabled={submitting}
                  accessibilityLabel={`${star} sao`}
                >
                  <Ionicons
                    name={star <= rating ? 'star' : 'star-outline'}
                    size={36}
                    color="#FFB800"
                  />
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.ratingText}>{rating} / 5 sao</Text>

            <TextInput
              style={styles.input}
              placeholder="Chia sẻ cảm nhận của bạn về sản phẩm..."
              placeholderTextColor="#999"
              multiline
              value={comment}
              onChangeText={setComment}
              editable={!submitting}
              textAlignVertical="top"
            />

            <View style={styles.imageHeader}>
              <Text style={styles.imageLabel}>
                Ảnh thực tế ({images.length}/5)
              </Text>

              <TouchableOpacity
                style={styles.pickButton}
                onPress={pickImages}
                disabled={submitting || images.length >= 5}
              >
                <Ionicons name="camera-outline" size={18} color="#EE4D2D" />
                <Text style={styles.pickText}>Thêm ảnh</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.imageRow}>
              {images.map((uri) => (
                <View key={uri} style={styles.imageWrap}>
                  <Image source={{ uri }} style={styles.image} />

                  <TouchableOpacity
                    style={styles.removeImage}
                    onPress={() => removeImage(uri)}
                    disabled={submitting}
                  >
                    <Ionicons
                      name="close-circle"
                      size={22}
                      color="#E53935"
                    />
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={[
                styles.submitButton,
                submitting && styles.submitDisabled,
              ]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitText}>Gửi đánh giá</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  container: {
    maxHeight: '90%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  content: {
    padding: 20,
    paddingBottom: 36,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  stars: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  ratingText: {
    textAlign: 'center',
    color: '#6B7280',
    marginTop: 8,
    marginBottom: 20,
    fontSize: 14,
  },
  input: {
    minHeight: 110,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#FAFAFA',
    marginBottom: 20,
  },
  imageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  imageLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  pickButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EE4D2D',
  },
  pickText: {
    color: '#EE4D2D',
    fontSize: 13,
    fontWeight: '600',
  },
  imageRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  imageWrap: {
    position: 'relative',
  },
  image: {
    width: 76,
    height: 76,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
  },
  removeImage: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#fff',
    borderRadius: 11,
  },
  submitButton: {
    backgroundColor: '#EE4D2D',
    borderRadius: 12,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitDisabled: {
    opacity: 0.65,
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
```

---

## `ECommerceApp/app/orders.tsx`

```tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import '../src/config/firebase';
import {
  getAuth,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { useOrders } from '../src/context/OrdersContext';
import ReviewModal from '../src/components/ReviewModal';
import {
  getOrderCode,
  ORDER_STATUS_LABEL,
} from '../src/services/orderService';
import { getRatingByOrderAndProduct } from '../src/services/ratingService';
import type {
  Order,
  OrderItem,
  OrderStatus,
  Rating,
} from '../src/types';

type TabKey = 'all' | 'processing' | 'delivered' | 'cancelled';

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: 'all', label: 'Tất cả' },
  { key: 'processing', label: 'Đang xử lý' },
  { key: 'delivered', label: 'Đã giao' },
  { key: 'cancelled', label: 'Đã huỷ' },
];

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: '#F59E0B',
  processing: '#3B82F6',
  shipped: '#8B5CF6',
  delivered: '#10B981',
  cancelled: '#EF4444',
};

function formatCurrency(value: number): string {
  return `${Math.round(value).toLocaleString('vi-VN')}đ`;
}

function formatDate(value: number | string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleDateString('vi-VN');
}

function EmptyState({ tab }: { tab: TabKey }) {
  const message =
    tab === 'delivered'
      ? 'Chưa có đơn hàng đã giao.'
      : tab === 'cancelled'
        ? 'Chưa có đơn hàng đã huỷ.'
        : 'Chưa có đơn hàng nào.';

  return (
    <View style={styles.empty}>
      <Ionicons name="receipt-outline" size={64} color="#D1D5DB" />
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );
}

function OrderCard({
  order,
  onCancel,
  onReorder,
}: {
  order: Order;
  onCancel: () => void;
  onReorder: () => void;
}) {
  const canCancel =
    Boolean(order.canCancel) &&
    (order.status === 'pending' || order.status === 'processing');

  return (
    <View style={styles.orderCard}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.orderCode}>{getOrderCode(order.id)}</Text>
          <Text style={styles.orderDate}>
            {formatDate(order.createdAt)}
          </Text>
        </View>

        <View
          style={[
            styles.statusBadge,
            { backgroundColor: `${STATUS_COLORS[order.status]}20` },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              { color: STATUS_COLORS[order.status] },
            ]}
          >
            {ORDER_STATUS_LABEL[order.status]}
          </Text>
        </View>
      </View>

      {order.items.map((item, index) => (
        <View
          key={`${order.id}-${item.productId}-${index}`}
          style={styles.itemRow}
        >
          <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />

          <View style={styles.itemInfo}>
            <Text numberOfLines={2} style={styles.itemName}>
              {item.name}
            </Text>

            {!!item.variantName && (
              <Text style={styles.itemVariant}>{item.variantName}</Text>
            )}

            <Text style={styles.itemMeta}>x{item.quantity}</Text>
          </View>

          <Text style={styles.itemPrice}>{formatCurrency(item.price)}</Text>
        </View>
      ))}

      <View style={styles.cardFooter}>
        <Text style={styles.totalLabel}>Tổng cộng:</Text>
        <Text style={styles.totalAmount}>
          {formatCurrency(order.totalAmount)}
        </Text>
      </View>

      <View style={styles.actions}>
        {canCancel && (
          <TouchableOpacity
            style={styles.outlineButton}
            onPress={onCancel}
          >
            <Text style={styles.outlineButtonText}>Huỷ đơn</Text>
          </TouchableOpacity>
        )}

        {order.status === 'delivered' && (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={onReorder}
          >
            <Text style={styles.primaryButtonText}>Mua lại</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function DeliveredItemCard({
  order,
  item,
  onReview,
  onReorder,
}: {
  order: Order;
  item: OrderItem;
  onReview: () => void;
  onReorder: () => void;
}) {
  const reviewed = Boolean(order.reviewedItemIds?.includes(item.productId));

  const [review, setReview] = useState<Rating | null>(null);
  const [loadingReview, setLoadingReview] = useState(false);

  useEffect(() => {
    let active = true;

    if (!reviewed) {
      setReview(null);
      return () => {
        active = false;
      };
    }

    setLoadingReview(true);

    getRatingByOrderAndProduct(order.id, item.productId)
      .then((rating) => {
        if (active) {
          setReview(rating);
        }
      })
      .catch(() => {
        if (active) {
          setReview(null);
        }
      })
      .finally(() => {
        if (active) {
          setLoadingReview(false);
        }
      });

    return () => {
      active = false;
    };
  }, [order.id, item.productId, reviewed]);

  const showReview = () => {
    if (!review) {
      Alert.alert(
        'Đánh giá',
        'Chưa tải được đánh giá. Vui lòng thử lại.'
      );
      return;
    }

    Alert.alert(
      'Đánh giá của bạn',
      `${review.rating} sao\n${review.comment || 'Không có bình luận'}`,
      [{ text: 'Đóng' }]
    );
  };

  return (
    <View style={styles.deliveredCard}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.orderCode}>{getOrderCode(order.id)}</Text>
          <Text style={styles.orderDate}>
            {formatDate(order.createdAt)}
          </Text>
        </View>

        <View
          style={[
            styles.statusBadge,
            { backgroundColor: `${STATUS_COLORS.delivered}20` },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              { color: STATUS_COLORS.delivered },
            ]}
          >
            Đã giao
          </Text>
        </View>
      </View>

      <View style={styles.itemRow}>
        <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />

        <View style={styles.itemInfo}>
          <Text numberOfLines={2} style={styles.itemName}>
            {item.name}
          </Text>

          {!!item.variantName && (
            <Text style={styles.itemVariant}>{item.variantName}</Text>
          )}

          <Text style={styles.itemMeta}>x{item.quantity}</Text>
        </View>

        <Text style={styles.itemPrice}>{formatCurrency(item.price)}</Text>
      </View>

      <View style={styles.reviewStatusRow}>
        {reviewed ? (
          <View style={styles.reviewedWrap}>
            <View style={styles.reviewedBadge}>
              <Ionicons
                name="checkmark-circle"
                size={14}
                color="#10B981"
              />
              <Text style={styles.reviewedText}>Đã đánh giá</Text>
            </View>

            {loadingReview ? (
              <ActivityIndicator size="small" color="#EE4D2D" />
            ) : (
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Ionicons
                    key={star}
                    name={
                      star <= (review?.rating ?? 0)
                        ? 'star'
                        : 'star-outline'
                    }
                    size={14}
                    color="#FFB800"
                  />
                ))}
              </View>
            )}

            <TouchableOpacity
              style={styles.viewReviewButton}
              onPress={showReview}
            >
              <Text style={styles.viewReviewText}>Xem đánh giá</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.reviewButton}
            onPress={onReview}
          >
            <Ionicons name="star" size={16} color="#fff" />
            <Text style={styles.reviewButtonText}>Đánh giá</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.outlineButton}
          onPress={onReorder}
        >
          <Ionicons name="repeat" size={16} color="#EE4D2D" />
          <Text style={[styles.outlineButtonText, { marginLeft: 4 }]}>
            Mua lại
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function OrdersScreen() {
  const { orders, loading, loadOrders, cancelOrder, reorder } = useOrders();

  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [reviewTarget, setReviewTarget] = useState<{
    order: Order;
    item: OrderItem;
  } | null>(null);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, setCurrentUser);

    return unsubscribe;
  }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (activeTab === 'all') return true;

      if (activeTab === 'delivered') {
        return order.status === 'delivered';
      }

      if (activeTab === 'cancelled') {
        return order.status === 'cancelled';
      }

      return (
        order.status === 'pending' ||
        order.status === 'processing' ||
        order.status === 'shipped'
      );
    });
  }, [orders, activeTab]);

  const deliveredItems = useMemo(() => {
    if (activeTab !== 'delivered') {
      return [];
    }

    return filteredOrders.flatMap((order) =>
      order.items.map((item) => ({ order, item }))
    );
  }, [activeTab, filteredOrders]);

  const handleCancel = (order: Order) => {
    Alert.alert(
      'Huỷ đơn hàng',
      `Bạn có chắc muốn huỷ đơn ${getOrderCode(order.id)}?`,
      [
        { text: 'Không', style: 'cancel' },
        {
          text: 'Huỷ đơn',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelOrder(order.id);
            } catch (error) {
              Alert.alert(
                'Không thể huỷ đơn',
                error instanceof Error
                  ? error.message
                  : 'Đã xảy ra lỗi. Vui lòng thử lại.'
              );
            }
          },
        },
      ]
    );
  };

  const handleReorder = async (orderId: string) => {
    try {
      await reorder(orderId);
      Alert.alert(
        'Mua lại thành công',
        'Đơn hàng mới đã được tạo với trạng thái chờ xử lý.'
      );
    } catch (error) {
      Alert.alert(
        'Không thể mua lại',
        error instanceof Error
          ? error.message
          : 'Đã xảy ra lỗi. Vui lòng thử lại.'
      );
    }
  };

  const openReview = (order: Order, item: OrderItem) => {
    if (!currentUser) {
      Alert.alert(
        'Đăng nhập',
        'Vui lòng đăng nhập để đánh giá sản phẩm.'
      );
      return;
    }

    setReviewTarget({ order, item });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Đơn hàng của tôi</Text>
      </View>

      <View style={styles.tabBar}>
        {TABS.map((tab) => {
          const active = activeTab === tab.key;

          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabButton, active && styles.activeTabButton]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text
                style={[
                  styles.tabText,
                  active && styles.activeTabText,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading && orders.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#EE4D2D" />
        </View>
      ) : activeTab === 'delivered' ? (
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={loadOrders}
              tintColor="#EE4D2D"
            />
          }
          contentContainerStyle={styles.listContent}
        >
          {deliveredItems.length === 0 ? (
            <EmptyState tab={activeTab} />
          ) : (
            deliveredItems.map(({ order, item }, index) => (
              <DeliveredItemCard
                key={`${order.id}-${item.productId}-${index}`}
                order={order}
                item={item}
                onReview={() => openReview(order, item)}
                onReorder={() => handleReorder(order.id)}
              />
            ))
          )}
        </ScrollView>
      ) : (
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={loadOrders}
              tintColor="#EE4D2D"
            />
          }
          contentContainerStyle={styles.listContent}
        >
          {filteredOrders.length === 0 ? (
            <EmptyState tab={activeTab} />
          ) : (
            filteredOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onCancel={() => handleCancel(order)}
                onReorder={() => handleReorder(order.id)}
              />
            ))
          )}
        </ScrollView>
      )}

      {reviewTarget && currentUser && (
        <ReviewModal
          visible
          onClose={() => setReviewTarget(null)}
          productId={reviewTarget.item.productId}
          productName={reviewTarget.item.name}
          orderId={reviewTarget.order.id}
          userId={currentUser.uid}
          userName={currentUser.displayName || 'Người dùng'}
          userAvatar={currentUser.photoURL || undefined}
          onSubmitted={() => setReviewTarget(null)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabButton: {
    borderBottomColor: '#EE4D2D',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#EE4D2D',
    fontWeight: '700',
  },
  listContent: {
    padding: 12,
    paddingBottom: 32,
    flexGrow: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    flex: 1,
    minHeight: 360,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  deliveredCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  orderCode: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  orderDate: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#F3F4F6',
  },
  itemImage: {
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    lineHeight: 20,
  },
  itemVariant: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  itemMeta: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E7EB',
  },
  totalLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginRight: 8,
  },
  totalAmount: {
    fontSize: 17,
    fontWeight: '800',
    color: '#EE4D2D',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 12,
  },
  outlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EE4D2D',
    backgroundColor: '#fff',
  },
  outlineButtonText: {
    color: '#EE4D2D',
    fontSize: 14,
    fontWeight: '700',
  },
  primaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: '#EE4D2D',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  reviewStatusRow: {
    marginTop: 10,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E7EB',
  },
  reviewedWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  reviewedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  reviewedText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10B981',
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewReviewButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  viewReviewText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  reviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: '#EE4D2D',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
  },
  reviewButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});
```