import { describe, expect, it } from 'vitest';
import {
  calculateCheckoutTotals,
  calculateCouponDiscount,
  getProductPrice,
} from '../../src/utils/pricing';

describe('pricing', () => {
  it('uses the same rounded discounted unit price as cart displays', () => {
    expect(getProductPrice({ codPrice: 9_999, discountPercent: 15 })).toBe(8_499);
    expect(getProductPrice({ codPrice: 9_999, discountPercent: 0 })).toBe(9_999);
  });

  it('caps percentage and fixed coupons at the subtotal', () => {
    expect(calculateCouponDiscount({ type: 'Percentage', value: 10 }, 5_555)).toBe(556);
    expect(calculateCouponDiscount({ type: 'Percentage', value: 200 }, 1_000)).toBe(1_000);
    expect(calculateCouponDiscount({ type: 'Fixed', value: 2_000 }, 1_000)).toBe(1_000);
  });

  it('calculates paid shipping below the threshold', () => {
    expect(calculateCheckoutTotals({
      subtotal: 8_000,
      freeShippingThreshold: 10_000,
      shippingCost: 250,
      coupon: { type: 'Fixed', value: 500 },
    })).toEqual({ subtotal: 8_000, discount: 500, shipping: 250, total: 7_750 });
  });

  it('makes shipping free at the exact configured threshold', () => {
    expect(calculateCheckoutTotals({
      subtotal: 10_000,
      freeShippingThreshold: 10_000,
      shippingCost: 250,
    })).toEqual({ subtotal: 10_000, discount: 0, shipping: 0, total: 10_000 });
  });
});
