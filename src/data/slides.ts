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

export const DEFAULT_SLIDES: HeroSlide[] = [];
