import type { Product } from '../data/products';

const KEY_CUSTOM = 'sb_custom_products';
const KEY_NA_IDS = 'sb_na_ids';

export function getCustomProducts(): Product[] {
  try { return JSON.parse(localStorage.getItem(KEY_CUSTOM) ?? '[]'); } catch { return []; }
}

export function saveCustomProduct(p: Product): void {
  const all = getCustomProducts();
  const idx = all.findIndex(x => x.id === p.id);
  if (idx >= 0) all[idx] = p; else all.push(p);
  try {
    localStorage.setItem(KEY_CUSTOM, JSON.stringify(all));
  } catch {
    throw new Error('localStorage quota exceeded — use image URLs instead of uploading files');
  }
}

export function deleteCustomProduct(id: string): void {
  const filtered = getCustomProducts().filter(p => p.id !== id);
  try {
    localStorage.setItem(KEY_CUSTOM, JSON.stringify(filtered));
  } catch {
    throw new Error('localStorage quota exceeded');
  }
}

export function getNewArrivalOverrides(): string[] | null {
  try {
    const v = localStorage.getItem(KEY_NA_IDS);
    return v !== null ? JSON.parse(v) : null;
  } catch { return null; }
}

export function setNewArrivalOverrides(ids: string[]): void {
  localStorage.setItem(KEY_NA_IDS, JSON.stringify(ids));
}

const KEY_CATS = 'sb_categories_v2';

export interface CategoryConfig {
  label: string;
  to: string;
  img: string;
  enabled: boolean;
}

export const DEFAULT_CATEGORIES: CategoryConfig[] = [
  { label: 'Analog', to: '/collections/analog', img: 'https://images.unsplash.com/photo-1772949400376-5965cc2256ea?w=400&q=80', enabled: true },
  { label: 'Chronograph', to: '/collections/chronograph', img: 'https://images.unsplash.com/photo-1579543768549-96d37c1df78f?w=400&q=80', enabled: true },
  { label: 'Sports', to: '/collections/sports', img: 'https://images.unsplash.com/photo-1782110569431-88bfea6738cd?w=400&q=80', enabled: true },
  { label: 'A+ Replica', to: '/collections/replica', img: 'https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=400&q=80', enabled: true },
  { label: 'Automatic', to: '/collections/automatic', img: 'https://images.unsplash.com/photo-1548171915-e79a380a2a4b?w=400&q=80', enabled: true },
];

export function getCategories(): CategoryConfig[] {
  try {
    const v = localStorage.getItem(KEY_CATS);
    return v ? JSON.parse(v) : DEFAULT_CATEGORIES;
  } catch { return DEFAULT_CATEGORIES; }
}

export function saveCategories(cats: CategoryConfig[]): void {
  localStorage.setItem(KEY_CATS, JSON.stringify(cats));
}

const KEY_ABOUT = 'sb_about_v1';

export interface AboutContent {
  headline: string;
  story: string;
  mission: string;
  foundedYear: string;
  teamNote: string;
  values: { icon: string; title: string; desc: string }[];
}

export const DEFAULT_ABOUT: AboutContent = {
  headline: 'Precision on Your Wrist',
  story: 'StarkBuy was founded in Lahore with a single conviction: that exceptional timepieces shouldn\'t require an exceptional income. We source precision-engineered watches from verified manufacturers and bring them to Pakistani doorsteps — with the confidence of cash on delivery and the efficiency of a team that actually answers your messages.',
  mission: 'Every watch in our catalog passes a quality inspection before it ships. Every order is packed with care. And when something goes wrong, we make it right without bureaucracy.',
  foundedYear: '2022',
  teamNote: 'This is a small team. We know most of our customers by name. We\'d like to keep it that way.',
  values: [
    { icon: '◈', title: 'Quality First', desc: 'Every piece is inspected before it ships.' },
    { icon: '◉', title: 'Honest Pricing', desc: 'No hidden fees. What you see is what you pay.' },
    { icon: '◎', title: 'Real Support', desc: 'We respond on WhatsApp — fast.' },
    { icon: '◍', title: 'Your Trust', desc: 'Cash on delivery means zero risk for you.' },
  ],
};

export function getAbout(): AboutContent {
  try {
    const v = localStorage.getItem(KEY_ABOUT);
    return v ? { ...DEFAULT_ABOUT, ...JSON.parse(v) } : DEFAULT_ABOUT;
  } catch { return DEFAULT_ABOUT; }
}

export function saveAbout(data: AboutContent): void {
  localStorage.setItem(KEY_ABOUT, JSON.stringify(data));
}

// Orders, coupons, and audit log are now stored in Supabase.
// Import from '../utils/supabaseStore' for those operations.

const KEY_COD_FEE = 'sb_cod_fee';
const DEFAULT_COD_FEE = 200;

export function getCodFee(): number {
  try {
    const v = localStorage.getItem(KEY_COD_FEE);
    return v !== null ? Number(v) : DEFAULT_COD_FEE;
  } catch { return DEFAULT_COD_FEE; }
}

export function saveCodFee(fee: number): void {
  localStorage.setItem(KEY_COD_FEE, String(fee));
}
