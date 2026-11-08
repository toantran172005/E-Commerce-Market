Dưới đây là đánh giá chuyên sâu (Staff Mobile Engineer + QA Lead) cho bản DEMO E-Commerce Marketplace hiện tại. Tôi sẽ phân tích theo ba phần chính: **kiến trúc / chuẩn code**, **luồng nghiệp vụ (mindmap chất lượng)**, và **danh mục bug + mức độ nghiêm trọng**. Cuối cùng là **kế hoạch xử lý ưu tiên** và **trả lời file-by-file** chính xác, không rút gọn.

---

## 1. Tổng quan và kiến trúc

Đây là một project demo hợp lệ, dùng **expo-router ~58 / React Native 0.88 / React 19 / TypeScript strict**, nhưng đang có nhiều chỗ **mâu thuẫn về thư viện theme**, **mock data phi tập trung**, **thiếu state management xuyên màn hình** (giỏ hàng chỉ là local state trong từng màn hình), và nhiều **luồng routing chưa nhất quán**. Ứng dụng dừng ở mức **UI demo khá đầy đủ** nhưng chưa đủ "production-like" cho một ứng dụng marketplace.

Một điểm cần nói rõ: `firebase` có trong `package.json` nhưng **không được import trong UI** như yêu cầu. Điều đó là tốt. Nhưng việc có cả firebase như một dependency có thể tạo hiểu lầm rằng app sẽ dùng nó; hiện tại không dùng là đúng.

### 1.1. Theme

File theme dùng `colors`, `Colors`, `COLORS` đều export `colors`, nhưng các màn hình import lẫn lộn:

- `colors` → dùng trong đa số màn hình, đúng.
- `Colors` → `cart.tsx` và `checkout.tsx` dùng `Colors?.primary`, gây rủi ro nếu `Colors` là object chắc chắn tồn tại; `Colors?.` không cần optional. Vì `Colors` là const object nên `Colors?.primary` không sai TypeScript nhưng là thừa.
- `COLORS` → `order/[id].tsx` dùng `COLORS.primary`.

Cả ba đều đồng bộ dữ liệu nên **không có lỗi theme tức thời**, nhưng đây là **technical debt**: nên chuẩn hóa thành một cách import duy nhất để tránh sai lệch khi theme thay đổi.

### 1.2. State management xuyên màn hình

Không có Context/Store. Dữ liệu:

- Home: local `favorites`, `products` tĩnh.
- Favourite: `useState<FavouriteItem[]>(MOCK_FAVOURITES)` riêng, không đồng bộ với Home.
- Cart: `items` riêng, không chịu ảnh hưởng từ Favourite/Home; badge cart ở Home/Favourite ghi cứng `1` hoặc `cartCount` local.
- Account: stats ghi cứng `1` đơn, `3` yêu thích, subtitles cố định.
- Orders: `INITIAL_ORDERS` riêng; đặt hàng checkout không thêm đơn vào orders; checkout-success luôn `ORD-21530`.
- Product detail: local `liked`, không tác động đến favourite tab.

**Hệ quả bug thực tế:** Người dùng yêu thích sản phẩm trong Home → mở tab Yêu thích → không thấy sản phẩm vừa thêm. Thêm vào giỏ từ Favourite → mở Cart → không thấy món mới. Badge giỏ hiển thị `1` bất kể đã xóa hết hàng trong giỏ. Do đó **luồng demo marketplace không khép kín dữ liệu**.

### 1.3. MOCK data phi tập trung

USER mock nằm rải rác: Account (Trần Minh Alex), Checkout (Trần Minh Alex, 248 Nguyễn Văn Cừ, +84...), Shipping Address (248 Nguyễn Văn Cừ...), Order detail (Alex Morgan, London), Update User (123 Nguyễn Huệ), Checkout-success (Gordon?, tên Alex Carter trong payment method). **Mỗi màn hình một "vũ trụ" khác nhau.** Với demo thì chấp nhận được nhưng với QA thì đây là **blocker cho test end-to-end** nếu muốn kiểm tra nhất quán dữ liệu.

### 1.4. Kiến trúc thư viện

- Đã hạn chế đúng thư viện: không Firebase, không NativeWind, không reanimated.
- `app/_layout.tsx` khai báo đủ routes.
- `(tabs)` có `home`, `favourite`, `account` đúng.
- `(auth)` có `login`, `register` đúng.

