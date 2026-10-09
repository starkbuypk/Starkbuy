import type { Product } from '../data/products';

export interface DiscountCoupon {
  type: 'Percentage' | 'Fixed';
  value: number;
}

export function getProductPrice(product: Pick<Product, 'codPrice' | 'discountPercent'>): number {
  const discount = Math.min(100, Math.max(0, product.discountPercent));
  return Math.max(0, Math.round(product.codPrice * (1 - discount / 100)));
}

export function calculateCouponDiscount(coupon: DiscountCoupon | null, subtotal: number): number {
  const safeSubtotal = Math.max(0, subtotal);
  if (!coupon || coupon.value <= 0) return 0;
  const discount = coupon.type === 'Percentage'
    ? Math.round(safeSubtotal * Math.min(100, coupon.value) / 100)
    : coupon.value;
  return Math.min(safeSubtotal, discount);
}

export function calculateCheckoutTotals({
  subtotal,
  freeShippingThreshold,
  shippingCost,
  coupon = null,
}: {
  subtotal: number;
  freeShippingThreshold: number;
  shippingCost: number;
  coupon?: DiscountCoupon | null;
}) {
  const safeSubtotal = Math.max(0, subtotal);
  const discount = calculateCouponDiscount(coupon, safeSubtotal);
  const shipping = safeSubtotal >= Math.max(0, freeShippingThreshold)
    ? 0
    : Math.max(0, shippingCost);

  return {
    subtotal: safeSubtotal,
    discount,
    shipping,
    total: Math.max(0, safeSubtotal - discount + shipping),
  };
}
