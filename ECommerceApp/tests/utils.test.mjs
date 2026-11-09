// ECommerceApp/tests/utils.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  formatMoney,
  formatDate,
  formatDateTime,
  formatPhone,
  isValidPhoneVn,
  isValidEmail,
  isValidPassword,
  calcDiscountPercent,
} from '../src/utils/format.ts';

import {
  computeSubtotal,
  computeVoucherDiscount,
  computeCartTotals,
  TAX_RATE,
} from '../src/utils/pricing.ts';

import {
  cartItemKey,
  toCartItem,
  findCartItem,
} from '../src/utils/cart.ts';

/* -------------------------------------------------------------------------- */
/*                                FORMAT TESTS                                */
/* -------------------------------------------------------------------------- */

test('formatMoney: correctly formats VND currency by default', () => {
  const formatted = formatMoney(500000);
  assert.ok(formatted.includes('500') && formatted.includes('₫'));
  assert.equal(formatMoney(21990000), '21.990.000 ₫');
  assert.equal(formatMoney(0), '0 ₫');
});

test('formatMoney: correctly formats USD when explicitly requested', () => {
  assert.equal(formatMoney(100, 'USD'), '$100.00');
  assert.equal(formatMoney(249.5, 'USD'), '$249.50');
  assert.equal(formatMoney(0, 'USD'), '$0.00');
});

test('formatDate: formats valid timestamp and ISO dates', () => {
  const ts = new Date(2026, 10, 15).getTime(); // 15/11/2026
  assert.equal(formatDate(ts), '15/11/2026');
  assert.equal(formatDate('invalid'), '');
});

test('formatDateTime: formats date and time accurately', () => {
  const dt = new Date(2026, 4, 1, 14, 30);
  const formatted = formatDateTime(dt.getTime());
  assert.ok(formatted.includes('01/05/2026') && formatted.includes('14:30'));
  assert.equal(formatDateTime('invalid-date'), '');
});

test('formatPhone: normalizes Vietnamese phone numbers', () => {
  assert.equal(formatPhone('0912345678'), '+84 912 345 678');
  assert.equal(formatPhone('84912345678'), '+84 912 345 678');
  assert.equal(formatPhone('+84912345678'), '+84 912 345 678');
});

test('isValidPhoneVn: validates authentic Vietnamese prefixes', () => {
  assert.equal(isValidPhoneVn('0912345678'), true);
  assert.equal(isValidPhoneVn('0388123456'), true);
  assert.equal(isValidPhoneVn('0777123456'), true);
  assert.equal(isValidPhoneVn('0866123456'), true);
  assert.equal(isValidPhoneVn('+84912345678'), true);

  // Invalid cases
  assert.equal(isValidPhoneVn('0123456789'), false); // Invalid prefix
  assert.equal(isValidPhoneVn('0912345'), false); // Too short
  assert.equal(isValidPhoneVn('091234567899'), false); // Too long
  assert.equal(isValidPhoneVn('abc0912345678'), false);
});

test('isValidEmail: checks valid and invalid email formats', () => {
  assert.equal(isValidEmail('user@shop.vn'), true);
  assert.equal(isValidEmail('alex.carter@novatech.io'), true);
  assert.equal(isValidEmail('plainaddress'), false);
  assert.equal(isValidEmail('@missinguser.com'), false);
  assert.equal(isValidEmail('user@'), false);
});

test('isValidPassword: checks minimum length requirements', () => {
  assert.equal(isValidPassword('123456'), true);
  assert.equal(isValidPassword('strongPassword123'), true);
  assert.equal(isValidPassword('12345'), false); // < 6 chars
  assert.equal(isValidPassword(''), false);
});

test('calcDiscountPercent: computes discount percentage correctly', () => {
  assert.equal(calcDiscountPercent(80, 100), 20);
  assert.equal(calcDiscountPercent(249, 299), 17);
  assert.equal(calcDiscountPercent(100, 100), null);
  assert.equal(calcDiscountPercent(120, 100), null); // Price higher than original
  assert.equal(calcDiscountPercent(50, 0), null);
});

/* -------------------------------------------------------------------------- */
/*                               PRICING TESTS                                */
/* -------------------------------------------------------------------------- */

const sampleProducts = [
  { id: 'p1', name: 'Product 1', price: 100, description: '', imageUrl: '', category: 'cat1' },
  { id: 'p2', name: 'Product 2', price: 50, description: '', imageUrl: '', category: 'cat1' },
  { id: 'p3', name: 'Product 3', price: 30, description: '', imageUrl: '', category: 'cat2' },
];