---

## 2. Mindmap luồng chất lượng

Dưới đây là bản đồ luồng nghiệp vụ chính theo từng màn hình:

### Mindmap người dùng

```text
Khởi động
 ├── App mở "/"
 │   └── Redirect → "(tabs)/home" (index.tsx)
 │
 ├── Auth
 │   ├── Login (alex.carter@novatech.io / 123456)
 │   ├── Register
 │   └── Guest
 │
 └── Tabs
     ├── Home
     │   ├── Search box (không hoạt động)
     │   ├── Filter (mở bottom sheet)
     │   ├── Categories (4)
     │   ├── Products (grid/list)
     │   ├── Heart → chỉ local
     │   └── Cart icon → /cart (badge luôn 1)
     │
     ├── Favourite
     │   ├── Danh sách 3 sản phẩm
     │   ├── Tim yêu thích → xóa
     │   ├── Add (+) → chỉ local cartCount
     │   └── Empty state → nút khám phá
     │
     └── Account
         ├── Profile (Trần Minh Alex)
         ├── Edit profile → /update-user
         ├── Stats (orders, wishlist)
         ├── My Orders → /orders
         ├── My Cart → /cart
         ├── Favourites → tab Favourite
         ├── Shipping address → /shipping-address
         ├── Payment methods → /payment-method
         ├── Notifications → /notification
         ├── App settings → /app-settings
         ├── Help → /help
         └── Logout → /(auth)/login
```

### Luồng mua hàng hiện tại

```text
Home/Favourite → Product Detail → Add to Cart (Alert only) → Cart → Checkout → Checkout Success → View Order Details → Order/ORD-21530
```

Nhưng thông tin đơn hàng ở `checkout-success` không khớp với `order/ORD-21530` (một bên tổng `$249`, một bên danh mục Nike + balo). Trong `orders`, `ORD-21530` là đang xử lý và xem chi tiết `order/ORD-21530` hiển thị mock `Nike`+`balo`, tổng cũng khác. Đây là **bug dữ liệu mẫu**.

---

## 3. Kiểm tra từng màn hình (theo QA)

Tôi không rút gọn; với mỗi file sẽ nêu rõ lỗi hoặc vấn đề.

### `app/(auth)/login.tsx`

**Chất lượng code:** Khá sạch, có validation, loading, UI đẹp.

**Vấn đề QA:**

1. **Nghiêm trọng (bug nhỏ):** `router.replace('/(tabs)/home')` mà không xử lý auth state. Guest cũng `router.replace('/(tabs)/home')`. Vì demo mock nên không có logout state; chấp nhận.
2. **Trung bình:** `email`/`password` state mặc định đã điền sẵn `alex.carter@novatech.io`/`123456`, dễ gây hiểu lầm QA. Nhưng demo nên có.
3. **Trung bình:** Nút "Đăng ký ngay" dùng `router.push('/(auth)/register')` nhưng register có nút back → OK.
4. **UI:** Trong login, `SafeAreaView style={styles.safeArea}` nhưng `edges={['top', 'bottom']}`; nếu màn hình nhỏ, footer bất đối xứng nhưng không gây lỗi.

### `app/(auth)/register.tsx`

**Vấn đề:**

1. **Nghiêm trọng (bug users flow):** `Alert.alert` không có `style` mặc định khi `loading`? Không sao.
2. **Trung bình:** Số điện thoại validate `phoneDigits.length < 9` là quá ngắn, nhưng ổn.
3. **Trung bình:** Nút "Đăng ký tài khoản" không checkbox để validate ngay.
4. **Trung bình:** Không có màn hình "quên mật khẩu" — không cần.

### `app/(auth)/_layout.tsx`

Sạch, ổn.

---

### `app/(tabs)/home.tsx`

**Bug thực tế:**

1. **Nghiêm trọng:** Search input không có `value` và `onChangeText` → không lọc sản phẩm, chỉ là input chết. Trang chủ có 5 sản phẩm nhưng "Section meta 5 sản phẩm" luôn cố định, không cập nhật theo filter.

