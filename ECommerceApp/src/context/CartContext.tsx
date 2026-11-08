import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import { CartItem, Product, Voucher } from '../types';
import { VoucherService } from '../services/voucher.service';
import { computeCartTotals, computeSubtotal, CartTotals } from '../utils/pricing';
import { cartItemKey, toCartItem } from '../utils/cart';
import { MOCK_PRODUCTS } from '../mock/products';
import { MOCK_SHIPPING_METHODS } from '../mock/shippingMethods';

interface CartContextValue {
  items: CartItem[];
  voucher: Voucher | null;
  totalItems: number;
  selectedCount: number;
  totals: CartTotals;
  addItem: (product: Product, quantity?: number, variantId?: string) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, delta: number) => void;
  toggleSelect: (itemId: string) => void;
  applyVoucher: (code: string) => Promise<{ voucher: Voucher; discount: number }>;
  removeVoucher: () => void;
  clearSelected: () => void;
  clearCart: () => void;
  reset: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

/** Giỏ demo khởi tạo có sẵn 1 sản phẩm để các màn hình có dữ liệu hiển thị. */
function seedCart(): CartItem[] {
  return [toCartItem(MOCK_PRODUCTS[0], 1)];
}

export function CartProvider({
  children,
  resetKey = 0,
}: { children: ReactNode; resetKey?: number }) {
  const [items, setItems] = useState<CartItem[]>(seedCart);
  const [voucher, setVoucher] = useState<Voucher | null>(null);

  // Khi logout, AuthProvider bump resetKey -> reset giỏ.
  useEffect(() => {
    setItems(seedCart());
    setVoucher(null);
  }, [resetKey]);

  const addItem = useCallback((product: Product, quantity = 1, variantId?: string) => {
    const key = cartItemKey(product.id, variantId);
    setItems((prev) => {
      const existing = prev.find((i) => i.id === key);
      if (existing) {
        return prev.map((i) =>
          i.id === key ? { ...i, quantity: Math.min(10, i.quantity + quantity), selected: true } : i,
        );
      }
      const variant = product.variants?.find((v) => v.id === variantId);
      return [...prev, toCartItem(product, quantity, variant)];
    });
  }, []);

  const removeItem = useCallback((itemId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
  }, []);

  const updateQuantity = useCallback((itemId: string, delta: number) => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === itemId
          ? { ...i, quantity: Math.max(1, Math.min(10, i.quantity + delta)) }
          : i,
      ),
    );
  }, []);

  const toggleSelect = useCallback((itemId: string) => {
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, selected: !(i.selected ?? true) } : i)),
    );
  }, []);

  const applyVoucher = useCallback(async (code: string) => {
    const result = await VoucherService.validateVoucher(code, computeSubtotal(items));
    setVoucher(result.voucher);
    return result;
  }, [items]);

  const removeVoucher = useCallback(() => setVoucher(null), []);

  const clearSelected = useCallback(() => {
    setItems((prev) => prev.filter((i) => !i.selected));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setVoucher(null);
  }, []);

  const reset = useCallback(() => {
    setItems(seedCart());
    setVoucher(null);
  }, []);

  const totalItems = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);
  const selectedCount = useMemo(
    () => items.filter((i) => i.selected).reduce((sum, i) => sum + i.quantity, 0),
    [items],
  );

  const totals = useMemo(
    () => computeCartTotals(items, voucher, MOCK_SHIPPING_METHODS[0]),
    [items, voucher],
  );

  const value = useMemo(
    () => ({
      items,
      voucher,
      totalItems,
      selectedCount,
      totals,
      addItem,
      removeItem,
      updateQuantity,
      toggleSelect,
      applyVoucher,
      removeVoucher,
      clearSelected,
      clearCart,
      reset,
    }),
    [
      items, voucher, totalItems, selectedCount, totals,
      addItem, removeItem, updateQuantity, toggleSelect,
      applyVoucher, removeVoucher, clearSelected, clearCart, reset,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart phải được dùng bên trong <CartProvider>');
  }
  return ctx;
}
