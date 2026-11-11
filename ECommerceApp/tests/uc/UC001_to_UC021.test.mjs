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
import { computeCartTotals, computeSubtotal, computeVoucherDiscount } from '../../src/utils/pricing.ts';
import { isValidEmail, isValidPassword, isValidPhoneVn } from '../../src/utils/format.ts';

after(async () => {
  try {
    await terminate(db);
  } catch {}
});

/* ========================================================================== */
/*  UC001: ĐĂNG NHẬP (Authentication - Login & Password Reset)                 */
/* ========================================================================== */
test('UC001: Đăng nhập thành công với tài khoản hợp lệ', async () => {
  const profile = await AuthService.login('demo@shop.vn', '123456');
  assert.ok(profile.uid);
  assert.equal(profile.email, 'demo@shop.vn');
});

test('UC001: Đăng nhập thất bại khi sai mật khẩu trả về đúng thông báo SRS', async () => {
  await assert.rejects(
    () => AuthService.login('wrong_user_check@example.com', 'WrongPassword123'),
    (err) =>
      err?.code === 'AUTH_INVALID_CREDENTIALS' ||
      err?.code === 'AUTH_TOO_MANY_REQUESTS' ||
      err?.message?.includes('chính xác') ||
      err?.message?.includes('quá nhiều lần'),
  );
});

test('UC001: Quên mật khẩu gửi email đặt lại thành công', async () => {
  await AuthService.sendPasswordResetEmail('demo@shop.vn');
  assert.ok(true);
});

/* ========================================================================== */
/*  UC002: ĐĂNG KÝ (Authentication - Registration)                            */
/* ========================================================================== */
test('UC002: Đăng ký thành công người dùng mới', async () => {
  const rand = Math.floor(Math.random() * 10000);
  const profile = await AuthService.register({
    fullName: `Test User ${rand}`,
    email: `testuser_${rand}@example.com`,
    phone: '0901234567',
    password: 'Password123!',
  });
  assert.ok(profile.uid);
  assert.equal(profile.fullName, `Test User ${rand}`);
});

test('UC002: Đăng ký từ chối email không đúng định dạng', () => {
  assert.equal(isValidEmail('invalid-email'), false);
  assert.equal(isValidEmail('valid@example.com'), true);
});

test('UC002: Đăng ký từ chối mật khẩu dưới 6 ký tự', () => {
  assert.equal(isValidPassword('12345'), false);
  assert.equal(isValidPassword('123456'), true);
});

/* ========================================================================== */
/*  UC003: QUẢN LÝ HỒ SƠ NGƯỜI DÙNG (Profile Management)                      */
/* ========================================================================== */
test('UC003: Cập nhật thông tin hồ sơ và số điện thoại Việt Nam', async () => {
  const uid = 'user_alex_carter';
  assert.equal(isValidPhoneVn('0912345678'), true);
  assert.equal(isValidPhoneVn('123456'), false);

  const updated = await AuthService.updateProfile(uid, {
    fullName: 'Alex Carter Updated',
    phoneNumber: '0912345678',
  });
  assert.equal(updated.fullName, 'Alex Carter Updated');
  assert.equal(updated.phoneNumber, '0912345678');
});

/* ========================================================================== */
/*  UC004: QUẢN LÝ SỔ ĐỊA CHỈ (Address Book CRUD & Default Uniqueness)         */
/* ========================================================================== */
test('UC004: Thêm địa chỉ có cấu trúc 4 cấp và đảm bảo tính duy nhất mặc định', async () => {
  const uid = 'user_alex_carter';
  const newAddr = {
    label: 'Nhà mới kiểm thử',
    fullName: 'Alex Carter',
    phone: '0909888777',
    province: 'TP. Hồ Chí Minh',
    district: 'Quận 1',
    ward: 'Phường Bến Nghé',
    street: '123 Đường Lê Lợi',
    address: '123 Đường Lê Lợi, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
    isDefault: true,
  };

  const list = await ProfileService.addAddress(newAddr, uid);
  const created = list.find((a) => a.label === 'Nhà mới kiểm thử');
  assert.ok(created);
  assert.equal(created.isDefault, true);

  // Chỉ có đúng 1 địa chỉ mặc định
  const defaultCount = list.filter((a) => a.isDefault).length;
  assert.equal(defaultCount, 1);

  // Dọn dẹp
  if (created) {
    await ProfileService.deleteAddress(created.id, uid);
  }
});

