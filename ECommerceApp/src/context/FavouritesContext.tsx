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

interface FavouritesContextValue {
  favourites: Product[];
  isFavourite: (productId: string) => boolean;
  toggleFavourite: (product: Product) => void;
  reset: () => void;
}

const FavouritesContext = createContext<FavouritesContextValue | null>(null);

const SEED_FAVOURITES: Product[] = [];

export function FavouritesProvider({
  children,
  resetKey = 0,
}: { children: ReactNode; resetKey?: number }) {
  const [favourites, setFavourites] = useState<Product[]>(SEED_FAVOURITES);

  useEffect(() => {
    setFavourites(SEED_FAVOURITES);
  }, [resetKey]);

  const isFavourite = useCallback(
    (productId: string) => favourites.some((p) => p.id === productId),
    [favourites],
  );

  const toggleFavourite = useCallback((product: Product) => {
    setFavourites((prev) =>
      prev.some((p) => p.id === product.id)
        ? prev.filter((p) => p.id !== product.id)
        : [product, ...prev],
    );
  }, []);

  const reset = useCallback(() => setFavourites(SEED_FAVOURITES), []);

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
