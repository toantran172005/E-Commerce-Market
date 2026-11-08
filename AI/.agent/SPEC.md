# ECommerceApp Feature Specification (SPEC.md)

## Overview
A modern, responsive e-commerce mobile application built with React Native (Expo Router v58), React 19, TypeScript 6, and a robust offline/mock service layer with realistic business logic.

---

## 1. Authentication & Profile
- **F-AUTH-01: User Login**
  - Path: `app/(auth)/login.tsx`
  - Specification: Email + password authentication. Validates input format (RFC regex for email, >= 6 chars for password). Supports preset demo login (`demo@shop.vn / 123456`).
  - Status: COMPLETE (Verified via UI & unit test in `tests/services.test.mjs`).
- **F-AUTH-02: User Registration**
  - Path: `app/(auth)/register.tsx`
  - Specification: Full name, email, phone number, and password fields. Validates Vietnamese phone prefixes and unique email.
  - Status: COMPLETE (Verified via `AuthService.register`).
- **F-AUTH-03: Guest Browsing Mode**
  - Path: `app/(auth)/login.tsx` -> `AuthService.loginAsGuest`
  - Specification: Allows users to explore the catalog, add products to cart, and test checkout without immediate account registration.
  - Status: COMPLETE (Verified via `AuthService.loginAsGuest`).
- **F-AUTH-04: Profile Management**
  - Path: `app/update-user.tsx`
  - Specification: View and update personal information (full name, email, phone number, default address).
  - Status: COMPLETE.

---

## 2. Product Catalog & Search
- **F-CAT-01: Home Screen**
  - Path: `app/(tabs)/home.tsx`
  - Specification: Promotional banner carousel, horizontal category slider with iconography, search input, flash sale list, popular products grid.
  - Status: COMPLETE.
- **F-CAT-02: Product Detail**
  - Path: `app/product/[id].tsx`
  - Specification: High-resolution image view, color & size variant selector, formatted price with discount badge, stock availability, customer ratings/reviews, Add to Cart and Buy Now.
  - Status: COMPLETE.
- **F-CAT-03: Filter & Search**
  - Path: `app/filter.tsx`
  - Specification: Filter by single/multiple categories, brand selection, min/max price slider/inputs, minimum star rating, and sort options (popular, price asc/desc, newest, rating).
  - Status: COMPLETE.

---

## 3. Cart & Checkout
- **F-CART-01: Shopping Cart Management**
  - Path: `app/cart.tsx`
  - Specification: Increase/decrease item quantity, delete items, select/deselect items, instant subtotal recalculation.
  - Status: COMPLETE (Verified via `tests/utils.test.mjs`).
- **F-CHECKOUT-01: Checkout Process**
  - Path: `app/checkout.tsx`
  - Specification: Delivery address selection, shipping method calculation, voucher discount calculation with minimum order limits, order notes, payment options (COD, MoMo, Bank transfer: BIDV, Vietinbank, Agribank, Vietcombank).
  - Status: COMPLETE.
- **F-CHECKOUT-02: Checkout Confirmation**
  - Path: `app/checkout-success.tsx`
  - Specification: Displays placed order ID, order recap, button to view order tracking or return to home.
  - Status: COMPLETE.

---

## 4. Orders & Tracking
- **F-ORD-01: Order History**
  - Path: `app/orders.tsx`
  - Specification: Filter tabs (All, Pending, Shipping, Delivered, Cancelled). Summary cards with status badges and order totals.
  - Status: COMPLETE (Verified via `OrderService.listOrders`).
- **F-ORD-02: Order Details & Timeline**
  - Path: `app/order/[id].tsx`
  - Specification: Itemized order breakdown, delivery address, payment method, dynamic vertical tracking timeline, and order cancellation button for eligible orders.
  - Status: COMPLETE (Verified via `OrderService.getOrder` & `OrderService.cancelOrder`).

---

## 5. Account, Settings & Support
- **F-ACC-01: Account Center**
  - Path: `app/(tabs)/account.tsx`
  - Specification: Profile overview, quick navigation to Orders, Shipping Addresses, Payment Methods, Settings, Help & Support, and Logout.
  - Status: COMPLETE.
- **F-ACC-02: Address Book**
  - Path: `app/shipping-address.tsx`
  - Specification: List saved addresses, set default address, distinctive icons for Home vs Office, add/edit address modal with full form validation.
  - Status: COMPLETE.
- **F-ACC-03: Payment Methods**
  - Path: `app/payment-method.tsx`
  - Specification: List saved cards/wallets with authentic brand styling (MoMo pink, Vietinbank blue, Vietcombank green, BIDV, Agribank), add new card modal (card number & expiry), set default.
  - Status: COMPLETE.
- **F-ACC-04: Notifications**
  - Path: `app/notification.tsx`
  - Specification: View system & order notifications, mark as read, popup detail modal on tap with dismiss button.
  - Status: COMPLETE.
- **F-ACC-05: App Settings**
  - Path: `app/app-settings.tsx`
  - Specification: Push notification permission toggle, terms and privacy policy view.
  - Status: COMPLETE.
- **F-ACC-06: Help & Support**
  - Path: `app/help.tsx`
  - Specification: Collapsible FAQs accordion, hotline phone link, direct support email and live chat triggers.
  - Status: COMPLETE.
