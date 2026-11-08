import { ShippingMethod } from '../types';

export const MOCK_SHIPPING_METHODS: ShippingMethod[] = [
  {
    id: 'ship-standard',
    type: 'standard',
    name: 'Giao hàng tiêu chuẩn',
    description: 'Giao hàng tiết kiệm toàn quốc',
    estimatedDays: '2 - 4 ngày',
    fee: 2,
    freeOver: 50,
  },
  {
    id: 'ship-express',
    type: 'express',
    name: 'Giao hàng hoả tốc',
    description: 'Ưu tiên xử lý & giao nhanh',
    estimatedDays: '1 - 2 ngày',
    fee: 8,
    freeOver: 100,
  },
  {
    id: 'ship-same-day',
    type: 'sameDay',
    name: 'Giao trong ngày',
    description: 'Áp dụng nội thành TP.HCM và Hà Nội',
    estimatedDays: 'Trong ngày',
    fee: 15,
    freeOver: 200,
  },
];
