import { auth } from '../firebaseConfig';
import { apiError } from './http';

/**
 * Đảm bảo người dùng đã đăng nhập trước khi thực hiện thao tác cá nhân.
 * Ném ngoại lệ DomainError nếu chưa có phiên đăng nhập hợp lệ.
 */
export function requireUid(): string {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    throw apiError('AUTH_REQUIRED', 'Vui lòng đăng nhập để thực hiện tính năng này.');
  }
  return uid;
}

/**
 * Lấy UID của người dùng hiện tại nếu có, ngược lại trả về null.
 */
export function getUidOrNull(): string | null {
  return auth.currentUser?.uid ?? null;
}