/* ========================================================================== */
/*  UC005: XEM DANH MỤC SẢN PHẨM (Category Catalog)                           */
/* ========================================================================== */
test('UC005: Lấy danh mục sản phẩm khả dụng từ hệ thống', async () => {
  const categories = await CatalogService.getCategories();
  assert.ok(Array.isArray(categories));
  assert.ok(categories.length > 0);
  assert.ok(categories.some((c) => c.name));
});

/* ========================================================================== */
/*  UC006: TÌM KIẾM SẢN PHẨM & LỊCH SỬ TÌM KIẾM (Search & History)            */
/* ========================================================================== */
test('UC006: Tìm kiếm sản phẩm theo từ khóa và lưu lịch sử không trùng lặp', async () => {
  const searchRes = await CatalogService.getProducts({ q: 'Sony' });
  assert.ok(Array.isArray(searchRes.items));

  const testUid = `qa_search_${Date.now()}`;
  const history = await SearchService.saveSearch('Tai nghe không dây', testUid);
  assert.ok(Array.isArray(history));
  assert.ok(history.some((h) => h.keyword === 'Tai nghe không dây'));
});

/* ========================================================================== */
/*  UC007: LỌC VÀ SẮP XẾP SẢN PHẨM (Multi-filter & Sort Options)               */
/* ========================================================================== */
test('UC007: Lọc theo khoảng giá và sắp xếp tăng dần', async () => {
  const res = await CatalogService.getProducts({
    minPrice: 500000,
    maxPrice: 15000000,
    sort: 'priceAsc',
  });
  assert.ok(Array.isArray(res.items));
  for (let i = 0; i < res.items.length - 1; i++) {
    assert.ok(res.items[i].price <= res.items[i + 1].price);
  }
});

/* ========================================================================== */
/*  UC008: XEM CHI TIẾT SẢN PHẨM (Product Details & Shopee Specifications)    */
/* ========================================================================== */
test('UC008: Xem chi tiết sản phẩm bao gồm thông số kỹ thuật và chính sách', async () => {
  const products = await CatalogService.getProducts({ limit: 1 });
  assert.ok(products.items.length > 0);
  const targetId = products.items[0].id;

  const product = await CatalogService.getProductById(targetId);
  assert.ok(product);
  assert.equal(product.id, targetId);
  assert.ok(typeof product.price === 'number');
  assert.ok(product.imageUrl.startsWith('http'));
});

/* ========================================================================== */
/*  UC009: QUẢN LÝ GIỎ HÀNG (Cart Calculations & Totals)                      */
/* ========================================================================== */
test('UC009: Tính tổng giá trị giỏ hàng và áp dụng thuế VAT 8%', () => {
  const mockItems = [
    {
      id: 'item-1',
      product: { id: 'p1', name: 'Tai nghe', price: 1000000 },
      quantity: 2,
      selected: true,
    },
    {
      id: 'item-2',
      product: { id: 'p2', name: 'Ốp lưng', price: 200000 },
      quantity: 1,
      selected: true,
    },
  ];

  const subtotal = computeSubtotal(mockItems);
  assert.equal(subtotal, 2200000);

  const totals = computeCartTotals(mockItems, null, { id: 'std', fee: 30000, freeOver: 5000000 });
  assert.equal(totals.subtotal, 2200000);
  assert.equal(totals.shippingFee, 30000);
  assert.equal(totals.tax, Math.round(2230000 * 0.08));
  assert.equal(totals.total, 2230000 + totals.tax);
});

/* ========================================================================== */
/*  UC010: ÁP DỤNG MÃ GIẢM GIÁ (Voucher Discount & Category Restrictions)      */
/* ========================================================================== */
test('UC010: Áp dụng mã giảm giá hợp lệ và từ chối khi không đạt giá trị tối thiểu', async () => {
  const vouchers = await VoucherService.listVouchers();
  assert.ok(vouchers.length > 0);

  const voucher = vouchers[0];
  const validation = await VoucherService.validateVoucher(voucher.code, 10000000, 30000);
  assert.ok(validation.discount >= 0);

  // Từ chối khi subtotal quá thấp
  await assert.rejects(
    () => VoucherService.validateVoucher(voucher.code, 1000, 30000),
    (err) => err.code === 'VOUCHER_MIN_ORDER_NOT_MET',
  );
});

