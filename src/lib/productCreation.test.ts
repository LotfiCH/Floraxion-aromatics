import test from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL_PRODUCTS } from '../data/catalogue.ts';
import {
  createNewProductDraft,
  createNewProductIdentity,
  createUniqueProductSlug,
  createVariantSku,
  validateNewProductDraft,
} from './productCreation.ts';

test('new product identity follows the existing family IDs and SKU sequences', () => {
  assert.deepEqual(createNewProductIdentity(INITIAL_PRODUCTS, 'essential-oils'), {
    id: 'prod-he-29',
    sku: 'FLX-HE-029',
  });
  assert.deepEqual(createNewProductIdentity(INITIAL_PRODUCTS, 'olive-oils'), {
    id: 'prod-ol-11',
    sku: 'FLX-OL-011',
  });
});
test('new product draft starts in a safe unpublished state with one quote-only variant', () => {
  const draft = createNewProductDraft(INITIAL_PRODUCTS, new Date('2026-01-01T00:00:00.000Z'));

  assert.equal(draft.id, 'prod-he-29');
  assert.equal(draft.sku, 'FLX-HE-029');
  assert.equal(draft.status, 'draft');
  assert.equal(draft.isFeatured, false);
  assert.equal(draft.translations.fr.name, '');
  assert.equal(draft.translations.ar.name, '');
  assert.equal(draft.variants.length, 1);
  assert.equal(draft.variants[0].priceDZD, null);
  assert.equal(draft.variants[0].stockQuantity, 0);
  assert.equal(draft.variants[0].isPurchasableOnline, false);
});

test('variant SKUs derive from packaging size and avoid duplicates', () => {
  assert.equal(createVariantSku('FLX-HE-029', 10, 'ml'), 'FLX-HE-029-10ML');
  assert.equal(createVariantSku('FLX-HE-029', 10, 'ml', ['FLX-HE-029-10ML']), 'FLX-HE-029-10ML-2');
});

test('new product validation requires identity, bilingual names and valid packaging/pricing', () => {
  const draft = createNewProductDraft(INITIAL_PRODUCTS);
  assert.ok(validateNewProductDraft(draft, INITIAL_PRODUCTS).some((error) => error.message.includes('nom français')));
  assert.ok(validateNewProductDraft(draft, INITIAL_PRODUCTS).some((error) => error.message.includes('conditionnement')));

  draft.translations.fr.name = 'Nouvelle essence';
  draft.translations.ar.name = 'خلاصة جديدة';
  draft.variants[0].packagingLabel = { fr: 'Flacon 10 ml', ar: 'قارورة 10 مل' };
  assert.deepEqual(validateNewProductDraft(draft, INITIAL_PRODUCTS), []);
});

test('validation rejects duplicate product IDs and product or variant SKUs', () => {
  const draft = createNewProductDraft(INITIAL_PRODUCTS);
  draft.translations.fr.name = 'Nouvelle essence';
  draft.translations.ar.name = 'خلاصة جديدة';
  draft.variants[0].packagingLabel = { fr: 'Flacon 10 ml', ar: 'قارورة 10 مل' };
  draft.id = INITIAL_PRODUCTS[0].id;
  draft.sku = INITIAL_PRODUCTS[0].sku;
  draft.variants[0].productId = draft.id;
  draft.variants[0].id = `${draft.id}-new-variant`;
  draft.variants[0].sku = INITIAL_PRODUCTS[0].variants[0].sku;

  const messages = validateNewProductDraft(draft, INITIAL_PRODUCTS).map((error) => error.message);
  assert.ok(messages.some((message) => message.includes('existe déjà')));
  assert.ok(messages.some((message) => message.includes('déjà utilisé')));
});

test('quote-only variants may have no price, but online variants need price and stock', () => {
  const draft = createNewProductDraft(INITIAL_PRODUCTS);
  draft.translations.fr.name = 'Nouvelle essence';
  draft.translations.ar.name = 'خلاصة جديدة';
  draft.variants[0].packagingLabel = { fr: 'Flacon 10 ml', ar: 'قارورة 10 مل' };
  assert.deepEqual(validateNewProductDraft(draft, INITIAL_PRODUCTS), []);

  draft.variants[0].isPurchasableOnline = true;
  const messages = validateNewProductDraft(draft, INITIAL_PRODUCTS).map((error) => error.message);
  assert.ok(messages.some((message) => message.includes('indiquez un prix')));
  assert.ok(messages.some((message) => message.includes('stock suivi à zéro')));
});

test('new product slug is normalized and made unique', () => {
  assert.equal(createUniqueProductSlug('Huile d’Orange Douce', 'prod-he-29', []), 'huile-d-orange-douce');
  assert.equal(createUniqueProductSlug('Huile d’Orange Douce', 'prod-he-29', [
    { ...INITIAL_PRODUCTS[0], slug: 'huile-d-orange-douce' },
  ]), 'huile-d-orange-douce-prod-he-29');
});

test('a new product can be completed, edited, published and retained through a serialized snapshot round-trip', () => {
  const originalCatalogue = JSON.stringify(INITIAL_PRODUCTS);
  const draft = createNewProductDraft(INITIAL_PRODUCTS);
  draft.translations.fr.name = 'Huile Essentielle de Test';
  draft.translations.ar.name = 'زيت تجريبي';
  draft.origin = 'Algérie';
  draft.translations.fr.description = 'Description de test';
  draft.variants[0].packagingLabel = { fr: 'Flacon 10 ml', ar: 'قارورة 10 مل' };
  draft.variants[0].priceDZD = 1500;
  draft.variants[0].stockQuantity = 8;
  draft.variants[0].isPurchasableOnline = true;
  assert.deepEqual(validateNewProductDraft(draft, INITIAL_PRODUCTS), []);

  const created = JSON.parse(JSON.stringify({ ...draft, status: 'published' })) as typeof draft;
  const refreshedProducts = [...INITIAL_PRODUCTS, { ...created, id: created.id }];
  const refreshedProduct = refreshedProducts.find((product) => product.id === draft.id);
  assert.equal(refreshedProduct?.status, 'published');
  assert.equal(refreshedProduct?.translations.fr.name, 'Huile Essentielle de Test');
  assert.equal(refreshedProduct?.variants[0].priceDZD, 1500);

  const editedProduct = {
    ...refreshedProduct!,
    variants: refreshedProduct!.variants.map((variant) => ({ ...variant, priceDZD: 1700 })),
  };
  assert.equal(editedProduct.id, draft.id);
  assert.equal(editedProduct.variants[0].priceDZD, 1700);
  assert.equal(JSON.stringify(INITIAL_PRODUCTS), originalCatalogue);
});
