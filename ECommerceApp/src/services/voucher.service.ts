import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Voucher } from '../types';
import { apiError, mapFirebaseError, IS_MOCK_MODE } from './http';
import { MOCK_VOUCHERS } from '../mock/vouchers';
import { computeVoucherDiscount } from '../utils/pricing';

/**
 * Service quản lý và kiểm tra mã giảm giá (Vouchers) từ Cloud Firestore.
 */
export const VoucherService = {
  /** Lấy danh sách toàn bộ vouchers khả dụng */
  async listVouchers(): Promise<Voucher[]> {
    if (IS_MOCK_MODE) return MOCK_VOUCHERS;

    try {
      const snap = await getDocs(collection(db, 'vouchers'));
      if (!snap.empty) {
        return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Voucher, 'id'>) }));
      }
      return MOCK_VOUCHERS;
    } catch {
      return MOCK_VOUCHERS;
    }
  },

  /**
   * Xác thực và tính toán giá trị chiết khấu của voucher:
   * Kiểm tra tồn tại, kích hoạt, hạn dùng, lượt dùng và giá trị đơn hàng tối thiểu.
   */
  async validateVoucher(
    code: string,
    subtotal: number,
    shippingFee = 0,
  ): Promise<{ voucher: Voucher; discount: number }> {
    const normalized = code.trim().toUpperCase();
    if (!normalized) {
      apiError('VOUCHER_INVALID', 'Vui lòng nhập mã giảm giá.');
    }

    let voucher: Voucher | null = null;

    if (!IS_MOCK_MODE) {
      try {
        const snap = await getDoc(doc(db, 'vouchers', normalized));
        if (snap.exists()) {
          voucher = { id: snap.id, ...(snap.data() as Omit<Voucher, 'id'>) };
        }
      } catch {
        // Fallback below
      }
    }

    if (!voucher) {
      voucher = MOCK_VOUCHERS.find((v) => v.code === normalized) ?? null;
    }

    if (!voucher) {
      apiError('VOUCHER_NOT_FOUND', `Mã giảm giá "${normalized}" không tồn tại.`);
    }

    // 1. Kiểm tra trạng thái kích hoạt
    if (!voucher.isActive) {
      apiError('VOUCHER_EXPIRED', `Mã giảm giá "${normalized}" đã hết hạn sử dụng.`);
    }

    // 2. Kiểm tra hạn dùng
    if (voucher.expiresAt) {
      const expiry = new Date(voucher.expiresAt).getTime();
      if (!isNaN(expiry) && expiry < Date.now()) {
        apiError('VOUCHER_EXPIRED', `Mã giảm giá "${normalized}" đã hết hạn.`);
      }
    }

    // 3. Kiểm tra số lần sử dụng tối đa
    if (voucher.usageLimit > 0 && voucher.usedCount >= voucher.usageLimit) {
      apiError('VOUCHER_OUT_OF_USAGE', `Mã giảm giá "${normalized}" đã được sử dụng hết lượt.`);
    }

    // 4. Kiểm tra giá trị đơn hàng tối thiểu
    if (subtotal < voucher.minOrderValue) {
      apiError(
        'VOUCHER_MIN_ORDER_NOT_MET',
        `Đơn hàng chưa đạt giá trị tối thiểu ${voucher.minOrderValue.toLocaleString('vi-VN')}đ để áp dụng mã này.`,
      );
    }

    const discount = computeVoucherDiscount(voucher, subtotal, shippingFee);

    return {
      voucher,
      discount,
    };
  },
};
