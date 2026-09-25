import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSEO } from '../hooks/useSEO';
import { recordView } from '../utils/recentlyViewed';
import { formatPrice } from '../data/products';
import type { Strap } from '../data/products';
import { useAllProducts } from '../hooks/useStoreData';
import { ProductCard } from '../components/ProductCard';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { toast } from '../utils/toast';
import { IconChevronRight, IconHeart, IconTruck, IconShield, IconRefresh } from '../components/icons/Icons';
import { getReviews, addReview, hasUserReviewed, type Review } from '../utils/reviews';
import { useShippingConfig } from '../hooks/useStoreData';
import { BRAND } from '../config';

/* ── Star picker ──────────────────────────────────────────────── */
/* ── Lightbox ─────────────────────────────────────────────────── */
function Lightbox({ items, startIndex, onClose }: {
  items: { type: 'image' | 'video'; src: string }[];
  startIndex: number;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(startIndex);
  const touchStartX = useRef(0);
  const imageItems = items.filter(i => i.type === 'image');

  const prev = useCallback(() => setIdx(i => Math.max(0, i - 1)), []);
  const next = useCallback(() => setIdx(i => Math.min(imageItems.length - 1, i + 1)), [imageItems.length]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    }
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose, prev, next]);

  const current = imageItems[idx];
  if (!current) return null;

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(6px)' }}
      onTouchStart={e => { touchStartX.current = e.touches[0].clientX; }}
      onTouchEnd={e => {
        const dx = e.changedTouches[0].clientX - touchStartX.current;
        if (dx > 50) prev();
        else if (dx < -50) next();
      }}
    >
      {/* Close */}
      <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', border: 'none', color: '#fff', fontSize: '1.25rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>✕</button>

      {/* Counter */}
      <div style={{ position: 'absolute', top: '1rem', left: '50%', transform: 'translateX(-50%)', color: 'rgba(255,255,255,0.6)', fontSize: '0.8125rem', fontFamily: 'DM Sans, sans-serif' }}>
        {idx + 1} / {imageItems.length}
      </div>

      {/* Image */}
      <img
        src={current.src}
        alt=""
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '92vw', maxHeight: '88vh', objectFit: 'contain', borderRadius: '0.5rem', userSelect: 'none', boxShadow: '0 24px 80px rgba(0,0,0,0.6)' }}
      />

      {/* Prev arrow */}
      {idx > 0 && (
        <button onClick={e => { e.stopPropagation(); prev(); }} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
      )}

      {/* Next arrow */}
      {idx < imageItems.length - 1 && (
        <button onClick={e => { e.stopPropagation(); next(); }} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      )}

      {/* Dot strip */}
      {imageItems.length > 1 && (
        <div style={{ position: 'absolute', bottom: '1.25rem', left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: '0.375rem' }}>
          {imageItems.map((_, i) => (
            <button key={i} onClick={e => { e.stopPropagation(); setIdx(i); }} style={{ width: i === idx ? 20 : 6, height: 6, borderRadius: 3, border: 'none', background: i === idx ? '#fff' : 'rgba(255,255,255,0.35)', padding: 0, cursor: 'pointer', transition: 'width 200ms' }} />
          ))}
        </div>
      )}
    </div>
  );
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: 'flex', gap: '0' }}>
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} type="button"
          onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)} onClick={() => onChange(n)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem 0.25rem', color: n <= (hover || value) ? '#f59e0b' : 'rgba(26,22,20,0.2)', fontSize: '1.125rem', lineHeight: 1, transition: 'color 100ms', minWidth: 36 }}>★</button>
      ))}
    </div>
  );
}

