import { Voucher } from '../types';
import { apiError, respond } from './http';
import { MOCK_VOUCHERS } from '../mock/vouchers';
import { computeVoucherDiscount } from '../utils/pricing';

/**
 * Giả lập Voucher API.
 *
 * GET /vouchers
 * POST /vouchers/validate — body { code, subtotal, shippingFee }
 */
export const VoucherService = {
  /** GET /vouchers */
  async listVouchers(): Promise<Voucher[]> {
    return respond(MOCK_VOUCHERS);
  },

  /**
   * POST /vouchers/validate
   * Trả về voucher hợp lệ hoặc ném ApiError với code VOUCHER_*.
   */
  async validateVoucher(
    code: string,
    subtotal: number,
    shippingFee = 0,
  ): Promise<{ voucher: Voucher; discount: number }> {
    await respond(null);
    const normalized = code.trim().toUpperCase();
    const voucher = MOCK_VOUCHERS.find((v) => v.code === normalized);

    if (!voucher) {
      apiError('VOUCHER_NOT_FOUND', `Mã ${normalized} không tồn tại.`);
    }
    if (!voucher.isActive) {
      apiError('VOUCHER_EXPIRED', `Mã ${normalized} đã hết hạn.`);
    }
    if (voucher.usedCount >= voucher.usageLimit) {
      apiError('VOUCHER_OUT_OF_USAGE', `Mã ${normalized} đã dùng hết lượt.`);
    }
    if (subtotal < voucher.minOrderValue) {
      apiError(
        'VOUCHER_MIN_ORDER_NOT_MET',
        `Không thể áp dụng mã ${normalized} cho tổng tiền dưới $${voucher.minOrderValue.toFixed(0)}.`,
      );
    }

    return {
      voucher: voucher as Voucher,
      discount: computeVoucherDiscount(voucher as Voucher, subtotal, shippingFee),
    };
  },
};
