# PROMPT 06 – Sửa giao diện thẻ thanh toán & Chức năng sửa địa chỉ (DeepSeek `deepseek-v4-pro`)

---PROMPT-START---
Bạn là Staff Mobile Engineer chuyên React Native 0.88, Expo Router ~58, React 19, TypeScript strict.
Nhiệm vụ: Sửa triệt để 2 vấn đề theo phản hồi khẩn cấp của người dùng:

---

### 1. Phương thức thanh toán (`app/payment-method.tsx`)
**VẤN ĐỀ NGƯỜI DÙNG PHẢN HỒI**: "cái thẻ sau khi thêm lại có hình quỷ gì đằng sau vậy? thẻ ở phương thức thanh toán ấy".
- Nguyên nhân: Trước đó code tải ảnh từ URL Unsplash ngẫu nhiên làm ảnh nền thẻ, dẫn đến việc xuất hiện các hình ảnh người/bàn tay/đồ vật kỳ quặc, lộn xộn phía sau thẻ!
**YÊU CẦU BẮT BUỘC**:
- **XOÁ BỎ HOÀN TOÀN TẤT CẢ CÁC URL ẢNH UNSPLASH / ẢNH NGOÀI ĐẰNG SAU THẺ**. Tuyệt đối không dùng ảnh chụp bên ngoài làm background thẻ.
- Thiết kế thẻ ngân hàng / ví điện tử chuẩn **Luxury Card UI** hoàn toàn bằng React Native StyleSheet:
  - Màu nền chuẩn đặc trưng của từng đơn vị:
    - **Ví MoMo**: Màu hồng tươi sang trọng (`#D82D8B`).
    - **VietinBank**: Màu xanh dương biển đặc trưng (`#005596`).
    - **Vietcombank**: Màu xanh lá cây đậm thương hiệu (`#006837`).
    - **BIDV**: Màu xanh navy hoàng gia (`#003B70`).
    - **Agribank**: Màu đỏ mận/burgundy (`#8A151B`).
    - **COD**: Màu xám than / cam chuẩn (`#1E293B`).
  - Họa tiết thẻ sang trọng:
    - Chip thẻ thông minh EMV màu vàng đồng ánh kim kim loại (vẽ bằng View với các đường rãnh chip sắc sảo).
    - Biểu tượng sóng thanh toán không tiếp xúc (Contactless wifi waves icon).
    - Logo / Tên thương hiệu viết hoa rõ nét (MOMO, VIETINBANK, VIETCOMBANK, BIDV, AGRIBANK, COD).
    - Số thẻ định dạng chuẩn ngân hàng: `••••  ••••  ••••  1234`.
    - Tên chủ thẻ (CHỦ THẺ / CARDHOLDER) viết hoa.
    - Ngày hết hạn (HẾT HẠN / EXPIRES): `MM/YY`.
    - Vòng cong hoa văn bán trong suốt tinh tế (subtle translucent circles), tạo chiều sâu như thẻ VIP thực thụ mà hoàn toàn sạch sẽ, không có bất kỳ hình ảnh nào khác.

---

### 2. Màn hình Địa chỉ giao hàng (`app/shipping-address.tsx`)
**VẤN ĐỀ NGƯỜI DÙNG PHẢN HỒI**: "nhãn địa chỉ đúng 1 icon thôi, cái văn phòng khác icon, và sửa địa chỉ không làm được."
**YÊU CẦU BẮT BUỘC**:
1. **Icon nhãn địa chỉ**:
   - Nếu nhãn là `"Văn phòng"` (hoặc tên nhãn chứa chữ "văn phòng", "công ty", "office"): Hiển thị icon công sở: `briefcase-outline` (hoặc `business-outline`).
   - TẤT CẢ các nhãn khác (Nhà riêng, v.v.): Chỉ dùng ĐÚNG 1 ICON DUY NHẤT: `home-outline`.
   - Trong form thêm/sửa, cho 2 chip chọn nhanh: `[Nhà riêng]` (icon home) và `[Văn phòng]` (icon briefcase).
2. **Sửa địa chỉ phải hoạt động 100%**:
   - Khắc phục lỗi bấm nút "Chỉnh sửa" không ăn: Container của `AddressCard` PHẢI là `<View style={[styles.card, isSelected && styles.cardSelected]}>`, KHÔNG ĐƯỢC bọc cả thẻ trong một Pressable cha vì sẽ nuốt sự kiện bấm của nút con.
   - Phần thân thẻ (thông tin + radio chọn) là một Pressable riêng để chọn địa chỉ.
   - Thanh hành động bên dưới (Đặt làm mặc định, Chỉnh sửa, Xóa) là các Pressable độc lập.
   - Khi bấm "Chỉnh sửa":
     - Mở Modal với tiêu đề "Chỉnh sửa địa chỉ".
     - Điền sẵn toàn bộ dữ liệu cũ: nhãn, họ tên, số điện thoại, địa chỉ cụ thể, mặc định.
     - Bấm "Cập nhật địa chỉ": Gọi `await updateAddress(editingAddress.id, form);`, đóng modal và cập nhật ngay lập tức danh sách địa chỉ.
   - Nút "+ Thêm" trên ScreenHeader và nút card lớn "Thêm địa chỉ nhận hàng mới" ở cuối danh sách vẫn hoạt động hoàn hảo.

---

## 3. Định dạng đầu ra (BẮT BUỘC)
Trả về đúng 2 khối code đầy đủ:
=== FILE: app/payment-method.tsx ===
<toàn bộ mã nguồn đầy đủ của file>
=== END FILE ===

=== FILE: app/shipping-address.tsx ===
<toàn bộ mã nguồn đầy đủ của file>
=== END FILE ===

Không giải thích bên ngoài. Đảm bảo 100% compile sạch với `tsc --noEmit`.
---PROMPT-END---
