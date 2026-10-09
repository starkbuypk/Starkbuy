import { useState, useEffect } from 'react';
import type { Product } from '../data/products';
import { DEFAULT_SLIDES, type HeroSlide } from '../data/slides';
import {
  type CategoryConfig,
  DEFAULT_CATEGORIES,
  type Testimonial,
  DEFAULT_TESTIMONIALS,
  type BusinessHours,
  DEFAULT_BUSINESS_HOURS,
} from '../utils/adminStore';
import { dbGetProducts, dbGetConfig, dbGetReviewStats } from '../utils/supabaseStore';

// Custom events dispatched by Admin.tsx after any save
export const EV_PRODUCTS   = 'sb-products-updated';
export const EV_SLIDES     = 'sb-slides-updated';
export const EV_CATEGORIES = 'sb-categories-updated';

export function useAllProducts(): Product[] {
  const [products, setProducts] = useState<Product[]>([]);

  async function refresh(force = false) {
    const list = await dbGetProducts(force);
    setProducts(list);
  }

  useEffect(() => {
    refresh();
    const handleRefresh = () => refresh(true);
    window.addEventListener(EV_PRODUCTS, handleRefresh);
    return () => window.removeEventListener(EV_PRODUCTS, handleRefresh);
  }, []);

  return products;
}

export function useSlides(): HeroSlide[] | null {
  const [slides, setSlides] = useState<HeroSlide[] | null>(null);

  async function refresh(force = false) {
    const fromDb = await dbGetConfig<HeroSlide[]>('slides', force);
    const list = fromDb ?? DEFAULT_SLIDES;
    setSlides(list.filter(s => s.enabled));
  }

  useEffect(() => {
    refresh();
    const handleRefresh = () => refresh(true);
    window.addEventListener(EV_SLIDES, handleRefresh);
    return () => window.removeEventListener(EV_SLIDES, handleRefresh);
  }, []);

  return slides;
}

export function useCategories(): CategoryConfig[] | null {
  const [cats, setCats] = useState<CategoryConfig[] | null>(null);

  async function refresh(force = false) {
    const fromDb = await dbGetConfig<CategoryConfig[]>('categories', force);
    const list = fromDb ?? DEFAULT_CATEGORIES;
    setCats(list.filter(c => c.enabled));
  }

  useEffect(() => {
    refresh();
    const handleRefresh = () => refresh(true);
    window.addEventListener(EV_CATEGORIES, handleRefresh);
    return () => window.removeEventListener(EV_CATEGORIES, handleRefresh);
  }, []);

  return cats;
}

export function useNewArrivals(allProducts: Product[]): Product[] {
  return allProducts.filter(p => p.newArrival);
}

export const EV_SHIPPING = 'sb-shipping-updated';

export function useShippingConfig() {
  const [threshold, setThreshold] = useState<number | null>(null);
  const [cost, setCost] = useState<number | null>(null);

  async function refresh(force = false) {
    const data = await dbGetConfig<{ threshold: number; cost: number }>('shipping', force);
    setThreshold(data?.threshold ?? 5000);
    setCost(data?.cost ?? 200);
  }

  useEffect(() => {
    refresh();
    const handleRefresh = () => refresh(true);
    window.addEventListener(EV_SHIPPING, handleRefresh);
    return () => window.removeEventListener(EV_SHIPPING, handleRefresh);
  }, []);

  return { threshold: threshold ?? 5000, cost: cost ?? 200, loaded: threshold !== null };
}

export const EV_TESTIMONIALS = 'sb-testimonials-updated';
export const EV_HOURS = 'sb-hours-updated';
export const EV_REVIEWS = 'sb-reviews-updated';

export function useReviewStats(): Record<string, { count: number; avg: number }> {
  const [stats, setStats] = useState<Record<string, { count: number; avg: number }>>({});
  async function refresh(force = false) {
    const data = await dbGetReviewStats(force);
    setStats(data);
  }
  useEffect(() => {
    refresh();
    const handleRefresh = () => refresh(true);
    window.addEventListener(EV_REVIEWS, handleRefresh);
    return () => window.removeEventListener(EV_REVIEWS, handleRefresh);
  }, []);
  return stats;
}

export function useTestimonials(): Testimonial[] | null {
  const [items, setItems] = useState<Testimonial[] | null>(null);
  async function refresh(force = false) {
    const data = await dbGetConfig<Testimonial[]>('testimonials', force);
    setItems(data ?? DEFAULT_TESTIMONIALS);
  }
  useEffect(() => {
    refresh();
    const handleRefresh = () => refresh(true);
    window.addEventListener(EV_TESTIMONIALS, handleRefresh);
    return () => window.removeEventListener(EV_TESTIMONIALS, handleRefresh);
  }, []);
  return items;
}

export function useBusinessHours(): BusinessHours[] | null {
  const [items, setItems] = useState<BusinessHours[] | null>(null);
  async function refresh(force = false) {
    const data = await dbGetConfig<BusinessHours[]>('business_hours', force);
    setItems(data ?? DEFAULT_BUSINESS_HOURS);
  }
  useEffect(() => {
    refresh();
    const handleRefresh = () => refresh(true);
    window.addEventListener(EV_HOURS, handleRefresh);
    return () => window.removeEventListener(EV_HOURS, handleRefresh);
  }, []);
  return items;
}
