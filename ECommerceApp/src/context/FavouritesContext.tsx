import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import { Product } from '../types';
import { useAuth } from './AuthContext';
import { FavouriteService } from '../services/favouriteService';

interface FavouritesContextValue {
  favourites: Product[];
  isFavourite: (productId: string) => boolean;
  toggleFavourite: (product: Product) => void;
  reset: () => void;
}

const FavouritesContext = createContext<FavouritesContextValue | null>(null);

export function FavouritesProvider({
  children,
  resetKey = 0,
}: { children: ReactNode; resetKey?: number }) {
  const { user } = useAuth();
  const [favourites, setFavourites] = useState<Product[]>([]);

  // Tải danh sách yêu thích từ Firestore khi user đăng nhập
  useEffect(() => {
    let active = true;
    if (user?.uid) {
      FavouriteService.listFavourites(user.uid)
        .then((items) => {
          if (active) setFavourites(items);
        })
        .catch(() => {
          if (active) setFavourites([]);
        });
    } else {
      setFavourites([]);
    }
    return () => {
      active = false;
    };
  }, [user?.uid, resetKey]);

  const isFavourite = useCallback(
    (productId: string) => favourites.some((p) => p.id === productId),
    [favourites],
  );

  const toggleFavourite = useCallback(
    (product: Product) => {
      if (!user?.uid || user.isGuest) return;
      const exists = favourites.some((p) => p.id === product.id);
      if (exists) {
        setFavourites((prev) => prev.filter((p) => p.id !== product.id));
        void FavouriteService.removeFavourite(user.uid, product.id);
      } else {
        setFavourites((prev) => [product, ...prev]);
        void FavouriteService.addFavourite(user.uid, product);
      }
    },
    [favourites, user?.uid, user?.isGuest],
  );

  const reset = useCallback(() => {
    setFavourites([]);
    if (user?.uid) {
      void FavouriteService.clearFavourites(user.uid);
    }
  }, [user?.uid]);

  const value = useMemo(
    () => ({ favourites, isFavourite, toggleFavourite, reset }),
    [favourites, isFavourite, toggleFavourite, reset],
  );

  return <FavouritesContext.Provider value={value}>{children}</FavouritesContext.Provider>;
}

export function useFavourites(): FavouritesContextValue {
  const ctx = useContext(FavouritesContext);
  if (!ctx) {
    throw new Error('useFavourites phải được dùng bên trong <FavouritesProvider>');
  }
  return ctx;
}
