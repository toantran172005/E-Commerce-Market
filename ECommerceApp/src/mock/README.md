# Tầng Mock Data + Services

Tài liệu này mô tả toàn bộ dữ liệu mock, quan hệ giữa các thực thể, và endpoint REST giả định mà `src/services` mô phỏng. Khi có backend thật, chỉ cần thay đổi nội dung bên trong các service — **không cần sửa UI, context hay type**.

## 1. Tài khoản demo

| Email | Mật khẩu | Vai trò |
|-------|----------|---------|
| `demo@shop.vn` | `123456` | Người dùng demo chính |

Người dùng khách (guest) được hỗ trợ qua `AuthService.loginAsGuest()`.

## 2. Danh sách file mock

| File | Nội dung |
|------|----------|
| `users.ts` | 3 user + guest, kèm mật khẩu cho demo |
| `categories.ts` | 10 danh mục |
| `brands.ts` | 15 thương hiệu |
| `products.ts` | 50 sản phẩm (đa dạng ảnh, biến thể, stock, tags, sale/new/hot) |
| `reviews.ts` | 84 review gắn theo sản phẩm |
| `vouchers.ts` | 7 voucher (%/số tiền/miễn ship, có hết hạn + hết lượt) |
| `orders.ts` | 15 đơn hàng đủ 5 trạng thái, có timeline, lý do huỷ, mã vận đơn |
| `notifications.ts` | 24 thông báo order/promo/system/review |
| `addresses.ts` | 4 địa chỉ, 1 mặc định |
| `paymentMethods.ts` | 5 phương thức thanh toán (thẻ/ví/COD) |
| `faqs.ts` | 12 FAQ trong 4 nhóm |
| `supportTickets.ts` | 4 ticket hỗ trợ |
| `appSettings.ts` | Cài đặt mặc định |
| `search.ts` | Lịch sử tìm kiếm + từ khoá phổ biến |
| `shippingMethods.ts` | 3 phương thức giao hàng |

## 3. Schema chính (xem chi tiết trong `src/types/index.ts`)

| Thực thể | Trường quan trọng | Quan hệ |
|----------|-------------------|---------|
| `Product` | `id`, `name`, `price`, `category`, `brandId`, `variants[]` | `category` → `Category.id`, `brandId` → `Brand.id` |
| `Review` | `productId`, `userId`, `rating` | `productId` → `Product.id`, `userId` → user |
| `Voucher` | `code`, `type`, `value`, `minOrderValue`, `isActive` | dùng trong Cart/Checkout |
| `Order` | `id`, `userId`, `items[]`, `status`, `timeline[]`, `trackingCode` | `items[].productId` → `Product.id`, `paymentMethodId` → `PaymentMethod.id`, `shippingMethodId` → `ShippingMethod.id` |
| `Address` | `id`, `isDefault` | dùng trong Checkout |
| `PaymentMethod` | `id`, `type`, `detail`, `isDefault` | dùng trong Checkout |
| `AppNotification` | `id`, `type`, `read`, `data.orderId/productId` | `data` trỏ tới Order/Product |

## 4. Endpoint REST giả định ↔ Service

### AuthService (`src/services/auth.service.ts`)

| Hàm | Endpoint | Ghi chú |
|-----|----------|---------|
| `login` | `POST /auth/login` | Sai mật khẩu → `ApiError AUTH_INVALID_CREDENTIALS` |
| `register` | `POST /auth/register` | Email tồn tại → `AUTH_EMAIL_EXISTS` |
| `logout` | `POST /auth/logout` | |
| `getProfile` | `GET /auth/me` | |
| `updateProfile` | `PATCH /users/me` | |
| `loginAsGuest` | `POST /auth/login-guest` | |

### CatalogService (`src/services/catalog.service.ts`)

| Hàm | Endpoint |
|-----|----------|
| `getCategories` | `GET /categories` |
| `getBrands` | `GET /brands` |
| `getProducts` | `GET /products?category=&categories[]=&q=&brands[]=&minPrice=&maxPrice=&minRating=&sort=&page=&limit=` |
| `getProductById` | `GET /products/:id` |
| `getProductReviews` | `GET /products/:id/reviews` |

Hỗ trợ sort: `popular | new | priceAsc | priceDesc | rating`.

### VoucherService (`src/services/voucher.service.ts`)

