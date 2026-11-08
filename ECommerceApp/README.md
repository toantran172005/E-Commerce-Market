# Ứng Dụng E-Commerce Market Place (Nhóm 13)
Ứng dụng thương mại điện tử đa nền tảng (Android, iOS, Web) phát triển bằng React Native, Expo SDK 58 và Google Cloud Firestore / Firebase Authentication.

---

## 1. CÔNG NGHỆ SỬ DỤNG
- **Framework**: React Native 0.88.0, Expo SDK ~58.0.19, Expo Router ~58.0.26
- **Ngôn ngữ**: TypeScript ~6.0.3, React 19.3.0
- **Cơ sở dữ liệu & Xác thực**: Firebase SDK 12.19.0 (Cloud Firestore & Firebase Auth)
- **Quản lý trạng thái**: React Context API (Auth, Cart, Checkout, Orders, Favourites, Notifications, Addresses, PaymentMethods, ProductFilter, Settings)
- **Kiểm thử tự động**: Node.js Test Runner (`node:test`, `node:assert/strict`) với `npx tsx`

---

## 2. HƯỚNG DẪN CÀI ĐẶT & CẤU HÌNH MÔI TRƯỜNG

### 2.1. Cài đặt dependencies
```bash
cd ECommerceApp
npm install
```

### 2.2. Cấu hình biến môi trường
Tạo file `.env` tại thư mục `ECommerceApp/` dựa theo mẫu `.env.example`:
```env
# DeepSeek API Key (nếu sử dụng tính năng AI code generation)
DEEPSEEK_API_KEY=your_deepseek_api_key_here

# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSy...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=e-commerce-market-e2875.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=e-commerce-market-e2875
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=e-commerce-market-e2875.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=794360087185
EXPO_PUBLIC_FIREBASE_APP_ID=1:794360087185:web:ee816e20e5d8d6d1cb3530

# Nguồn dữ liệu: firebase | mock (mặc định là firebase)
EXPO_PUBLIC_DATA_SOURCE=firebase
```

---

## 3. NẠP DỮ LIỆU BAN ĐẦU (SEED DATABASE)

Nạp dữ liệu danh mục, thương hiệu, sản phẩm công nghệ tiếng Việt chuẩn, mã voucher và đơn hàng:
```bash
# Nạp trực tiếp lên Firebase Firestore thật:
node seed.mjs

# Hoặc nạp vào Local Firebase Emulator:
node seed.mjs --emulator
```

---

## 4. CHẠY KIỂM THỬ TỰ ĐỘNG (TEST SUITE)

Hệ thống có 51 test cases bao phủ toàn bộ 21 Use Cases theo tài liệu SRS và Testing docx:

```bash
# Chạy Unit Tests độc lập:
npm run test:unit

# Chạy Integration Tests với Firebase:
npm run test:integration

# Chạy toàn bộ 51 tests:
npm run test:all
```

---

## 5. CHẠY VÀ XUẤT ỨNG DỤNG (EXPORT & RUN)

### 5.1. Khởi chạy môi trường phát triển (Development)
```bash
npm start           # Expo Metro Bundler
npm run web         # Mở trực tiếp trên trình duyệt Web
npm run android     # Mở trên máy ảo / thiết bị Android
```

### 5.2. Xuất gói tĩnh (Static Export)
```bash
# Xuất bản Web tĩnh:
npx expo export --platform web

# Xuất bundle Android:
npx expo export --platform android
```

---

## 6. HƯỚNG DẪN DEPLOY FIREBASE SECURITY RULES & INDEXES

Khi có quyền truy cập Firebase CLI:
```bash
# Đăng nhập Firebase
npx firebase login

# Deploy Security Rules và Composite Indexes
npx firebase deploy --only firestore:rules,firestore:indexes
```

---

## 7. CẤU TRÚC THƯ MỤC
```
ECommerceApp/
├── app/                  # File-based routing (expo-router)
│   ├── (auth)/           # Đăng nhập, đăng ký
│   ├── (tabs)/           # Trang chủ, Yêu thích, Tài khoản
│   ├── product/[id].tsx  # Chi tiết sản phẩm & biến thể
│   ├── order/[id].tsx    # Chi tiết tiến trình đơn hàng & huỷ đơn
│   ├── cart.tsx          # Giỏ hàng & voucher
│   ├── checkout.tsx      # Thanh toán & đặt hàng
│   ├── filter.tsx        # Bộ lọc đa tiêu chí nâng cao
│   └── ...
├── src/
│   ├── firebaseConfig.ts # Cấu hình kết nối Firebase
│   ├── services/         # Tầng giao tiếp Firebase (Auth, Catalog, Order, Voucher, Profile, Notif, Search, Support)
│   ├── context/          # 10 React Contexts quản trị trạng thái ứng dụng
│   ├── hooks/            # useAsync, useDebounce, useProductSearch
│   ├── utils/            # pricing, cart, format
│   └── types/            # TypeScript domain interfaces
├── tests/                # Test cases đa tầng (utils, services, integration)
├── firestore.rules       # Quy tắc bảo mật Firestore
├── firestore.indexes.json# Composite indexes cho Firestore
├── seed.mjs              # Script khởi tạo dữ liệu Firestore
└── eas.json              # Cấu hình build EAS (Development, Preview APK, Production)
```
