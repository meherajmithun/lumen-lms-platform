export function discountedPrice(price: number, discountPercent: number) {
  const safePrice = Math.max(0, Number(price) || 0);
  const safeDiscount = Math.min(100, Math.max(0, Number(discountPercent) || 0));
  return Math.round((safePrice * (1 - safeDiscount / 100) + Number.EPSILON) * 100) / 100;
}

export function formatCoursePrice(price: number) {
  return price <= 0
    ? 'Free'
    : new Intl.NumberFormat('en-BD', {
        style: 'currency',
        currency: 'BDT',
        maximumFractionDigits: Number.isInteger(price) ? 0 : 2,
      }).format(price);
}

export function formatCourseDuration(totalMinutes: number) {
  if (totalMinutes <= 0) return 'Self-paced';
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours} hr`;
  return `${hours} hr ${minutes} min`;
}
