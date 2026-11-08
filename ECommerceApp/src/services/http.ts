/* Bộ giả lập HTTP chung cho toàn bộ mock services. */

/** Bật/tắt độ trễ giả. Khi gọi API thật, set MOCK_LATENCY = false. */
export const MOCK_LATENCY = true;

/** Độ trễ ngẫu nhiên trong khoảng 150 - 600ms. */
export function mockDelay(): Promise<void> {
  if (!MOCK_LATENCY) return Promise.resolve();
  const ms = 150 + Math.floor(Math.random() * 450);
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Lỗi chuẩn hoá như API thật trả về: { code, message }. */
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

/** Giả lập thành công: chờ delay rồi trả data. */
export async function respond<T>(data: T): Promise<T> {
  await mockDelay();
  return data;
}

/** Lấy message hiển thị từ bất kỳ lỗi nào. */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Đã có lỗi xảy ra, vui lòng thử lại.';
}
