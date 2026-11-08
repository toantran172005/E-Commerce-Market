# BÁO CÁO TỔNG KẾT DỰ ÁN (FINAL REPORT)
## Rà soát 21 Use Cases (SRS), Sửa lỗi Mobile.docx, và Tách biệt Bộ công cụ AI

---

## 1. TỔNG QUAN DỰ ÁN VÀ KẾT QUẢ CUỐI CÙNG

Dự án **E-Commerce Market Mobile App** (React Native / Expo SDK 52, TypeScript, Cloud Firestore, Firebase Auth) đã trải qua quá trình rà soát toàn diện theo đặc tả SRS (21 Use Cases từ `N13_ApplicationDevelopment_SRS (1).docx`), khắc phục các phản hồi thực tế từ `mobile.docx`, và tái cấu trúc hoàn toàn hệ thống AI sang thư mục độc lập `ROOT/AI/`.

### Kết quả kiểm định tự động (Quality Gates):
- **TypeScript Typecheck**: `tsc --noEmit` -> **PASS (0 lỗi, 0 cảnh báo)**.
- **Node.js Native Test Suite**:
  - `tests/utils.test.mjs`: 15/15 PASS
  - `tests/services.test.mjs`: 22/22 PASS
  - `tests/integration/usecases.test.mjs`: 15/15 PASS
  - `tests/uc/UC001_to_UC021.test.mjs`: 26/26 PASS
  - **Tổng số test**: **78/78 test PASS 100% qua 3 lần chạy liên tiếp (3 consecutive green runs)**.
- **Expo Web Export**: `npx expo export --platform web` -> **Thành công (dist/web, 985 modules, 3.45s)**.
- **Expo Android Export**: `npx expo export --platform android` -> **Thành công (dist/android Hermes bytecode, 1334 modules, 10.2s)**.
- **Kiểm tra rò rỉ AI (AI Leak Check)**: **0 file / 0 tham chiếu AI trong `ECommerceApp/`**.

### Bảng trạng thái chi tiết 21 Use Cases (UC001 - UC021):

| UC ID | Tên Use Case | Kết quả Kiểm thử | Minh chứng & File mã nguồn |
|:---:|:---|:---:|:---|
| **UC001** | Đăng nhập & Quên mật khẩu | **PASS** | `app/(auth)/login.tsx`, `AuthService.sendPasswordResetEmail` |
| **UC002** | Đăng ký & Quản lý tài khoản | **PASS** | `app/(auth)/register.tsx`, `app/(tabs)/account.tsx` |
| **UC003** | Cập nhật hồ sơ & Avatar thực tế | **PASS** | `app/update-user.tsx` (sử dụng `expo-image-picker`, validate <= 5MB) |
| **UC004** | Sổ địa chỉ có cấu trúc 4 cấp | **PASS** | `app/shipping-address.tsx` (Tỉnh/Thành, Quận/Huyện, Phường/Xã, Chi tiết) |
| **UC005** | Danh mục sản phẩm | **PASS** | `app/(tabs)/home.tsx`, `CatalogService.getCategories` |
| **UC006** | Tìm kiếm sản phẩm & Lịch sử | **PASS** | `app/(tabs)/home.tsx`, `SearchService.saveSearch` (tối đa 10 mục) |
| **UC007** | Lọc đa tiêu chí & Sắp xếp | **PASS** | `app/filter.tsx`, `CatalogService.getProducts` (5 tiêu chí sắp xếp) |
| **UC008** | Chi tiết sản phẩm kiểu Shopee | **PASS** | `app/product/[id].tsx`, `ProductSpecsTable`, `ProductDescriptionView` |
| **UC009** | Quản lý giỏ hàng & Tính thuế | **PASS** | `app/cart.tsx`, `CartContext`, `pricing.ts` (VAT 8%) |
| **UC010** | Áp dụng mã giảm giá | **PASS** | `VoucherService.validateVoucher` (kiểm tra hạn, số lượt, danh mục) |
| **UC011** | Danh sách sản phẩm yêu thích | **PASS** | `app/(tabs)/favourite.tsx` (loại bỏ hoàn toàn nested button) |
| **UC012** | Quản lý phương thức thanh toán | **PASS** | `app/payment-method.tsx` (PCI DSS: chỉ lưu last4, không lưu CVV) |
| **UC013** | Thông báo hệ thống | **PASS** | `app/notification.tsx`, `NotificationService` |
| **UC014** | Trợ giúp & Gửi yêu cầu hỗ trợ | **PASS** | `app/help.tsx`, `SupportService.createTicket` |
| **UC015** | Đặt hàng & Transaction tồn kho | **PASS** | `app/checkout.tsx`, `OrderService.createOrder` (Transaction nguyên tử) |
| **UC016** | Hủy đơn hàng kèm lý do | **PASS** | `app/order/[id].tsx`, `OrderService.cancelOrder` (hoàn trả tồn kho) |
| **UC017** | Theo dõi đơn & Xem hóa đơn | **PASS** | `app/order/[id].tsx`, `src/components/InvoiceModal.tsx` (Hóa đơn GTGT) |
| **UC018** | Đánh giá sản phẩm đã giao | **PASS** | `src/components/ReviewModal.tsx`, `CatalogService.addProductReview` |
| **UC019** | Cấu hình cài đặt ứng dụng | **PASS** | `app/app-settings.tsx`, `ProfileService.updateSettings` |
| **UC020** | Đăng xuất & Quản lý phiên | **PASS** | `app/(tabs)/account.tsx`, `AuthService.logout` |
| **UC021** | Chế độ khách vãng lai | **PASS** | `app/(auth)/login.tsx`, `AuthService.loginAsGuest` |

