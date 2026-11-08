import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import { UserProfile } from '../types';
import { AuthService, RegisterInput } from '../services/auth.service';

interface AuthContextValue {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginAsGuest: () => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (patch: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
  /** AppProviders gọi khi logout để các context khác tự reset dữ liệu người dùng. */
  onLogout?: () => void;
}

export function AuthProvider({ children, onLogout }: AuthProviderProps) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Giả lập màn splash ngắn khi khởi tạo. Với API thật sẽ gọi GET /auth/me tại đây.
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 450);
    return () => clearTimeout(timer);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const logged = await AuthService.login(email, password);
    setUser(logged);
  }, []);

  const loginAsGuest = useCallback(async () => {
    const guest = await AuthService.loginAsGuest();
    setUser(guest);
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const created = await AuthService.register(input);
    setUser(created);
  }, []);

  const logout = useCallback(async () => {
    await AuthService.logout();
    setUser(null);
    onLogout?.();
  }, [onLogout]);

  const updateProfile = useCallback(async (patch: Partial<UserProfile>) => {
    if (!user) return;
    const updated = await AuthService.updateProfile(user.uid, patch);
    setUser(updated);
  }, [user]);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: user !== null,
      login,
      loginAsGuest,
      register,
      logout,
      updateProfile,
    }),
    [user, isLoading, login, loginAsGuest, register, logout, updateProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth phải được dùng bên trong <AuthProvider>');
  }
  return ctx;
}
