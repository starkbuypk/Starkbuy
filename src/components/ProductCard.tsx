import { memo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Product } from '../data/products';
import { formatPrice } from '../data/products';
import { IconHeart, IconStar } from './icons/Icons';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { toast } from '../utils/toast';

interface Props {
  product: Product;
}

export const ProductCard = memo(function ProductCard({ product }: Props) {
  const { toggle, has } = useWishlist();
  const { addToCart, openCart } = useCart();
  const [imgSrc, setImgSrc] = useState(product.image);
  const wishlisted = has(product.id);

  const salePrice = product.discountPercent > 0
    ? Math.round(product.codPrice * (1 - product.discountPercent / 100))
    : null;

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    addToCart({
      product,
      caseSize: product.caseSizeOptions[0],
      strap: product.strapOptions[0],
      quantity: 1,
    });
    toast(`${product.name} added to bag`);
    openCart();
  }

  function handleWishlist(e: React.MouseEvent) {
    e.preventDefault();
    toggle(product);
    toast(wishlisted ? 'Removed from wishlist' : `${product.name} saved to wishlist`, { type: wishlisted ? 'info' : 'success' });
  }

  return (
    <Link
      to={`/product/${product.slug}`}
      style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
    >
      <article
        className="product-card"
        onMouseEnter={() => product.hoverImage && setImgSrc(product.hoverImage)}
        onMouseLeave={() => setImgSrc(product.image)}
      >
        {/* Image */}
        <div style={{ position: 'relative', aspectRatio: '3/4', overflow: 'hidden', background: '#EBEBEB' }}>
          <img
            src={imgSrc.startsWith('data:') || imgSrc.startsWith('blob:') ? imgSrc : imgSrc + (imgSrc.includes('?') ? '&w=600' : '?w=600')}
            alt={product.name}
            loading="lazy"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform 300ms var(--ease-spring)',
            }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.04)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
          />

          {/* Badges */}
          <div style={{ position: 'absolute', top: '0.75rem', left: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            {product.discountPercent > 0 && (
              <span className="badge badge-sale">{product.discountPercent}% OFF</span>
            )}
            {product.newArrival && (
              <span className="badge badge-new">New</span>
            )}
            {product.limited && (
              <span className="badge badge-accent">Limited</span>
            )}
            {product.flashSale && (
              <span className="badge badge-sale">Flash Sale</span>
            )}
          </div>

          {/* Out of stock overlay */}
          {!product.inStock && (
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(26,22,20,0.55)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <span style={{ color: 'var(--luna-muted)', fontSize: '0.875rem', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Sold Out</span>
            </div>
          )}

          {/* Wishlist btn — reduced size so it doesn't compete with product image */}
          <button
            onClick={handleWishlist}
            aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            style={{
              position: 'absolute',
              top: '0.625rem',
              right: '0.625rem',
              width: 30,
              height: 30,
              borderRadius: '50%',
              background: wishlisted ? 'rgba(255,255,255,0.97)' : 'rgba(255,255,255,0.75)',
              border: '1px solid rgba(0,0,0,0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: wishlisted ? 'var(--luna-1)' : 'var(--luna-muted)',
              cursor: 'pointer',
              transition: 'color 150ms, background 150ms',
            }}
          >
            <IconHeart size={13} filled={wishlisted} />
          </button>
        </div>

        {/* Info — name first, then rating, then price, then Add to Bag */}
        <div style={{ padding: '0.875rem 1rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 600, lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {product.name}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <span style={{ color: '#f59e0b', display: 'flex' }}>
              <IconStar size={12} />
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--luna-muted)', fontVariantNumeric: 'tabular-nums' }}>
              {product.rating} ({product.reviewCount})
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.625rem' }}>
            <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600, fontSize: '0.9375rem', color: salePrice ? 'var(--luna-1)' : 'var(--luna-fg)' }}>
              {formatPrice(salePrice ?? product.codPrice)}
            </span>
            {salePrice && (
              <span style={{ fontVariantNumeric: 'tabular-nums', fontSize: '0.8125rem', color: 'var(--luna-muted)', textDecoration: 'line-through' }}>
                {formatPrice(product.codPrice)}
              </span>
            )}
          </div>
          {product.inStock && (
            <button
              onClick={handleAddToCart}
              className="add-to-bag-btn"
              style={{
                width: '100%',
                background: 'var(--luna-fg)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '0.4375rem',
                padding: '0.5625rem 1rem',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: 'pointer',
                letterSpacing: '0.05em',
                textTransform: 'uppercase' as const,
                fontFamily: 'DM Sans, sans-serif',
                transition: 'background 150ms, transform 100ms',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--luna-1)'; e.currentTarget.style.color = '#111'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--luna-fg)'; e.currentTarget.style.color = '#FFF'; }}
            >
              Add to Bag
            </button>
          )}
        </div>
      </article>
    </Link>
  );
});