2. **Nghiêm trọng:** `TouchableOpacity` heart trong grid `onPress={() => toggleFavorite(item.id)}` nằm bên trong card `TouchableOpacity` `onPress={() => goToProduct(item.id)}`. **Bubbling có thể gây mở product khi nhấn tim** (vì RN Touchable lồng nhau, child bắt sự kiện nhưng không ngăn chặn hoàn toàn). Cần dùng `Pressable` riêng hoặc `event.stopPropagation()`; trong RN cần lưu ý. Điều này giống fav nhưng cũng có thể click product.

3. **Trình độ QA trung bình:** `setActiveCategory(cat.name)` dùng `cat.name` tiếng Việt (`'Âm thanh'`), nhưng `FILTER_CHIPS` chứa `'Audio'` không khớp `'Âm thanh'` nên:
   - Chọn category `'Âm thanh'` → activeCategory = `'Âm thanh'` → filter theo `p.category === 'Âm thanh'` nhưng `PRODUCTS` có `category: 'Audio'` → **không có sản phẩm nào hiển thị**.
   - Chip `'Audio'` khi chọn sẽ hiển thị đúng 1 sản phẩm vì dữ liệu `category: 'Audio'`.
   - Tương tự: `'Phones'` đúng, `'Laptops'` đúng, `'Accessories'` đúng.
   - Vì vậy category icon `'Âm thanh'` là bug rất lớn: nhấn vào "Âm thanh" sẽ cho `filteredProducts = []` (không có sản phẩm audio hiển thị). **Chất lượng kém.**

4. **Trung bình:** `onPress={() => setActiveCategory(cat.name)}` nhưng `activeCategory` khởi tạo `'Tất cả'` → không active category nào, OK.

5. **Trung bình:** `flatList` nếu muốn "view toggle grid/list" đều hiển thị giống nhau; lẽ ra list không đổi nhiều.

6. **Trung bình:** Badge cart `1` cố định, không đồng bộ với cart; badge notification cũng chấm đỏ bất chấp.

7. **Trung bình:** `bellButton` không có `onPress` → silent dead zone.

### `app/(tabs)/favourite.tsx`

**Bug tương tự:**

1. **Nghiêm trọng:** `addToCart` chỉ tăng `cartCount` local; không thêm vào cart thực; badge cart chỉ tăng trong màn này.
2. **Trung bình:** `CARD_WIDTH` tính `(SCREEN_WIDTH - HORIZONTAL_PADDING*2 - GRID_GAP) / 2`; khi số item lẻ, cách này có thể gây layout bị lệch nhưng đã có `maxWidth`; ổn.
3. **Trung bình:** `renderStars` luôn hiển thị 5 sao đầy nên `rating` thấp vẫn hiển thị 5, giảm tính thực tế; chấp nhận mock.
4. **Trung bình:** `Pressable` heart trong card cũng bị nested press nhưng RN sẽ bắt child trước, có thể mở product nếu sử dụng `Pressable` nested? Thử nghiệm RN: child `Pressable` thắng, nhưng đôi khi color change; nên dùng `stopPropagation`.

### `app/(tabs)/account.tsx`

1. **Nghiêm trọng:** Mũi tên điều hướng `/shipping-address`, `/payment-method`, `/notification` không khớp tên file: `Account.tsx` dùng `router.push('/shipping-address')` nhưng file là `shipping-address.tsx` (đúng với route convention). Tuy nhiên route thay thế `/payment-method` được; còn `orders` dùng `'/orders'`. Cần rà soát.
2. **Trung bình:** `STATS` set `'1'`, `'3'` cố định. Khi favorite thay đổi hoặc đơn hàng bị hủy, số không cập nhật.
3. **Trung bình:** `MenuRow` dùng `styles.rowDivider` cho tất cả trừ item cuối; với `overflow: hidden` trong card là đúng.
4. **Trung bình:** `logout` thực hiện `router.replace('/(auth)/login')` nhưng do stack root có tab group vẫn giữ? Nếu `replace` sẽ thay (auth/login) ở root, tab bị xóa khỏi stack? Router `replace` trên root nên OK.
5. **Trung bình:** "Thành viên PRO" UI đẹp.

### `app/(tabs)/_layout.tsx`

Sạch, 3 tab chính. Tuy nhiên không có `Tab.Screen` cho `/favourite`? Có. OK.

---

### `app/_layout.tsx`

