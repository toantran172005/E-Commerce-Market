# Project: ECommerceApp   Stack: React Native 0.88, Expo Router ~58.0.26, React 19.3.0, TypeScript ~6.0.3, Firebase ^12.19.0, Node.js v22.14.0

## Commands   build: npx expo export --platform android && npx expo export --platform web | test: npm run test:all | lint: npm run typecheck | typecheck: npm run typecheck | run: npx expo start

## Architecture
- Entry point: `ECommerceApp/node_modules/expo-router/entry.js` -> `app/_layout.tsx`
- Routing: Expo Router (file-based navigation in `app/`)
  - Tabs: `app/(tabs)/_layout.tsx` (`home.tsx`, `cart.tsx`, `favourite.tsx`, `account.tsx`)
  - Auth: `app/(auth)/login.tsx`, `app/(auth)/register.tsx`
  - Flows: `product/[id].tsx`, `checkout.tsx`, `checkout-success.tsx`, `orders.tsx`, `order/[id].tsx`, `shipping-address.tsx`, `payment-method.tsx`, `notification.tsx`, `app-settings.tsx`, `help.tsx`, `update-user.tsx`
- Layer Convention: Screen -> Context/Hook -> Service -> Firebase (with in-memory fallback)
- AI Tooling Root: `ROOT/AI/` (all scripts, prompts, runs, state are strictly outside `ECommerceApp/`)

## SPEC STATUS
- UC001 Đăng nhập: PARTIAL (Missing forgot password flow & exact SRS error message)
- UC002 Quản lý tài khoản: COMPLETE
- UC003 Cập nhật thông tin: PARTIAL (Pravatar placeholder -> real avatar picker/upload & size limit)
- UC004 Cập nhật địa chỉ: PARTIAL (Structured address fields: province, district, ward, street)
- UC005-UC009 Lọc & Tìm kiếm sản phẩm: COMPLETE
- UC010 Xem chi tiết sản phẩm: PARTIAL (Needs Shopee-style specs & descriptions per mobile.docx B)
- UC011-UC014 Giỏ hàng: COMPLETE
- UC015 Đặt hàng và thanh toán: PARTIAL (Sold-out detection during checkout, payment-failure state)
- UC016 Áp dụng voucher: PARTIAL (Category restrictions & cancel/change voucher)
- UC017 Xác nhận đơn: PARTIAL (Receipt/invoice view modal)
- UC018 Hủy đơn hàng: COMPLETE
- UC019-UC021 Yêu thích: COMPLETE
- BUG-A mobile.docx A: BROKEN (Nested buttons causing Web hydration/DOM warnings + Toast overlap)
- FEAT-B mobile.docx B: MISSING (Shopee-style "CHI TIẾT SẢN PHẨM" & "MÔ TẢ SẢN PHẨM")
- FEAT-C Product Images: PARTIAL (Picsum placeholders to be replaced with authentic tech URLs + fallback)
- FEAT-REV Write Review Flow: MISSING (Review submission on delivered orders)

## Baseline
- TypeScript Typecheck (`npm run typecheck`): 100% PASS (0 errors)
- Test Suite (`npm test`): 51/51 PASS (31 test suites, 0 failures)
- Static Export: Android Hermes bundle PASS, Web export PASS
- AI Relocation (Task D): Completed via commit `153ece8` with zero AI files remaining in `ECommerceApp/`

