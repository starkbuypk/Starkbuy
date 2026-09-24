import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BRAND } from '../config';

function IconUser() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4"/>
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
    </svg>
  );
}
function IconPackage() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
      <path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>
    </svg>
  );
}
function IconHeart() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
    </svg>
  );
}
function IconMap() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0Z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  );
}
function IconLogOut() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  );
}

const quickLinks = [
  { icon: <IconPackage />, label: 'My Orders', to: '/track-order', sub: 'Track & view order history' },
  { icon: <IconHeart />, label: 'Wishlist', to: '/wishlist', sub: 'Your saved watches' },
  { icon: <IconMap />, label: 'Saved Addresses', to: '/account', sub: 'Manage delivery addresses' },
];

export default function AccountPage() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate('/login', { replace: true });
  }, [user, loading, navigate]);

  if (loading || !user) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, border: '2px solid rgba(26,22,20,0.12)', borderTop: '2px solid var(--luna-1)', borderRadius: '50%', animation: 'spin 600ms linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const displayName = user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email?.split('@')[0] ?? 'Customer';
  const avatarUrl = user.user_metadata?.avatar_url as string | undefined;

  async function handleSignOut() {
    await signOut();
    navigate('/');
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '3rem 1.5rem 5rem' }}>

      {/* Profile card */}
      <div style={{
        background: '#FFFFFF',
        border: '1px solid rgba(0,0,0,0.08)',
        borderRadius: '1.25rem',
        padding: '2rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1.5rem',
        marginBottom: '2rem',
        flexWrap: 'wrap',
      }}>
        {avatarUrl ? (
          <img src={avatarUrl} alt={displayName} style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(26,22,20,0.15)', flexShrink: 0 }} />
        ) : (
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(26,22,20,0.08)', border: '2px solid rgba(26,22,20,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--luna-2)', flexShrink: 0 }}>
            <IconUser />
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p className="eyebrow" style={{ marginBottom: '0.25rem' }}>Welcome back</p>
          <h1 className="font-display" style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 0.25rem', wordBreak: 'break-word' }}>
            {displayName}
          </h1>
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--luna-muted)' }}>{user.email}</p>
        </div>
        <button
          onClick={handleSignOut}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.625rem 1rem',
            background: 'transparent',
            border: '1px solid rgba(26,22,20,0.12)',
            borderRadius: '0.625rem',
            color: 'var(--luna-muted)',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '0.875rem',
            cursor: 'pointer',
            transition: 'border-color 150ms, color 150ms',
            flexShrink: 0,
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(248,113,113,0.4)'; e.currentTarget.style.color = '#f87171'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(26,22,20,0.12)'; e.currentTarget.style.color = 'var(--luna-muted)'; }}
        >
          <IconLogOut /> Sign out
        </button>
      </div>

      {/* Quick links */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {quickLinks.map(link => (
          <Link
            key={link.to + link.label}
            to={link.to}
            style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '1rem', background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '1rem', padding: '1.25rem 1.5rem', transition: 'border-color 150ms, background 150ms' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(201,168,76,0.35)'; e.currentTarget.style.background = 'rgba(201,168,76,0.04)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.07)'; e.currentTarget.style.background = '#FFFFFF'; }}
          >
            <span style={{ color: 'var(--luna-2)', flexShrink: 0 }}>{link.icon}</span>
            <div>
              <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9375rem', color: 'var(--luna-fg)' }}>{link.label}</p>
              <p style={{ margin: '0.125rem 0 0', fontSize: '0.8125rem', color: 'var(--luna-muted)' }}>{link.sub}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Brand note */}
      <div style={{ background: 'rgba(26,22,20,0.04)', border: '1px solid rgba(26,22,20,0.07)', borderRadius: '1rem', padding: '1.5rem', textAlign: 'center' }}>
        <p style={{ margin: '0 0 0.375rem', fontWeight: 600, fontSize: '0.9375rem' }}>Need help?</p>
        <p style={{ margin: '0 0 1rem', fontSize: '0.875rem', color: 'var(--luna-muted)' }}>Our team is available on WhatsApp for any order questions.</p>
        <a
          href={`https://wa.me/${BRAND.whatsapp.replace(/\D/g, '')}?text=Hi%20StarkBuy%2C%20I%20need%20help%20with%20my%20account.`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-outline"
          style={{ display: 'inline-flex', textDecoration: 'none' }}
        >
          Chat on WhatsApp
        </a>
      </div>
    </div>
  );
}