/* ── Review card ──────────────────────────────────────────────── */
function ReviewCard({ review }: { review: Review }) {
  return (
    <div style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.18)', borderRadius: '0.625rem', padding: '0.875rem 1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {review.avatar && <img src={review.avatar} alt="" style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover' }} />}
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--luna-fg)' }}>{review.displayName}</span>
        </div>
        <div style={{ display: 'flex', gap: '1px', color: '#f59e0b', flexShrink: 0 }}>
          {[1, 2, 3, 4, 5].map(n => (
            <svg key={n} width="10" height="10" viewBox="0 0 24 24" fill={n <= review.rating ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.5}>
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          ))}
        </div>
      </div>
      <p style={{ color: 'var(--luna-muted)', fontSize: '0.8125rem', lineHeight: 1.6, margin: '0 0 0.375rem' }}>"{review.text}"</p>
      <span style={{ fontSize: '0.6875rem', color: 'rgba(122,109,101,0.7)' }}>{new Date(review.date).toLocaleDateString('en-PK', { month: 'short', year: 'numeric' })}</span>
    </div>
  );
}

/* ── Reviews section ──────────────────────────────────────────── */
function ReviewsSection({ productId, staticRating, staticCount, user }: {
  productId: string; staticRating: number; staticCount: number;
  user: { id: string; email?: string | null; user_metadata?: Record<string, string> } | null;
}) {
  const [reviews, setReviews] = useState<Review[]>(() => getReviews(productId));
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const alreadyReviewed = user ? hasUserReviewed(productId, user.id) : false;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !text.trim() || rating === 0) return;
    const review: Review = {
      id: `${user.id}-${Date.now()}`,
      userId: user.id,
      displayName: user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'Customer',
      avatar: user.user_metadata?.avatar_url,
      rating, text: text.trim(),
      date: new Date().toISOString(),
    };
    addReview(productId, review);
    setReviews(getReviews(productId));
    setSubmitted(true);
    setText('');
  }

  const totalCount = staticCount + reviews.length;
  const avgRating = reviews.length
    ? ((staticRating * staticCount + reviews.reduce((s, r) => s + r.rating, 0)) / totalCount).toFixed(1)
    : staticRating.toFixed(1);

  return (
    <div style={{ marginTop: '3.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', borderBottom: '1px solid rgba(26,22,20,0.08)', paddingBottom: '1rem' }}>
        <h2 className="font-display" style={{ fontSize: 'clamp(1.25rem, 2.5vw, 1.75rem)', fontWeight: 600, letterSpacing: '-0.02em', margin: 0 }}>
          Customer Reviews
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f59e0b' }}>
          {[1, 2, 3, 4, 5].map(n => (
            <svg key={n} width="14" height="14" viewBox="0 0 24 24" fill={n <= Math.round(parseFloat(avgRating)) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.5}>
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          ))}
          <span style={{ color: 'var(--luna-muted)', fontSize: '0.9375rem' }}>{avgRating} · {totalCount} reviews</span>
        </div>
      </div>

      {/* Write review form */}
      <div style={{ marginBottom: '2rem', background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(26,22,20,0.08)', borderRadius: 'var(--radius)', padding: '1rem 1.25rem' }}>
        {!user ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <p style={{ color: 'var(--luna-muted)', margin: 0, fontSize: '0.875rem' }}>Sign in to write a review</p>
            <Link to="/login" className="btn btn-outline" style={{ display: 'inline-flex', textDecoration: 'none', padding: '0.4375rem 1rem', fontSize: '0.8125rem', minHeight: 36 }}>Sign in</Link>
          </div>
        ) : alreadyReviewed || submitted ? (
          <p style={{ color: '#3A7A38', margin: 0, fontSize: '0.875rem' }}>✓ Thank you — your review is live.</p>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--luna-muted)', fontWeight: 500 }}>Your rating</span>
              <StarPicker value={rating} onChange={setRating} />
            </div>
            <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Share your experience..." rows={2} required
              style={{ width: '100%', background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.09)', borderRadius: '0.5rem', padding: '0.5625rem 0.75rem', color: 'var(--luna-fg)', fontFamily: 'DM Sans, sans-serif', fontSize: '0.875rem', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
              onFocus={e => { e.currentTarget.style.borderColor = 'rgba(201,168,76,0.4)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = 'rgba(26,22,20,0.10)'; }}
            />
            <button type="submit" style={{ alignSelf: 'flex-start', padding: '0.4375rem 1rem', background: 'var(--luna-1)', border: 'none', borderRadius: '0.5rem', color: 'var(--luna-5)', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>Post Review</button>
          </form>
        )}
      </div>

      {/* Customer reviews — only real submissions */}
      {reviews.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.875rem' }}>
          {reviews.map(r => <ReviewCard key={r.id} review={r} />)}
        </div>
      )}
      {reviews.length === 0 && (
        <p style={{ color: 'var(--luna-muted)', fontSize: '0.875rem', fontStyle: 'italic' }}>No reviews yet — be the first.</p>
      )}
    </div>
  );
}

/* ── Video player — click-to-play with poster thumbnail ────────── */
function VideoPlayer({ src, poster, videoRef, playing, onPlay }: {
  src: string;
  poster: string;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  playing: boolean;
  onPlay: () => void;
}) {
  return (
    <div style={{ position: 'relative', minHeight: 320, background: '#000', borderRadius: 'inherit' }}>
      {/* Always keep video in DOM so ref is valid for synchronous .play() in click handler */}
      <video
        ref={videoRef}
        src={src}
        controls
        playsInline
        preload="metadata"
        poster={poster || undefined}
        onError={(e) => { if (import.meta.env.DEV) console.error('Video load error:', (e.target as HTMLVideoElement).error); }}
        style={{
          width: '100%', height: 'auto', maxHeight: '72vh', minHeight: 280,
          display: 'block', background: '#000',
          opacity: playing ? 1 : 0,
          pointerEvents: playing ? 'auto' : 'none',
          transition: 'opacity 180ms ease',
        }}
      />
      {/* Overlay — visible only before user clicks play */}
      {!playing && (
        <div
          onClick={onPlay}
          role="button"
          aria-label="Play video"
          style={{
            position: 'absolute', inset: 0, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {poster && (
            <img
              src={poster}
              alt=""
              aria-hidden="true"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }}
            />
          )}
          <div style={{
            position: 'relative', zIndex: 1, width: 72, height: 72,
            borderRadius: '50%', background: 'rgba(255,255,255,0.92)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
            transition: 'transform 120ms ease',
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="#1A1614" style={{ marginLeft: 4 }}>
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
          </div>
          <p style={{
            position: 'absolute', bottom: '1rem', left: 0, right: 0,
            textAlign: 'center', color: 'rgba(255,255,255,0.85)',
            fontSize: '0.8125rem', zIndex: 1, fontWeight: 500, margin: 0,
          }}>
            Tap to play video
          </p>
        </div>
      )}
    </div>
  );
}

/* ── Main page ────────────────────────────────────────────────── */
export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { threshold: freeShipThreshold } = useShippingConfig();
  const allProducts = useAllProducts();
  const product = allProducts.find(p => p.slug === slug);
  const navigate = useNavigate();
  const { addToCart, openCart } = useCart();
  const { toggle, has } = useWishlist();
  const { user } = useAuth();

  const videoRef = useRef<HTMLVideoElement>(null);
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [selectedStrap, setSelectedStrap] = useState<Strap>(() => product?.strapOptions[0] ?? 'Leather');

  // Reset size/strap when product changes
  useEffect(() => {
    if (product) {
setSelectedStrap(product.strapOptions[0] ?? 'Leather');
    }
  }, [product?.id]);

  useEffect(() => {
    if (product) recordView(product.id);
  }, [product?.id]);

  // SEO — must run unconditionally (hooks rule); guards handle missing product
  useSEO({
    title: product ? `${product.name} — ${product.brand} | StarkBuy` : 'Watch not found | StarkBuy',
    description: product ? `${product.description.slice(0, 155)}...` : '',
    canonical: product ? `/product/${product.slug}` : '',
    ogImage: product?.image,
    ogType: 'product',
    jsonLd: product ? {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description: product.description,
      brand: { '@type': 'Brand', name: product.brand },
      image: product.image,
      sku: product.id,
      offers: {
        '@type': 'Offer',
        priceCurrency: 'PKR',
        price: product.discountPercent > 0 ? Math.round(product.codPrice * (1 - product.discountPercent / 100)) : product.codPrice,
        availability: product.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        seller: { '@type': 'Organization', name: 'StarkBuy' },
        url: `https://www.starkbuypk.com/product/${product.slug}`,
      },
      aggregateRating: { '@type': 'AggregateRating', ratingValue: product.rating, reviewCount: product.reviewCount },
    } : undefined,
  });

  useEffect(() => {
    if (!product) return;
    const id = 'seo-breadcrumb';
    let script = document.getElementById(id) as HTMLScriptElement | null;
    if (!script) { script = document.createElement('script'); script.id = id; script.type = 'application/ld+json'; document.head.appendChild(script); }
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.starkbuypk.com' },
        { '@type': 'ListItem', position: 2, name: 'Shop', item: 'https://www.starkbuypk.com/collections' },
        { '@type': 'ListItem', position: 3, name: product.category, item: `https://www.starkbuypk.com/collections/${product.category.toLowerCase().replace(/[^a-z]/g, '')}` },
        { '@type': 'ListItem', position: 4, name: product.name, item: `https://www.starkbuypk.com/product/${product.slug}` },
      ],
    });
    return () => { document.getElementById(id)?.remove(); };
  }, [product?.slug]);

  if (!product) {
    // Show loading while Supabase products are being fetched
    if (allProducts.length === 0) {
      return <div style={{ maxWidth: 1280, margin: '0 auto', padding: '3rem 1.25rem', textAlign: 'center', color: 'var(--luna-muted)' }}>Loading…</div>;
    }
    return (
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '3rem 1.25rem', textAlign: 'center', color: 'var(--luna-muted)' }}>
        <p style={{ fontSize: '1.0625rem' }}>Watch not found.</p>
        <Link to="/collections" className="btn btn-outline" style={{ display: 'inline-flex', marginTop: '1.25rem' }}>Back to Shop</Link>
      </div>
    );
  }

  const wishlisted = has(product.id);
  const salePrice = product.discountPercent > 0 ? Math.round(product.codPrice * (1 - product.discountPercent / 100)) : null;
  const displayPrice = salePrice ?? product.codPrice;
  const related = allProducts.filter(p => p.id !== product.id && (p.category === product.category || p.gender === product.gender)).slice(0, 4);

  function handleAddToCart() {
    addToCart({ product: product!, caseSize: (product!.caseSizeOptions[0] ?? '40mm'), strap: selectedStrap || product!.strapOptions[0], quantity: qty });
    toast(`${product!.name} added to bag`);
    openCart();
  }

  function handleBuyNow() {
    addToCart({ product: product!, caseSize: (product!.caseSizeOptions[0] ?? '40mm'), strap: selectedStrap || product!.strapOptions[0], quantity: qty });
    navigate('/checkout');
  }

  function handleWishlistToggle() {
    toggle(product!);
    toast(wishlisted ? 'Removed from wishlist' : `${product!.name} saved`, { type: wishlisted ? 'info' : 'success' });
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '1.25rem 1.25rem 3rem' }}>
      {/* Breadcrumb */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', color: 'var(--luna-muted)', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <Link to="/" style={{ color: 'var(--luna-muted)', textDecoration: 'none' }}>Home</Link>
        <IconChevronRight size={12} />
        <Link to="/collections" style={{ color: 'var(--luna-muted)', textDecoration: 'none' }}>Shop</Link>
        <IconChevronRight size={12} />
        <Link to={`/collections/${product.category.toLowerCase()}`} style={{ color: 'var(--luna-muted)', textDecoration: 'none' }}>{product.category}</Link>
        <IconChevronRight size={12} />
        <span style={{ color: 'var(--luna-fg)' }}>{product.name}</span>
      </nav>

      {/* Main layout: thumbnail strip | main image | info panel */}
      {(() => {
        const mediaItems: { type: 'image' | 'video'; src: string }[] = [
          ...product.gallery.map(src => ({ type: 'image' as const, src })),
          ...(product.video ? [{ type: 'video' as const, src: product.video }] : []),
        ];
        const activeMedia = mediaItems[activeImg] ?? mediaItems[0];
        const hasPrev = activeImg > 0;
        const hasNext = activeImg < mediaItems.length - 1;
        return (
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '1.5rem', alignItems: 'start' }} className="pd-grid">

        {/* Thumbnail strip — vertical */}
        {mediaItems.length > 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', width: 58 }} className="pd-thumbs">
            {mediaItems.map((item, i) => (
              <button
                key={i}
                onClick={() => { setActiveImg(i); setVideoPlaying(false); }}
                style={{ width: 58, height: 58, borderRadius: '0.375rem', overflow: 'hidden', border: i === activeImg ? '2px solid var(--luna-1)' : '2px solid rgba(26,22,20,0.08)', cursor: 'pointer', padding: 0, flexShrink: 0, background: 'rgba(26,22,20,0.45)', transition: 'border-color 150ms', position: 'relative' }}
                onMouseEnter={e => { if (i !== activeImg) e.currentTarget.style.borderColor = 'rgba(201,168,76,0.4)'; }}
                onMouseLeave={e => { if (i !== activeImg) e.currentTarget.style.borderColor = 'rgba(26,22,20,0.08)'; }}
              >
                {item.type === 'video' ? (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(26,22,20,0.6)' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                  </div>
                ) : (
                  <img src={item.src.startsWith('data:') || item.src.startsWith('blob:') ? item.src : item.src + (item.src.includes('?') ? '&w=144' : '?w=144')} alt={`View ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
              </button>
            ))}
          </div>
        )}

        {/* Right section: gallery + info */}
        <div style={{ display: 'grid', gridTemplateColumns: '0.8fr 1fr', gap: '2rem', alignItems: 'start' }} className="pd-inner">

          {/* Main image/video with arrows */}
          <div style={{ position: 'relative' }}>
            <div style={{ borderRadius: 'var(--radius)', overflow: 'hidden', background: activeMedia?.type === 'video' ? '#111' : '#EBEBEB', ...(activeMedia?.type === 'video' ? { minHeight: 320 } : { aspectRatio: '3/4' }) }}>
              {activeMedia?.type === 'video' ? (
                <VideoPlayer
                  src={activeMedia.src}
                  poster={product.gallery[0] ?? product.image ?? ''}
                  videoRef={videoRef}
                  playing={videoPlaying}
                  onPlay={() => {
                    const v = videoRef.current;
                    if (!v) return;
                    setVideoPlaying(true);
                    v.play().catch(() => {});
                  }}
                />
              ) : (
                <img
                  src={activeMedia?.src ?? product.image}
                  alt={product.name}
                  onClick={() => {
                    const imgItems = mediaItems.filter(m => m.type === 'image');
                    const clickedSrc = activeMedia?.src ?? product.image;
                    const imgIdx = imgItems.findIndex(m => m.src === clickedSrc);
                    setLightboxIndex(Math.max(0, imgIdx));
                    setLightboxOpen(true);
                  }}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', cursor: 'zoom-in' }}
                />
              )}
            </div>
            {/* Left / Right arrows */}
            {mediaItems.length > 1 && (
              <>
                <button
                  onClick={() => setActiveImg(i => Math.max(0, i - 1))}
                  disabled={!hasPrev}
                  aria-label="Previous"
                  style={{ position: 'absolute', top: '50%', left: '0.625rem', transform: 'translateY(-50%)', width: 36, height: 36, borderRadius: '50%', border: 'none', background: hasPrev ? 'rgba(255,255,255,0.90)' : 'rgba(0,0,0,0.08)', backdropFilter: 'blur(8px)', cursor: hasPrev ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 150ms', boxShadow: '0 2px 8px rgba(26,22,20,0.15)' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={hasPrev ? 'var(--luna-fg)' : 'rgba(26,22,20,0.25)'} strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <button
                  onClick={() => setActiveImg(i => Math.min(mediaItems.length - 1, i + 1))}
                  disabled={!hasNext}
                  aria-label="Next"
                  style={{ position: 'absolute', top: '50%', right: '0.625rem', transform: 'translateY(-50%)', width: 36, height: 36, borderRadius: '50%', border: 'none', background: hasNext ? 'rgba(255,255,255,0.90)' : 'rgba(0,0,0,0.08)', backdropFilter: 'blur(8px)', cursor: hasNext ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 150ms', boxShadow: '0 2px 8px rgba(26,22,20,0.15)' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={hasNext ? 'var(--luna-fg)' : 'rgba(26,22,20,0.25)'} strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
                {/* Dot indicators */}
                <div style={{ position: 'absolute', bottom: '0.75rem', left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: '0.375rem' }}>
                  {mediaItems.map((_, i) => (
                    <button key={i} onClick={() => setActiveImg(i)} style={{ width: i === activeImg ? 18 : 6, height: 6, borderRadius: 3, border: 'none', background: i === activeImg ? '#FFFFFF' : 'rgba(255,255,255,0.45)', padding: 0, cursor: 'pointer', transition: 'width 200ms, background 150ms' }} />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Info panel */}
          <div style={{ fontSize: '1rem' }}>
            {/* Category eyebrow */}
            <p style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--luna-2)', margin: '0 0 0.55rem' }}>
              {product.category}
            </p>

            {/* Product name */}
            <h1 className="font-display" style={{ fontSize: 'clamp(1.25rem, 2.5vw, 1.75rem)', fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 0.625rem', lineHeight: 1.1 }}>
              {product.name}
            </h1>

            {/* Rating */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', color: '#f59e0b' }}>
                {[1, 2, 3, 4, 5].map(n => (
                  <svg key={n} width="13" height="13" viewBox="0 0 24 24" fill={n <= Math.round(product.rating) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.5}>
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                ))}
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--luna-muted)' }}>{product.rating} · {product.reviewCount} reviews</span>
            </div>

            {/* Price */}
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.625rem', marginBottom: '0.3rem' }}>
                <span style={{ fontSize: 'clamp(1.25rem, 2.2vw, 1.625rem)', fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: salePrice ? 'var(--luna-1)' : 'var(--luna-fg)' }}>
                  {formatPrice(displayPrice)}
                </span>
                {salePrice && (
                  <span style={{ fontSize: '0.875rem', color: 'var(--luna-muted)', textDecoration: 'line-through', fontVariantNumeric: 'tabular-nums' }}>
                    {formatPrice(product.codPrice)}
                  </span>
                )}
                {product.discountPercent > 0 && (
                  <span className="badge badge-accent">{product.discountPercent}% OFF</span>
                )}
              </div>
            </div>

            {/* Strap selector */}
            {product.strapOptions.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <p style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--luna-muted)', marginBottom: '0.5rem' }}>
                  Strap: <span style={{ color: 'var(--luna-1)', fontWeight: 700 }}>{selectedStrap}</span>
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {product.strapOptions.map(strap => (
                    <button
                      key={strap}
                      onClick={() => setSelectedStrap(strap as Strap)}
                      style={{
                        padding: '0.35rem 0.875rem',
                        borderRadius: '0.375rem',
                        border: selectedStrap === strap ? '1.5px solid var(--luna-1)' : '1px solid rgba(26,22,20,0.15)',
                        background: selectedStrap === strap ? 'rgba(201,168,76,0.12)' : 'rgba(0,0,0,0.04)',
                        color: selectedStrap === strap ? 'var(--luna-1)' : 'var(--luna-muted)',
                        fontSize: '0.8125rem',
                        fontWeight: selectedStrap === strap ? 700 : 400,
                        cursor: 'pointer',
                        fontFamily: 'DM Sans, sans-serif',
                        transition: 'all 120ms',
                      }}
                    >
                      {strap}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div style={{ marginBottom: '1rem' }}>
              <p style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--luna-muted)', marginBottom: '0.4rem' }}>Quantity</p>
              <div style={{ display: 'flex', alignItems: 'center', background: '#FFFFFF', border: '1px solid rgba(26,22,20,0.10)', borderRadius: '0.5rem', overflow: 'hidden', width: 'fit-content' }}>
                <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{ width: 36, height: 36, background: 'none', border: 'none', color: 'var(--luna-fg)', cursor: 'pointer', fontSize: '1rem', fontFamily: 'DM Sans, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 150ms' }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(26,22,20,0.06)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}>−</button>
                <span style={{ minWidth: 36, textAlign: 'center', fontVariantNumeric: 'tabular-nums', fontWeight: 600, fontSize: '0.9375rem' }}>{qty}</span>
                <button onClick={() => setQty(q => q + 1)} style={{ width: 36, height: 36, background: 'none', border: 'none', color: 'var(--luna-fg)', cursor: 'pointer', fontSize: '1rem', fontFamily: 'DM Sans, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 150ms' }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(26,22,20,0.06)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}>+</button>
              </div>
            </div>

            {/* CTA buttons */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <button onClick={handleAddToCart} className="btn btn-outline" style={{ flex: 1, minWidth: 100, justifyContent: 'center', fontSize: '0.875rem', minHeight: 42, padding: '0 1rem', transition: 'all 150ms' }}>
                Add to Cart
              </button>
              <button onClick={handleBuyNow} className="btn btn-primary" style={{ flex: 1, minWidth: 100, justifyContent: 'center', fontSize: '0.875rem', minHeight: 42, padding: '0 1rem' }}>
                Buy Now
              </button>
              <button onClick={handleWishlistToggle} style={{ width: 42, height: 42, borderRadius: 'var(--radius)', background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(26,22,20,0.10)', color: wishlisted ? 'var(--luna-1)' : 'var(--luna-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'color 150ms, background 150ms' }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(26,22,20,0.08)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.95)'; }}>
                <IconHeart size={17} filled={wishlisted} />
              </button>
            </div>

            {/* Product metadata grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: 'rgba(26,22,20,0.06)', border: '1px solid rgba(26,22,20,0.08)', borderRadius: 'var(--radius)', overflow: 'hidden', marginBottom: '1rem' }}>
              {[
                { label: 'COLLECTION', value: product.brand },
                { label: 'CATEGORY', value: product.category },
                { label: 'AVAILABILITY', value: product.inStock ? 'In stock' : 'Sold out' },
                { label: 'GENDER', value: product.gender },
                { label: 'MOVEMENT', value: product.movement || '—' },
                { label: 'WATER RESISTANCE', value: product.waterResistance || '—' },
              ].map(item => (
                <div key={item.label} style={{ padding: '0.5rem 0.75rem', background: 'rgba(0,0,0,0.03)' }}>
                  <p style={{ margin: 0, fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--luna-muted)', textTransform: 'uppercase', marginBottom: '0.15rem' }}>{item.label}</p>
                  <p style={{ margin: 0, fontSize: '0.8125rem', fontWeight: 600, color: item.label === 'AVAILABILITY' ? (product.inStock ? '#3A7A38' : '#C44830') : 'var(--luna-fg)' }}>{item.value}</p>
                </div>
              ))}
            </div>

            {/* Trust strip */}
            <div style={{ display: 'flex', gap: '0.875rem', flexWrap: 'wrap', padding: '0.75rem 0', borderTop: '1px solid rgba(26,22,20,0.08)' }}>
              {[
                { icon: <IconTruck size={13} />, text: `Free delivery above ${BRAND.currencySymbol} ${freeShipThreshold.toLocaleString()}` },
                { icon: <IconShield size={13} />, text: '12-month warranty' },
                { icon: <IconRefresh size={13} />, text: '7-day returns' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--luna-muted)', fontSize: '0.8rem' }}>
                  <span style={{ color: 'var(--luna-2)' }}>{item.icon}</span>
                  {item.text}
                </div>
              ))}
            </div>

            {/* Description */}
            <div style={{ marginTop: '0.75rem', background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(26,22,20,0.08)', borderRadius: '0.5rem', padding: '0.75rem 0.875rem' }}>
              <p style={{ margin: 0, fontSize: '0.575rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--luna-muted)', marginBottom: '0.4rem' }}>Description</p>
              <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--luna-muted)', lineHeight: 1.65 }}>{product.description}</p>
            </div>

            {/* Case material */}
            {product.caseMaterial && (
              <div style={{ marginTop: '0.4rem', background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(26,22,20,0.08)', borderRadius: '0.5rem', padding: '0.75rem 0.875rem' }}>
                <p style={{ margin: 0, fontSize: '0.575rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--luna-muted)', marginBottom: '0.25rem' }}>Case Material</p>
                <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--luna-muted)', lineHeight: 1.65 }}>{product.caseMaterial}</p>
              </div>
            )}
          </div>
        </div>
      </div>
        );
      })()}

      {/* Reviews */}
      <ReviewsSection productId={product.id} staticRating={product.rating} staticCount={product.reviewCount} user={user} />

      {/* Related products */}
      {related.length > 0 && (
        <div style={{ marginTop: '5rem' }}>
          <h2 className="font-display" style={{ fontSize: 'clamp(1.25rem, 2.5vw, 1.75rem)', fontWeight: 600, letterSpacing: '-0.02em', marginBottom: '1.5rem' }}>You may also like</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '1.25rem' }}>
            {related.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      )}

      {/* Mobile sticky buy bar */}
      <div className="mobile-buy-bar" style={{ position: 'fixed', bottom: 'calc(env(safe-area-inset-bottom, 0px) + 4rem)', left: 0, right: 0, zIndex: 130, display: 'none', padding: '0.625rem 1rem', background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', borderTop: '1px solid rgba(26,22,20,0.09)', gap: '0.75rem', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontWeight: 700, fontVariantNumeric: 'tabular-nums', fontSize: '1rem', color: 'var(--luna-1)' }}>{formatPrice(displayPrice)}</p>
          <p style={{ margin: 0, fontSize: '0.6875rem', color: 'var(--luna-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {selectedStrap}
          </p>
        </div>
        <button onClick={handleAddToCart} className="btn btn-primary" style={{ padding: '0.5625rem 1.25rem', fontSize: '0.875rem', flexShrink: 0 }}>Add to Cart</button>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .pd-grid { grid-template-columns: 1fr !important; }
          .pd-thumbs { flex-direction: row !important; width: auto !important; }
          .pd-thumbs button { width: 50px !important; height: 50px !important; }
          .pd-inner { grid-template-columns: 1fr !important; gap: 2rem !important; }
        }
        @media (max-width: 767px) {
          .mobile-buy-bar { display: flex !important; }
        }
      `}</style>

      {/* Lightbox */}
      {lightboxOpen && (
        <Lightbox
          items={(() => {
            const mediaItems: { type: 'image' | 'video'; src: string }[] = [
              ...product.gallery.map(src => ({ type: 'image' as const, src })),
              ...(product.video ? [{ type: 'video' as const, src: product.video }] : []),
            ];
            return mediaItems;
          })()}
          startIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>
  );
}