test('computeSubtotal: calculates total for selected items only', () => {
  const items = [
    { id: '1', product: sampleProducts[0], quantity: 2, selected: true }, // 200
    { id: '2', product: sampleProducts[1], quantity: 1, selected: true }, // 50
    { id: '3', product: sampleProducts[2], quantity: 3, selected: false }, // unselected (90)
  ];

  assert.equal(computeSubtotal(items), 250);
  assert.equal(computeSubtotal([]), 0);
});

test('computeVoucherDiscount: applies percentage discount with cap', () => {
  const percentVoucher = {
    id: 'v1',
    code: 'SALE20',
    type: 'percent',
    value: 20,
    minOrderValue: 100,
    maxDiscount: 30,
    title: 'Giảm 20%',
    description: '',
    startDate: 0,
    endDate: 9999999999999,
  };

  // Subtotal below minimum order value
  assert.equal(computeVoucherDiscount(percentVoucher, 80, 5), 0);

  // Subtotal qualifies, discount 20% of 120 = 24 (within max 30)
  assert.equal(computeVoucherDiscount(percentVoucher, 120, 5), 24);

  // Subtotal 200 -> 20% is 40, capped at maxDiscount 30
  assert.equal(computeVoucherDiscount(percentVoucher, 200, 5), 30);
});

test('computeVoucherDiscount: applies fixed discount and free shipping', () => {
  const fixedVoucher = {
    id: 'v2',
    code: 'FIXED50',
    type: 'fixed',
    value: 50,
    minOrderValue: 100,
    title: 'Giảm $50',
    description: '',
    startDate: 0,
    endDate: 9999999999999,
  };

  assert.equal(computeVoucherDiscount(fixedVoucher, 200, 5), 50);
  assert.equal(computeVoucherDiscount(fixedVoucher, 40, 5), 0); // below minOrderValue

  const freeShipVoucher = {
    id: 'v3',
    code: 'FREESHIP',
    type: 'freeShip',
    value: 0,
    minOrderValue: 50,
    title: 'Miễn phí ship',
    description: '',
    startDate: 0,
    endDate: 9999999999999,
  };

  assert.equal(computeVoucherDiscount(freeShipVoucher, 100, 15), 15);
});

test('computeCartTotals: calculates full order totals including tax and shipping', () => {
  const items = [
    { id: '1', product: sampleProducts[0], quantity: 1, selected: true }, // 100
  ];
  const shippingMethod = {
    id: 'std',
    name: 'Giao tiêu chuẩn',
    fee: 10,
    estimate: '2-3 ngày',
    freeOver: 150,
  };

  // 1. Subtotal 100 < freeOver 150 -> shipping fee is 10
  // No voucher -> taxable = 100 + 10 = 110, tax = 110 * 0.08 = 8.8, total = 118.8
  const totals = computeCartTotals(items, null, shippingMethod);
  assert.equal(totals.subtotal, 100);
  assert.equal(totals.shippingFee, 10);
  assert.equal(totals.discount, 0);
  assert.equal(totals.tax, 110 * TAX_RATE);
  assert.equal(totals.total, 118.8);
});

/* -------------------------------------------------------------------------- */
/*                                 CART TESTS                                 */
/* -------------------------------------------------------------------------- */

test('cartItemKey and toCartItem: generates stable keys and models', () => {
  assert.equal(cartItemKey('prod_1'), 'prod_1::default');
  assert.equal(cartItemKey('prod_1', 'var_black'), 'prod_1::var_black');

  const item = toCartItem(sampleProducts[0], 2, { id: 'var_red', name: 'Đỏ', hex: '#FF0000' });
  assert.equal(item.id, 'p1::var_red');
  assert.equal(item.quantity, 2);
  assert.equal(item.selected, true);
  assert.equal(item.variantId, 'var_red');
});

test('findCartItem: retrieves cart item by id or compound key', () => {
  const items = [
    { id: 'p1::default', product: sampleProducts[0], quantity: 1, selected: true },
    { id: 'p2::var_blue', product: sampleProducts[1], variantId: 'var_blue', quantity: 2, selected: true },
  ];

  assert.equal(findCartItem(items, 'p1::default')?.product.name, 'Product 1');
  assert.equal(findCartItem(items, 'p2::var_blue')?.product.name, 'Product 2');
  assert.equal(findCartItem(items, 'p3::non_existent'), undefined);
});
