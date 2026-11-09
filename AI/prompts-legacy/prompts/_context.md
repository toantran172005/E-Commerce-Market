# PROJECT CONTEXT (áp dụng cho mọi màn hình)

## Stack (chỉ dùng những gì dưới đây, KHÔNG import thư viện khác)
- expo ~58, expo-router ~58 (file-based routing), react 19, react-native 0.88, TypeScript strict
- react-native-safe-area-context (SafeAreaView / useSafeAreaInsets)
- @expo/vector-icons (Ionicons) cho toàn bộ icon
- firebase (KHÔNG gọi trực tiếp trong UI; dùng mock data cục bộ)
- Dùng `Image` của react-native, `StyleSheet.create`, `FlatList`/`ScrollView`, `Pressable`
- Không dùng NativeWind, styled-components, reanimated, hay thư viện UI bên thứ ba

## Cấu trúc thư mục
```
ECommerceApp/
  app/
    _layout.tsx            Stack: (tabs), (auth), product/[id], checkout
    (auth)/login.tsx, register.tsx
    (tabs)/_layout.tsx, home.tsx, favourite.tsx, account.tsx
    product/[id].tsx
    checkout.tsx
  src/
    components/  constants/  context/  hooks/  services/  types/index.ts
```
Import theme: `import { colors, radius, spacing } from '../../src/constants/theme';` (đường dẫn tương đối tuỳ vị trí file).

## Types có sẵn (src/types/index.ts) - dùng đúng, không tự định nghĩa lại
```ts
interface Product { id: string; name: string; price: number; originalPrice?: number; description: string; imageUrl: string; category: string; rating?: number; stock?: number; }
interface CartItem { product: Product; quantity: number; }
interface UserProfile { uid: string; email: string; displayName?: string; phoneNumber?: string; address?: string; }
interface OrderItem { productId: string; name: string; price: number; quantity: number; imageUrl: string; }
interface Order { id: string; userId: string; customerName: string; phoneNumber: string; shippingAddress: string; items: OrderItem[]; totalAmount: number; status: 'pending'|'processing'|'shipped'|'delivered'|'cancelled'; currentStep?: number; canCancel?: boolean; cancelReason?: string; cancelledAt?: string|number; createdAt: number|string; }
```

## Design tokens (trích từ Final Screens)
- primary (cam): #FF5722 | primaryDark (banner gradient cuối): #D9400F | primarySoft (nền badge nhạt): #FFEDE6
- dark (nút/chip active/giá): #1A1A1A | background: #F8F9FB | card: #FFFFFF | border: #ECEEF1
- textPrimary #1A1A1A | textSecondary #6B7280 | textMuted #9CA3AF | success #16A34A | danger #EF4444
- radius: sm 8, md 12, lg 16, xl 24, pill 999
- Font: system sans, tiêu đề weight '800', phụ '600', body '400'
- Card: nền trắng, borderWidth 1 borderColor #ECEEF1, radius 16, KHÔNG shadow nặng
- Nút chính: cam, chữ trắng bold, radius 16, cao 52 | Nút phụ: viền cam, chữ cam, nền trắng
- Chữ tiền tệ: `$` + số (vd `$249`), giá gốc gạch ngang màu xám
- Tab bar: nền trắng, 3 tab Home / Favourite / Account, active màu cam, inactive xám #9CA3AF

## Quy tắc đầu ra (BẮT BUỘC)
1. Trả về DUY NHẤT MỘT code block ```tsx chứa toàn bộ file, không giải thích bên ngoài.
2. Code đầy đủ, chạy ngay, không `...`, không TODO, không rút gọn.
3. `export default function XxxScreen()`; type đầy đủ, không dùng `any`.
4. Ảnh sản phẩm dùng URL https từ Unsplash/picsum trong mock data.
5. Tên icon phải là tên Ionicons hợp lệ (vd: headset-outline, phone-portrait-outline, laptop-outline, watch-outline, bag-handle-outline, notifications-outline, options-outline, search-outline, heart, heart-outline, list-outline, grid-outline, chevron-forward, arrow-back, share-social-outline, star, checkmark, trash-outline, add, remove, pricetag-outline).
6. Chỉ viết đúng file được yêu cầu; theme giả định đã tồn tại ở `src/constants/theme.ts` với export `colors`, `radius`, `spacing`.