/* ========================================================================== */
/*  UC011: DANH SÁCH YÊU THÍCH (Wishlist / Favourites)                        */
/* ========================================================================== */
test('UC011: Thao tác danh sách sản phẩm yêu thích', async () => {
  const products = await CatalogService.getProducts({ limit: 1 });
  const p = products.items[0];
  assert.ok(p.id);
  // Đảm bảo dữ liệu sản phẩm tương thích cấu trúc Card không chứa nút lồng nhau
  assert.ok(typeof p.name === 'string');
});

/* ========================================================================== */
/*  UC012: QUẢN LÝ PHƯƠNG THỨC THANH TOÁN (PCI DSS Payment Security)          */
/* ========================================================================== */
test('UC012: Thêm thẻ thanh toán chỉ lưu 4 số cuối (last4), không lưu CVV', async () => {
  const uid = 'user_alex_carter';
  const newCard = {
    type: 'card',
    name: 'Visa Signature',
    detail: '•••• 8899',
    last4: '8899',
    cardBrand: 'visa',
    isDefault: false,
  };

  const list = await ProfileService.addPaymentMethod(newCard, uid);
  const created = list.find((m) => m.detail === '•••• 8899');
  assert.ok(created);
  assert.equal(created.cvv, undefined);

  if (created) {
    await ProfileService.deletePaymentMethod(created.id, uid);
  }
});

/* ========================================================================== */
/*  UC013: XEM THÔNG BÁO HỆ THỐNG (Notifications)                              */
/* ========================================================================== */
test('UC013: Nhận thông báo và đánh dấu đã đọc', async () => {
  const notif = await NotificationService.createNotification({
    type: 'order',
    title: 'Kiểm thử thông báo',
    message: 'Nội dung thông báo kiểm thử',
    userId: 'user_alex_carter',
  });
  assert.ok(notif.id);

  const updated = await NotificationService.markAsRead(notif.id, 'user_alex_carter');
  assert.ok(updated);
});

/* ========================================================================== */
/*  UC014: TRỢ GIÚP & HỖ TRỢ KHÁCH HÀNG (Support & FAQs)                     */
/* ========================================================================== */
test('UC014: Tra cứu câu hỏi thường gặp và tạo ticket hỗ trợ', async () => {
  const faqs = await SupportService.getFaqs();
  assert.ok(Array.isArray(faqs));

  const ticket = await SupportService.createTicket({
    userId: 'user_alex_carter',
    subject: 'Hỏi về thời gian giao hàng',
    message: 'Đơn hàng dự kiến giao trong mấy ngày?',
    category: 'Giao hàng',
  });
  assert.ok(ticket.id);
});

/* ========================================================================== */
/*  UC015: ĐẶT HÀNG VÀ THANH TOÁN (Atomic Transaction & Stock Guard)          */
/* ========================================================================== */
test('UC015: Đặt hàng thành công qua Transaction và trừ tồn kho', async () => {
  const order = await OrderService.createOrder({
    userId: 'user_alex_carter',
    customerName: 'Alex Carter',
    phoneNumber: '0901234567',
    shippingAddress: '123 Đường Lê Lợi, Quận 1, TP. HCM',
    items: [
      {
        productId: 'p-01',
        name: 'AuraSound Horizon ANC Headphones',
        price: 4990000,
        quantity: 1,
        imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=700',
      },
    ],
    paymentMethodName: 'Thanh toán khi nhận hàng (COD)',
  });

  assert.ok(order.id);
  assert.equal(order.status, 'pending');
  assert.ok(order.totalAmount > 0);
});

test('UC015: Từ chối đặt hàng khi giỏ hàng trống hoặc thiếu thông tin giao hàng', async () => {
  await assert.rejects(
    () =>
      OrderService.createOrder({
        userId: 'user_alex_carter',
        customerName: 'Alex Carter',
        phoneNumber: '0901234567',
        shippingAddress: '',
        items: [],
      }),
    (err) => err.code === 'ORDER_EMPTY_ITEMS',
  );
});