---

## 2. CÁC LỖI ĐÃ SỬA VÀ NGUYÊN NHÂN GỐC

### 2.1. Lỗi vi phạm DOM HTML5: `<button> cannot contain a nested <button>` (Mobile.docx Mục A)
- **Nguyên nhân gốc**: Trong React Native Web, component `<Pressable>` hoặc `<TouchableOpacity>` được render thành thẻ HTML `<button>`. Trong `ProductCard.tsx`, `home.tsx` và `favourite.tsx`, toàn bộ Card sản phẩm là một `<Pressable>` bao bọc bên ngoài, bên trong lại chứa nút bấm tim yêu thích (Heart Pressable) hoặc nút hành động (Delete Pressable). Trình duyệt kích hoạt cảnh báo vi phạm HTML5 nghiêm trọng: `<button> cannot appear as a descendant of <button>`.
- **Cách sửa dứt điểm**:
  - Chuyển container ngoài cùng của thẻ Card thành `<View style={styles.card}>`.
  - Biến phần thân sản phẩm (ảnh, tiêu đề, giá) và nút hành động thành **hai thành phần anh em ngang hàng (Siblings)**, không lồng nhau.
  - Tách sự kiện click: Click vào vùng thân chuyển tới `/product/[id]`; click vào nút tim kích hoạt yêu thích một cách độc lập.
  - Quét kiểm tra toàn bộ ứng dụng bằng tokenizer JSX để đảm bảo không còn bất kỳ cấu trúc pressable lồng pressable nào.

### 2.2. Lỗi Toast che khuất thanh Bottom Bar (Mobile.docx Mục A)
- **Nguyên nhân gốc**: Component `Toast.tsx` có vị trí cố định `bottom: 40`, dẫn đến việc thông báo Toast đè lên nút "Thêm vào giỏ hàng" hoặc thanh tác vụ ở đáy màn hình.
- **Cách sửa**: Bổ sung thuộc tính `bottom?: number` với giá trị mặc định được nâng lên `120px` kèm `zIndex: 9999`, đảm bảo Toast luôn nổi bật phía trên thanh tác vụ mà không che khuất thao tác người dùng.

### 2.3. Lỗi ảnh vỡ / Mock Placeholder Minova Smart Plug (Mobile.docx Mục B)
- **Nguyên nhân gốc**: Sản phẩm `p-47` (Ổ cắm thông minh Minova) sử dụng đường dẫn ảnh placeholder `picsum.photos` không đảm bảo tính sẵn sàng cao, đôi khi trả về 404 hoặc bị chặn.
- **Cách sửa**: Thay thế bằng URL ảnh công nghệ điện tử chất lượng cao từ Unsplash CDN (`https://images.unsplash.com/photo-1558002038-1055907df827?w=700`), đồng thời thiết lập cơ chế fallback tự động cho component ảnh.

---

## 3. CÁC TÍNH NĂNG ĐÃ BỔ SUNG HOẶC HOÀN THIỆN

