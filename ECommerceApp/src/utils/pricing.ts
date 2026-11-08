import { CartItem, ShippingMethod, Voucher } from '../types';

export const TAX_RATE = 0.08;

/** Tổng tiền của các sản phẩm ĐƯỢC CHỌN trong giỏ. */
export function computeSubtotal(items: CartItem[]): number {
  return items
    .filter((item) => item.selected)
    .reduce((sum, item) => sum + item.product.price * item.quantity, 0);
}

/** Số tiền giảm từ voucher. Voucher freeShip giảm đúng phí ship. */
export function computeVoucherDiscount(
  voucher: Voucher | null,
  subtotal: number,
  shippingFee: number,
): number {
  if (!voucher || subtotal < voucher.minOrderValue) return 0;
  if (voucher.type === 'percent') {
    const raw = (subtotal * voucher.value) / 100;
    return voucher.maxDiscount ? Math.min(raw, voucher.maxDiscount) : raw;
  }
  if (voucher.type === 'fixed') {
    return Math.min(voucher.value, subtotal);
  }
  return shippingFee;
}

export interface CartTotals {
  subtotal: number;
  discount: number;
  shippingFee: number;
  tax: number;
  total: number;
}

/** Tính đầy đủ: tạm tính, giảm giá, phí ship, thuế, tổng cộng. */
export function computeCartTotals(
  items: CartItem[],
  voucher: Voucher | null,
  shippingMethod: ShippingMethod,
): CartTotals {
  const subtotal = computeSubtotal(items);
  const baseShipping =
    subtotal >= shippingMethod.freeOver ? 0 : shippingMethod.fee;

  const discount = computeVoucherDiscount(voucher, subtotal, baseShipping);
  const isFreeShip = voucher?.type === 'freeShip' && subtotal >= voucher.minOrderValue;
  const shippingFee = isFreeShip ? 0 : baseShipping;

  const taxable = Math.max(subtotal - discount + shippingFee, 0);
  const tax = taxable * TAX_RATE;
  const total = Math.max(subtotal - discount + shippingFee + tax, 0);

  return { subtotal, discount, shippingFee, tax, total };
}
