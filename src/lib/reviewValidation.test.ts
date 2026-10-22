import test from 'node:test';
import assert from 'node:assert/strict';
import { validateReviewDraft } from './reviewValidation.ts';

test('review validation accepts an integer rating and non-empty review body', () => {
  assert.deepEqual(validateReviewDraft({ rating: 5, title: 'Excellent', body: 'Très bonne qualité.' }), []);
});

test('review validation rejects missing, non-integer, and out-of-range ratings', () => {
  for (const rating of [null, 0, 6, 3.5]) {
    assert.ok(validateReviewDraft({ rating, title: '', body: 'Avis.' }).includes('rating'));
  }
});

test('review validation rejects blank bodies and overlong content', () => {
  assert.ok(validateReviewDraft({ rating: 4, title: '', body: '   ' }).includes('body'));
  assert.ok(validateReviewDraft({ rating: 4, title: 'x'.repeat(121), body: 'Avis.' }).includes('title_too_long'));
  assert.ok(validateReviewDraft({ rating: 4, title: '', body: 'x'.repeat(3001) }).includes('body_too_long'));
});
