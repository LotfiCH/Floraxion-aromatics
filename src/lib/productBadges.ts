import type { ProductBadge } from '../types';

/** Accept only deliberately assigned merchandising badges. Sales claims are excluded. */
export function getProductBadge(value: unknown): ProductBadge | null {
  return value === 'new' || value === 'best_seller' || value === 'popular' ? value : null;
}
