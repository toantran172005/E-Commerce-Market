import { PaymentMethod } from '../types';

export const MOCK_PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'pay-cod',
    type: 'cod',
    name: 'Thanh toán khi nhận hàng',
    detail: 'COD - Trả tiền mặt khi giao',
    isDefault: true,
  },
];