## BACKLOG
- [ ] P0-001 [WP-A] Fix nested <button> DOM violations app-wide and adjust Toast position to not overlap bottom action bar | `src/components/ProductCard.tsx`, `app/filter.tsx`, `app/notification.tsx`, `app/payment-method.tsx`, `app/(tabs)/home.tsx`, `app/(tabs)/favourite.tsx`, `app/order/[id].tsx`, `src/components/Toast.tsx` | Zero `validateDOMNesting` / `<button> cannot contain a nested <button>` console warnings on web
- [ ] P1-001 [WP-B] Expand Product domain type and update realistic Vietnamese specification & description data | `src/types/index.ts`, `seed.mjs`, `src/mock/products.ts` | All products have `categoryPath`, `details`, `highlights`, `longDescription`, `warrantyPolicy`
- [ ] P1-002 [WP-B] Implement Shopee-style "CHI TIẾT SẢN PHẨM" and "MÔ TẢ SẢN PHẨM" UI components on Product Detail screen | `app/product/[id].tsx`, `src/components/ProductSpecsTable.tsx`, `src/components/ProductDescriptionView.tsx` | Renders breadcrumb, specs table with stock status, collapsible description, warranty card
- [ ] P1-003 [WP-C] Verify and curate stable HTTP 200 product images, add ImageFallback and gallery dots/swiping | `src/mock/products.ts`, `seed.mjs`, `src/components/ImageFallback.tsx` | All product image URLs return HTTP 200, broken images fallback gracefully
- [ ] P1-004 [WP-UC001] Implement Forgot Password flow via Firebase sendPasswordResetEmail and exact SRS error messages | `app/(auth)/login.tsx`, `src/services/auth.service.ts` | Forgot password modal triggers reset email; invalid credentials show "Thông tin đăng nhập không chính xác"
- [ ] P1-005 [WP-UC003] Implement real avatar picker using expo-image-picker with file size validation (<=5MB) and cancel confirmation | `app/update-user.tsx`, `src/services/profile.service.ts` | Users can pick photos from device library or camera; pravatar removed
- [ ] P1-006 [WP-UC004] Support structured address fields (Tỉnh/Thành, Quận/Huyện, Phường/Xã, Địa chỉ chi tiết) | `src/types/index.ts`, `app/shipping-address.tsx`, `src/services/profile.service.ts` | Address modal has structured inputs with Vietnamese validations
- [ ] P1-007 [WP-UC015-017] Strengthen checkout flow: sold-out detection, payment failure / "Chờ thanh toán", voucher category restriction, receipt/invoice view | `app/checkout.tsx`, `app/checkout-success.tsx`, `src/services/voucher.service.ts`, `src/services/order.service.ts` | Sold-out items blocked during checkout, vouchers validate categories, invoice view available
- [ ] P2-001 [WP-REV] Implement Write Review flow for delivered orders with rating stars, feedback text, and optional photo | `app/order/[id].tsx`, `src/components/ReviewModal.tsx`, `src/services/catalog.service.ts` | Delivered orders have "Đánh giá" button that saves review to Firestore
- [ ] P3-001 [WP-TEST] Comprehensive UC Test Suite (UC001-UC021) in `tests/uc/` passing 3 consecutive runs | `tests/uc/*.test.mjs`, `package.json` | 100% PASS for all UCs with terminal proof

## IN PROGRESS
- P0-001 [WP-A] Fix nested <button> DOM violations app-wide and adjust Toast position

## DONE
- [x] P0-000 Task D AI Relocation | `ECommerceApp/scripts/`, `AI/scripts/`, `AI/prompts/`, `AI/runs/`, `AI/.agent/` | Zero AI references in ECommerceApp, tests pass | `153ece8`

## BLOCKED
- None.

## DECISIONS
- Separated card body pressable and card actions (e.g. favourite button) into siblings wrapped by a standard `<View>` to avoid React Native Web `<button> cannot contain a nested <button>` HTML error.
- Installed `expo-image-picker` with `npx expo install expo-image-picker` to provide genuine native & web image picking without breaking Expo SDK 58 compatibility.

## TECH DEBT / KNOWN ISSUES
- None.

## NEXT STEP
- Execute P0-001: Fix nested buttons in `ProductCard.tsx`, `home.tsx`, `favourite.tsx`, `filter.tsx`, `notification.tsx`, `payment-method.tsx`, `order/[id].tsx`, and position `Toast.tsx`.
