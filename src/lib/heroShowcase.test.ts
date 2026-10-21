import assert from 'node:assert/strict';
import test from 'node:test';
import type { Product } from '../types/index.ts';
import {
  HERO_SHOWCASE_PRODUCT_IDS,
  HERO_SHOWCASE_INTERVAL_MS,
  getHeroImageRenderState,
  selectHeroShowcaseProducts,
  shouldAutoplayHeroShowcase,
  wrapHeroShowcaseIndex,
} from './heroShowcase.ts';

function product(id: string, status: Product['status'] = 'published'): Product {
  return { id, status } as Product;
}

test('homepage showcase selection is a unique, configurable set of five catalogue IDs', () => {
  assert.equal(HERO_SHOWCASE_PRODUCT_IDS.length, 5);
  assert.equal(new Set(HERO_SHOWCASE_PRODUCT_IDS).size, 5);
});

test('showcase follows configured order, uses published Firestore products, and skips missing or draft IDs', () => {
  const selected = selectHeroShowcaseProducts(
    [product('second'), product('first'), product('draft', 'draft')],
    ['first', 'missing', 'draft', 'second', 'first'],
  );

  assert.deepEqual(selected.map(({ id }) => id), ['first', 'second']);
});

test('showcase navigation loops in both directions and handles an empty selection', () => {
  assert.equal(wrapHeroShowcaseIndex(4, 5, 1), 0);
  assert.equal(wrapHeroShowcaseIndex(0, 5, -1), 4);
  assert.equal(wrapHeroShowcaseIndex(1, 0, 1), 0);
});

test('autoplay uses a calm 4.5 second interval and stops for interaction, hidden pages, or reduced motion', () => {
  assert.equal(HERO_SHOWCASE_INTERVAL_MS, 4500);
  const active = {
    itemCount: 5,
    isInteracting: false,
    isPageVisible: true,
    prefersReducedMotion: false,
  };

  assert.equal(shouldAutoplayHeroShowcase(active), true);
  assert.equal(shouldAutoplayHeroShowcase({ ...active, isInteracting: true }), false);
  assert.equal(shouldAutoplayHeroShowcase({ ...active, isPageVisible: false }), false);
  assert.equal(shouldAutoplayHeroShowcase({ ...active, prefersReducedMotion: true }), false);
  assert.equal(shouldAutoplayHeroShowcase({ ...active, itemCount: 1 }), false);
});

test('hero image load state is tied to the current source without an effect reset race', () => {
  const firstSource = 'data:image/png;base64,first';
  const secondSource = 'data:image/jpeg;base64,second';

  assert.equal(getHeroImageRenderState(firstSource, null), 'loading');
  assert.equal(getHeroImageRenderState(firstSource, { source: firstSource, state: 'loaded' }), 'loaded');
  assert.equal(getHeroImageRenderState(secondSource, { source: firstSource, state: 'loaded' }), 'loading');
  assert.equal(getHeroImageRenderState(secondSource, { source: secondSource, state: 'error' }), 'error');
  assert.equal(getHeroImageRenderState(undefined, null), 'loaded');
});
