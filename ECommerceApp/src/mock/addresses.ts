import { Address } from '../types';

export const MOCK_ADDRESSES: Address[] = [
  {
    id: 'addr-home',
    label: 'Nhà riêng',
    fullName: 'Trần Minh Alex',
    phone: '+84 901 284 920',
    address: '248 Đường Nguyễn Văn Cừ, Phường 4, Quận 5, TP. Hồ Chí Minh',
    isDefault: true,
  },
  {
    id: 'addr-office',
    label: 'Văn phòng',
    fullName: 'Trần Minh Alex',
    phone: '+84 901 284 920',
    address: 'Tòa nhà Bitexco, Tầng 12, Số 2 Hải Triều, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
    isDefault: false,
  },
  {
    id: 'addr-parents',
    label: 'Nhà ba mẹ',
    fullName: 'Trần Minh Alex',
    phone: '+84 901 284 920',
    address: '50 Đường Lê Lợi, Phường 5, TP. Vũng Tàu, Tỉnh Bà Rịa - Vũng Tàu',
    isDefault: false,
  },
  {
    id: 'addr-apartment',
    label: 'Căn hộ',
    fullName: 'Nguyễn Hồng Mai',
    phone: '+84 912 345 678',
    address: 'Chung cư Sunshine, 770 Kha Vạn Cân, TP. Thủ Đức, TP. Hồ Chí Minh',
    isDefault: false,
  },
];
