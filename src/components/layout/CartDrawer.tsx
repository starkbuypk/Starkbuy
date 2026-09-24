import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { formatPrice } from '../../data/products';
import { IconX, IconMinus, IconPlus, IconTrash } from '../icons/Icons';
import { BRAND } from '../../config';

export function CartDrawer() {
  const { items, open, closeCart, removeFromCart, updateQty, subtotal } = useCart();
  const location = useLocation();

  useEffect(() => { closeCart(); }, [location.pathname, closeCart]);

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  const prepaid = Math.round(subtotal * 0.9);

  return (
    <>
      <div className="drawer-overlay" onClick={closeCart} />
      <div className="drawer glass" style={{ display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(26,22,20,0.08)', flexShrink: 0 }}>
          <div>
            <h2 className="font-display" style={{ fontSize: '1.375rem', fontWeight: 600, margin: 0, lineHeight: 1 }}>Your Bag</h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--luna-muted)', margin: '0.25rem 0 0' }}>{items.length} item{items.length !== 1 ? 's' : ''}</p>
          </div>
          <button className="btn-ghost" onClick={closeCart} aria-label="Close cart">
            <IconX />
          </button>
        </div>

        {/* Items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.5rem' }}>
          {items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--luna-muted)' }}>
              <p style={{ fontSize: '1rem', marginBottom: '1rem' }}>Your bag is empty.</p>
              <Link to="/collections" onClick={closeCart} className="btn btn-outline" style={{ display: 'inline-flex' }}>
                Browse Collection
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {items.map(item => (
                <div
                  key={`${item.product.id}-${item.caseSize}-${item.strap}`}
                  style={{ display: 'flex', gap: '1rem', padding: '1rem', background: 'rgba(26,22,20,0.38)', borderRadius: 'var(--radius)', border: '1px solid rgba(26,22,20,0.06)' }}
                >
                  <img
                    src={item.product.image + (item.product.image.includes('?') ? '&w=120' : '?w=120')}
                    alt={item.product.name}
                    style={{ width: 72, height: 96, objectFit: 'cover', borderRadius: '0.5rem', flexShrink: 0 }}
                    loading="lazy"
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                      <p style={{ fontWeight: 500, fontSize: '0.9375rem', margin: 0, lineHeight: 1.3 }}>{item.product.name}</p>
                      <button
                        onClick={() => removeFromCart(item.product.id, item.caseSize, item.strap)}
                        style={{ background: 'none', border: 'none', color: 'var(--luna-muted)', cursor: 'pointer', padding: '0.625rem', flexShrink: 0, borderRadius: '0.375rem' }}
                        aria-label="Remove item"
                      >
                        <IconTrash size={14} />
                      </button>
                    </div>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--luna-muted)', margin: '0.25rem 0 0.75rem' }}>
                      {item.strap}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      {/* Qty stepper */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(0,0,0,0.05)', borderRadius: '0.5rem', padding: '0.25rem' }}>
                        <button
                          onClick={() => updateQty(item.product.id, item.caseSize, item.strap, item.quantity - 1)}
                          style={{ background: 'none', border: 'none', color: 'var(--luna-fg)', cursor: 'pointer', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '0.375rem' }}
                          aria-label="Decrease quantity"
                        >
                          <IconMinus size={14} />
                        </button>
                        <span style={{ minWidth: 20, textAlign: 'center', fontSize: '0.875rem', fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>{item.quantity}</span>
                        <button
                          onClick={() => updateQty(item.product.id, item.caseSize, item.strap, item.quantity + 1)}
                          style={{ background: 'none', border: 'none', color: 'var(--luna-fg)', cursor: 'pointer', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '0.375rem' }}
                          aria-label="Increase quantity"
                        >
                          <IconPlus size={14} />
                        </button>
                      </div>
                      <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600, fontSize: '0.9375rem', color: 'var(--luna-1)' }}>
                        {formatPrice((item.product.discountPercent > 0 ? Math.round(item.product.codPrice * (1 - item.product.discountPercent / 100)) : item.product.codPrice) * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid rgba(26,22,20,0.08)', flexShrink: 0 }}>
            {/* Prepaid callout */}
            <div style={{ background: 'rgba(26,22,20,0.06)', border: '1px solid rgba(26,22,20,0.12)', borderRadius: 'var(--radius)', padding: '0.75rem 1rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: '0.8125rem', color: 'var(--luna-1)', fontWeight: 500, margin: 0 }}>Pay now, save {BRAND.prepaidDiscount}%</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--luna-muted)', margin: '0.125rem 0 0' }}>Prepaid price: {formatPrice(prepaid)}</p>
              </div>
              <span className="badge badge-accent">PREPAID</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <span style={{ color: 'var(--luna-muted)', fontSize: '0.9375rem' }}>Subtotal (COD)</span>
              <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{formatPrice(subtotal)}</span>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--luna-muted)', marginBottom: '1rem' }}>Shipping calculated at checkout.</p>
            <Link to="/checkout" onClick={closeCart} className="btn btn-primary" style={{ display: 'flex', width: '100%' }}>
              Proceed to Checkout
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
