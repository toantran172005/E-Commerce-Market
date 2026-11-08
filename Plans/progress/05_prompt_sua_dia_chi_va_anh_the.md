# PROMPT 05 – Sửa lỗi mất nút thêm địa chỉ & Nâng cấp ảnh thẻ thực tế cho các phương thức thanh toán (DeepSeek `deepseek-v4-pro`)

---PROMPT-START---
Bạn là Staff Mobile Engineer chuyên React Native 0.88, Expo Router ~58, React 19, TypeScript strict.
Nhiệm vụ: Sửa chuẩn xác 2 vấn đề theo phản hồi của người dùng:

---

### 1. Màn hình Địa chỉ giao hàng (`app/shipping-address.tsx`)
**VẤN ĐỀ**: Nút "Thêm địa chỉ mới" hiện tại chỉ xuất hiện khi danh sách trống (`ListEmptyComponent`). Khi đã có sẵn địa chỉ trong danh sách, người dùng không thấy nút thêm ở đâu cả!
**YÊU CẦU**:
- Bổ sung nút **"+ Thêm"** trên thanh tiêu đề `ScreenHeader` (thông qua prop `right={...}`) để người dùng luôn có thể bấm thêm địa chỉ bất kỳ lúc nào.
- Bổ sung thêm một nút/card lớn **"Thêm địa chỉ nhận hàng mới"** ở cuối danh sách địa chỉ (thông qua `ListFooterComponent` của FlatList) với viền nét đứt (dashed border) hoặc phong cách card thân thiện, nổi bật.
- Cả hai nút khi bấm đều gọi `openAddModal` để mở form thêm địa chỉ như bình thường.

---

### 2. Phương thức thanh toán (`app/payment-method.tsx` & `src/types/index.ts`)
**VẤN ĐỀ**:
- Người dùng phản hồi: "ảnh thẻ đặc trưng của từng cái ấy. Momo có cái màu hồng, vietinbank màu xanh mà?".
- Code trước đó đặt màu VietinBank là màu cam `#F7941D`, và Agribank là màu xanh `#009B74`, chưa chuẩn nhận diện thương hiệu.
- Chưa có hình ảnh thẻ thực tế đặc trưng cho từng ngân hàng/ví.

**YÊU CẦU**:
1. Chuẩn hóa màu sắc thương hiệu chính xác:
   - **Ví MoMo**: Màu hồng/magenta đặc trưng (`#D82D8B` hoặc `#A50064`).
   - **VietinBank**: Màu xanh dương/xanh lục biển đặc trưng (`#005596` hoặc `#0072CE`), TUYỆT ĐỐI KHÔNG DÙNG MÀU CAM.
   - **Vietcombank**: Màu xanh lá cây đậm thương hiệu (`#006837`).
   - **BIDV**: Màu xanh navy/xanh đậm (`#003B70`).
   - **Agribank**: Màu đỏ bordeaux/đỏ mận thương hiệu (`#8A151B` hoặc `#981F26`).
   - **COD**: Màu cam chủ đạo của ứng dụng (`#FF5722`).

2. Hình ảnh thẻ đặc trưng thực tế (`image` URL chất lượng cao, ổn định):
   - **MoMo**: Ảnh/banner thẻ ví điện tử MoMo màu hồng rực rỡ (ví dụ: `https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=600&auto=format&fit=crop&q=80`).
   - **VietinBank**: Ảnh thẻ ngân hàng màu xanh VietinBank (ví dụ: `https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=600&auto=format&fit=crop&q=80`).
   - **Vietcombank**: Ảnh thẻ ngân hàng màu xanh lá cây Vietcombank (ví dụ: `https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=600&auto=format&fit=crop&q=80`).
   - **BIDV**: Ảnh thẻ ngân hàng màu xanh navy BIDV (ví dụ: `https://images.unsplash.com/photo-1589758438368-0ad531db3366?w=600&auto=format&fit=crop&q=80`).
   - **Agribank**: Ảnh thẻ ngân hàng màu đỏ mận Agribank (ví dụ: `https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80`).

3. Hiển thị thẻ cực đẹp & trực quan:
   - Trong `cardMockup` (thẻ xem trước ở đầu màn hình): Hiển thị hình ảnh nền thẻ (sử dụng `<Image>` làm background hoặc overlay bán trong suốt kết hợp với màu thương hiệu), có chip thẻ EMV màu vàng đồng, logo tên thương hiệu (MoMo, VCB, BIDV, VietinBank, Agribank), số thẻ che bảo mật `•••• •••• •••• 1234`, tên chủ thẻ và ngày hết hạn.
   - Trong danh sách các thẻ đã lưu (`methods.map`): Mỗi dòng hiển thị một thumbnail ảnh thẻ nhỏ (hoặc icon circle với màu thương hiệu chuẩn) cùng tên và số thẻ, giúp nhận diện ngay lập tức.
   - Khi người dùng thêm thẻ mới (nhập số thẻ và hạn dùng), phương thức mới được lưu kèm `image` và màu sắc của ngân hàng/ví tương ứng.

---

## 3. Định dạng đầu ra (BẮT BUỘC)
Trả về danh sách file cần sửa dưới dạng:
=== FILE: đường/dẫn/tương/đối.ext ===
<toàn bộ mã nguồn đầy đủ của file>
=== END FILE ===

Chỉ sửa `src/types/index.ts`, `app/shipping-address.tsx`, `app/payment-method.tsx`.
Không giải thích ngoài lề. Code phải compile sạch với `tsc --noEmit`.
---PROMPT-END---
