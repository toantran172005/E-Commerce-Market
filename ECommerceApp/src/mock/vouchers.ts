import { Voucher } from '../types';

/**
 * Voucher demo gồm đủ trường hợp:
 * - hợp lệ (% và số tiền)
 * - hết hạn (isActive: false)
 * - đơn tối thiểu
 * - miễn phí ship
 * - đã dùng hết lượt
 */
export const MOCK_VOUCHERS: Voucher[] = [
  {
    id: 'voucher-nova10',
    code: 'NOVA10',
    title: 'Giảm 10% cho đơn từ $100',
    type: 'percent',
    value: 10,
    minOrderValue: 100,
    maxDiscount: 50,
    startsAt: '2026-09-01T00:00:00Z',
    expiresAt: '2026-12-31T23:59:59Z',
    usageLimit: 500,
    usedCount: 124,
    isActive: true,
  },
  {
    id: 'voucher-flash20',
    code: 'FLASH20',
    title: 'Flash Sale giảm 20% đơn từ $200',
    type: 'percent',
    value: 20,
    minOrderValue: 200,
    maxDiscount: 100,
    startsAt: '2026-11-01T00:00:00Z',
    expiresAt: '2026-11-20T23:59:59Z',
    usageLimit: 300,
    usedCount: 270,
    isActive: true,
  },
  {
    id: 'voucher-welcome15',
    code: 'WELCOME15',
    title: 'Chào mừng thành viên mới -15%',
    type: 'percent',
    value: 15,
    minOrderValue: 50,
    maxDiscount: 30,
    startsAt: '2026-08-01T00:00:00Z',
    expiresAt: '2026-10-31T23:59:59Z',
    usageLimit: 1000,
    usedCount: 998,
    isActive: false, // đã hết hạn
  },
  {
    id: 'voucher-save25',
    code: 'SAVE25',
    title: 'Giảm $25 cho đơn từ $250',
    type: 'fixed',
    value: 25,
    minOrderValue: 250,
    startsAt: '2026-10-01T00:00:00Z',
    expiresAt: '2026-12-15T23:59:59Z',
    usageLimit: 400,
    usedCount: 89,
    isActive: true,
  },
  {
    id: 'voucher-vip50',
    code: 'VIP50',
    title: 'Ưu đãi VIP giảm $50 đơn từ $500',
    type: 'fixed',
    value: 50,
    minOrderValue: 500,
    startsAt: '2026-10-01T00:00:00Z',
    expiresAt: '2026-12-31T23:59:59Z',
    usageLimit: 200,
    usedCount: 200, // hết lượt
    isActive: true,
  },
  {
    id: 'voucher-freeship50',
    code: 'FREESHIP50',
    title: 'Miễn phí giao hàng đơn từ $50',
    type: 'freeShip',
    value: 0,
    minOrderValue: 50,
    startsAt: '2026-09-01T00:00:00Z',
    expiresAt: '2026-12-31T23:59:59Z',
    usageLimit: 9999,
    usedCount: 2100,
    isActive: true,
  },
  {
    id: 'voucher-summer5',
    code: 'SUMMER5',
    title: 'Hè rực rỡ -5% (đã hết hạn)',
    type: 'percent',
    value: 5,
    minOrderValue: 0,
    startsAt: '2026-06-01T00:00:00Z',
    expiresAt: '2026-07-31T23:59:59Z',
    usageLimit: 500,
    usedCount: 480,
    isActive: false,
  },
];
