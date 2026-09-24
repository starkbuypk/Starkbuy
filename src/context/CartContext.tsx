import { createContext, useCallback, useContext, useMemo, useReducer, useEffect } from 'react';
import type { Product, CaseSize, Strap } from '../data/products';

export interface CartItem {
  product: Product;
  caseSize: CaseSize;
  strap: Strap;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  open: boolean;
}

type CartAction =
  | { type: 'ADD'; payload: CartItem }
  | { type: 'REMOVE'; productId: string; caseSize: CaseSize; strap: Strap }
  | { type: 'UPDATE_QTY'; productId: string; caseSize: CaseSize; strap: Strap; quantity: number }
  | { type: 'CLEAR' }
  | { type: 'OPEN' }
  | { type: 'CLOSE' };

function cartKey(id: string, cs: CaseSize, st: Strap) {
  return `${id}::${cs}::${st}`;
}

function reducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD': {
      const key = cartKey(action.payload.product.id, action.payload.caseSize, action.payload.strap);
      const existing = state.items.findIndex(i => cartKey(i.product.id, i.caseSize, i.strap) === key);
      if (existing >= 0) {
        const items = [...state.items];
        items[existing] = { ...items[existing], quantity: items[existing].quantity + action.payload.quantity };
        return { ...state, items };
      }
      return { ...state, items: [...state.items, action.payload] };
    }
    case 'REMOVE': {
      return {
        ...state,
        items: state.items.filter(i => cartKey(i.product.id, i.caseSize, i.strap) !== cartKey(action.productId, action.caseSize, action.strap)),
      };
    }
    case 'UPDATE_QTY': {
      if (action.quantity <= 0) {
        return {
          ...state,
          items: state.items.filter(i => cartKey(i.product.id, i.caseSize, i.strap) !== cartKey(action.productId, action.caseSize, action.strap)),
        };
      }
      return {
        ...state,
        items: state.items.map(i =>
          cartKey(i.product.id, i.caseSize, i.strap) === cartKey(action.productId, action.caseSize, action.strap)
            ? { ...i, quantity: action.quantity }
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
    return JSON.parse(raw);
  } catch { return []; }
}

interface CartContextValue {
  items: CartItem[];
  open: boolean;
  totalItems: number;
  subtotal: number;
  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: string, caseSize: CaseSize, strap: Strap) => void;
  updateQty: (productId: string, caseSize: CaseSize, strap: Strap, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { items: loadCartFromStorage(), open: false });

  useEffect(() => {
    localStorage.setItem('starkbuy_cart', JSON.stringify(state.items));
  }, [state.items]);

  const totalItems = useMemo(() => state.items.reduce((s, i) => s + i.quantity, 0), [state.items]);
  const subtotal = useMemo(() => state.items.reduce((s, i) => s + i.product.codPrice * i.quantity, 0), [state.items]);

  const addToCart = useCallback((item: CartItem) => dispatch({ type: 'ADD', payload: item }), []);
  const removeFromCart = useCallback((productId: string, caseSize: CaseSize, strap: Strap) => dispatch({ type: 'REMOVE', productId, caseSize, strap }), []);
  const updateQty = useCallback((productId: string, caseSize: CaseSize, strap: Strap, quantity: number) => dispatch({ type: 'UPDATE_QTY', productId, caseSize, strap, quantity }), []);
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
