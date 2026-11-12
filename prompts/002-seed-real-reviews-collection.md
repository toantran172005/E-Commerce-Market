# PROMPT: Seed Real Reviews Collection in Cloud Firestore & Sync Reviews/Ratings

## ROLE & CONTEXT
You are a Principal Firebase & React Native Fullstack Engineer.
The project is an Expo React Native marketplace using Cloud Firestore with 25 products.
Currently, Firestore has 11 collections (`brands`, `categories`, `products`, `product_attributes`, `user_favourites`, `users`, `shipping_addresses`, `orders`, `order_items`, `promos`, `notifications`).
Firebase Console only displays collections with >= 1 document.
The user reported: "sao trong firebase vẫn là 11 collections? bạn lấp liếm data à? thêm reviews trong đấy và dùng data thật ngay lập tức".

## REQUIREMENTS
1. Seed realistic, comprehensive Vietnamese customer reviews directly into root collection `reviews` (and sync into root collection `ratings`):
   - At least 3 to 6 authentic Vietnamese reviews per popular product (iPhone, MacBook, AirPods, iPad, Samsung, Sony, Apple Watch, etc.).
   - Attributes per review:
     - `id`: unique string (e.g., `rev_001`, `rev_002`, ...)
     - `productId`: corresponding product ID (e.g., `apple-iphone-16-pro-max`, `apple-macbook-air-m3-13`, `apple-airpods-pro-2-usbc`, ...)
     - `userId`: valid user UID
     - `userName`: authentic Vietnamese name (e.g., "Nguyễn Thành Long", "Trần Mai Anh", "Hoàng Quốc Bảo", "Phạm Thu Hương", ...)
     - `userAvatar`: realistic avatar URL or initial
     - `rating`: 4 or 5 stars (e.g. 5, 5, 4, 5, 4)
     - `comment`: detailed realistic review comments in Vietnamese praising product quality, packaging, battery, sound, build quality, etc.
     - `images`: array of real product photos / Unsplash tech product image URLs
     - `verifiedPurchase`: true
     - `createdAt`: ISO 8601 string
2. Update each product's `rating` and `reviewCount` in the `products` collection to match the exact mathematical average of these real reviews!
3. Ensure `catalogService.ts` and `ratingService.ts` read and write to both root collection `reviews` and `ratings` so that Firebase Console displays both collections with real data.
4. Run the seed script to populate Firestore immediately.
