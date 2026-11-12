import { Ionicons } from '@expo/vector-icons';

/* ==================================================================== */
/*  Các type nền tảng cho E-Commerce Marketplace.                       */
/*  GIỮ NGUYÊN các export cũ, chỉ thêm field optional để tương thích.   */
/* ==================================================================== */

export type IoniconName = keyof typeof Ionicons.glyphMap;

/** Biến thể sản phẩm (màu, dung lượng, kích thước). */
export interface ProductVariant {
  id: string;
  name: string;
  type: 'color' | 'storage' | 'size';
  inStock: number;
}

export interface ProductDetailItem {
  label: string;
  value: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  description: string;
  imageUrl: string;
  category: string;
  rating?: number;
  stock?: number;

  /* --- Mở rộng (optional để tương thích code cũ) --- */
  images?: string[];
  reviewCount?: number;
  soldCount?: number;
  brandId?: string;
  brandName?: string;
  specs?: Record<string, string>;
  tags?: string[];
  badge?: 'sale' | 'new' | 'hot';
  variants?: ProductVariant[];
  createdAt?: string;

  /* --- Shopee-Style Extended Specification & Description (mobile.docx B) --- */
  categoryPath?: string[];
  details?: ProductDetailItem[];
  highlights?: string[];
  longDescription?: string;
  usageGuide?: string;
  warrantyPolicy?: string;
  origin?: string;
  promotionQuantity?: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selected?: boolean;
  id?: string;
  variantId?: string;
  variantName?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  fullName?: string;
  phoneNumber?: string;
  address?: string;
  avatarUrl?: string;
  isGuest?: boolean;
  createdAt?: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
  variantId?: string;
  variantName?: string;
}

export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export interface OrderTimelineStep {
  key: string;
  label: string;
  icon: IoniconName;
  date: string;
  completed: boolean;
}

export interface Order {
  id: string;
  userId: string;
  customerName: string;
  phoneNumber: string;
  shippingAddress: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  currentStep?: number;
  canCancel?: boolean;
  cancelReason?: string;
  cancelledAt?: string | number;
  createdAt: number | string;

  /* --- Mở rộng --- */
  subtotal?: number;
  shippingFee?: number;
  tax?: number;
  discount?: number;
  voucherCode?: string;
  paymentMethodId?: string;
  paymentMethodName?: string;
  shippingMethodId?: string;
  shippingMethodName?: string;
  trackingCode?: string;
  timeline?: OrderTimelineStep[];
  note?: string;
  paymentStatus?: 'paid' | 'pending' | 'failed';
  discountAmount?: number;
  recipientName?: string;
  reviewedItemIds?: string[];
  nextStatusAt?: number | null;
  updatedAt?: number | string;
}

export interface Review {
  id: string;
  productId: string;
  orderId?: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  images?: string[];
  createdAt: number | string;
}

export type Rating = Review;

export interface Category {
  id: string;
  name: string;
  icon: IoniconName;
}

export interface Brand {
  id: string;
  name: string;
  /** Chữ viết tắt hiển thị thay logo. */
  shortName: string;
}

export type VoucherType = 'percent' | 'fixed' | 'freeShip';

export interface Voucher {
  id: string;
  code: string;
  title: string;
  type: VoucherType;
  /** % giảm hoặc số tiền giảm. */
  value: number;
  /** Đơn tối thiểu để áp dụng. */
  minOrderValue: number;
  /** Giới hạn tiền giảm tối đa cho loại %. */
  maxDiscount?: number;
  startsAt: string;
  expiresAt: string;
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
  applicableCategories?: string[];
}

export interface Address {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  address: string;
  isDefault: boolean;
  province?: string;
  district?: string;
  ward?: string;
  street?: string;
}

export type PaymentMethodType = 'card' | 'wallet' | 'cod';

export interface PaymentMethod {
  id: string;
  type: PaymentMethodType;
  name: string;
  /** Ví dụ "Visa •••• 4242". */
  detail: string;
  expiry?: string;
  isDefault: boolean;
  /** Màu thương hiệu, ví dụ #D82D8B cho MoMo. */
  color?: string;
  /** URL ảnh thẻ ngân hàng / ví. */
  image?: string;
  /** Tên in trên thẻ (chủ thẻ) */
  holderName?: string;
}

export type NotificationType = 'order' | 'promo' | 'system' | 'review';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  orderId?: string;
  data?: { orderId?: string; productId?: string };
}

export interface FaqGroup {
  id: string;
  name: string;
}

export interface Faq {
  id: string;
  groupId: string;
  question: string;
  answer: string;
}

export type TicketStatus = 'open' | 'answered' | 'closed';

export interface SupportTicket {
  id: string;
  userId: string;
  subject: string;
  message: string;
  status: TicketStatus;
  createdAt: string;
  lastReply?: string;
}

export interface AppSettings {
  language: 'vi' | 'en';
  currency: 'USD' | 'VND';
  darkMode: boolean;
  pushEnabled: boolean;
  emailEnabled: boolean;
  biometricEnabled: boolean;
}

export interface SearchHistoryItem {
  id: string;
  keyword: string;
  createdAt: string;
}

export interface PopularSearch {
  id: string;
  keyword: string;
  count: number;
}

export type ShippingMethodType = 'standard' | 'express' | 'sameDay';

export interface ShippingMethod {
  id: string;
  type: ShippingMethodType;
  name: string;
  description: string;
  /** Ví dụ "2 - 4 ngày". */
  estimatedDays: string;
  fee: number;
  /** Miễn phí khi đơn trên giá trị này. */
  freeOver: number;
}
