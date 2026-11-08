# PROMPT 04 – Tinh chỉnh UI/UX & Logic Frontend ECommerceApp (DeepSeek `deepseek-v4-pro`)

---PROMPT-START---
Bạn là Staff Mobile Engineer chuyên React Native 0.88, Expo Router ~58, React 19, TypeScript strict.
Nhiệm vụ: Cập nhật và tinh chỉnh chuẩn chỉnh 5 khu vực giao diện và logic theo yêu cầu mới nhất của khách hàng.
Code viết ra phải:
- **ĐƠN GIẢN, NGẮN GỌN, DỄ HIỂU** (đối tượng đọc là sinh viên).
- **CHÍNH XÁC (ACCURACY)**: Không lỗi cú pháp, đúng kiểu TypeScript, bám sát design tokens trong `theme.ts`.
- **KHÔNG THÊM THƯ VIỆN NGOÀI**. Chỉ dùng React Native core, Expo Router, `@expo/vector-icons` (Ionicons), `react-native-safe-area-context`.

---

## 1. Yêu cầu chi tiết từng khu vực

### 1. Trang chủ (`app/(tabs)/home.tsx`)
- Danh mục sản phẩm ngay trang chủ hiện đang bị lặp: có hàng icon danh mục phía trên và hàng nút/chip filter danh mục ("Tất cả", "Âm thanh", "Điện thoại"...) ngay bên dưới.
- **YÊU CẦU**: **Xoá bỏ hoàn toàn hàng button/chips bị lặp**. Chỉ giữ lại hàng danh mục có icon tròn (`categoriesRow`).
- Khi người dùng bấm vào một icon danh mục:
  - Nếu danh mục đó đang chọn thì bỏ chọn (hiển thị tất cả sản phẩm).
  - Nếu chưa chọn thì lọc sản phẩm theo danh mục đó.
  - Active state: đổi viền/màu primary nổi bật.

### 2. Thông báo (`app/notification.tsx`)
- **Phần đáy (bottom)**: Làm cho bo tròn hẳn và xử lý khoảng cách đệm (padding + safe area insets) mượt mà, không bị phẳng lì hay cảm giác bị cắt cụt.
- **Bỏ chia theo danh mục**: Xoá bỏ thanh tabs ngang phân loại (Tất cả, Đơn hàng, Khuyến mãi, Hệ thống, Đánh giá). Chỉ hiển thị trực tiếp một danh sách thông báo thống nhất, đơn giản và thoáng đãng.
- **Click vào thông báo**: Khi bấm vào một thông báo:
  - **Đánh dấu thông báo đó đã đọc**.
  - **HIỆN MODAL POPUP CHI TIẾT** ngay tại chỗ (hiển thị tiêu đề, ngày giờ, nội dung đầy đủ của thông báo, icon minh hoạ).
  - Trong Modal có nút **"Xác nhận"** (hoặc "Đã hiểu") để đóng Modal.
  - **TUYỆT ĐỐI KHÔNG ĐIỀU HƯỚNG ĐI ĐÂU CẢ** (`router.push` đi nơi khác bị xoá bỏ).

### 3. Tài khoản (`app/(tabs)/account.tsx`)
- **YÊU CẦU**: **Bỏ hoàn toàn mục "Danh sách yêu thích" (Favourites)** trong màn hình Tài khoản:
  - Xoá ô thống kê yêu thích (Favourites stat box).
  - Xoá dòng menu "Danh sách yêu thích" trong danh mục đơn hàng/tiện ích.

### 4. Phương thức thanh toán (`src/mock/paymentMethods.ts`, `app/payment-method.tsx`, `app/checkout.tsx`)
- **Chỉ hỗ trợ 3 hình thức**:
  1. **Ví MoMo** (có màu hồng đặc trưng và ảnh thẻ/logo MoMo thật).
  2. **Thẻ ngân hàng**: Chỉ hỗ trợ đúng 4 ngân hàng lớn của Việt Nam: **Vietcombank, BIDV, VietinBank, Agribank** (kèm ảnh thẻ thật hoặc card graphic nhận diện thương hiệu thực tế của từng ngân hàng).
  3. **COD (Thanh toán tiền mặt khi nhận hàng)**.
- **Dữ liệu ban đầu (Initial State)**:
  - Trước mắt sửa lại là **KHÔNG CÓ thẻ hay ví nào lưu sẵn cả, CHỈ CÓ COD (Thanh toán khi nhận hàng)** là mặc định.
- **Modal Thêm thẻ / ví mới**:
  - Người dùng có thể chọn thêm: Ví MoMo hoặc 1 trong 4 ngân hàng (Vietcombank, BIDV, VietinBank, Agribank).
  - Form thêm thẻ cực kỳ đơn giản: **Chỉ cần nhập Số thẻ/Số tài khoản và Hạn sử dụng (MM/YY)** (đối với MoMo thì nhập Số điện thoại liên kết).
  - Sau khi bấm "Thêm", thẻ được tạo và **tải ảnh thẻ thật (hoặc card graphic thực tế) của ngân hàng / ví MoMo** đó lên danh sách, có số thẻ được che bảo mật (`•••• 1234`).
- **Màn Checkout (`app/checkout.tsx`)**:
  - Đồng bộ danh sách phương thức thanh toán: hiển thị phương thức đang chọn (mặc định là COD) và cho phép chuyển đổi sang MoMo / Ngân hàng nếu đã thêm.

### 5. Cài đặt ứng dụng (`app/app-settings.tsx`)
- Tối giản cài đặt ứng dụng:
  - **Xoá phần Chế độ tối (Dark mode)**.
  - **Xoá mục Ngôn ngữ và mục Tiền tệ** (cả 2 modal chọn ngôn ngữ và tiền tệ đều xoá).
  - **Xoá 2 dòng thông báo (thông báo đẩy và thông báo email)**, thay bằng **1 dòng duy nhất**: `"Cho phép thông báo"` với nút gạt bật/tắt (Switch).
  - **Xoá nút "Xoá bộ nhớ đệm"** trong phần Quyền riêng tư.
  - Giữ lại: Chính sách bảo mật, Đổi mật khẩu, Đăng nhập sinh trắc học (nếu có).

---

## 2. Định dạng đầu ra (BẮT BUỘC)
Trả về danh sách các file cần thay đổi dưới dạng các khối:
=== FILE: đường/dẫn/tương/đối.ext ===
<toàn bộ mã nguồn đầy đủ của file>
=== END FILE ===

Không giải thích ngoài lề. Code phải compile sạch với `tsc --noEmit`.
---PROMPT-END---
