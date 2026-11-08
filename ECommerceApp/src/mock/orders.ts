import { Order, OrderItem, OrderStatus, OrderTimelineStep } from '../types';
import { MOCK_PRODUCTS } from './products';
import { MOCK_ADDRESSES } from './addresses';
import { MOCK_PAYMENT_METHODS } from './paymentMethods';
import { MOCK_SHIPPING_METHODS } from './shippingMethods';
import { MOCK_VOUCHERS } from './vouchers';
import { computeVoucherDiscount, TAX_RATE } from '../utils/pricing';

const addDays = (iso: string, days: number): string => {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString();
};

const fmtDate = (iso: string): string => {
  const d = new Date(iso);
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  return `${day}/${month}/${d.getFullYear()}`;
};

/** Timeline 4 bước, số bước hoàn thành theo trạng thái đơn. */
function buildTimeline(status: OrderStatus, createdAt: string): OrderTimelineStep[] {
  if (status === 'cancelled') {
    return [
      { key: 'ordered', label: 'Đặt hàng', icon: 'cart', date: fmtDate(createdAt), completed: true },
      { key: 'cancelled', label: 'Đã huỷ', icon: 'close', date: fmtDate(addDays(createdAt, 1)), completed: true },
    ];
  }

  const base = [
    { key: 'ordered', label: 'Đặt hàng', icon: 'cart' as const },
    { key: 'processing', label: 'Xử lý', icon: 'cube' as const },
    { key: 'shipped', label: 'Đang giao', icon: 'car' as const },
    { key: 'delivered', label: 'Đã giao', icon: 'home' as const },
  ];

  const completedCount =
    status === 'pending' ? 1 : status === 'processing' ? 2 : status === 'shipped' ? 3 : 4;

  return base.map((step, index) => ({
    key: step.key,
    label: step.label,
    icon: step.icon,
    date: fmtDate(addDays(createdAt, index + (status === 'pending' ? 0 : 1))),
    completed: index < completedCount,
  }));
}

interface OrderSeed {
  id: string;
  userId: string;
  status: OrderStatus;
  createdAt: string;
  items: Array<{ productId: string; variantId?: string; quantity: number }>;
  addressId?: string;
  paymentMethodId?: string;
  shippingMethodId?: string;
  voucherCode?: string;
  trackingCode?: string;
  cancelReason?: string;
  note?: string;
}

const ORDER_SEEDS: OrderSeed[] = [
  {
    id: 'ORD-21530', userId: 'user-demo', status: 'processing', createdAt: '2026-10-27T09:41:00Z',
    items: [{ productId: 'p-01', variantId: 'v-carbon', quantity: 1 }],
    addressId: 'addr-home', paymentMethodId: 'pay-visa', shippingMethodId: 'ship-standard',
    voucherCode: 'FREESHIP50', trackingCode: 'VN22015001',
    note: 'Gọi trước khi giao giúp mình nhé.',
  },
  {
    id: 'ORD-19842', userId: 'user-demo', status: 'delivered', createdAt: '2026-10-20T15:10:00Z',
    items: [
      { productId: 'p-07', variantId: 'v-256', quantity: 1 },
      { productId: 'p-24', variantId: 'v-46', quantity: 1 },
    ],
    addressId: 'addr-home', paymentMethodId: 'pay-mastercard', shippingMethodId: 'ship-express',
    trackingCode: 'VN19842002',
  },
  {
    id: 'ORD-16504', userId: 'user-demo', status: 'cancelled', createdAt: '2026-10-22T08:20:00Z',
    items: [{ productId: 'p-05', quantity: 1 }],
    addressId: 'addr-office', paymentMethodId: 'pay-cod', shippingMethodId: 'ship-standard',
    cancelReason: 'Đổi ý, muốn chọn sản phẩm khác phù hợp hơn.',
  },
  {
    id: 'ORD-20215', userId: 'user-demo', status: 'pending', createdAt: '2026-10-29T10:00:00Z',
    items: [{ productId: 'p-13', variantId: 'v-512', quantity: 1 }],
    addressId: 'addr-home', paymentMethodId: 'pay-momo', shippingMethodId: 'ship-standard',
  },
  {
    id: 'ORD-22157', userId: 'user-mai', status: 'pending', createdAt: '2026-10-28T14:30:00Z',
    items: [{ productId: 'p-18', quantity: 2 }],
    addressId: 'addr-apartment', paymentMethodId: 'pay-cod', shippingMethodId: 'ship-standard',
  },
  {
    id: 'ORD-23100', userId: 'user-demo', status: 'processing', createdAt: '2026-10-29T11:45:00Z',
    items: [
      { productId: 'p-02', variantId: 'v-black', quantity: 1 },
      { productId: 'p-19', quantity: 1 },
    ],
    addressId: 'addr-home', paymentMethodId: 'pay-visa', shippingMethodId: 'ship-express',
    voucherCode: 'NOVA10', trackingCode: 'VN23100003',
  },
  {
    id: 'ORD-18934', userId: 'user-minh', status: 'processing', createdAt: '2026-10-28T09:00:00Z',
    items: [{ productId: 'p-09', quantity: 1 }],
    addressId: 'addr-home', paymentMethodId: 'pay-zalopay', shippingMethodId: 'ship-standard',
    trackingCode: 'VN18934004',
  },
  {
    id: 'ORD-17582', userId: 'user-demo', status: 'shipped', createdAt: '2026-10-25T16:20:00Z',
    items: [{ productId: 'p-29', variantId: 'v-128', quantity: 1 }],
    addressId: 'addr-home', paymentMethodId: 'pay-visa', shippingMethodId: 'ship-express',
    voucherCode: 'SAVE25', trackingCode: 'VN17582005',
  },
  {
    id: 'ORD-20281', userId: 'user-demo', status: 'shipped', createdAt: '2026-10-24T10:35:00Z',
    items: [
      { productId: 'p-33', quantity: 1 },
      { productId: 'p-34', quantity: 1 },
    ],
    addressId: 'addr-office', paymentMethodId: 'pay-momo', shippingMethodId: 'ship-standard',
    trackingCode: 'VN20281006',
  },
  {
    id: 'ORD-21347', userId: 'user-mai', status: 'shipped', createdAt: '2026-10-23T13:50:00Z',
    items: [{ productId: 'p-03', quantity: 1 }],
    addressId: 'addr-apartment', paymentMethodId: 'pay-cod', shippingMethodId: 'ship-standard',
    trackingCode: 'VN21347007',
  },
  {
    id: 'ORD-22490', userId: 'user-demo', status: 'delivered', createdAt: '2026-10-22T09:15:00Z',
    items: [
      { productId: 'p-11', quantity: 1 },
      { productId: 'p-16', quantity: 1 },
    ],
    addressId: 'addr-home', paymentMethodId: 'pay-visa', shippingMethodId: 'ship-express',
    voucherCode: 'VIP50', trackingCode: 'VN22490008',
  },
  {
    id: 'ORD-16344', userId: 'user-demo', status: 'delivered', createdAt: '2026-10-21T17:40:00Z',
    items: [{ productId: 'p-36', quantity: 1 }],
    addressId: 'addr-home', paymentMethodId: 'pay-mastercard', shippingMethodId: 'ship-standard',
    trackingCode: 'VN16344009',
  },
  {
    id: 'ORD-17933', userId: 'user-minh', status: 'delivered', createdAt: '2026-10-20T11:25:00Z',
    items: [
      { productId: 'p-42', quantity: 1 },
      { productId: 'p-43', quantity: 1 },
    ],
    addressId: 'addr-home', paymentMethodId: 'pay-zalopay', shippingMethodId: 'ship-standard',
    voucherCode: 'FREESHIP50', trackingCode: 'VN17933010',
  },
  {
    id: 'ORD-21029', userId: 'user-demo', status: 'cancelled', createdAt: '2026-10-19T15:00:00Z',
    items: [{ productId: 'p-39', quantity: 1 }],
    addressId: 'addr-home', paymentMethodId: 'pay-momo', shippingMethodId: 'ship-standard',
    cancelReason: 'Hết hàng từ nhà cung cấp, shop đã chủ động huỷ đơn.',
  },
  {
    id: 'ORD-23851', userId: 'user-mai', status: 'cancelled', createdAt: '2026-10-18T08:55:00Z',
    items: [{ productId: 'p-47', quantity: 2 }],
    addressId: 'addr-apartment', paymentMethodId: 'pay-cod', shippingMethodId: 'ship-standard',
    cancelReason: 'Giao hàng chậm hơn dự kiến, khách yêu cầu huỷ.',
  },
];

