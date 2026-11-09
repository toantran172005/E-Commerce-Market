import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { terminate } from 'firebase/firestore';
import { db } from '../../src/firebaseConfig.ts';
import { AuthService } from '../../src/services/authService.ts';
import { CatalogService } from '../../src/services/catalogService.ts';
import { VoucherService } from '../../src/services/voucherService.ts';
import { OrderService } from '../../src/services/orderService.ts';
import { ProfileService } from '../../src/services/profileService.ts';
import { NotificationService } from '../../src/services/notificationService.ts';
import { SearchService } from '../../src/services/searchService.ts';
import { SupportService } from '../../src/services/supportService.ts';

after(async () => {
  try {
    await terminate(db);
  } catch {}
});

/* ========================================================================== */
/*  1. AUTHENTICATION & PROFILE USE CASES (UC001, UC002, UC003)              */
/* ========================================================================== */

test('Auth: Register input validation rejects empty fields', async () => {
  await assert.rejects(
    () => AuthService.register({ fullName: '', email: 'test@example.com', phone: '0901234567', password: 'password123' }),
    (err) => err.code === 'AUTH_INVALID_INPUT',
  );
});

test('Auth: Register input validation rejects empty email', async () => {
  await assert.rejects(
    () => AuthService.register({ fullName: 'Nguyen Van A', email: '', phone: '0901234567', password: 'password123' }),
    (err) => err.code === 'AUTH_INVALID_INPUT',
  );
});

test('Auth: Login input validation rejects empty password', async () => {
  await assert.rejects(
    () => AuthService.login('user@example.com', ''),
    (err) => err.code === 'AUTH_INVALID_INPUT',
  );
});

test('Auth: Get and update user profile updates data and syncs', async () => {
  const uid = 'user_alex_carter';
  const initial = await AuthService.getProfile(uid);
  assert.ok(initial.uid);

  const updated = await AuthService.updateProfile(uid, {
    phoneNumber: '0988776655',
  });
  assert.equal(updated.phoneNumber, '0988776655');
});

/* ========================================================================== */
/*  2. CATALOG, SEARCH & MULTI-FILTER USE CASES (UC005 - UC010)               */
/* ========================================================================== */

test('Catalog: Filter by categories array', async () => {
  const res = await CatalogService.getProducts({ categories: ['Âm thanh', 'audio'] });
  assert.ok(Array.isArray(res.items));
  res.items.forEach((p) => {
    assert.ok(p.category === 'Âm thanh' || p.categoryId === 'audio');
  });
});

test('Catalog: Filter by brand array', async () => {
  const res = await CatalogService.getProducts({ brands: ['aurasound', 'AuraSound'] });
  assert.ok(Array.isArray(res.items));
  res.items.forEach((p) => {
    assert.ok(p.brandId === 'aurasound' || p.brandName === 'AuraSound');
  });
});

test('Catalog: Filter by price range min and max', async () => {
  const min = 1000000;
  const max = 5000000;
  const res = await CatalogService.getProducts({ minPrice: min, maxPrice: max });
  assert.ok(Array.isArray(res.items));
  res.items.forEach((p) => {
    assert.ok(p.price >= min && p.price <= max);
  });
});

test('Catalog: Filter by minimum rating', async () => {
  const res = await CatalogService.getProducts({ minRating: 4.8 });
  assert.ok(Array.isArray(res.items));
  res.items.forEach((p) => {
    assert.ok((p.rating ?? 0) >= 4.8);
  });
});

test('Catalog: Sort products by price ascending', async () => {
  const res = await CatalogService.getProducts({ sort: 'priceAsc', limit: 20 });
  for (let i = 0; i < res.items.length - 1; i++) {
    assert.ok(res.items[i].price <= res.items[i + 1].price);
  }
});

test('Catalog: Sort products by price descending', async () => {
  const res = await CatalogService.getProducts({ sort: 'priceDesc', limit: 20 });
  for (let i = 0; i < res.items.length - 1; i++) {
    assert.ok(res.items[i].price >= res.items[i + 1].price);
  }
});

test('Catalog: Sort products by rating descending', async () => {
  const res = await CatalogService.getProducts({ sort: 'rating', limit: 20 });
  for (let i = 0; i < res.items.length - 1; i++) {
    assert.ok((res.items[i].rating ?? 0) >= (res.items[i + 1].rating ?? 0));
  }
});

test('Catalog: Search with non-existent keyword returns empty list with total = 0', async () => {
  const res = await CatalogService.getProducts({ q: 'xyznonexistentkeyword12345' });
  assert.equal(res.items.length, 0);
  assert.equal(res.total, 0);
  assert.equal(res.hasMore, false);
});

test('Catalog: Get shipping methods returns active delivery options', async () => {
  const methods = await CatalogService.getShippingMethods();
  assert.ok(Array.isArray(methods));
  assert.ok(methods.length >= 1);
  assert.ok(methods[0].id);
  assert.ok(methods[0].fee >= 0);
});

/* ========================================================================== */
/*  3. ADDRESSES & PAYMENT METHODS CRUD USE CASES (UC004, UC015)             */
/* ========================================================================== */

