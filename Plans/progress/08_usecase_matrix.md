# MA TRẬN USE CASE & MAPPING KIẾN TRÚC HỆ THỐNG
**Dự án**: E-Commerce Market Place (Nhóm 13)
**Tài liệu tham chiếu gốc**: `Plans/Words/N13_ApplicationDevelopment_SRS.docx` và `Plans/Words/N13_ApplicationDevelopment_Testing.docx`
**Trạng thái cập nhật**: Toàn bộ 21 Use Cases + 30 Test Cases đã được phân tích và ánh xạ vào code.

---

## 1. BẢNG TỔNG HỢP MA TRẬN USE CASE (SRS UC001 - UC021)

| UC-ID | Tên Use Case | Tác nhân (Actor) | Màn hình (Screen) | Context liên quan | Service & Method | Mã Test Case (Testing.docx) | Trạng thái Code |
|---|---|---|---|---|---|---|---|
| **UC001** | Đăng nhập | Khách vãng lai, Khách hàng | `app/(auth)/login.tsx`, `app/(auth)/register.tsx` | `AuthContext` | `AuthService.login`, `AuthService.loginAsGuest`, `AuthService.register` | `TC_AUTH_01`, `TC_AUTH_02`, `TC_AUTH_03`, `TC_AUTH_04` | Sẵn sàng nâng cấp Firebase Auth |
| **UC002** | Quản lý tài khoản | Khách hàng đã đăng nhập | `app/(tabs)/account.tsx` | `AuthContext`, `AddressesContext`, `PaymentMethodsContext`, `OrdersContext` | `AuthService.getProfile`, `AuthService.logout` | `TC_PROF_01` | Sẵn sàng kết nối Firestore |
| **UC003** | Cập nhật thông tin | Khách hàng đã đăng nhập | `app/update-user.tsx` | `AuthContext` | `AuthService.updateProfile` | `TC_PROF_01` | Sẵn sàng kết nối Firestore |
| **UC004** | Cập nhật địa chỉ | Khách hàng đã đăng nhập | `app/shipping-address.tsx` | `AddressesContext` | `ProfileService.listAddresses`, `ProfileService.addAddress`, `ProfileService.updateAddress`, `ProfileService.deleteAddress`, `ProfileService.setDefaultAddress` | `TC_CHECK_01` | Sẵn sàng kết nối Firestore |
| **UC005** | Lọc sản phẩm | Khách vãng lai, Khách hàng | `app/filter.tsx`, `app/(tabs)/home.tsx` | `ProductFilterContext` | `CatalogService.getProducts`, `CatalogService.getCategories`, `CatalogService.getBrands` | `TC_SEARCH_02`, `TC_SEARCH_03`, `TC_SEARCH_04` | Sẵn sàng kết nối Firestore |
| **UC006** | Lọc theo giá | Khách vãng lai, Khách hàng | `app/filter.tsx` | `ProductFilterContext` | `CatalogService.getProducts` (minPrice, maxPrice) | `TC_SEARCH_02` | Sẵn sàng kết nối Firestore |
| **UC007** | Lọc theo danh mục | Khách vãng lai, Khách hàng | `app/(tabs)/home.tsx`, `app/filter.tsx` | `ProductFilterContext` | `CatalogService.getCategories`, `CatalogService.getProducts` (category, categories) | `TC_HOME_01`, `TC_SEARCH_02` | Sẵn sàng kết nối Firestore |
| **UC008** | Lọc theo thương hiệu | Khách vãng lai, Khách hàng | `app/filter.tsx` | `ProductFilterContext` | `CatalogService.getBrands`, `CatalogService.getProducts` (brands) | `TC_SEARCH_02` | Sẵn sàng kết nối Firestore |
| **UC009** | Lọc theo đánh giá | Khách vãng lai, Khách hàng | `app/filter.tsx` | `ProductFilterContext` | `CatalogService.getProducts` (minRating) | `TC_SEARCH_02` | Sẵn sàng kết nối Firestore |
| **UC010** | Xem chi tiết sản phẩm | Khách vãng lai, Khách hàng | `app/product/[id].tsx` | `CartContext`, `FavouritesContext` | `CatalogService.getProductById`, `CatalogService.getProductReviews` | `TC_PROD_01`, `TC_PROD_02`, `TC_PROD_03` | Sẵn sàng kết nối Firestore |
| **UC011** | Quản lý giỏ hàng | Khách vãng lai, Khách hàng | `app/cart.tsx` | `CartContext` | `CartContext` (sync to Firestore if logged in) | `TC_CART_01`, `TC_CART_02`, `TC_CART_03`, `TC_CART_04` | Sẵn sàng kết nối Firestore |
| **UC012** | Thêm vào giỏ hàng | Khách vãng lai, Khách hàng | `app/product/[id].tsx`, `app/(tabs)/home.tsx` | `CartContext` | `CartContext.addToCart` | `TC_CART_01` | Sẵn sàng kết nối Firestore |
| **UC013** | Cập nhật giỏ hàng | Khách vãng lai, Khách hàng | `app/cart.tsx` | `CartContext` | `CartContext.updateQuantity` | `TC_CART_02` | Sẵn sàng kết nối Firestore |
| **UC014** | Xóa khỏi giỏ hàng | Khách vãng lai, Khách hàng | `app/cart.tsx` | `CartContext` | `CartContext.removeFromCart`, `CartContext.clearCart` | `TC_CART_03` | Sẵn sàng kết nối Firestore |
| **UC015** | Đặt hàng và thanh toán | Khách hàng đã đăng nhập | `app/checkout.tsx` | `CheckoutContext`, `CartContext`, `AddressesContext`, `PaymentMethodsContext` | `OrderService.createOrder` (Transaction atomic, DB price, stock deduction) | `TC_CHECK_01`, `TC_CHECK_02`, `TC_CHECK_03`, `TC_EDGE_02` | Sẵn sàng kết nối Firestore Transaction |
| **UC016** | Áp dụng voucher | Khách vãng lai, Khách hàng | `app/cart.tsx`, `app/checkout.tsx` | `CartContext` | `VoucherService.validateVoucher`, `VoucherService.listVouchers` | `TC_PROMO_01`, `TC_PROMO_02`, `TC_PROMO_03` | Sẵn sàng kết nối Firestore |
| **UC017** | Xác nhận đơn | Khách hàng đã đăng nhập | `app/checkout-success.tsx`, `app/order/[id].tsx` | `CheckoutContext`, `OrdersContext` | `OrderService.getOrder` | `TC_CHECK_03`, `TC_ORDER_02` | Sẵn sàng kết nối Firestore |
| **UC018** | Hủy đơn hàng | Khách hàng đã đăng nhập | `app/order/[id].tsx`, `app/orders.tsx` | `OrdersContext` | `OrderService.cancelOrder` (Transaction refund stock, add timeline, create notif) | `TC_ORDER_01`, `TC_ORDER_02` | Sẵn sàng kết nối Firestore |
| **UC019** | Quản lý yêu thích & Hồ sơ | Khách hàng đã đăng nhập | `app/(tabs)/favourite.tsx`, `app/(tabs)/account.tsx` | `FavouritesContext`, `AuthContext` | `FavouritesContext` (sync to Firestore if logged in) | `TC_FAV_01` | Sẵn sàng kết nối Firestore |
| **UC020** | Thêm sản phẩm yêu thích | Khách hàng đã đăng nhập | `app/(tabs)/home.tsx`, `app/product/[id].tsx` | `FavouritesContext` | `FavouritesContext.toggleFavourite` | `TC_FAV_01` | Sẵn sàng kết nối Firestore |
| **UC021** | Xóa sản phẩm yêu thích | Khách hàng đã đăng nhập | `app/(tabs)/favourite.tsx` | `FavouritesContext` | `FavouritesContext.toggleFavourite` | `TC_FAV_01` | Sẵn sàng kết nối Firestore |