function buildOrder(seed: OrderSeed): Order {
  const address = MOCK_ADDRESSES.find((a) => a.id === seed.addressId) ?? MOCK_ADDRESSES[0];
  const payment = MOCK_PAYMENT_METHODS.find((p) => p.id === seed.paymentMethodId) ?? MOCK_PAYMENT_METHODS[0];
  const shipping = MOCK_SHIPPING_METHODS.find((s) => s.id === seed.shippingMethodId) ?? MOCK_SHIPPING_METHODS[0];
  const voucher = MOCK_VOUCHERS.find((v) => v.code === seed.voucherCode) ?? null;

  const items: OrderItem[] = seed.items.map(({ productId, variantId, quantity }) => {
    const product = MOCK_PRODUCTS.find((p) => p.id === productId);
    return {
      productId,
      name: product?.name ?? 'Sản phẩm đã ẩn',
      price: product?.price ?? 0,
      quantity,
      imageUrl: product?.imageUrl ?? '',
      variantId,
    };
  });

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const baseShipping = subtotal >= shipping.freeOver ? 0 : shipping.fee;
  const discount = computeVoucherDiscount(voucher, subtotal, baseShipping);
  const isFreeShip = voucher?.type === 'freeShip' && subtotal >= voucher.minOrderValue;
  const shippingFee = isFreeShip ? 0 : baseShipping;
  const taxable = Math.max(subtotal - discount + shippingFee, 0);
  const tax = taxable * TAX_RATE;
  const totalAmount = Math.max(subtotal - discount + shippingFee + tax, 0);

  return {
    id: seed.id,
    userId: seed.userId,
    customerName: address.fullName,
    phoneNumber: address.phone,
    shippingAddress: address.address,
    items,
    subtotal,
    shippingFee,
    tax,
    discount,
    totalAmount,
    status: seed.status,
    currentStep: seed.status === 'delivered' ? 3 : ['pending', 'processing', 'shipped', 'cancelled'].indexOf(seed.status),
    canCancel: seed.status === 'pending' || seed.status === 'processing',
    cancelReason: seed.cancelReason,
    cancelledAt: seed.status === 'cancelled' ? seed.createdAt : undefined,
    createdAt: seed.createdAt,
    voucherCode: seed.voucherCode,
    paymentMethodId: payment.id,
    paymentMethodName: payment.name,
    shippingMethodId: shipping.id,
    shippingMethodName: shipping.name,
    trackingCode: seed.trackingCode ?? (seed.status === 'shipped' || seed.status === 'delivered'
      ? `VN${seed.id.replace('ORD-', '')}00`
      : undefined),
    timeline: buildTimeline(seed.status, seed.createdAt),
    note: seed.note,
  };
}

export const MOCK_ORDERS: Order[] = ORDER_SEEDS.map(buildOrder);
