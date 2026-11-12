# PROMPT: Auto-Transition Order Status Every 5s & Real Ratings Collection (Shopee-Style)

## ROLE & CONTEXT
You are a Principal Mobile Architect & Fullstack React Native / Firebase Engineer.
The project is an Expo React Native e-commerce marketplace written in TypeScript (React 19, Expo SDK 58, Expo Router, Cloud Firestore).

## EXISTING CONTRACTS & CODEBASE
1. `ECommerceApp/src/types/index.ts`:
   - `Order`: `id`, `userId`, `items: OrderItem[]`, `totalAmount`, `status: OrderStatus`, `canCancel?: boolean`, `timeline?: OrderTimelineStep[]`, `createdAt: number | string`.
   - `OrderStatus`: `'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'`.
   - `OrderItem`: `productId`, `name`, `price`, `quantity`, `imageUrl`, `variantName?`.
   - `Product`: `id`, `name`, `price`, `imageUrl`, `rating?: number`, `reviewCount?: number`.
   - `Review`: `id`, `productId`, `userId`, `userName`, `rating`, `content`, `createdAt`, `images?: string[]`.
2. `ECommerceApp/src/services/catalogService.ts`:
   - `getProductById(id)`
   - `getProducts(query)`
   - `getProductReviews(productId)`
3. `ECommerceApp/src/services/orderService.ts`:
   - `createOrder`, `listOrders`, `getOrder`, `cancelOrder`, `reorder`.
4. `ECommerceApp/src/context/OrdersContext.tsx`:
   - Manages user's orders state in memory, provides `orders`, `loadOrders`, `cancelOrder`, etc.
5. `ECommerceApp/app/orders.tsx`:
   - Tabs: `'all' | 'processing' | 'delivered' | 'cancelled'`.
6. `ECommerceApp/src/components/ReviewModal.tsx`:
   - Modal for rating & comment with ImagePicker.

## USER REQUIREMENTS
1. **5-Second Auto Status Transition**:
   - Order progression:
     - `pending` (Chờ xử lý / Đặt hàng thành công) -> after 5s -> `processing` (Đã xác nhận).
       * In both `pending` & `processing`, `canCancel: true` (user can cancel).
     - `processing` -> after 5s -> `shipped` (Đang vận chuyển).
       * Lock cancel button: `canCancel: false`.
     - `shipped` -> after 5s -> `delivered` (Đã giao hàng).
       * Lock cancel & edit buttons: `canCancel: false`.
       * Enable "Đánh giá" (Review) button.
     - If `cancelled`, stop transition.
   - Real-time updates in app + persist to Firestore `orders` document (including timeline steps completed) + create status notification for the user.
2. **Ratings Collection in Firestore**:
   - Create root collection `'ratings'` in Firestore:
     Fields: `id`, `productId`, `orderId`, `userId`, `userName`, `userAvatar`, `rating` (1-5), `comment`, `images` (string[]), `createdAt`.
   - Each review belongs to a `productId` and an `orderId`.
   - Update `order.reviewedItemIds` in Firestore so each product in an order knows whether it has been reviewed.
   - When a review is submitted:
     Calculate the true new average rating and reviewCount for the product and update `products/{productId}`!
3. **Real Data (No Hardcoding) for Product Ratings**:
   - When loading products (`getProductById`, `getProducts`), load actual ratings from Firestore collection `'ratings'` (or compute average dynamically).
   - `getProductReviews(productId)` reads actual records from `'ratings'` collection.
4. **Shopee-Style Separated Cards for "Đã giao" (Delivered) Tab**:
   - In `app/orders.tsx`, under the **"Đã giao"** (`delivered`) tab:
     - If an order contains multiple products, split each product into an individual Shopee-style order item card!
     - Each card displays:
       - Order ID (`#ORD-...`), delivered/order date.
       - Product thumbnail, product name, variant/classification, quantity, price.
       - Review status:
         - If reviewed: badge "Đã đánh giá" + star score + button "Xem đánh giá".
         - If NOT reviewed: prominent button **"Đánh giá"** (with star icon).
       - Button "Mua lại" (Reorder).
   - Other tabs (`Tất cả`, `Đang xử lý`, `Đã huỷ`) keep order-level cards.
5. **Review Modal**:
   - Support rating 1-5 stars, writing comment, picking actual images from library.
   - Save to Firestore collection `'ratings'`, update product rating & order `reviewedItemIds`.

## REQUIRED IMPLEMENTATION DETAILS
Provide production-ready code with 100% full implementation (NO placeholders, NO mock shortcuts, NO `// TODO`).
Include exact file paths and complete code blocks.
