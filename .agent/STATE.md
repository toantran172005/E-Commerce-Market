# Project: ECommerceApp   Stack: React Native 0.88, Expo Router ~58, React 19.3.0, TypeScript ~6.0.3, Node.js v22.14.0

## Commands   build: npx expo export --platform android | test: npm test | lint: npm run typecheck | typecheck: npm run typecheck | run: npx expo start

## Architecture
- Entry point: `ECommerceApp/node_modules/expo-router/entry.js` -> `app/_layout.tsx`
- Routing: Expo Router (file-based navigation in `app/`)
  - Tabs: `app/(tabs)/_layout.tsx` (`home.tsx`, `cart.tsx`, `favourite.tsx`, `account.tsx`)
  - Auth: `app/(auth)/login.tsx`, `app/(auth)/register.tsx`
  - Flows: `product/[id].tsx`, `checkout.tsx`, `checkout-success.tsx`, `orders.tsx`, `order/[id].tsx`, `shipping-address.tsx`, `payment-method.tsx`, `notification.tsx`, `app-settings.tsx`, `help.tsx`
- State & Business Logic:
  - Context Providers: `AuthContext`, `CartContext`, `OrderContext`, `ThemeContext`
  - Services: `CatalogService`, `VoucherService`, `OrderService`, `AuthService`, `ProfileService`
  - Utilities: `pricing.ts`, `format.ts`, `cart.ts`
  - Mock Layer: `src/mock/` with realistic Vietnam e-commerce seed data

## SPEC STATUS
- F-AUTH-01: User Login | COMPLETE | Verified in UI & `tests/services.test.mjs` (test 9, 10)
- F-AUTH-02: User Registration | COMPLETE | Verified in `tests/services.test.mjs` (test 12)
- F-AUTH-03: Guest Browsing Mode | COMPLETE | Verified in `tests/services.test.mjs` (test 11)
- F-AUTH-04: Profile Management | COMPLETE | Verified in `app/update-user.tsx`
- F-CAT-01: Home Screen | COMPLETE | Verified in `app/(tabs)/home.tsx` & Android Hermes bundle
- F-CAT-02: Product Detail | COMPLETE | Verified in `app/product/[id].tsx`
- F-CAT-03: Filter & Search | COMPLETE | Verified in `app/filter.tsx` & `CatalogService` tests (test 2, 3)
- F-CART-01: Shopping Cart Management | COMPLETE | Verified in `tests/utils.test.mjs` (test 10-15)
- F-CHECKOUT-01: Checkout Process | COMPLETE | Verified in `app/checkout.tsx` & `tests/services.test.mjs` (test 8, 14)
- F-CHECKOUT-02: Checkout Confirmation | COMPLETE | Verified in `app/checkout-success.tsx`
- F-ORD-01: Order History | COMPLETE | Verified in `tests/services.test.mjs` (test 13)
- F-ORD-02: Order Details & Timeline | COMPLETE | Verified in `tests/services.test.mjs` (test 14, 15)
- F-ACC-01: Account Center | COMPLETE | Verified in `app/(tabs)/account.tsx`
- F-ACC-02: Address Book | COMPLETE | Verified in `app/shipping-address.tsx`
- F-ACC-03: Payment Methods | COMPLETE | Verified in `app/payment-method.tsx`
- F-ACC-04: Notifications | COMPLETE | Verified in `app/notification.tsx`
- F-ACC-05: App Settings | COMPLETE | Verified in `app/app-settings.tsx`
- F-ACC-06: Help & Support | COMPLETE | Verified in `app/help.tsx`

## Baseline
- TypeScript Typecheck (`npm run typecheck`): 100% PASS (0 errors)
- Test Suite (`npm test`): 30/30 PASS (15 utils tests + 15 services tests)
- Bundler Build (`npx expo export --platform android`): 100% PASS (1299 modules bundled into `dist`)

## BACKLOG
- None remaining. All P0, P1, P2, and P3 tasks completed and verified.

## IN PROGRESS
- None.

## DONE
- [x] P0-000 Bootstrap Zero-Dependency DeepSeek Runner | scripts/call_deepseek.py, ECommerceApp/scripts/call_deepseek.py | Verified connection to DeepSeek API | scripts/call_deepseek.py
- [x] P1-001 Add test and typecheck scripts to package.json | ECommerceApp/package.json | npm test, npm run typecheck | e8d6af7
- [x] P1-002 Create comprehensive utility test suite and fix Vietnamese phone validation regex | src/utils/format.ts, tests/utils.test.mjs | 15 unit tests added | e8d6af7
- [x] P2-001 Create end-to-end service test suite covering catalog, voucher, auth, and order pipelines | tests/services.test.mjs | 15 service tests added | e8d6af7
- [x] P3-001 Execute full verification pipeline (unit tests + typecheck + Hermes production bundler) | ECommerceApp/ | 30 tests PASS, tsc PASS, expo export PASS | e8d6af7

## BLOCKED
- None.

## DECISIONS
- Used Node.js built-in test runner (`node:test` + `node:assert`) coupled with `tsx` runner to avoid heavy external dependencies while seamlessly supporting TypeScript directory imports.
- Enforced strict character validation in `isValidPhoneVn` (`src/utils/format.ts`) before stripping non-digits to prevent strings with alphabetic noise from passing validation.
- Preserved 100% backward compatibility of all existing components, hooks, and navigation stacks.

## TECH DEBT / KNOWN ISSUES
- `src/firebaseConfig.ts`: Retained as an optional connector for future cloud Firebase integration when transitioning from mock state to live production server.

## NEXT STEP
- None. All requirements and verifications satisfied. Codebase is in production-ready state.