1. **Nghiêm trọng:** Thiếu `Stack.Screen name="product/[id]"`? Có rồi.
2. **Nghiêm trọng:** Khai báo tất cả màn hình trừ `(tabs)`, `(auth)` là đúng. Riêng `presentation: 'transparentModal'` cho `filter` có thể gây màn hình chạy không được nếu không cấu hình `animation: 'slide_from_bottom'`; đã có.
3. **Trung bình:** Có thể thêm `initialRouteName` hoặc để index redirect.
4. **Không có lỗi.**

---

### `app/cart.tsx`

1. **Nghiêm trọng (bug logic):** `colors` import `Colors` với optional chaining, nhưng theme file export `Colors` không phải default; code viết `Colors?.primary ?? '#FF5722'` sẽ chạy OK. Nhưng khuyến nghị chuyển thành `colors.primary`.

2. **Nghiêm trọng:** `subtotal` chỉ sum các item được chọn; nếu unselect hết, `total` vẫn tính `subtotal` = 0 + SHIPPING_FEE = $5, **khi checkout sẽ bị gửi $5 dù không có hàng**. Đây là bug kinh điển. Cần disable checkout khi `subtotal === 0` hoặc bất kể `items.length` > 0.

3. **Trung bình:** `handleApplyPromo` chỉ set `appliedPromo` chứ không thực sự thay đổi `total`/`subtotal`. Các code NOVA10, FLASH20, WELCOME15 không giảm giá nhìn có vẻ lừa người dùng. Đây là lỗi logic.

4. **Trung bình:** `router.push("/checkout")` sử dụng dấu `"` thay vì `'`, nhưng cú pháp vẫn đúng. Trong `expo-router` vẫn valid.

5. **Trung bình:** Sau khi xóa item, `checkout` vẫn đi `/checkout` nếu `items.length > 0`, nhưng không có item nào được chọn? Cần thêm disabled nếu `items.length === 0` nhưng cũng cần nếu `selected` 0. Hiện code disable khi `items.length === 0`, không xét `selected`. Thêm bug nếu bỏ chọn hết.

### `app/checkout.tsx`

1. **Nghiêm trọng (lỗi tiền tệ):** `TAX = 19.92` nhưng `SUBTOTAL = 249.0` → 8% tax đúng bằng 19.92. Tuy nhiên nếu đơn hàng từ cart thực tế khác (vì cart không đồng bộ) thì vẫn tính cố định 249.
2. **Nghiêm trọng:** Nếu `shipping === 'express'` thì `shippingFee = 12` → `total = 280.92`; ở bottom bar value không cập nhật? Có vì dùng biến `total` được tạo mỗi render, nên OK.
3. **Trung bình:** `router.push('/checkout-success')` luôn dẫn tới success, không tạo đơn hàng mới; `checkout-success` luôn `ORD-21530` (lệch so với mock `orders`).
4. **Trung bình:** `Colors` import kiểu `import { Colors } from '../src/constants/theme';` nhưng `Colors` object luôn tồn tại; dùng `Colors.primary` nhưng không có `?.` nên an toàn.

### `app/checkout-success.tsx`

1. **Nghiêm trọng:** `SUMMARY_ROWS` static thông tin, `ORDER_ID = 'ORD-21530'`, total = $249.00, nhưng danh sách sản phẩm ở `order/ [id]` lại là Nike + balo và total khác. Khi bấm "View Order Details" sẽ gây hiểu lầm.
2. **Trung bình:** Component `ConfettiDot` style dùng `left/right` số âm hoặc ngoài; không ảnh hưởng lắm.
3. **Trung bình:** `Text` title tiếng Anh, nhưng yêu cầu UI tiếng Việt hiển thị tiền bằng $, nhưng nhiều màn tiếng Việt pha tiếng Anh vẫn ổn.

### `app/orders.tsx`

1. **Nghiêm trọng (bug thực tế):** `INITIAL_ORDERS` chứa 3 đơn; tương tác hủy đơn từ `handleCancelOrder` chỉ đổi status, không được cập nhật sang `order/[id]` hay account. Nhưng vì local state nên chấp nhận.
2. **Trung bình:** `handleReorder` chỉ Alert, không thực sự thêm vào cart → trải nghiệm người dùng kém.
3. **Trung bình:** `delete` màn orders cũng không thay đổi danh sách khác.
4. **Trung bình:** Các label tabs sử dụng tiếng Anh: All, Processing, Delivered, Cancelled; không sao.

