import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInAnonymously,
  updateProfile as updateFirebaseProfile,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { UserProfile } from '../types';
import { apiError, mapFirebaseError, IS_MOCK_MODE } from './http';
import { DEMO_USER, GUEST_USER, MOCK_USERS, MockUser } from '../mock/users';

export interface RegisterInput {
  fullName: string;
  email: string;
  phone: string;
  password: string;
}

let mockUsersDb: MockUser[] = [...MOCK_USERS];

function toSafeMockUser(user: MockUser): UserProfile {
  const { password: _password, ...safe } = user;
  return safe;
}

/**
 * Service xác thực người dùng sử dụng Firebase Authentication kết hợp Cloud Firestore.
 */
export const AuthService = {
  /** Đăng nhập email & mật khẩu */
  async login(email: string, password: string): Promise<UserProfile> {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      apiError('AUTH_INVALID_INPUT', 'Vui lòng nhập đầy đủ email và mật khẩu.');
    }

    if (IS_MOCK_MODE) {
      const user = mockUsersDb.find((u) => u.email.toLowerCase() === trimmedEmail.toLowerCase());
      if (!user || user.password !== password) {
        apiError('AUTH_INVALID_CREDENTIALS', 'Email hoặc mật khẩu không chính xác.');
      }
      return toSafeMockUser(user);
    }

    try {
      const credential = await signInWithEmailAndPassword(auth, trimmedEmail, password);
      return await this.getProfile(credential.user.uid);
    } catch (err: unknown) {
      // Fallback in case of mock user login during hybrid testing
      const mockMatch = mockUsersDb.find((u) => u.email.toLowerCase() === trimmedEmail.toLowerCase());
      if (mockMatch && mockMatch.password === password) {
        return toSafeMockUser(mockMatch);
      }
      throw mapFirebaseError(err, 'Email hoặc mật khẩu không chính xác.');
    }
  },

  /** Đăng ký tài khoản mới */
  async register(input: RegisterInput): Promise<UserProfile> {
    const trimmedEmail = input.email.trim().toLowerCase();
    const fullName = input.fullName.trim();
    const phone = input.phone.trim();

    if (!trimmedEmail || !input.password || !fullName) {
      apiError('AUTH_INVALID_INPUT', 'Vui lòng điền đầy đủ các thông tin bắt buộc.');
    }

    if (IS_MOCK_MODE) {
      const existed = mockUsersDb.some((u) => u.email.toLowerCase() === trimmedEmail);
      if (existed) {
        apiError('AUTH_EMAIL_EXISTS', 'Email đã được đăng ký. Vui lòng chọn email khác.');
      }
      const newUser: MockUser = {
        uid: `user-${Date.now()}`,
        email: trimmedEmail,
        fullName,
        phoneNumber: phone,
        password: input.password,
        createdAt: new Date().toISOString(),
      };
      mockUsersDb.push(newUser);
      return toSafeMockUser(newUser);
    }

    try {
      const credential = await createUserWithEmailAndPassword(auth, trimmedEmail, input.password);
      const uid = credential.user.uid;

      // Cập nhật displayName trên Firebase Auth
      await updateFirebaseProfile(credential.user, { displayName: fullName });

      // Lưu hồ sơ chi tiết vào Cloud Firestore users/{uid}
      const profile: UserProfile = {
        uid,
        email: trimmedEmail,
        fullName,
        displayName: fullName,
        phoneNumber: phone,
        isGuest: false,
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'users', uid), profile, { merge: true });
      return profile;
    } catch (err: unknown) {
      throw mapFirebaseError(err, 'Không thể đăng ký tài khoản. Vui lòng thử lại.');
    }
  },

  /** Đăng xuất khỏi hệ thống */
  async logout(): Promise<void> {
    if (IS_MOCK_MODE) return;
    try {
      await signOut(auth);
    } catch (err: unknown) {
      throw mapFirebaseError(err, 'Không thể đăng xuất.');
    }
  },

  /** Lấy thông tin hồ sơ người dùng từ Firestore users/{uid} */
  async getProfile(uid: string): Promise<UserProfile> {
    if (IS_MOCK_MODE) {
      const user = mockUsersDb.find((u) => u.uid === uid) ?? DEMO_USER;
      return toSafeMockUser(user);
    }

    try {
      const snap = await getDoc(doc(db, 'users', uid));
      if (snap.exists()) {
        return { uid, ...(snap.data() as Omit<UserProfile, 'uid'>) };
      }

      // Nếu document chưa tạo trong Firestore (ví dụ vừa login qua auth), lấy thông tin từ auth.currentUser
      const current = auth.currentUser;
      const fallbackProfile: UserProfile = {
        uid,
        email: current?.email ?? '',
        displayName: current?.displayName ?? 'Người dùng',
        fullName: current?.displayName ?? 'Người dùng',
        isGuest: current?.isAnonymous ?? false,
        createdAt: new Date().toISOString(),
      };
      // Tự động ghi sync lại Firestore
      await setDoc(doc(db, 'users', uid), fallbackProfile, { merge: true });
      return fallbackProfile;
    } catch {
      // Fallback nếu offline hoặc quyền truy cập
      const mockUser = mockUsersDb.find((u) => u.uid === uid) ?? DEMO_USER;
      return toSafeMockUser(mockUser);
    }
  },

  /** Cập nhật thông tin hồ sơ người dùng */
  async updateProfile(uid: string, patch: Partial<UserProfile>): Promise<UserProfile> {
    if (IS_MOCK_MODE) {
      const user = mockUsersDb.find((u) => u.uid === uid);
      if (!user) apiError('AUTH_USER_NOT_FOUND', 'Không tìm thấy tài khoản.');
      Object.assign(user, patch);
      return toSafeMockUser(user);
    }

    try {
      const userRef = doc(db, 'users', uid);
      await setDoc(userRef, { ...patch, updatedAt: new Date().toISOString() }, { merge: true });

      // Nếu có đổi fullName và đang đăng nhập, cập nhật displayName trên auth
      if (patch.fullName && auth.currentUser && auth.currentUser.uid === uid) {
        await updateFirebaseProfile(auth.currentUser, { displayName: patch.fullName });
      }

      return await this.getProfile(uid);
    } catch (err: unknown) {
      throw mapFirebaseError(err, 'Không thể cập nhật hồ sơ người dùng.');
    }
  },

  /** Đăng nhập ẩn danh dưới tư cách Khách */
  async loginAsGuest(): Promise<UserProfile> {
    if (IS_MOCK_MODE) {
      return GUEST_USER;
    }

    try {
      const credential = await signInAnonymously(auth);
      const uid = credential.user.uid;
      const guestProfile: UserProfile = {
        uid,
        email: 'khach@ecommerce.vn',
        fullName: 'Khách hàng',
        displayName: 'Khách',
        isGuest: true,
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'users', uid), guestProfile, { merge: true });
      return guestProfile;
    } catch {
      // Fallback guest profile nếu anonymous provider chưa bật trên console
      return GUEST_USER;
    }
  },

  /** Lắng nghe thay đổi trạng thái xác thực từ Firebase */
  onAuthStateChanged(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
  },
};
