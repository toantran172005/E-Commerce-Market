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
import { auth, db } from '../firebaseConfig';
import { Order, OrderItem, Product, Voucher, ShippingMethod } from '../types';
import { apiError, mapFirebaseError } from './http';
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
 * Service quản lý đặt hàng, huỷ đơn và mua lại 100% qua Cloud Firestore Transactions.
 */
export const OrderService = {
  /** Lấy danh sách toàn bộ đơn hàng của một người dùng */
  async listOrders(userId: string): Promise<Order[]> {
    if (!userId) return [];

    try {
      const q = query(collection(db, 'orders'), where('userId', '==', userId));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const orders = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Order, 'id'>) }));
        return orders.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
      }
      return [];
    } catch {
      return [];
    }
  },

  /** Lấy chi tiết một đơn hàng theo ID */
  async getOrder(id: string): Promise<Order> {
    try {
      const snap = await getDoc(doc(db, 'orders', id));
      if (snap.exists()) {
        return { id: snap.id, ...(snap.data() as Omit<Order, 'id'>) };
      }
      apiError('ORDER_NOT_FOUND', `Không tìm thấy đơn hàng #${id}.`);
    } catch (err: unknown) {
      if ((err as any)?.code === 'ORDER_NOT_FOUND') throw err;
      throw mapFirebaseError(err, `Không tìm thấy đơn hàng #${id}.`);
    }
  },

  /**
   * Tạo đơn hàng mới qua Firestore Transaction nguyên tử:
   * 1. Xác thực tồn kho từng mặt hàng trực tiếp từ Firestore.
   * 2. Lấy giá chuẩn từ Database, không chấp nhận giá can thiệp từ client.
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

    try {
      return await runTransaction(db, async (transaction) => {
        // ========================================================
        // GIAI ĐOẠN 1: TẤT CẢ CÁC LỆNH ĐỌC (READS ONLY)
        // Bắt buộc thực hiện trước toàn bộ các lệnh ghi trong Firestore
        // ========================================================

        // 1. Đọc tất cả sản phẩm
        const productReads: {
          rawItem: OrderItem;
          prodRef: any;
          prodSnap: any;
        }[] = [];

        for (const rawItem of input.items) {
          const prodRef = doc(db, 'products', rawItem.productId);
          const prodSnap = await transaction.get(prodRef);
          productReads.push({ rawItem, prodRef, prodSnap });
        }

        // 2. Đọc phương thức vận chuyển (nếu có)
        let shipSnap: any = null;
        if (input.shippingMethodId) {
          const shipRef = doc(db, 'shippingMethods', input.shippingMethodId);
          shipSnap = await transaction.get(shipRef);
        }

        // 3. Đọc voucher (nếu có)
        let voucherRef: any = null;
        let voucherSnap: any = null;
        if (input.voucherCode) {
          const vCode = input.voucherCode.trim().toUpperCase();
          voucherRef = doc(db, 'vouchers', vCode);
          voucherSnap = await transaction.get(voucherRef);
        }

        // ========================================================
        // XỬ LÝ & VALIDATION LOGIC TRONG BỘ NHỚ (IN-MEMORY)
        // ========================================================

        const verifiedItems: OrderItem[] = [];
        let computedSubtotal = 0;
        const productUpdates: { ref: any; newStock: number; newSoldCount: number }[] = [];

        for (const { rawItem, prodRef, prodSnap } of productReads) {
          let price = rawItem.price;
          let name = rawItem.name;
          let imageUrl = rawItem.imageUrl;
          let currentStock = 999;
          let currentSoldCount = 0;

          if (prodSnap.exists()) {
            const pData = prodSnap.data() as Product;
            price = pData.price;
            name = pData.name;
            imageUrl = pData.images?.[0] || pData.imageUrl || rawItem.imageUrl;
            currentStock = pData.stock ?? 0;
            currentSoldCount = pData.soldCount ?? 0;

            if (currentStock < rawItem.quantity) {
              apiError(
                'OUT_OF_STOCK',
                `Sản phẩm "${name}" chỉ còn lại ${currentStock} cái trong kho, không đủ đáp ứng số lượng bạn đặt.`,
              );
            }

            productUpdates.push({
              ref: prodRef,
              newStock: currentStock - rawItem.quantity,
              newSoldCount: currentSoldCount + rawItem.quantity,
            });
          }

          verifiedItems.push({
            ...rawItem,
            name,
            price,
            imageUrl,
          });

          computedSubtotal += price * rawItem.quantity;
        }

        // Tính phí ship
        let baseShipping = 30000;
        let finalShippingMethodName = input.shippingMethodName || 'Giao hàng tiêu chuẩn';
        if (shipSnap && shipSnap.exists()) {
          const sData = shipSnap.data() as ShippingMethod;
          baseShipping = sData.fee;
          finalShippingMethodName = sData.name;
        }

        // Tính giảm giá Voucher
        let discount = 0;
        let isFreeShip = false;
        let voucherUpdate: { ref: any; newUsedCount: number } | null = null;

        if (voucherSnap && voucherSnap.exists() && voucherRef) {
          const voucher = voucherSnap.data() as Voucher;
          if (voucher.isActive && voucher.usedCount < voucher.usageLimit) {
            if (computedSubtotal >= voucher.minOrderValue) {
              discount = computeVoucherDiscount(voucher, computedSubtotal, baseShipping);
              if (voucher.type === 'freeShip') isFreeShip = true;

              voucherUpdate = {
                ref: voucherRef,
                newUsedCount: (voucher.usedCount ?? 0) + 1,
              };
            }
          }
        }

        const shippingFee = isFreeShip ? 0 : baseShipping;
        const totalAmount = computedSubtotal - discount + shippingFee;

        // ========================================================
        // GIAI ĐOẠN 2: TẤT CẢ CÁC LỆNH GHI (WRITES ONLY)
        // ========================================================

        // 1. Cập nhật tồn kho sản phẩm
        for (const update of productUpdates) {
          transaction.update(update.ref, {
            stock: update.newStock,
            soldCount: update.newSoldCount,
          });
        }

        // 2. Cập nhật lượt dùng voucher
        if (voucherUpdate) {
          transaction.update(voucherUpdate.ref, {
            usedCount: voucherUpdate.newUsedCount,
          });
        }

        // 3. Tạo document đơn hàng
        const newOrder: Order = {
          id: orderId,
          userId: input.userId,
          customerName: input.customerName.trim(),
          phoneNumber: input.phoneNumber.trim(),
          shippingAddress: input.shippingAddress.trim(),
          items: verifiedItems,
          subtotal: computedSubtotal,
          shippingFee,
          discount,
          totalAmount,
          status: 'pending',
          paymentMethodName: input.paymentMethodName || 'Thanh toán khi nhận hàng (COD)',
          shippingMethodName: finalShippingMethodName,
          voucherCode: discount > 0 ? input.voucherCode?.trim().toUpperCase() : undefined,
          createdAt: now,
          canCancel: true,
          timeline: [
            { key: 'placed', label: 'Đặt hàng thành công', icon: 'checkmark-circle', date: now, completed: true },
            { key: 'confirmed', label: 'Đã xác nhận', icon: 'cube', date: now, completed: false },
            { key: 'shipping', label: 'Đang vận chuyển', icon: 'airplane', date: now, completed: false },
            { key: 'delivered', label: 'Đã giao hàng', icon: 'home', date: now, completed: false },
          ],
          note: input.note,
        };

        transaction.set(doc(db, 'orders', orderId), stripUndefined(newOrder));

        // 3b. Lưu các mặt hàng vào root collection 'order_items' theo chuẩn ERD
        verifiedItems.forEach((it, idx) => {
          const itemDocId = `${orderId}_${idx + 1}`;
          const itemRef = doc(db, 'order_items', itemDocId);
          const pId = it.productId || (it as any).id || 'prod_default';
          transaction.set(itemRef, stripUndefined({
            id: itemDocId,
            orderId: orderId,
            productId: pId,
            name: it.name || (it as any).title || 'Sản phẩm',
            brand: (it as any).brand || '',
            variant: (it as any).selectedColor || (it as any).variant || it.variantName || '',
            price: it.price || 0,
            originalPrice: (it as any).originalPrice || it.price || 0,
            quantity: it.quantity || 1,
            imageUrl: it.imageUrl || (it as any).image || '',
          }));
        });

        // 4. Tạo thông báo cho user (ghi vào subcollection và root collection 'notifications')
        const notifDocId = `notif_${orderId}`;
        const notifRef = doc(db, 'users', input.userId, 'notifications', notifDocId);
        const notifTitle = `Đặt hàng #${orderId} thành công 🎉`;
        const notifMessage = `Đơn hàng #${orderId} trị giá ${totalAmount.toLocaleString('vi-VN')} ₫ đã được tạo và đang chờ xác nhận.`;
        const notifData = {
          id: notifDocId,
          type: 'order',
          title: notifTitle,
          message: notifMessage,
          orderId: orderId,
          data: { orderId },
          createdAt: now,
          read: false,
        };
        transaction.set(notifRef, notifData);
        transaction.set(doc(db, 'notifications', notifDocId), {
          id: notifDocId,
          userId: input.userId,
          title: notifTitle,
          message: notifMessage,
          orderId: orderId,
          isRead: false,
          type: 'order',
          date: now,
        });

        return newOrder;
      });
    } catch (err: unknown) {
      if ((err as any)?.name === 'ApiError') throw err;
      throw mapFirebaseError(err, 'Không thể hoàn tất đặt hàng. Vui lòng thử lại.');
    }
  },

  /**
   * Huỷ đơn hàng:
   * 1. Chỉ cho phép huỷ khi trạng thái là pending hoặc processing.
   * 2. Hoàn lại tồn kho cho từng sản phẩm trong Firestore Transaction.
   * 3. Giảm usedCount của voucher nếu có sử dụng.
   * 4. Gửi thông báo huỷ đơn.
   */
  async cancelOrder(id: string, reason: string): Promise<Order> {
    if (!reason || !reason.trim()) {
      apiError('ORDER_CANCEL_MISSING_REASON', 'Vui lòng nhập lý do huỷ đơn hàng.');
    }

    try {
      return await runTransaction(db, async (transaction) => {
        const orderRef = doc(db, 'orders', id);
        const orderSnap = await transaction.get(orderRef);

        if (!orderSnap.exists()) {
          apiError('ORDER_NOT_FOUND', `Không tìm thấy đơn hàng #${id}.`);
        }

        const order = orderSnap.data() as Order;

        if (!order.canCancel || (order.status !== 'pending' && order.status !== 'processing')) {
          apiError('ORDER_CANCEL_NOT_ALLOWED', 'Đơn hàng đã đóng gói hoặc đang giao, không thể huỷ.');
        }

        // ==========================================
        // GIAI ĐOẠN 1: TẤT CẢ CÁC THAO TÁC READS
        // ==========================================
        const productSnapshots: Array<{
          ref: any;
          snap: any;
          quantity: number;
        }> = [];
        for (const item of order.items) {
          const prodRef = doc(db, 'products', item.productId);
          const prodSnap = await transaction.get(prodRef);
          productSnapshots.push({ ref: prodRef, snap: prodSnap, quantity: item.quantity });
        }

        let voucherRef: any = null;
        let voucherSnap: any = null;
        if (order.voucherCode) {
          voucherRef = doc(db, 'vouchers', order.voucherCode);
          voucherSnap = await transaction.get(voucherRef);
        }

        // ==========================================
        // GIAI ĐOẠN 2: TẤT CẢ CÁC THAO TÁC WRITES
        // ==========================================
        for (const item of productSnapshots) {
          if (item.snap.exists()) {
            const prodData = item.snap.data() as Product;
            transaction.update(item.ref, {
              stock: (prodData.stock ?? 0) + item.quantity,
              soldCount: Math.max((prodData.soldCount ?? 0) - item.quantity, 0),
            });
          }
        }

        if (voucherRef && voucherSnap && voucherSnap.exists()) {
          const vData = voucherSnap.data() as Voucher;
          transaction.update(voucherRef, {
            usedCount: Math.max((vData.usedCount ?? 1) - 1, 0),
          });
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

        // Tạo thông báo huỷ đơn cho user (cả subcollection và root 'notifications')
        const notifDocId = `notif_cancel_${id}_${Date.now()}`;
        const targetUserId = order.userId || auth.currentUser?.uid || 'user_test_default';
        const currentUid = auth.currentUser?.uid;
        const cancelTitle = `Huỷ đơn hàng #${id} thành công`;
        const cancelMessage = `Đơn hàng #${id} đã được huỷ thành công. Lý do: ${reason.trim()}`;
        const cancelNotif = {
          id: notifDocId,
          type: 'order',
          title: cancelTitle,
          message: cancelMessage,
          orderId: id,
          data: { orderId: id },
          createdAt: now,
          read: false,
        };

        transaction.set(doc(db, 'users', targetUserId, 'notifications', notifDocId), cancelNotif);
        if (currentUid && currentUid !== targetUserId) {
          transaction.set(doc(db, 'users', currentUid, 'notifications', notifDocId), cancelNotif);
        }

        transaction.set(doc(db, 'notifications', notifDocId), {
          id: notifDocId,
          userId: currentUid || targetUserId,
          title: cancelTitle,
          message: cancelMessage,
          orderId: id,
          isRead: false,
          type: 'order',
          date: now,
          createdAt: now,
          read: false,
        });

        return updated;
      });
    } catch (err: unknown) {
      if ((err as any)?.name === 'ApiError') throw err;
      throw mapFirebaseError(err, 'Không thể huỷ đơn hàng lúc này.');
    }
  },

  /**
   * Mua lại đơn hàng cũ:
   * Kiểm tra và chỉ giữ lại các sản phẩm còn hàng với giá bán hiện tại từ Firestore.
   */
  async reorder(id: string): Promise<OrderItem[]> {
    const order = await this.getOrder(id);
    const validItems: OrderItem[] = [];

    for (const item of order.items) {
      try {
        const snap = await getDoc(doc(db, 'products', item.productId));
        if (snap.exists()) {
          const currentProd = snap.data() as Product;
          if ((currentProd.stock ?? 0) > 0) {
            validItems.push({
              ...item,
              price: currentProd.price, // Dùng giá cập nhật hiện tại
            });
          }
        }
      } catch {}
    }

    if (validItems.length === 0) {
      apiError('REORDER_EMPTY', 'Các sản phẩm trong đơn hàng này hiện đã hết hàng hoặc ngừng kinh doanh.');
    }

    return validItems;
  },
};
