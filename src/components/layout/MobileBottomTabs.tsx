import { NavLink } from 'react-router-dom';
import { IconHome, IconBag, IconHeart, IconUser } from '../icons/Icons';
import { useWishlist } from '../../context/WishlistContext';

export function MobileBottomTabs() {
  const { count } = useWishlist();

  const tabs = [
    { to: '/', label: 'Home', icon: <IconHome size={22} />, end: true },
    { to: '/collections', label: 'Shop', icon: <IconBag size={22} />, end: false },
    { to: '/wishlist', label: 'Wishlist', icon: <IconHeart size={22} />, badge: count, end: false },
    { to: '/account', label: 'Account', icon: <IconUser size={22} />, end: false },
  ];

  return (
    <nav
      className="mobile-tabs"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 150,
        background: 'rgba(255,255,255,0.97)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        borderTop: '1px solid rgba(0,0,0,0.08)',
        display: 'none',
      }}
      id="mobile-tabs"
    >
      <div style={{ display: 'flex', justifyContent: 'space-around', padding: '0.5rem 0' }}>
        {tabs.map(t => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.end}
            style={({ isActive }) => ({
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.25rem',
              padding: '0.375rem 1rem',
              textDecoration: 'none',
              color: isActive ? 'var(--luna-1)' : 'var(--luna-muted)',
              fontSize: '0.625rem',
              fontWeight: 500,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              position: 'relative',
              minWidth: 60,
              transition: 'color 150ms',
            })}
          >
            {({ isActive }) => (
              <>
                <span style={{ position: 'relative', color: isActive ? 'var(--luna-1)' : 'var(--luna-muted)' }}>
                  {t.icon}
                  {t.badge && t.badge > 0 ? (
                    <span style={{
                      position: 'absolute',
                      top: -4,
                      right: -6,
                      minWidth: 14,
                      height: 14,
                      background: 'var(--luna-1)',
                      color: '#111111',
                      borderRadius: 999,
                      fontSize: 9,
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      lineHeight: 1,
                    }}>
                      {t.badge}
                    </span>
                  ) : null}
                </span>
                {t.label}
              </>
            )}
          </NavLink>
        ))}
      </div>
      <style>{`
        @media (max-width: 767px) { #mobile-tabs { display: block !important; } }
      `}</style>
    </nav>
  );
}
