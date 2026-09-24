import { useState, useEffect } from 'react';
import type { Product } from '../data/products';
import { getSlides } from '../data/slides';
import type { HeroSlide } from '../data/slides';
import {
  type CategoryConfig,
  DEFAULT_CATEGORIES,
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
  const [slides, setSlides] = useState<HeroSlide[]>(() =>
    getSlides().filter(s => s.enabled)
  );

  function refresh() {
    setSlides(getSlides().filter(s => s.enabled));
  }

  useEffect(() => {
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