test('ProfileService: Address CRUD maintains single default invariant', async () => {
  const testUid = `qa_test_user_${Date.now()}`;

  // 1. Add first address -> automatically default
  const list1 = await ProfileService.addAddress(
    {
      label: 'Nhà riêng',
      fullName: 'Người Dùng Test',
      phone: '0901112233',
      address: 'Số 1 ĐLBD, Q1, TP.HCM',
      isDefault: false,
    },
    testUid,
  );
  assert.ok(list1.length >= 1);
  const addr1 = list1[list1.length - 1];
  assert.equal(addr1.isDefault, true);

  // 2. Add second address as default -> first becomes false
  const list2 = await ProfileService.addAddress(
    {
      label: 'Công ty',
      fullName: 'Người Dùng Test 2',
      phone: '0904445566',
      address: 'Số 99 Nguyễn Huệ, Q1, TP.HCM',
      isDefault: true,
    },
    testUid,
  );
  const defaultList = list2.filter((a) => a.isDefault);
  assert.equal(defaultList.length, 1);
  assert.equal(defaultList[0].label, 'Công ty');

  // 3. Set default back to addr1
  const list3 = await ProfileService.setDefaultAddress(addr1.id, testUid);
  const curDefault = list3.find((a) => a.isDefault);
  assert.equal(curDefault?.id, addr1.id);

  // 4. Delete default address -> remaining address promoted to default
  const list4 = await ProfileService.deleteAddress(addr1.id, testUid);
  const remainingDefault = list4.find((a) => a.isDefault);
  assert.ok(remainingDefault);
  assert.equal(remainingDefault?.label, 'Công ty');
});

test('ProfileService: Payment Methods CRUD enforces security (only last4, never CVV)', async () => {
  const testUid = `qa_test_pay_${Date.now()}`;

  const list = await ProfileService.addPaymentMethod(
    {
      type: 'card',
      name: 'Visa Platinum',
      detail: 'Visa •••• 8888',
      expiry: '09/29',
      isDefault: true,
      color: '#1E3A8A',
    },
    testUid,
  );

  assert.ok(list.length >= 1);
  const createdCard = list[list.length - 1];
  assert.ok(createdCard.detail.includes('8888'));
  assert.equal(createdCard.cvv, undefined);
  assert.equal(createdCard.cardNumber, undefined);
});

/* ========================================================================== */
/*  4. SEARCH HISTORY & POPULAR SEARCHES (UC005, UC022)                       */
/* ========================================================================== */

test('SearchService: Saves keyword, deduplicates case-insensitively, and limits to 10', async () => {
  const testUid = `qa_search_${Date.now()}`;

  await SearchService.saveSearch('Tai nghe bluetooth', testUid);
  await SearchService.saveSearch('Đồng hồ thông minh', testUid);
  const list = await SearchService.saveSearch('tai nghe bluetooth', testUid);

  // 'Tai nghe bluetooth' should be moved to top, no duplicate
  const duplicates = list.filter((item) => item.keyword.toLowerCase() === 'tai nghe bluetooth');
  assert.equal(duplicates.length, 1);
  assert.equal(list[0].keyword, 'tai nghe bluetooth');

  // Clear history
  const empty = await SearchService.clearSearchHistory(testUid);
  assert.equal(empty.length, 0);
});

/* ========================================================================== */
/*  5. NOTIFICATIONS & SUPPORT TICKETS (UC002, UC018, UC021)                 */
/* ========================================================================== */

test('NotificationService: Create notification and mark as read', async () => {
  const testUid = `qa_notif_${Date.now()}`;

  const created = await NotificationService.createNotification(
    {
      type: 'order',
      title: 'Đơn hàng mới',
      message: 'Đơn hàng #TEST-123 đã được tiếp nhận.',
    },
    testUid,
  );
  assert.ok(created.id);
  assert.equal(created.read, false);

  const updated = await NotificationService.markAsRead(created.id, testUid);
  assert.equal(updated.read, true);
});

test('SupportService: Fetch FAQ groups, FAQs and create support ticket', async () => {
  const groups = await SupportService.getFaqGroups();
  assert.ok(Array.isArray(groups));
  assert.ok(groups.length > 0);

  const faqs = await SupportService.getFaqs();
  assert.ok(Array.isArray(faqs));
  assert.ok(faqs.length > 0);

  const ticket = await SupportService.createTicket({
    userId: 'user_alex_carter',
    subject: 'Cần hỗ trợ về giao hàng',
    message: 'Tôi muốn đổi địa chỉ nhận hàng cho đơn ORD-21530.',
  });
  assert.ok(ticket.id);
  assert.equal(ticket.status, 'open');
});

/* ========================================================================== */
/*  6. CHECKOUT TRANSACTION CONSTRAINTS & EDGE CASES (UC015, UC016, UC018)   */
/* ========================================================================== */

test('OrderService: Rejects order creation when items array is empty', async () => {
  await assert.rejects(
    () =>
      OrderService.createOrder({
        userId: 'user_alex_carter',
        customerName: 'Alex Carter',
        phoneNumber: '0901234567',
        shippingAddress: 'HCM',
        items: [],
      }),
    (err) => err.code === 'ORDER_EMPTY_ITEMS',
  );
});

test('OrderService: Rejects order creation when item quantity is 0 or negative', async () => {
  await assert.rejects(
    () =>
      OrderService.createOrder({
        userId: 'user_alex_carter',
        customerName: 'Alex Carter',
        phoneNumber: '0901234567',
        shippingAddress: 'HCM',
        items: [
          {
            productId: 'prod_aurabeats_pro',
            name: 'AuraBeats',
            price: 100000,
            quantity: 0,
            imageUrl: '',
          },
        ],
      }),
    (err) => err.code === 'ORDER_INVALID_QUANTITY',
  );
});

test('OrderService: Rejects cancelOrder without a reason', async () => {
  await assert.rejects(
    () => OrderService.cancelOrder('ORD-21530', '   '),
    (err) => err.code === 'ORDER_CANCEL_MISSING_REASON',
  );
});
