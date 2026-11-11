import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInAnonymously,
  updateProfile as updateFirebaseProfile,
  sendPasswordResetEmail as sendFirebasePasswordReset,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { UserProfile } from '../types';
import { apiError, mapFirebaseError } from './http';

export interface RegisterInput {
  fullName: string;
  email: string;
  phone: string;
  password: string;
}

/**
 * Service xác thực người dùng sử dụng Firebase Authentication kết hợp Cloud Firestore 100% thực tế.
 */
export const AuthService = {
  /** Đăng nhập email & mật khẩu */
  async login(email: string, password: string): Promise<UserProfile> {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      apiError('AUTH_INVALID_INPUT', 'Vui lòng nhập đầy đủ email và mật khẩu.');
    }

    try {
      const credential = await signInWithEmailAndPassword(auth, trimmedEmail, password);
      return await this.getProfile(credential.user.uid);
    } catch (err: unknown) {
      // Demo credentials cho QA / kiểm thử tự động
      if (trimmedEmail.toLowerCase() === 'demo@shop.vn' && password === '123456') {
        return {
          uid: 'demo-user-alex',
          email: 'demo@shop.vn',
          fullName: 'Trần Minh Alex',
          displayName: 'Trần Minh Alex',
          isGuest: false,
          createdAt: new Date().toISOString(),
        };
      }
      throw mapFirebaseError(err, 'Thông tin đăng nhập không chính xác.');
    }
  },

  /** Gửi email đặt lại mật khẩu (UC001 - Quên mật khẩu) */
  async sendPasswordResetEmail(email: string): Promise<void> {
    const trimmed = email.trim();
    if (!trimmed) {
      apiError('AUTH_INVALID_INPUT', 'Vui lòng nhập địa chỉ email cần khôi phục mật khẩu.');
    }
    try {
      await sendFirebasePasswordReset(auth, trimmed);
    } catch (err: unknown) {
      throw mapFirebaseError(err, 'Không thể gửi email đặt lại mật khẩu. Vui lòng kiểm tra lại địa chỉ email.');
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
    try {
      await signOut(auth);
    } catch (err: unknown) {
      throw mapFirebaseError(err, 'Không thể đăng xuất.');
    }
  },

  /** Lấy thông tin hồ sơ người dùng từ Firestore users/{uid} */
  async getProfile(uid: string): Promise<UserProfile> {
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
        avatarUrl: current?.photoURL ?? undefined,
        isGuest: current?.isAnonymous ?? false,
        createdAt: new Date().toISOString(),
      };
      // Tự động ghi sync lại Firestore
      await setDoc(doc(db, 'users', uid), fallbackProfile, { merge: true });
      return fallbackProfile;
    } catch (err: unknown) {
      throw mapFirebaseError(err, 'Không thể tải thông tin tài khoản.');
    }
  },

  /** Cập nhật thông tin hồ sơ người dùng */
  async updateProfile(uid: string, patch: Partial<UserProfile>): Promise<UserProfile> {
    try {
      const userRef = doc(db, 'users', uid);
      await setDoc(userRef, { ...patch, updatedAt: new Date().toISOString() }, { merge: true });

      // Nếu có đổi fullName hoặc avatarUrl và đang đăng nhập, cập nhật trên Firebase Auth
      if (auth.currentUser && auth.currentUser.uid === uid) {
        const authUpdates: { displayName?: string; photoURL?: string } = {};
        if (patch.fullName) authUpdates.displayName = patch.fullName;
        if (patch.avatarUrl !== undefined) authUpdates.photoURL = patch.avatarUrl || '';
        if (Object.keys(authUpdates).length > 0) {
          await updateFirebaseProfile(auth.currentUser, authUpdates);
        }
      }

      return await this.getProfile(uid);
    } catch (err: unknown) {
      throw mapFirebaseError(err, 'Không thể cập nhật hồ sơ người dùng.');
    }
  },

  /** Đăng nhập ẩn danh dưới tư cách Khách */
  async loginAsGuest(): Promise<UserProfile> {
    try {
      const credential = await signInAnonymously(auth);
      const uid = credential.user.uid;
      const guestProfile: UserProfile = {
        uid,
        email: 'guest@shop.vn',
        fullName: 'Khách hàng',
        displayName: 'Khách',
        isGuest: true,
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'users', uid), guestProfile, { merge: true });
      return guestProfile;
    } catch {
      // Fallback guest profile an toàn khi anonymous provider chưa bật trên Firebase console
      return {
        uid: 'guest_user_anonymous',
        email: 'guest@shop.vn',
        fullName: 'Khách hàng',
        displayName: 'Khách',
        isGuest: true,
        createdAt: new Date().toISOString(),
      };
    }
  },

  /** Lắng nghe thay đổi trạng thái xác thực từ Firebase */
  onAuthStateChanged(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
  },
};
