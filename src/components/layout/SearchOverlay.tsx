import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { products } from '../../data/products';
import { formatPrice } from '../../data/products';
import { IconSearch, IconX } from '../icons/Icons';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function SearchOverlay({ open, onClose }: Props) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setQuery('');
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!open) return null;

  const results = query.trim()
    ? products.filter(p =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.category.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 6)
    : [];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 600,
        background: 'rgba(255,255,255,0.97)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: '8rem',
        padding: '8rem 1.5rem 2rem',
        animation: 'fadeIn 150ms var(--ease-spring)',
      }}
    >
      <button
        onClick={onClose}
        aria-label="Close search"
        style={{
          position: 'absolute',
          top: '1.25rem',
          right: '1.5rem',
          color: 'var(--luna-muted)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '0.5rem',
        }}
      >
        <IconX size={24} />
      </button>

      <div style={{ width: '100%', maxWidth: 640 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          background: 'rgba(0,0,0,0.05)',
          border: '1px solid rgba(0,0,0,0.10)',
          borderRadius: 'var(--radius)',
          padding: '0.875rem 1.25rem',
          marginBottom: '1.5rem',
        }}>
          <IconSearch size={18} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search watches — brand, category, name..."
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              outline: 'none',
              color: 'var(--luna-fg)',
              fontSize: '1rem',
              fontFamily: 'DM Sans, sans-serif',
            }}
          />
          {query && (
            <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', color: 'var(--luna-muted)', cursor: 'pointer', padding: 0 }}>
              <IconX size={16} />
            </button>
          )}
        </div>

        {results.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {results.map(p => (
              <Link
                key={p.id}
                to={`/product/${p.slug}`}
                onClick={onClose}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '0.875rem 1rem',
                  borderRadius: 'var(--radius)',
                  background: 'rgba(0,0,0,0.04)',
                  border: '1px solid rgba(26,22,20,0.08)',
                  textDecoration: 'none',
                  color: 'var(--luna-fg)',
                  transition: 'background 150ms',
                }}
              >
                <img
                  src={p.image + '&w=80'}
                  alt={p.name}
                  style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: '0.5rem', flexShrink: 0 }}
                  loading="lazy"
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, fontSize: '0.9375rem' }}>{p.name}</div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--luna-muted)' }}>{p.category}</div>
                </div>
                <div style={{ fontSize: '0.875rem', fontVariantNumeric: 'tabular-nums', fontWeight: 500, color: 'var(--luna-1)' }}>
                  {formatPrice(p.codPrice)}
                </div>
              </Link>
            ))}
          </div>
        )}

        {query && results.length === 0 && (
          <p style={{ textAlign: 'center', color: 'var(--luna-muted)', marginTop: '2rem' }}>
            No watches found for "{query}"
          </p>
        )}

        {!query && (
          <div>
            <p className="eyebrow" style={{ marginBottom: '0.75rem' }}>Browse categories</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {['Analog', 'Chronograph', 'Smart', 'Luxury', 'Sports', 'Sale'].map(cat => (
                <Link
                  key={cat}
                  to={`/collections/${cat.toLowerCase()}`}
                  onClick={onClose}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: 'var(--radius)',
                    background: 'rgba(0,0,0,0.04)',
                    border: '1px solid rgba(26,22,20,0.10)',
                    color: 'var(--luna-fg)',
                    fontSize: '0.875rem',
                    textDecoration: 'none',
                    transition: 'border-color 150ms',
                  }}
                >
                  {cat}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
