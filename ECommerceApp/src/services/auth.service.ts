import { UserProfile } from '../types';
import { ApiError, apiError, respond } from './http';
import { DEMO_USER, GUEST_USER, MOCK_USERS, MockUser } from '../mock/users';

export interface RegisterInput {
  fullName: string;
  email: string;
  phone: string;
  password: string;
}

function toSafeUser(user: MockUser): UserProfile {
  const { password: _password, ...safe } = user;
  return safe;
}

/**
 * Giả lập Auth API.
 *
 * POST /auth/login
 * POST /auth/register
 * POST /auth/logout
 * GET  /auth/me
 * PATCH /users/me
 * POST /auth/login-guest
 */
export const AuthService = {
  /** POST /auth/login — body { email, password } */
  async login(email: string, password: string): Promise<UserProfile> {
    await respond(null);
    const user = MOCK_USERS.find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase(),
    );
    if (!user || user.password !== password) {
      apiError('AUTH_INVALID_CREDENTIALS', 'Email hoặc mật khẩu không đúng.');
    }
    return toSafeUser(user as MockUser);
  },

  /** POST /auth/register — tạo tài khoản mới */
  async register(input: RegisterInput): Promise<UserProfile> {
    await respond(null);
    const existed = MOCK_USERS.some(
      (u) => u.email.toLowerCase() === input.email.trim().toLowerCase(),
    );
    if (existed) {
      apiError('AUTH_EMAIL_EXISTS', 'Email đã được đăng ký. Vui lòng chọn email khác.');
    }
    const newUser: MockUser = {
      uid: `user-${Date.now()}`,
      email: input.email.trim().toLowerCase(),
      fullName: input.fullName.trim(),
      phoneNumber: input.phone.trim(),
      password: input.password,
      createdAt: new Date().toISOString(),
    };
    MOCK_USERS.push(newUser);
    return toSafeUser(newUser);
  },

  /** POST /auth/logout */
  async logout(): Promise<void> {
    await respond(null);
  },

  /** GET /auth/me */
  async getProfile(uid: string): Promise<UserProfile> {
    await respond(null);
    const user = MOCK_USERS.find((u) => u.uid === uid) ?? DEMO_USER;
    return toSafeUser(user);
  },

  /** PATCH /users/me — cập nhật hồ sơ */
  async updateProfile(uid: string, patch: Partial<UserProfile>): Promise<UserProfile> {
    await respond(null);
    const user = MOCK_USERS.find((u) => u.uid === uid);
    if (!user) apiError('AUTH_USER_NOT_FOUND', 'Không tìm thấy tài khoản.');
    Object.assign(user, patch);
    return toSafeUser(user);
  },

  /** POST /auth/login-guest — đăng nhập dạng khách */
  async loginAsGuest(): Promise<UserProfile> {
    await respond(null);
    return GUEST_USER;
  },
};

export type { ApiError };
