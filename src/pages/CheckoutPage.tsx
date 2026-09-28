import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { formatPrice } from '../data/products';
import { BRAND } from '../config';
import { IconChevronRight, IconShield, IconTruck } from '../components/icons/Icons';
import { toast } from '../utils/toast';
import { useShippingConfig } from '../hooks/useStoreData';
import { dbPlaceOrder, dbSaveOrder, dbValidateCoupon, type StoredCoupon, type PlaceOrderResult } from '../utils/supabaseStore';
import { supabaseUrl, supabaseAnonKey } from '../lib/supabase';

const OWNER_EMAIL = 'starkbuypk@gmail.com';

/* ── HTML escaping — prevents injection into email body (H2 fix) ── */
function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ── Send email via Supabase Edge Function (Hostinger SMTP) ── */
async function sendOrderEmail(to: { email: string; name: string }, subject: string, html: string) {
  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({ to, subject, html }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  } catch {
    // best-effort; order already saved to Supabase
  }
}

function ownerEmailHtml(params: {
  order_id: string; customer_name: string; customer_phone: string; customer_email: string;
  shipping_address: string; coupon: string; items: { name: string; qty: number; price: string }[];
  shipping: string; total: string;
}) {
  const rows = params.items.map(i => `
    <tr>
      <td style="padding:12px 16px;border-bottom:1px solid #f0ebe6;font-size:14px;color:#1a1614">${esc(i.name)}</td>
      <td style="padding:12px 16px;border-bottom:1px solid #f0ebe6;font-size:14px;text-align:center;color:#555">${i.qty}</td>
      <td style="padding:12px 16px;border-bottom:1px solid #f0ebe6;font-size:14px;text-align:right;color:#1a1614;font-weight:600">${esc(i.price)}</td>
    </tr>`).join('');
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#f5f0eb;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0eb;padding:32px 16px">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.08)">
        <!-- Header -->
        <tr><td style="background:#1a1614;padding:24px 32px;text-align:center">
          <p style="margin:0;font-size:22px;font-weight:700;letter-spacing:2px;color:#C9A84C">STARKBUY</p>
          <p style="margin:6px 0 0;font-size:12px;color:rgba(255,255,255,0.5);letter-spacing:1px;text-transform:uppercase">Pakistan</p>
        </td></tr>
        <!-- Alert banner -->
        <tr><td style="background:#C9A84C;padding:12px 32px;text-align:center">
          <p style="margin:0;font-size:13px;font-weight:600;color:#1a1614;letter-spacing:0.5px">&#x1F6D2; NEW ORDER RECEIVED &mdash; ${esc(params.order_id)}</p>
        </td></tr>
        <!-- Customer info -->
        <tr><td style="padding:28px 32px 0">
          <p style="margin:0 0 16px;font-size:16px;font-weight:700;color:#1a1614;border-bottom:2px solid #f0ebe6;padding-bottom:10px">Customer Details</p>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:5px 0;font-size:13px;color:#888;width:100px">Name</td><td style="padding:5px 0;font-size:13px;color:#1a1614;font-weight:600">${esc(params.customer_name)}</td></tr>
            <tr><td style="padding:5px 0;font-size:13px;color:#888">Phone</td><td style="padding:5px 0;font-size:13px;color:#1a1614">${esc(params.customer_phone)}</td></tr>
            <tr><td style="padding:5px 0;font-size:13px;color:#888">Email</td><td style="padding:5px 0;font-size:13px;color:#1a1614">${esc(params.customer_email)}</td></tr>
            <tr><td style="padding:5px 0;font-size:13px;color:#888">Address</td><td style="padding:5px 0;font-size:13px;color:#1a1614">${esc(params.shipping_address)}</td></tr>
            ${params.coupon !== 'None' ? `<tr><td style="padding:5px 0;font-size:13px;color:#888">Coupon</td><td style="padding:5px 0;font-size:13px;color:#C9A84C;font-weight:600">${esc(params.coupon)}</td></tr>` : ''}
          </table>
        </td></tr>
        <!-- Items -->
        <tr><td style="padding:24px 32px 0">
          <p style="margin:0 0 12px;font-size:16px;font-weight:700;color:#1a1614;border-bottom:2px solid #f0ebe6;padding-bottom:10px">Order Items</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #f0ebe6;border-radius:8px;overflow:hidden">
            <thead><tr style="background:#faf7f4">
              <th style="padding:10px 16px;font-size:12px;text-align:left;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Product</th>
              <th style="padding:10px 16px;font-size:12px;text-align:center;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Qty</th>
              <th style="padding:10px 16px;font-size:12px;text-align:right;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Price</th>
            </tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </td></tr>
        <!-- Totals -->
        <tr><td style="padding:20px 32px 28px">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:4px 0;font-size:13px;color:#888">Shipping</td><td style="padding:4px 0;font-size:13px;text-align:right;color:#1a1614">${esc(params.shipping)}</td></tr>
            <tr><td style="padding:4px 0;font-size:13px;color:#888">Payment</td><td style="padding:4px 0;font-size:13px;text-align:right;color:#1a1614">Cash on Delivery</td></tr>
            <tr><td colspan="2" style="padding:8px 0 0"><div style="border-top:2px solid #1a1614;margin:4px 0"></div></td></tr>
            <tr><td style="padding:8px 0;font-size:16px;font-weight:700;color:#1a1614">Total</td><td style="padding:8px 0;font-size:18px;font-weight:700;text-align:right;color:#C9A84C">${esc(params.total)}</td></tr>
          </table>
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#f5f0eb;padding:16px 32px;text-align:center;border-top:1px solid #ece7e2">
          <p style="margin:0;font-size:12px;color:#999">StarkBuy Pakistan &bull; orders@starkbuypk.com</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function customerEmailHtml(params: {
  order_id: string; first_name: string; items: { name: string; qty: number; price: string }[];
  shipping: string; total: string;
}) {
  const rows = params.items.map(i => `
    <tr>
      <td style="padding:14px 16px;border-bottom:1px solid #f0ebe6;font-size:14px;color:#1a1614">${esc(i.name)}</td>
      <td style="padding:14px 16px;border-bottom:1px solid #f0ebe6;font-size:14px;text-align:center;color:#666">${i.qty}</td>
      <td style="padding:14px 16px;border-bottom:1px solid #f0ebe6;font-size:14px;text-align:right;font-weight:700;color:#1a1614">${esc(i.price)}</td>
    </tr>`).join('');
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#f5f0eb;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0eb;padding:32px 16px">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.08)">
        <!-- Header -->
        <tr><td style="background:#1a1614;padding:32px;text-align:center">
          <p style="margin:0;font-size:26px;font-weight:700;letter-spacing:3px;color:#C9A84C">STARKBUY</p>
          <p style="margin:6px 0 0;font-size:11px;color:rgba(255,255,255,0.45);letter-spacing:2px;text-transform:uppercase">Pakistan</p>
        </td></tr>
        <!-- Hero message -->
        <tr><td style="padding:36px 32px 24px;text-align:center">
          <div style="width:64px;height:64px;background:#f5f0eb;border-radius:50%;margin:0 auto 20px;display:flex;align-items:center;justify-content:center;font-size:28px;line-height:64px">&#x2705;</div>
          <p style="margin:0 0 8px;font-size:24px;font-weight:700;color:#1a1614">Order Confirmed!</p>
          <p style="margin:0;font-size:15px;color:#666">Thank you, <b style="color:#1a1614">${esc(params.first_name)}</b>. Your order has been placed successfully.</p>
        </td></tr>
        <!-- Order ID badge -->
        <tr><td style="padding:0 32px 28px;text-align:center">
          <div style="display:inline-block;background:#faf7f4;border:1px solid #e8e1d9;border-radius:8px;padding:12px 24px">
            <p style="margin:0;font-size:11px;color:#999;letter-spacing:1px;text-transform:uppercase;margin-bottom:4px">Order Number</p>
            <p style="margin:0;font-size:20px;font-weight:700;color:#C9A84C;letter-spacing:1px">${esc(params.order_id)}</p>
          </div>
        </td></tr>
        <!-- Items table -->
        <tr><td style="padding:0 32px">
          <p style="margin:0 0 12px;font-size:16px;font-weight:700;color:#1a1614;border-bottom:2px solid #f0ebe6;padding-bottom:10px">Your Items</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #f0ebe6;border-radius:8px;overflow:hidden">
            <thead><tr style="background:#faf7f4">
              <th style="padding:10px 16px;font-size:12px;text-align:left;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Product</th>
              <th style="padding:10px 16px;font-size:12px;text-align:center;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Qty</th>
              <th style="padding:10px 16px;font-size:12px;text-align:right;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Price</th>
            </tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </td></tr>
        <!-- Totals -->
        <tr><td style="padding:20px 32px 0">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:4px 0;font-size:13px;color:#888">Shipping</td><td style="padding:4px 0;font-size:13px;text-align:right;color:#1a1614">${esc(params.shipping)}</td></tr>
            <tr><td style="padding:4px 0;font-size:13px;color:#888">Payment Method</td><td style="padding:4px 0;font-size:13px;text-align:right;color:#1a1614">Cash on Delivery</td></tr>
            <tr><td colspan="2" style="padding:8px 0 0"><div style="border-top:2px solid #1a1614;margin:4px 0"></div></td></tr>
            <tr><td style="padding:8px 0;font-size:16px;font-weight:700;color:#1a1614">Total Amount</td><td style="padding:8px 0;font-size:20px;font-weight:700;text-align:right;color:#C9A84C">${esc(params.total)}</td></tr>
          </table>
        </td></tr>
        <!-- COD info box -->
        <tr><td style="padding:24px 32px">
          <div style="background:#faf7f4;border-left:4px solid #C9A84C;border-radius:0 8px 8px 0;padding:16px 20px">
            <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#1a1614">&#x1F4B5; Cash on Delivery</p>
            <p style="margin:0;font-size:13px;color:#666;line-height:1.6">Please keep the exact amount ready at the time of delivery. Our team will contact you to confirm your delivery time.</p>
          </div>
        </td></tr>
        <!-- Track order -->
        <tr><td style="padding:0 32px 28px;text-align:center">
          <p style="margin:0 0 4px;font-size:13px;color:#888">Track your order anytime at</p>
          <p style="margin:0;font-size:13px;font-weight:600;color:#C9A84C">starkbuypk.com &rarr; Track Order</p>
          <p style="margin:6px 0 0;font-size:12px;color:#aaa">Use your order number and phone/email to track</p>
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#1a1614;padding:20px 32px;text-align:center">
          <p style="margin:0 0 4px;font-size:12px;font-weight:600;letter-spacing:1px;color:#C9A84C">STARKBUY PAKISTAN</p>
          <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.4)">orders@starkbuypk.com &bull; WhatsApp available</p>
          <p style="margin:8px 0 0;font-size:11px;color:rgba(255,255,255,0.25)">You received this email because you placed an order on StarkBuy.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

/* ── Crypto-secure order ID ──────────────────────────────────────── */
function generateOrderId(): string {
  const arr = new Uint32Array(2);
  crypto.getRandomValues(arr);
  const hex = arr[0].toString(16).padStart(8, '0') + arr[1].toString(16).slice(0, 4);
  return `SB-${hex.toUpperCase()}`;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/* ── Types ───────────────────────────────────────────────────── */
type Step = 'contact' | 'shipping' | 'confirmation';

interface ContactForm { name: string; phone: string; email: string; }
interface ShippingForm { street: string; area: string; city: string; postcode: string; }

/* ── Step indicator ───────────────────────────────────────────── */
const STEPS: { id: Step; label: string }[] = [
  { id: 'contact', label: 'Contact' },
  { id: 'shipping', label: 'Shipping' },
  { id: 'confirmation', label: 'Confirmed' },
];

function StepBar({ current }: { current: Step }) {
  const idx = STEPS.findIndex(s => s.id === current);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0', marginBottom: '2.5rem', overflow: 'hidden' }}>
      {STEPS.map((s, i) => {
        const done = i < idx;
        const active = i === idx;
        return (
          <div key={s.id} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
              <div style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: done ? '0.75rem' : '0.8125rem',
                fontWeight: 600,
                background: done ? 'var(--luna-1)' : active ? 'rgba(26,22,20,0.12)' : 'rgba(26,22,20,0.06)',
                border: done ? 'none' : active ? '1.5px solid var(--luna-1)' : '1px solid rgba(26,22,20,0.10)',
                color: done ? 'var(--luna-5)' : active ? 'var(--luna-1)' : 'var(--luna-muted)',
                transition: 'all 200ms',
              }}>
                {done ? '✓' : i + 1}
              </div>
              <span style={{ fontSize: '0.8125rem', fontWeight: active ? 600 : 400, color: active ? 'var(--luna-fg)' : done ? 'var(--luna-2)' : 'var(--luna-muted)', whiteSpace: 'nowrap', display: 'none' }} className="step-label">
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ flex: 1, height: 1, background: done ? 'var(--luna-2)' : 'rgba(26,22,20,0.08)', margin: '0 0.5rem', minWidth: 24 }} />
            )}
          </div>
        );
      })}
      <style>{`@media (min-width: 480px) { .step-label { display: inline !important; } }`}</style>
    </div>
  );
}

