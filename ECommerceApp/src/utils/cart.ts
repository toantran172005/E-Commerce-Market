import { CartItem, Product, ProductVariant } from '../types';

/** Tạo CartItem từ Product + biến thể (nếu chọn). */
export function toCartItem(
  product: Product,
  quantity: number,
  variant?: ProductVariant,
): CartItem {
  const item: CartItem = {
    id: cartItemKey(product.id, variant?.id),
    product,
    quantity,
    selected: true,
  };
  if (variant?.id) item.variantId = variant.id;
  if (variant?.name) item.variantName = variant.name;
  return item;
}

/** Key ổn định cho một dòng trong giỏ: sản phẩm + biến thể. */
export function cartItemKey(productId: string, variantId?: string): string {
  return `${productId}::${variantId ?? 'default'}`;
}

/** Tìm CartItem theo key. */
export function findCartItem(items: CartItem[], key: string): CartItem | undefined {
  return items.find((item) => item.id === key || cartItemKey(item.product.id, item.variantId) === key);
}
