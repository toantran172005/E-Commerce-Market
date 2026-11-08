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
import { OrderService } from '../services/order.service';
import { CatalogService } from '../services/catalog.service';
import { useAuth } from './AuthContext';
import { useCart } from './CartContext';

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
    if (!user) {
      setOrders([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await OrderService.listOrders(user.uid);
      setOrders(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Không tải được danh sách đơn hàng');
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
    for (const item of items) {
      try {
        const product = await CatalogService.getProductById(item.productId);
        if (product) {
          addItem(product, item.quantity);
        }
      } catch {
        // Skip unavailable items
      }
    }
  }, [addItem]);

  const reset = useCallback(() => {
    void loadOrders();
  }, [loadOrders]);

  const value = useMemo(
    () => ({
      orders,
      loading,
      error,
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
  if (!ctx) throw new Error('useOrders phải được dùng bên trong OrdersProvider');
  return ctx;
}
