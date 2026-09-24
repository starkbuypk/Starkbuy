export type WatchCategory = 'Analog' | 'Chronograph' | 'Smart' | 'Luxury' | 'Sports' | 'Sale' | 'A+ Replica' | 'Automatic';
export type WatchGender = 'Men' | 'Women' | 'Unisex';
export type CaseSize = '36mm' | '38mm' | '40mm' | '42mm' | '44mm' | '46mm';
export type Strap = 'Leather' | 'Steel Bracelet' | 'Silicone' | 'Mesh';

export interface Product {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: WatchCategory;
  gender: WatchGender;
  caseSizeOptions: CaseSize[];
  strapOptions: Strap[];
  codPrice: number;
  discountPercent: number;
  image: string;
  hoverImage?: string;
  gallery: string[];
  video?: string;
  inStock: boolean;
  stock: Record<string, number>;
  newArrival: boolean;
  featured: boolean;
  flashSale: boolean;
  limited: boolean;
  rating: number;
  reviewCount: number;
  unitsSold: number;
  description: string;
  movement: string;
  caseMaterial: string;
  waterResistance: string;
}

export const products: Product[] = [];

export const featuredProducts = products.filter(p => p.featured);
export const newArrivals = products.filter(p => p.newArrival);
export const flashSaleProducts = products.filter(p => p.flashSale);

export function getProductBySlug(slug: string): Product | undefined {
  return products.find(p => p.slug === slug);
}

export function formatPrice(pkr: number): string {
  return `Rs. ${pkr.toLocaleString('en-PK')}`;
}

export function prepaidPrice(codPrice: number, discountPercent: number = 10): number {
  return Math.round(codPrice * (1 - discountPercent / 100));
}
