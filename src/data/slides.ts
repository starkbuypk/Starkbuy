export interface HeroSlide {
  id: string;
  eyebrow: string;
  title: string;
  sub: string;
  ctaLabel: string;
  ctaTo: string;
  cta2Label: string;
  cta2To: string;
  image: string;
  enabled: boolean;
}

const DEFAULT_SLIDES: HeroSlide[] = [
  {
    id: 'slide-1',
    eyebrow: 'New Collection',
    title: 'The Art of\nMeasured Time',
    sub: 'Engineered in 316L steel. Worn with intent.',
    ctaLabel: 'Explore Collection',
    ctaTo: '/collections',
    cta2Label: 'Track Order',
    cta2To: '/track-order',
    image: 'https://images.unsplash.com/photo-1579543768549-96d37c1df78f?w=1400&q=80',
    enabled: true,
  },
  {
    id: 'slide-2',
    eyebrow: 'Flash Sale — Up to 20% Off',
    title: 'Precision\nWithout Compromise',
    sub: 'Cash on delivery at your doorstep. No minimum order.',
    ctaLabel: 'Shop the Sale',
    ctaTo: '/collections/sale',
    cta2Label: 'Track Order',
    cta2To: '/track-order',
    image: 'https://images.unsplash.com/photo-1772857455349-29e6e3698d90?w=1400&q=80',
    enabled: true,
  },
  {
    id: 'slide-3',
    eyebrow: 'Luxury Collection',
    title: 'Quiet Luxury,\nEvery Day',
    sub: 'Rose gold, mother-of-pearl, and Italian leather.',
    ctaLabel: 'View Luxury Watches',
    ctaTo: '/collections/luxury',
    cta2Label: 'Track Order',
    cta2To: '/track-order',
    image: 'https://images.unsplash.com/photo-1772949400107-f35fd026ab77?w=1400&q=80',
    enabled: true,
  },
];

const KEY = 'sb_hero_slides';

export function getSlides(): HeroSlide[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as HeroSlide[];
  } catch {}
  return DEFAULT_SLIDES;
}

export function saveSlides(slides: HeroSlide[]): void {
  localStorage.setItem(KEY, JSON.stringify(slides));
}

export function resetSlides(): void {
  localStorage.removeItem(KEY);
}
