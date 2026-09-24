/* Functional stub pages — each at its own route */
import { Link } from 'react-router-dom';
import { products, formatPrice } from '../data/products';
import { ProductCard } from '../components/ProductCard';
import { useWishlist } from '../context/WishlistContext';
import { BRAND } from '../config';
import { useState, useEffect } from 'react';
import { IconChevronRight } from '../components/icons/Icons';
import { getAbout } from '../utils/adminStore';
import { supabaseUrl, supabaseAnonKey } from '../lib/supabase';

function PageShell({ title, eyebrow, children, description }: { title: string; eyebrow?: string; children?: React.ReactNode; description?: string }) {
  useEffect(() => {
    document.title = `${title} | StarkBuy`;
    let metaDesc = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!metaDesc) { metaDesc = document.createElement('meta'); metaDesc.setAttribute('name', 'description'); document.head.appendChild(metaDesc); }
    if (description) metaDesc.setAttribute('content', description);
    return () => { document.title = 'StarkBuy — Luxury Watches Pakistan'; };
  }, [title, description]);

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '3rem 1.5rem 5rem' }}>
      {eyebrow && <p className="eyebrow" style={{ marginBottom: '0.5rem' }}>{eyebrow}</p>}
      <h1 className="font-display" style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 2rem' }}>{title}</h1>
      {children}
    </div>
  );
}