---

## 2. ÁNH XẠ TOÀN DIỆN 30 TEST CASES THEO TESTING.DOCX

| STT | Mã Test Case | Phân hệ | Chức năng kiểm thử | Kết quả mong đợi | Tệp kiểm thử tự động |
|---|---|---|---|---|---|
| 1 | `TC_AUTH_01` | Authentication | Validate form Đăng nhập để trống | Chặn submit, hiển thị lỗi đỏ yêu cầu nhập email và mật khẩu | `tests/services.test.mjs`, `tests/integration/auth.test.mjs` |
| 2 | `TC_AUTH_02` | Authentication | Validate email sai định dạng | Hàm regex phát hiện đúng, hiển thị cảnh báo email không hợp lệ | `tests/utils.test.mjs`, `tests/integration/auth.test.mjs` |
| 3 | `TC_AUTH_03` | Authentication | Đăng nhập thành công | Xác thực hợp lệ, lưu phiên và chuyển sang Home | `tests/services.test.mjs`, `tests/integration/auth.test.mjs` |
| 4 | `TC_AUTH_04` | Authentication | Đăng nhập sai mật khẩu | Báo lỗi mật khẩu không chính xác, giữ nguyên form | `tests/services.test.mjs`, `tests/integration/auth.test.mjs` |
| 5 | `TC_HOME_01` | Catalog / Home | Tải danh mục trang chủ | Hiển thị đủ 6 danh mục kèm icon tương ứng từ Firestore | `tests/services.test.mjs`, `tests/integration/catalog.test.mjs` |
| 6 | `TC_HOME_02` | Catalog / Home | Chuyển đổi Grid / List view | Chuyển đổi giao diện hiển thị 1 cột / 2 cột mượt mà | `tests/integration/catalog.test.mjs` |
| 7 | `TC_HOME_03` | Catalog / Home | Hiển thị Flash Sale & giảm giá | Badge % giảm giá và giá gạch ngang hiển thị chuẩn xác | `tests/utils.test.mjs` |
| 8 | `TC_SEARCH_01`| Search & Filter | Tìm kiếm với Debounce | Tự động kích hoạt truy vấn sau 350ms ngừng gõ | `tests/services.test.mjs`, `tests/integration/catalog.test.mjs` |
| 9 | `TC_SEARCH_02`| Search & Filter | Lọc đa tiêu chí kết hợp | Lọc đồng thời theo danh mục, giá, rating, thương hiệu | `tests/services.test.mjs`, `tests/integration/catalog.test.mjs` |
| 10 | `TC_SEARCH_03`| Search & Filter | Xóa bộ lọc về mặc định | Reset sạch toàn bộ điều kiện lọc, danh sách tải lại đủ | `tests/services.test.mjs`, `tests/integration/catalog.test.mjs` |
| 11 | `TC_SEARCH_04`| Search & Filter | Tìm từ khóa không tồn tại | Trả về danh sách rỗng, kích hoạt Empty State | `tests/services.test.mjs`, `tests/integration/catalog.test.mjs` |
| 12 | `TC_PROD_01` | Product Details | Mở chi tiết sản phẩm | Hiển thị ảnh lớn, thông số mặt hàng, giá, đánh giá | `tests/services.test.mjs`, `tests/integration/catalog.test.mjs` |
| 13 | `TC_PROD_02` | Product Details | Chọn màu sắc & cấu hình biến thể | Lưu thuộc tính biến thể, highlight đúng nút chọn | `tests/utils.test.mjs` |
| 14 | `TC_PROD_03` | Product Details | Tăng giảm số lượng mua | Tăng/giảm số lượng, chặn giảm dưới 1 | `tests/utils.test.mjs` |
| 15 | `TC_CART_01` | Shopping Cart | Thêm sản phẩm vào giỏ hàng | Badge tăng +1, lưu CartContext, hiển thị toast | `tests/utils.test.mjs`, `tests/integration/order.test.mjs` |
| 16 | `TC_CART_02` | Shopping Cart | Cập nhật số lượng giỏ hàng | Tính toán lại tổng tiền giỏ hàng theo thời gian thực | `tests/utils.test.mjs` |
| 17 | `TC_CART_03` | Shopping Cart | Xóa sản phẩm khỏi giỏ hàng | Loại bỏ món hàng, tính lại tiền giỏ hàng chuẩn | `tests/utils.test.mjs` |
| 18 | `TC_CART_04` | Shopping Cart | Giữ trạng thái giỏ hàng (Persist) | Giỏ hàng không bị mất sau khi reload hoặc đăng nhập lại | `tests/integration/order.test.mjs` |
| 19 | `TC_PROMO_01`| Vouchers | Áp dụng Voucher hợp lệ | Khấu trừ đúng % hoặc số tiền cố định vào tổng bill | `tests/utils.test.mjs`, `tests/services.test.mjs` |
| 20 | `TC_PROMO_02`| Vouchers | Nhập Voucher không tồn tại | Báo lỗi mã không hợp lệ, không thay đổi tổng tiền | `tests/services.test.mjs`, `tests/integration/voucher.test.mjs` |
| 21 | `TC_PROMO_03`| Vouchers | Voucher chưa đủ điều kiện tối thiểu | Cảnh báo đơn chưa đạt giá trị tối thiểu (minOrder) | `tests/services.test.mjs`, `tests/integration/voucher.test.mjs` |
| 22 | `TC_CHECK_01`| Checkout | Chọn và đổi địa chỉ nhận hàng | Màn hình Checkout cập nhật địa chỉ đã chọn chính xác | `tests/integration/profile.test.mjs` |
| 23 | `TC_CHECK_02`| Checkout | Chọn phương thức thanh toán | Ghi nhận phương thức thanh toán (COD, Credit Card...) | `tests/integration/profile.test.mjs` |
| 24 | `TC_CHECK_03`| Checkout | Xác nhận đặt hàng thành công | Tạo đơn Firestore bằng Transaction, trừ tồn kho, reset giỏ | `tests/services.test.mjs`, `tests/integration/order.test.mjs` |
| 25 | `TC_ORDER_01`| Orders History | Xem danh sách lịch sử đơn hàng | Hiển thị đúng đơn theo các tab: Chờ xử lý, Đang giao, Đã giao | `tests/services.test.mjs`, `tests/integration/order.test.mjs` |
| 26 | `TC_ORDER_02`| Orders History | Xem chi tiết hóa đơn & timeline | Hiển thị tiến trình, phí ship, món hàng, địa chỉ snapshot | `tests/services.test.mjs`, `tests/integration/order.test.mjs` |
| 27 | `TC_FAV_01`  | Favourites | Thêm/Xóa danh sách yêu thích | Thay đổi trạng thái tim, đồng bộ tab Yêu thích | `tests/integration/profile.test.mjs` |
| 28 | `TC_PROF_01` | Profile | Cập nhật thông tin hồ sơ cá nhân | Lưu họ tên, SĐT mới lên Firestore, cập nhật UI header | `tests/integration/auth.test.mjs` |
| 29 | `TC_EDGE_01` | Edge Cases | Xử lý mất mạng Internet | Banner cảnh báo rõ ràng, không bị crash ứng dụng | `tests/integration/network.test.mjs` |
| 30 | `TC_EDGE_02` | Edge Cases | Chống double-click đặt hàng | Vô hiệu hóa nút sau lần bấm 1, chỉ gửi 1 transaction | `tests/integration/order.test.mjs` |