### `app/order/[id].tsx`

1. **Nghiêm trọng (sai path name):** `useLocalSearchParams<{ id?: string }>()`; `{ id: string }` đúng.
2. **Nghiêm trọng:** Dữ liệu `ITEMS` là giày Nike + balo, không liên quan gì đến đơn hàng thực từ checkout (AuraBeats). Do đó nếu người dùng vừa checkout AuraBeats rồi xem chi tiết đơn thì thấy giày/balo, không hợp lý.
3. **Trung bình:** Trong "Timeline", connector trước step cuối không có style? Có, ok.
4. **Trung bình:** Nhấn "Invoice" không có action; nhấn "Change" không có gì.

### `app/product/[id].tsx`

1. **Nghiêm trọng (bug UI/UX):** Sản phẩm dùng id "1" đổ dữ liệu; nếu id từ `favourite` là "1"/"2"/"3" nhưng chỉ "1" có sản phẩm; "2" và "3" sẽ fallback về "1" → khi user click sản phẩm thứ 2 (Nova Watch) sẽ mở ra AuraBeats Pro. **Sai lệch sản phẩm**.
2. **Trung bình:** `product.images.map` nhưng data chỉ mock sản phẩm `id=1`; những id khác không có.
3. **Trung bình:** "Add to Cart" chỉ Alert; không thật sự thêm vào cart.
4. **Trung bình:** `liked` local, không link favourite.
5. **Nghiêm trọng:** RN nested Pressable với `horizontal ScrollView` carousel; activeImage update có OK.

### `app/notification.tsx`

1. **Trung bình:** Tab `account` không có tab button nhưng màn lọc tabs chỉ có All/Orders/Promotions; category `account` chỉ xuất hiện ở All; không sai.
2. **Trung bình:** `unreadCount` ban đầu 3; nếu press 1 item sẽ đánh dấu read; OK.
3. **Trung bình:** Footer button `Done` chỉ back; nếu `router.canGoBack()` false, không làm gì. Ổn.

### `app/shipping-address.tsx`

1. **Trung bình:** Cuối màn dùng `Pressable` style function, đúng.
2. **Nghiêm trọng:** Khi xoá địa chỉ mặc định, nếu `item.isDefault` và `remaining.length > 0`, gán `remaining[0]` default; nhưng nếu `remaining[0]` bất biến object, gán trực tiếp `remaining[0] = { ...remaining[0], isDefault: true }` có thể gây lỗi TypeScript vì `remaining[0]` không cho phép gán thuộc tính object readonly? Thường OK với array item type `AddressItem` vì object mutable. Không có lỗi.
3. **Trung bình:** `setSelectedId(remaining[0]?.id ?? "")`; nếu rỗng thì empty.

### `app/payment-method.tsx`

1. **Trung bình:** `PAYMENT_OPTIONS` card "Credit / Debit Card", "Apple Pay", "COD" không đồng bộ checkout method; demo chấp nhận.
2. **Trung bình:** Không có thêm form card mới.
3. **Trung bình:** Xoá nút `deleteButton` không có Alert xác nhận; nhấn sẽ không làm gì; cần xử lý.

### `app/update-user.tsx`

1. **Trung bình:** `INITIAL_PROFILE` có `address: '123 Nguyễn Huệ...'` khác với Account/Checkout (248 Nguyễn Văn Cừ) → inconsistency.
2. **Trung bình:** `handleChangeAvatar` gọi API thư viện? Không, demo mock. OK.
3. **Trung bình:** `hasChanges` chỉ so sánh profile vs initial; việc đổi avatar giữ uri giả nhưng OK.

### `app/filter.tsx`

1. **Nghiêm trọng:** `useMemo` tính `resultCount` dựa trên `selectedBrands` và `selectedRating` nhưng callback dependencie lại thiếu `selectedBrands`, `selectedRating`? Code hiện tại:

```ts
const resultCount = useMemo(() => {
  let count = 5;
  if (selectedCategories.length > 0) count = selectedCategories.length * 2;
  if (minPrice || maxPrice) count = Math.max(1, count - 1);
  return count;
}, [selectedCategories, selectedBrands, selectedRating, minPrice, maxPrice]);
```