### 3.1. Chi tiết sản phẩm chuẩn Shopee (Mobile.docx Mục B)
- Bổ sung bảng thông số kỹ thuật **"CHI TIẾT SẢN PHẨM"** (`ProductSpecsTable.tsx`): Hiển thị dạng bảng hai cột (Thuộc tính - Giá trị) gồm Danh mục, Thương hiệu, Xuất xứ, Trọng lượng, Kích thước, Chất liệu, Điện áp, v.v.
- Bổ sung khối **"MÔ TẢ SẢN PHẨM"** (`ProductDescriptionView.tsx`):
  - Danh sách đặc điểm nổi bật (Highlights) với bullet points trực quan.
  - Mô tả chuyên sâu có nút "Xem thêm / Thu gọn".
  - Hướng dẫn sử dụng và bảo quản.
  - Thẻ chính sách bảo hành chính hãng (12 - 24 tháng).
  - Huy hiệu trạng thái tồn kho ("CÒN HÀNG" / "HẾT HÀNG").
- Tự động sinh dữ liệu tiếng Việt thực tế và cập nhật trực tiếp vào Firestore thông qua script `seed.mjs`.

### 3.2. Luồng Quên mật khẩu & Thông báo lỗi tiếng Việt chuẩn xác (SRS UC001)
- Bổ sung phương thức `sendPasswordResetEmail` trên `AuthService` và `AuthContext`.
- Giao diện Modal nhập email đặt lại mật khẩu với thông báo hướng dẫn gửi email thành công.
- Chuẩn hóa thông báo lỗi đăng nhập theo đúng văn bản SRS: *"Thông tin đăng nhập không chính xác."*.

### 3.3. Chọn ảnh đại diện thiết bị với kiểm soát dung lượng (SRS UC003)
- Tích hợp thư viện `expo-image-picker` nguyên bản.
- Hỗ trợ chụp từ máy ảnh hoặc chọn từ thư viện ảnh thiết bị.
- Kiểm soát dung lượng tệp tin nghiêm ngặt: Từ chối các tệp ảnh vượt quá 5MB kèm thông báo *"Kích thước ảnh đại diện không được vượt quá 5MB."*.

### 3.4. Sổ địa chỉ có cấu trúc 4 cấp hành chính Việt Nam (SRS UC004)
- Mở rộng form địa chỉ thành 4 trường độc lập: **Tỉnh/Thành phố**, **Quận/Huyện**, **Phường/Xã**, và **Địa chỉ chi tiết** (Số nhà, tên đường, tòa nhà).
- Tự động ghép nối thành chuỗi địa chỉ giao hàng hoàn chỉnh.
- Ràng buộc tính duy nhất của địa chỉ mặc định trong Firestore.

### 3.5. Kiểm soát tồn kho, Giới hạn danh mục Voucher & Xem hóa đơn bán hàng (SRS UC015, UC016, UC017)
- **Kiểm soát tồn kho trong Transaction**: Nếu sản phẩm trong giỏ bị hết hàng trong lúc người dùng đang bấm thanh toán, hệ thống sẽ hủy bỏ transaction, thông báo chi tiết và đề xuất người dùng quay về giỏ hàng.
- **Ràng buộc danh mục Voucher**: Kiểm tra các mặt hàng trong giỏ có thỏa mãn điều kiện `applicableCategories` của Voucher hay không; cho phép người dùng đổi hoặc hủy áp dụng Voucher ngay tại màn hình thanh toán.
- **Hóa đơn điện tử GTGT (Invoice View)**: Component `InvoiceModal.tsx` hiển thị toàn bộ thông tin mã đơn hàng, ngày giờ, người nhận, số điện thoại, địa chỉ, bảng chi tiết từng sản phẩm, thuế VAT 8%, phí vận chuyển, chiết khấu và trạng thái thanh toán.

### 3.6. Đánh giá sản phẩm đã nhận hàng kèm ảnh thực tế (SRS UC018)
- Tại màn hình chi tiết đơn hàng, với các đơn hàng có trạng thái `delivered` ("Đã giao hàng"), kích hoạt nút "Đánh giá sản phẩm".
- Modal đánh giá cho phép chấm điểm 1-5 sao, viết nhận xét trải nghiệm và đính kèm tối đa 3 ảnh chụp thực tế từ thư viện thiết bị.

---

## 4. CẢI TIẾN BẢO MẬT, HIỆU NĂNG VÀ CHẤT LƯỢNG MÃ NGUỒN

1. **Bảo mật thanh toán (PCI DSS Compliant)**:
   - Nghiêm cấm hoàn toàn việc lưu mã bảo mật thẻ (CVV/CVC) trong cơ sở dữ liệu.
   - Chỉ lưu trữ 4 số cuối của thẻ (`last4`) và thương hiệu phát hành thẻ (`cardBrand`).
2. **Toàn vẹn giá cả và kho hàng qua Firestore Transaction**:
   - Giá trị hàng hóa được đọc và tính toán lại từ tài liệu Firestore gốc trong transaction, không tin tưởng dữ liệu giá gửi từ client để phòng ngừa gian lận giá.
   - Thao tác trừ tồn kho và tăng số lượt bán được thực hiện nguyên tử.