| Hàm | Endpoint |
|-----|----------|
| `listVouchers` | `GET /vouchers` |
| `validateVoucher` | `POST /vouchers/validate` — body `{ code, subtotal, shippingFee }` |

Lỗi: `VOUCHER_NOT_FOUND`, `VOUCHER_EXPIRED`, `VOUCHER_OUT_OF_USAGE`, `VOUCHER_MIN_ORDER_NOT_MET`.

### OrderService (`src/services/order.service.ts`)

| Hàm | Endpoint |
|-----|----------|
| `listOrders` | `GET /orders?userId=` |
| `getOrder` | `GET /orders/:id` |
| `createOrder` | `POST /orders` |
| `cancelOrder` | `POST /orders/:id/cancel` — body `{ reason }` |
| `reorder` | `POST /orders/:id/reorder` |

Lỗi: `ORDER_NOT_FOUND`, `ORDER_CANCEL_NOT_ALLOWED`, `ORDER_ITEMS_OUT_OF_STOCK`.

### NotificationService (`src/services/notification.service.ts`)

| Hàm | Endpoint |
|-----|----------|
| `listNotifications` | `GET /notifications` |
| `markAsRead` | `PATCH /notifications/:id/read` |
| `markAllAsRead` | `PATCH /notifications/read-all` |
| `createNotification` | `POST /notifications` |

### ProfileService (`src/services/profile.service.ts`)

| Nhóm | Endpoint |
|------|----------|
| Địa chỉ | `GET/POST /addresses`, `PATCH/DELETE /addresses/:id`, `PATCH /addresses/:id/default` |
| Thanh toán | `GET/POST /payment-methods`, `DELETE /payment-methods/:id`, `PATCH /payment-methods/:id/default` |
| Cài đặt | `GET/PATCH /settings` |

### SupportService (`src/services/support.service.ts`)

| Hàm | Endpoint |
|-----|----------|
| `getFaqGroups` | `GET /faq-groups` |
| `getFaqs` | `GET /faqs` |
| `listTickets` | `GET /tickets?userId=` |
| `createTicket` | `POST /tickets` |

### SearchService (`src/services/search.service.ts`)

| Hàm | Endpoint |
|-----|----------|
| `getPopularSearches` | `GET /search/popular` |
| `getSearchHistory` | `GET /search/history` |
| `saveSearch` | `POST /search/history` |
| `clearSearchHistory` | `DELETE /search/history` |

## 5. Context và mối quan hệ

```
AuthProvider
└─ NotificationsProvider
   └─ CartProvider
      └─ FavouritesProvider
         └─ AddressesProvider
            └─ PaymentMethodsProvider
               └─ SettingsProvider
                  └─ OrdersProvider      (dùng useCart để mua lại)
                     └─ CheckoutProvider (gọi Cart + Orders + Notifications + Addresses + Payments)
                        └─ ProductFilterProvider
```

Luồng đặt hàng (`CheckoutContext.placeOrder`):
1. Kiểm tra đăng nhập, giỏ hàng, địa chỉ, phương thức thanh toán.
2. Gọi `OrderService.createOrder` → tạo Order thật.
3. Đưa order vào `OrdersContext`.
4. Xoá sản phẩm đã mua khỏi Cart, xoá voucher.
5. Sinh thông báo `order` trong `NotificationsContext`.

Khi logout, `AppProviders` tăng `resetKey` để Cart/Favourites/Addresses/... reset về trạng thái ban đầu.

## 6. Cách thay mock bằng API thật

1. Đặt `MOCK_LATENCY = false` trong `src/services/http.ts` (hoặc xoá bước delay).
2. Thay từng thân hàm trong `src/services` bằng `fetch`/`axios` gọi đúng endpoint đã liệt kê ở trên.
3. **Giữ nguyên chữ ký hàm** — UI và context đã phụ thuộc vào các tên hàm này.
4. Ép response thành các type trong `src/types/index.ts`.
5. Với mutation (đơn hàng, thông báo, địa chỉ...), bỏ biến `xxxDb` trong service, gọi API thật rồi return response.
6. Thay `AuthProvider` bootstrap bằng `GET /auth/me` để khôi phục phiên đăng nhập từ token.

> Kiểm tra lại sau khi đổi: chạy `npx tsc --noEmit` đảm bảo không lỗi type.
