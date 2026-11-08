import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import { PaymentMethod } from '../types';
import { ProfileService } from '../services/profile.service';
import { useAuth } from './AuthContext';

interface PaymentMethodsContextValue {
  methods: PaymentMethod[];
  defaultMethod: PaymentMethod | null;
  loading: boolean;
  loadMethods: () => Promise<void>;
  addMethod: (input: Omit<PaymentMethod, 'id'>) => Promise<void>;
  removeMethod: (id: string) => Promise<void>;
  setDefault: (id: string) => Promise<void>;
  reset: () => void;
}

const PaymentMethodsContext = createContext<PaymentMethodsContextValue | null>(null);

export function PaymentMethodsProvider({
  children,
  resetKey = 0,
}: { children: ReactNode; resetKey?: number }) {
  const { user } = useAuth();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(false);

  const loadMethods = useCallback(async () => {
    setLoading(true);
    try {
      const data = await ProfileService.listPaymentMethods();
      setMethods(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMethods();
  }, [loadMethods, user, resetKey]);

  const addMethod = useCallback(async (input: Omit<PaymentMethod, 'id'>) => {
    const data = await ProfileService.addPaymentMethod(input);
    setMethods(data);
  }, []);

  const removeMethod = useCallback(async (id: string) => {
    const data = await ProfileService.deletePaymentMethod(id);
    setMethods(data);
  }, []);

  const setDefault = useCallback(async (id: string) => {
    const data = await ProfileService.setDefaultPaymentMethod(id);
    setMethods(data);
  }, []);

  const reset = useCallback(() => {
    void loadMethods();
  }, [loadMethods]);

  const defaultMethod = useMemo(
    () => methods.find((p) => p.isDefault) ?? methods[0] ?? null,
    [methods],
  );

  const value = useMemo(
    () => ({
      methods,
      defaultMethod,
      loading,
      loadMethods,
      addMethod,
      removeMethod,
      setDefault,
      reset,
    }),
    [methods, defaultMethod, loading, loadMethods, addMethod, removeMethod, setDefault, reset],
  );

  return <PaymentMethodsContext.Provider value={value}>{children}</PaymentMethodsContext.Provider>;
}

export function usePaymentMethods(): PaymentMethodsContextValue {
  const ctx = useContext(PaymentMethodsContext);
  if (!ctx) {
    throw new Error('usePaymentMethods phải được dùng bên trong <PaymentMethodsProvider>');
  }
  return ctx;
}
