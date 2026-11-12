Do prompt không cung cấp toàn bộ nội dung 4 file nên mình trả về **các đoạn chỉnh sửa chính xác theo dạng Tìm → Thay** để tránh bịa/xóa nhầm code. Áp dụng đúng các vị trí tương ứng.

---

## 1. `ECommerceApp/src/context/CartContext.tsx`

### Thay cách tính `totalItems`

**Tìm:**
```ts
const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
```

**Thay bằng:**
```ts
const totalItems = new Set(items.map((item) => item.productId)).size;
```

### Thay cách tính `selectedCount`

Nếu file đang tính trực tiếp:

**Tìm:**
```ts
const selectedCount = items
  .filter((item) => item.selected)
  .reduce((sum, item) => sum + item.quantity, 0);
```

Hoặc:
```ts
const selectedCount = items.filter((item) => item.selected).length;
```

**Thay bằng:**
```ts
const selectedCount = new Set(
  items.filter((item) => item.selected).map((item) => item.productId),
).size;
```

Nếu trong file đã có sẵn `selectedItems`, dùng ngắn hơn:

```ts
const selectedItems = items.filter((item) => item.selected);
const selectedCount = new Set(selectedItems.map((item) => item.productId)).size;
```

> Không thay đổi logic giá tiền, tổng quantity, add/remove/update item khác.

---

## 2. `ECommerceApp/app/checkout.tsx`

### Thay cách tính `selectedCount`

Nếu file đã có:

```ts
const selectedItems = items.filter((item) => item.selected);
```

**Tìm:**
```ts
const selectedCount = selectedItems.reduce(
  (sum, item) => sum + item.quantity,
  0,
);
```

Hoặc:
```ts
const selectedCount = selectedItems.length;
```

**Thay bằng:**
```ts
const selectedCount = new Set(
  selectedItems.map((item) => item.productId),
).size;
```

Nếu `selectedItems` chưa có, thay toàn bộ cụm bằng:

```ts
const selectedItems = items.filter((item) => item.selected);
const selectedCount = new Set(
  selectedItems.map((item) => item.productId),
).size;
```

> Giữ nguyên mọi logic tính `totalPrice`, `shippingFee`, voucher, đặt hàng.

---

## 3. `ECommerceApp/app/order/[id].tsx`

### Xóa state `reordering`

**Xóa dòng:**
```ts
const [reordering, setReordering] = useState(false);
```

### Xóa toàn bộ hàm `handleReorder`

**Xóa toàn bộ block dạng:**
```ts
const handleReorder = async () => {
  // ...
  // addItem(...)
  // setReordering(...)
  // router.push('/cart')
  // ...
};
```

Nếu sau khi xóa, các import/context sau không còn dùng thì xóa luôn để tránh lỗi TypeScript `noUnusedLocals`:

```ts
// Ví dụ:
// addItem
// Alert
// useCart nếu không còn dùng
```

### Sửa cụm nút hành động cuối màn hình

**Tìm cụm JSX tương tự:**
```tsx
{order.status === 'delivered' ? (
  <View style={styles.footerRow}>
    <PrimaryButton
      title="Đặt lại đơn hàng"
      onPress={handleReorder}
      loading={reordering}
      style={{ flex: 1 }}
    />
    <PrimaryButton
      title="Đánh giá sản phẩm"
      onPress={() => {
        // handler đánh giá hiện có
      }}
      style={{ flex: 1 }}
    />
  </View>
) : order.status === 'cancelled' ? (
  <PrimaryButton
    title="Đặt lại đơn hàng"
    onPress={handleReorder}
    loading={reordering}
    style={{ flex: 1 }}
  />
) : null}
```

**Thay bằng:**
```tsx
{order.status === 'delivered' && (
  <PrimaryButton
    title="Đánh giá sản phẩm"
    onPress={() => {
      // GIỮ NGUYÊN đúng handler đánh giá hiện có của nút "Đánh giá sản phẩm"
    }}
    style={{ flex: 1 }}
  />
)}
```

Kết quả yêu cầu:
- `delivered`: chỉ còn **Đánh giá sản phẩm**, full width với `style={{ flex: 1 }}`.
- `cancelled`: **không còn nút Đặt lại / Đặt lại đơn hàng**.
- Không còn `reordering`, không còn `handleReorder`.

> Lưu ý: Giữ nguyên chính xác biểu thức `onPress` của nút “Đánh giá sản phẩm” đang có trong file. Chỉ bỏ nút “Đặt lại” và wrapper `View` nếu không cần.

---

## 4. `ECommerceApp/app/orders.tsx`

### Xóa state/hàm reorder

Xóa các phần không còn dùng nếu có:

```ts
const [reordering, setReordering] = useState<string | null>(null);
```

```ts
const handleReorder = async (order: Order) => {
  // ...
};
```

Xóa các import/context chỉ phục vụ reorder nếu không còn dùng, ví dụ:

```ts
// addItem
// Alert
```

### Tab Tất cả — xóa nút “Mua lại”

**Tìm cụm tương tự:**
```tsx
<View style={styles.cardActions}>
  <SecondaryButton
    title="Mua lại"
    onPress={() => handleReorder(order)}
  />
  <SecondaryButton
    title="Chi tiết"
    onPress={() => handleViewDetail(order)}
  />
</View>
```

**Thay bằng:**
```tsx
<View style={styles.cardActions}>
  <SecondaryButton
    title="Chi tiết"
    onPress={() => handleViewDetail(order)}
  />
</View>
```

### Tab Đã giao — xóa nút “Đặt lại”

**Tìm cụm tương tự:**
```tsx
<View style={styles.cardActions}>
  <PrimaryButton
    title="Đặt lại"
    onPress={() => handleReorder(order)}
  />
  <PrimaryButton
    title={order.reviewed ? 'Xem đánh giá' : 'Đánh giá'}
    onPress={() => handleReview(order)}
  />
</View>
```

**Thay bằng:**
```tsx
<View style={styles.cardActions}>
  <PrimaryButton
    title={order.reviewed ? 'Xem đánh giá' : 'Đánh giá'}
    onPress={() => handleReview(order)}
  />
</View>
```

Nếu card đã giao dùng title “Đánh giá sản phẩm” / “Xem đánh giá” thì giữ nguyên title đó, chỉ xóa nút “Đặt lại”.

### Tab Đã hủy / trạng thái hủy

Xóa mọi nhánh render nút:

```tsx
<SecondaryButton title="Mua lại" ... />
```

hoặc:

```tsx
<PrimaryButton title="Đặt lại đơn hàng" ... />
```

Chỉ giữ:

```tsx
<SecondaryButton
  title="Chi tiết"
  onPress={() => handleViewDetail(order)}
/>
```

---

## Checklist kiểm tra sau chỉnh sửa

Chạy:

```bash
cd ECommerceApp
npx tsc --noEmit
```

Kiểm tra không còn sót:

```bash
rg "reordering|handleReorder|Đặt lại|Mua lại" app src
```

Kết quả mong muốn:
- `totalItems = new Set(items.map(i => i.productId)).size`
- `selectedCount = new Set(...productId...).size`
- Không còn nút “Đặt lại” / “Mua lại”.
- `order/[id].tsx`: delivered chỉ còn nút “Đánh giá sản phẩm”; cancelled không còn nút đặt lại.
- `orders.tsx`: card chỉ còn “Chi tiết”, “Đánh giá” hoặc “Xem đánh giá”.
- `tsc --noEmit` đạt 0 lỗi.