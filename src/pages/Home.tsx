import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ProductCard } from '../components/ProductCard';
import { IconArrowRight, IconChevronLeft, IconChevronRight, IconTruck, IconShield, IconRefresh, IconMapPin } from '../components/icons/Icons';
import { BRAND } from '../config';
import { getRecentIds } from '../utils/recentlyViewed';
import { useAllProducts, useSlides, useCategories, useNewArrivals } from '../hooks/useStoreData';
import { useSEO } from '../hooks/useSEO';

function HeroSlider() {
  const slides = useSlides();
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);
  const timerRef = useRef<number>(0);
  const touchStartX = useRef(0);

  const goTo = useCallback((idx: number) => {
    if (animating) return;
    setAnimating(true);
    setCurrent(idx);
    setTimeout(() => setAnimating(false), 500);
  }, [animating]);

  const next = useCallback(() => goTo((current + 1) % slides.length), [current, goTo, slides.length]);
  const prev = useCallback(() => goTo((current - 1 + slides.length) % slides.length), [current, goTo, slides.length]);

  useEffect(() => {
    timerRef.current = window.setInterval(next, 5500);
    return () => window.clearInterval(timerRef.current);
  }, [next]);

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }
  function onTouchEnd(e: React.TouchEvent) {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) diff > 0 ? next() : prev();
  }

  const slide = slides[current];

  return (
    <section
      style={{ position: 'relative', height: 'min(90vh, 720px)', overflow: 'hidden', userSelect: 'none', contain: 'layout paint', willChange: 'auto' }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Background image */}
      {slides.map((s, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            inset: 0,
            opacity: i === current ? 1 : 0,
            transition: 'opacity 600ms var(--ease-spring)',
          }}
        >
          <img
            src={s.image}
            alt=""
            loading={i === 0 ? 'eager' : 'lazy'}
            fetchPriority={i === 0 ? 'high' : 'low'}
            decoding={i === 0 ? 'sync' : 'async'}
            width="1280"
            height="720"
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(26,22,20,0.72) 0%, rgba(26,22,20,0.40) 55%, rgba(26,22,20,0.18) 100%)' }} />
        </div>
      ))}

      {/* Content */}
      <div
        key={current}
        className="hero-content-enter"
        style={{
          position: 'relative',
          zIndex: 2,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          maxWidth: 1280,
          margin: '0 auto',
          padding: '0 1.5rem',
        }}
      >
        <p className="eyebrow" style={{ marginBottom: '1.25rem', color: 'var(--luna-1)' }}>{slide.eyebrow}</p>
        <h1
          className="font-display"
          style={{
            fontSize: 'clamp(2.5rem, 6vw, 5rem)',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            lineHeight: 1.08,
            margin: '0 0 1.25rem',
            whiteSpace: 'pre-line',
            maxWidth: 620,
            color: '#FFFFFF',
          }}
        >
          {slide.title}
        </h1>
        <p style={{ fontSize: '1.0625rem', color: 'rgba(255,255,255,0.72)', margin: '0 0 2.5rem', maxWidth: 380 }}>{slide.sub}</p>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Link to={slide.ctaTo} className="btn btn-primary" style={{ gap: '0.5rem' }}>
            {slide.ctaLabel}
            <IconArrowRight />
          </Link>
          {slide.cta2Label && (
            <Link to={slide.cta2To} className="btn btn-outline">
              {slide.cta2Label}
            </Link>
          )}
        </div>
      </div>

      {/* Arrows */}
      <button
        onClick={prev}
        aria-label="Previous slide"
        style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', zIndex: 3, width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.88)', border: '1px solid rgba(255,255,255,0.25)', color: '#1A1A1A', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 150ms' }}
      >
        <IconChevronLeft size={14} />
      </button>
      <button
        onClick={next}
        aria-label="Next slide"
        style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', zIndex: 3, width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.88)', border: '1px solid rgba(255,255,255,0.25)', color: '#1A1A1A', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 150ms' }}
      >
        <IconChevronRight size={20} />
      </button>

      {/* Dots */}
      <div style={{ position: 'absolute', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)', zIndex: 3, display: 'flex', alignItems: 'center' }}>
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Go to slide ${i + 1}`}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '1rem 0.375rem', display: 'flex', alignItems: 'center' }}
          >
            <span style={{
              display: 'block',
              width: i === current ? 24 : 8,
              height: 8,
              borderRadius: 4,
              background: i === current ? 'var(--luna-1)' : 'rgba(255,255,255,0.35)',
              transition: 'width 300ms var(--ease-spring), background 300ms',
            }} />
          </button>
        ))}
      </div>
    </section>
  );
}

/* ── USP Strip ────────────────────────────────────────────────── */
function UspStrip() {
  const items = [
    { icon: <IconTruck />, label: 'Free delivery', sub: 'On orders above Rs. 2,000' },
    { icon: <IconMapPin />, label: 'Cash on delivery', sub: 'At your doorstep, Pakistan-wide' },
    { icon: <IconShield />, label: '12-month warranty', sub: 'On every watch we sell' },
    { icon: <IconRefresh />, label: '7-day returns', sub: 'Unused, in original packaging' },
  ];

  return (
    <section style={{ borderTop: '1px solid rgba(0,0,0,0.07)', borderBottom: '1px solid rgba(0,0,0,0.07)', background: '#FFFFFF', marginTop: '3rem' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0' }}>
          {items.map((item, i) => (
            <div
              key={i}
              className="row-hover"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '1.5rem 1.25rem',
                borderRight: i < items.length - 1 ? '1px solid rgba(0,0,0,0.07)' : 'none',
                transition: 'background 150ms',
              }}
            >
              <span style={{ color: 'var(--luna-2)', flexShrink: 0 }}>{item.icon}</span>
              <div>
                <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9375rem', color: '#111111' }}>{item.label}</p>
                <p style={{ margin: 0, fontSize: '0.8125rem', color: '#777777', marginTop: '0.125rem' }}>{item.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Prepaid Banner ───────────────────────────────────────────── */
function PrepaidBanner() {
  return (
    <section style={{ maxWidth: 1280, margin: '0 auto', padding: '2rem 1.5rem 0' }}>
      <div style={{
        background: 'linear-gradient(135deg, rgba(201,168,76,0.10) 0%, rgba(201,168,76,0.04) 100%)',
        border: '1px solid rgba(201,168,76,0.22)',
        borderRadius: 'var(--radius)',
        padding: '1.25rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span className="badge badge-accent" style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem' }}>
            {BRAND.prepaidDiscount}% OFF
          </span>
          <div>
            <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9375rem' }}>Pay now, save {BRAND.prepaidDiscount}% instantly</p>
            <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--luna-muted)', marginTop: '0.125rem' }}>Prepaid via JazzCash, EasyPaisa, or bank transfer.</p>
          </div>
        </div>
        <Link to="/collections" className="btn btn-outline" style={{ fontSize: '0.8125rem', padding: '0.5rem 1.25rem' }}>
          Shop & Save
        </Link>
      </div>
    </section>
  );
}

/* ── Category Strip ───────────────────────────────────────────── */
function CategoryStrip() {
  const cats = useCategories();

  return (
    <section style={{ maxWidth: 1280, margin: '0 auto', padding: '2.5rem 1.25rem 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <p style={{ margin: 0, fontSize: '0.8125rem', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#111111' }}>Browse by category</p>
        <Link to="/collections" style={{ color: 'var(--luna-1)', fontSize: '0.875rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.375rem', fontWeight: 500 }}>
          View all <IconArrowRight size={14} />
        </Link>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.75rem' }}>
        {cats.map(cat => (
          <Link
            key={cat.label}
            to={cat.to}
            style={{ textDecoration: 'none', borderRadius: 'var(--radius)', overflow: 'hidden', display: 'block', position: 'relative', aspectRatio: '1', background: 'var(--luna-4)' }}
            className="img-card"
          >
            <img src={cat.img} alt={cat.label} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.75, transition: 'opacity 250ms, transform 350ms var(--ease-spring)' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(26,22,20,0.82) 0%, transparent 60%)', display: 'flex', alignItems: 'flex-end', padding: '0.875rem' }}>
              <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#FFFFFF' }}>{cat.label}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ── Featured Products ────────────────────────────────────────── */
function FeaturedProducts() {
  const allProducts = useAllProducts();
  const featured = allProducts.filter(p => p.featured).slice(0, 8);
  return (
    <section style={{ maxWidth: 1280, margin: '0 auto', padding: '2.5rem 1.25rem 0' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <p className="eyebrow" style={{ marginBottom: '0.375rem' }}>Featured</p>
          <h2 className="font-display" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 600, letterSpacing: '-0.02em', margin: 0 }}>Chosen for the discerning</h2>
        </div>
        <Link to="/collections" style={{ color: 'var(--luna-1)', fontSize: '0.875rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.375rem', fontWeight: 500 }}>
          Full collection <IconArrowRight size={14} />
        </Link>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '1rem' }}>
        {featured.map(p => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}

/* ── Editorial Dual Promo ─────────────────────────────────────── */
function DualPromo() {
  return (
    <section style={{ maxWidth: 1280, margin: '0 auto', padding: '2.5rem 1.25rem 0' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
        {/* Promo 1 */}
        <Link
          to="/collections/chronograph"
          style={{ textDecoration: 'none', borderRadius: 'var(--radius)', overflow: 'hidden', position: 'relative', display: 'block', minHeight: 340 }}
          className="card-hover"
        >
          <img
            src="https://images.unsplash.com/photo-1579543768549-96d37c1df78f?w=800&q=80"
            alt="Chronograph collection"
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(26,22,20,0.82) 30%, rgba(26,22,20,0.25) 100%)' }} />
          <div style={{ position: 'absolute', inset: 0, padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
            <p className="eyebrow" style={{ marginBottom: '0.5rem' }}>Chronograph</p>
            <h3 className="font-display" style={{ fontSize: '1.75rem', fontWeight: 600, letterSpacing: '-0.02em', margin: '0 0 0.75rem', color: 'var(--luna-fg)' }}>
              Time every<br />heartbeat
            </h3>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', color: 'var(--luna-1)', fontSize: '0.875rem', fontWeight: 500 }}>
              Shop Chronographs <IconArrowRight size={14} />
            </span>
          </div>
        </Link>

        {/* Promo 2 */}
        <Link
          to="/collections/luxury"
          style={{ textDecoration: 'none', borderRadius: 'var(--radius)', overflow: 'hidden', position: 'relative', display: 'block', minHeight: 340 }}
          className="card-hover"
        >
          <img
            src="https://images.unsplash.com/photo-1772949400107-f35fd026ab77?w=800&q=80"
            alt="Luxury collection"
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0, objectPosition: 'center top' }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(26,22,20,0.82) 30%, rgba(26,22,20,0.25) 100%)' }} />
          <div style={{ position: 'absolute', inset: 0, padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
            <p className="eyebrow" style={{ marginBottom: '0.5rem' }}>Luxury Collection</p>
            <h3 className="font-display" style={{ fontSize: '1.75rem', fontWeight: 600, letterSpacing: '-0.02em', margin: '0 0 0.75rem', color: 'var(--luna-fg)' }}>
              Understated<br />excellence
            </h3>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', color: 'var(--luna-1)', fontSize: '0.875rem', fontWeight: 500 }}>
              Explore Luxury <IconArrowRight size={14} />
            </span>
          </div>
        </Link>
      </div>
    </section>
  );
}

/* ── New Arrivals ─────────────────────────────────────────────── */
function NewArrivals() {
  const allProducts = useAllProducts();
  const newOnes = useNewArrivals(allProducts);
  if (!newOnes.length) return null;
  return (
    <section style={{ maxWidth: 1280, margin: '0 auto', padding: '2.5rem 1.25rem 0' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <p className="eyebrow" style={{ marginBottom: '0.375rem' }}>Just landed</p>
          <h2 className="font-display" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 600, letterSpacing: '-0.02em', margin: 0 }}>New arrivals</h2>
        </div>
        <Link to="/collections" style={{ color: 'var(--luna-1)', fontSize: '0.875rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.375rem', fontWeight: 500 }}>
          All new <IconArrowRight size={14} />
        </Link>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '1rem' }}>
        {newOnes.map(p => <ProductCard key={p.id} product={p} />)}
      </div>
    </section>
  );
}

/* ── Testimonial ──────────────────────────────────────────────── */
function Testimonial() {
  const reviews = [
    { name: 'Ahmed K.', city: 'Lahore', text: 'Ordered the Meridian Slim on a Friday evening. It arrived the next morning. The watch is exactly as pictured — the leather strap is genuinely premium.', rating: 5, watch: 'Meridian Slim' },
    { name: 'Fatima R.', city: 'Karachi', text: 'I bought the Aurora Rose Gold as a gift. The packaging alone made her cry. Quality is exceptional for the price point. Will definitely order again.', rating: 5, watch: 'Aurora Rose Gold' },
    { name: 'Usman T.', city: 'Islamabad', text: 'Third watch from StarkBuy. Never had an issue. COD is seamless, delivery is fast, and returns policy gave me confidence to try a new style.', rating: 5, watch: 'Commander Sport' },
  ];

  return (
    <section style={{ maxWidth: 1280, margin: '0 auto', padding: '2.5rem 1.25rem 0' }}>
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <p className="eyebrow" style={{ marginBottom: '0.5rem' }}>Customer stories</p>
        <h2 className="font-display" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 600, letterSpacing: '-0.02em', margin: 0 }}>
          Worn across Pakistan
        </h2>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
        {reviews.map((r, i) => (
          <div
            key={i}
            className="surface-hover"
            style={{
              background: '#FFFFFF',
              border: '1px solid rgba(0,0,0,0.07)',
              borderRadius: 'var(--radius)',
              padding: '1.5rem',
            }}
          >
            <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1rem', color: '#f59e0b' }}>
              {Array.from({ length: r.rating }).map((_, j) => (
                <svg key={j} width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              ))}
            </div>
            <p style={{ fontSize: '0.9375rem', lineHeight: 1.65, color: 'var(--luna-fg)', margin: '0 0 1.25rem', fontStyle: 'italic' }}>
              "{r.text}"
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <div>
                <p style={{ margin: 0, fontWeight: 600, fontSize: '0.875rem' }}>{r.name}</p>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--luna-muted)' }}>{r.city}</p>
              </div>
              <span className="badge badge-new" style={{ fontSize: '0.625rem' }}>{r.watch}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── CTA Section ──────────────────────────────────────────────── */
function CtaSection() {
  return (
    <section style={{ maxWidth: 1280, margin: '2.5rem auto 0', padding: '0 1.25rem' }}>
      <div
        style={{
          position: 'relative',
          borderRadius: 'var(--radius)',
          overflow: 'hidden',
          padding: '2.5rem 2rem',
          background: 'linear-gradient(135deg, rgba(201,168,76,0.08) 0%, rgba(255,255,255,0.6) 100%)',
          border: '1px solid rgba(201,168,76,0.18)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: '1.5rem',
        }}
      >
        <div>
          <p className="eyebrow" style={{ marginBottom: '0.75rem' }}>Any questions?</p>
          <h2 className="font-display" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', fontWeight: 600, letterSpacing: '-0.02em', margin: 0, maxWidth: 480 }}>
            Our concierge is a WhatsApp message away
          </h2>
        </div>
        <p style={{ color: 'var(--luna-muted)', fontSize: '1rem', maxWidth: 420, lineHeight: 1.65 }}>
          Unsure which watch to choose? Need to know about sizing, straps, or your order? Chat directly with a human — no bots.
        </p>
        <a
          href={`https://wa.me/${BRAND.whatsapp.replace(/\D/g, '')}?text=Hi%20StarkBuy%2C%20I%20need%20help%20with%20a%20watch%20order.`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary"
          style={{ background: '#25D366', color: '#fff' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          Chat on WhatsApp
        </a>
      </div>
    </section>
  );
}

/* ── Recently Viewed ──────────────────────────────────────────── */
function RecentlyViewed() {
  const allProducts = useAllProducts();
  const ids = getRecentIds();
  const recent = ids.map(id => allProducts.find(p => p.id === id)).filter(Boolean) as typeof allProducts;
  if (recent.length < 2) return null;
  return (
    <section style={{ maxWidth: 1280, margin: '0 auto', padding: '2.5rem 1.25rem 0' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <p className="eyebrow" style={{ marginBottom: '0.375rem' }}>Your history</p>
          <h2 className="font-display" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 600, letterSpacing: '-0.02em', margin: 0 }}>Recently Viewed</h2>
        </div>
        <Link to="/collections" className="btn btn-outline" style={{ display: 'flex', gap: '0.375rem', textDecoration: 'none' }}>
          See all <IconArrowRight />
        </Link>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '1.25rem' }}>
        {recent.slice(0, 4).map(p => <ProductCard key={p.id} product={p} />)}
      </div>
    </section>
  );
}

