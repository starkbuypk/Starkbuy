import { useState } from 'react';
import { IconX } from '../icons/Icons';
import { BRAND } from '../../config';
import { useShippingConfig } from '../../hooks/useStoreData';

export function AnnouncementBar() {
  const [dismissed, setDismissed] = useState(false);
  const { threshold } = useShippingConfig();
  if (dismissed) return null;
  return (
    <div className="announcement-bar" style={{ position: 'relative' }}>
      <span>
        Cash on delivery across Pakistan — free shipping above {BRAND.currencySymbol} {threshold.toLocaleString()}.{' '}
        <a
          href="/collections"
          style={{ color: 'var(--luna-1)', textDecoration: 'none', fontWeight: 500 }}
        >
          Browse watches
        </a>
      </span>
      <button
        onClick={() => setDismissed(true)}
        className="btn-ghost"
        aria-label="Dismiss announcement"
        style={{
          position: 'absolute',
          right: '0.75rem',
          top: '50%',
          transform: 'translateY(-50%)',
          padding: '0.25rem',
          color: 'var(--luna-muted)',
          minHeight: 'auto',
        }}
      >
        <IconX size={14} />
      </button>
    </div>
  );
}
