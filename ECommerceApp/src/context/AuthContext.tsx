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
import { AuthService, RegisterInput } from '../services/authService';

interface AuthContextValue {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginAsGuest: () => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (patch: Partial<UserProfile>) => Promise<void>;
  sendPasswordResetEmail: (email: string) => Promise<void>;
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

  // Lắng nghe và đồng bộ trạng thái xác thực từ Firebase Auth
  useEffect(() => {
    let isMounted = true;
    const unsubscribe = AuthService.onAuthStateChanged(async (firebaseUser) => {
      if (!isMounted) return;
      if (firebaseUser) {
        try {
          const profile = await AuthService.getProfile(firebaseUser.uid);
          if (isMounted) setUser(profile);
        } catch {}
      }
      if (isMounted) setIsLoading(false);
    });

    const fallbackTimer = setTimeout(() => {
      if (isMounted) setIsLoading(false);
    }, 1200);

    return () => {
      isMounted = false;
      clearTimeout(fallbackTimer);
      unsubscribe();
    };
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

  const sendPasswordResetEmail = useCallback(async (email: string) => {
    await AuthService.sendPasswordResetEmail(email);
  }, []);

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
      sendPasswordResetEmail,
    }),
    [user, isLoading, login, loginAsGuest, register, logout, updateProfile, sendPasswordResetEmail],
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