/* ── Page ─────────────────────────────────────────────────────── */
export default function Home() {
  useSEO({
    title: 'StarkBuy — Premium Watches in Pakistan | COD Available',
    description: 'Shop Analog, Chronograph, Sports & Automatic watches in Pakistan. Cash on delivery, free shipping above Rs. 2,000. Genuine timepieces at the best prices.',
    canonical: '/',
    ogType: 'website',
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'StarkBuy',
        url: 'https://www.starkbuypk.com',
        logo: 'https://www.starkbuypk.com/og-cover.jpg',
        contactPoint: { '@type': 'ContactPoint', telephone: '+923235901200', contactType: 'customer service', areaServed: 'PK', availableLanguage: ['English', 'Urdu'] },
        sameAs: ['https://www.instagram.com/starkbuypk', 'https://www.facebook.com/share/1GocVvCj5s/', 'https://www.tiktok.com/@starkbuy'],
      },
      {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        name: 'StarkBuy',
        description: 'Premium watch store in Pakistan offering Analog, Chronograph, Sports and Automatic watches with cash on delivery across Pakistan.',
        url: 'https://www.starkbuypk.com',
        telephone: '+923235901200',
        email: 'starkbuypk@gmail.com',
        areaServed: { '@type': 'Country', name: 'Pakistan' },
        currenciesAccepted: 'PKR',
        paymentAccepted: 'Cash on Delivery, JazzCash, EasyPaisa, Bank Transfer',
        priceRange: '₨₨',
      },
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        url: 'https://www.starkbuypk.com',
        name: 'StarkBuy',
        potentialAction: { '@type': 'SearchAction', target: { '@type': 'EntryPoint', urlTemplate: 'https://www.starkbuypk.com/collections?q={search_term_string}' }, 'query-input': 'required name=search_term_string' },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
          { '@type': 'Question', name: 'Do you deliver cash on delivery across Pakistan?', acceptedAnswer: { '@type': 'Answer', text: 'Yes, StarkBuy offers cash on delivery (COD) to all cities in Pakistan including Karachi, Lahore, Islamabad, Rawalpindi, Faisalabad, Peshawar, Quetta, and more.' } },
          { '@type': 'Question', name: 'How long does delivery take?', acceptedAnswer: { '@type': 'Answer', text: 'Standard delivery takes 1–3 working days. Orders above Rs. 2,000 get free shipping.' } },
          { '@type': 'Question', name: 'What is your return and exchange policy?', acceptedAnswer: { '@type': 'Answer', text: 'We accept exchanges within 7 days of delivery for unworn watches in original packaging. Contact us on WhatsApp with your order number.' } },
          { '@type': 'Question', name: 'Can I pay online and get a discount?', acceptedAnswer: { '@type': 'Answer', text: 'Yes! Prepaid orders via JazzCash, EasyPaisa, or bank transfer get an instant 10% discount on your total.' } },
          { '@type': 'Question', name: 'What types of watches do you sell?', acceptedAnswer: { '@type': 'Answer', text: 'StarkBuy sells Analog, Chronograph, Sports, Automatic, and Luxury watches. All watches come with a 12-month warranty.' } },
        ],
      },
    ],
  });

  return (
    <div style={{ paddingBottom: '4rem' }}>
      <HeroSlider />
      <UspStrip />
      <CategoryStrip />
      <NewArrivals />
      <RecentlyViewed />
    </div>
  );
}