Dependencies đầy đủ (có `selectedBrands`, `selectedRating` dù không dùng trong callback? Thực ra callback không dùng selectedBrands và selectedRating nên việc thêm vào deps chỉ để tránh lint; không gây bug nhưng gây warning. Không nghiêm trọng.

2. **Trung bình:** UI hiển thị sheet dạng custom overlay không dùng `Modal` route; `SafeAreaView` có `edges={['bottom']}`; nếu Android cần status bar? Chấp nhận.
3. **Trung bình:** `handleApply` Alert ra thông tin lọc nhưng khi back về home không có state lọc được truyền về; nên chọn xong Home vẫn hiển thị toàn bộ sản phẩm. **Bug chức năng filter thực tế.**
4. **Trung bình:** `dimTouchable` và `sheetContainer` dùng `View` backdrop; router back.

### `app/help.tsx`

1. **Trung bình:** `LayoutAnimation` OK; tìm kiếm câu hỏi; hầu như không có lỗi lớn.
2. **Trung bình:** Gọi `Linking.openURL('tel:19006868')`; nếu không hoạt động vẫn có fallback Alert.
3. **Trung bình:** `Alert` hạn chế mock. Fine.

---

## 4. Danh mục bug tổng hợp (dành cho QA Lead)

Tôi phân loại theo mức **Blocker**, **Major**, **Minor**, **Cosmetic**:

### Blocker (chặn luồng chính)

| ID | Màn hình | Mô tả | Gợi ý |
|----|----------|-------|-------|
| B-01 | Home | CATEGORIES dùng tiếng Việt "Âm thanh" nhưng category dữ liệu sản phẩm "Audio" → chọn "Âm thanh" không hiển thị sản phẩm, thậm chí empty. | Đồng bộ key category: dùng id thuần (audio, phones, laptops, accessories) hoặc dùng `const CATEGORY_KEY = { 'Âm thanh': 'Audio' }`. |
| B-02 | Checkout-success + order/[id] + orders | Dữ liệu đơn hàng không nhất quán: checkout AuraBeats → checkout-success $249, order/ORD-21530 danh sách Nike+balo; `orders` cũng lệch. | Tạo mock order thống nhất, hoặc 1 nguồn dữ liệu duy nhất. |
| B-03 | Home + Favourite | Thiếu state management: không đồng bộ yêu thích, giỏ hàng, badge. | Sử dụng Context (CartContext, FavoriteContext) hoặc store demo. |
| B-04 | Cart | Checkout vẫn nhấn được khi không có item được chọn; nếu bỏ chọn hết `subtotal` = 0 nhưng total có phí ship $5; nút checkout chỉ disable khi `items.length === 0`. | Disable khi `selectedItems.length === 0`. |
| B-05 | Filter | Sau khi áp dụng filter ở `filter.tsx`, Home không áp dụng kết quả (state không được truyền/nhận). | Dùng route params hoặc global filter state để Home thay đổi danh sách. |
| B-06 | Product detail | Sản phẩm id "2"/"3" không có trong PRODUCTS nên fallback vào sản phẩm "1", gây xem sai sản phẩm. | Thêm PRODUCTS cho mọi id hoặc hiển thị thông báo không tìm thấy. |

### Major (chức năng chính bị lỗi rõ rệt)

| ID | Màn hình | Mô tả |
|----|----------|-------|
| M-01 | Home | Search input không có onPress/onChange → không tìm kiếm. |
| M-02 | Home | Badge cart hiển thị cố định "1"; không cập nhật theo giỏ hàng. Xóa hết giỏ vẫn "1". |
| M-03 | Favourite | Nút + không thêm vào cart thực sự; badge local chỉ tăng local. |
| M-04 | Cart | Mã giảm giá (NOVA10, FLASH20, WELCOME15) không được áp dụng vào tổng. |
| M-05 | Orders | "Cancel Order" chỉ đổi status ở `orders.dart` state, khi tắt mở lại vẫn như cũ; không persistence. |
| M-06 | Order detail | Nút "Cancel Order" và "Track Order" không có hành động. |
| M-07 | Account | "Đơn hàng của tôi / Giỏ hàng / Yêu thích" số liệu không đồng bộ. |
| M-08 | Favourite Home | Đồng bộ danh sách yêu thích không thống nhất giữa các màn hình. |
| M-09 | Payment methods | Các nút xóa thẻ/hỗ trợ không hoạt động; "Add new card" không mở form. |
| M-10 | Auth / Login | Không có màn hình "quên mật khẩu" nhưng không sao; login xử lý mock. |

### Minor (ảnh hưởng UX nhỏ)

| ID | Màn hình | Mô tả |
|----|----------|-------|
| m-01 | Home | Nút "bell" không có `onPress`, người dùng nhấn không có phản hồi. |
| m-02 | Home | Chips "Tất cả, Audio, Phones, Laptops, Accessories" dùng tên category khác so với danh mục icon (Âm thanh, Điện thoại...). |
| m-03 | Home | Khi chuyển grid/list, hình ảnh vẫn hiển thị kiểu cũ, không đổi rõ rệt. |
| m-04 | Cart | `router.push("/checkout");` đặt dấu `"` thay vì nháy đơn, nhưng chạy tốt. |
| m-05 | Checkout-success | Nút "View Order Details" cố định link `ORD-21530` dù order thay đổi. |
| m-06 | Favourite | Star rating luôn 5 sao đầy; `rating` 4.5 vẫn hiển thị 5 sao. |
| m-07 | Account | Profile email hiển thị khác với register/login; inconsistency dữ liệu. |
| m-08 | Update-user | Địa chỉ user ban đầu khác với checkout/shipping; không đồng bộ. |
| m-09 | App settings | Thao tác đổi password yêu cầu ít nhất 8 ký tự, trong khi login chỉ yêu cầu 6; sự khác biệt gây khó. |

### Cosmetic (giao diện/nhỏ nhặt)

- `logoBadge` shadow primary đẹp.
- `styles` gõ thiếu chỗ `Colors?.primary` thay vì `colors.primary`; nên thống nhất.
- `cart.tsx` import `Colors` không dùng default, cần dọn.
- `Home` có `banner` style không có component render; styles dư thùa.
- Một số chữ tiếng Anh trong các màn khác, dù app yêu cầu tiếng Việt; đây là demo nên chấp nhận, nhưng cần lưu ý khi QA tiếng Việt.

---

## 5. Đánh giá code quality theo từng màn

Điểm số tổng quan:

- Tính nhất quán import theme: 7/10.
- Cấu trúc navigation: 8/10.
- Kiểm soát state: 4/10.
- UX luồng chính: 5/10.
- Khả năng mở rộng: 5/10.
- Tài liệu hóa: không có.

---

## 6. Kế hoạch hành động ưu tiên

1. **Tạo `src/context/CartContext.tsx`, `src/context/FavoriteContext.tsx` (demo)**, bọc root layout, đồng bộ:
   - Badge cart, item cart.
   - Favourite từ Home / Product / Favourite.
   - Account stats.
2. **Chuẩn hóa mock data**: Tạo `src/mock/products.ts`, `src/mock/orders.ts`, `src/mock/user.ts`; dùng chung một `user` và danh sách sản phẩm.
3. **Sửa Category mapping**: Key category bằng id tiếng Anh hoặc map chính xác; không dùng tên tiếng Việt làm key.
4. **Sửa cart logic**: disable checkout khi `selectedCount === 0`; áp dụng mã giảm giá thực sự; đồng bộ badge.
5. **Truyền filter**: dùng `useGlobalFilterState` hoặc `router.push({ pathname: '/filter', params })`; khi back gửi kết quả qua `router.back()` với `setParams`.
6. **Sửa đơn hàng**: dùng 1 nguồn order duy nhất, cho phép tạo order từ checkout.
7. **Xử lý Search**: kết nối `search` state vào danh sách `PRODUCTS`.

---

## 7. Nếu bạn cần tôi sửa trực tiếp code

Tôi có thể cung cấp **toàn bộ source đã sửa** theo yêu cầu. Vì bạn đã đính kèm mọi file, hãy cho biết bạn muốn:

- **Chỉ sửa các blocker + major bug** (nhanh, đủ demo).
- **Sửa toàn diện** (thêm context, tái cấu trúc mock data).
- **Thêm tính năng thiếu** (search, add-to-cart thật, filter thật).

Tôi sẽ trả lời chính xác, đầy đủ, không rút gọn, không TODO, không "...". Bạn muốn bắt đầu từ phần nào?