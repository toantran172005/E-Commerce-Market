# ROLE & CONTEXT
Bạn là Chuyên gia Cao cấp về React Native, Expo Router và TypeScript.
Dự án là ứng dụng thương mại điện tử `ECommerceApp` xây dựng trên React Native Expo, Firebase Cloud Firestore.

# EXISTING CONTRACTS & PROBLEM DEFINITION
Người dùng phát hiện 2 lỗi nghiêm trọng trong luồng đặt hàng và đánh giá sản phẩm:

1. **Lỗi Navigation Stack (Quay lại từ 'Đơn hàng của tôi' nhảy về 'Đặt hàng thành công')**:
- Khi đặt hàng thành công ở `checkout.tsx`: chuyển sang `checkout-success.tsx` (`router.replace('/checkout-success')`).
- Ở `checkout-success.tsx`: nhấn "Xem chi tiết đơn hàng" -> trước đó dùng `router.push('/order/[id]')`, khiến `checkout-success` vẫn nằm trong lịch sử stack.
- Khi ở `order/[id].tsx`: nhấn quay lại -> nhảy về `orders.tsx` (`router.replace('/orders')`).
- Nhưng khi ở `orders.tsx`: nhấn quay lại trên ScreenHeader -> `router.back()` lại pop về màn hình `checkout-success` nằm dưới đáy stack!
- **Giải pháp**:
  - Trong `checkout-success.tsx`: Khi nhấn "Xem chi tiết đơn hàng", dùng `router.replace({ pathname: '/order/[id]', params: { id: order.id, fromSuccess: '1' } })`. Khi đó `checkout-success` bị gỡ khỏi navigation stack.
  - Trong `order/[id].tsx`: Khi `fromSuccess === '1'`, nhấn quay lại sẽ `router.replace({ pathname: '/orders', params: { fromSuccess: '1' } })`.
  - Trong `orders.tsx`: Nút back trên ScreenHeader kiểm tra nếu `fromSuccess === '1'`, sẽ chuyển về trang chủ `router.replace('/(tabs)/home')` thay vì `router.back()`.

2. **Lỗi nút đánh giá không cập nhật trạng thái "Đã đánh giá" (1 khách chỉ được đánh giá 1 lần)**:
- Người dùng đánh giá sản phẩm ngay trong chi tiết đơn hàng `app/order/[id].tsx`.
- Nhưng thoát ra ngoài vào lại chi tiết đơn vẫn thấy nút "Đánh giá sản phẩm".
- Chuyển sang tab "Đã giao" ở `app/orders.tsx` thì đơn đó vẫn hiện nút "Đánh giá" thay vì "Đã đánh giá" / "Xem đánh giá".
- **Nguyên nhân**:
  1. Trong `order/[id].tsx`: Bottom bar khi `order.status === 'delivered'` luôn render cứng nút `<PrimaryButton title="Đánh giá sản phẩm" />` mà không kiểm tra `order.reviewedItemIds`.
  2. Khi `ReviewModal` gửi đánh giá thành công, `order/[id].tsx` chỉ gọi `showToast(msg)` mà KHÔNG gọi `markItemReviewed` và KHÔNG gọi `loadOrders()`, khiến `OrdersContext` trong bộ nhớ không hề cập nhật `reviewedItemIds`.
  3. `ReviewModal.tsx` cần truyền `productId` vào callback `onSuccess(message, productId)` để cập nhật chính xác sản phẩm nào vừa được đánh giá.
  4. Trong `reviewService.ts`: Ở hàm `submitReview`, cần kiểm tra chặn không cho đánh giá lại nếu sản phẩm đã nằm trong `order.reviewedItemIds` ("1 khách chỉ được đánh giá 1 lần!").
  5. Trong `order/[id].tsx`: Nếu tất cả sản phẩm trong đơn đã được đánh giá (`unreviewedItems.length === 0`), chuyển nút thành "Xem đánh giá" (nhảy tới chi tiết sản phẩm) thay vì "Đánh giá sản phẩm".

# STRICT CONSTRAINTS
- Tuân thủ TypeScript nghiêm ngặt, `tsc --noEmit` đạt 0 lỗi.
- Đảm bảo 1 khách chỉ được đánh giá 1 lần cho mỗi sản phẩm trong đơn hàng.
- Khi đã đánh giá xong, cả màn hình chi tiết đơn `order/[id].tsx` và danh sách đơn `orders.tsx` đều phải phản ánh ngay lập tức trạng thái "Đã đánh giá" / "Xem đánh giá".

# OUTPUT FORMAT
Trả về mã nguồn hoặc đoạn code chỉnh sửa chính xác cho các file:
1. `ECommerceApp/src/services/reviewService.ts`
2. `ECommerceApp/src/components/ReviewModal.tsx`
3. `ECommerceApp/app/checkout-success.tsx`
4. `ECommerceApp/app/order/[id].tsx`
5. `ECommerceApp/app/orders.tsx`
