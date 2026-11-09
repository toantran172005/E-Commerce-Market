import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import { CartItem, Product, ShippingMethod, Voucher } from '../types';
import { VoucherService } from '../services/voucherService';
import { CatalogService } from '../services/catalogService';
import { computeCartTotals, computeSubtotal, CartTotals } from '../utils/pricing';
import { cartItemKey, toCartItem } from '../utils/cart';

export const DEFAULT_SHIPPING_METHOD: ShippingMethod = {
  id: 'ship_standard',
  type: 'standard',
  name: 'Giao hàng tiêu chuẩn',
  description: 'Tiết kiệm chi phí',
  estimatedDays: '3 - 5 ngày',
  fee: 30000,
  freeOver: 500000,
};

interface CartContextValue {
  items: CartItem[];
  voucher: Voucher | null;
  totalItems: number;
  selectedCount: number;
  totals: CartTotals;
  shippingMethods: ShippingMethod[];
  selectedShipping: ShippingMethod;
  setSelectedShippingId: (id: string) => void;
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

export function CartProvider({
  children,
  resetKey = 0,
}: { children: ReactNode; resetKey?: number }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [voucher, setVoucher] = useState<Voucher | null>(null);
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([DEFAULT_SHIPPING_METHOD]);
  const [selectedShippingId, setSelectedShippingId] = useState<string>(DEFAULT_SHIPPING_METHOD.id);

  // Load shipping methods from CatalogService
  useEffect(() => {
    let isMounted = true;
    CatalogService.getShippingMethods().then((methods) => {
      if (isMounted && methods && methods.length > 0) {
        setShippingMethods(methods);
      }
    }).catch(() => {});
    return () => { isMounted = false; };
  }, []);

  // Khi logout, AuthProvider bump resetKey -> reset giỏ.
  useEffect(() => {
    setItems([]);
    setVoucher(null);
  }, [resetKey]);

  const selectedShipping = useMemo(() => {
    return shippingMethods.find((s) => s.id === selectedShippingId) ?? shippingMethods[0] ?? DEFAULT_SHIPPING_METHOD;
  }, [shippingMethods, selectedShippingId]);

  const addItem = useCallback((product: Product, quantity = 1, variantId?: string) => {
    const key = cartItemKey(product.id, variantId);
    setItems((prev) => {
      const existing = prev.find((i) => i.id === key);
      if (existing) {
        return prev.map((i) =>
          i.id === key ? { ...i, quantity: Math.min(10, i.quantity + quantity), selected: true } : i,
        );
      }
      return [
        ...prev,
        {
          ...toCartItem(product, quantity),
          id: key,
          variantId,
          variantName: variantId
            ? product.variants?.find((v) => v.id === variantId)?.name ?? variantId
            : undefined,
          selected: true,
        },
      ];
    });
  }, []);

  const removeItem = useCallback((itemId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
  }, []);

  const updateQuantity = useCallback((itemId: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((i) => {
          if (i.id !== itemId) return i;
          const next = i.quantity + delta;
          return next > 0 ? { ...i, quantity: Math.min(10, next) } : null;
        })
        .filter((i): i is CartItem => i !== null),
    );
  }, []);

  const toggleSelect = useCallback((itemId: string) => {
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, selected: !i.selected } : i)),
    );
  }, []);

  const applyVoucher = useCallback(
    async (code: string) => {
      const subtotal = computeSubtotal(items);
      const selectedCats = items
        .filter((i) => i.selected && i.product.category)
        .map((i) => i.product.category!);
      const res = await VoucherService.validateVoucher(
        code,
        subtotal,
        selectedShipping.fee,
        selectedCats,
      );
      setVoucher(res.voucher);
      return res;
    },
    [items, selectedShipping],
  );

  const removeVoucher = useCallback(() => {
    setVoucher(null);
  }, []);

  const clearSelected = useCallback(() => {
    setItems((prev) => prev.filter((i) => !i.selected));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setVoucher(null);
  }, []);

  const reset = useCallback(() => {
    setItems([]);
    setVoucher(null);
  }, []);

  const totalItems = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  );

  const selectedCount = useMemo(
    () => items.filter((i) => i.selected).reduce((sum, item) => sum + item.quantity, 0),
    [items],
  );

  const totals = useMemo(
    () => computeCartTotals(items, voucher, selectedShipping),
    [items, voucher, selectedShipping],
  );

  const value = useMemo(
    () => ({
      items,
      voucher,
      totalItems,
      selectedCount,
      totals,
      shippingMethods,
      selectedShipping,
      setSelectedShippingId,
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
      items,
      voucher,
      totalItems,
      selectedCount,
      totals,
      shippingMethods,
      selectedShipping,
      addItem,
      removeItem,
      updateQuantity,
      toggleSelect,
      applyVoucher,
      removeVoucher,
      clearSelected,
      clearCart,
      reset,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart phải được dùng bên trong CartProvider');
  return ctx;
}
