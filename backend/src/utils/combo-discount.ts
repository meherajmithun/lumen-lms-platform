export type ComboTier = { courseCount: number; discountAmount: number };

export const DEFAULT_COMBO_TIERS: ComboTier[] = [
  { courseCount: 2, discountAmount: 500 },
  { courseCount: 3, discountAmount: 1000 },
];

export function normalizeComboTiers(value: unknown): ComboTier[] {
  if (!Array.isArray(value)) return [];
  const byCount = new Map<number, number>();
  for (const item of value) {
    if (!item || typeof item !== 'object') continue;
    const tier = item as Record<string, unknown>;
    const courseCount = Number(tier.courseCount);
    const discountAmount = Number(tier.discountAmount);
    if (!Number.isInteger(courseCount) || courseCount < 2 || courseCount > 100) continue;
    if (!Number.isFinite(discountAmount) || discountAmount < 0) continue;
    byCount.set(courseCount, Math.round(discountAmount * 100) / 100);
  }
  return [...byCount].map(([courseCount, discountAmount]) => ({ courseCount, discountAmount }))
    .sort((a, b) => a.courseCount - b.courseCount);
}

export function comboDiscountFor(courseCount: number, tiers: ComboTier[]): number {
  return tiers.reduce(
    (best, tier) => courseCount >= tier.courseCount ? Math.max(best, tier.discountAmount) : best,
    0
  );
}
