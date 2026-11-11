export type ISODateString = string;
export type ProductAttributeType = 'color' | 'spec' | 'storage' | 'warranty';
export type NotificationType = 'order' | 'promo' | 'system';
export type ShippingAddressType = 'Nhà riêng' | 'Văn phòng';

export interface Brand {
  id: string;
  name: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  productCount: number;
}

export interface Product {
  id: string;
  categoryId: string;
  brandId: string;
  name: string;
  price: number;
  originalPrice: number;
  discountPercent: number;
  rating: number;
  reviewCount: number;
  stock: number;
  inStock: boolean;
  description: string;
  imageUrl: string;
  isFeatured: boolean;
  isFlashSale: boolean;
}

export interface ProductAttribute {
  id: string;
  productId: string;
  type: ProductAttributeType;
  name: string;
  value: string;
}

export interface UserFavourite {
  userId: string;
  productId: string;
  addedAt: ISODateString;
}

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  membershipBadge: string;
  avatarUrl: string;
  orderCount: number;
  wishlistCount: number;
}

export interface ShippingAddress {
  id: string;
  userId: string;
  type: ShippingAddressType;
  recipientName: string;
  phoneNumber: string;
  fullAddress: string;
  isDefault: boolean;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  name: string;
  brand: string;
  variant: string;
  price: number;
  originalPrice: number;
  quantity: number;
  imageUrl: string;
}

export interface Order {
  id: string;
  userId: string;
  customerName: string;
  phoneNumber: string;
  shippingAddress: string;
  date: ISODateString;
  itemCount: number;
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  totalAmount: number;
  status: string;
  currentStep: number;
  canCancel: boolean;
  cancelReason: string;
  cancelledAt: string;
  paymentMethod: string;
  promoCode: string;
}

export interface Promo {
  code: string;
  discountPercent: number;
  description: string;
  minOrderValue?: number;
  isActive?: boolean;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  type: NotificationType;
  date: ISODateString;
}
