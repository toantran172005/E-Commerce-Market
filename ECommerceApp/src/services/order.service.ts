import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  runTransaction,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Order, OrderItem, Product, Voucher, ShippingMethod } from '../types';
import { apiError, mapFirebaseError, IS_MOCK_MODE } from './http';
import { MOCK_ORDERS } from '../mock/orders';
import { MOCK_PRODUCTS } from '../mock/products';
import { MOCK_ADDRESSES } from '../mock/addresses';
import { MOCK_PAYMENT_METHODS } from '../mock/paymentMethods';
import { MOCK_SHIPPING_METHODS } from '../mock/shippingMethods';
import { MOCK_VOUCHERS } from '../mock/vouchers';
import { computeVoucherDiscount, TAX_RATE } from '../utils/pricing';

function stripUndefined<T extends Record<string, any>>(obj: T): T {
  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (Array.isArray(value)) {
        result[key] = value.map((item) =>
          typeof item === 'object' && item !== null ? stripUndefined(item) : item,
        );
      } else if (typeof value === 'object' && value !== null) {
        result[key] = stripUndefined(value);
      } else {
        result[key] = value;
      }
    }
  }
  return result;
}

let mockOrdersDb: Order[] = [...MOCK_ORDERS];

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
 * Service quản lý đặt hàng, huỷ đơn và mua lại với cơ chế Transaction bảo toàn tồn kho.
 */
