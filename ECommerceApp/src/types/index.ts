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
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  phoneNumber?: string;
  address?: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
}

export interface Order {
  id: string;
  userId: string;
  customerName: string;
  phoneNumber: string;
  shippingAddress: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  currentStep?: number;
  canCancel?: boolean;
  cancelReason?: string;
  cancelledAt?: string | number;
  createdAt: number | string;
}
