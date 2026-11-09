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
import { ApiError } from '../services/http';
import { OrderService } from '../services/orderService';
import { computeCartTotals } from '../utils/pricing';
import { DEFAULT_SHIPPING_METHOD } from './CartContext';
import { useAuth } from './AuthContext';
import { useCart } from './CartContext';
import { useOrders } from './OrdersContext';
import { useNotifications } from './NotificationsContext';
import { useAddresses } from './AddressesContext';
import { usePaymentMethods } from './PaymentMethodsContext';

interface CheckoutContextValue {
  addressId: string | null;
  paymentMethodId: string | null;
  shippingMethodId: string | null;
  note: string;
  lastPlacedOrder: Order | null;
  placing: boolean;
  setAddressId: (id: string) => void;
  setPaymentMethodId: (id: string) => void;
  setShippingMethodId: (id: string) => void;
  setNote: (note: string) => void;
  placeOrder: () => Promise<Order>;
  reset: () => void;
}

const CheckoutContext = createContext<CheckoutContextValue | null>(null);

export function CheckoutProvider({
  children,
  resetKey = 0,
}: { children: ReactNode; resetKey?: number }) {
  const { user } = useAuth();
  const cart = useCart();
  const orders = useOrders();
  const notifications = useNotifications();
  const addresses = useAddresses();
  const payments = usePaymentMethods();

  const [addressId, setAddressId] = useState<string | null>(null);
  const [paymentMethodId, setPaymentMethodId] = useState<string | null>(null);
  const [shippingMethodId, setShippingMethodId] = useState<string | null>(DEFAULT_SHIPPING_METHOD.id);
  const [note, setNote] = useState('');
  const [lastPlacedOrder, setLastPlacedOrder] = useState<Order | null>(null);
  const [placing, setPlacing] = useState(false);

  // Tự chọn địa chỉ + thẻ mặc định khi dữ liệu tải xong.
  useEffect(() => {
    if (!addressId && addresses.defaultAddress) {
      setAddressId(addresses.defaultAddress.id);
    }
  }, [addressId, addresses.defaultAddress]);

  useEffect(() => {
    if (!paymentMethodId && payments.defaultMethod) {
      setPaymentMethodId(payments.defaultMethod.id);
    }
  }, [paymentMethodId, payments.defaultMethod]);

  useEffect(() => {
    setAddressId(null);
    setPaymentMethodId(null);
    setNote('');
    setLastPlacedOrder(null);
  }, [resetKey]);

  const placeOrder = useCallback(async (): Promise<Order> => {
    if (placing) {
      throw new ApiError('DUPLICATE_SUBMIT', 'Yêu cầu đặt hàng đang được xử lý, vui lòng chờ.');
    }

    if (!user) {
      throw new ApiError('AUTH_REQUIRED', 'Vui lòng đăng nhập trước khi thanh toán.');
    }

    const selectedItems = cart.items.filter((item) => item.selected);
    if (selectedItems.length === 0) {
      throw new ApiError('CART_EMPTY', 'Giỏ hàng trống hoặc chưa chọn sản phẩm.');
    }

    const address = addresses.addresses.find((a) => a.id === addressId) ?? addresses.defaultAddress;
    if (!address) {
      throw new ApiError('ADDRESS_REQUIRED', 'Vui lòng chọn địa chỉ giao hàng.');
    }

    const payment = payments.methods.find((p) => p.id === paymentMethodId) ?? payments.defaultMethod;
    if (!payment) {
      throw new ApiError('PAYMENT_REQUIRED', 'Vui lòng chọn phương thức thanh toán.');
    }

    const shipping =
      cart.shippingMethods.find((s) => s.id === shippingMethodId) ?? cart.shippingMethods[0] ?? DEFAULT_SHIPPING_METHOD;
    const totals = computeCartTotals(cart.items, cart.voucher, shipping);

    setPlacing(true);
    try {
      const created = await OrderService.createOrder({
        userId: user.uid,
        customerName: address.fullName,
        phoneNumber: address.phone,
        shippingAddress: address.address,
        items: selectedItems.map((item) => ({
          productId: item.product.id,
          name: item.product.name,
          price: item.product.price,
          quantity: item.quantity,
          imageUrl: item.product.imageUrl,
          variantId: item.variantId,
          variantName: item.variantName,
        })),
        addressId: address.id,
        paymentMethodId: payment.id,
        paymentMethodName: payment.name,
        shippingMethodId: shipping.id,
        shippingMethodName: shipping.name,
        voucherCode: cart.voucher?.code,
        note: note.trim() || undefined,
      });

      orders.addOrder(created);
      cart.clearSelected();
      cart.removeVoucher();
      setLastPlacedOrder(created);

      await notifications.addNotification({
        type: 'order',
        title: 'Đặt hàng thành công',
        message: `Đơn ${created.id} đã được ghi nhận. Tổng ${totals.total.toLocaleString('vi-VN')}đ (đã gồm thuế).`,
        data: { orderId: created.id },
      });

      return created;
    } finally {
      setPlacing(false);
    }
  }, [placing, user, cart, orders, notifications, addresses, payments, addressId, paymentMethodId, shippingMethodId, note]);

  const reset = useCallback(() => {
    setAddressId(null);
    setPaymentMethodId(null);
    setShippingMethodId(DEFAULT_SHIPPING_METHOD.id);
    setNote('');
    setLastPlacedOrder(null);
  }, []);

  const value = useMemo(
    () => ({
      addressId,
      paymentMethodId,
      shippingMethodId,
      note,
      lastPlacedOrder,
      placing,
      setAddressId,
      setPaymentMethodId,
      setShippingMethodId,
      setNote,
      placeOrder,
      reset,
    }),
    [
      addressId,
      paymentMethodId,
      shippingMethodId,
      note,
      lastPlacedOrder,
      placing,
      setAddressId,
      setPaymentMethodId,
      setShippingMethodId,
      setNote,
      placeOrder,
      reset,
    ],
  );

  return <CheckoutContext.Provider value={value}>{children}</CheckoutContext.Provider>;
}

export function useCheckout(): CheckoutContextValue {
  const ctx = useContext(CheckoutContext);
  if (!ctx) throw new Error('useCheckout phải được dùng bên trong CheckoutProvider');
  return ctx;
}
