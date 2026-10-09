import { memo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Product } from '../data/products';
import { formatPrice } from '../data/products';
import { IconHeart, IconStar } from './icons/Icons';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { toast } from '../utils/toast';
import { useReviewStats } from '../hooks/useStoreData';
import { getProductPrice } from '../utils/pricing';

interface Props {
  product: Product;
}

export const ProductCard = memo(function ProductCard({ product }: Props) {
  const { toggle, has } = useWishlist();
  const { addToCart, openCart } = useCart();
  const [imgSrc, setImgSrc] = useState(product.image);
  const wishlisted = has(product.id);
  const reviewStats = useReviewStats();
  const liveCount = reviewStats[product.id]?.count ?? product.reviewCount;
  const liveRating = reviewStats[product.id] ? (reviewStats[product.id].avg).toFixed(1) : (product.rating || 0).toFixed(1);

  const salePrice = product.discountPercent > 0 ? getProductPrice(product) : null;

  function handleAddToCart() {
    addToCart({
      product,
      caseSize: product.caseSizeOptions[0],
      strap: product.strapOptions[0],
      color: product.colorVariants?.[0]?.color,
      quantity: 1,
    });
    toast(`${product.name} added to bag`);
    openCart();
  }

  function handleWishlist() {
    toggle(product);
    toast(wishlisted ? 'Removed from wishlist' : `${product.name} saved to wishlist`, { type: wishlisted ? 'info' : 'success' });
  }

  return (
    <article
      className="product-card"
      onMouseEnter={() => product.hoverImage && setImgSrc(product.hoverImage)}
      onMouseLeave={() => setImgSrc(product.image)}
    >
      {/* Image — full bleed, no card box */}
      <div style={{ position: 'relative', aspectRatio: '3/4', overflow: 'hidden', background: '#EBEBEB' }}>
        <Link
          to={`/product/${product.slug}`}
          aria-label={`View ${product.name}`}
          style={{ textDecoration: 'none', color: 'inherit', display: 'block', width: '100%', height: '100%' }}
        >
          <img
            src={imgSrc.startsWith('data:') || imgSrc.startsWith('blob:') ? imgSrc : imgSrc + (imgSrc.includes('?') ? '&w=600' : '?w=600')}
            alt={`${product.name} ${product.category} Watch Price in Pakistan — StarkBuy`}
            loading="lazy"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform 400ms var(--ease-spring)',
            }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
          />

          {/* Badges — top-left, sharp rectangle */}
          <div style={{ position: 'absolute', top: '0.625rem', left: '0.625rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {product.discountPercent > 0 && (
              <span className="badge badge-sale">{product.discountPercent}% OFF</span>
            )}
            {product.newArrival && <span className="badge badge-new">New</span>}
            {product.limited && <span className="badge badge-accent">Limited</span>}
            {product.flashSale && <span className="badge badge-sale">Flash Sale</span>}
          </div>

          {/* Out of stock */}
          {!product.inStock && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,14,12,0.50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Sold Out</span>
            </div>
          )}
        </Link>

        {/* Wishlist */}
        <button
          onClick={handleWishlist}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          aria-pressed={wishlisted}
          style={{
            position: 'absolute', top: '0.625rem', right: '0.625rem',
            width: 28, height: 28,
            background: 'rgba(255,255,255,0.90)',
            border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: wishlisted ? 'var(--luna-1)' : 'var(--luna-muted)',
            cursor: 'pointer',
            transition: 'color 150ms',
          }}
        >
          <IconHeart size={12} filled={wishlisted} />
        </button>
      </div>

      {/* Info — ruled, no padding box */}
      <div style={{ paddingTop: '0.75rem', paddingBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <h3 className="font-display" style={{ margin: 0, fontSize: '1.0625rem', fontWeight: 600, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '-0.01em' }}>
          <Link to={`/product/${product.slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>
            {product.name}
          </Link>
        </h3>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.125rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{ color: '#C9A84C', display: 'flex' }}>
                <IconStar size={11} />
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--luna-muted)', fontVariantNumeric: 'tabular-nums' }}>
                {liveRating} <span style={{ opacity: 0.6 }}>({liveCount})</span>
              </span>
            </div>
            <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 700, fontSize: '1rem', color: 'var(--luna-1)', letterSpacing: '-0.01em' }}>
              {formatPrice(salePrice ?? product.codPrice)}
            </span>
          </div>
          {salePrice && (
            <span style={{ fontVariantNumeric: 'tabular-nums', fontSize: '0.75rem', color: 'var(--luna-muted)', textDecoration: 'line-through', alignSelf: 'flex-end' }}>
              {formatPrice(product.codPrice)}
            </span>
          )}
          {product.inStock && (
            <button
              onClick={handleAddToCart}
              className="btn btn-primary"
              style={{
                width: '100%', justifyContent: 'center',
                fontSize: '0.75rem', letterSpacing: '0.08em',
                textTransform: 'uppercase' as const,
                minHeight: 38, padding: '0 1rem',
                marginTop: '0.5rem',
              }}
            >
              Add to Bag
            </button>
          )}
      </div>
    </article>
  );
});
