import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { StarkBuyLogo } from '../StarkBuyLogo';
import { IconSearch, IconBag, IconHeart, IconUser, IconMenu, IconX } from '../icons/Icons';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/AuthContext';
import { SearchOverlay } from './SearchOverlay';

function AccountDropdown({ user, onClose }: { user: { email?: string | null; user_metadata?: Record<string, string> }; onClose: () => void }) {
  const { signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const initials = (user.user_metadata?.full_name || user.email || 'U').charAt(0).toUpperCase();
  const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';

  async function handleSignOut() {
    onClose();
    await signOut();
    navigate('/');
  }

  function handleAdminClick() {
    onClose();
    navigate('/admin');
  }

  const items = [
    { icon: '👤', label: 'My Profile', to: '/account' },
    { icon: '📦', label: 'Order Tracking', to: '/track-order' },
    { icon: '📍', label: 'Saved Addresses', to: '/account' },
    { icon: '⭐', label: 'VIP Loyalty Points', to: '/account' },
  ];

  return (
    <div style={{
      position: 'absolute', top: 'calc(100% + 0.75rem)', right: 0,
      width: 280, background: '#FFFFFF', border: '1px solid rgba(26,26,26,0.10)',
      borderRadius: '1rem', boxShadow: '0 16px 48px rgba(0,0,0,0.14)', zIndex: 500,
      backdropFilter: 'blur(20px)', overflow: 'hidden',
      animation: 'dropdownIn 150ms ease',
    }}>
      {/* User info */}
      <div style={{ padding: '1.125rem 1.25rem', borderBottom: '1px solid rgba(26,22,20,0.08)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--luna-1)', color: '#FFF5EF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1rem', flexShrink: 0 }}>
          {initials}
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9375rem', color: 'var(--luna-fg)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{displayName}</p>
          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--luna-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</p>
        </div>
      </div>

      {/* Menu items */}
      <div style={{ padding: '0.5rem' }}>
        {items.map(item => (
          <Link key={item.label} to={item.to} onClick={onClose} style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.625rem 0.875rem',
            borderRadius: '0.625rem', textDecoration: 'none', color: 'var(--luna-fg)', fontSize: '0.9rem',
            fontWeight: 500, transition: 'background 120ms',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(26,22,20,0.06)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            <span style={{ fontSize: '1rem', width: 22, textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
            {item.label}
          </Link>
        ))}

        {/* Admin Dashboard — visible only when Supabase role = admin */}
        {isAdmin && (
          <button onClick={handleAdminClick} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.625rem 0.875rem',
            borderRadius: '0.625rem', border: 'none', color: 'var(--luna-fg)', fontSize: '0.9rem',
            fontWeight: 600, background: 'rgba(201,168,76,0.10)', transition: 'background 120ms', marginTop: '0.25rem',
            cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', textAlign: 'left',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(201,168,76,0.18)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(201,168,76,0.10)'; }}
          >
            <span style={{ fontSize: '1rem', width: 22, textAlign: 'center', flexShrink: 0 }}>⚙️</span>
            Admin Dashboard
          </button>
        )}

        {/* Logout */}
        <button onClick={handleSignOut} style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.625rem 0.875rem',
          borderRadius: '0.625rem', border: 'none', background: 'transparent', color: '#C44830',
          fontSize: '0.9rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
          transition: 'background 120ms', marginTop: '0.25rem', textAlign: 'left',
        }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(196,72,48,0.08)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
        >
          <span style={{ fontSize: '1rem', width: 22, textAlign: 'center', flexShrink: 0 }}>↩</span>
          Logout
        </button>
      </div>
    </div>
  );
}

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/collections', label: 'Shop' },
  { to: '/about', label: 'About' },
  { to: '/support/contact-us', label: 'Contact' },
];