3. **Hiệu năng Bundle**:
   - Sử dụng Hermes Engine cho Android (`.hbc`), tối ưu hóa thời gian khởi động ứng dụng.
   - Tối ưu hóa tải ảnh CDN (Unsplash) với các tham số nén tự động `auto=format&fit=crop&q=80`.

---

## 5. CÁC MỤC BLOCKED VÀ NỢ KỸ THUẬT

- **Không có mục BLOCKED nào**: Toàn bộ luồng dữ liệu giữa ứng dụng và Cloud Firestore (Authentication, Products, Categories, Vouchers, Orders, Addresses, Payment Methods, Notifications, Support Tickets) hoạt động thông suốt.
- **Nợ kỹ thuật**: Đã dọn dẹp toàn bộ dead code, không còn cảnh báo TypeScript, không còn vi phạm thẻ HTML lồng nhau.

---

## 6. CÁC QUYẾT ĐỊNH VÀ GIẢ ĐỊNH KỸ THUẬT

1. **Kiến trúc dữ liệu kép (Dual-Mode Architecture)**: Ứng dụng ưu tiên kết nối Cloud Firestore trực tiếp; trong trường hợp mất mạng hoặc offline, hệ thống tự động fallback mượt mà về dữ liệu Mock bộ nhớ để đảm bảo trải nghiệm người dùng không bị gián đoạn.
2. **Tách biệt tuyệt đối bộ công cụ AI**: Mọi prompt, script gọi DeepSeek, nhật ký thực thi và metadata agent được đặt trong `ROOT/AI/` để mã nguồn `ECommerceApp/` giữ nguyên tính chuyên nghiệp của một sản phẩm phần mềm thương mại độc lập, sẵn sàng nộp bài và kiểm toán mã nguồn.

---

## 7. HƯỚNG DẪN CÀI ĐẶT, CHẠY VÀ CÁC VIỆC CẦN LÀM

### 7.1. Cài đặt và Chạy thử nghiệm
```bash
# 1. Di chuyển vào thư mục ứng dụng
cd ECommerceApp

# 2. Cài đặt thư viện phụ thuộc
npm install

# 3. Kiểm tra TypeScript
npm run typecheck

# 4. Chạy toàn bộ 78 kiểm thử tự động
npm run test:all

# 5. Khởi chạy ứng dụng
npx expo start
# Nhấn 'w' để mở trên trình duyệt Web, hoặc quét mã QR qua Expo Go trên thiết bị di động
```

### 7.2. Các việc Chủ dự án cần thực hiện trên Firebase Console (nếu triển khai môi trường mới)
1. **Firebase Authentication**: Bật nhà cung cấp Email/Password trong tab *Authentication > Sign-in method*.
2. **Firestore Security Rules**: Triển khai file bảo mật `firestore.rules` đảm bảo quy tắc người dùng chỉ được đọc/ghi dữ liệu cá nhân của chính họ (`users/{userId}/**`).
3. **EAS Build**: Đăng nhập tài khoản Expo Application Services qua lệnh `npx eas login` khi có nhu cầu xuất file APK/AAB hoàn chỉnh lên Google Play Store.

---

## 8. SƠ ĐỒ DI CHUYỂN TỆP TIN AI (TASK D RELOCATION MAPPING)

Toàn bộ các tệp tin AI đã được di chuyển thành công từ `ECommerceApp/` ra `ROOT/AI/`:

| Đường dẫn cũ trong `ECommerceApp/` | Đường dẫn mới trong `ROOT/AI/` | Mục đích |
|---|---|---|
| `ECommerceApp/scripts/call_deepseek.py` | `AI/scripts/call_deepseek.py` | Script gọi DeepSeek API sinh code |
| `ECommerceApp/scripts/generate_shopee_specs.py` | `AI/scripts/generate_shopee_specs.py` | Script sinh dữ liệu thông số Shopee |
| `ECommerceApp/prompts/*.md` | `AI/prompts/*.md` | Các file Prompt kỹ thuật cho AI |
| `ECommerceApp/runs/*.json` | `AI/runs/*.json` | Dữ liệu output kết quả từ AI |
| `ECommerceApp/.agent/*` | `AI/.agent/*` | SPEC, STATE, và FINAL_REPORT của AI |
| `ECommerceApp/.env` (`DEEPSEEK_API_KEY`) | `AI/.env` | Khóa API DeepSeek được lưu biệt lập |
