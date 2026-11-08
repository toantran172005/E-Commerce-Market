# ECommerceApp Feature Specification (SPEC.md)

| UC ID | Use Case Name | SRS Scope & Main Flow | Final Status | Evidence & Implementation Files |
|-------|---------------|-----------------------|--------------|---------------------------------|
| UC001 | Đăng nhập (User Login) | Login by email/phone + password; "Quên mật khẩu" reset flow; exact Vietnamese messages; session persistence | COMPLETE | `app/(auth)/login.tsx`, `src/services/auth.service.ts`. Tests: `UC001_to_UC021.test.mjs` (ok 1, 2, 3), `services.test.mjs` (ok 30, 31, 32). |
| UC002 | Quản lý tài khoản & Đăng ký | Account dashboard; register new account; validate email, password length, phone; session initialization | COMPLETE | `app/(auth)/register.tsx`, `app/(tabs)/account.tsx`. Tests: `UC001_to_UC021.test.mjs` (ok 4, 5, 6), `services.test.mjs` (ok 34). |
| UC003 | Cập nhật thông tin (Update Profile) | Edit name, phone; real avatar picker via `expo-image-picker` with <= 5MB validation; cancel confirmation; exact Vietnamese messages | COMPLETE | `app/update-user.tsx`, `src/services/auth.service.ts`. Tests: `UC001_to_UC021.test.mjs` (ok 7), `usecases.test.mjs` (ok 4). |
| UC004 | Quản lý sổ địa chỉ (Update Address) | Manage address book: recipient name, phone, province/city, district, ward, street detail; default address uniqueness | COMPLETE | `app/shipping-address.tsx`, `src/services/profile.service.ts`. Tests: `UC001_to_UC021.test.mjs` (ok 8), `services.test.mjs` (ok 14). |
| UC005 | Xem danh mục sản phẩm (Category Catalog) | Browse active categories; category-specific product listings; visual category badges | COMPLETE | `app/(tabs)/home.tsx`, `src/services/catalog.service.ts`. Tests: `UC001_to_UC021.test.mjs` (ok 9), `services.test.mjs` (ok 22). |
| UC006 | Tìm kiếm sản phẩm (Product Search) | Keyword search with Vietnamese accents; deduplicated search history (max 10) | COMPLETE | `app/(tabs)/home.tsx`, `src/services/search.service.ts`. Tests: `UC001_to_UC021.test.mjs` (ok 10), `services.test.mjs` (ok 16, 24). |
| UC007 | Lọc và sắp xếp sản phẩm (Filter & Sort) | Multi-filter by category, brand, price range, minimum rating (>= 4 stars); 5 sort options | COMPLETE | `app/filter.tsx`, `src/services/catalog.service.ts`. Tests: `UC001_to_UC021.test.mjs` (ok 11), `usecases.test.mjs` (ok 5-11). |
| UC008 | Xem chi tiết sản phẩm (Product Details) | Shopee-style specifications table ("CHI TIẾT SẢN PHẨM"), structured highlights & warranty ("MÔ TẢ SẢN PHẨM"), stock badge, verified HTTP 200 images, no nested buttons | COMPLETE | `app/product/[id].tsx`, `src/components/ProductSpecsTable.tsx`, `src/components/ProductDescriptionView.tsx`. Tests: `UC001_to_UC021.test.mjs` (ok 12), `services.test.mjs` (ok 25). |
| UC009 | Quản lý giỏ hàng (Cart Management) | Add to cart, variant selection, quantity stepper, stock cap, selection totals, VAT 8% tax calculation | COMPLETE | `app/cart.tsx`, `src/context/CartContext.tsx`, `src/utils/pricing.ts`. Tests: `UC001_to_UC021.test.mjs` (ok 13), `utils.test.mjs` (ok 47-52). |
| UC010 | Áp dụng mã giảm giá (Vouchers) | Voucher validation (% with cap, fixed, free shipping), min order check, category restrictions, cancel/change voucher button | COMPLETE | `src/services/voucher.service.ts`, `app/checkout.tsx`. Tests: `UC001_to_UC021.test.mjs` (ok 14), `services.test.mjs` (ok 26-29). |
| UC011 | Quản lý danh sách yêu thích (Wishlist) | Toggle favourite, persist to AsyncStorage/Firestore, card actions sibling layout (zero nested buttons) | COMPLETE | `app/(tabs)/favourite.tsx`, `src/context/FavouritesContext.tsx`. Tests: `UC001_to_UC021.test.mjs` (ok 15). |
| UC012 | Quản lý phương thức thanh toán | PCI DSS compliant card addition (only last4, brand, never CVV), wallet, COD, default payment selection | COMPLETE | `app/payment-method.tsx`, `src/services/profile.service.ts`. Tests: `UC001_to_UC021.test.mjs` (ok 16), `services.test.mjs` (ok 15). |
| UC013 | Xem thông báo hệ thống (Notifications) | Real-time notifications, mark as read, unread badge counter, order status updates | COMPLETE | `app/notification.tsx`, `src/services/notification.service.ts`. Tests: `UC001_to_UC021.test.mjs` (ok 17), `services.test.mjs` (ok 17). |
| UC014 | Trợ giúp & hỗ trợ người dùng (Support) | FAQ categories and accordion items, submit support tickets to Firestore | COMPLETE | `app/help.tsx`, `src/services/support.service.ts`. Tests: `UC001_to_UC021.test.mjs` (ok 18), `services.test.mjs` (ok 18). |
| UC015 | Đặt hàng và thanh toán (Checkout) | Atomic Firestore Transaction, DB-verified prices, live inventory stock decrement, sold-out guard aborts order, VAT 8%, shipping fee | COMPLETE | `app/checkout.tsx`, `src/services/order.service.ts`, `src/context/CheckoutContext.tsx`. Tests: `UC001_to_UC021.test.mjs` (ok 19, 20), `services.test.mjs` (ok 19, 20, 36). |
| UC016 | Hủy đơn hàng (Cancel Order) | Cancel pending order with reason, stock restoration, cannot cancel shipped/delivered orders | COMPLETE | `app/order/[id].tsx`, `src/services/order.service.ts`. Tests: `UC001_to_UC021.test.mjs` (ok 21), `services.test.mjs` (ok 21, 37). |
| UC017 | Xem lịch sử & theo dõi đơn hàng (Tracking & Invoice) | Orders list filtered by status tabs, 4-step timeline, detailed electronic VAT invoice modal ("Xem hóa đơn bán hàng") | COMPLETE | `app/orders.tsx`, `app/order/[id].tsx`, `src/components/InvoiceModal.tsx`. Tests: `UC001_to_UC021.test.mjs` (ok 22), `services.test.mjs` (ok 35). |
| UC018 | Đánh giá sản phẩm (Write Reviews) | Write review for delivered orders with interactive 1-5 star rating, feedback text, real photo attachment via picker, verified purchase tag | COMPLETE | `src/components/ReviewModal.tsx`, `app/order/[id].tsx`, `src/services/catalog.service.ts`. Tests: `UC001_to_UC021.test.mjs` (ok 23). |
| UC019 | Cấu hình cài đặt ứng dụng (Settings) | Application settings persistence: dark mode toggle, notification toggles, language preference | COMPLETE | `app/app-settings.tsx`, `src/services/profile.service.ts`. Tests: `UC001_to_UC021.test.mjs` (ok 24). |
| UC020 | Đăng xuất và quản lý phiên (Logout) | Clear auth session, reset user context and cache | COMPLETE | `app/(tabs)/account.tsx`, `src/services/auth.service.ts`. Tests: `UC001_to_UC021.test.mjs` (ok 25). |
| UC021 | Đăng nhập với tư cách khách (Guest Mode) | Anonymous guest login, browse products and cart without account, seamless migration | COMPLETE | `app/(auth)/login.tsx`, `src/services/auth.service.ts`. Tests: `UC001_to_UC021.test.mjs` (ok 26), `services.test.mjs` (ok 33). |

---

## Verification Summary
- **Total Use Cases Audited & Implemented**: 21/21 (100% COMPLETE).
- **Mobile Feedback Workpackages**:
  - WP-A (Nested `<button>` elimination & Toast positioning): 100% VERIFIED across `ProductCard.tsx`, `home.tsx`, `favourite.tsx`, `Toast.tsx`.
  - WP-B (Shopee Product Details table & Structured Description highlights): 100% IMPLEMENTED & SEEDED in Firestore.
  - WP-C (Image integrity & verified URLs): 100% VERIFIED (Minova Smart Plug placeholder replaced with authentic tech image; zero dead links).
- **Test Suite**: 78/78 automated tests passing across 3 consecutive green runs.
- **Production Bundle**: `npx expo export --platform web` and `npx expo export --platform android` succeed cleanly.
- **AI Tooling Separation**: 0 AI leaks inside `ECommerceApp/`. All AI assets reside in `ROOT/AI/`.
