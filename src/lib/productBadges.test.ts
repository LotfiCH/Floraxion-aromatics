import test from 'node:test';
import assert from 'node:assert/strict';
import { getProductBadge } from './productBadges.ts';

test('product badges are shown only when explicitly assigned', () => {
  assert.equal(getProductBadge('new'), 'new');
  assert.equal(getProductBadge('best_seller'), 'best_seller');
  assert.equal(getProductBadge('popular'), 'popular');
  assert.equal(getProductBadge(undefined), null);
  assert.equal(getProductBadge('featured'), null);
});
