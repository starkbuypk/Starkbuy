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
  video?: string;
  enabled: boolean;
}

export const DEFAULT_SLIDES: HeroSlide[] = [
  {
    id: 'slide-1',
    eyebrow: 'Pakistan\'s Watch Store',
    title: 'Precision on\nYour Wrist',
    sub: 'Premium timepieces — cash on delivery, doorstep across Pakistan.',
    ctaLabel: 'Shop Now',
    ctaTo: '/collections',
    cta2Label: 'Track Order',
    cta2To: '/track-order',
    image: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=1600&q=80',
    enabled: true,
  },
  {
    id: 'slide-2',
    eyebrow: 'New Arrivals',
    title: 'Wear Time\nDifferently',
    sub: 'Curated chronographs and luxury automatics — inspected before every shipment.',
    ctaLabel: 'New Arrivals',
    ctaTo: '/collections',
    cta2Label: 'Our Story',
    cta2To: '/about',
    image: 'https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=1600&q=80',
    enabled: true,
  },
];
