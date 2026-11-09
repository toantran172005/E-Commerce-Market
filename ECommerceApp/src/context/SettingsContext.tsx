import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import { AppSettings } from '../types';
import { ProfileService } from '../services/profileService';

const DEFAULT_SETTINGS: AppSettings = {
  language: 'vi',
  currency: 'VND',
  darkMode: false,
  pushEnabled: true,
  emailEnabled: true,
  biometricEnabled: false,
};

interface SettingsContextValue {
  settings: AppSettings;
  loading: boolean;
  saveSettings: (patch: Partial<AppSettings>) => Promise<void>;
  reset: () => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({
  children,
  resetKey = 0,
}: { children: ReactNode; resetKey?: number }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await ProfileService.getSettings();
      setSettings(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, resetKey]);

  const saveSettings = useCallback(async (patch: Partial<AppSettings>) => {
    const updated = await ProfileService.updateSettings(patch);
    setSettings(updated);
  }, []);

  const reset = useCallback(() => {
    void load();
  }, [load]);

  const value = useMemo(
    () => ({
      settings,
      loading,
      saveSettings,
      reset,
    }),
    [settings, loading, saveSettings, reset],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings phải được dùng bên trong SettingsProvider');
  return ctx;
}
