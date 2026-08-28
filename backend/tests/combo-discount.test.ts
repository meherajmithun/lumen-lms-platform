import { describe, expect, it } from 'vitest';
import { comboDiscountFor, normalizeComboTiers } from '../src/utils/combo-discount';

describe('combo discounts', () => {
  const tiers = normalizeComboTiers([
    { courseCount: 3, discountAmount: 2500 },
    { courseCount: 2, discountAmount: 1000 },
  ]);

  it('uses the highest eligible tier', () => {
    expect(comboDiscountFor(1, tiers)).toBe(0);
    expect(comboDiscountFor(2, tiers)).toBe(1000);
    expect(comboDiscountFor(3, tiers)).toBe(2500);
    expect(comboDiscountFor(5, tiers)).toBe(2500);
  });

  it('drops invalid tiers and sorts valid tiers', () => {
    expect(normalizeComboTiers([{ courseCount: 1, discountAmount: 50 }, { courseCount: 2, discountAmount: 1000 }]))
      .toEqual([{ courseCount: 2, discountAmount: 1000 }]);
  });
});