---

## 3. BẢNG MAPPING CHI TIẾT: MÀN HÌNH → CONTEXT → SERVICE METHOD

| Đường dẫn màn hình (`app/`) | React Contexts sử dụng | Tầng Service & Phương thức gọi | Mục đích nghiệp vụ |
|---|---|---|---|
| `app/(auth)/login.tsx` | `useAuth` | `AuthService.login`, `AuthService.loginAsGuest` | Đăng nhập email/pass hoặc tài khoản khách |
| `app/(auth)/register.tsx` | `useAuth` | `AuthService.register` | Đăng ký tài khoản người dùng mới |
| `app/(tabs)/home.tsx` | `useAuth`, `useCart`, `useFavourites`, `useNotifications`, `useProductFilter`, `useProductSearch` | `CatalogService.getCategories`, `CatalogService.getProducts` | Màn hình chính, duyệt danh mục, sản phẩm nổi bật, tìm kiếm debounce |
| `app/(tabs)/favourite.tsx` | `useFavourites`, `useCart` | `FavouritesContext` (đồng bộ Firestore `users/{uid}/favourites`) | Xem danh sách SP yêu thích, chuyển vào giỏ |
| `app/(tabs)/account.tsx` | `useAuth`, `useCart`, `useFavourites`, `useNotifications`, `useOrders`, `useAddresses`, `usePaymentMethods` | `AuthService.logout`, `ProfileService.getSettings` | Quản lý hồ sơ, điều hướng cài đặt, đơn hàng, địa chỉ, thanh toán |
| `app/product/[id].tsx` | `useCart`, `useFavourites` | `CatalogService.getProductById`, `CatalogService.getProductReviews` | Chi tiết sản phẩm, chọn biến thể màu/dung lượng, số lượng, thêm giỏ/mua ngay |
| `app/cart.tsx` | `useCart` | `VoucherService.validateVoucher` | Giỏ hàng, tăng/giảm số lượng, chọn/bỏ chọn, áp dụng voucher, tính tiền tạm |
| `app/checkout.tsx` | `useCheckout`, `useCart`, `useAddresses`, `usePaymentMethods` | `CatalogService.getShippingMethods`, `OrderService.createOrder` | Xác nhận đơn hàng, chọn địa chỉ, chọn vận chuyển, chọn thẻ/COD, đặt hàng |
| `app/checkout-success.tsx` | `useCheckout` | `OrderService.getOrder` | Thông báo đặt hàng thành công, hiển thị mã đơn, chuyển sang lịch sử |
| `app/filter.tsx` | `useProductFilter` | `CatalogService.getCategories`, `CatalogService.getBrands`, `CatalogService.getProducts` | Bộ lọc đa tiêu chí: danh mục, thương hiệu, khoảng giá min-max, sao đánh giá |
| `app/orders.tsx` | `useOrders` | `OrderService.listOrders` | Danh sách lịch sử đơn hàng phân loại theo tab |
| `app/order/[id].tsx` | `useOrders` | `OrderService.getOrder`, `OrderService.cancelOrder`, `OrderService.reorder` | Chi tiết tiến trình đơn hàng, huỷ đơn (kèm lý do), mua lại |
| `app/shipping-address.tsx` | `useAddresses`, `useAuth`, `useCheckout` | `ProfileService.listAddresses`, `ProfileService.addAddress`, `ProfileService.updateAddress`, `ProfileService.deleteAddress`, `ProfileService.setDefaultAddress` | Quản lý danh sách địa chỉ giao nhận của user |
| `app/payment-method.tsx` | `usePaymentMethods` | `ProfileService.listPaymentMethods`, `ProfileService.addPaymentMethod`, `ProfileService.deletePaymentMethod`, `ProfileService.setDefaultPaymentMethod` | Quản lý thẻ thanh toán (chỉ lưu 4 số cuối last4) |
| `app/notification.tsx` | `useNotifications` | `NotificationService.listNotifications`, `NotificationService.markAsRead`, `NotificationService.markAllAsRead` | Danh sách thông báo hệ thống, đơn hàng |
| `app/update-user.tsx` | `useAuth` | `AuthService.updateProfile` | Sửa họ tên, số điện thoại, avatar người dùng |
| `app/app-settings.tsx` | `useSettings` | `ProfileService.getSettings`, `ProfileService.updateSettings` | Cài đặt ngôn ngữ, thông báo, giao diện |
| `app/help.tsx` | `useAuth` | `SupportService.getFaqs`, `SupportService.getFaqGroups`, `SupportService.createTicket` | Trung tâm trợ giúp, câu hỏi thường gặp, gửi ticket hỗ trợ |

