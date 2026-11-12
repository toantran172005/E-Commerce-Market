Dưới đây là các đoạn cần sửa/bổ sung. Do không có toàn bộ source nên tôi giữ nguyên phần không liên quan; hãy áp dụng đúng vị trí tương ứng trong từng file.

---

### 1. `ECommerceApp/src/services/reviewService.ts`

Thêm import và guard chống đánh giá lại trong `submitReview`.

```ts
// Thêm vào import firebase/firestore hiện có
import { arrayUnion, doc, getDoc, updateDoc } from 'firebase/firestore';
```

Trong hàm `submitReview`, ngay sau khi có `orderId` và `productId`:

```ts
const orderRef = doc(db, 'orders', orderId);
const orderSnap = await getDoc(orderRef);

if (!orderSnap.exists()) {
  throw new Error('Không tìm thấy đơn hàng');
}

const orderData = orderSnap.data() as { reviewedItemIds?: string[] };
const reviewedItemIds = Array.isArray(orderData.reviewedItemIds)
  ? orderData.reviewedItemIds
  : [];

if (reviewedItemIds.includes(productId)) {
  throw new Error(
    'Bạn đã đánh giá sản phẩm này rồi! Mỗi sản phẩm chỉ được đánh giá 1 lần.'
  );
}
```

Sau khi tạo review thành công, trước khi `return`, cập nhật Firestore:

```ts
await updateDoc(orderRef, {
  reviewedItemIds: arrayUnion(productId),
});
```

> Nếu hàm `submitReview` hiện tại dùng tên biến khác, hãy đổi `orderId` / `productId` theo đúng tham số hiện có.

---

### 2. `ECommerceApp/src/components/ReviewModal.tsx`

Đổi kiểu callback `onSuccess` để truyền thêm `productId`.

```ts
type ReviewModalProps = {
  // ... các prop cũ giữ nguyên
  onSuccess: (message: string, productId: string) => void;
};
```

Trong `handleSubmit`, sau khi gọi `submitReview` thành công:

```ts
// Trước đây: onSuccess(message);
onSuccess(message, productId);
```

> Nếu biến message hiện tại tên là `msg` hoặc kết quả trả về là object, dùng đúng biến tương ứng, ví dụ:
> ```ts
> onSuccess(result.message, productId);
> ```

---

### 3. `ECommerceApp/app/checkout-success.tsx`

Thay nút “Xem chi tiết đơn hàng” sang `router.replace`, đồng thời gắn `fromSuccess: '1'`.

```ts
const handleViewOrderDetail = () => {
  if (!order?.id) return;

  router.replace({
    pathname: '/order/[id]',
    params: {
      id: order.id,
      fromSuccess: '1',
    },
  });
};
```

Dùng cho nút:

```tsx
<PrimaryButton
  title="Xem chi tiết đơn hàng"
  onPress={handleViewOrderDetail}
/>
```

> Bỏ đoạn `router.push('/order/[id]')` cũ nếu có.

---

### 4. `ECommerceApp/app/order/[id].tsx`

#### 4.1. Lấy params và xử lý back

```ts
import { router, useLocalSearchParams } from 'expo-router';
import { useOrders } from '../../src/context/OrdersContext'; // sửa path nếu cần

const { id, fromSuccess } = useLocalSearchParams<{
  id: string;
  fromSuccess?: string;
}>();

const { orders, loadOrders, markItemReviewed } = useOrders();

// Nếu file đang dùng order từ context:
const order = orders.find((item) => item.id === id) ?? null;

const handleBack = () => {
  if (fromSuccess === '1') {
    router.replace({
      pathname: '/orders',
      params: { fromSuccess: '1' },
    });
    return;
  }

  router.back();
};
```

Gắn vào `ScreenHeader`:

```tsx
<ScreenHeader title="Chi tiết đơn hàng" onBack={handleBack} />
```

#### 4.2. Callback sau khi đánh giá thành công

```ts
const handleReviewSuccess = async (
  message: string,
  reviewedProductId: string
) => {
  showToast(message);

  if (!order) return;

  await markItemReviewed(order.id, reviewedProductId);
  await loadOrders();
};
```

#### 4.3. Tính trạng thái đã đánh giá

