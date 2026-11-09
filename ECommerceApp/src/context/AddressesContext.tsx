import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import { Address } from '../types';
import { ProfileService } from '../services/profileService';
import { useAuth } from './AuthContext';

interface AddressesContextValue {
  addresses: Address[];
  defaultAddress: Address | null;
  loading: boolean;
  loadAddresses: () => Promise<void>;
  addAddress: (input: Omit<Address, 'id'>) => Promise<void>;
  updateAddress: (id: string, patch: Partial<Address>) => Promise<void>;
  removeAddress: (id: string) => Promise<void>;
  setDefault: (id: string) => Promise<void>;
  reset: () => void;
}

const AddressesContext = createContext<AddressesContextValue | null>(null);

export function AddressesProvider({
  children,
  resetKey = 0,
}: { children: ReactNode; resetKey?: number }) {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(false);

  const loadAddresses = useCallback(async () => {
    setLoading(true);
    try {
      const data = await ProfileService.listAddresses();
      setAddresses(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAddresses();
  }, [loadAddresses, user, resetKey]);

  const addAddress = useCallback(async (input: Omit<Address, 'id'>) => {
    const data = await ProfileService.addAddress(input);
    setAddresses(data);
  }, []);

  const updateAddress = useCallback(async (id: string, patch: Partial<Address>) => {
    const data = await ProfileService.updateAddress(id, patch);
    setAddresses(data);
  }, []);

  const removeAddress = useCallback(async (id: string) => {
    const data = await ProfileService.deleteAddress(id);
    setAddresses(data);
  }, []);

  const setDefault = useCallback(async (id: string) => {
    const data = await ProfileService.setDefaultAddress(id);
    setAddresses(data);
  }, []);

  const reset = useCallback(() => {
    void loadAddresses();
  }, [loadAddresses]);

  const defaultAddress = useMemo(
    () => addresses.find((a) => a.isDefault) ?? addresses[0] ?? null,
    [addresses],
  );

  const value = useMemo(
    () => ({
      addresses,
      defaultAddress,
      loading,
      loadAddresses,
      addAddress,
      updateAddress,
      removeAddress,
      setDefault,
      reset,
    }),
    [addresses, defaultAddress, loading, loadAddresses, addAddress, updateAddress, removeAddress, setDefault, reset],
  );

  return <AddressesContext.Provider value={value}>{children}</AddressesContext.Provider>;
}

export function useAddresses(): AddressesContextValue {
  const ctx = useContext(AddressesContext);
  if (!ctx) {
    throw new Error('useAddresses phải được dùng bên trong <AddressesProvider>');
  }
  return ctx;
}
