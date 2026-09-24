/**
 * Supabase-backed store for all persistent data.
 * Products, orders, coupons, and audit log all live here.
 */
import { supabase } from '../lib/supabase';
import type { Product } from '../data/products';

/* ── Products ────────────────────────────────────────────────────── */

export async function dbGetProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('data')
    .order('created_at', { ascending: true });
  if (error) { if (import.meta.env.DEV) console.error('dbGetProducts:', error); return []; }
  return (data ?? []).map((row) => row.data as Product);
}

export async function dbSaveProduct(p: Product): Promise<void> {
  const { error } = await supabase
    .from('products')
    .upsert({ id: p.id, data: p }, { onConflict: 'id' });
  if (error) throw new Error(error.message);
}

export async function dbDeleteProduct(id: string): Promise<void> {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

/* ── Shared types ────────────────────────────────────────────────── */

export interface StoredOrder {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  items: { name: string; qty: number; price: number }[];
  subtotal: number;
  shipping: number;
  codFee: number;
  total: number;
  status: 'Processing' | 'Dispatched' | 'Delivered' | 'Cancelled';
  date: string;
}

export interface StoredCoupon {
  code: string;
  type: 'Percentage' | 'Fixed';
  value: number;
  used: number;
  limit: number;
  active: boolean;
  expires: string;
}

export interface AuditEntry {
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  entity: string;
  detail: string;
  date: string;
  actor: string;
}

/* ── Row ↔ Type adapters ─────────────────────────────────────────── */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToOrder(row: any): StoredOrder {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email ?? '',
    address: row.address,
    city: row.city,
    items: Array.isArray(row.items) ? row.items : [],
    subtotal: row.subtotal,
    shipping: row.shipping,
    codFee: row.cod_fee,
    total: row.total,
    status: row.status,
    date: row.date,
  };
}

function orderToRow(o: StoredOrder) {
  return {
    id: o.id,
    name: o.name,
    phone: o.phone,
    email: o.email,
    address: o.address,
    city: o.city,
    items: o.items,
    subtotal: o.subtotal,
    shipping: o.shipping,
    cod_fee: o.codFee,
    total: o.total,
    status: o.status,
    date: o.date,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToCoupon(row: any): StoredCoupon {
  return {
    code: row.code,
    type: row.type,
    value: row.value,
    used: row.used,
    limit: row.coupon_limit,
    active: row.active,
    expires: row.expires ?? '',
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToAudit(row: any): AuditEntry {
  const d = row.created_at ? new Date(row.created_at) : new Date();
  return {
    action: row.action,
    entity: row.entity,
    detail: row.detail,
    actor: row.actor,
    date: d.toLocaleString('en-PK', { dateStyle: 'medium', timeStyle: 'short' }),
  };
}

/* ── Server-side order placement (H1 + M2 fix) ──────────────────── */

export interface PlaceOrderResult {
  subtotal: number;
  shipping: number;
  cod_fee: number;
  discount: number;
  total: number;
  items: { name: string; qty: number; price: number }[];
}

export async function dbPlaceOrder(params: {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  date: string;
  item_refs: { id: string; qty: number }[];
  coupon_code?: string | null;
}): Promise<PlaceOrderResult> {
  const { data, error } = await supabase.rpc('place_order', {
    p_id:          params.id,
    p_name:        params.name,
    p_phone:       params.phone,
    p_email:       params.email,
    p_address:     params.address,
    p_city:        params.city,
    p_date:        params.date,
    p_item_refs:   params.item_refs,
    p_coupon_code: params.coupon_code ?? null,
  });
  if (error) throw new Error(error.message);
  return data as PlaceOrderResult;
}

/* ── Orders ──────────────────────────────────────────────────────── */

export async function dbGetOrders(): Promise<StoredOrder[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) { if (import.meta.env.DEV) console.error('dbGetOrders:', error); return []; }
  return (data ?? []).map(rowToOrder);
}

export async function dbSaveOrder(order: StoredOrder): Promise<void> {
  const { error } = await supabase.from('orders').insert(orderToRow(order));
  if (error) throw new Error(error.message);
}

export async function dbUpdateOrderStatus(id: string, status: StoredOrder['status']): Promise<void> {
  const { error } = await supabase.from('orders').update({ status }).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function dbDeleteOrder(id: string): Promise<void> {
  const { error } = await supabase.from('orders').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function dbClearOrders(): Promise<void> {
  const { error } = await supabase.from('orders').delete().not('id', 'is', null);
  if (error) throw new Error(error.message);
}

/* ── Coupons ─────────────────────────────────────────────────────── */

export async function dbGetCoupons(): Promise<StoredCoupon[]> {
  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) { if (import.meta.env.DEV) console.error('dbGetCoupons:', error); return []; }
  return (data ?? []).map(rowToCoupon);
}

export async function dbSaveCoupon(c: Omit<StoredCoupon, 'used'>): Promise<void> {
  const { error } = await supabase.from('coupons').insert({
    code: c.code,
    type: c.type,
    value: c.value,
    coupon_limit: c.limit,
    active: c.active,
    expires: c.expires || null,
    used: 0,
  });
  if (error) throw new Error(error.message);
}

export async function dbUpdateCoupon(code: string, updates: Partial<StoredCoupon>): Promise<void> {
  // Map camelCase fields to DB snake_case
  const row: Record<string, unknown> = {};
  if (updates.active !== undefined) row.active = updates.active;
  if (updates.limit !== undefined) row.coupon_limit = updates.limit;
  if (updates.value !== undefined) row.value = updates.value;
  if (updates.type !== undefined) row.type = updates.type;
  if (updates.expires !== undefined) row.expires = updates.expires || null;
  if (updates.used !== undefined) row.used = updates.used;
  const { error } = await supabase.from('coupons').update(row).eq('code', code);
  if (error) throw new Error(error.message);
}

export async function dbDeleteCoupon(code: string): Promise<void> {
  const { error } = await supabase.from('coupons').delete().eq('code', code);
  if (error) throw new Error(error.message);
}

export async function dbClearCoupons(): Promise<void> {
  const { error } = await supabase.from('coupons').delete().not('id', 'is', null);
  if (error) throw new Error(error.message);
}

/* ── Coupon RPC — used by checkout (works without admin auth) ───── */

/** Validates a coupon server-side; returns the coupon or null. */
export async function dbValidateCoupon(code: string): Promise<StoredCoupon | null> {
  const { data, error } = await supabase.rpc('validate_coupon', { p_code: code });
  if (error || !data?.length) return null;
  return rowToCoupon(data[0]);
}

/** Atomically increments a coupon's usage counter server-side. */
export async function dbUseCoupon(code: string): Promise<void> {
  const { error } = await supabase.rpc('use_coupon', { p_code: code });
  if (error) throw new Error(error.message);
}

/* ── Audit log ───────────────────────────────────────────────────── */

export async function dbGetAuditLog(): Promise<AuditEntry[]> {
  const { data, error } = await supabase
    .from('audit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) { if (import.meta.env.DEV) console.error('dbGetAuditLog:', error); return []; }
  return (data ?? []).map(rowToAudit);
}

export async function dbAddAuditEntry(entry: { action: AuditEntry['action']; entity: string; detail: string; actor: string }): Promise<void> {
  const { error } = await supabase.from('audit_log').insert(entry);
  if (error && import.meta.env.DEV) console.error('dbAddAuditEntry:', error);
}

export async function dbClearAuditLog(): Promise<void> {
  const { error } = await supabase.from('audit_log').delete().not('id', 'is', null);
  if (error) throw new Error(error.message);
}
