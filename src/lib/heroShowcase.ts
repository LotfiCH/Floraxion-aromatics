import type { Product } from '../types/index.ts';

/**
 * Curated homepage selection. Edit this list to change the products shown in
 * the hero; only published documents returned by the shared Firestore product
 * subscription are displayed. These IDs were verified in that catalogue.
 */
export const HERO_SHOWCASE_PRODUCT_IDS = [
  'prod-he-01', // Rosemary: existing transparent custom PNG
  'prod-he-02', // Lavender
  'prod-he-03', // Eucalyptus
  'prod-hv-02', // Argan oil
  'prod-hy-01', // Damask rose hydrolat
] as const;

export const HERO_SHOWCASE_INTERVAL_MS = 4500;

export interface HeroImageLoadResult {
  source: string;
  state: 'loaded' | 'error';
}

export function getHeroImageRenderState(
  source: string | undefined,
  result: HeroImageLoadResult | null,
): 'loading' | 'loaded' | 'error' {
  if (!source) return 'loaded';
  return result?.source === source ? result.state : 'loading';
}

export function shouldAutoplayHeroShowcase(options: {
  itemCount: number;
  isInteracting: boolean;
  isPageVisible: boolean;
  prefersReducedMotion: boolean;
}): boolean {
  return options.itemCount > 1
    && !options.isInteracting
    && options.isPageVisible
    && !options.prefersReducedMotion;
}

export function selectHeroShowcaseProducts(
  products: readonly Product[],
  configuredIds: readonly string[] = HERO_SHOWCASE_PRODUCT_IDS,
): Product[] {
  const publishedById = new Map(
    products
      .filter((product) => product.status === 'published')
      .map((product) => [product.id, product]),
  );
  const seen = new Set<string>();

  return configuredIds.flatMap((id) => {
    if (seen.has(id)) return [];
    seen.add(id);
    const product = publishedById.get(id);
    return product ? [product] : [];
  });
}

export function wrapHeroShowcaseIndex(
  index: number,
  itemCount: number,
  direction: -1 | 1 = 1,
): number {
  if (!Number.isFinite(index) || itemCount <= 0) return 0;
  return ((Math.trunc(index) + direction) % itemCount + itemCount) % itemCount;
}