---

## 4. DANH SÁCH BACKLOG VÀ VIỆC CẦN LÀM (ACTION PLAN CHO PHASE 1 & 2)

1. **Loại bỏ hoàn toàn Runtime Mock Dependencies**:
   - `app/(tabs)/home.tsx`: Thay `import { MOCK_CATEGORIES } from '../../src/mock/categories'` bằng `CatalogService.getCategories()`.
   - `app/checkout.tsx`: Thay `import { MOCK_SHIPPING_METHODS }` bằng `CatalogService.getShippingMethods()`.
   - `src/context/CartContext.tsx`: Thay mock items khởi tạo ban đầu bằng sync Firestore / AsyncStorage.
   - `src/context/OrdersContext.tsx`: Thay `MOCK_PRODUCTS.find` ở reorder bằng `CatalogService.getProductById`.
   - `src/context/SettingsContext.tsx`: Dùng fallback default thay vì import trực tiếp mock file ở runtime.

2. **Chuyển đổi 8 Services sang Firebase Cloud Firestore**:
   - `auth.service.ts`: Firebase Auth (`signInWithEmailAndPassword`, `createUserWithEmailAndPassword`, `signOut`, `signInAnonymously`).
   - `catalog.service.ts`: Query Firestore `categories`, `brands`, `products`, `reviews`. Lọc & sắp xếp & phân trang đảm bảo 100% nhất quán logic.
   - `order.service.ts`: `runTransaction` Firestore (kiểm tra tồn kho, lấy giá server, tính toán thuế/phí/voucher, trừ stock, tăng soldCount, cập nhật voucher usedCount). Huỷ đơn hoàn tồn kho.
   - `voucher.service.ts`: Đọc collection `vouchers/{code}`, xác thực thời hạn, minOrder, usageLimit.
   - `profile.service.ts`: Subcollections `users/{uid}/addresses` và `users/{uid}/paymentMethods` với cơ chế duy nhất 1 mục mặc định (`writeBatch`).
   - `notification.service.ts`: Subcollection `users/{uid}/notifications`.
   - `search.service.ts`: Subcollection `users/{uid}/searchHistory` + collection `popularSearches`.
   - `support.service.ts`: Collections `faqGroups`, `faqs`, và `tickets`.

3. **Cơ chế Fallback & Data Source Flag**:
   - Hỗ trợ biến môi trường `EXPO_PUBLIC_DATA_SOURCE=firebase` (mặc định) và `mock` (cho unit test in-memory khi không có internet/emulator).
