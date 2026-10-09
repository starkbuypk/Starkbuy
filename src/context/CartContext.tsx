import { createContext, useCallback, useContext, useMemo, useReducer, useEffect, type Context } from 'react';
import type { Product, CaseSize, Strap } from '../data/products';
import { getProductPrice } from '../utils/pricing';

export interface CartItem {
  product: Product;
  caseSize: CaseSize;
  strap: Strap;
  color?: string;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  open: boolean;
}

type CartAction =
  | { type: 'ADD'; payload: CartItem }
  | { type: 'REMOVE'; productId: string; caseSize: CaseSize; strap: Strap; color?: string }
  | { type: 'UPDATE_QTY'; productId: string; caseSize: CaseSize; strap: Strap; color?: string; quantity: number }
  | { type: 'CLEAR' }
  | { type: 'OPEN' }
  | { type: 'CLOSE' };

function cartKey(id: string, cs: CaseSize, st: Strap, color?: string) {
  return `${id}::${cs}::${st}::${color ?? ''}`;
}

function reducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD': {
      const key = cartKey(action.payload.product.id, action.payload.caseSize, action.payload.strap, action.payload.color);
      const existing = state.items.findIndex(i => cartKey(i.product.id, i.caseSize, i.strap, i.color) === key);
      if (existing >= 0) {
        const items = [...state.items];
        items[existing] = { ...items[existing], quantity: Math.min(20, items[existing].quantity + action.payload.quantity) };
        return { ...state, items };
      }
      return { ...state, items: [...state.items, { ...action.payload, quantity: Math.min(20, Math.max(1, action.payload.quantity)) }] };
    }
    case 'REMOVE': {
      return {
        ...state,
        items: state.items.filter(i => cartKey(i.product.id, i.caseSize, i.strap, i.color) !== cartKey(action.productId, action.caseSize, action.strap, action.color)),
      };
    }
    case 'UPDATE_QTY': {
      if (action.quantity <= 0) {
        return {
          ...state,
          items: state.items.filter(i => cartKey(i.product.id, i.caseSize, i.strap, i.color) !== cartKey(action.productId, action.caseSize, action.strap, action.color)),
        };
      }
      return {
        ...state,
        items: state.items.map(i =>
          cartKey(i.product.id, i.caseSize, i.strap, i.color) === cartKey(action.productId, action.caseSize, action.strap, action.color)
            ? { ...i, quantity: Math.min(20, action.quantity) }
            : i
        ),
      };
    }
    case 'CLEAR': return { ...state, items: [] };
    case 'OPEN': return { ...state, open: true };
    case 'CLOSE': return { ...state, open: false };
    default: return state;
  }
}

function loadCartFromStorage(): CartItem[] {
  try {
    const raw = localStorage.getItem('starkbuy_cart');
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartItem[];
    return parsed.map(item => ({
      ...item,
      color: item.color ?? item.product.colorVariants?.[0]?.color,
      quantity: Math.min(20, Math.max(1, Number(item.quantity) || 1)),
    }));
  } catch { return []; }
}

interface CartContextValue {
  items: CartItem[];
  open: boolean;
  totalItems: number;
  subtotal: number;
  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: string, caseSize: CaseSize, strap: Strap, color?: string) => void;
  updateQty: (productId: string, caseSize: CaseSize, strap: Strap, quantity: number, color?: string) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
}

// Figma Make/Vite can refresh consumers before their provider module. Keeping
// the context identity in HMR data prevents a refreshed Header from reading a
// newly-created context while CartProvider still provides the previous one.
const CartContext =
  (import.meta.hot?.data.cartContext as Context<CartContextValue | null> | undefined)
  ?? createContext<CartContextValue | null>(null);

if (import.meta.hot) {
  import.meta.hot.data.cartContext = CartContext;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { items: loadCartFromStorage(), open: false });

  useEffect(() => {
    localStorage.setItem('starkbuy_cart', JSON.stringify(state.items));
  }, [state.items]);

  const totalItems = useMemo(() => state.items.reduce((s, i) => s + i.quantity, 0), [state.items]);
  const subtotal = useMemo(
    () => state.items.reduce((sum, item) => sum + getProductPrice(item.product) * item.quantity, 0),
    [state.items],
  );

  const addToCart = useCallback((item: CartItem) => dispatch({ type: 'ADD', payload: item }), []);
  const removeFromCart = useCallback((productId: string, caseSize: CaseSize, strap: Strap, color?: string) => dispatch({ type: 'REMOVE', productId, caseSize, strap, color }), []);
  const updateQty = useCallback((productId: string, caseSize: CaseSize, strap: Strap, quantity: number, color?: string) => dispatch({ type: 'UPDATE_QTY', productId, caseSize, strap, color, quantity }), []);
  const clearCart = useCallback(() => dispatch({ type: 'CLEAR' }), []);
  const openCart = useCallback(() => dispatch({ type: 'OPEN' }), []);
  const closeCart = useCallback(() => dispatch({ type: 'CLOSE' }), []);

  const value = useMemo<CartContextValue>(() => ({
    items: state.items,
    open: state.open,
    totalItems,
    subtotal,
    addToCart,
    removeFromCart,
    updateQty,
    clearCart,
    openCart,
    closeCart,
  }), [state.items, state.open, totalItems, subtotal, addToCart, removeFromCart, updateQty, clearCart, openCart, closeCart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be inside CartProvider');
  return ctx;
}