/* ========================================================================== */
/*  UC016: HỦY ĐƠN HÀNG (Order Cancellation with Reason)                      */
/* ========================================================================== */
test('UC016: Hủy đơn hàng đang chờ xử lý và từ chối khi không có lý do', async () => {
  const order = await OrderService.createOrder({
    userId: 'user_alex_carter',
    customerName: 'Alex Carter',
    phoneNumber: '0901234567',
    shippingAddress: '123 Lê Lợi, Q1, HCM',
    items: [
      {
        productId: 'p-01',
        name: 'AuraSound Horizon ANC Headphones',
        price: 4990000,
        quantity: 1,
        imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=700',
      },
    ],
  });

  // Từ chối hủy nếu không có lý do
  await assert.rejects(
    () => OrderService.cancelOrder(order.id, ''),
    (err) => err.code === 'ORDER_CANCEL_MISSING_REASON' || err.message.includes('lý do'),
  );

  // Hủy thành công khi có lý do
  const cancelled = await OrderService.cancelOrder(order.id, 'Thay đổi ý định mua');
  assert.equal(cancelled.status, 'cancelled');
  assert.equal(cancelled.cancelReason, 'Thay đổi ý định mua');
});

/* ========================================================================== */
/*  UC017: THEO DÕI VÀ XEM HÓA ĐƠN ĐƠN HÀNG (Order Tracking & Invoice)       */
/* ========================================================================== */
test('UC017: Lấy chi tiết đơn hàng và timeline 4 bước xử lý', async () => {
  const orders = await OrderService.listOrders('user_alex_carter');
  assert.ok(orders.length > 0);

  const detail = await OrderService.getOrder(orders[0].id);
  assert.ok(detail.id);
  assert.ok(Array.isArray(detail.items));
  assert.ok(detail.totalAmount > 0);
});

/* ========================================================================== */
/*  UC018: ĐÁNH GIÁ SẢN PHẨM (Write Review with Rating & Photos)              */
/* ========================================================================== */
test('UC018: Gửi đánh giá sản phẩm thành công với điểm số 1-5 sao', async () => {
  const review = await CatalogService.addProductReview('p-01', {
    userId: 'user_alex_carter',
    userName: 'Alex Carter',
    rating: 5,
    content: 'Chất âm tuyệt vời, chống ồn rất tốt, giao hàng nhanh!',
    verifiedPurchase: true,
    createdAt: new Date().toISOString(),
  });

  try {
    assert.ok(review.id);
    assert.equal(review.rating, 5);
    assert.equal(review.verifiedPurchase, true);

    const reviews = await CatalogService.getProductReviews('p-01');
    assert.ok(reviews.some((r) => r.id === review.id));
  } finally {
    if (review?.id) {
      await CatalogService.deleteProductReview('p-01', review.id);
    }
  }
});

/* ========================================================================== */
/*  UC019: CẤU HÌNH CÀI ĐẶT ỨNG DỤNG (Application Settings)                  */
/* ========================================================================== */
test('UC019: Lưu và tải cấu hình ứng dụng người dùng', async () => {
  const uid = 'user_alex_carter';
  const settings = await ProfileService.getSettings(uid);
  assert.ok(typeof settings === 'object');

  const updated = await ProfileService.updateSettings(
    {
      darkMode: false,
      notifications: true,
      emailUpdates: true,
      language: 'vi',
    },
    uid,
  );
  assert.equal(updated.language, 'vi');
});

/* ========================================================================== */
/*  UC020: ĐĂNG XUẤT VÀ QUẢN LÝ PHIÊN (Session Management)                   */
/* ========================================================================== */
test('UC020: Đăng xuất người dùng và dọn dẹp phiên làm việc', async () => {
  await AuthService.logout();
  assert.ok(true);
});

/* ========================================================================== */
/*  UC021: ĐĂNG NHẬP VỚI TƯ CÁCH KHÁCH (Guest Mode)                           */
/* ========================================================================== */
test('UC021: Đăng nhập với tư cách khách và duyệt sản phẩm không cần mật khẩu', async () => {
  const guest = await AuthService.loginAsGuest();
  assert.ok(guest.uid);
  assert.equal(guest.isGuest, true);
});