```ts
const reviewedItemIds = order?.reviewedItemIds ?? [];

const isReviewed = (productId: string) =>
  reviewedItemIds.includes(productId);

const unreviewedItems =
  order?.items.filter((item) => !isReviewed(item.productId)) ?? [];

const allItemsReviewed =
  !!order &&
  order.status === 'delivered' &&
  order.items.length > 0 &&
  unreviewedItems.length === 0;
```

#### 4.4. Hiển thị trạng thái từng sản phẩm nếu có

```tsx
<Text>
  {isReviewed(item.productId) ? 'Đã đánh giá' : 'Chưa đánh giá'}
</Text>
```

#### 4.5. Bottom bar cho đơn đã giao

```tsx
{order.status === 'delivered' && (
  allItemsReviewed ? (
    <PrimaryButton
      title="Xem đánh giá"
      onPress={() => {
        const productId = order.items[0]?.productId;
        if (!productId) return;

        router.push({
          pathname: '/product/[id]',
          params: { id: productId },
        });
      }}
    />
  ) : (
    <PrimaryButton
      title="Đánh giá sản phẩm"
      onPress={() => {
        const firstUnreviewed = unreviewedItems[0];
        if (!firstUnreviewed) return;

        setSelectedProduct(firstUnreviewed);
        setReviewModalVisible(true);
      }}
    />
  )
)}
```

#### 4.6. Truyền callback mới vào `ReviewModal`

```tsx
<ReviewModal
  // ... các prop cũ giữ nguyên
  onSuccess={handleReviewSuccess}
/>
```

> Nếu `markItemReviewed` trong project nhận tham số khác, giữ đúng chữ ký hiện có nhưng phải đảm bảo cập nhật đúng `order.id` và `reviewedProductId`.

---

### 5. `ECommerceApp/app/orders.tsx`

#### 5.1. Lấy `fromSuccess` và xử lý back

```ts
import { router, useLocalSearchParams } from 'expo-router';
import type { Order } from '../../src/types/order'; // sửa path nếu cần

const { fromSuccess } = useLocalSearchParams<{
  fromSuccess?: string;
}>();

const handleBack = () => {
  if (fromSuccess === '1') {
    router.replace('/(tabs)/home');
    return;
  }

  router.back();
};
```

Gắn vào `ScreenHeader`:

```tsx
<ScreenHeader title="Đơn hàng của tôi" onBack={handleBack} />
```

#### 5.2. Helper kiểm tra toàn bộ sản phẩm trong đơn đã được đánh giá

```ts
const isOrderFullyReviewed = (order: Order): boolean => {
  const reviewedIds = new Set(order.reviewedItemIds ?? []);

  return (
    order.status === 'delivered' &&
    order.items.length > 0 &&
    order.items.every((item) => reviewedIds.has(item.productId))
  );
};
```

#### 5.3. Cập nhật nút trong danh sách đơn

Trong phần render từng order:

```tsx
const fullyReviewed = isOrderFullyReviewed(order);

{order.status === 'delivered' && (
  <PrimaryButton
    title={fullyReviewed ? 'Xem đánh giá' : 'Đánh giá'}
    onPress={() => {
      router.push({
        pathname: '/order/[id]',
        params: { id: order.id },
      });
    }}
  />
)}
```

> Nếu muốn nút “Xem đánh giá” ở `orders.tsx` nhảy thẳng tới chi tiết sản phẩm, có thể thay `onPress` bằng:
> ```ts
> if (fullyReviewed && order.items[0]?.productId) {
>   router.push({
>     pathname: '/product/[id]',
>     params: { id: order.items[0].productId },
>   });
>   return;
> }
> ```
> Tuy nhiên cách an toàn nhất là vẫn đưa vào `/order/[id]` để màn hình chi tiết xử lý đúng trạng thái từng sản phẩm.

---

### Lưu ý TypeScript

- Đảm bảo type `Order` có:
  ```ts
  reviewedItemIds?: string[];
  ```
- Nếu item dùng `item.product.id` thay vì `item.productId`, thay toàn bộ `item.productId` bằng `item.product.id`.
- Nếu `useOrders()` chưa được import trong `order/[id].tsx`, thêm đúng đường dẫn thực tế của `OrdersContext`.
- Sau khi áp dụng, chạy:
  ```bash
  npx tsc --noEmit
  ```
  để kiểm tra lỗi type.