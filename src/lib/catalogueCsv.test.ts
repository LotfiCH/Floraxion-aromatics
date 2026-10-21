import test from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL_PRODUCTS } from '../data/catalogue.ts';
import { executeCsvImport, planCatalogueCsvImport, serializeCatalogueCsv } from './catalogueCsv.ts';

const sourceProduct = INITIAL_PRODUCTS[0];
const baseHeader = 'Product_ID,Product_SKU,Variant_ID,Variant_SKU,Categorie,Nom_FR,Nom_AR,Nom_Botanique,Origine,Conditionnement,Prix_DZD,Stock,Statut,Produit_Mis_en_Avant,Variante_Active,Achat_En_Ligne,Suivi_Stock';
const csvRow = (overrides: Record<string, string> = {}) => {
  const values: Record<string, string> = {
    Product_ID: 'prod-new-01', Product_SKU: 'NEW-001', Variant_ID: 'new-variant-01', Variant_SKU: 'NEW-001-10ML',
    Categorie: 'essential-oils', Nom_FR: 'Huile, nouvelle', Nom_AR: 'زيت جديد', Nom_Botanique: 'Rosmarinus, test', Origine: 'Algérie',
    Conditionnement: '10 ml', Prix_DZD: '1200', Stock: '4', Statut: 'draft', Produit_Mis_en_Avant: 'false',
    Variante_Active: 'true', Achat_En_Ligne: 'true', Suivi_Stock: 'true', ...overrides,
  };
  return baseHeader + '\n' + Object.values(values).map((value) => `"${value.replace(/"/g, '""')}"`).join(',');
};

test('CSV export has stable IDs and round-trips quoted commas and multilingual names', () => {
  const csv = serializeCatalogueCsv([sourceProduct]);
  const preview = planCatalogueCsvImport(csv, [sourceProduct]);
  assert.equal(preview.errors.length, 0);
  assert.equal(preview.unchanged.length, 1);
  assert.match(csv, /^Product_ID,Product_SKU,Variant_ID,Variant_SKU,/);
  const productWithComma = { ...sourceProduct, translations: { ...sourceProduct.translations, fr: { ...sourceProduct.translations.fr, name: 'Romarin, cinéole' } } };
  const encoded = serializeCatalogueCsv([productWithComma]);
  assert.equal(planCatalogueCsvImport(encoded, [productWithComma]).unchanged.length, 1);
});

test('legacy nine-column CSV updates a uniquely matching variant SKU', () => {
  const variant = sourceProduct.variants[0];
  const csv = `SKU,Categorie,Nom_FR,Nom_AR,Nom_Botanique,Origine,Conditionnement,Prix_DZD,Stock\n${variant.sku},${sourceProduct.categoryId},Romarin,إكليل الجبل,Rosmarinus,Algérie,${variant.sizeValue} ${variant.sizeUnit},1400,12`;
  const preview = planCatalogueCsvImport(csv, [sourceProduct]);
  assert.equal(preview.errors.length, 0);
  assert.equal(preview.updates.length, 1);
  assert.equal(preview.updates[0].product?.variants[0].priceDZD, 1400);
});

test('new product and variant are planned from validated identity and required fields', () => {
  const preview = planCatalogueCsvImport(csvRow(), []);
  assert.equal(preview.errors.length, 0);
  assert.equal(preview.creates.length, 1);
  assert.equal(preview.creates[0].product?.status, 'draft');
  assert.equal(preview.creates[0].product?.variants[0].stockQuantity, 4);
  assert.equal(preview.creates[0].product?.variants[0].isPurchasableOnline, true);
});

test('blank CSV cells preserve existing image, descriptions, documents and variant fields', () => {
  const original = { ...sourceProduct, imageUrl: 'https://images.example/rosemary.jpg', documents: [{ id: 'doc-1', title: { fr: 'Fiche', ar: 'ورقة' }, documentType: 'catalog' as const, fileName: 'fiche.pdf', fileSize: '1MB', isPublic: true }] };
  const variant = original.variants[0];
  const csv = `SKU,Categorie,Nom_FR,Nom_AR,Nom_Botanique,Origine,Conditionnement,Prix_DZD,Stock\n${variant.sku},,,,,,${variant.sizeValue} ${variant.sizeUnit},1500,`;
  const preview = planCatalogueCsvImport(csv, [original]);
  const planned = preview.updates[0].product!;
  assert.equal(planned.imageUrl, original.imageUrl);
  assert.deepEqual(planned.documents, original.documents);
  assert.equal(planned.translations.fr.description, original.translations.fr.description);
  assert.equal(planned.variants[0].stockQuantity, variant.stockQuantity);
  assert.equal(planned.variants[0].priceDZD, 1500);
});

test('duplicate variant SKUs are reported and block the affected products', () => {
  const one = csvRow();
  const repeated = one.split('\n')[1];
  const preview = planCatalogueCsvImport(`${baseHeader}\n${repeated}\n${repeated}`, []);
  assert.equal(preview.duplicates.length, 1);
  assert.equal(preview.creates.length, 0);
});

test('conflicting rows that reuse a product document ID are rejected', () => {
  const first = csvRow().split('\n')[1];
  const second = csvRow({ Product_SKU: 'OTHER-PRODUCT', Variant_SKU: 'OTHER-10ML', Variant_ID: 'other-variant' }).split('\n')[1];
  const preview = planCatalogueCsvImport(`${baseHeader}\n${first}\n${second}`, []);
  assert.equal(preview.creates.length, 0);
  assert.ok(preview.items.some((item) => item.action === 'error'));
  assert.ok(preview.errors.some((error) => error.message.includes('identiques')));
});

test('invalid status, numeric values, size and missing create identifiers are errors', () => {
  const preview = planCatalogueCsvImport(csvRow({ Product_ID: 'bad/id', Product_SKU: '', Statut: 'active', Prix_DZD: '-3', Stock: '1.2', Conditionnement: 'large' }), []);
  assert.ok(preview.errors.length >= 5);
  assert.equal(preview.creates.length, 0);
});

test('quote-only variants cannot be marked for online purchase', () => {
  const preview = planCatalogueCsvImport(csvRow({ Prix_DZD: 'NULL', Achat_En_Ligne: 'true' }), []);
  assert.ok(preview.errors.some((error) => error.message.includes('sans prix')));
  assert.equal(preview.creates.length, 0);
});

test('partial write failures are isolated and reported with product IDs', async () => {
  const preview = planCatalogueCsvImport(`${baseHeader}\n${csvRow().split('\n')[1]}\n${csvRow({ Product_ID: 'prod-new-02', Product_SKU: 'NEW-002', Variant_ID: 'new-variant-02', Variant_SKU: 'NEW-002-10ML' }).split('\n')[1]}`, []);
  const result = await executeCsvImport(preview.items, async (item) => {
    if (item.productId === 'prod-new-02') throw new Error('permission-denied');
  });
  assert.deepEqual(result.created, ['prod-new-01']);
  assert.deepEqual(result.failed, [{ productId: 'prod-new-02', message: 'permission-denied' }]);
});
