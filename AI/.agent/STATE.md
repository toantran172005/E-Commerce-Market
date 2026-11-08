# Project: E-Commerce Market Mobile App   Stack: React Native (Expo SDK 52), TypeScript, Cloud Firestore, Firebase Auth
## Commands   build: npx expo export --platform web / android | test: npm run test:all | lint: npx expo lint | typecheck: npm run typecheck | run: npx expo start

## Architecture
- Expo Router file-based navigation (`app/`)
- Layered service architecture (`src/services/` with Firestore & Mock dual-mode fallback)
- React Context state management (`src/context/`: Auth, Cart, Checkout, Addresses, Orders, Notifications, Favourites, PaymentMethods)
- Atomic Transactions for inventory reservation and order placement (`OrderService.createOrder`)
- Decoupled AI Tooling in `ROOT/AI/` (`scripts/`, `prompts/`, `runs/`, `.agent/`)

## SPEC STATUS
- UC001 Đăng nhập: COMPLETE (Tests: `UC001_to_UC021.test.mjs` ok 1,2,3)
- UC002 Đăng ký: COMPLETE (Tests: `UC001_to_UC021.test.mjs` ok 4,5,6)
- UC003 Cập nhật hồ sơ: COMPLETE (Tests: `UC001_to_UC021.test.mjs` ok 7)
- UC004 Sổ địa chỉ 4 cấp: COMPLETE (Tests: `UC001_to_UC021.test.mjs` ok 8)
- UC005 Danh mục sản phẩm: COMPLETE (Tests: `UC001_to_UC021.test.mjs` ok 9)
- UC006 Tìm kiếm & lịch sử: COMPLETE (Tests: `UC001_to_UC021.test.mjs` ok 10)
- UC007 Lọc & sắp xếp: COMPLETE (Tests: `UC001_to_UC021.test.mjs` ok 11)
- UC008 Chi tiết Shopee: COMPLETE (Tests: `UC001_to_UC021.test.mjs` ok 12)
- UC009 Giỏ hàng & VAT 8%: COMPLETE (Tests: `UC001_to_UC021.test.mjs` ok 13)
- UC010 Voucher & danh mục: COMPLETE (Tests: `UC001_to_UC021.test.mjs` ok 14)
- UC011 Yêu thích (no nested button): COMPLETE (Tests: `UC001_to_UC021.test.mjs` ok 15)
- UC012 Phương thức thanh toán: COMPLETE (Tests: `UC001_to_UC021.test.mjs` ok 16, `services.test.mjs` ok 38,39,40)
- UC013 Thông báo hệ thống: COMPLETE (Tests: `UC001_to_UC021.test.mjs` ok 17, `services.test.mjs` ok 41)
- UC014 Trợ giúp & FAQ: COMPLETE (Tests: `UC001_to_UC021.test.mjs` ok 18)
- UC015 Đặt hàng Transaction: COMPLETE (Tests: `UC001_to_UC021.test.mjs` ok 19,20)
- UC016 Hủy đơn hàng: COMPLETE (Tests: `UC001_to_UC021.test.mjs` ok 21)
- UC017 Theo dõi & Hóa đơn: COMPLETE (Tests: `UC001_to_UC021.test.mjs` ok 22)
- UC018 Đánh giá sao & ảnh: COMPLETE (Tests: `UC001_to_UC021.test.mjs` ok 23)
- UC019 Cài đặt ứng dụng: COMPLETE (Tests: `UC001_to_UC021.test.mjs` ok 24)
- UC020 Đăng xuất & phiên: COMPLETE (Tests: `UC001_to_UC021.test.mjs` ok 25)
- UC021 Khách vãng lai: COMPLETE (Tests: `UC001_to_UC021.test.mjs` ok 26)

## Baseline
- Initial build: 78 tests passed, zero type errors, expo web & android bundle succeeded.
- Post prompt 003: 82 tests passed (78 + 4 regression), zero type errors, expo web & android export passed.

## BACKLOG
- All prompt 003 work packages (WP-CURRENCY, WP-CART-LAYOUT, WP-HOME-CARD-AND-TABBAR, WP-NOTIFICATION-READ-STATE, WP-PAYMENT-COD-DEFAULT) completed.

## IN PROGRESS
- None. All phases complete.

