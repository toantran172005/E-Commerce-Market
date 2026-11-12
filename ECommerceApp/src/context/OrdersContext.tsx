import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from 'react';
import { Order } from '../types';
import { OrderService } from '../services/orderService';
import { CatalogService } from '../services/catalogService';
import { useAuth } from './AuthContext';
import { useCart } from './CartContext';
import { useNotifications } from './NotificationsContext';

interface OrdersContextValue {
  orders: Order[];
  loading: boolean;
  error: string | null;
  loadOrders: () => Promise<void>;
  getOrderById: (id: string) => Order | undefined;
  addOrder: (order: Order) => void;
  cancelOrder: (id: string, reason: string) => Promise<Order>;
  reorder: (id: string) => Promise<void>;
  markItemReviewed: (orderId: string, productId: string) => void;
  reset: () => void;
}

const OrdersContext = createContext<OrdersContextValue | null>(null);

export function OrdersProvider({
  children,
  resetKey = 0,
}: { children: ReactNode; resetKey?: number }) {
  const { user } = useAuth();
  const { addItem } = useCart();
  const { loadNotifications } = useNotifications();
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

  const transitionInFlightRef = useRef<Set<string>>(new Set());

  // Tự động chuyển trạng thái đơn hàng mỗi 5s
  useEffect(() => {
    if (!user?.uid) return;

    const interval = setInterval(() => {
      const now = Date.now();

      orders.forEach((order) => {
        const isActive =
          order.status === 'pending' ||
          order.status === 'processing' ||
          order.status === 'shipped';

        if (!isActive) return;

        let nextStatusAt = order.nextStatusAt;
        if (!nextStatusAt) {
          const createdTime = typeof order.createdAt === 'number'
            ? order.createdAt
            : Date.parse(String(order.createdAt)) || now;
          nextStatusAt = createdTime + 7000;
        }

        if (now < nextStatusAt) return;
        if (transitionInFlightRef.current.has(order.id)) return;

        transitionInFlightRef.current.add(order.id);

        OrderService.advanceOrderStatusIfDue(order.id)
          .then((updated) => {
            if (updated) {
              setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
              void loadNotifications();
            }
          })
          .catch(() => {})
          .finally(() => {
            transitionInFlightRef.current.delete(order.id);
          });
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [orders, user?.uid, loadNotifications]);

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
    try {
      await loadNotifications();
    } catch {}
    return updated;
  }, [loadNotifications]);

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

  const markItemReviewed = useCallback((orderId: string, productId: string) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        const currentReviewed = o.reviewedItemIds || [];
        if (currentReviewed.includes(productId)) return o;
        return {
          ...o,
          reviewedItemIds: [...currentReviewed, productId],
        };
      })
    );
  }, []);

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
      markItemReviewed,
      reset,
    }),
    [orders, loading, error, loadOrders, getOrderById, addOrder, cancelOrder, reorder, markItemReviewed, reset],
  );

  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>;
}

export function useOrders(): OrdersContextValue {
  const ctx = useContext(OrdersContext);
  if (!ctx) throw new Error('useOrders phải được dùng bên trong OrdersProvider');
  return ctx;
}