export function Header() {
  const { totalItems, openCart } = useCart();
  const { count: wishlistCount } = useWishlist();
  const { user } = useAuth();
  const accountPath = user ? '/account' : '/login';
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  // Close dropdown on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [dropdownOpen]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const headerStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 200,
    transition: 'box-shadow 200ms',
    background: '#FFFFFF',
    borderBottom: scrolled ? 'none' : '1px solid rgba(26,26,26,0.08)',
    boxShadow: scrolled ? '0 2px 16px rgba(0,0,0,0.10)' : 'none',
  };

  const iconBtnStyle: React.CSSProperties = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 44,
    borderRadius: '0.5rem',
    color: '#1A1A1A',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    transition: 'background 150ms, color 150ms',
  };

  return (
    <>
      <header style={headerStyle}>
        <div className="header-inner" style={{ maxWidth: 1280, margin: '0 auto', padding: '0 1.5rem', height: 68, display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center' }}>
          {/* Left: hamburger + logo grouped together */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <button
              className="btn-ghost"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
              style={{ display: 'none', ...iconBtnStyle }}
              id="mobile-menu-btn"
            >
              <IconMenu />
            </button>
            <Link to="/" aria-label="StarkBuy home" style={{ textDecoration: 'none', flexShrink: 0 }}>
              <StarkBuyLogo height={32} />
            </Link>
          </div>

          {/* Center: nav perfectly centered via CSS grid */}
          <nav style={{ display: 'flex', gap: '0.125rem' }} className="desktop-nav">
            {navLinks.map(l => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === '/'}
                style={({ isActive }) => ({
                  paddingTop: '0.5rem',
                  paddingBottom: '0.375rem',
                  paddingLeft: '1.125rem',
                  paddingRight: '1.125rem',
                  fontSize: '0.9375rem',
                  fontWeight: 700,
                  letterSpacing: '0.07em',
                  textTransform: 'uppercase',
                  textDecoration: 'none',
                  color: isActive ? 'var(--luna-1)' : '#111111',
                  borderBottom: isActive ? '2.5px solid var(--luna-1)' : '2.5px solid transparent',
                  transition: 'color 150ms, border-color 150ms',
                })}
              >
                {l.label}
              </NavLink>
            ))}
          </nav>

          {/* Right: icons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', justifyContent: 'flex-end' }}>
            <button style={iconBtnStyle} onClick={() => setSearchOpen(true)} aria-label="Search" className="btn-ghost">
              <IconSearch />
            </button>
            <Link to="/wishlist" style={{ ...iconBtnStyle, textDecoration: 'none' }} aria-label="Wishlist" className="desktop-icon">
              <IconHeart />
              {wishlistCount > 0 && (
                <span style={{ position: 'absolute', top: 6, right: 6, minWidth: 16, height: 16, background: 'var(--luna-1)', color: '#111111', borderRadius: '999px', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1, padding: '0 3px' }}>
                  {wishlistCount}
                </span>
              )}
            </Link>
            {/* Account — dropdown if logged in, link to login if not */}
            <div ref={dropdownRef} style={{ position: 'relative' }} className="desktop-icon">
              {user ? (
                <button
                  onClick={() => setDropdownOpen(v => !v)}
                  aria-label="Account menu"
                  style={{ ...iconBtnStyle, background: dropdownOpen ? 'rgba(26,22,20,0.08)' : 'transparent' }}
                  className="btn-ghost"
                >
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--luna-1)', color: '#FFF5EF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8125rem' }}>
                    {(user.user_metadata?.full_name || user.email || 'U').charAt(0).toUpperCase()}
                  </div>
                </button>
              ) : (
                <Link to="/login" style={{ ...iconBtnStyle, textDecoration: 'none' }} aria-label="Login" className="btn-ghost">
                  <IconUser />
                </Link>
              )}
              {dropdownOpen && user && (
                <AccountDropdown user={user} onClose={() => setDropdownOpen(false)} />
              )}
            </div>
            <button style={iconBtnStyle} onClick={openCart} aria-label="Cart" className="btn-ghost">
              <IconBag />
              {totalItems > 0 && (
                <span style={{ position: 'absolute', top: 6, right: 6, minWidth: 16, height: 16, background: 'var(--luna-1)', color: '#111111', borderRadius: '999px', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1, padding: '0 3px' }}>
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <>
          <div
            className="drawer-overlay"
            onClick={() => setMobileMenuOpen(false)}
            style={{ zIndex: 300 }}
          />
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              bottom: 0,
              width: 'min(320px, 85vw)',
              zIndex: 301,
              display: 'flex',
              flexDirection: 'column',
              padding: '1.5rem',
              background: '#FFFFFF',
              borderRight: '1px solid rgba(26,26,26,0.08)',
              animation: 'slideInRight 300ms var(--ease-spring)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
              <StarkBuyLogo height={28} />
              <button className="btn-ghost" onClick={() => setMobileMenuOpen(false)} aria-label="Close menu">
                <IconX />
              </button>
            </div>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {navLinks.map(l => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  end={l.to === '/'}
                  onClick={() => setMobileMenuOpen(false)}
                  style={({ isActive }) => ({
                    padding: '0.875rem 1rem',
                    borderRadius: '0.5rem',
                    fontSize: '0.9375rem',
                    fontWeight: 600,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase' as const,
                    textDecoration: 'none',
                    color: isActive ? 'var(--luna-1)' : '#1A1A1A',
                    background: isActive ? 'rgba(201,168,76,0.08)' : 'transparent',
                    borderLeft: isActive ? '3px solid var(--luna-1)' : '3px solid transparent',
                  })}
                >
                  {l.label}
                </NavLink>
              ))}
            </nav>
            <div style={{ marginTop: 'auto', paddingTop: '2rem', borderTop: '1px solid rgba(26,22,20,0.08)' }}>
              <Link
                to={accountPath}
                onClick={() => setMobileMenuOpen(false)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--luna-muted)', fontSize: '0.875rem', textDecoration: 'none', padding: '0.5rem 0' }}
              >
                <IconUser size={16} /> My Account
              </Link>
            </div>
          </div>
        </>
      )}

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />

      <style>{`
        @media (max-width: 767px) {
          #mobile-menu-btn { display: flex !important; }
          .desktop-nav { display: none !important; }
          .desktop-icon { display: none !important; }
          .header-inner { grid-template-columns: auto 1fr !important; }
        }
        @keyframes dropdownIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
