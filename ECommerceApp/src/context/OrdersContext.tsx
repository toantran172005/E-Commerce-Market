import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import { Order } from '../types';
import { getErrorMessage, ApiError } from '../services/http';
import { OrderService } from '../services/order.service';
import { useAuth } from './AuthContext';
import { useCart } from './CartContext';
import { MOCK_PRODUCTS } from '../mock/products';

interface OrdersContextValue {
  orders: Order[];
  loading: boolean;
  error: string | null;
  loadOrders: () => Promise<void>;
  getOrderById: (id: string) => Order | undefined;
  addOrder: (order: Order) => void;
  cancelOrder: (id: string, reason: string) => Promise<Order>;
  reorder: (id: string) => Promise<void>;
  reset: () => void;
}

const OrdersContext = createContext<OrdersContextValue | null>(null);

export function OrdersProvider({
  children,
  resetKey = 0,
}: { children: ReactNode; resetKey?: number }) {
  const { user } = useAuth();
  const { addItem } = useCart();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const uid = user?.uid ?? 'user-demo';
      const data = await OrderService.listOrders(uid);
      setOrders(data);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders, resetKey]);

  const getOrderById = useCallback(
    (id: string) => orders.find((o) => o.id === id),
    [orders],
  );

  const addOrder = useCallback((order: Order) => {
    setOrders((prev) => [order, ...prev]);
  }, []);

  const cancelOrder = useCallback(async (id: string, reason: string) => {
    const updated = await OrderService.cancelOrder(id, reason);
    setOrders((prev) => prev.map((o) => (o.id === id ? updated : o)));
    return updated;
  }, []);

  const reorder = useCallback(async (id: string) => {
    const items = await OrderService.reorder(id);
    items.forEach((item) => {
      const product = MOCK_PRODUCTS.find((p) => p.id === item.productId);
      if (product) {
        addItem(product, item.quantity);
      }
    });
  }, [addItem]);

  const reset = useCallback(() => {
    void loadOrders();
  }, [loadOrders]);

  const value = useMemo(
    () => ({
      orders,
      loading,
      error: error as string | null,
      loadOrders,
      getOrderById,
      addOrder,
      cancelOrder,
      reorder,
      reset,
    }),
    [orders, loading, error, loadOrders, getOrderById, addOrder, cancelOrder, reorder, reset],
  );

  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>;
}

export function useOrders(): OrdersContextValue {
  const ctx = useContext(OrdersContext);
  if (!ctx) {
    throw new Error('useOrders phải được dùng bên trong <OrdersProvider>');
  }
  return ctx;
}

export type { ApiError };
