import { useState, useMemo, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { formatPrice } from '../data/products';
import type { Product, WatchCategory, WatchGender, CaseSize, Strap } from '../data/products';
import { StarkBuyLogo } from '../components/StarkBuyLogo';
import { BRAND } from '../config';
import { getSlides, saveSlides, resetSlides, type HeroSlide } from '../data/slides';
import {
  getNewArrivalOverrides, setNewArrivalOverrides,
  DEFAULT_CATEGORIES, type CategoryConfig,
  getAbout, saveAbout, type AboutContent,
  getFreeShippingThreshold, saveFreeShippingThreshold,
  getShippingCost, saveShippingCost,
} from '../utils/adminStore';
import {
  dbGetOrders, dbUpdateOrderStatus, dbDeleteOrder, dbClearOrders, type StoredOrder,
  dbGetCoupons, dbSaveCoupon, dbUpdateCoupon, dbDeleteCoupon, dbClearCoupons, type StoredCoupon,
  dbGetAuditLog, dbAddAuditEntry, dbClearAuditLog, type AuditEntry,
  dbGetProducts, dbSaveProduct, dbDeleteProduct,
  dbGetConfig, dbSetConfig,
} from '../utils/supabaseStore';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { toast } from '../utils/toast';
import { EV_PRODUCTS, EV_SLIDES, EV_CATEGORIES } from '../hooks/useStoreData';

function dispatch(ev: string) { window.dispatchEvent(new CustomEvent(ev)); }

/* ── Custom confirm modal (replaces browser native dialog) ──────── */
interface ConfirmOptions { message: string; onConfirm: () => void; }
let _setConfirm: (opts: ConfirmOptions | null) => void = () => {};

function adminConfirm(message: string): Promise<boolean> {
  return new Promise(resolve => {
    _setConfirm({
      message,
      onConfirm: () => { _setConfirm(null); resolve(true); },
    });
    // If user closes via overlay, resolve false
  });
}

function ConfirmModal() {
  const [opts, setOpts] = useState<ConfirmOptions | null>(null);
  useEffect(() => { _setConfirm = setOpts; }, []);
  if (!opts) return null;
  return (
    <>
      <div
        onClick={() => { setOpts(null); }}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', zIndex: 1000, animation: 'fadeIn 150ms ease' }}
      />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        zIndex: 1001, background: '#FFFFFF', borderRadius: '1rem',
        boxShadow: '0 24px 64px rgba(0,0,0,0.18)', padding: '2rem 2rem 1.5rem',
        width: 'min(400px, 90vw)', animation: 'confirmIn 200ms cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(220,60,40,0.10)', border: '1.5px solid rgba(220,60,40,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', fontSize: '1.25rem' }}>⚠</div>
        <p style={{ margin: '0 0 1.75rem', textAlign: 'center', color: 'var(--luna-fg)', fontSize: '0.9375rem', lineHeight: 1.6 }}>{opts.message}</p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button
            onClick={() => setOpts(null)}
            style={{ flex: 1, padding: '0.625rem 1.25rem', borderRadius: '0.625rem', border: '1px solid rgba(0,0,0,0.12)', background: 'transparent', color: 'var(--luna-fg)', fontFamily: 'DM Sans, sans-serif', fontWeight: 500, fontSize: '0.9rem', cursor: 'pointer', transition: 'background 150ms' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.04)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >Cancel</button>
          <button
            onClick={opts.onConfirm}
            style={{ flex: 1, padding: '0.625rem 1.25rem', borderRadius: '0.625rem', border: 'none', background: '#DC3C28', color: '#FFFFFF', fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', transition: 'background 150ms' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#C03220'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#DC3C28'; }}
          >Delete</button>
        </div>
      </div>
      <style>{`
        @keyframes confirmIn { from { opacity:0; transform:translate(-50%,-50%) scale(0.92); } to { opacity:1; transform:translate(-50%,-50%) scale(1); } }
      `}</style>
    </>
  );
}

function AdminSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {[80, 48, 120].map((h, i) => (
        <div key={i} style={{ height: h, background: 'rgba(0,0,0,0.06)', borderRadius: 'var(--radius)', animation: 'sbPulse 1.4s ease-in-out infinite', animationDelay: `${i * 0.12}s` }} />
      ))}
      <style>{`@keyframes sbPulse { 0%,100%{opacity:1} 50%{opacity:0.45} }`}</style>
    </div>
  );
}

/* ── Types ───────────────────────────────────────────────────── */
type Section = 'analytics' | 'products' | 'orders' | 'coupons' | 'customers' | 'loyalty' | 'content' | 'about' | 'audit' | 'settings';

/* ── Constants ────────────────────────────────────────────────── */
const ALL_CATEGORIES: WatchCategory[] = ['Analog', 'Chronograph', 'Sports', 'A+ Replica', 'Automatic', 'Sale', 'Smart', 'Luxury'];
const ALL_GENDERS: WatchGender[] = ['Men', 'Women', 'Unisex'];
const ALL_SIZES: CaseSize[] = ['36mm', '38mm', '40mm', '42mm', '44mm', '46mm'];
const ALL_STRAPS: Strap[] = ['Leather', 'Steel Bracelet', 'Silicone', 'Mesh'];

/* ── Mock data ────────────────────────────────────────────────── */
function csvCell(val: string | number): string {
  const s = String(val ?? '');
  // Prefix formula-starting characters to prevent CSV injection in spreadsheet apps
  const safe = /^[=+\-@\t\r\n]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
}

function exportCSV(rows: Record<string, string | number>[], filename: string) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [headers.map(csvCell).join(','), ...rows.map(r => headers.map(h => csvCell(r[h] ?? '')).join(','))].join('\n');
  const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

/* ── Shared styles ────────────────────────────────────────────── */
const th: React.CSSProperties = {
  padding: '0.75rem 1rem', fontSize: '0.6875rem', fontWeight: 600,
  letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--luna-muted)',
  textAlign: 'left', borderBottom: '1px solid rgba(26,22,20,0.08)', whiteSpace: 'nowrap',
};
const td: React.CSSProperties = {
  padding: '0.875rem 1rem', fontSize: '0.875rem',
  borderBottom: '1px solid rgba(26,22,20,0.05)', verticalAlign: 'middle',
};