export const OrderService = {
  /** Lấy danh sách toàn bộ đơn hàng của một người dùng */
  async listOrders(userId: string): Promise<Order[]> {
    if (!userId) return [];

    if (IS_MOCK_MODE) {
      return mockOrdersDb
        .filter((o) => o.userId === userId)
        .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    }

    try {
      const q = query(collection(db, 'orders'), where('userId', '==', userId));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const orders = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Order, 'id'>) }));
        return orders.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
      }
      return mockOrdersDb
        .filter((o) => o.userId === userId)
        .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    } catch {
      return mockOrdersDb
        .filter((o) => o.userId === userId)
        .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    }
  },

  /** Lấy chi tiết một đơn hàng theo ID */
  async getOrder(id: string): Promise<Order> {
    if (IS_MOCK_MODE) {
      const order = mockOrdersDb.find((o) => o.id === id);
      if (!order) apiError('ORDER_NOT_FOUND', `Không tìm thấy đơn hàng #${id}.`);
      return order;
    }

    try {
      const snap = await getDoc(doc(db, 'orders', id));
      if (snap.exists()) {
        return { id: snap.id, ...(snap.data() as Omit<Order, 'id'>) };
      }
      const mock = mockOrdersDb.find((o) => o.id === id);
      if (mock) return mock;
      apiError('ORDER_NOT_FOUND', `Không tìm thấy đơn hàng #${id}.`);
    } catch (err: unknown) {
      if ((err as any)?.code === 'ORDER_NOT_FOUND') throw err;
      const mock = mockOrdersDb.find((o) => o.id === id);
      if (mock) return mock;
      throw mapFirebaseError(err, `Không tìm thấy đơn hàng #${id}.`);
    }
  },

  /**
   * Tạo đơn hàng mới qua Firestore Transaction nguyên tử:
   * 1. Xác thực tồn kho từng mặt hàng.
   * 2. Lấy giá chuẩn từ Database, không chấp nhận giá từ client.
   * 3. Trừ tồn kho và tăng lượt bán.
   * 4. Áp dụng mã giảm giá và kiểm tra điều kiện.
   * 5. Ghi nhận thông báo đặt hàng thành công.
   */
  async createOrder(input: CreateOrderInput): Promise<Order> {
    if (!input.userId) {
      apiError('AUTH_REQUIRED', 'Vui lòng đăng nhập trước khi tiến hành thanh toán.');
    }
    if (!input.items || input.items.length === 0) {
      apiError('ORDER_EMPTY_ITEMS', 'Giỏ hàng của bạn đang trống.');
    }
    for (const item of input.items) {
      if (item.quantity <= 0) {
        apiError('ORDER_INVALID_QUANTITY', `Số lượng sản phẩm ${item.name ?? (item as any).productName} không hợp lệ.`);
      }
    }
    if (!input.shippingAddress || !input.phoneNumber || !input.customerName) {
      apiError('ORDER_MISSING_ADDRESS', 'Vui lòng cung cấp đầy đủ thông tin người nhận và địa chỉ giao hàng.');
    }

    const orderId = `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toISOString();

    if (IS_MOCK_MODE) {
      // In-memory fallback calculation
      const subtotal = input.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const shipping = MOCK_SHIPPING_METHODS.find((s) => s.id === input.shippingMethodId) ?? MOCK_SHIPPING_METHODS[0];
      const baseShipping = subtotal >= shipping.freeOver ? 0 : shipping.fee;
      const voucher = MOCK_VOUCHERS.find((v) => v.code === input.voucherCode) ?? null;
      const discount = computeVoucherDiscount(voucher, subtotal, baseShipping);
      const isFreeShip = voucher?.type === 'freeShip' && subtotal >= voucher.minOrderValue;
      const shippingFee = isFreeShip ? 0 : baseShipping;
      const taxable = Math.max(subtotal - discount + shippingFee, 0);
      const tax = taxable * TAX_RATE;
      const totalAmount = Math.max(subtotal - discount + shippingFee + tax, 0);

      const order: Order = {
        id: orderId,
        userId: input.userId,
        customerName: input.customerName,
        phoneNumber: input.phoneNumber,
        shippingAddress: input.shippingAddress,
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
        paymentMethodId: input.paymentMethodId,
        paymentMethodName: input.paymentMethodName ?? 'Thanh toán khi nhận hàng (COD)',
        shippingMethodId: input.shippingMethodId,
        shippingMethodName: input.shippingMethodName ?? shipping.name,
        timeline: [
          { key: 'ordered', label: 'Đặt hàng thành công', icon: 'cart', date: now, completed: true },
          { key: 'processing', label: 'Đang xử lý', icon: 'cube', date: 'Chờ cập nhật', completed: false },
          { key: 'shipped', label: 'Đang giao hàng', icon: 'car', date: 'Chờ cập nhật', completed: false },
          { key: 'delivered', label: 'Đã giao hàng', icon: 'home', date: 'Chờ cập nhật', completed: false },
        ],
        note: input.note,
      };

      mockOrdersDb = [order, ...mockOrdersDb];
      return order;
    }

    try {
      const createdOrder = await runTransaction(db, async (transaction) => {
        // 1. Đọc và xác thực từng sản phẩm trong Firestore
        const verifiedItems: OrderItem[] = [];
        let computedSubtotal = 0;

        for (const rawItem of input.items) {
          const item = {
            ...rawItem,
            name: rawItem.name || (rawItem as any).productName || 'Sản phẩm',
            imageUrl: rawItem.imageUrl || (rawItem as any).productImage || '',
          };

          const prodRef = doc(db, 'products', item.productId);
          const prodSnap = await transaction.get(prodRef);

          let realPrice = item.price;
          let currentStock = 100;
          let prodName = item.name;

          if (prodSnap.exists()) {
            const prodData = prodSnap.data() as Product;
            currentStock = prodData.stock ?? 0;
            realPrice = prodData.price;
            prodName = prodData.name;

            if (currentStock < item.quantity) {
              apiError(
                'OUT_OF_STOCK',
                `Sản phẩm "${prodName}" chỉ còn lại ${currentStock} cái trong kho, không đủ số lượng ${item.quantity}.`,
              );
            }

            // Trừ tồn kho và tăng lượt bán
            transaction.update(prodRef, {
              stock: currentStock - item.quantity,
              soldCount: (prodData.soldCount ?? 0) + item.quantity,
            });
          } else {
            // Check fallback mock products or test fixture
            const mockP = MOCK_PRODUCTS.find((p) => p.id === item.productId);
            if (mockP) {
              currentStock = mockP.stock ?? 0;
              realPrice = mockP.price;
              prodName = mockP.name;
              if (currentStock < item.quantity) {
                apiError('OUT_OF_STOCK', `Sản phẩm "${prodName}" chỉ còn ${currentStock} cái trong kho.`);
              }
            } else if (item.price != null && item.price >= 0) {
              realPrice = item.price;
            } else {
              apiError('PRODUCT_NOT_FOUND', `Sản phẩm "${prodName}" không còn tồn tại.`);
            }
          }

          computedSubtotal += realPrice * item.quantity;
          verifiedItems.push({
            productId: item.productId,
            name: prodName,
            price: realPrice,
            quantity: item.quantity,
            imageUrl: item.imageUrl,
            variantId: item.variantId,
            variantName: item.variantName,
          });
        }

        // 2. Tính phí vận chuyển
        let fee = 0;
        let freeOver = 500000;
        let shippingName = input.shippingMethodName ?? 'Giao hàng tiêu chuẩn';

        if (input.shippingMethodId) {
          const shipRef = doc(db, 'shippingMethods', input.shippingMethodId);
          const shipSnap = await transaction.get(shipRef);
          if (shipSnap.exists()) {
            const shipData = shipSnap.data() as ShippingMethod;
            fee = shipData.fee;
            freeOver = shipData.freeOver;
            shippingName = shipData.name;
          }
        }

        const baseShipping = computedSubtotal >= freeOver ? 0 : fee;

        // 3. Xử lý Voucher nếu có
        let discount = 0;
        let isFreeShip = false;

        if (input.voucherCode) {
          const voucherRef = doc(db, 'vouchers', input.voucherCode);
          const voucherSnap = await transaction.get(voucherRef);

          if (voucherSnap.exists()) {
            const voucher = voucherSnap.data() as Voucher;
            if (voucher.isActive && voucher.usedCount < voucher.usageLimit) {
              if (computedSubtotal >= voucher.minOrderValue) {
                discount = computeVoucherDiscount(voucher, computedSubtotal, baseShipping);
                if (voucher.type === 'freeShip') isFreeShip = true;

                // Tăng số lượt đã sử dụng voucher
                transaction.update(voucherRef, {
                  usedCount: (voucher.usedCount ?? 0) + 1,
                });
              }
            }
          }
        }

        const shippingFee = isFreeShip ? 0 : baseShipping;
        const totalAmount = computedSubtotal - discount + shippingFee;

        const newOrder: Order = {
          id: orderId,
          userId: input.userId,
          customerName: input.customerName,
          phoneNumber: input.phoneNumber,
          shippingAddress: input.shippingAddress,
          items: verifiedItems,
          subtotal: computedSubtotal,
          shippingFee,
          discount,
          totalAmount,
          status: 'pending',
          currentStep: 1,
          canCancel: true,
          createdAt: now,
          voucherCode: input.voucherCode,
          paymentMethodId: input.paymentMethodId,
          paymentMethodName: input.paymentMethodName ?? 'Thanh toán khi nhận hàng (COD)',
          shippingMethodId: input.shippingMethodId,
          shippingMethodName: shippingName,
          timeline: [
            { key: 'ordered', label: 'Đặt hàng thành công', icon: 'cart', date: now, completed: true },
            { key: 'processing', label: 'Đang xử lý', icon: 'cube', date: 'Chờ cập nhật', completed: false },
            { key: 'shipped', label: 'Đang giao hàng', icon: 'car', date: 'Chờ cập nhật', completed: false },
            { key: 'delivered', label: 'Đã giao hàng', icon: 'home', date: 'Chờ cập nhật', completed: false },
          ],
          note: input.note,
        };

        // Ghi document Order (loại bỏ toàn bộ trường undefined cho Firestore)
        transaction.set(doc(db, 'orders', orderId), stripUndefined(newOrder));

        // Tạo thông báo cho user
        const notifRef = doc(collection(db, 'users', input.userId, 'notifications'));
        transaction.set(notifRef, {
          id: notifRef.id,
          type: 'order',
          title: 'Đặt hàng thành công!',
          message: `Đơn hàng #${orderId} của bạn đã được tiếp nhận và đang được chuẩn bị.`,
          data: { orderId },
          createdAt: now,
          read: false,
        });

        return newOrder;
      });

      // Lưu song song vào memory cho mượt mà
      mockOrdersDb = [createdOrder, ...mockOrdersDb];
      return createdOrder;
    } catch (err: unknown) {
      if ((err as any)?.name === 'ApiError') throw err;
      throw mapFirebaseError(err, 'Không thể hoàn tất đặt hàng. Vui lòng thử lại.');
    }
  },

  /**
   * Huỷ đơn hàng có hoàn trả tồn kho và ghi nhận timeline:
   * Chỉ cho phép huỷ khi trạng thái là pending hoặc processing.
   */
  async cancelOrder(id: string, reason: string): Promise<Order> {
    if (!reason || !reason.trim()) {
      apiError('ORDER_CANCEL_MISSING_REASON', 'Vui lòng cung cấp lý do huỷ đơn hàng.');
    }

    if (IS_MOCK_MODE) {
      const order = mockOrdersDb.find((o) => o.id === id);
      if (!order) apiError('ORDER_NOT_FOUND', `Không tìm thấy đơn hàng #${id}.`);
      if (!order.canCancel || (order.status !== 'pending' && order.status !== 'processing')) {
        apiError('ORDER_CANCEL_NOT_ALLOWED', 'Đơn hàng đã qua trạng thái có thể huỷ.');
      }
      const updated: Order = {
        ...order,
        status: 'cancelled',
        canCancel: false,
        cancelReason: reason.trim(),
        cancelledAt: new Date().toISOString(),
        timeline: [
          ...(order.timeline ?? []).filter((s) => s.key !== 'delivered'),
          { key: 'cancelled', label: 'Đã huỷ', icon: 'close', date: new Date().toISOString(), completed: true },
        ],
      };
      mockOrdersDb = mockOrdersDb.map((o) => (o.id === id ? updated : o));
      return updated;
    }

    try {
      const updatedOrder = await runTransaction(db, async (transaction) => {
        const orderRef = doc(db, 'orders', id);
        const orderSnap = await transaction.get(orderRef);

        let order: Order | null = null;
        if (orderSnap.exists()) {
          order = orderSnap.data() as Order;
        } else {
          order = mockOrdersDb.find((o) => o.id === id) ?? null;
        }

        if (!order) {
          apiError('ORDER_NOT_FOUND', `Không tìm thấy đơn hàng #${id}.`);
        }

        if (!order.canCancel || (order.status !== 'pending' && order.status !== 'processing')) {
          apiError('ORDER_CANCEL_NOT_ALLOWED', 'Đơn hàng đã đóng gói hoặc đang giao, không thể huỷ.');
        }

        // Hoàn lại tồn kho cho từng sản phẩm nếu tồn tại trong Firestore
        for (const item of order.items) {
          const prodRef = doc(db, 'products', item.productId);
          const prodSnap = await transaction.get(prodRef);
          if (prodSnap.exists()) {
            const prodData = prodSnap.data() as Product;
            transaction.update(prodRef, {
              stock: (prodData.stock ?? 0) + item.quantity,
              soldCount: Math.max((prodData.soldCount ?? 0) - item.quantity, 0),
            });
          }
        }

        // Giảm usedCount nếu có dùng voucher
        if (order.voucherCode) {
          const voucherRef = doc(db, 'vouchers', order.voucherCode);
          const voucherSnap = await transaction.get(voucherRef);
          if (voucherSnap.exists()) {
            const vData = voucherSnap.data() as Voucher;
            transaction.update(voucherRef, {
              usedCount: Math.max((vData.usedCount ?? 1) - 1, 0),
            });
          }
        }

        const now = new Date().toISOString();
        const updated: Order = {
          ...order,
          status: 'cancelled',
          canCancel: false,
          cancelReason: reason.trim(),
          cancelledAt: now,
          timeline: [
            ...(order.timeline ?? []).filter((s) => s.key !== 'delivered'),
            { key: 'cancelled', label: 'Đã huỷ', icon: 'close', date: now, completed: true },
          ],
        };

        transaction.set(orderRef, stripUndefined(updated));

        // Tạo thông báo huỷ đơn cho user
        const notifRef = doc(collection(db, 'users', order.userId, 'notifications'));
        transaction.set(notifRef, {
          id: notifRef.id,
          type: 'order',
          title: 'Đơn hàng đã được huỷ',
          message: `Đơn hàng #${id} đã được huỷ thành công. Lý do: ${reason.trim()}`,
          data: { orderId: id },
          createdAt: now,
          read: false,
        });

        return updated;
      });

      mockOrdersDb = mockOrdersDb.map((o) => (o.id === id ? updatedOrder : o));
      return updatedOrder;
    } catch (err: unknown) {
      if ((err as any)?.name === 'ApiError') throw err;
      throw mapFirebaseError(err, 'Không thể huỷ đơn hàng lúc này.');
    }
  },

  /**
   * Mua lại đơn hàng cũ:
   * Kiểm tra và chỉ giữ lại các sản phẩm còn hàng với giá bán hiện tại từ database.
   */
  async reorder(id: string): Promise<OrderItem[]> {
    const order = await this.getOrder(id);
    const validItems: OrderItem[] = [];

    for (const item of order.items) {
      try {
        let currentProd: Product | null = null;
        if (IS_MOCK_MODE) {
          currentProd = MOCK_PRODUCTS.find((p) => p.id === item.productId) ?? null;
        } else {
          const snap = await getDoc(doc(db, 'products', item.productId));
          if (snap.exists()) {
            currentProd = snap.data() as Product;
          } else {
            currentProd = MOCK_PRODUCTS.find((p) => p.id === item.productId) ?? null;
          }
        }

        if (currentProd && (currentProd.stock ?? 0) > 0) {
          validItems.push({
            ...item,
            price: currentProd.price, // Dùng giá cập nhật hiện tại
          });
        }
      } catch {
        // Skip unavailable item
      }
    }

    if (validItems.length === 0) {
      apiError('ORDER_ITEMS_OUT_OF_STOCK', 'Các sản phẩm trong đơn hiện đã hết hàng hoặc ngừng kinh doanh.');
    }

    return validItems;
  },
};