## DONE
- [x] P0-001 Eliminate nested button violations in React Native Web & adjust toast positioning | `ProductCard.tsx`, `home.tsx`, `favourite.tsx`, `Toast.tsx`
- [x] P1-001 Shopee-style product specifications table & structured description view | `ProductSpecsTable.tsx`, `ProductDescriptionView.tsx`, `app/product/[id].tsx`
- [x] P1-002 Authentic tech product image verification (Minova Smart Plug & Firestore re-seed) | `src/mock/products.ts`, `seed.mjs`
- [x] P1-004 Forgot password reset flow and exact Vietnamese login errors | `app/(auth)/login.tsx`, `src/services/auth.service.ts`
- [x] P1-005 Native avatar picker with size validation and Vietnamese error messages | `app/update-user.tsx`
- [x] P1-006 Structured 4-level address fields (province, district, ward, street) | `app/shipping-address.tsx`, `src/services/profile.service.ts`
- [x] P1-007 Inventory stock guard, voucher category check, electronic invoice view modal | `app/checkout.tsx`, `src/components/InvoiceModal.tsx`, `src/services/voucher.service.ts`
- [x] P2-001 Write review flow with 1-5 stars rating, comments and real photos | `src/components/ReviewModal.tsx`, `app/order/[id].tsx`, `src/services/catalog.service.ts`
- [x] P3-001 Comprehensive UC001-UC021 automated test suite (78 tests, 3 consecutive green runs) | `tests/uc/UC001_to_UC021.test.mjs`, `package.json`
- [x] P4-001 Real iPhone Defect Fix: WP-CURRENCY (VND Unification 21.990.000 ₫, 0 hardcoded $) | `src/utils/format.ts`, `src/components/ProductCard.tsx`, `src/mock/vouchers.ts`, `src/mock/notifications.ts`, `app/filter.tsx`
- [x] P4-002 Real iPhone Defect Fix: WP-CART-LAYOUT (Defect 1: cart row horizontal overflow, compact stepper, safe bottom spacing) | `app/cart.tsx`
- [x] P4-003 Real iPhone Defect Fix: WP-HOME-CARD-AND-TABBAR (Defect 2: iOS home indicator tab bar collision fix via `useSafeAreaInsets`, category chip 2-line centered labels, price wrapping) | `app/(tabs)/_layout.tsx`, `app/(tabs)/home.tsx`, `app/(tabs)/favourite.tsx`
- [x] P4-004 Real iPhone Defect Fix: WP-NOTIFICATION-READ-STATE (Defect 3: optimistic read update, white unread vs light grey `#F3F4F6` read backgrounds, unread red dot removal, AsyncStorage sync) | `app/notification.tsx`, `src/services/notification.service.ts`, `src/context/NotificationsContext.tsx`
- [x] P4-005 Real iPhone Defect Fix: WP-PAYMENT-COD-DEFAULT (Defect 4: permanent immutable COD fallback default, dedicated COD card mockup, real cardholder name `holderName`) | `app/payment-method.tsx`, `src/services/profile.service.ts`, `src/types/index.ts`
- [x] P4-006 Regression Test Suite: 4 new regression tests covering COD default, COD delete protection, cardholder name persistence, and notification read state (82/82 tests pass 3x consecutively) | `tests/services.test.mjs`, `tests/utils.test.mjs`

## BLOCKED
- None.

## DECISIONS
- Separated all AI scripts, prompts, and runs to `ROOT/AI/` keeping `ECommerceApp/` 100% clean of AI dependencies.
- Replaced nested pressables in product cards with sibling layout to adhere to HTML5 / DOM specifications for React Native Web.
- Formatted VND money with `vi-VN` locale (`21.990.000 ₫`) without fraction digits, default across entire application.
- Kept COD as a permanent built-in default payment method that cannot be deleted and automatically restores as default when user cards are removed.
- Tab bar style dynamically incorporates `useSafeAreaInsets().bottom` to ensure iOS home indicator never cuts off tab labels.

## TECH DEBT / KNOWN ISSUES
- None. Zero DOM errors, zero TypeScript errors, 100% test pass rate (82/82), clean Web and Android Hermes export.

## NEXT STEP
- Task complete. Ready for final release commit and presentation to USER.
