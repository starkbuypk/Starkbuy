import { useState } from 'react';
import { IconX } from '../icons/Icons';
import { BRAND } from '../../config';

export function AnnouncementBar() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  return (
    <div className="announcement-bar" style={{ position: 'relative' }}>
      <span>
        Pay now &amp; save {BRAND.prepaidDiscount}% — prepaid orders get an instant discount at checkout.{' '}
        <a
          href="/checkout"
          style={{ color: 'var(--luna-1)', textDecoration: 'none', fontWeight: 500 }}
        >
          Shop now
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
