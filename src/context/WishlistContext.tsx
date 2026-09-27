import { createContext, useCallback, useContext, useMemo, useState, useEffect } from 'react';
import type { Product } from '../data/products';

interface WishlistContextValue {
  ids: Set<string>;
  toggle: (product: Product) => void;
  has: (id: string) => boolean;
  count: number;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

function loadIds(): Set<string> {
  try {
    const raw = localStorage.getItem('starkbuy_wishlist');
    return new Set(raw ? JSON.parse(raw) : []);
  } catch { return new Set(); }
}

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [ids, setIds] = useState<Set<string>>(loadIds);

  useEffect(() => {
    localStorage.setItem('starkbuy_wishlist', JSON.stringify([...ids]));
  }, [ids]);

  const toggle = useCallback((product: Product) => {
    setIds(prev => {
      const next = new Set(prev);
      if (next.has(product.id)) next.delete(product.id);
      else next.add(product.id);
      return next;
    });
  }, []);

  const has = useCallback((id: string) => ids.has(id), [ids]);
  const count = ids.size;

  const value = useMemo(() => ({ ids, toggle, has, count }), [ids, toggle, has, count]);
  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist(): WishlistContextValue {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be inside WishlistProvider');
  return ctx;
}