/* ── Input ────────────────────────────────────────────────────── */
function Field({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
      <label style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--luna-muted)' }}>{label}</label>
      <input
        {...props}
        style={{
          background: 'rgba(0,0,0,0.04)',
          border: '1px solid rgba(26,22,20,0.12)',
          borderRadius: '0.625rem',
          padding: '0.8125rem 1rem',
          color: 'var(--luna-fg)',
          fontFamily: 'DM Sans, sans-serif',
          fontSize: '0.9375rem',
          outline: 'none',
          width: '100%',
          transition: 'border-color 150ms',
        }}
        onFocus={e => { e.currentTarget.style.borderColor = 'rgba(201,168,76,0.5)'; }}
        onBlur={e => { e.currentTarget.style.borderColor = 'rgba(26,22,20,0.12)'; }}
      />
    </div>
  );
}

/* ── Coupon discount calculator ──────────────────────────────── */
function calcDiscount(coupon: StoredCoupon | null, subtotal: number): number {
  if (!coupon) return 0;
  if (coupon.type === 'Percentage') return Math.round(subtotal * coupon.value / 100);
  return Math.min(coupon.value, subtotal);
}

/* ── Order Summary sidebar ────────────────────────────────────── */
function OrderSummary({
  couponCode,
  setCouponCode,
  appliedCoupon,
  setAppliedCoupon,
}: {
  couponCode: string;
  setCouponCode: (v: string) => void;
  appliedCoupon: StoredCoupon | null;
  setAppliedCoupon: (v: StoredCoupon | null) => void;
}) {
  const { items, subtotal } = useCart();
  const { threshold: freeThreshold, cost: shipCost } = useShippingConfig();
  const couponDiscount = calcDiscount(appliedCoupon, subtotal);
  const shipping = subtotal >= freeThreshold ? 0 : shipCost;
  const total = subtotal - couponDiscount + shipping;

  async function applyCoupon() {
    const code = couponCode.toUpperCase().trim();
    if (!code) return;
    const found = await dbValidateCoupon(code);
    if (!found) { toast('Invalid, expired, or used-up coupon code.', { type: 'error' }); return; }
    setAppliedCoupon(found);
    toast(`Coupon ${found.code} applied!`);
  }

  return (
    <div style={{ position: 'sticky', top: '6rem' }}>
      <div style={{ background: '#FFFFFF', border: '1px solid rgba(26,22,20,0.08)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(26,22,20,0.08)' }}>
          <p style={{ fontWeight: 600, margin: 0 }}>Order summary</p>
        </div>
        <div style={{ padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {items.map(item => (
            <div key={`${item.product.id}-${item.caseSize}-${item.strap}`} style={{ display: 'flex', gap: '0.875rem', alignItems: 'center' }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <img src={item.product.image + (item.product.image.includes('?') ? '&w=80' : '?w=80')} alt={item.product.name} style={{ width: 52, height: 64, objectFit: 'cover', borderRadius: '0.5rem' }} loading="lazy" />
                <span style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, background: 'var(--luna-4)', border: '1px solid rgba(26,22,20,0.12)', borderRadius: '50%', fontSize: '0.625rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--luna-fg)', fontVariantNumeric: 'tabular-nums' }}>
                  {item.quantity}
                </span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontWeight: 500, fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.product.name}</p>
                <p style={{ margin: '0.125rem 0 0', fontSize: '0.75rem', color: 'var(--luna-muted)' }}>{item.strap}</p>
              </div>
              <span style={{ fontVariantNumeric: 'tabular-nums', fontSize: '0.875rem', fontWeight: 500, flexShrink: 0 }}>
                {formatPrice((item.product.discountPercent > 0 ? Math.round(item.product.codPrice * (1 - item.product.discountPercent / 100)) : item.product.codPrice) * item.quantity)}
              </span>
            </div>
          ))}
        </div>

        {/* Coupon */}
        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid rgba(26,22,20,0.06)' }}>
          {!appliedCoupon ? (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                value={couponCode}
                onChange={e => setCouponCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                placeholder="Coupon code"
                maxLength={20}
                style={{ flex: 1, background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(26,22,20,0.10)', borderRadius: '0.5rem', padding: '0.5625rem 0.875rem', color: 'var(--luna-fg)', fontFamily: 'DM Sans, sans-serif', fontSize: '0.875rem', outline: 'none' }}
                onKeyDown={e => e.key === 'Enter' && applyCoupon()}
              />
              <button
                onClick={applyCoupon}
                disabled={!couponCode}
                style={{ padding: '0.5625rem 1rem', background: 'rgba(26,22,20,0.08)', border: '1px solid rgba(26,22,20,0.12)', borderRadius: '0.5rem', color: 'var(--luna-1)', fontSize: '0.875rem', fontWeight: 500, cursor: couponCode ? 'pointer' : 'not-allowed', fontFamily: 'DM Sans, sans-serif', opacity: couponCode ? 1 : 0.5, flexShrink: 0 }}
              >
                Apply
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.875rem', color: '#3A7A38' }}>✓ {appliedCoupon.code} applied</span>
              <button onClick={() => { setAppliedCoupon(null); setCouponCode(''); }} style={{ background: 'none', border: 'none', color: 'var(--luna-muted)', fontSize: '0.75rem', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>Remove</button>
            </div>
          )}
        </div>

        {/* Totals */}
        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid rgba(26,22,20,0.06)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
            <span style={{ color: 'var(--luna-muted)' }}>Subtotal</span>
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatPrice(subtotal)}</span>
          </div>
          {appliedCoupon && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: '#3A7A38' }}>
              <span>Coupon ({appliedCoupon.code})</span>
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>−{formatPrice(couponDiscount)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
            <span style={{ color: 'var(--luna-muted)' }}>Shipping</span>
            <span style={{ fontVariantNumeric: 'tabular-nums', color: shipping === 0 ? '#3A7A38' : 'var(--luna-fg)' }}>
              {shipping === 0 ? 'Free' : formatPrice(shipping)}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 700, borderTop: '1px solid rgba(26,22,20,0.08)', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
            <span>Total</span>
            <span style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--luna-1)' }}>{formatPrice(total)}</span>
          </div>
        </div>

        {/* Trust */}
        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid rgba(26,22,20,0.06)', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', color: 'var(--luna-muted)' }}>
            <span style={{ color: 'var(--luna-2)' }}><IconShield size={13} /></span> Secure checkout
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', color: 'var(--luna-muted)' }}>
            <span style={{ color: 'var(--luna-2)' }}><IconTruck size={13} /></span> Free above {BRAND.currencySymbol} {freeThreshold.toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Contact step ─────────────────────────────────────────────── */
const PK_PHONE_RE = /^(\+92|0)(3\d{9})$/;

function ContactStep({ data, onChange, onNext }: { data: ContactForm; onChange: (f: Partial<ContactForm>) => void; onNext: () => void }) {
  const phoneValid = PK_PHONE_RE.test(data.phone.replace(/\s/g, ''));
  const emailValid = EMAIL_RE.test(data.email.trim());
  const valid = data.name.trim() && phoneValid && emailValid;
  const showPhoneError = data.phone.trim().length > 0 && !phoneValid;
  const showEmailError = data.email.trim().length > 0 && !emailValid;
  return (
    <div>
      <h2 className="font-display" style={{ fontSize: '1.5rem', fontWeight: 600, letterSpacing: '-0.02em', margin: '0 0 1.5rem' }}>Contact details</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
        <Field label="Full name *" value={data.name} onChange={e => onChange({ name: e.target.value })} placeholder="Muhammad Ali" autoComplete="name" maxLength={80} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <Field label="Phone number *" value={data.phone} onChange={e => onChange({ phone: e.target.value })} placeholder="03001234567 or +923001234567" type="tel" autoComplete="tel" maxLength={15} />
          {showPhoneError && (
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#f87171' }}>Enter a valid Pakistani number (e.g. 03001234567)</p>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <Field label="Email * (for order confirmation)" value={data.email} onChange={e => onChange({ email: e.target.value })} placeholder="you@example.com" type="email" autoComplete="email" maxLength={120} />
          {showEmailError && (
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#f87171' }}>Enter a valid email address</p>
          )}
        </div>
      </div>
      <p style={{ fontSize: '0.8125rem', color: 'var(--luna-muted)', marginBottom: '1.5rem' }}>
        Already have an account?{' '}
        <Link to="/login" style={{ color: 'var(--luna-1)', textDecoration: 'none' }}>Sign in</Link>
        {' '}to load your saved addresses.
      </p>
      <button className="btn btn-primary" onClick={onNext} disabled={!valid} style={{ width: '100%' }}>
        Continue to Shipping
      </button>
    </div>
  );
}

/* ── Shipping step ────────────────────────────────────────────── */
function ShippingStep({ data, onChange, onNext, onBack, isPlacing }: { data: ShippingForm; onChange: (f: Partial<ShippingForm>) => void; onNext: () => void; onBack: () => void; isPlacing: boolean }) {
  const { threshold: freeThreshold } = useShippingConfig();
  const valid = data.street.trim() && data.city.trim();
  return (
    <div>
      <h2 className="font-display" style={{ fontSize: '1.5rem', fontWeight: 600, letterSpacing: '-0.02em', margin: '0 0 1.5rem' }}>Shipping address</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
        <Field label="Street address *" value={data.street} onChange={e => onChange({ street: e.target.value })} placeholder="House / flat, street name" autoComplete="address-line1" maxLength={160} />
        <Field label="Area / Sector" value={data.area} onChange={e => onChange({ area: e.target.value })} placeholder="Block, sector, or area name" autoComplete="address-line2" maxLength={100} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
          <Field label="City *" value={data.city} onChange={e => onChange({ city: e.target.value })} placeholder="Lahore" autoComplete="address-level2" maxLength={60} />
          <Field label="Postal code" value={data.postcode} onChange={e => onChange({ postcode: e.target.value })} placeholder="54000" autoComplete="postal-code" maxLength={10} />
        </div>
      </div>
      <div style={{ background: 'rgba(26,22,20,0.05)', border: '1px solid rgba(26,22,20,0.09)', borderRadius: 'var(--radius)', padding: '0.875rem 1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
        <span style={{ color: 'var(--luna-2)', flexShrink: 0, marginTop: '0.125rem' }}><IconTruck size={15} /></span>
        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--luna-muted)', lineHeight: 1.6 }}>
          Standard delivery 1–3 working days. Free shipping on orders above {BRAND.currencySymbol} {freeThreshold.toLocaleString()}. Cash on delivery available at your doorstep.
        </p>
      </div>
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button className="btn btn-outline" onClick={onBack} disabled={isPlacing} style={{ flex: 1 }}>Back</button>
        <button
          className="btn btn-primary"
          onClick={onNext}
          disabled={!valid || isPlacing}
          style={{ flex: 2, opacity: isPlacing ? 0.7 : 1, cursor: isPlacing ? 'wait' : 'pointer' }}
        >
          {isPlacing ? 'Placing order…' : 'Place Order (COD)'}
        </button>
      </div>
    </div>
  );
}

/* ── Confirmation step ────────────────────────────────────────── */
function Confirmation({ contact, orderNumber }: { contact: ContactForm; orderNumber: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '1rem 0 2rem' }}>
      <div style={{ width: 72, height: 72, background: 'rgba(26,22,20,0.08)', border: '1.5px solid rgba(201,168,76,0.4)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', fontSize: '1.75rem', color: 'var(--luna-1)' }}>✓</div>
      <p className="eyebrow" style={{ marginBottom: '0.5rem' }}>Order confirmed</p>
      <h2 className="font-display" style={{ fontSize: 'clamp(1.75rem, 4vw, 2.25rem)', fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 0.625rem' }}>
        Thank you, {contact.name.split(' ')[0]}
      </h2>
      <p style={{ color: 'var(--luna-muted)', marginBottom: '0.5rem', fontSize: '0.9375rem' }}>
        Order <strong style={{ color: 'var(--luna-fg)', fontVariantNumeric: 'tabular-nums' }}>{orderNumber}</strong> has been placed.
        {contact.email && ` A confirmation has been sent to ${contact.email}.`}
      </p>
      <p style={{ color: 'var(--luna-muted)', fontSize: '0.875rem', marginBottom: '2rem' }}>
        Our team will contact you on <strong style={{ color: 'var(--luna-fg)' }}>{contact.phone}</strong> to confirm delivery.
      </p>
      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '1.5rem' }}>
        <Link to="/track-order" className="btn btn-outline">Track this order</Link>
        <Link to="/" className="btn btn-primary">Continue Shopping</Link>
      </div>
    </div>
  );
}

/* ── Main Checkout page ───────────────────────────────────────── */
export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const { threshold: freeThresholdMain, cost: shipCostMain } = useShippingConfig();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('contact');
  const [contact, setContact] = useState<ContactForm>({ name: '', phone: '', email: '' });
  const [shipping, setShipping] = useState<ShippingForm>({ street: '', area: '', city: '', postcode: '' });
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<StoredCoupon | null>(null);
  const [orderNumber] = useState(generateOrderId);
  const [isPlacing, setIsPlacing] = useState(false);

  if (items.length === 0 && step !== 'confirmation') {
    return (
      <div style={{ maxWidth: 600, margin: '4rem auto', padding: '2rem 1.5rem', textAlign: 'center', color: 'var(--luna-muted)' }}>
        <p style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>Your bag is empty.</p>
        <Link to="/collections" className="btn btn-primary" style={{ display: 'inline-flex' }}>Browse Collection</Link>
      </div>
    );
  }

  async function placeOrder() {
    if (isPlacing) return;
    setIsPlacing(true);

    const fullAddress = [shipping.street, shipping.area, shipping.city, shipping.postcode].filter(Boolean).join(', ');

    const orderDate = new Date().toLocaleString('en-PK', { dateStyle: 'medium', timeStyle: 'short' });
    const shippingCost = subtotal >= freeThresholdMain ? 0 : shipCostMain;
    const discount = appliedCoupon
      ? appliedCoupon.type === 'Percentage'
        ? Math.round(subtotal * appliedCoupon.value / 100)
        : appliedCoupon.value
      : 0;
    const totalAmt = subtotal - discount + shippingCost;

    let result: PlaceOrderResult;
    try {
      // Try server-side RPC first (validates totals, atomically consumes coupon)
      result = await dbPlaceOrder({
        id:          orderNumber,
        name:        contact.name,
        phone:       contact.phone,
        email:       contact.email,
        address:     fullAddress,
        city:        shipping.city,
        date:        orderDate,
        item_refs:   items.map(item => ({ id: item.product.id, qty: item.quantity })),
        coupon_code: appliedCoupon?.code ?? null,
      });
    } catch (rpcErr) {
      // RPC not set up yet — fall back to direct order insert with client-computed totals
      if (import.meta.env.DEV) console.warn('place_order RPC failed, using fallback:', rpcErr);
      try {
        await dbSaveOrder({
          id:       orderNumber,
          name:     contact.name,
          phone:    contact.phone,
          email:    contact.email,
          address:  fullAddress,
          city:     shipping.city,
          date:     orderDate,
          items:    items.map(i => ({ name: i.product.name, qty: i.quantity, price: i.product.discountPercent > 0 ? Math.round(i.product.codPrice * (1 - i.product.discountPercent / 100)) : i.product.codPrice })),
          subtotal,
          shipping: shippingCost,
          codFee:   0,
          total:    totalAmt,
          status:   'Processing',
        });
        result = {
          subtotal,
          shipping: shippingCost,
          cod_fee:  0,
          discount,
          total:    totalAmt,
          items:    items.map(i => ({ name: i.product.name, qty: i.quantity, price: i.product.discountPercent > 0 ? Math.round(i.product.codPrice * (1 - i.product.discountPercent / 100)) : i.product.codPrice })),
        };
      } catch (fallbackErr) {
        setIsPlacing(false);
        toast('Could not place your order. Please try again.', { type: 'error' });
        if (import.meta.env.DEV) console.error('Order fallback also failed:', fallbackErr);
        return;
      }
    }

    // Build email content from server-validated totals
    const emailItems   = result.items.map(i => ({ name: i.name, qty: i.qty, price: `Rs. ${i.price.toLocaleString()}` }));
    const shippingLabel = result.shipping === 0 ? 'Free' : `Rs. ${result.shipping.toLocaleString()}`;
    const totalLabel    = `Rs. ${result.total.toLocaleString()}`;
    const couponDisplay = appliedCoupon
      ? `${appliedCoupon.code} −Rs. ${result.discount.toLocaleString()}`
      : 'None';

    // C2: emails sent via Edge Function (Brevo key never leaves the server)
    // Non-blocking — order is already saved; email failure must not break UX
    sendOrderEmail(
      { email: OWNER_EMAIL, name: 'Starkbuy Pakistan' },
      `New Order ${orderNumber} — ${contact.name}`,
      ownerEmailHtml({
        order_id: orderNumber,
        customer_name: contact.name,
        customer_phone: contact.phone,
        customer_email: contact.email || '—',
        shipping_address: fullAddress,
        coupon: couponDisplay,
        items: emailItems,
        shipping: shippingLabel,
        total: totalLabel,
      }),
    );

    if (contact.email) {
      sendOrderEmail(
        { email: contact.email, name: contact.name },
        `Your Starkbuy Order ${orderNumber} is Confirmed!`,
        customerEmailHtml({
          order_id: orderNumber,
          first_name: contact.name.split(' ')[0],
          items: emailItems,
          shipping: shippingLabel,
          total: totalLabel,
        }),
      );
    }

    clearCart();
    setIsPlacing(false);
    setStep('confirmation');
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1.5rem 5rem' }}>
      {/* Header */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', color: 'var(--luna-muted)', marginBottom: '2rem' }}>
        <Link to="/" style={{ color: 'var(--luna-muted)', textDecoration: 'none' }}>Home</Link>
        <IconChevronRight size={12} />
        <Link to="/collections" style={{ color: 'var(--luna-muted)', textDecoration: 'none' }}>Shop</Link>
        <IconChevronRight size={12} />
        <span style={{ color: 'var(--luna-fg)' }}>Checkout</span>
      </nav>

      {step !== 'confirmation' && <StepBar current={step} />}

      <div style={{ display: 'grid', gridTemplateColumns: step === 'confirmation' ? '1fr' : 'minmax(0,1.4fr) minmax(0,1fr)', gap: '3rem', alignItems: 'start' }}>
        {/* Form */}
        <div>
          {step === 'contact' && (
            <ContactStep data={contact} onChange={d => setContact(p => ({ ...p, ...d }))} onNext={() => setStep('shipping')} />
          )}
          {step === 'shipping' && (
            <ShippingStep data={shipping} onChange={d => setShipping(p => ({ ...p, ...d }))} onNext={placeOrder} onBack={() => setStep('contact')} isPlacing={isPlacing} />
          )}
          {step === 'confirmation' && (
            <Confirmation contact={contact} orderNumber={orderNumber} />
          )}
        </div>

        {/* Summary */}
        {step !== 'confirmation' && (
          <OrderSummary couponCode={couponCode} setCouponCode={setCouponCode} appliedCoupon={appliedCoupon} setAppliedCoupon={setAppliedCoupon} />
        )}
      </div>

      <style>{`
        @media (max-width: 767px) {
          div[style*="gridTemplateColumns"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
