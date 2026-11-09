import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '../services/http';

interface UseAsyncResult<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  run: () => Promise<void>;
}

/** Chạy một hàm async, quản lý loading + error đơn giản. */
export function useAsync<T>(fn: () => Promise<T>, deps: readonly unknown[] = []): UseAsyncResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fn();
      setData(result);
    } catch (e) {
      setError(e instanceof ApiError ? e : new ApiError('UNKNOWN_ERROR', 'Đã có lỗi xảy ra.'));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    void run();
  }, [run]);

  return { data, loading, error, run };
}