function FieldInput({ label, value, onChange, type = 'text', placeholder }: {
  label: string; value: string | number; onChange: (v: string) => void;
  type?: string; placeholder?: string;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
      <label style={{ fontSize: '0.75rem', color: 'var(--luna-muted)', fontWeight: 500 }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(26,22,20,0.12)', borderRadius: '0.5rem', padding: '0.5625rem 0.75rem', color: 'var(--luna-fg)', fontFamily: 'DM Sans, sans-serif', fontSize: '0.875rem', outline: 'none', width: '100%', boxSizing: 'border-box' }}
      />
    </div>
  );
}

function FieldTextarea({ label, value, onChange, rows = 3 }: {
  label: string; value: string; onChange: (v: string) => void; rows?: number;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
      <label style={{ fontSize: '0.75rem', color: 'var(--luna-muted)', fontWeight: 500 }}>{label}</label>
      <textarea
        rows={rows}
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(26,22,20,0.12)', borderRadius: '0.5rem', padding: '0.5625rem 0.75rem', color: 'var(--luna-fg)', fontFamily: 'DM Sans, sans-serif', fontSize: '0.875rem', outline: 'none', width: '100%', boxSizing: 'border-box', resize: 'vertical' }}
      />
    </div>
  );
}

function FieldSelect<T extends string>({ label, value, onChange, options }: {
  label: string; value: T; onChange: (v: T) => void; options: T[];
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
      <label style={{ fontSize: '0.75rem', color: 'var(--luna-muted)', fontWeight: 500 }}>{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value as T)}
        style={{ background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(26,22,20,0.12)', borderRadius: '0.5rem', padding: '0.5625rem 0.75rem', color: 'var(--luna-fg)', fontFamily: 'DM Sans, sans-serif', fontSize: '0.875rem', outline: 'none', width: '100%', boxSizing: 'border-box', cursor: 'pointer' }}
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function ImageUploadField({ label, value, onChange, compact }: {
  label: string; value: string; onChange: (v: string) => void; compact?: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage
        .from('product-images')
        .upload(path, file, { contentType: file.type, upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from('product-images').getPublicUrl(path);
      onChange(data.publicUrl);
    } catch (err) {
      toast('Image upload failed. Try pasting a URL instead.', { type: 'error' });
      if (import.meta.env.DEV) console.error('Storage upload error:', err);
    } finally {
      setUploading(false);
    }
  }

  const isBase64 = value.startsWith('data:');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
      <label style={{ fontSize: '0.75rem', color: 'var(--luna-muted)', fontWeight: 500 }}>{label}</label>
      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }} />

      {/* Drop zone / preview */}
      <div
        onClick={() => fileRef.current?.click()}
        onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f); }}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        style={{ border: dragOver ? '1.5px dashed var(--luna-1)' : '1.5px dashed rgba(201,168,76,0.35)', borderRadius: '0.625rem', padding: value ? '0' : '1rem 0.75rem', cursor: 'pointer', background: dragOver ? 'rgba(201,168,76,0.06)' : 'rgba(0,0,0,0.03)', transition: 'border-color 150ms, background 150ms', overflow: 'hidden', position: 'relative' }}
      >
        {value ? (
          <>
            <img src={value} alt="" style={{ width: '100%', height: compact ? 64 : 100, objectFit: 'cover', display: 'block' }} onError={e => { e.currentTarget.style.display = 'none'; }} />
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(26,22,20,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 150ms' }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '0')}>
              <span style={{ color: '#fff', fontSize: '0.75rem', fontWeight: 600, background: 'rgba(0,0,0,0.5)', padding: '0.25rem 0.75rem', borderRadius: 999 }}>Change image</span>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', color: 'var(--luna-muted)', pointerEvents: 'none' }}>
            <div style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>↑</div>
            <div style={{ fontSize: '0.75rem', fontWeight: 500 }}>{uploading ? 'Uploading…' : 'Click or drag image'}</div>
            <div style={{ fontSize: '0.6875rem', opacity: 0.65, marginTop: '0.125rem' }}>JPG · PNG · WEBP</div>
          </div>
        )}
      </div>

      {/* Divider + URL fallback */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0.125rem 0' }}>
        <div style={{ flex: 1, height: 1, background: 'rgba(26,22,20,0.07)' }} />
        <span style={{ fontSize: '0.625rem', color: 'var(--luna-muted)', letterSpacing: '0.04em' }}>OR PASTE URL</span>
        <div style={{ flex: 1, height: 1, background: 'rgba(26,22,20,0.07)' }} />
      </div>
      <input
        type="url"
        value={isBase64 ? '' : value}
        onChange={e => onChange(e.target.value)}
        placeholder="https://images.unsplash.com/..."
        style={{ background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(26,22,20,0.12)', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', color: 'var(--luna-fg)', fontFamily: 'DM Sans, sans-serif', fontSize: '0.8125rem', outline: 'none', width: '100%', boxSizing: 'border-box' }}
      />
      {value && (
        <button type="button" onClick={() => onChange('')} style={{ alignSelf: 'flex-start', fontSize: '0.6875rem', color: 'rgba(248,113,113,0.75)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'DM Sans, sans-serif' }}>Remove image</button>
      )}
    </div>
  );
}

function VideoUploadField({ label, value, onChange }: {
  label: string; value: string; onChange: (v: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    if (!file.type.startsWith('video/')) { toast('Only video files allowed', { type: 'error' }); return; }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'mp4';
      const path = `videos/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage
        .from('product-images')
        .upload(path, file, { contentType: file.type, upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from('product-images').getPublicUrl(path);
      onChange(data.publicUrl);
      toast('Video uploaded!', { type: 'success' });
    } catch (err) {
      toast('Video upload failed. Try pasting a URL instead.', { type: 'error' });
      if (import.meta.env.DEV) console.error('Video upload error:', err);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
      <label style={{ fontSize: '0.75rem', color: 'var(--luna-muted)', fontWeight: 500 }}>{label}</label>
      <input ref={fileRef} type="file" accept="video/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }} />

      {value ? (
        <div style={{ borderRadius: '0.625rem', overflow: 'hidden', background: '#000', position: 'relative' }}>
          <video src={value} controls style={{ width: '100%', maxHeight: 180, display: 'block', objectFit: 'contain' }} />
          <button type="button" onClick={() => onChange('')} style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(220,60,40,0.85)', color: '#fff', border: 'none', borderRadius: 6, padding: '3px 10px', fontSize: '0.6875rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>Remove</button>
        </div>
      ) : (
        <div
          onClick={() => !uploading && fileRef.current?.click()}
          style={{ border: '1.5px dashed rgba(201,168,76,0.4)', borderRadius: '0.625rem', padding: '1.25rem 0.75rem', cursor: uploading ? 'wait' : 'pointer', background: 'rgba(0,0,0,0.03)', textAlign: 'center', color: 'var(--luna-muted)', transition: 'border-color 150ms' }}
        >
          <div style={{ fontSize: '1.5rem', marginBottom: '0.375rem' }}>{uploading ? '⏳' : '▶'}</div>
          <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--luna-fg)' }}>{uploading ? 'Uploading...' : 'Click to upload video'}</div>
          <div style={{ fontSize: '0.6875rem', opacity: 0.6, marginTop: '0.25rem' }}>MP4 · MOV · WEBM — uploads directly to storage</div>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{ flex: 1, height: 1, background: 'rgba(26,22,20,0.07)' }} />
        <span style={{ fontSize: '0.6rem', color: 'var(--luna-muted)', letterSpacing: '0.04em' }}>OR PASTE URL</span>
        <div style={{ flex: 1, height: 1, background: 'rgba(26,22,20,0.07)' }} />
      </div>
      <input
        type="url"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="https://example.com/watch-promo.mp4"
        style={{ background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(26,22,20,0.12)', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', color: 'var(--luna-fg)', fontFamily: 'DM Sans, sans-serif', fontSize: '0.8125rem', outline: 'none', width: '100%', boxSizing: 'border-box' }}
      />
    </div>
  );
}

function CheckGroup<T extends string>({ label, options, selected, onChange }: {
  label: string; options: T[]; selected: T[]; onChange: (v: T[]) => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
      <label style={{ fontSize: '0.75rem', color: 'var(--luna-muted)', fontWeight: 500 }}>{label}</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
        {options.map(o => {
          const checked = selected.includes(o);
          return (
            <button
              key={o}
              type="button"
              onClick={() => onChange(checked ? selected.filter(x => x !== o) : [...selected, o])}
              style={{ padding: '0.3rem 0.75rem', borderRadius: '1rem', fontSize: '0.8125rem', border: checked ? '1px solid var(--luna-1)' : '1px solid rgba(26,22,20,0.12)', background: checked ? 'rgba(26,22,20,0.10)' : 'transparent', color: checked ? 'var(--luna-1)' : 'var(--luna-muted)', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', transition: 'all 120ms' }}
            >
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      onClick={() => onChange(!checked)}
      style={{ width: 36, height: 20, borderRadius: 10, background: checked ? 'rgba(201,168,76,0.35)' : 'rgba(26,22,20,0.08)', display: 'flex', alignItems: 'center', padding: '0 3px', cursor: 'pointer', transition: 'background 150ms', flexShrink: 0 }}
    >
      <div style={{ width: 14, height: 14, borderRadius: '50%', background: checked ? 'var(--luna-1)' : 'var(--luna-muted)', transform: checked ? 'translateX(16px)' : 'translateX(0)', transition: 'transform 150ms, background 150ms' }} />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const color = status === 'Delivered' || status === 'Published' ? 'rgba(34,197,94,0.12)' : status === 'Dispatched' ? 'rgba(154,109,90,0.12)' : status === 'Processing' ? 'rgba(251,191,36,0.12)' : 'rgba(26,22,20,0.06)';
  const text = status === 'Delivered' || status === 'Published' ? '#3A7A38' : status === 'Dispatched' ? 'var(--luna-2)' : status === 'Processing' ? '#fcd34d' : 'var(--luna-muted)';
  return <span style={{ padding: '0.2rem 0.625rem', borderRadius: 999, background: color, color: text, fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.04em', display: 'inline-block' }}>{status}</span>;
}

function StatTile({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className="stat-hover" style={{ background: '#FFFFFF', border: '1px solid rgba(26,22,20,0.08)', borderRadius: 'var(--radius)', padding: '1.25rem 1.5rem' }}>
      <p style={{ fontSize: '0.75rem', color: 'var(--luna-muted)', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', margin: '0 0 0.5rem' }}>{label}</p>
      <p style={{ fontSize: '1.75rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums', margin: 0, color: accent ? 'var(--luna-1)' : 'var(--luna-fg)' }}>{value}</p>
      {sub && <p style={{ fontSize: '0.75rem', color: 'var(--luna-muted)', margin: '0.25rem 0 0' }}>{sub}</p>}
    </div>
  );
}

/* ── Add/Edit Product Modal ───────────────────────────────────── */
function buildEmptyProduct(): Product {
  return {
    id: `custom-${Date.now()}`,
    slug: `custom-${Date.now()}`,
    name: '',
    brand: 'StarkBuy',
    category: 'Analog',
    gender: 'Men',
    caseSizeOptions: ['40mm', '42mm'],
    strapOptions: ['Leather'],
    codPrice: 0,
    discountPercent: 0,
    image: '',
    hoverImage: '',
    gallery: [],
    inStock: true,
    stock: {},
    newArrival: false,
    featured: false,
    flashSale: false,
    limited: false,
    rating: 0,
    reviewCount: 0,
    unitsSold: 0,
    description: '',
    movement: '',
    caseMaterial: '316L Stainless Steel',
    waterResistance: '30m (3 ATM)',
  };
}

function ProductModal({ initial, onClose, onSave }: {
  initial: Product | null;
  onClose: () => void;
  onSave: (p: Product) => Promise<void>;
}) {
  const [form, setForm] = useState<Product>(() => initial ?? buildEmptyProduct());
  const [gallery2, setGallery2] = useState(form.gallery[1] ?? '');
  const [gallery3, setGallery3] = useState(form.gallery[2] ?? '');
  const [videoUrl, setVideoUrl] = useState(form.video ?? '');
  const [err, setErr] = useState('');

  function set(field: keyof Product, val: unknown) {
    setForm(prev => ({ ...prev, [field]: val }));
  }

  async function handleSave() {
    if (!form.name.trim()) { setErr('Product name is required'); return; }
    if (!form.image.trim()) { setErr('Main image is required — upload a file or paste a URL'); return; }
    if (form.codPrice <= 0) { setErr('Price must be greater than 0'); return; }

    const slug = form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + form.id.slice(-6);
    const gallery = [form.image, gallery2, gallery3].filter(Boolean);
    try {
      await onSave({ ...form, slug, gallery, video: videoUrl || undefined });
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Save failed. Check your internet connection.');
    }
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(26,22,20,0.55)', zIndex: 500, backdropFilter: 'blur(4px)' }} />
      <div style={{ position: 'fixed', inset: 0, zIndex: 501, overflowY: 'auto', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '2rem 1rem' }}>
        <div style={{ width: '100%', maxWidth: 720, background: 'var(--luna-5)', border: '1px solid rgba(26,22,20,0.10)', borderRadius: '1rem', padding: '2rem', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, fontFamily: "'Cormorant Garamond', serif" }}>
              {initial ? 'Edit Watch' : 'Add New Watch'}
            </h3>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--luna-muted)', cursor: 'pointer', fontSize: '1.25rem', padding: '0.25rem' }}>✕</button>
          </div>

          {err && <p style={{ margin: '0 0 1rem', color: '#f87171', fontSize: '0.875rem', background: 'rgba(248,113,113,0.08)', padding: '0.625rem 0.875rem', borderRadius: '0.5rem', border: '1px solid rgba(248,113,113,0.2)' }}>{err}</p>}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <FieldInput label="Watch Name *" value={form.name} onChange={v => set('name', v)} placeholder="e.g. Nocturne Chronograph Pro" />
            </div>

            <FieldSelect<WatchCategory> label="Category *" value={form.category} onChange={v => set('category', v)} options={ALL_CATEGORIES} />
            <FieldSelect<WatchGender> label="Gender *" value={form.gender} onChange={v => set('gender', v)} options={ALL_GENDERS} />

            <FieldInput label="Price (Rs.) *" value={form.codPrice || ''} onChange={v => set('codPrice', Number(v))} type="number" placeholder="e.g. 19999" />
            <FieldInput label="Discount %" value={form.discountPercent || ''} onChange={v => set('discountPercent', Math.min(80, Math.max(0, Number(v))))} type="number" placeholder="0 – 80" />

            <div style={{ gridColumn: '1 / -1' }}>
              <ImageUploadField label="Main Image *" value={form.image} onChange={v => set('image', v)} />
            </div>
            <ImageUploadField label="Gallery Image 2" value={gallery2} onChange={setGallery2} compact />
            <ImageUploadField label="Gallery Image 3" value={gallery3} onChange={setGallery3} compact />

            <div style={{ gridColumn: '1 / -1' }}>
              <VideoUploadField label="Product Video (optional — shows as 4th media item)" value={videoUrl} onChange={setVideoUrl} />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <CheckGroup<Strap> label="Strap Options" options={ALL_STRAPS} selected={form.strapOptions} onChange={v => set('strapOptions', v)} />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <FieldTextarea label="Description" value={form.description} onChange={v => set('description', v)} rows={3} />
            </div>

            <FieldInput label="Movement" value={form.movement} onChange={v => set('movement', v)} placeholder="e.g. Japanese Miyota Quartz" />
            <FieldInput label="Case Material" value={form.caseMaterial} onChange={v => set('caseMaterial', v)} placeholder="e.g. 316L Stainless Steel" />
            <FieldInput label="Water Resistance" value={form.waterResistance} onChange={v => set('waterResistance', v)} placeholder="e.g. 50m (5 ATM)" />

            {/* Flags */}
            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '2rem', flexWrap: 'wrap', padding: '0.875rem 1rem', background: 'rgba(0,0,0,0.03)', borderRadius: '0.625rem', border: '1px solid rgba(26,22,20,0.08)' }}>
              {([['newArrival', 'New Arrival'], ['featured', 'Featured'], ['flashSale', 'Flash Sale'], ['limited', 'Limited Edition'], ['inStock', 'In Stock']] as const).map(([field, label]) => (
                <label key={field} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem', color: 'var(--luna-muted)' }}>
                  <Toggle checked={!!form[field]} onChange={v => set(field, v)} />
                  {label}
                </label>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
            <button onClick={onClose} style={{ padding: '0.625rem 1.25rem', background: 'transparent', border: '1px solid rgba(26,22,20,0.12)', borderRadius: '0.625rem', color: 'var(--luna-muted)', fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>Cancel</button>
            <button onClick={handleSave} style={{ padding: '0.625rem 1.5rem', background: 'var(--luna-1)', border: 'none', borderRadius: '0.625rem', color: 'var(--luna-5)', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
              {initial ? 'Save Changes' : 'Add Watch'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Section: Analytics ───────────────────────────────────────── */
function Analytics() {
  const [orders, setOrders] = useState<StoredOrder[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { dbGetOrders().then(data => { setOrders(data); setLoading(false); }); }, []);
  if (loading) return <AdminSkeleton />;
  const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
  const deliveredOrders = orders.filter(o => o.status === 'Delivered');
  const avgOrder = orders.length ? Math.round(totalRevenue / orders.length) : 0;
  const todayStr = new Date().toLocaleDateString('en-PK', { dateStyle: 'medium' });
  const todayOrders = orders.filter(o => o.date.startsWith(todayStr)).length;

  // Build last-7-days revenue from real orders
  const days7: { label: string; revenue: number }[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const label = d.toLocaleDateString('en-PK', { weekday: 'short' });
    const dateStr = d.toLocaleDateString('en-PK', { dateStyle: 'medium' });
    const revenue = orders.filter(o => o.date.startsWith(dateStr)).reduce((s, o) => s + o.total, 0);
    return { label, revenue };
  });
  const maxRev = Math.max(...days7.map(d => d.revenue), 1);

  const emptyState = (msg: string) => (
    <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--luna-muted)', fontSize: '0.875rem' }}>{msg}</div>
  );

  return (
    <div>
      <SectionHeader title="Analytics" eyebrow="Real-time store data" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <StatTile label="Total revenue" value={orders.length ? formatPrice(totalRevenue) : '—'} sub="All time" accent />
        <StatTile label="Total orders" value={String(orders.length)} sub={todayOrders ? `+${todayOrders} today` : 'No orders yet'} />
        <StatTile label="Avg order value" value={orders.length ? formatPrice(avgOrder) : '—'} />
        <StatTile label="Delivered" value={orders.length ? `${Math.round((deliveredOrders.length / orders.length) * 100)}%` : '—'} sub={`${deliveredOrders.length} of ${orders.length}`} />
      </div>
      <div style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(26,22,20,0.08)', borderRadius: 'var(--radius)', padding: '1.5rem', marginBottom: '2rem' }}>
        <p style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '1.5rem', color: 'var(--luna-muted)' }}>Revenue — last 7 days</p>
        {orders.length === 0 ? emptyState('Orders will appear here once customers start placing them.') : (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', height: 160 }}>
            {days7.map((d, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.375rem', height: '100%', justifyContent: 'flex-end' }}>
                {d.revenue > 0 && <span style={{ fontSize: '0.625rem', color: 'var(--luna-muted)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{Math.round(d.revenue / 1000)}k</span>}
                <div style={{ width: '100%', height: `${(d.revenue / maxRev) * 100}%`, background: i === 6 ? 'var(--luna-1)' : 'rgba(201,168,76,0.25)', borderRadius: '0.25rem 0.25rem 0 0', minHeight: 4 }} />
                <span style={{ fontSize: '0.625rem', color: 'var(--luna-muted)' }}>{d.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <div style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(26,22,20,0.08)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid rgba(26,22,20,0.08)' }}>
          <p style={{ fontWeight: 600, margin: 0, fontSize: '0.9375rem' }}>Recent orders snapshot</p>
        </div>
        {orders.length === 0 ? emptyState('No orders yet. Place a test order to see data here.') : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><th style={th}>Order</th><th style={th}>Customer</th><th style={{ ...th, textAlign: 'right' }}>Total</th><th style={th}>Status</th></tr></thead>
            <tbody>
              {orders.slice(0, 5).map(o => (
                <tr key={o.id}>
                  <td style={{ ...td, fontWeight: 600, color: 'var(--luna-1)', fontVariantNumeric: 'tabular-nums' }}>{o.id}</td>
                  <td style={td}>{o.name}</td>
                  <td style={{ ...td, textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>{formatPrice(o.total)}</td>
                  <td style={td}><StatusBadge status={o.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

/* ── Section: Products ────────────────────────────────────────── */
function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [naIds, setNaIds] = useState<string[]>(() => getNewArrivalOverrides() ?? []);
  const [catFilter, setCatFilter] = useState<string>('All');

  async function loadProducts() {
    setLoading(true);
    const list = await dbGetProducts();
    setProducts(list);
    setLoading(false);
  }

  useEffect(() => { loadProducts(); }, []);

  const filtered = useMemo(() => {
    let list = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
    if (catFilter !== 'All') list = list.filter(p => p.category === catFilter);
    return list;
  }, [products, search, catFilter]);

  async function handleSave(p: Product) {
    await dbSaveProduct(p);
    await loadProducts();
    setShowModal(false);
    setEditProduct(null);
    dispatch(EV_PRODUCTS);
    toast('Product saved!');
  }

  async function handleDelete(id: string, name: string) {
    if (!await adminConfirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await dbDeleteProduct(id);
      await loadProducts();
      dispatch(EV_PRODUCTS);
      toast('Product deleted.', { type: 'error' });
    } catch {
      toast('Failed to delete product.', { type: 'error' });
    }
  }

  function toggleNA(id: string) {
    const next = naIds.includes(id) ? naIds.filter(x => x !== id) : [...naIds, id];
    setNaIds(next);
    setNewArrivalOverrides(next);
    dispatch(EV_PRODUCTS);
  }

  const uniqueCats = ['All', ...Array.from(new Set(products.map(p => p.category)))];

  return (
    <div>
      {(showModal || editProduct) && (
        <ProductModal
          initial={editProduct}
          onClose={() => { setShowModal(false); setEditProduct(null); }}
          onSave={handleSave}
        />
      )}

      <SectionHeader
        title="Products"
        eyebrow={`${products.length} watches`}
        action={{ label: '+ Add Watch', onClick: () => { setEditProduct(null); setShowModal(true); } }}
      />

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name..."
          style={{ background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(26,22,20,0.12)', borderRadius: 'var(--radius)', padding: '0.575rem 1rem', color: 'var(--luna-fg)', fontFamily: 'DM Sans, sans-serif', fontSize: '0.875rem', outline: 'none', width: '100%', maxWidth: 280 }}
        />
        <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
          {uniqueCats.map(c => (
            <button key={c} onClick={() => setCatFilter(c)} style={{ padding: '0.3rem 0.75rem', borderRadius: 999, fontSize: '0.75rem', fontFamily: 'DM Sans, sans-serif', border: catFilter === c ? '1px solid var(--luna-1)' : '1px solid rgba(26,22,20,0.09)', background: catFilter === c ? 'rgba(26,22,20,0.09)' : 'transparent', color: catFilter === c ? 'var(--luna-1)' : 'var(--luna-muted)', cursor: 'pointer' }}>
              {c}
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(26,22,20,0.08)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
        {loading ? (
          <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--luna-muted)', fontFamily: 'DM Sans, sans-serif' }}>Loading products…</p>
        ) : products.length === 0 ? (
          <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--luna-muted)', fontFamily: 'DM Sans, sans-serif' }}>No products yet. Click "+ Add Watch" to get started.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
              <thead>
                <tr>
                  <th style={th}>Product</th>
                  <th style={th}>Category</th>
                  <th style={th}>Gender</th>
                  <th style={{ ...th, textAlign: 'right' }}>Price</th>
                  <th style={{ ...th, textAlign: 'center' }}>Discount</th>
                  <th style={{ ...th, textAlign: 'center' }}>Stock</th>
                  <th style={{ ...th, textAlign: 'center' }}>New Arrival</th>
                  <th style={th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const isNA = naIds.includes(p.id);
                  return (
                    <tr key={p.id} className="row-hover">
                      <td style={td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          {p.image && <img src={p.image.includes('?') ? p.image + '&w=64' : p.image} alt={p.name} style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: '0.375rem', flexShrink: 0 }} loading="lazy" />}
                          <div>
                            <p style={{ fontWeight: 500, margin: 0, fontSize: '0.875rem' }}>{p.name}</p>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--luna-muted)' }}>{p.caseSizeOptions.join(', ')}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ ...td, color: 'var(--luna-muted)' }}>{p.category}</td>
                      <td style={{ ...td, color: 'var(--luna-muted)' }}>{p.gender}</td>
                      <td style={{ ...td, textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>{formatPrice(p.codPrice)}</td>
                      <td style={{ ...td, textAlign: 'center' }}>
                        <span style={{ color: p.discountPercent > 0 ? '#C44830' : 'var(--luna-muted)' }}>
                          {p.discountPercent > 0 ? `${p.discountPercent}%` : '—'}
                        </span>
                      </td>
                      <td style={{ ...td, textAlign: 'center' }}>
                        <span style={{ color: p.inStock ? '#3A7A38' : '#C44830', fontSize: '0.8125rem' }}>{p.inStock ? 'In stock' : 'Sold out'}</span>
                      </td>
                      <td style={{ ...td, textAlign: 'center' }}>
                        <Toggle checked={isNA} onChange={() => toggleNA(p.id)} />
                      </td>
                      <td style={td}>
                        <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                          <button onClick={() => setEditProduct(p)} style={{ padding: '0.3rem 0.625rem', background: 'transparent', border: '1px solid rgba(26,22,20,0.12)', borderRadius: '0.375rem', color: 'var(--luna-1)', fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>Edit</button>
                          <Link to={`/product/${p.slug}`} target="_blank" style={{ padding: '0.3rem 0.625rem', background: 'transparent', border: '1px solid rgba(26,22,20,0.09)', borderRadius: '0.375rem', color: 'var(--luna-muted)', fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', textDecoration: 'none', display: 'inline-block' }}>View</Link>
                          <button onClick={() => handleDelete(p.id, p.name)} style={{ padding: '0.3rem 0.625rem', background: 'transparent', border: '1px solid rgba(248,113,113,0.2)', borderRadius: '0.375rem', color: 'rgba(248,113,113,0.8)', fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Section: Orders ──────────────────────────────────────────── */
function Orders() {
  const [orders, setOrders] = useState<StoredOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [detail, setDetail] = useState<StoredOrder | null>(null);
  const statuses = ['All', 'Processing', 'Dispatched', 'Delivered', 'Cancelled'];
  const { user } = useAuth();

  useEffect(() => { dbGetOrders().then(data => { setOrders(data); setLoading(false); }); }, []);

  async function refresh() { const data = await dbGetOrders(); setOrders(data); }

  async function changeStatus(id: string, status: StoredOrder['status']) {
    await dbUpdateOrderStatus(id, status);
    await dbAddAuditEntry({ action: 'UPDATE', entity: 'order', detail: `${id} → ${status}`, actor: user?.email || 'admin' });
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
  }

  async function deleteOrder(id: string) {
    if (!await adminConfirm(`Delete order ${id}? This cannot be undone.`)) return;
    try {
      await dbDeleteOrder(id);
      await dbAddAuditEntry({ action: 'DELETE', entity: 'order', detail: `Deleted order ${id}`, actor: user?.email || 'admin' });
      setOrders(prev => prev.filter(o => o.id !== id));
      setDetail(null);
      toast(`Order ${id} deleted.`, { type: 'error' });
    } catch {
      toast('Failed to delete order. Check Supabase connection.', { type: 'error' });
    }
  }

  if (loading) return <AdminSkeleton />;

  const filtered = orders.filter(o => {
    if (filter !== 'All' && o.status !== filter) return false;
    if (search && !o.id.toLowerCase().includes(search.toLowerCase()) && !o.name.toLowerCase().includes(search.toLowerCase()) && !o.phone.includes(search)) return false;
    return true;
  });

  return (
    <div>
      <SectionHeader title="Orders" eyebrow={`${orders.length} total`} action={{ label: 'Export CSV', onClick: () => exportCSV(orders.map(o => ({ ID: o.id, Name: o.name, Phone: o.phone, City: o.city, Total: o.total, Status: o.status, Date: o.date })), 'orders.csv') }} />

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by order ID, name, phone…" style={{ flex: 1, minWidth: 200, background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(26,22,20,0.10)', borderRadius: '0.5rem', padding: '0.5rem 0.875rem', color: 'var(--luna-fg)', fontFamily: 'DM Sans, sans-serif', fontSize: '0.875rem', outline: 'none' }} />
        <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
          {statuses.map(s => (
            <button key={s} onClick={() => setFilter(s)} style={{ padding: '0.375rem 0.75rem', borderRadius: 999, fontSize: '0.8125rem', fontFamily: 'DM Sans, sans-serif', border: filter === s ? '1px solid var(--luna-1)' : '1px solid rgba(26,22,20,0.09)', background: filter === s ? 'rgba(26,22,20,0.09)' : 'transparent', color: filter === s ? 'var(--luna-1)' : 'var(--luna-muted)', cursor: 'pointer', transition: 'all 150ms' }}>{s}</button>
          ))}
        </div>
      </div>

      {orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--luna-muted)', background: 'rgba(0,0,0,0.03)', borderRadius: 'var(--radius)', border: '1px solid rgba(26,22,20,0.08)' }}>
          <p style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--luna-fg)' }}>No orders yet</p>
          <p style={{ fontSize: '0.875rem', margin: 0 }}>Orders placed on the store will appear here automatically.</p>
        </div>
      ) : (
        <div style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(26,22,20,0.08)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
              <thead>
                <tr><th style={th}>Order</th><th style={th}>Customer</th><th style={th}>City</th><th style={{ ...th, textAlign: 'right' }}>Total</th><th style={{ ...th, textAlign: 'center' }}>Status</th><th style={th}>Date</th><th style={th}>Action</th></tr>
              </thead>
              <tbody>
                {filtered.map(o => (
                  <tr key={o.id} className="row-hover" style={{ cursor: 'pointer' }} onClick={() => setDetail(o)}>
                    <td style={{ ...td, fontVariantNumeric: 'tabular-nums', fontWeight: 600, color: 'var(--luna-1)' }}>{o.id}</td>
                    <td style={td}><div><p style={{ margin: 0, fontWeight: 500 }}>{o.name}</p><p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--luna-muted)' }}>{o.phone}</p></div></td>
                    <td style={{ ...td, color: 'var(--luna-muted)' }}>{o.city}</td>
                    <td style={{ ...td, textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>{formatPrice(o.total)}</td>
                    <td style={{ ...td, textAlign: 'center' }}><StatusBadge status={o.status} /></td>
                    <td style={{ ...td, color: 'var(--luna-muted)', fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>{o.date}</td>
                    <td style={td} onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
                        <select value={o.status} onChange={e => changeStatus(o.id, e.target.value as StoredOrder['status'])} style={{ background: 'rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.09)', borderRadius: '0.375rem', color: 'var(--luna-fg)', fontSize: '0.75rem', fontFamily: 'DM Sans, sans-serif', padding: '0.25rem 0.375rem', cursor: 'pointer' }}>
                          {(['Processing', 'Dispatched', 'Delivered', 'Cancelled'] as const).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <button onClick={() => deleteOrder(o.id)} title="Delete order" style={{ background: 'none', border: 'none', color: 'rgba(196,72,48,0.55)', cursor: 'pointer', fontSize: '0.875rem', padding: '0.125rem 0.25rem', lineHeight: 1 }}>🗑</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {detail && (
        <>
          <div onClick={() => setDetail(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(26,22,20,0.5)', zIndex: 500, backdropFilter: 'blur(4px)' }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 501, width: 'min(520px, 95vw)', maxHeight: '90vh', overflowY: 'auto', background: 'var(--luna-5)', border: '1px solid rgba(26,22,20,0.10)', borderRadius: '1rem', padding: '1.75rem', boxShadow: '0 24px 64px rgba(26,22,20,0.18)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div><h3 style={{ margin: 0, fontFamily: "'Cormorant Garamond', serif", fontSize: '1.25rem', fontWeight: 700 }}>{detail.id}</h3><p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--luna-muted)' }}>{detail.date}</p></div>
              <button onClick={() => setDetail(null)} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: 'var(--luna-muted)' }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
              {[['Customer', detail.name], ['Phone', detail.phone], ['Email', detail.email || '—'], ['Address', detail.address]].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', fontSize: '0.875rem' }}>
                  <span style={{ color: 'var(--luna-muted)', flexShrink: 0 }}>{k}</span>
                  <span style={{ fontWeight: 500, textAlign: 'right' }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ borderTop: '1px solid rgba(26,22,20,0.08)', paddingTop: '1rem', marginBottom: '1rem' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--luna-muted)', marginBottom: '0.75rem' }}>Items</p>
              {detail.items.map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', padding: '0.375rem 0', borderBottom: '1px solid rgba(26,22,20,0.05)' }}>
                  <span>{item.name} × {item.qty}</span>
                  <span style={{ fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{formatPrice(item.price)}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--luna-muted)' }}>Shipping</span><span>{detail.shipping === 0 ? 'Free' : formatPrice(detail.shipping)}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1rem', borderTop: '1px solid rgba(26,22,20,0.08)', paddingTop: '0.5rem', marginTop: '0.25rem' }}><span>Total</span><span style={{ color: 'var(--luna-1)', fontVariantNumeric: 'tabular-nums' }}>{formatPrice(detail.total)}</span></div>
            </div>
            <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {(['Processing', 'Dispatched', 'Delivered', 'Cancelled'] as const).map(s => (
                <button key={s} onClick={() => { changeStatus(detail.id, s); setDetail(prev => prev ? { ...prev, status: s } : null); }} style={{ padding: '0.375rem 0.75rem', borderRadius: 999, fontSize: '0.8125rem', fontFamily: 'DM Sans, sans-serif', border: detail.status === s ? '1px solid var(--luna-1)' : '1px solid rgba(26,22,20,0.09)', background: detail.status === s ? 'rgba(26,22,20,0.09)' : 'transparent', color: detail.status === s ? 'var(--luna-1)' : 'var(--luna-muted)', cursor: 'pointer' }}>{s}</button>
              ))}
            </div>
            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(26,22,20,0.08)' }}>
              <button onClick={() => deleteOrder(detail.id)} style={{ padding: '0.4375rem 1rem', background: 'rgba(196,72,48,0.08)', border: '1px solid rgba(196,72,48,0.2)', borderRadius: '0.5rem', color: '#C44830', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                🗑 Delete Order
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ── Section: Coupons ─────────────────────────────────────────── */
function Coupons() {
  const [coupons, setCoupons] = useState<StoredCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newCode, setNewCode] = useState({ code: '', type: 'Percentage' as 'Percentage' | 'Fixed', value: 10, limit: 100, expires: '' });
  const { user } = useAuth();

  useEffect(() => { dbGetCoupons().then(data => { setCoupons(data); setLoading(false); }); }, []);

  async function toggleActive(code: string) {
    const c = coupons.find(x => x.code === code);
    if (!c) return;
    await dbUpdateCoupon(code, { active: !c.active });
    setCoupons(prev => prev.map(x => x.code === code ? { ...x, active: !x.active } : x));
  }

  async function deleteCoupon(code: string) {
    if (!await adminConfirm(`Delete coupon ${code}? This cannot be undone.`)) return;
    try {
      await dbDeleteCoupon(code);
      await dbAddAuditEntry({ action: 'DELETE', entity: 'coupon', detail: `Deleted coupon ${code}`, actor: user?.email || 'admin' });
      setCoupons(prev => prev.filter(c => c.code !== code));
      toast(`Coupon ${code} deleted.`, { type: 'error' });
    } catch {
      toast('Failed to delete coupon. Check connection.', { type: 'error' });
    }
  }

  async function addCoupon() {
    if (!newCode.code.trim()) return;
    const coupon: StoredCoupon = { ...newCode, used: 0, active: true };
    await dbSaveCoupon(coupon);
    await dbAddAuditEntry({ action: 'CREATE', entity: 'coupon', detail: `Created ${coupon.code} (${coupon.type === 'Percentage' ? coupon.value + '%' : 'Rs. ' + coupon.value})`, actor: user?.email || 'admin' });
    setCoupons(prev => [coupon, ...prev]);
    setNewCode({ code: '', type: 'Percentage', value: 10, limit: 100, expires: '' });
    setShowAdd(false);
  }

  if (loading) return <AdminSkeleton />;

  return (
    <div>
      <SectionHeader title="Discounts & Coupons" eyebrow={`${coupons.length} codes`} action={{ label: '+ New Coupon', onClick: () => setShowAdd(v => !v) }} />
      {coupons.length === 0 && !showAdd && (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--luna-muted)', background: 'rgba(0,0,0,0.03)', borderRadius: 'var(--radius)', border: '1px solid rgba(26,22,20,0.08)', marginBottom: '1rem' }}>
          <p style={{ fontSize: '0.9rem', margin: 0 }}>No coupons yet. Click "+ New Coupon" to create your first discount code.</p>
        </div>
      )}

      {showAdd && (
        <div style={{ background: '#FFFFFF', border: '1px solid rgba(26,22,20,0.10)', borderRadius: 'var(--radius)', padding: '1.25rem', marginBottom: '1.25rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem' }}>
          <FieldInput label="Coupon Code" value={newCode.code} onChange={v => setNewCode(p => ({ ...p, code: v.toUpperCase() }))} placeholder="e.g. SAVE15" />
          <FieldSelect<'Percentage' | 'Fixed'> label="Type" value={newCode.type} onChange={v => setNewCode(p => ({ ...p, type: v }))} options={['Percentage', 'Fixed']} />
          <FieldInput label={newCode.type === 'Percentage' ? 'Discount %' : 'Discount Rs.'} value={newCode.value} onChange={v => setNewCode(p => ({ ...p, value: Number(v) }))} type="number" />
          <FieldInput label="Usage Limit" value={newCode.limit} onChange={v => setNewCode(p => ({ ...p, limit: Number(v) }))} type="number" />
          <FieldInput label="Expires" value={newCode.expires} onChange={v => setNewCode(p => ({ ...p, expires: v }))} placeholder="Dec 31, 2026" />
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button onClick={addCoupon} style={{ padding: '0.5625rem 1rem', background: 'var(--luna-1)', border: 'none', borderRadius: '0.5rem', color: 'var(--luna-5)', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', width: '100%' }}>Save Coupon</button>
          </div>
        </div>
      )}

      <div style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(26,22,20,0.08)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
            <thead>
              <tr>
                <th style={th}>Code</th><th style={th}>Type</th><th style={{ ...th, textAlign: 'right' }}>Value</th>
                <th style={{ ...th, textAlign: 'center' }}>Used / Limit</th><th style={th}>Expires</th>
                <th style={{ ...th, textAlign: 'center' }}>Active</th><th style={th}></th>
              </tr>
            </thead>
            <tbody>
              {coupons.map(c => (
                <tr key={c.code} className="row-hover">
                  <td style={{ ...td, fontFamily: 'monospace', fontWeight: 700, color: 'var(--luna-1)', letterSpacing: '0.05em', fontSize: '0.875rem' }}>{c.code}</td>
                  <td style={{ ...td, color: 'var(--luna-muted)' }}>{c.type}</td>
                  <td style={{ ...td, textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                    {c.type === 'Percentage' ? `${c.value}%` : formatPrice(c.value)}
                  </td>
                  <td style={{ ...td, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                      <span>{c.used} / {c.limit}</span>
                      <div style={{ width: 80, height: 4, background: 'rgba(26,22,20,0.09)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ width: `${(c.used / c.limit) * 100}%`, height: '100%', background: c.used / c.limit > 0.8 ? '#C44830' : 'var(--luna-2)', borderRadius: 2 }} />
                      </div>
                    </div>
                  </td>
                  <td style={{ ...td, color: 'var(--luna-muted)', fontSize: '0.8125rem' }}>{c.expires}</td>
                  <td style={{ ...td, textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <Toggle checked={c.active} onChange={() => toggleActive(c.code)} />
                    </div>
                  </td>
                  <td style={td}>
                    <button onClick={() => deleteCoupon(c.code)} style={{ background: 'none', border: 'none', color: 'rgba(196,72,48,0.6)', cursor: 'pointer', fontSize: '0.75rem', fontFamily: 'DM Sans, sans-serif' }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ── Section: Customers ───────────────────────────────────────── */
function Customers() {
  const [orders, setOrders] = useState<StoredOrder[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { dbGetOrders().then(data => { setOrders(data); setLoading(false); }); }, []);
  if (loading) return <AdminSkeleton />;
  // Derive unique customers from orders (group by phone)
  const customerMap = new Map<string, { name: string; email: string; city: string; orders: number; total: number; date: string }>();
  orders.forEach(o => {
    const existing = customerMap.get(o.phone);
    if (existing) {
      existing.orders++;
      existing.total += o.total;
    } else {
      customerMap.set(o.phone, { name: o.name, email: o.email, city: o.city, orders: 1, total: o.total, date: o.date });
    }
  });
  const customers = Array.from(customerMap.entries()).map(([phone, c]) => ({ phone, ...c }));

  return (
    <div>
      <SectionHeader title="Customers" eyebrow={`${customers.length} unique`} action={{ label: 'Export CSV', onClick: () => exportCSV(customers.map(c => ({ Name: c.name, Phone: c.phone, Email: c.email, City: c.city, Orders: c.orders, Total: c.total })), 'customers.csv') }} />
      {customers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--luna-muted)', background: 'rgba(0,0,0,0.03)', borderRadius: 'var(--radius)', border: '1px solid rgba(26,22,20,0.08)' }}>
          <p style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--luna-fg)' }}>No customers yet</p>
          <p style={{ fontSize: '0.875rem', margin: 0 }}>Customer data is derived from orders. It will populate automatically.</p>
        </div>
      ) : (
        <div style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(26,22,20,0.08)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
              <thead>
                <tr><th style={th}>Name</th><th style={th}>Phone</th><th style={th}>City</th><th style={{ ...th, textAlign: 'center' }}>Orders</th><th style={{ ...th, textAlign: 'right' }}>Lifetime value</th></tr>
              </thead>
              <tbody>
                {customers.map(c => (
                  <tr key={c.phone} className="row-hover">
                    <td style={{ ...td, fontWeight: 500 }}>{c.name}</td>
                    <td style={{ ...td, color: 'var(--luna-muted)', fontSize: '0.8125rem' }}>{c.phone}</td>
                    <td style={{ ...td, color: 'var(--luna-muted)' }}>{c.city}</td>
                    <td style={{ ...td, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{c.orders}</td>
                    <td style={{ ...td, textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 500, color: 'var(--luna-1)' }}>{formatPrice(c.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Section: Loyalty ─────────────────────────────────────────── */
function Loyalty() {
  const [orders, setOrders] = useState<StoredOrder[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { dbGetOrders().then(data => { setOrders(data); setLoading(false); }); }, []);
  if (loading) return <AdminSkeleton />;
  const empty = orders.length === 0;
  return (
    <div>
      <SectionHeader title="Loyalty" eyebrow="Rewards programme" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <StatTile label="Total orders" value={String(orders.length)} />
        <StatTile label="Total revenue" value={orders.length ? formatPrice(orders.reduce((s: number, o: StoredOrder) => s + o.total, 0)) : '—'} accent />
        <StatTile label="Unique customers" value={empty ? '—' : String(new Set(orders.map((o: StoredOrder) => o.phone)).size)} />
        <StatTile label="Points programme" value="Coming soon" />
      </div>
      <div style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(26,22,20,0.08)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={th}>Customer</th><th style={{ ...th, textAlign: 'center' }}>Tier</th>
              <th style={{ ...th, textAlign: 'right' }}>Balance</th><th style={{ ...th, textAlign: 'right' }}>Redeemed</th>
            </tr>
          </thead>
          <tbody>
            <tr><td colSpan={4} style={{ ...td, textAlign: 'center', color: 'var(--luna-muted)', padding: '2.5rem' }}>Points programme will be tracked here once orders come in.</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Section: Content ─────────────────────────────────────────── */
const EMPTY_SLIDE: Omit<HeroSlide, 'id'> = {
  eyebrow: 'New Collection', title: 'Your Headline\nGoes Here',
  sub: 'Short supporting text for this slide.',
  ctaLabel: 'Explore Collection', ctaTo: '/collections',
  cta2Label: 'Track Order', cta2To: '/track-order',
  image: '', enabled: true,
};

function SlideField({ label, value, onChange, multiline }: { label: string; value: string; onChange: (v: string) => void; multiline?: boolean }) {
  const base: React.CSSProperties = { width: '100%', background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(26,22,20,0.10)', borderRadius: '0.5rem', padding: '0.5625rem 0.75rem', color: 'var(--luna-fg)', fontFamily: 'DM Sans, sans-serif', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box', resize: 'vertical' };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
      <label style={{ fontSize: '0.75rem', color: 'var(--luna-muted)', fontWeight: 500 }}>{label}</label>
      {multiline ? <textarea rows={2} value={value} onChange={e => onChange(e.target.value)} style={base} /> : <input value={value} onChange={e => onChange(e.target.value)} style={base} />}
    </div>
  );
}

function HeroSlidesPanel() {
  const [slides, setSlides] = useState<HeroSlide[]>(() => getSlides());
  const [editId, setEditId] = useState<string | null>(null);

  function persist(next: HeroSlide[]) { setSlides(next); saveSlides(next); dispatch(EV_SLIDES); }
  function toggle(id: string) { persist(slides.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s)); }
  async function remove(id: string) {
    if (!await adminConfirm('Delete this slide? This cannot be undone.')) return;
    persist(slides.filter(s => s.id !== id));
    if (editId === id) setEditId(null);
  }
  function addSlide() {
    const newSlide: HeroSlide = { ...EMPTY_SLIDE, id: `slide-${Date.now()}` };
    const next = [...slides, newSlide];
    persist(next);
    setEditId(newSlide.id);
  }
  function updateField(id: string, field: keyof HeroSlide, value: string | boolean) {
    persist(slides.map(s => s.id === id ? { ...s, [field]: value } : s));
  }
  function moveUp(idx: number) {
    if (idx === 0) return;
    const next = [...slides]; [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]; persist(next);
  }
  function moveDown(idx: number) {
    if (idx === slides.length - 1) return;
    const next = [...slides]; [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]]; persist(next);
  }
  const editing = editId ? slides.find(s => s.id === editId) : null;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <button onClick={addSlide} style={{ padding: '0.5rem 1rem', background: 'var(--luna-1)', border: 'none', borderRadius: 'var(--radius)', color: 'var(--luna-5)', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>+ Add Slide</button>
      </div>
      <p style={{ color: 'var(--luna-muted)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>Changes save instantly and reflect live on the storefront.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginBottom: '1.5rem' }}>
        {slides.map((slide, i) => (
          <div key={slide.id}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', background: editId === slide.id ? 'rgba(26,22,20,0.06)' : 'rgba(0,0,0,0.03)', border: editId === slide.id ? '1px solid rgba(201,168,76,0.35)' : '1px solid rgba(26,22,20,0.08)', borderRadius: 'var(--radius)', padding: '0.875rem 1.25rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flexShrink: 0 }}>
                <button onClick={() => moveUp(i)} disabled={i === 0} style={{ background: 'none', border: 'none', color: i === 0 ? 'rgba(26,22,20,0.15)' : 'var(--luna-muted)', cursor: i === 0 ? 'default' : 'pointer', padding: '1px', fontFamily: 'DM Sans, sans-serif', fontSize: '0.625rem', lineHeight: 1 }}>▲</button>
                <button onClick={() => moveDown(i)} disabled={i === slides.length - 1} style={{ background: 'none', border: 'none', color: i === slides.length - 1 ? 'rgba(26,22,20,0.15)' : 'var(--luna-muted)', cursor: i === slides.length - 1 ? 'default' : 'pointer', padding: '1px', fontFamily: 'DM Sans, sans-serif', fontSize: '0.625rem', lineHeight: 1 }}>▼</button>
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--luna-muted)', minWidth: 18, textAlign: 'center' }}>{i + 1}</span>
              {slide.image && <img src={slide.image + (slide.image.includes('?') ? '&w=80' : '?w=80')} alt="" style={{ width: 48, height: 36, objectFit: 'cover', borderRadius: '0.375rem', flexShrink: 0 }} onError={e => { e.currentTarget.style.display = 'none'; }} />}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: '0.6875rem', color: 'var(--luna-2)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{slide.eyebrow}</p>
                <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9375rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{slide.title.replace('\n', ' ')}</p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexShrink: 0 }}>
                <button onClick={() => setEditId(editId === slide.id ? null : slide.id)} style={{ padding: '0.3rem 0.75rem', background: 'transparent', border: '1px solid rgba(26,22,20,0.12)', borderRadius: '0.375rem', color: 'var(--luna-1)', fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                  {editId === slide.id ? 'Close' : 'Edit'}
                </button>
                <Toggle checked={slide.enabled} onChange={() => toggle(slide.id)} />
                <button onClick={() => remove(slide.id)} style={{ background: 'none', border: 'none', color: 'rgba(248,113,113,0.7)', cursor: 'pointer', fontSize: '0.875rem', padding: '0.25rem', fontFamily: 'DM Sans, sans-serif' }}>✕</button>
              </div>
            </div>
            {editId === slide.id && editing && (
              <div style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(26,22,20,0.10)', borderTop: 'none', borderRadius: '0 0 var(--radius) var(--radius)', padding: '1.25rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
                <SlideField label="Eyebrow label" value={editing.eyebrow} onChange={v => updateField(slide.id, 'eyebrow', v)} />
                <div><ImageUploadField label="Slide Image" value={editing.image} onChange={v => updateField(slide.id, 'image', v)} compact /></div>
                <SlideField label="Headline (use \\n for line break)" value={editing.title} onChange={v => updateField(slide.id, 'title', v)} multiline />
                <SlideField label="Sub-text" value={editing.sub} onChange={v => updateField(slide.id, 'sub', v)} multiline />
                <SlideField label="Button 1 label" value={editing.ctaLabel} onChange={v => updateField(slide.id, 'ctaLabel', v)} />
                <SlideField label="Button 1 link (e.g. /collections)" value={editing.ctaTo} onChange={v => updateField(slide.id, 'ctaTo', v)} />
                <SlideField label="Button 2 label" value={editing.cta2Label} onChange={v => updateField(slide.id, 'cta2Label', v)} />
                <SlideField label="Button 2 link" value={editing.cta2To} onChange={v => updateField(slide.id, 'cta2To', v)} />
              </div>
            )}
          </div>
        ))}
      </div>
      <button onClick={() => { resetSlides(); setSlides(getSlides()); setEditId(null); dispatch(EV_SLIDES); }} style={{ padding: '0.5rem 1rem', background: 'transparent', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 'var(--radius)', color: 'rgba(248,113,113,0.8)', fontSize: '0.8125rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
        Reset to defaults
      </button>
    </div>
  );
}

function NewArrivalsPanel() {
  const [naIds, setNaIds] = useState<string[]>(() => getNewArrivalOverrides() ?? []);
  const [allProds, setAllProds] = useState<Product[]>([]);

  useEffect(() => { dbGetProducts().then(setAllProds); }, []);

  function toggle(id: string) {
    const next = naIds.includes(id) ? naIds.filter(x => x !== id) : [...naIds, id];
    setNaIds(next);
    setNewArrivalOverrides(next);
    dispatch(EV_PRODUCTS);
  }

  return (
    <div>
      <p style={{ color: 'var(--luna-muted)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
        Toggle which watches appear in the "New Arrivals" section on the home page. Changes apply instantly.
      </p>
      {allProds.length === 0 ? (
        <p style={{ color: 'var(--luna-muted)', fontSize: '0.875rem' }}>No products found. Add products first.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.75rem' }}>
          {allProds.map(p => {
            const isNA = naIds.includes(p.id);
            return (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', background: isNA ? 'rgba(26,22,20,0.06)' : 'rgba(0,0,0,0.03)', border: isNA ? '1px solid rgba(26,22,20,0.15)' : '1px solid rgba(26,22,20,0.08)', borderRadius: 'var(--radius)', padding: '0.75rem 1rem', transition: 'all 150ms' }}>
                <img src={p.image.includes('?') ? p.image + '&w=64' : p.image} alt={p.name} style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: '0.375rem', flexShrink: 0 }} loading="lazy" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontWeight: 500, fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</p>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--luna-muted)' }}>{p.category} · {p.gender}</p>
                </div>
                <Toggle checked={isNA} onChange={() => toggle(p.id)} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CategoriesPanel() {
  const [cats, setCats] = useState<CategoryConfig[]>(DEFAULT_CATEGORIES);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  useEffect(() => {
    dbGetConfig<CategoryConfig[]>('categories').then(fromDb => {
      if (fromDb) setCats(fromDb);
    });
  }, []);

  async function persist(next: CategoryConfig[]) {
    setCats(next);
    setSaving(true);
    setSaveMsg('');
    try {
      await dbSetConfig('categories', next);
      dispatch(EV_CATEGORIES);
      setSaveMsg('Saved!');
    } catch {
      setSaveMsg('Save failed — try again');
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(''), 3000);
    }
  }

  function toggleCat(label: string) {
    persist(cats.map(c => c.label === label ? { ...c, enabled: !c.enabled } : c));
  }
  function updateImg(label: string, img: string) {
    persist(cats.map(c => c.label === label ? { ...c, img } : c));
  }
  function updateLabel(label: string, newLabel: string) {
    persist(cats.map(c => c.label === label ? { ...c, label: newLabel } : c));
  }
  function moveUp(i: number) {
    if (i === 0) return;
    const next = [...cats]; [next[i - 1], next[i]] = [next[i], next[i - 1]]; persist(next);
  }
  function moveDown(i: number) {
    if (i === cats.length - 1) return;
    const next = [...cats]; [next[i], next[i + 1]] = [next[i + 1], next[i]]; persist(next);
  }

  return (
    <div>
      <p style={{ color: 'var(--luna-muted)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
        Changes save to Supabase and reflect for all customers immediately — no deployment needed.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
        {cats.map((cat, i) => (
          <div key={cat.label} style={{ background: cat.enabled ? 'rgba(201,168,76,0.08)' : 'rgba(0,0,0,0.03)', border: cat.enabled ? '1px solid rgba(26,22,20,0.12)' : '1px solid rgba(26,22,20,0.06)', borderRadius: 'var(--radius)', padding: '0.875rem 1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flexShrink: 0 }}>
                <button onClick={() => moveUp(i)} disabled={i === 0} style={{ background: 'none', border: 'none', color: i === 0 ? 'rgba(26,22,20,0.15)' : 'var(--luna-muted)', cursor: i === 0 ? 'default' : 'pointer', padding: '1px', fontFamily: 'DM Sans, sans-serif', fontSize: '0.625rem', lineHeight: 1 }}>▲</button>
                <button onClick={() => moveDown(i)} disabled={i === cats.length - 1} style={{ background: 'none', border: 'none', color: i === cats.length - 1 ? 'rgba(26,22,20,0.15)' : 'var(--luna-muted)', cursor: i === cats.length - 1 ? 'default' : 'pointer', padding: '1px', fontFamily: 'DM Sans, sans-serif', fontSize: '0.625rem', lineHeight: 1 }}>▼</button>
              </div>
              {cat.img && <img src={cat.img} alt={cat.label} style={{ width: 48, height: 40, objectFit: 'cover', borderRadius: '0.375rem', flexShrink: 0, opacity: cat.enabled ? 1 : 0.4 }} />}
              <span style={{ fontWeight: 600, fontSize: '0.9375rem', flex: 1, color: cat.enabled ? 'var(--luna-fg)' : 'var(--luna-muted)' }}>{cat.label}</span>
              <Toggle checked={cat.enabled} onChange={() => toggleCat(cat.label)} />
            </div>
            {cat.enabled && (
              <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(26,22,20,0.06)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--luna-muted)', marginBottom: '0.25rem' }}>Category Name</label>
                  <input
                    value={cat.label}
                    onChange={e => updateLabel(cat.label, e.target.value)}
                    style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid rgba(26,22,20,0.15)', borderRadius: 'var(--radius)', fontSize: '0.875rem', fontFamily: 'DM Sans, sans-serif', background: '#fff', color: 'var(--luna-fg)', boxSizing: 'border-box' }}
                  />
                </div>
                <ImageUploadField label="Category Image" value={cat.img} onChange={v => updateImg(cat.label, v)} compact />
              </div>
            )}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
        <button onClick={() => persist(DEFAULT_CATEGORIES)} style={{ padding: '0.5rem 1rem', background: 'transparent', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 'var(--radius)', color: 'rgba(248,113,113,0.8)', fontSize: '0.8125rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
          Reset to defaults
        </button>
        {saving && <span style={{ fontSize: '0.8125rem', color: 'var(--luna-muted)' }}>Saving…</span>}
        {saveMsg && <span style={{ fontSize: '0.8125rem', color: saveMsg.includes('fail') ? 'rgba(248,113,113,0.9)' : 'rgba(34,197,94,0.9)' }}>{saveMsg}</span>}
      </div>
    </div>
  );
}

function Content() {
  const [tab, setTab] = useState<'slides' | 'new-arrivals' | 'categories'>('slides');
  const tabs: { id: 'slides' | 'new-arrivals' | 'categories'; label: string }[] = [
    { id: 'slides', label: 'Hero Slides' },
    { id: 'new-arrivals', label: 'New Arrivals' },
    { id: 'categories', label: 'Browse by Category' },
  ];

  return (
    <div>
      <SectionHeader title="Home Page Content" eyebrow="Content" />
      <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '1.75rem', flexWrap: 'wrap' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: '0.5rem 1.125rem', borderRadius: 999, fontSize: '0.875rem', fontFamily: 'DM Sans, sans-serif', border: tab === t.id ? '1px solid var(--luna-1)' : '1px solid rgba(26,22,20,0.10)', background: tab === t.id ? 'rgba(26,22,20,0.09)' : 'transparent', color: tab === t.id ? 'var(--luna-1)' : 'var(--luna-muted)', cursor: 'pointer', fontWeight: tab === t.id ? 600 : 400, transition: 'all 150ms' }}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'slides' && <HeroSlidesPanel />}
      {tab === 'new-arrivals' && <NewArrivalsPanel />}
      {tab === 'categories' && <CategoriesPanel />}
    </div>
  );
}

/* ── Section: Audit Log ───────────────────────────────────────── */
function AuditLog() {
  const [log, setLog] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { dbGetAuditLog().then(data => { setLog(data); setLoading(false); }); }, []);
  async function clear() {
    if (!await adminConfirm('Clear audit log? This cannot be undone.')) return;
    await dbClearAuditLog();
    setLog([]);
  }
  if (loading) return <AdminSkeleton />;
  const actionColor = (a: string) => a === 'CREATE' ? { bg: 'rgba(34,197,94,0.1)', color: '#3A7A38' } : a === 'DELETE' ? { bg: 'rgba(196,72,48,0.1)', color: '#C44830' } : { bg: 'rgba(251,191,36,0.1)', color: '#b8920a' };
  return (
    <div>
      <SectionHeader title="Audit Log" eyebrow={`${log.length} entries`} action={log.length ? { label: 'Clear Log', onClick: clear } : undefined} />
      <div style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(26,22,20,0.08)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
        {log.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--luna-muted)', fontSize: '0.875rem' }}>No admin actions logged yet. Actions you take in the dashboard will appear here.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><th style={th}>Action</th><th style={th}>Entity</th><th style={th}>Detail</th><th style={th}>When</th><th style={th}>Actor</th></tr></thead>
            <tbody>
              {log.map((entry, i) => {
                const ac = actionColor(entry.action);
                return (
                  <tr key={i}>
                    <td style={td}><span style={{ padding: '0.125rem 0.5rem', borderRadius: 4, fontSize: '0.75rem', fontWeight: 600, background: ac.bg, color: ac.color }}>{entry.action}</span></td>
                    <td style={{ ...td, color: 'var(--luna-2)', fontWeight: 500 }}>{entry.entity}</td>
                    <td style={{ ...td, color: 'var(--luna-muted)', fontSize: '0.8125rem', maxWidth: 300 }}>{entry.detail}</td>
                    <td style={{ ...td, color: 'var(--luna-muted)', fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>{entry.date}</td>
                    <td style={{ ...td, color: 'var(--luna-muted)', fontSize: '0.75rem' }}>{entry.actor}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

/* ── Section: Settings ────────────────────────────────────────── */
function Settings() {
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(() => getFreeShippingThreshold());
  const [shippingCostState, setShippingCostState] = useState(() => getShippingCost());
  const [shippingSaved, setShippingSaved] = useState(false);

  function saveShipping() {
    saveFreeShippingThreshold(freeShippingThreshold);
    saveShippingCost(shippingCostState);
    setShippingSaved(true);
    setTimeout(() => setShippingSaved(false), 2000);
  }

  const inputStyle: React.CSSProperties = { background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(26,22,20,0.10)', borderRadius: '0.375rem', padding: '0.3rem 0.625rem', color: 'var(--luna-fg)', fontFamily: 'DM Sans, sans-serif', fontSize: '0.875rem', outline: 'none', maxWidth: 160, textAlign: 'right' };
  const saveBtn: React.CSSProperties = { marginTop: '1rem', width: '100%', padding: '0.5rem', background: 'rgba(26,22,20,0.06)', border: '1px solid rgba(26,22,20,0.10)', borderRadius: '0.5rem', color: 'var(--luna-1)', fontSize: '0.8125rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', transition: 'background 150ms' };
  const rowStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' };
  const labelStyle: React.CSSProperties = { fontSize: '0.875rem', color: 'var(--luna-muted)' };
  const cardStyle: React.CSSProperties = { background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(26,22,20,0.08)', borderRadius: 'var(--radius)', padding: '1.25rem 1.5rem' };
  const eyebrow: React.CSSProperties = { fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--luna-muted)', marginBottom: '1rem' };

  return (
    <div>
      <SectionHeader title="Settings" eyebrow="Store configuration" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>

        {/* General */}
        <div style={cardStyle}>
          <p style={eyebrow}>General</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[{ label: 'Store name', value: BRAND.name }, { label: 'Support email', value: BRAND.email }, { label: 'WhatsApp number', value: BRAND.whatsapp }, { label: 'Currency', value: BRAND.currency }].map(f => (
              <div key={f.label} style={rowStyle}>
                <label style={labelStyle}>{f.label}</label>
                <input defaultValue={f.value} style={inputStyle} />
              </div>
            ))}
          </div>
          <button style={saveBtn}>Save General</button>
        </div>

        {/* Shipping */}
        <div style={cardStyle}>
          <p style={eyebrow}>Shipping</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={rowStyle}>
              <label style={labelStyle}>Free shipping above (Rs.)</label>
              <input
                type="number"
                value={freeShippingThreshold}
                onChange={e => { setFreeShippingThreshold(Number(e.target.value)); setShippingSaved(false); }}
                style={inputStyle}
                min={0}
              />
            </div>
            <div style={rowStyle}>
              <label style={labelStyle}>Shipping cost (Rs.)</label>
              <input
                type="number"
                value={shippingCostState}
                onChange={e => { setShippingCostState(Number(e.target.value)); setShippingSaved(false); }}
                style={inputStyle}
                min={0}
              />
            </div>
            {[{ label: 'Standard delivery', value: '1–3 working days' }, { label: 'Coverage', value: 'Pakistan-wide' }, { label: 'Return window', value: '7 days' }].map(f => (
              <div key={f.label} style={rowStyle}>
                <label style={labelStyle}>{f.label}</label>
                <input defaultValue={f.value} style={inputStyle} />
              </div>
            ))}
          </div>
          <button onClick={saveShipping} style={{ ...saveBtn, color: shippingSaved ? '#3A7A38' : 'var(--luna-1)' }}>
            {shippingSaved ? '✓ Saved' : 'Save Shipping'}
          </button>
        </div>

        {/* Data Management */}
        <div style={cardStyle}>
          <p style={eyebrow}>Data Management</p>
          <p style={{ fontSize: '0.8125rem', color: 'var(--luna-muted)', margin: '0 0 1rem' }}>Permanently delete data from Supabase. This cannot be undone.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {([
              { label: 'Orders', desc: 'All customer orders in Supabase', fn: dbClearOrders, msg: 'Delete ALL orders? This cannot be undone.' },
              { label: 'Coupons', desc: 'All discount codes in Supabase', fn: dbClearCoupons, msg: 'Delete ALL coupons?' },
              { label: 'Audit Log', desc: 'Admin action history in Supabase', fn: dbClearAuditLog, msg: 'Clear audit log?' },
            ] as const).map(({ label, desc, fn, msg }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 1rem', background: 'rgba(196,72,48,0.04)', border: '1px solid rgba(196,72,48,0.12)', borderRadius: '0.625rem' }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9375rem', color: 'var(--luna-1)' }}>{label}</p>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--luna-muted)' }}>{desc}</p>
                </div>
                <button onClick={async () => {
                  if (!await adminConfirm(msg)) return;
                  try { await fn(); toast(`${label} cleared.`, { type: 'success' }); }
                  catch { toast(`Error clearing ${label}. Check Supabase connection.`, { type: 'error' }); }
                }} style={{ padding: '0.4375rem 1rem', background: 'rgba(196,72,48,0.08)', border: '1px solid rgba(196,72,48,0.2)', borderRadius: '0.5rem', color: '#C44830', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                  Clear {label}
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

/* ── Section: About ───────────────────────────────────────────── */
function AboutPanel() {
  const [form, setForm] = useState<AboutContent>(() => getAbout());
  const [saved, setSaved] = useState(false);

  function set(field: keyof AboutContent, val: string) {
    setForm(f => ({ ...f, [field]: val }));
    setSaved(false);
  }

  function setValueField(i: number, field: 'icon' | 'title' | 'desc', val: string) {
    setForm(f => {
      const values = [...f.values];
      values[i] = { ...values[i], [field]: val };
      return { ...f, values };
    });
    setSaved(false);
  }

  function handleSave() {
    saveAbout(form);
    setSaved(true);
  }

  return (
    <div>
      <SectionHeader title="About Page" eyebrow="Brand story" action={{ label: saved ? '✓ Saved' : 'Save Changes', onClick: handleSave }} />
      <p style={{ color: 'var(--luna-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>Edit your brand story and values. Changes reflect immediately on the About page.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: 700 }}>
        <FieldInput label="Page headline" value={form.headline} onChange={v => set('headline', v)} placeholder="Precision on Your Wrist" />
        <FieldTextarea label="Brand story (left column)" value={form.story} onChange={v => set('story', v)} rows={5} />
        <FieldTextarea label="Mission statement (right column)" value={form.mission} onChange={v => set('mission', v)} rows={3} />
        <FieldTextarea label="Personal/team note (italic quote)" value={form.teamNote} onChange={v => set('teamNote', v)} rows={2} />
        <FieldInput label="Founded year" value={form.foundedYear} onChange={v => set('foundedYear', v)} placeholder="2022" />

        <div>
          <p style={{ fontSize: '0.75rem', color: 'var(--luna-muted)', fontWeight: 500, marginBottom: '0.75rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Values Cards</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {form.values.map((v, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '3rem 1fr 2fr', gap: '0.625rem', alignItems: 'end', background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(26,22,20,0.08)', borderRadius: '0.625rem', padding: '0.875rem' }}>
                <FieldInput label="Icon" value={v.icon} onChange={val => setValueField(i, 'icon', val)} />
                <FieldInput label="Title" value={v.title} onChange={val => setValueField(i, 'title', val)} />
                <FieldInput label="Description" value={v.desc} onChange={val => setValueField(i, 'desc', val)} />
              </div>
            ))}
          </div>
        </div>

        <button onClick={handleSave} style={{ alignSelf: 'flex-start', padding: '0.625rem 1.5rem', background: saved ? 'rgba(134,239,172,0.15)' : 'var(--luna-1)', border: saved ? '1px solid rgba(134,239,172,0.3)' : 'none', borderRadius: 'var(--radius)', color: saved ? '#3A7A38' : 'var(--luna-5)', fontSize: '0.9375rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', transition: 'all 200ms' }}>
          {saved ? '✓ Changes Saved' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}

/* ── SectionHeader ────────────────────────────────────────────── */
function SectionHeader({ title, eyebrow, action }: { title: string; eyebrow?: string; action?: { label: string; onClick: () => void } }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
      <div>
        {eyebrow && <p className="eyebrow" style={{ marginBottom: '0.25rem' }}>{eyebrow}</p>}
        <h2 className="font-display" style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 600, letterSpacing: '-0.02em', margin: 0 }}>{title}</h2>
      </div>
      {action && (
        <button onClick={action.onClick} style={{ padding: '0.5rem 1rem', background: 'var(--luna-1)', border: 'none', borderRadius: 'var(--radius)', color: 'var(--luna-5)', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', transition: 'transform 150ms', minHeight: 40 }}
          onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.02)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}>
          {action.label}
        </button>
      )}
    </div>
  );
}

/* ── Sidebar nav ──────────────────────────────────────────────── */
const navItems: { id: Section; label: string; icon: string }[] = [
  { id: 'analytics', label: 'Analytics', icon: '↗' },
  { id: 'products', label: 'Products', icon: '⌚' },
  { id: 'orders', label: 'Orders', icon: '📦' },
  { id: 'coupons', label: 'Coupons', icon: '%' },
  { id: 'customers', label: 'Customers', icon: '⊙' },
  { id: 'loyalty', label: 'Loyalty', icon: '★' },
  { id: 'content', label: 'Content', icon: '◫' },
  { id: 'about', label: 'About Page', icon: '✦' },
  { id: 'audit', label: 'Audit Log', icon: '⏱' },
  { id: 'settings', label: 'Settings', icon: '⚙' },
];

/* ── Admin gate ───────────────────────────────────────────────── */
export default function Admin() {
  const [section, setSection] = useState<Section>('analytics');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const sectionComponents: Record<Section, React.ReactNode> = {
    analytics: <Analytics />,
    products: <Products />,
    orders: <Orders />,
    coupons: <Coupons />,
    customers: <Customers />,
    loyalty: <Loyalty />,
    content: <Content />,
    about: <AboutPanel />,
    audit: <AuditLog />,
    settings: <Settings />,
  };

  const sidebarContent = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '1.5rem 1.25rem', borderBottom: '1px solid rgba(26,22,20,0.08)', marginBottom: '0.5rem' }}>
        <StarkBuyLogo height={24} />
        <p style={{ margin: '0.5rem 0 0', fontSize: '0.6875rem', color: 'var(--luna-muted)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Admin Panel</p>
      </div>
      <nav style={{ flex: 1, padding: '0 0.5rem', display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => { setSection(item.id); setMobileSidebarOpen(false); }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '0.625rem 0.875rem', borderRadius: '0.625rem', border: 'none', background: section === item.id ? 'rgba(26,22,20,0.09)' : 'transparent', color: section === item.id ? 'var(--luna-1)' : 'var(--luna-muted)', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: '0.875rem', fontWeight: section === item.id ? 600 : 400, textAlign: 'left', width: '100%', transition: 'background 150ms, color 150ms' }}
          >
            <span style={{ fontSize: '0.875rem', width: 20, textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>
      <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid rgba(26,22,20,0.06)', marginTop: '0.5rem' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--luna-muted)', fontSize: '0.8125rem', textDecoration: 'none' }}>
          ← View store
        </Link>
      </div>
    </div>
  );

  return (
      <div style={{ minHeight: '100dvh', display: 'flex', background: 'var(--luna-5)' }}>
        <ConfirmModal />
        {/* Desktop sidebar */}
        <aside style={{ width: 220, flexShrink: 0, background: 'rgba(255,255,255,0.95)', borderRight: '1px solid rgba(26,22,20,0.08)', position: 'sticky', top: 0, height: '100dvh', overflowY: 'auto' }} className="admin-sidebar">
          {sidebarContent}
        </aside>

        {/* Mobile sidebar overlay */}
        {mobileSidebarOpen && (
          <>
            <div onClick={() => setMobileSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(26,22,20,0.45)', zIndex: 400, backdropFilter: 'blur(4px)' }} />
            <aside style={{ position: 'fixed', left: 0, top: 0, bottom: 0, width: 220, background: 'rgba(255,255,255,0.97)', borderRight: '1px solid rgba(26,22,20,0.09)', zIndex: 401, backdropFilter: 'blur(14px)', overflowY: 'auto' }}>
              {sidebarContent}
            </aside>
          </>
        )}

        {/* Main content */}
        <main style={{ flex: 1, minWidth: 0, overflowY: 'auto' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(26,22,20,0.08)', display: 'flex', alignItems: 'center', gap: '1rem', position: 'sticky', top: 0, background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(14px)', zIndex: 10 }} className="admin-mobile-header">
            <button onClick={() => setMobileSidebarOpen(true)} style={{ background: 'none', border: 'none', color: 'var(--luna-fg)', cursor: 'pointer', padding: '0.25rem', display: 'none' }} className="admin-hamburger">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
            </button>
            <span style={{ fontWeight: 600, fontSize: '0.9375rem', textTransform: 'capitalize' }}>{navItems.find(n => n.id === section)?.label ?? section}</span>
          </div>
          <div style={{ padding: '2rem 1.5rem', maxWidth: 1100 }}>
            {sectionComponents[section]}
          </div>
        </main>

        <style>{`
          @media (max-width: 767px) {
            .admin-sidebar { display: none !important; }
            .admin-hamburger { display: flex !important; }
          }
        `}</style>
      </div>
  );
}