/* Wishlist */
export function Wishlist() {
  const { ids } = useWishlist();
  const wishlistProducts = products.filter(p => ids.has(p.id));
  return (
    <PageShell title="Your Wishlist" eyebrow={`${wishlistProducts.length} item${wishlistProducts.length !== 1 ? 's' : ''}`}>
      {wishlistProducts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--luna-muted)' }}>
          <p style={{ marginBottom: '1rem' }}>Your wishlist is empty.</p>
          <Link to="/collections" className="btn btn-outline">Browse Collection</Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
          {wishlistProducts.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </PageShell>
  );
}

/* Checkout */
export function Checkout() {
  const [step, setStep] = useState(0);
  const steps = ['Contact', 'Shipping', 'Payment', 'Confirmation'];
  return (
    <PageShell title="Checkout">
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        {steps.map((s, i) => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.8125rem', fontWeight: 500, background: i === step ? 'var(--luna-1)' : 'rgba(26,22,20,0.08)', color: i === step ? 'var(--luna-5)' : 'var(--luna-muted)' }}>{s}</span>
            {i < steps.length - 1 && <IconChevronRight size={12} />}
          </div>
        ))}
      </div>
      {step < 3 ? (
        <div style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(26,22,20,0.08)', borderRadius: 'var(--radius)', padding: '2rem', marginBottom: '1.5rem' }}>
          <p style={{ color: 'var(--luna-muted)', marginBottom: '1.5rem', fontSize: '0.9375rem' }}>
            {step === 0 && 'Enter your contact details to receive order updates.'}
            {step === 1 && 'Enter your shipping address for delivery.'}
            {step === 2 && 'Choose your payment method. Pay now to save 10%.'}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 480 }}>
            {step === 0 && (
              <>
                <input placeholder="Full name" style={{ background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(26,22,20,0.12)', borderRadius: '0.5rem', padding: '0.75rem 1rem', color: 'var(--luna-fg)', fontFamily: 'DM Sans, sans-serif', outline: 'none', fontSize: '0.9375rem' }} />
                <input placeholder="Phone number" type="tel" style={{ background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(26,22,20,0.12)', borderRadius: '0.5rem', padding: '0.75rem 1rem', color: 'var(--luna-fg)', fontFamily: 'DM Sans, sans-serif', outline: 'none', fontSize: '0.9375rem' }} />
                <input placeholder="Email (optional)" type="email" style={{ background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(26,22,20,0.12)', borderRadius: '0.5rem', padding: '0.75rem 1rem', color: 'var(--luna-fg)', fontFamily: 'DM Sans, sans-serif', outline: 'none', fontSize: '0.9375rem' }} />
              </>
            )}
            {step === 1 && (
              <>
                <input placeholder="Street address" style={{ background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(26,22,20,0.12)', borderRadius: '0.5rem', padding: '0.75rem 1rem', color: 'var(--luna-fg)', fontFamily: 'DM Sans, sans-serif', outline: 'none', fontSize: '0.9375rem' }} />
                <input placeholder="Area / Sector" style={{ background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(26,22,20,0.12)', borderRadius: '0.5rem', padding: '0.75rem 1rem', color: 'var(--luna-fg)', fontFamily: 'DM Sans, sans-serif', outline: 'none', fontSize: '0.9375rem' }} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <input placeholder="City" style={{ background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(26,22,20,0.12)', borderRadius: '0.5rem', padding: '0.75rem 1rem', color: 'var(--luna-fg)', fontFamily: 'DM Sans, sans-serif', outline: 'none', fontSize: '0.9375rem' }} />
                  <input placeholder="Postal code" style={{ background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(26,22,20,0.12)', borderRadius: '0.5rem', padding: '0.75rem 1rem', color: 'var(--luna-fg)', fontFamily: 'DM Sans, sans-serif', outline: 'none', fontSize: '0.9375rem' }} />
                </div>
              </>
            )}
            {step === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[
                  { label: 'Cash on Delivery', sub: 'Pay when you receive your order', badge: null },
                  { label: 'JazzCash / EasyPaisa', sub: `Save ${BRAND.prepaidDiscount}% — pay now and save instantly`, badge: `${BRAND.prepaidDiscount}% OFF` },
                  { label: 'Bank Transfer', sub: `Save ${BRAND.prepaidDiscount}% — transfer to our account`, badge: `${BRAND.prepaidDiscount}% OFF` },
                ].map(method => (
                  <label key={method.label} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: '#FFFFFF', border: '1px solid rgba(26,22,20,0.09)', borderRadius: 'var(--radius)', cursor: 'pointer' }}>
                    <input type="radio" name="payment" style={{ accentColor: 'var(--luna-1)', width: 16, height: 16 }} defaultChecked={method.label === 'Cash on Delivery'} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500, fontSize: '0.9375rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {method.label}
                        {method.badge && <span className="badge badge-accent">{method.badge}</span>}
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--luna-muted)', marginTop: '0.125rem' }}>{method.sub}</div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '3rem 0' }}>
          <div style={{ width: 64, height: 64, background: 'rgba(26,22,20,0.09)', border: '1px solid rgba(201,168,76,0.4)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', fontSize: '1.5rem' }}>✓</div>
          <h2 className="font-display" style={{ fontSize: '1.75rem', fontWeight: 600, letterSpacing: '-0.02em', marginBottom: '0.75rem' }}>Order Confirmed</h2>
          <p style={{ color: 'var(--luna-muted)', marginBottom: '2rem' }}>Your order has been placed. You'll receive a confirmation shortly.</p>
          <Link to="/" className="btn btn-primary">Continue Shopping</Link>
        </div>
      )}
      {step < 3 && (
        <button className="btn btn-primary" onClick={() => setStep(s => Math.min(s + 1, 3))}>
          {step === 2 ? 'Place Order' : 'Continue'}
        </button>
      )}
    </PageShell>
  );
}

/* Track Order */
export function TrackOrder() {
  const [submitted, setSubmitted] = useState(false);
  return (
    <PageShell title="Track Your Order" eyebrow="Order tracking">
      {!submitted ? (
        <div style={{ maxWidth: 480 }}>
          <p style={{ color: 'var(--luna-muted)', marginBottom: '1.5rem' }}>Enter your order number and phone number or email to check your delivery status.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input placeholder="Order number (e.g. SB-00123)" style={{ background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(26,22,20,0.12)', borderRadius: '0.5rem', padding: '0.75rem 1rem', color: 'var(--luna-fg)', fontFamily: 'DM Sans, sans-serif', outline: 'none', fontSize: '0.9375rem' }} />
            <input placeholder="Phone or email" style={{ background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(26,22,20,0.12)', borderRadius: '0.5rem', padding: '0.75rem 1rem', color: 'var(--luna-fg)', fontFamily: 'DM Sans, sans-serif', outline: 'none', fontSize: '0.9375rem' }} />
            <button className="btn btn-primary" onClick={() => setSubmitted(true)}>Track Order</button>
          </div>
        </div>
      ) : (
        <div style={{ maxWidth: 560 }}>
          <div style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(26,22,20,0.08)', borderRadius: 'var(--radius)', padding: '1.5rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <p style={{ fontSize: '0.8125rem', color: 'var(--luna-muted)', margin: 0 }}>Order number</p>
                <p style={{ fontWeight: 600, margin: '0.125rem 0 0', fontVariantNumeric: 'tabular-nums' }}>SB-00123</p>
              </div>
              <span className="badge badge-accent">In Transit</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                { label: 'Order placed', sub: 'Sep 15, 2026, 3:42 PM', done: true },
                { label: 'Processing', sub: 'Sep 15, 2026, 6:00 PM', done: true },
                { label: 'Dispatched', sub: 'Sep 16, 2026, 9:00 AM', done: true },
                { label: 'Out for delivery', sub: 'Expected today', done: false },
              ].map((status, i) => (
                <div key={i} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: status.done ? 'var(--luna-1)' : 'rgba(26,22,20,0.10)', border: status.done ? 'none' : '1px solid rgba(26,22,20,0.15)', flexShrink: 0, marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {status.done && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--luna-5)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                  </div>
                  <div>
                    <p style={{ fontWeight: 500, margin: 0, fontSize: '0.9375rem' }}>{status.label}</p>
                    <p style={{ color: 'var(--luna-muted)', margin: '0.125rem 0 0', fontSize: '0.8125rem' }}>{status.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <button onClick={() => setSubmitted(false)} style={{ background: 'none', border: 'none', color: 'var(--luna-1)', cursor: 'pointer', fontSize: '0.875rem', fontFamily: 'DM Sans, sans-serif', padding: 0 }}>
            Track another order
          </button>
        </div>
      )}
    </PageShell>
  );
}

/* Account */
export function Account() {
  return (
    <PageShell title="My Account" eyebrow="Account">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        {[
          { label: 'Order History', to: '/account', sub: 'View past and current orders' },
          { label: 'Address Book', to: '/account', sub: 'Manage delivery addresses' },
          { label: 'Loyalty Rewards', to: '/account', sub: 'Check your points balance' },
          { label: 'Privacy Center', to: '/account', sub: 'Manage your data' },
        ].map(item => (
          <div key={item.label} style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(26,22,20,0.08)', borderRadius: 'var(--radius)', padding: '1.5rem' }}>
            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1rem', fontWeight: 600 }}>{item.label}</h3>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--luna-muted)' }}>{item.sub}</p>
          </div>
        ))}
      </div>
      <p style={{ marginTop: '2rem', color: 'var(--luna-muted)', fontSize: '0.875rem' }}>
        Not signed in? <Link to="/login" style={{ color: 'var(--luna-1)', textDecoration: 'none' }}>Log in to your account</Link>
      </p>
    </PageShell>
  );
}

/* About */
export function About() {
  const about = getAbout();
  useEffect(() => {
    document.title = 'About StarkBuy — Our Story | Watches Pakistan';
    let m = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!m) { m = document.createElement('meta'); m.setAttribute('name', 'description'); document.head.appendChild(m); }
    m.setAttribute('content', 'Learn about StarkBuy — Pakistan\'s premium watch store. Our story, mission, and commitment to delivering genuine timepieces at the best prices with COD.');
    return () => { document.title = 'StarkBuy — Luxury Watches Pakistan'; };
  }, []);
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '3.5rem 1.5rem 6rem' }}>
      {/* Hero */}
      <div style={{ marginBottom: '4rem', borderBottom: '1px solid rgba(26,22,20,0.08)', paddingBottom: '3rem' }}>
        <p className="eyebrow" style={{ marginBottom: '0.75rem' }}>About {BRAND.name}</p>
        <h1 className="font-display" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 700, letterSpacing: '-0.03em', margin: '0 0 1.5rem', lineHeight: 1.05, maxWidth: 680 }}>
          {about.headline}
        </h1>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem', maxWidth: 780 }}>
          <p style={{ color: 'var(--luna-muted)', lineHeight: 1.8, margin: 0, fontSize: '0.9375rem' }}>{about.story}</p>
          <div>
            <p style={{ color: 'var(--luna-muted)', lineHeight: 1.8, margin: '0 0 1rem', fontSize: '0.9375rem' }}>{about.mission}</p>
            <p style={{ color: 'var(--luna-muted)', lineHeight: 1.8, margin: 0, fontSize: '0.9375rem', fontStyle: 'italic', borderLeft: '2px solid rgba(26,22,20,0.15)', paddingLeft: '1rem' }}>{about.teamNote}</p>
          </div>
        </div>
      </div>

      {/* Values */}
      <div style={{ marginBottom: '4rem' }}>
        <p className="eyebrow" style={{ marginBottom: '1.5rem' }}>What We Stand For</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
          {about.values.map((v, i) => (
            <div key={i} style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(26,22,20,0.08)', borderRadius: 'var(--radius)', padding: '1.5rem', transition: 'border-color 150ms, transform 150ms' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(26,22,20,0.15)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(26,22,20,0.08)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
            >
              <span style={{ fontSize: '1.25rem', display: 'block', marginBottom: '0.75rem', color: 'var(--luna-1)' }}>{v.icon}</span>
              <h3 style={{ margin: '0 0 0.375rem', fontSize: '0.9375rem', fontWeight: 600 }}>{v.title}</h3>
              <p style={{ margin: 0, color: 'var(--luna-muted)', fontSize: '0.875rem', lineHeight: 1.65 }}>{v.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Founded stat strip */}
      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', marginBottom: '3rem', padding: '2rem', background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(26,22,20,0.08)', borderRadius: 'var(--radius)' }}>
        {[
          { label: 'Founded', value: about.foundedYear },
          { label: 'Deliveries', value: '2,400+' },
          { label: 'Cities served', value: '50+' },
          { label: 'Return rate', value: '<3%' },
        ].map(stat => (
          <div key={stat.label}>
            <p style={{ margin: 0, fontSize: 'clamp(1.5rem,3vw,2rem)', fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: 'var(--luna-1)' }}>{stat.value}</p>
            <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--luna-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 500 }}>{stat.label}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <Link to="/collections" className="btn btn-primary">Shop the Collection</Link>
        <Link to="/support/contact-us" className="btn btn-outline">Contact Us</Link>
      </div>
    </div>
  );
}

/* Blog list */
const blogPosts = [
  { slug: 'how-to-choose-watch-size', title: 'How to Choose the Right Watch Size', tag: 'Guide', readTime: '4 min', excerpt: 'Case size affects comfort, proportion, and wrist presence. Here is how we recommend choosing yours.' },
  { slug: 'leather-vs-steel-bracelet', title: 'Leather vs. Steel Bracelet: A Practical Comparison', tag: 'Style', readTime: '5 min', excerpt: 'Both have their place. The choice depends on lifestyle, climate, and the occasions you dress for.' },
  { slug: 'cod-vs-prepaid-guide', title: 'COD vs. Prepaid — What Works Best for You', tag: 'Buying Guide', readTime: '3 min', excerpt: 'Cash on delivery offers peace of mind. Prepaid saves you 10%. Here is how to decide.' },
];

export function Blog() {
  return (
    <PageShell title="Journal" eyebrow="StarkBuy Journal">
      <div style={{ display: 'grid', gap: '1rem' }}>
        {blogPosts.map(post => (
          <Link key={post.slug} to={`/blog/${post.slug}`} style={{ textDecoration: 'none', display: 'block', background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(26,22,20,0.08)', borderRadius: 'var(--radius)', padding: '1.5rem', transition: 'border-color 150ms' }}>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', alignItems: 'center' }}>
              <span className="badge badge-accent">{post.tag}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--luna-muted)' }}>{post.readTime} read</span>
            </div>
            <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.125rem', fontWeight: 600, color: 'var(--luna-fg)' }}>{post.title}</h2>
            <p style={{ margin: 0, fontSize: '0.9375rem', color: 'var(--luna-muted)', lineHeight: 1.6 }}>{post.excerpt}</p>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}

export function BlogPost() {
  const post = blogPosts[0];
  return (
    <PageShell title={post.title} eyebrow={post.tag}>
      <div style={{ maxWidth: 640, color: 'var(--luna-muted)', lineHeight: 1.8 }}>
        <p>{post.excerpt}</p>
        <p style={{ marginTop: '1.25rem' }}>When choosing a watch case size, consider your wrist circumference. For wrists under 16cm, a 38–40mm case is typically the most proportionate. Above 18cm, a 42–44mm case fills the wrist naturally without looking oversized.</p>
        <p style={{ marginTop: '1.25rem' }}>Thickness matters as much as diameter. A slim case (under 9mm) disappears under a shirt cuff — ideal for dress watches worn to the office. A sport watch at 12mm wears proudly exposed.</p>
      </div>
      <div style={{ marginTop: '2rem' }}>
        <Link to="/blog" style={{ color: 'var(--luna-1)', fontSize: '0.875rem', textDecoration: 'none' }}>← Back to Journal</Link>
      </div>
    </PageShell>
  );
}

/* Auth stubs */
function AuthShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1.5rem' }}>
      <div style={{ width: '100%', maxWidth: 420, background: '#FFFFFF', border: '1px solid rgba(26,22,20,0.09)', borderRadius: 'var(--radius)', padding: '2.5rem' }}>
        <h1 className="font-display" style={{ fontSize: '2rem', fontWeight: 600, letterSpacing: '-0.02em', margin: '0 0 2rem' }}>{title}</h1>
        {children}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = { background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(26,22,20,0.12)', borderRadius: '0.5rem', padding: '0.75rem 1rem', color: 'var(--luna-fg)', fontFamily: 'DM Sans, sans-serif', outline: 'none', fontSize: '0.9375rem', width: '100%' };

export function Login() {
  return (
    <AuthShell title="Sign in">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <input placeholder="Email address" type="email" style={inputStyle} />
        <input placeholder="Password" type="password" style={inputStyle} />
        <Link to="/" className="btn btn-primary" style={{ display: 'flex' }}>Sign in</Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
          <Link to="/forgot-password" style={{ color: 'var(--luna-muted)', textDecoration: 'none' }}>Forgot password?</Link>
          <Link to="/register" style={{ color: 'var(--luna-1)', textDecoration: 'none' }}>Create account</Link>
        </div>
      </div>
    </AuthShell>
  );
}

export function Register() {
  return (
    <AuthShell title="Create account">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <input placeholder="Full name" style={inputStyle} />
        <input placeholder="Email address" type="email" style={inputStyle} />
        <input placeholder="Password" type="password" style={inputStyle} />
        <input placeholder="Confirm password" type="password" style={inputStyle} />
        <Link to="/" className="btn btn-primary" style={{ display: 'flex' }}>Create Account</Link>
        <p style={{ textAlign: 'center', fontSize: '0.8125rem', color: 'var(--luna-muted)', margin: 0 }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--luna-1)', textDecoration: 'none' }}>Sign in</Link>
        </p>
      </div>
    </AuthShell>
  );
}

export function ForgotPassword() {
  return (
    <AuthShell title="Reset password">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <p style={{ color: 'var(--luna-muted)', fontSize: '0.9375rem', margin: 0 }}>Enter your email and we'll send you a reset link.</p>
        <input placeholder="Email address" type="email" style={inputStyle} />
        <button className="btn btn-primary">Send Reset Link</button>
        <Link to="/login" style={{ textAlign: 'center', color: 'var(--luna-muted)', fontSize: '0.8125rem', textDecoration: 'none' }}>Back to sign in</Link>
      </div>
    </AuthShell>
  );
}

/* Support / Legal stubs */
function InfoPage({ title, eyebrow, content }: { title: string; eyebrow: string; content: string }) {
  return (
    <PageShell title={title} eyebrow={eyebrow}>
      <div style={{ maxWidth: 640, color: 'var(--luna-muted)', lineHeight: 1.8, fontSize: '0.9375rem' }}>
        <p>{content}</p>
      </div>
    </PageShell>
  );
}

export function ContactUs() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('Order Inquiry');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  useEffect(() => {
    document.title = 'Contact StarkBuy | WhatsApp & Email Support';
    let m = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!m) { m = document.createElement('meta'); m.setAttribute('name', 'description'); document.head.appendChild(m); }
    m.setAttribute('content', 'Contact StarkBuy on WhatsApp, email, or fill the form. We respond within 1 hour on WhatsApp. Cash on delivery watch store in Pakistan.');
    return () => { document.title = 'StarkBuy — Luxury Watches Pakistan'; };
  }, []);

  const inBase: React.CSSProperties = { width: '100%', background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(26,22,20,0.10)', borderRadius: '0.5rem', padding: '0.625rem 0.875rem', color: 'var(--luna-fg)', fontFamily: 'DM Sans, sans-serif', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box', transition: 'border-color 150ms' };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '3.5rem 1.5rem 6rem' }}>
      <p className="eyebrow" style={{ marginBottom: '0.75rem' }}>Support</p>
      <h1 className="font-display" style={{ fontSize: 'clamp(2rem,5vw,3rem)', fontWeight: 700, letterSpacing: '-0.03em', margin: '0 0 0.75rem' }}>Get in Touch</h1>
      <p style={{ color: 'var(--luna-muted)', fontSize: '0.9375rem', margin: '0 0 3rem', maxWidth: 480 }}>We typically respond within an hour on WhatsApp, and within 24 hours by email.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '3rem', alignItems: 'start' }}>
        {/* Contact channels */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {[
            {
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M5.339 3.147C4.063 3.147 3 4.21 3 5.486c0 .94.54 1.763 1.333 2.18L3.11 9.894c-.054.16.026.33.179.394.153.063.33-.006.393-.157l1.224-3.014C5.297 7.27 5.724 7.38 6.177 7.38c1.276 0 2.339-1.063 2.339-2.338C8.516 3.765 7.954 3 6.684 3a2.34 2.34 0 0 0-1.345.147"/></svg>
              ),
              label: 'WhatsApp',
              value: BRAND.whatsapp,
              sub: 'Fastest — typically under 1 hour',
              href: `https://wa.me/${BRAND.whatsapp.replace(/\D/g,'')}`,
              color: '#25D366',
            },
            {
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
              ),
              label: 'Email',
              value: BRAND.email,
              sub: 'Response within 24 hours',
              href: `mailto:${BRAND.email}`,
              color: 'var(--luna-1)',
            },
            {
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              ),
              label: 'Location',
              value: 'Rawalpindi, Pakistan',
              sub: 'Nationwide delivery',
              href: undefined,
              color: 'var(--luna-2)',
            },
          ].map(ch => (
            <a
              key={ch.label}
              href={ch.href}
              target={ch.href?.startsWith('http') ? '_blank' : undefined}
              rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '1.25rem', background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(26,22,20,0.08)', borderRadius: 'var(--radius)', textDecoration: 'none', color: 'inherit', transition: 'border-color 150ms, transform 150ms', cursor: ch.href ? 'pointer' : 'default' }}
              onMouseEnter={e => { if (ch.href) { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(201,168,76,0.35)'; (e.currentTarget as HTMLElement).style.transform = 'translateX(4px)'; } }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(26,22,20,0.08)'; (e.currentTarget as HTMLElement).style.transform = 'translateX(0)'; }}
            >
              <div style={{ width: 38, height: 38, borderRadius: '0.5rem', background: 'rgba(26,22,20,0.06)', border: '1px solid rgba(26,22,20,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: ch.color, flexShrink: 0 }}>
                {ch.icon}
              </div>
              <div>
                <p style={{ margin: '0 0 0.125rem', fontSize: '0.8125rem', color: 'var(--luna-muted)', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{ch.label}</p>
                <p style={{ margin: '0 0 0.25rem', fontSize: '0.9375rem', fontWeight: 600, color: 'var(--luna-fg)' }}>{ch.value}</p>
                <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--luna-muted)' }}>{ch.sub}</p>
              </div>
            </a>
          ))}

          {/* Hours */}
          <div style={{ padding: '1.25rem', background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(26,22,20,0.06)', borderRadius: 'var(--radius)' }}>
            <p style={{ margin: '0 0 0.875rem', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--luna-muted)' }}>Support Hours</p>
            {[
              { days: 'Mon – Sat', hours: '10:00 AM – 10:00 PM' },
              { days: 'Sunday', hours: '12:00 PM – 8:00 PM' },
            ].map(h => (
              <div key={h.days} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid rgba(26,22,20,0.05)' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--luna-muted)' }}>{h.days}</span>
                <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--luna-fg)' }}>{h.hours}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Contact form */}
        {sent ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem', textAlign: 'center', background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(26,22,20,0.08)', borderRadius: 'var(--radius)' }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(134,239,172,0.1)', border: '1px solid rgba(134,239,172,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3A7A38" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <h2 className="font-display" style={{ fontSize: '1.5rem', fontWeight: 600, margin: '0 0 0.5rem' }}>Message Sent</h2>
            <p style={{ color: 'var(--luna-muted)', margin: '0 0 1.5rem', fontSize: '0.9375rem' }}>We'll get back to you within 24 hours.</p>
            <button onClick={() => { setSent(false); setName(''); setEmail(''); setMessage(''); }} className="btn btn-outline" style={{ fontSize: '0.875rem' }}>Send another</button>
          </div>
        ) : (
          <form onSubmit={async e => {
            e.preventDefault();
            setSending(true); setSendError('');
            try {
              const html = `<h2>New Inquiry — ${subject}</h2><p><strong>From:</strong> ${name} (${email})</p><p><strong>Message:</strong><br/>${message.replace(/\n/g, '<br/>')}</p>`;
              await fetch(`${supabaseUrl}/functions/v1/server/send-order-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseAnonKey}` },
                body: JSON.stringify({ to: { email: 'starkbuypk@gmail.com', name: 'StarkBuy Admin' }, subject: `[Contact] ${subject} from ${name}`, html }),
              });
              setSent(true);
            } catch {
              setSendError('Failed to send. Please contact us on WhatsApp.');
            } finally { setSending(false); }
          }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(26,22,20,0.08)', borderRadius: 'var(--radius)', padding: '1.75rem 2rem' }}>
            <p style={{ margin: '0 0 0.5rem', fontSize: '0.875rem', fontWeight: 600, letterSpacing: '0.04em' }}>Send a Message</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--luna-muted)', fontWeight: 500, marginBottom: '0.375rem' }}>Name</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" required style={inBase} onFocus={e => { e.currentTarget.style.borderColor = 'rgba(201,168,76,0.40)'; }} onBlur={e => { e.currentTarget.style.borderColor = 'rgba(26,22,20,0.10)'; }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--luna-muted)', fontWeight: 500, marginBottom: '0.375rem' }}>Email</label>
                <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="you@example.com" required style={inBase} onFocus={e => { e.currentTarget.style.borderColor = 'rgba(201,168,76,0.40)'; }} onBlur={e => { e.currentTarget.style.borderColor = 'rgba(26,22,20,0.10)'; }} />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--luna-muted)', fontWeight: 500, marginBottom: '0.375rem' }}>Subject</label>
              <select value={subject} onChange={e => setSubject(e.target.value)} style={{ ...inBase, cursor: 'pointer' }}>
                {['Order Inquiry', 'Exchange / Return', 'Product Question', 'Delivery Issue', 'Other'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--luna-muted)', fontWeight: 500, marginBottom: '0.375rem' }}>Message</label>
              <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="How can we help you?" required rows={5} style={{ ...inBase, resize: 'vertical' }} onFocus={e => { e.currentTarget.style.borderColor = 'rgba(201,168,76,0.40)'; }} onBlur={e => { e.currentTarget.style.borderColor = 'rgba(26,22,20,0.10)'; }} />
            </div>
            {sendError && <p style={{ color: '#C44830', fontSize: '0.8125rem', margin: 0 }}>{sendError}</p>}
            <button type="submit" disabled={sending} className="btn btn-primary" style={{ alignSelf: 'flex-start', opacity: sending ? 0.7 : 1 }}>{sending ? 'Sending…' : 'Send Message'}</button>
          </form>
        )}
      </div>
    </div>
  );
}

export function ExchangePolicy() {
  return <InfoPage title="Exchange Policy" eyebrow="Support" content="We accept exchanges within 7 days of delivery for unworn watches in original packaging with all tags attached. To initiate an exchange, contact us on WhatsApp with your order number. We will arrange a pickup from your address and dispatch the replacement once the returned item is verified." />;
}

export function SizeGuide() {
  return (
    <PageShell title="Watch Size Guide" eyebrow="Size Guide">
      <div style={{ maxWidth: 580 }}>
        <p style={{ color: 'var(--luna-muted)', marginBottom: '1.5rem' }}>Use your wrist circumference to find the right case size.</p>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9375rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(26,22,20,0.09)' }}>
              {['Wrist size', 'Recommended case', 'Fit'].map(h => <th key={h} style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.8125rem', color: 'var(--luna-muted)', fontWeight: 500 }}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {[
              ['Under 15cm', '38mm', 'Slim, dress-appropriate'],
              ['15–16.5cm', '40mm', 'Versatile, everyday'],
              ['16.5–18cm', '42mm', 'Balanced, modern'],
              ['18cm+', '44mm', 'Bold, sporty presence'],
            ].map(row => (
              <tr key={row[0]} style={{ borderBottom: '1px solid rgba(26,22,20,0.06)' }}>
                {row.map((cell, i) => <td key={i} style={{ padding: '0.875rem 0.75rem', color: i === 0 ? 'var(--luna-fg)' : 'var(--luna-muted)', fontVariantNumeric: 'tabular-nums' }}>{cell}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
}

export function PaymentMethods() {
  return (
    <PageShell title="Payment Methods" eyebrow="Support">
      <div style={{ maxWidth: 540, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {[
          { label: 'Cash on Delivery (COD)', desc: 'Pay when your order arrives. Available across Pakistan.' },
          { label: `JazzCash / EasyPaisa — save ${BRAND.prepaidDiscount}%`, desc: 'Transfer via mobile wallet. We confirm and ship same day.' },
          { label: `Bank Transfer — save ${BRAND.prepaidDiscount}%`, desc: 'Transfer to our bank account. Share your receipt on WhatsApp.' },
        ].map(m => (
          <div key={m.label} style={{ padding: '1.25rem', background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(26,22,20,0.08)', borderRadius: 'var(--radius)' }}>
            <p style={{ fontWeight: 600, margin: '0 0 0.375rem' }}>{m.label}</p>
            <p style={{ color: 'var(--luna-muted)', fontSize: '0.875rem', margin: 0 }}>{m.desc}</p>
          </div>
        ))}
      </div>
    </PageShell>
  );
}

export function PrivacyPolicy() {
  return <InfoPage title="Privacy Policy" eyebrow="Legal" content={`StarkBuy collects the minimum information required to process your order: name, phone number, and delivery address. We do not share your data with third parties except carriers required to fulfill your delivery. You may request deletion of your data at any time by contacting ${BRAND.email}.`} />;
}

export function TermsOfService() {
  return <InfoPage title="Terms of Service" eyebrow="Legal" content="By placing an order with StarkBuy, you agree that all items are subject to availability and that prices are displayed in Pakistani Rupees (PKR). StarkBuy reserves the right to cancel orders that cannot be fulfilled. Disputes will be resolved in accordance with Pakistani consumer protection law." />;
}

export function NotFound() {
  return (
    <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center' }}>
      <p className="eyebrow" style={{ marginBottom: '0.75rem' }}>404</p>
      <h1 className="font-display" style={{ fontSize: '3rem', fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 1rem' }}>Page not found</h1>
      <p style={{ color: 'var(--luna-muted)', marginBottom: '2rem' }}>This page doesn't exist or has moved.</p>
      <Link to="/" className="btn btn-primary">Return Home</Link>
    </div>
  );
}
