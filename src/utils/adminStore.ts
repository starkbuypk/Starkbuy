const KEY_NA_IDS = 'sb_na_ids';

export function getNewArrivalOverrides(): string[] | null {
  try {
    const v = localStorage.getItem(KEY_NA_IDS);
    return v !== null ? JSON.parse(v) : null;
  } catch { return null; }
}

export function setNewArrivalOverrides(ids: string[]): void {
  localStorage.setItem(KEY_NA_IDS, JSON.stringify(ids));
}

export interface CategoryConfig {
  label: string;
  to: string;
  img: string;
  enabled: boolean;
}

export const DEFAULT_CATEGORIES: CategoryConfig[] = [
  { label: 'Analog', to: '/collections/analog', img: 'https://images.unsplash.com/photo-1612817288484-6f916006741a?w=400&q=75', enabled: true },
  { label: 'Chronograph', to: '/collections/chronograph', img: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=400&q=75', enabled: true },
  { label: 'Sports', to: '/collections/sports', img: 'https://images.unsplash.com/photo-1539874754764-5a96559165b0?w=400&q=75', enabled: true },
  { label: 'A+ Replica', to: '/collections/replica', img: 'https://images.unsplash.com/photo-1600003014755-ba31aa59c4b6?w=400&q=75', enabled: true },
  { label: 'Automatic', to: '/collections/automatic', img: 'https://images.unsplash.com/photo-1582150264904-e0bea5ef0ad1?w=400&q=75', enabled: true },
];

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
  story: 'StarkBuy was founded in Rawalpindi with a single conviction: that exceptional timepieces shouldn\'t require an exceptional income. We source precision-engineered watches from verified manufacturers and bring them to Pakistani doorsteps — with the confidence of cash on delivery and the efficiency of a team that actually answers your messages.',
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
    const v = localStorage.getItem('sb_about_v1');
    return v ? { ...DEFAULT_ABOUT, ...JSON.parse(v) } : DEFAULT_ABOUT;
  } catch { return DEFAULT_ABOUT; }
}

export function saveAbout(data: AboutContent): void {
  localStorage.setItem('sb_about_v1', JSON.stringify(data));
}

export interface Testimonial {
  name: string;
  city: string;
  text: string;
  rating: number;
  watch: string;
}

export const DEFAULT_TESTIMONIALS: Testimonial[] = [];

export interface BusinessHours {
  days: string;
  hours: string;
}

export const DEFAULT_BUSINESS_HOURS: BusinessHours[] = [
  { days: 'Mon – Sat', hours: '10:00 AM – 10:00 PM' },
  { days: 'Sunday', hours: '12:00 PM – 8:00 PM' },
];

const KEY_FREE_SHIPPING = 'sb_free_shipping_threshold';
const DEFAULT_FREE_SHIPPING = 5000;

export function getFreeShippingThreshold(): number {
  try {
    const v = localStorage.getItem(KEY_FREE_SHIPPING);
    return v !== null ? Number(v) : DEFAULT_FREE_SHIPPING;
  } catch { return DEFAULT_FREE_SHIPPING; }
}

export function saveFreeShippingThreshold(amount: number): void {
  localStorage.setItem(KEY_FREE_SHIPPING, String(amount));
}

const KEY_SHIPPING_COST = 'sb_shipping_cost';
const DEFAULT_SHIPPING_COST = 200;

export function getShippingCost(): number {
  try {
    const v = localStorage.getItem(KEY_SHIPPING_COST);
    return v !== null ? Number(v) : DEFAULT_SHIPPING_COST;
  } catch { return DEFAULT_SHIPPING_COST; }
}

export function saveShippingCost(cost: number): void {
  localStorage.setItem(KEY_SHIPPING_COST, String(cost));
}
