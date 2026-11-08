import { Order, OrderItem } from '../types';
import { apiError, respond } from './http';
import { MOCK_ORDERS } from '../mock/orders';
import { MOCK_PRODUCTS } from '../mock/products';
import { MOCK_ADDRESSES } from '../mock/addresses';
import { MOCK_PAYMENT_METHODS } from '../mock/paymentMethods';
import { MOCK_SHIPPING_METHODS } from '../mock/shippingMethods';
import { MOCK_VOUCHERS } from '../mock/vouchers';
import { computeVoucherDiscount, TAX_RATE } from '../utils/pricing';

/** Bản sao trong bộ nhớ để các mutation (tạo/huỷ đơn) tồn tại trong phiên demo. */
let ordersDb: Order[] = [...MOCK_ORDERS];

export interface CreateOrderInput {
  userId: string;
  customerName: string;
  phoneNumber: string;
  shippingAddress: string;
  items: OrderItem[];
  addressId?: string;
  paymentMethodId?: string;
  paymentMethodName?: string;
  shippingMethodId?: string;
  shippingMethodName?: string;
  voucherCode?: string;
  note?: string;
}

/**
 * Giả lập Order API.
 *
 * GET  /orders?userId=
 * GET  /orders/:id
 * POST /orders
 * POST /orders/:id/cancel
 * POST /orders/:id/reorder
 */
export const OrderService = {
  /** GET /orders?userId= */
  async listOrders(userId: string): Promise<Order[]> {
    await respond(null);
    return ordersDb.filter((o) => o.userId === userId).sort((a, b) =>
      String(b.createdAt).localeCompare(String(a.createdAt)),
    );
  },

  /** GET /orders/:id */
  async getOrder(id: string): Promise<Order> {
    await respond(null);
    const order = ordersDb.find((o) => o.id === id);
    if (!order) apiError('ORDER_NOT_FOUND', `Không tìm thấy đơn hàng #${id}.`);
    return order as Order;
  },

  /** POST /orders — tạo đơn mới, trả về Order vừa tạo */
  async createOrder(input: CreateOrderInput): Promise<Order> {
    await respond(null);

    const address = MOCK_ADDRESSES.find((a) => a.id === input.addressId) ?? MOCK_ADDRESSES[0];
    const payment = MOCK_PAYMENT_METHODS.find((p) => p.id === input.paymentMethodId) ?? MOCK_PAYMENT_METHODS[0];
    const shipping = MOCK_SHIPPING_METHODS.find((s) => s.id === input.shippingMethodId) ?? MOCK_SHIPPING_METHODS[0];
    const voucher = MOCK_VOUCHERS.find((v) => v.code === input.voucherCode) ?? null;

    const subtotal = input.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const baseShipping = subtotal >= shipping.freeOver ? 0 : shipping.fee;
    const discount = computeVoucherDiscount(voucher, subtotal, baseShipping);
    const isFreeShip = voucher?.type === 'freeShip' && subtotal >= voucher.minOrderValue;
    const shippingFee = isFreeShip ? 0 : baseShipping;
    const taxable = Math.max(subtotal - discount + shippingFee, 0);
    const tax = taxable * TAX_RATE;
    const totalAmount = Math.max(subtotal - discount + shippingFee + tax, 0);

    const now = new Date().toISOString();
    const order: Order = {
      id: `ORD-${Math.floor(100000 + Math.random() * 899999)}`,
      userId: input.userId,
      customerName: address.fullName,
      phoneNumber: address.phone,
      shippingAddress: address.address,
      items: input.items,
      subtotal,
      shippingFee,
      tax,
      discount,
      totalAmount,
      status: 'pending',
      currentStep: 1,
      canCancel: true,
      createdAt: now,
      voucherCode: input.voucherCode,
      paymentMethodId: payment.id,
      paymentMethodName: input.paymentMethodName ?? payment.name,
      shippingMethodId: shipping.id,
      shippingMethodName: input.shippingMethodName ?? shipping.name,
      timeline: [
        { key: 'ordered', label: 'Đặt hàng', icon: 'cart', date: now, completed: true },
        { key: 'processing', label: 'Xử lý', icon: 'cube', date: 'Chờ cập nhật', completed: false },
        { key: 'shipped', label: 'Đang giao', icon: 'car', date: 'Chờ cập nhật', completed: false },
        { key: 'delivered', label: 'Đã giao', icon: 'home', date: 'Chờ cập nhật', completed: false },
      ],
      note: input.note,
    };

    ordersDb = [order, ...ordersDb];
    return order;
  },

  /** POST /orders/:id/cancel — body { reason } */
  async cancelOrder(id: string, reason: string): Promise<Order> {
    await respond(null);
    const order = ordersDb.find((o) => o.id === id);
    if (!order) {
      apiError('ORDER_NOT_FOUND', `Không tìm thấy đơn hàng #${id}.`);
    }
    if (!order.canCancel) {
      apiError('ORDER_CANCEL_NOT_ALLOWED', 'Đơn đã qua trạng thái có thể huỷ.');
    }

    const updated: Order = {
      ...(order as Order),
      status: 'cancelled',
      canCancel: false,
      cancelReason: reason,
      cancelledAt: new Date().toISOString(),
      timeline: [
        ...((order as Order).timeline ?? []).filter((s) => s.key !== 'delivered'),
        { key: 'cancelled', label: 'Đã huỷ', icon: 'close', date: new Date().toISOString(), completed: true },
      ],
    };
    ordersDb = ordersDb.map((o) => (o.id === id ? updated : o));
    return updated;
  },

  /** POST /orders/:id/reorder — trả về các OrderItem để thêm vào giỏ */
  async reorder(id: string): Promise<OrderItem[]> {
    await respond(null);
    const order = ordersDb.find((o) => o.id === id);
    if (!order) {
      apiError('ORDER_NOT_FOUND', `Không tìm thấy đơn hàng #${id}.`);
    }

    // Chỉ thêm lại sản phẩm còn hàng
    const items = (order as Order).items.filter((item) => {
      const product = MOCK_PRODUCTS.find((p) => p.id === item.productId);
      return !!product && (product.stock ?? 0) > 0;
    });

    if (items.length === 0) {
      apiError('ORDER_ITEMS_OUT_OF_STOCK', 'Các sản phẩm trong đơn hiện đã hết hàng.');
    }
    return items;
  },
};
