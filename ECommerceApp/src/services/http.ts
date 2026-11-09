/* Bộ xử lý lỗi và HTTP/Firebase chung */

export const IS_MOCK_MODE = process.env.EXPO_PUBLIC_DATA_SOURCE === 'mock';

/** Bật/tắt độ trễ giả khi chạy mock mode. */
export const MOCK_LATENCY = IS_MOCK_MODE;

/** Độ trễ giả lập (chỉ kích hoạt ở mock mode). */
export function mockDelay(ms?: number): Promise<void> {
  if (!MOCK_LATENCY) return Promise.resolve();
  const delay = ms ?? (150 + Math.floor(Math.random() * 250));
  return new Promise((resolve) => setTimeout(resolve, delay));
}

/** Lỗi chuẩn hoá trả về cho UI: { code, message }. */
export class ApiError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
  }
}

/** Ném ApiError ngay trong async function -> Promise bị reject. */
export function apiError(code: string, message: string): never {
  throw new ApiError(code, message);
}

/** Trả về data (kèm delay nếu mock). */
export async function respond<T>(data: T): Promise<T> {
  if (MOCK_LATENCY) await mockDelay();
  return data;
}

/** Lấy message hiển thị tiếng Việt từ bất kỳ lỗi nào. */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Đã có lỗi xảy ra, vui lòng thử lại.';
}

/**
 * Chuyển đổi mã lỗi Firebase sang ApiError với message tiếng Việt rõ ràng, thân thiện.
 */
export function mapFirebaseError(error: unknown, fallbackMessage = 'Đã có lỗi xảy ra, vui lòng thử lại.'): ApiError {
  if (error instanceof ApiError) return error;

  const err = error as { code?: string; message?: string };
  const code = err?.code ?? 'UNKNOWN_ERROR';

  switch (code) {
    // Auth errors
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return new ApiError('AUTH_INVALID_CREDENTIALS', 'Email hoặc mật khẩu không chính xác.');
    case 'auth/email-already-in-use':
      return new ApiError('AUTH_EMAIL_EXISTS', 'Email đã được đăng ký. Vui lòng chọn email khác.');
    case 'auth/invalid-email':
      return new ApiError('AUTH_INVALID_EMAIL', 'Địa chỉ email không đúng định dạng.');
    case 'auth/weak-password':
      return new ApiError('AUTH_WEAK_PASSWORD', 'Mật khẩu quá ngắn, vui lòng nhập tối thiểu 6 ký tự.');
    case 'auth/user-disabled':
      return new ApiError('AUTH_USER_DISABLED', 'Tài khoản này đã bị tạm khóa.');
    case 'auth/too-many-requests':
      return new ApiError('AUTH_TOO_MANY_REQUESTS', 'Bạn đã thử quá nhiều lần. Vui lòng thử lại sau ít phút.');
    case 'auth/operation-not-allowed':
      return new ApiError('AUTH_OPERATION_NOT_ALLOWED', 'Phương thức đăng nhập này chưa được kích hoạt.');
    case 'auth/network-request-failed':
      return new ApiError('NETWORK_ERROR', 'Không thể kết nối Internet. Vui lòng kiểm tra Wi-Fi/4G.');

    // Firestore errors
    case 'permission-denied':
      return new ApiError('PERMISSION_DENIED', 'Bạn không có quyền thực hiện thao tác này.');
    case 'not-found':
      return new ApiError('NOT_FOUND', 'Không tìm thấy dữ liệu yêu cầu.');
    case 'already-exists':
      return new ApiError('ALREADY_EXISTS', 'Dữ liệu đã tồn tại trong hệ thống.');
    case 'unavailable':
      return new ApiError('SERVICE_UNAVAILABLE', 'Dịch vụ tạm thời gián đoạn, vui lòng thử lại sau.');
    case 'deadline-exceeded':
      return new ApiError('TIMEOUT', 'Yêu cầu quá thời gian xử lý. Vui lòng thử lại.');
    case 'failed-precondition':
      return new ApiError('FAILED_PRECONDITION', 'Thao tác không hợp lệ với trạng thái hiện tại.');
    case 'aborted':
      return new ApiError('TRANSACTION_ABORTED', 'Giao dịch bị xung đột, hệ thống đã thử lại không thành công.');

    default: {
      const msg = err?.message || fallbackMessage;
      return new ApiError(code, msg);
    }
  }
}
