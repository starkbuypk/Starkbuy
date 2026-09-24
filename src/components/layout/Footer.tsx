import { useState } from 'react';
import { Link } from 'react-router-dom';
import { StarkBuyLogo } from '../StarkBuyLogo';
import { BRAND } from '../../config';
import { toast } from '../../utils/toast';

/* ── Social icons ─────────────────────────────────────────────── */
function IconInstagram() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <circle cx="12" cy="12" r="4"/>
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none"/>
    </svg>
  );
}
function IconFacebook() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
    </svg>
  );
}
function IconTiktok() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V9.03a8.16 8.16 0 0 0 4.77 1.52V7.11a4.85 4.85 0 0 1-1-.42z"/>
    </svg>
  );
}
function IconPhone() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.05 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 17z"/>
    </svg>
  );
}
function IconMail() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="16" x="2" y="4" rx="2"/>
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
    </svg>
  );
}
function IconMailSend() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="16" x="2" y="4" rx="2"/>
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
    </svg>
  );
}

/* ── Column data ──────────────────────────────────────────────── */
const columns = [
  {
    heading: 'Shop',
    links: [
      { label: 'All Watches', to: '/collections' },
      { label: 'Analog', to: '/collections/analog' },
      { label: 'Chronograph', to: '/collections/chronograph' },
      { label: 'Smart Watches', to: '/collections/smart' },
      { label: 'Luxury', to: '/collections/luxury' },
      { label: 'Sale', to: '/collections/sale' },
    ],
  },
  {
    heading: 'Support',
    links: [
      { label: 'Contact Us', to: '/support/contact-us' },
      { label: 'Track Order', to: '/track-order' },
      { label: 'Size Guide', to: '/support/size-guide' },
      { label: 'Payment Methods', to: '/support/payment-methods' },
      { label: 'Exchange Policy', to: '/support/exchange-policy' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About', to: '/about' },
      { label: 'Blog', to: '/blog' },
    ],
  },
  {
    heading: 'Account',
    links: [
      { label: 'My Account', to: '/account' },
      { label: 'Wishlist', to: '/wishlist' },
    ],
  },
];

/* ── Footer ───────────────────────────────────────────────────── */
export function Footer() {
  const [email, setEmail] = useState('');
  const [joined, setJoined] = useState(false);

  function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes('@')) return;
    setJoined(true);
    toast("You're subscribed — welcome to StarkBuy!");
    setEmail('');
  }

  const linkStyle: React.CSSProperties = {
    color: 'var(--luna-muted)',
    textDecoration: 'none',
    fontSize: '0.9375rem',
    lineHeight: 1,
    transition: 'color 150ms',
    display: 'block',
  };

  return (
    <footer style={{ background: '#FFFFFF', borderTop: '1px solid rgba(0,0,0,0.07)' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '3.5rem 1.5rem 0' }}>

        {/* ── Newsletter strip ──────────────────────────────────── */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '1.5rem',
          paddingBottom: '3rem',
          borderBottom: '1px solid rgba(0,0,0,0.07)',
        }}>
          <div style={{ flex: '1 1 280px', minWidth: 0 }}>
            <h3 style={{ margin: '0 0 0.375rem', fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, fontSize: 'clamp(1.375rem, 2.5vw, 1.75rem)', letterSpacing: '-0.01em', color: 'var(--luna-fg)' }}>
              First Dibs on Every Drop
            </h3>
            <p style={{ margin: 0, fontSize: '0.9375rem', color: 'var(--luna-muted)', lineHeight: 1.5 }}>
              Early access to every new arrival, straight to your inbox.
            </p>
          </div>
          <div style={{ flex: '1 1 min(340px, 100%)', minWidth: 0 }}>
            {joined ? (
              <p style={{ margin: 0, color: 'var(--luna-1)', fontSize: '0.9375rem' }}>✓ You're on the list. Watch for great drops!</p>
            ) : (
              <form onSubmit={handleJoin} style={{ display: 'flex', gap: '0.625rem' }}>
                <div style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.625rem',
                  background: 'rgba(0,0,0,0.04)',
                  border: '1px solid rgba(0,0,0,0.10)',
                  borderRadius: '0.625rem',
                  padding: '0 1rem',
                }}>
                  <span style={{ color: 'var(--luna-muted)', flexShrink: 0 }}><IconMailSend /></span>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@email.com"
                    required
                    style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--luna-fg)', fontFamily: 'DM Sans, sans-serif', fontSize: '0.9375rem', padding: '0.8125rem 0' }}
                  />
                </div>
                <button
                  type="submit"
                  style={{
                    flexShrink: 0,
                    padding: '0 1.5rem',
                    background: 'var(--luna-1)',
                    color: '#111111',
                    border: 'none',
                    borderRadius: '0.625rem',
                    fontFamily: 'DM Sans, sans-serif',
                    fontWeight: 700,
                    fontSize: '0.9375rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    letterSpacing: '0.01em',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2 11 13"/><path d="m22 2-7 20-4-9-9-4 20-7z"/></svg>
                  Join
                </button>
              </form>
            )}
          </div>
        </div>

        {/* ── Brand + columns grid ──────────────────────────────── */}
        <div className="footer-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(200px, 1.6fr) repeat(4, minmax(120px, 1fr))',
          gap: '2.5rem',
          padding: '3rem 0 2.5rem',
          borderBottom: '1px solid rgba(0,0,0,0.07)',
        }}>

          {/* Brand column */}
          <div>
            <StarkBuyLogo height={28} />
            <p style={{ margin: '1.125rem 0 1.5rem', fontSize: '0.9375rem', color: 'var(--luna-muted)', lineHeight: 1.65, maxWidth: 240 }}>
              Premium timepieces delivered across Pakistan. Cash on delivery at your doorstep.
            </p>

            {/* Social icons */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
              {[
                { href: 'https://www.instagram.com/starkbuypk', icon: <IconInstagram />, label: 'Instagram' },
                { href: 'https://www.facebook.com/share/1GocVvCj5s/?mibextid=wwXIfr', icon: <IconFacebook />, label: 'Facebook' },
                { href: 'https://www.tiktok.com/@starkbuy', icon: <IconTiktok />, label: 'TikTok' },
              ].map(s => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    border: '1px solid rgba(0,0,0,0.10)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--luna-muted)',
                    textDecoration: 'none',
                    transition: 'border-color 150ms, color 150ms',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#1A1A1A'; e.currentTarget.style.borderColor = 'rgba(201,168,76,0.55)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--luna-muted)'; e.currentTarget.style.borderColor = 'rgba(0,0,0,0.10)'; }}
                >
                  {s.icon}
                </a>
              ))}
            </div>

            {/* Contact info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <a
                href={`https://wa.me/${BRAND.whatsapp.replace(/\D/g, '')}`}
                target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--luna-muted)', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 150ms' }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--luna-fg)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--luna-muted)'; }}
              >
                <span style={{ color: 'var(--luna-2)' }}><IconPhone /></span>
                {BRAND.whatsapp}
              </a>
              <a
                href={`mailto:${BRAND.email}`}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--luna-muted)', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 150ms' }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--luna-fg)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--luna-muted)'; }}
              >
                <span style={{ color: 'var(--luna-2)' }}><IconMail /></span>
                {BRAND.email}
              </a>
            </div>
          </div>

          {/* Nav columns */}
          {columns.map(col => (
            <div key={col.heading}>
              <p style={{ margin: '0 0 1.25rem', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--luna-fg)' }}>
                {col.heading}
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                {col.links.map(l => (
                  <li key={l.to}>
                    <Link
                      to={l.to}
                      style={linkStyle}
                      onMouseEnter={e => { e.currentTarget.style.color = 'var(--luna-fg)'; }}
                      onMouseLeave={e => { e.currentTarget.style.color = 'var(--luna-muted)'; }}
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* ── Bottom bar ────────────────────────────────────────── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1.25rem',
          padding: '1.5rem 0',
          flexWrap: 'wrap',
        }}>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--luna-muted)' }}>
            © {new Date().getFullYear()} {BRAND.name}. All rights reserved.
          </p>
          <span style={{ color: 'rgba(0,0,0,0.12)', fontSize: '0.75rem' }}>·</span>
          <Link to="/legal/privacy-policy" style={{ fontSize: '0.875rem', color: 'var(--luna-muted)', textDecoration: 'none', transition: 'color 150ms' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--luna-fg)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--luna-muted)'; }}
          >Privacy Policy</Link>
          <span style={{ color: 'rgba(0,0,0,0.12)', fontSize: '0.75rem' }}>·</span>
          <Link to="/legal/terms-of-service" style={{ fontSize: '0.875rem', color: 'var(--luna-muted)', textDecoration: 'none', transition: 'color 150ms' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--luna-fg)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--luna-muted)'; }}
          >Terms of Service</Link>
        </div>

      </div>

      {/* Responsive grid collapse */}
      <style>{`
        @media (max-width: 900px) {
          .footer-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 540px) {
          .footer-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </footer>
  );
}
