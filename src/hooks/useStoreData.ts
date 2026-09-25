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
import { dbGetProducts, dbGetConfig } from '../utils/supabaseStore';

// Custom events dispatched by Admin.tsx after any save
export const EV_PRODUCTS   = 'sb-products-updated';
export const EV_SLIDES     = 'sb-slides-updated';
export const EV_CATEGORIES = 'sb-categories-updated';

export function useAllProducts(): Product[] {
  const [products, setProducts] = useState<Product[]>([]);

  async function refresh() {
    const list = await dbGetProducts();
    setProducts(list);
  }

  useEffect(() => {
    refresh();
    window.addEventListener(EV_PRODUCTS, refresh);
    return () => window.removeEventListener(EV_PRODUCTS, refresh);
  }, []);

  return products;
}

export function useSlides(): HeroSlide[] {
  const [slides, setSlides] = useState<HeroSlide[]>(DEFAULT_SLIDES.filter(s => s.enabled));

  async function refresh() {
    const fromDb = await dbGetConfig<HeroSlide[]>('slides');
    const list = fromDb ?? DEFAULT_SLIDES;
    setSlides(list.filter(s => s.enabled));
  }

  useEffect(() => {
    refresh();
    window.addEventListener(EV_SLIDES, refresh);
    return () => window.removeEventListener(EV_SLIDES, refresh);
  }, []);

  return slides;
}

export function useCategories(): CategoryConfig[] {
  const [cats, setCats] = useState<CategoryConfig[]>(DEFAULT_CATEGORIES.filter(c => c.enabled));

  async function refresh() {
    const fromDb = await dbGetConfig<CategoryConfig[]>('categories');
    const list = fromDb ?? DEFAULT_CATEGORIES;
    setCats(list.filter(c => c.enabled));
  }

  useEffect(() => {
    refresh();
    window.addEventListener(EV_CATEGORIES, refresh);
    return () => window.removeEventListener(EV_CATEGORIES, refresh);
  }, []);

  return cats;
}

export function useNewArrivals(allProducts: Product[]): Product[] {
  return allProducts.filter(p => p.newArrival);
}

export const EV_SHIPPING = 'sb-shipping-updated';

export function useShippingConfig() {
  const [threshold, setThreshold] = useState<number>(5000);
  const [cost, setCost] = useState<number>(200);

  async function refresh() {
    const data = await dbGetConfig<{ threshold: number; cost: number }>('shipping');
    if (data) {
      setThreshold(data.threshold);
      setCost(data.cost);
    }
  }

  useEffect(() => {
    refresh();
    window.addEventListener(EV_SHIPPING, refresh);
    return () => window.removeEventListener(EV_SHIPPING, refresh);
  }, []);

  return { threshold, cost };
}

export const EV_TESTIMONIALS = 'sb-testimonials-updated';
export const EV_HOURS = 'sb-hours-updated';

export function useTestimonials(): Testimonial[] {
  const [items, setItems] = useState<Testimonial[]>(DEFAULT_TESTIMONIALS);
  async function refresh() {
    const data = await dbGetConfig<Testimonial[]>('testimonials');
    setItems(data ?? DEFAULT_TESTIMONIALS);
  }
  useEffect(() => {
    refresh();
    window.addEventListener(EV_TESTIMONIALS, refresh);
    return () => window.removeEventListener(EV_TESTIMONIALS, refresh);
  }, []);
  return items;
}

export function useBusinessHours(): BusinessHours[] {
  const [items, setItems] = useState<BusinessHours[]>(DEFAULT_BUSINESS_HOURS);
  async function refresh() {
    const data = await dbGetConfig<BusinessHours[]>('business_hours');
    setItems(data ?? DEFAULT_BUSINESS_HOURS);
  }
  useEffect(() => {
    refresh();
    window.addEventListener(EV_HOURS, refresh);
    return () => window.removeEventListener(EV_HOURS, refresh);
  }, []);
  return items;
}
