// ECommerceApp/tests/services.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';

import { CatalogService } from '../src/services/catalog.service.ts';
import { VoucherService } from '../src/services/voucher.service.ts';
import { OrderService } from '../src/services/order.service.ts';
import { AuthService } from '../src/services/auth.service.ts';

/* -------------------------------------------------------------------------- */
/*                               CATALOG SERVICE                              */
/* -------------------------------------------------------------------------- */

test('CatalogService: getCategories returns non-empty category list', async () => {
  const categories = await CatalogService.getCategories();
  assert.ok(Array.isArray(categories));
  assert.ok(categories.length > 0);
  assert.ok(categories[0].id);
  assert.ok(categories[0].name);
});

test('CatalogService: getProducts returns paginated products', async () => {
  const result = await CatalogService.getProducts({ page: 1, limit: 5 });
  assert.equal(result.page, 1);
  assert.equal(result.limit, 5);
  assert.ok(Array.isArray(result.items));
  assert.ok(result.items.length <= 5);
  assert.ok(result.total > 0);
});

test('CatalogService: getProducts filters by search keyword', async () => {
  const result = await CatalogService.getProducts({ q: 'shoes' });
  for (const item of result.items) {
    const text = `${item.name} ${item.brandName ?? ''} ${(item.tags ?? []).join(' ')}`.toLowerCase();
    assert.ok(text.includes('shoes'));
  }
});

test('CatalogService: getProductById returns product by valid id and throws on invalid id', async () => {
  const categories = await CatalogService.getProducts({ limit: 1 });
  const firstId = categories.items[0].id;
  const product = await CatalogService.getProductById(firstId);
  assert.equal(product.id, firstId);

  await assert.rejects(
    async () => {
      await CatalogService.getProductById('non-existent-id-999');
    },
    (err) => err?.code === 'PRODUCT_NOT_FOUND' || err?.message?.includes('không tìm thấy'),
  );
});

/* -------------------------------------------------------------------------- */
/*                               VOUCHER SERVICE                              */
/* -------------------------------------------------------------------------- */

test('VoucherService: listVouchers returns all mock vouchers', async () => {
  const vouchers = await VoucherService.listVouchers();
  assert.ok(Array.isArray(vouchers));
  assert.ok(vouchers.length > 0);
});

test('VoucherService: validateVoucher throws for unknown voucher code', async () => {
  await assert.rejects(
    async () => {
      await VoucherService.validateVoucher('INVALID_CODE', 200);
    },
    (err) => err?.code === 'VOUCHER_NOT_FOUND' || err?.message?.includes('không tồn tại'),
  );
});

test('VoucherService: validateVoucher fails when min order value is not met', async () => {
  await assert.rejects(
    async () => {
      // NOVA10 requires minOrderValue 100
      await VoucherService.validateVoucher('NOVA10', 50);
    },
    (err) => err?.code === 'VOUCHER_MIN_ORDER_NOT_MET' || err?.message?.includes('tổng tiền dưới'),
  );
});

test('VoucherService: validateVoucher succeeds and computes discount correctly', async () => {
  // NOVA10: 10% off for order >= 100, max discount 50
  const result = await VoucherService.validateVoucher('NOVA10', 150);
  assert.equal(result.voucher.code, 'NOVA10');
  assert.equal(result.discount, 15); // 10% of 150 = 15
});

/* -------------------------------------------------------------------------- */
/*                                AUTH SERVICE                                */
/* -------------------------------------------------------------------------- */

test('AuthService: login succeeds with valid credentials', async () => {
  const profile = await AuthService.login('demo@shop.vn', '123456');
  assert.equal(profile.email, 'demo@shop.vn');
  assert.equal(profile.fullName, 'Trần Minh Alex');
  // Password should be stripped in safe profile
  assert.equal('password' in profile, false);
});

test('AuthService: login rejects invalid password', async () => {
  await assert.rejects(
    async () => {
      await AuthService.login('demo@shop.vn', 'wrongpassword');
    },
    (err) => err?.code === 'AUTH_INVALID_CREDENTIALS' || err?.message?.includes('không đúng'),
  );
});

test('AuthService: loginAsGuest returns guest user profile', async () => {
  const guest = await AuthService.loginAsGuest();
  assert.equal(guest.isGuest, true);
  assert.equal(guest.email, 'guest@shop.vn');
});

test('AuthService: register creates new user successfully', async () => {
  const uniqueEmail = `test_${Date.now()}@example.com`;
  const newUser = await AuthService.register({
    fullName: 'Test User',
    email: uniqueEmail,
    phone: '0901234567',
    password: 'password123',
  });
  assert.equal(newUser.email, uniqueEmail);
  assert.equal(newUser.fullName, 'Test User');
});

/* -------------------------------------------------------------------------- */
/*                                ORDER SERVICE                               */
/* -------------------------------------------------------------------------- */

test('OrderService: listOrders returns orders for specified user', async () => {
  const orders = await OrderService.listOrders('user-demo');
  assert.ok(Array.isArray(orders));
  for (const o of orders) {
    assert.equal(o.userId, 'user-demo');
  }
});

test('OrderService: createOrder and getOrder flow works correctly', async () => {
  const newOrder = await OrderService.createOrder({
    userId: 'user-demo',
    customerName: 'Trần Minh Alex',
    phoneNumber: '0901284920',
    shippingAddress: '123 Test Street, HCM',
    items: [
      {
        productId: 'prod-1',
        productName: 'Sample Running Shoes',
        productImage: 'https://example.com/shoes.png',
        price: 100,
        quantity: 2,
        color: 'Black',
        size: '42',
      },
    ],
  });

  assert.ok(newOrder.id);
  assert.equal(newOrder.userId, 'user-demo');
  assert.equal(newOrder.items.length, 1);
  assert.equal(newOrder.subtotal, 200);

  // Fetch the created order
  const fetched = await OrderService.getOrder(newOrder.id);
  assert.equal(fetched.id, newOrder.id);
  assert.equal(fetched.subtotal, 200);
});

test('OrderService: cancelOrder cancels an active order', async () => {
  // Create an order first so we are guaranteed it is in cancellable state
  const order = await OrderService.createOrder({
    userId: 'user-demo',
    customerName: 'Trần Minh Alex',
    phoneNumber: '0901284920',
    shippingAddress: '123 Test Street, HCM',
    items: [
      {
        productId: 'prod-2',
        productName: 'Sample Watch',
        productImage: 'https://example.com/watch.png',
        price: 50,
        quantity: 1,
      },
    ],
  });

  assert.equal(order.canCancel, true);

  const cancelled = await OrderService.cancelOrder(order.id, 'Đổi ý không muốn mua nữa');
  assert.equal(cancelled.status, 'cancelled');
  assert.equal(cancelled.canCancel, false);
  assert.equal(cancelled.cancelReason, 'Đổi ý không muốn mua nữa');
});
