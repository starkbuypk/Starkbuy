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

          {/* Wishlist btn */}
          <button
            onClick={handleWishlist}
            aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            style={{
              position: 'absolute',
              top: '0.75rem',
              right: '0.75rem',
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.92)',
              border: '1px solid rgba(0,0,0,0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: wishlisted ? 'var(--luna-1)' : 'var(--luna-muted)',
              cursor: 'pointer',
              transition: 'color 150ms, background 150ms',
            }}
          >
            <IconHeart size={15} filled={wishlisted} />
          </button>

          {/* Add to bag — hover overlay */}
          {product.inStock && (
            <button
              onClick={handleAddToCart}
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'rgba(255,255,255,0.96)',
                backdropFilter: 'blur(8px)',
                color: 'var(--luna-fg)',
                border: 'none',
                borderTop: '1px solid rgba(0,0,0,0.07)',
                padding: '0.75rem',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: 'pointer',
                letterSpacing: '0.06em',
                textTransform: 'uppercase' as const,
                transform: 'translateY(100%)',
                transition: 'transform 200ms var(--ease-spring)',
                fontFamily: 'DM Sans, sans-serif',
              }}
              className="add-to-bag-btn"
            >
              Add to Bag
            </button>
          )}
        </div>

        {/* Info */}
        <div style={{ padding: '0.875rem 1rem 1rem' }}>
          <div style={{ marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <span style={{ color: '#f59e0b', display: 'flex' }}>
              <IconStar size={12} />
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--luna-muted)', fontVariantNumeric: 'tabular-nums' }}>
              {product.rating} ({product.reviewCount})
            </span>
          </div>
          <h3 style={{ margin: '0 0 0.375rem', fontSize: '0.9375rem', fontWeight: 600, lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {product.name}
          </h3>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600, fontSize: '0.9375rem', color: salePrice ? 'var(--luna-1)' : 'var(--luna-fg)' }}>
              {formatPrice(salePrice ?? product.codPrice)}
            </span>
            {salePrice && (
              <span style={{ fontVariantNumeric: 'tabular-nums', fontSize: '0.8125rem', color: 'var(--luna-muted)', textDecoration: 'line-through' }}>
                {formatPrice(product.codPrice)}
              </span>
            )}
          </div>
        </div>
      </article>

      <style>{`
        article.product-card:hover .add-to-bag-btn {
          transform: translateY(0) !important;
        }
      `}</style>
    </Link>
  );
});
