# ROLE & CONTEXT
Bạn là Chuyên gia Cao cấp về React Native, Expo Router và TypeScript.
Dự án là ứng dụng thương mại điện tử `ECommerceApp` xây dựng trên React Native Expo, Firebase Cloud Firestore.

# EXISTING CONTRACTS & PROBLEM DEFINITION
1. **Vấn đề số lượng trong giỏ hàng (Cart Count / Badge Calculation)**:
- Hiện tại trong `CartContext.tsx`:
  `totalItems` đang được tính bằng tổng `quantity` của tất cả item:
  `items.reduce((sum, item) => sum + item.quantity, 0)`
- Điều này khiến cho nếu 1 sản phẩm có `quantity = 7`, badge giỏ hàng lại hiển thị là 7, gây hiểu nhầm.
- Yêu cầu của người dùng: **Số lượng giỏ hàng phải tính theo số lượng sản phẩm khác nhau (distinct `productId`)**.
  - Nếu cùng `productId` (dù quantity là 7 hay bao nhiêu) -> tính là 1.
  - Nếu khác `productId` (ví dụ có 2 sản phẩm A và B) -> tính là 2.
  - Công thức: `new Set(items.map((i) => i.productId)).size` (cho `totalItems`).
  - Tương tự cho `selectedCount`: `new Set(items.filter((i) => i.selected).map((i) => i.productId)).size`.
- Trong `app/checkout.tsx`:
  `selectedCount` cũng phải tính theo distinct `productId`: `new Set(selectedItems.map((item) => item.productId)).size`.

2. **Yêu cầu xóa hoàn toàn nút "Đặt lại" (Reorder button)**:
- Người dùng yêu cầu: "và xóa nút đặt lại luôn".
- Trong `ECommerceApp/app/order/[id].tsx`:
  - Xóa bỏ nút "Đặt lại" / "Đặt lại đơn hàng".
  - Khi đơn hàng `delivered`: chỉ hiển thị nút duy nhất "Đánh giá sản phẩm" (PrimaryButton full width `style={{ flex: 1 }}`).
  - Khi đơn hàng `cancelled`: không hiển thị nút "Đặt lại đơn hàng".
  - Dọn sạch state `reordering` và hàm `handleReorder` không còn dùng trong `order/[id].tsx`.
- Trong `ECommerceApp/app/orders.tsx`:
  - Xóa nút "Đặt lại" / "Mua lại" ở các card đơn hàng (ở tab Tất cả và tab Đã giao). Chỉ giữ lại nút "Chi tiết" hoặc nút "Đánh giá" / "Xem đánh giá".

# STRICT CONSTRAINTS
- Tuân thủ TypeScript nghiêm ngặt, không có lỗi kiểu (`tsc --noEmit` đạt 0 lỗi).
- Giữ nguyên các logic nghiệp vụ khác của giỏ hàng và đặt hàng.
- Tuyệt đối không thay đổi contract API hay xóa nhầm chức năng khác.

# OUTPUT FORMAT
Trả về code hoàn chỉnh hoặc đoạn code chỉnh sửa chính xác cho các file:
1. `ECommerceApp/src/context/CartContext.tsx`
2. `ECommerceApp/app/checkout.tsx`
3. `ECommerceApp/app/order/[id].tsx`
4. `ECommerceApp/app/orders.tsx`
