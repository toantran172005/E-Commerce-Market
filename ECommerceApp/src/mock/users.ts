import { UserProfile } from '../types';

/** User kèm mật khẩu — CHỈ dùng trong mock/auth service. */
export type MockUser = UserProfile & { password: string };

export const MOCK_USERS: MockUser[] = [
  {
    uid: 'user-demo',
    email: 'demo@shop.vn',
    fullName: 'Trần Minh Alex',
    phoneNumber: '+84 901 284 920',
    address: '248 Đường Nguyễn Văn Cừ, Phường 4, Quận 5, TP. Hồ Chí Minh',
    password: '123456',
    createdAt: '2025-06-12T09:00:00Z',
  },
  {
    uid: 'user-mai',
    email: 'mai.nguyen@example.com',
    fullName: 'Nguyễn Hồng Mai',
    phoneNumber: '+84 912 345 678',
    address: '15 Nguyễn Trãi, Quận 1, TP. Hồ Chí Minh',
    password: '123456',
    createdAt: '2025-07-02T09:00:00Z',
  },
  {
    uid: 'user-minh',
    email: 'minh.tran@example.com',
    fullName: 'Trần Quang Minh',
    phoneNumber: '+84 902 555 112',
    address: '30 Lý Thường Kiệt, Quận Hoàn Kiếm, Hà Nội',
    password: '123456',
    createdAt: '2025-08-20T09:00:00Z',
  },
];

/** Tài khoản demo đăng nhập được: demo@shop.vn / 123456 */
export const DEMO_USER = MOCK_USERS[0];

export const GUEST_USER: UserProfile = {
  uid: 'user-guest',
  email: 'guest@shop.vn',
  fullName: 'Khách hàng',
  isGuest: true,
  createdAt: '2025-01-01T09:00:00Z',
};
