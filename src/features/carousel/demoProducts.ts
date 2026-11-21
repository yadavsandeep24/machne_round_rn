import type { Product } from './ui/ProductCard';

export const DEALS: Product[] = Array.from({ length: 10 }, (_, i) => ({
  id: `deal-${i + 1}`,
  title: `Deal product number ${i + 1} with a long name`,
  priceCents: 999 + i * 250,
  rating: 3.5 + (i % 3) * 0.5,
  badge: i % 3 === 0 ? 'Rollback' : undefined,
}));
