import type { Product, ProductVariant, CategorySlug } from '../types';

export type CsvImportAction = 'create' | 'update' | 'unchanged' | 'duplicate' | 'error';
export interface CsvImportIssue { row: number; message: string }
export interface CsvImportItem {
  action: CsvImportAction;
  productId: string;
  sku: string;
  rows: number[];
  messages: string[];
  product?: Product;
  baseline?: Product;
}
export interface CsvImportPreview {
  items: CsvImportItem[];
  errors: CsvImportIssue[];
  duplicates: CsvImportItem[];
  creates: CsvImportItem[];
  updates: CsvImportItem[];
  unchanged: CsvImportItem[];
}

type CsvRow = {
  row: number; productId: string; productSku: string; variantId: string; variantSku: string;
  category: string; nameFr: string; nameAr: string; botanicalName: string; origin: string;
  size: string; price: string; stock: string; status: string; featured: string;
  variantActive: string; online: string; trackInventory: string;
};

const CATEGORIES: CategorySlug[] = ['essential-oils', 'vegetable-oils', 'hydrolats', 'olive-oils'];
const STATUSES = ['draft', 'published', 'archived'] as const;
const EXPORT_HEADERS = ['Product_ID', 'Product_SKU', 'Variant_ID', 'Variant_SKU', 'Categorie', 'Nom_FR', 'Nom_AR', 'Nom_Botanique', 'Origine', 'Conditionnement', 'Prix_DZD', 'Stock', 'Statut', 'Produit_Mis_en_Avant', 'Variante_Active', 'Achat_En_Ligne', 'Suivi_Stock'];

function normalizeHeader(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function parseMatrix(text: string): string[][] {
  const source = text.replace(/^\uFEFF/, '');
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    if (quoted) {
      if (char === '"' && source[i + 1] === '"') { cell += '"'; i += 1; }
      else if (char === '"') quoted = false;
      else cell += char;
    } else if (char === '"') {
      if (cell.length) throw new Error(`Guillemet inattendu à la ligne ${rows.length + 1}.`);
      quoted = true;
    } else if (char === ',') {
      row.push(cell); cell = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && source[i + 1] === '\n') i += 1;
      row.push(cell); cell = '';
      if (row.some((value) => value.trim() !== '')) rows.push(row);
      row = [];
    } else cell += char;
  }
  if (quoted) throw new Error('Le fichier CSV contient un champ entre guillemets non terminé.');
  row.push(cell);
  if (row.some((value) => value.trim() !== '')) rows.push(row);
  return rows;
}

function field(values: string[], indexes: Record<string, number>, ...names: string[]): string {
  for (const name of names) {
    const index = indexes[normalizeHeader(name)];
    if (index !== undefined) return (values[index] ?? '').trim();
  }
  return '';
}

function parseBoolean(value: string, label: string, row: number, errors: CsvImportIssue[]): boolean | undefined {
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase();
  if (['true', '1', 'oui', 'yes'].includes(normalized)) return true;
  if (['false', '0', 'non', 'no'].includes(normalized)) return false;
  errors.push({ row, message: `${label} doit être vrai/faux, oui/non ou 1/0.` });
  return undefined;
}

function parseNumber(value: string, label: string, row: number, errors: CsvImportIssue[], integer = false): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value.replace(',', '.'));
  if (!Number.isFinite(parsed) || parsed < 0 || (integer && !Number.isInteger(parsed))) {
    errors.push({ row, message: `${label} doit être un nombre ${integer ? 'entier ' : ''}positif ou nul.` });
    return undefined;
  }
  return parsed;
}

function parseSize(value: string, row: number, errors: CsvImportIssue[]): { sizeValue: number; sizeUnit: ProductVariant['sizeUnit'] } | undefined {
  const match = value.match(/^\s*(\d+(?:[.,]\d+)?)\s*(ml|l|g|kg)\s*$/i);
  if (!match) { errors.push({ row, message: 'Conditionnement attendu, par exemple « 10 ml », « 1 L » ou « 500 g ». ' }); return undefined; }
  const unit = match[2].toLowerCase();
  return { sizeValue: Number(match[1].replace(',', '.')), sizeUnit: unit === 'l' ? 'L' : unit as ProductVariant['sizeUnit'] };
}

function parseRows(text: string, errors: CsvImportIssue[]): CsvRow[] {
  let matrix: string[][];
  try { matrix = parseMatrix(text); }
  catch (error) { errors.push({ row: 1, message: error instanceof Error ? error.message : 'CSV invalide.' }); return []; }
  if (matrix.length < 2) { errors.push({ row: 1, message: 'Le CSV doit contenir un en-tête et au moins une ligne.' }); return []; }
  const indexes: Record<string, number> = {};
  matrix[0].forEach((header, index) => { indexes[normalizeHeader(header)] = index; });
  if (!('sku' in indexes) && !('variantsku' in indexes)) {
    errors.push({ row: 1, message: 'Colonne SKU/Variant_SKU requise.' }); return [];
  }
  return matrix.slice(1).map((values, index) => ({
    row: index + 2,
    productId: field(values, indexes, 'Product_ID', 'ID_Produit', 'ID'),
    productSku: field(values, indexes, 'Product_SKU', 'SKU_Produit'),
    variantId: field(values, indexes, 'Variant_ID', 'ID_Variante'),
    variantSku: field(values, indexes, 'Variant_SKU', 'SKU'),
    category: field(values, indexes, 'Categorie', 'Category'),
    nameFr: field(values, indexes, 'Nom_FR', 'Name_FR'),
    nameAr: field(values, indexes, 'Nom_AR', 'Name_AR'),
    botanicalName: field(values, indexes, 'Nom_Botanique', 'Botanical_Name'),
    origin: field(values, indexes, 'Origine', 'Origin'),
    size: field(values, indexes, 'Conditionnement', 'Packaging', 'Size'),
    price: field(values, indexes, 'Prix_DZD', 'Price_DZD'),
    stock: field(values, indexes, 'Stock', 'Stock_Quantity'),
    status: field(values, indexes, 'Statut', 'Status'),
    featured: field(values, indexes, 'Produit_Mis_en_Avant', 'Featured'),
    variantActive: field(values, indexes, 'Variante_Active', 'Variant_Active'),
    online: field(values, indexes, 'Achat_En_Ligne', 'Online_Purchase'),
    trackInventory: field(values, indexes, 'Suivi_Stock', 'Track_Inventory'),
  }));
}

function safeSlug(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80) || 'product';
}
function safeVariantId(productId: string, sku: string): string {
  return `${productId}-v-${safeSlug(sku)}`.slice(0, 128);
}
function validId(value: string): boolean { return /^[a-zA-Z0-9_-]{1,128}$/.test(value); }
function skuKey(value: string): string { return value.trim().toLocaleUpperCase('en-US'); }
function imageTagFor(category: CategorySlug): string {
  return category === 'essential-oils' ? 'herbal' : category === 'vegetable-oils' ? 'carrier_oil' : category === 'hydrolats' ? 'rose_water' : 'olive_oil';
}
function sameValue(a: unknown, b: unknown): boolean { return JSON.stringify(a) === JSON.stringify(b); }

export function planCatalogueCsvImport(text: string, catalogue: Product[], now = new Date().toISOString()): CsvImportPreview {
  const errors: CsvImportIssue[] = [];
  const rows = parseRows(text, errors);
  const byId = new Map(catalogue.map((product) => [product.id, product]));
  const byProductSku = new Map<string, Product[]>();
  const byVariantSku = new Map<string, Array<{ product: Product; variant: ProductVariant }>>();
  catalogue.forEach((product) => {
    byProductSku.set(skuKey(product.sku), [...(byProductSku.get(skuKey(product.sku)) ?? []), product]);
    product.variants.forEach((variant) => byVariantSku.set(skuKey(variant.sku), [...(byVariantSku.get(skuKey(variant.sku)) ?? []), { product, variant }]));
  });
  const grouped = new Map<string, CsvRow[]>();
  const duplicateKeys = new Set<string>();
  const seenRows = new Set<string>();
  const seenVariantSkus = new Map<string, string>();
  const seenProductSkus = new Map<string, string>();

  for (const row of rows) {
    const rowStartErrors = errors.length;
    if (!row.variantSku || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(row.variantSku)) errors.push({ row: row.row, message: 'SKU de variante requis (1–64 caractères, lettres, chiffres, point, tiret ou underscore).' });
    if (row.productId && !validId(row.productId)) errors.push({ row: row.row, message: 'Product_ID invalide pour un identifiant de document Firestore.' });
    const variantMatches = row.variantSku ? byVariantSku.get(skuKey(row.variantSku)) ?? [] : [];
    const productSkuMatches = row.productSku ? byProductSku.get(skuKey(row.productSku)) ?? [] : [];
    if (variantMatches.length > 1 || productSkuMatches.length > 1) errors.push({ row: row.row, message: 'SKU ambigu dans le catalogue actuel; résolution manuelle requise.' });
    const matchByVariant = variantMatches[0]?.product;
    const matchByProductSku = productSkuMatches[0];
    if (row.productId && matchByVariant && matchByVariant.id !== row.productId) errors.push({ row: row.row, message: `Product_ID ${row.productId} ne correspond pas au produit du SKU ${row.variantSku}.` });
    if (row.productId && matchByProductSku && matchByProductSku.id !== row.productId) errors.push({ row: row.row, message: `Product_SKU ${row.productSku} appartient à un autre identifiant produit.` });
    if (matchByVariant && matchByProductSku && matchByVariant.id !== matchByProductSku.id) errors.push({ row: row.row, message: 'Product_SKU et Variant_SKU désignent des produits différents.' });
    const existing = (row.productId ? byId.get(row.productId) : undefined) ?? matchByProductSku ?? matchByVariant;
    const id = row.productId || existing?.id || '';
    const existingVariantById = row.variantId && existing ? existing.variants.find((variant) => variant.id === row.variantId) : undefined;
    const existingVariantBySku = existing ? existing.variants.find((variant) => skuKey(variant.sku) === skuKey(row.variantSku)) : undefined;
    if (row.variantId && existingVariantBySku && !existingVariantById) errors.push({ row: row.row, message: `Variant_ID ne correspond pas à la variante du SKU ${row.variantSku}.` });
    if (existingVariantById && existingVariantBySku && existingVariantById.id !== existingVariantBySku.id) errors.push({ row: row.row, message: 'Variant_ID et Variant_SKU désignent deux variantes différentes.' });
    if (!existing && (!row.productId || !row.productSku)) errors.push({ row: row.row, message: 'Pour créer un produit, fournissez Product_ID et Product_SKU; les anciens CSV peuvent mettre à jour uniquement un SKU existant.' });
    if (!row.category && !existing) errors.push({ row: row.row, message: 'Categorie requise pour créer un produit.' });
    if (row.category && !CATEGORIES.includes(row.category as CategorySlug)) errors.push({ row: row.row, message: `Categorie invalide : ${row.category}.` });
    if (!row.nameFr && !existing) errors.push({ row: row.row, message: 'Nom_FR requis pour créer un produit.' });
    if (!row.nameAr && !existing) errors.push({ row: row.row, message: 'Nom_AR requis pour créer un produit.' });
    if (!row.size) errors.push({ row: row.row, message: 'Conditionnement requis.' });
    const size = row.size ? parseSize(row.size, row.row, errors) : undefined;
    const price = row.price.toUpperCase() === 'NULL' ? null : parseNumber(row.price, 'Prix_DZD', row.row, errors, true);
    const stock = parseNumber(row.stock, 'Stock', row.row, errors, true);
    if (!row.stock && !existing) errors.push({ row: row.row, message: 'Stock requis pour créer une variante.' });
    if (row.status && !STATUSES.includes(row.status as typeof STATUSES[number])) errors.push({ row: row.row, message: 'Statut doit être draft, published ou archived.' });
    const featured = parseBoolean(row.featured, 'Produit_Mis_en_Avant', row.row, errors);
    const active = parseBoolean(row.variantActive, 'Variante_Active', row.row, errors);
    const online = parseBoolean(row.online, 'Achat_En_Ligne', row.row, errors);
    const track = parseBoolean(row.trackInventory, 'Suivi_Stock', row.row, errors);
    const effectivePrice = price === undefined ? existingVariantById?.priceDZD ?? existingVariantBySku?.priceDZD ?? null : price;
    const effectiveOnline = online ?? existingVariantById?.isPurchasableOnline ?? existingVariantBySku?.isPurchasableOnline ?? (effectivePrice !== null);
    if (effectiveOnline && effectivePrice === null) errors.push({ row: row.row, message: 'Une variante sans prix (devis) ne peut pas être proposée à l’achat en ligne; définissez Achat_En_Ligne à false.' });
    if (!row.variantId && row.productId && !validId(safeVariantId(row.productId, row.variantSku))) errors.push({ row: row.row, message: 'Impossible de générer un ID de variante valide.' });
    if (row.variantId && !validId(row.variantId)) errors.push({ row: row.row, message: 'Variant_ID invalide.' });
    if (errors.length !== rowStartErrors) continue;

    const key = `${id || `new:${skuKey(row.productSku)}`}|${skuKey(row.variantSku)}`;
    const groupKey = id || `new:${skuKey(row.productSku)}`;
    const previousGroup = seenVariantSkus.get(skuKey(row.variantSku));
    const previousProductGroup = row.productSku ? seenProductSkus.get(skuKey(row.productSku)) : undefined;
    if (seenRows.has(key) || previousGroup || (previousProductGroup && previousProductGroup !== groupKey)) {
      duplicateKeys.add(groupKey);
      if (previousGroup) duplicateKeys.add(previousGroup);
      if (previousProductGroup) duplicateKeys.add(previousProductGroup);
      continue;
    }
    seenRows.add(key);
    seenVariantSkus.set(skuKey(row.variantSku), groupKey);
    if (row.productSku) seenProductSkus.set(skuKey(row.productSku), groupKey);
    grouped.set(groupKey, [...(grouped.get(groupKey) ?? []), { ...row, size: `${size!.sizeValue} ${size!.sizeUnit}`, price: price === null ? 'NULL' : price === undefined ? '' : String(price), stock: stock === undefined ? '' : String(stock), featured: featured === undefined ? '' : String(featured), variantActive: active === undefined ? '' : String(active), online: online === undefined ? '' : String(online), trackInventory: track === undefined ? '' : String(track) }]);
  }

  const items: CsvImportItem[] = [];
  for (const [groupKey, groupRows] of grouped) {
    const first = groupRows[0];
    const baseline = byId.get(first.productId) ?? byProductSku.get(skuKey(first.productSku))?.[0] ?? byVariantSku.get(skuKey(first.variantSku))?.[0]?.product;
    const productId = baseline?.id ?? first.productId;
    const messages: string[] = [];
    if (duplicateKeys.has(groupKey) || duplicateKeys.has(productId)) {
      items.push({ action: 'duplicate', productId, sku: first.productSku || baseline?.sku || '', rows: groupRows.map((row) => row.row), messages: ['SKU de variante répété dans le fichier; aucune ligne de ce produit ne sera écrite.'] });
      continue;
    }
    if (baseline && first.productSku && skuKey(first.productSku) !== skuKey(baseline.sku)) {
      errors.push({ row: first.row, message: `Product_SKU ne correspond pas au produit ${baseline.id}.` });
      items.push({ action: 'error', productId, sku: first.productSku, rows: groupRows.map((row) => row.row), messages: ['Product_SKU incohérent avec le catalogue.'] });
      continue;
    }
    if (new Set(groupRows.map((row) => row.productId || productId)).size > 1 || new Set(groupRows.map((row) => skuKey(row.productSku)).filter(Boolean)).size > 1 || new Set(groupRows.map((row) => row.category).filter(Boolean)).size > 1 || new Set(groupRows.map((row) => row.nameFr).filter(Boolean)).size > 1 || new Set(groupRows.map((row) => row.nameAr).filter(Boolean)).size > 1 || new Set(groupRows.map((row) => row.botanicalName).filter(Boolean)).size > 1 || new Set(groupRows.map((row) => row.origin).filter(Boolean)).size > 1 || new Set(groupRows.map((row) => row.status).filter(Boolean)).size > 1 || new Set(groupRows.map((row) => row.featured).filter(Boolean)).size > 1) {
      errors.push({ row: first.row, message: 'Les champs produit doivent être identiques sur toutes les lignes de ses variantes.' });
      items.push({ action: 'error', productId, sku: first.productSku, rows: groupRows.map((row) => row.row), messages: ['Valeurs produit contradictoires entre variantes.'] });
      continue;
    }
    const category = (first.category || baseline?.categoryId) as CategorySlug;
    const product: Product = baseline ? { ...baseline, variants: [...baseline.variants] } : {
      id: first.productId, sku: first.productSku, slug: safeSlug(first.nameFr), categoryId: category,
      status: (first.status || 'draft') as Product['status'], isFeatured: first.featured.toLowerCase() === 'true',
      botanicalName: first.botanicalName || undefined, origin: first.origin || undefined,
      translations: { fr: { name: first.nameFr, shortDescription: '', description: '' }, ar: { name: first.nameAr, shortDescription: '', description: '' } },
      imageTag: imageTagFor(category), variants: [], documents: [], createdAt: now, updatedAt: now,
    };
    if (first.category) product.categoryId = category;
    if (first.nameFr) product.translations = { ...product.translations, fr: { ...product.translations.fr, name: first.nameFr } };
    if (first.nameAr) product.translations = { ...product.translations, ar: { ...product.translations.ar, name: first.nameAr } };
    if (first.botanicalName) product.botanicalName = first.botanicalName;
    if (first.origin) product.origin = first.origin;
    if (first.status) product.status = first.status as Product['status'];
    if (first.featured) product.isFeatured = first.featured.toLowerCase() === 'true';
    const plannedVariantIds = new Set<string>();
    let variantIdConflict = false;
    for (const row of groupRows) {
      const parsedSize = parseSize(row.size, row.row, []);
      const existingVariantIndex = row.variantId ? product.variants.findIndex((variant) => variant.id === row.variantId) : product.variants.findIndex((variant) => skuKey(variant.sku) === skuKey(row.variantSku));
      const existingVariant = existingVariantIndex >= 0 ? product.variants[existingVariantIndex] : undefined;
      const priceValue = row.price.toUpperCase() === 'NULL' ? null : row.price ? Number(row.price) : undefined;
      const stockValue = row.stock ? Number(row.stock) : undefined;
      const variantId = existingVariant?.id || row.variantId || safeVariantId(product.id, row.variantSku);
      if (plannedVariantIds.has(variantId)) { variantIdConflict = true; break; }
      plannedVariantIds.add(variantId);
      const variant: ProductVariant = existingVariant ? { ...existingVariant } : {
        id: variantId, productId: product.id, sku: row.variantSku,
        sizeValue: parsedSize!.sizeValue, sizeUnit: parsedSize!.sizeUnit,
        packagingLabel: { fr: `${parsedSize!.sizeValue} ${parsedSize!.sizeUnit}`, ar: `${parsedSize!.sizeValue} ${{ ml: 'مل', L: 'لتر', g: 'غ', kg: 'كغ' }[parsedSize!.sizeUnit]}` },
        priceDZD: priceValue ?? null, stockQuantity: stockValue ?? 0,
        trackInventory: row.trackInventory ? row.trackInventory === 'true' : true,
        isActive: row.variantActive ? row.variantActive === 'true' : true,
        isPurchasableOnline: row.online ? row.online === 'true' : priceValue !== null && priceValue !== undefined,
      };
      if (existingVariant) {
        variant.sku = row.variantSku;
        if (parsedSize) { variant.sizeValue = parsedSize.sizeValue; variant.sizeUnit = parsedSize.sizeUnit; }
        if (priceValue !== undefined) variant.priceDZD = priceValue;
        if (stockValue !== undefined) variant.stockQuantity = stockValue;
        if (row.variantActive) variant.isActive = row.variantActive === 'true';
        if (row.online) variant.isPurchasableOnline = row.online === 'true';
        if (row.trackInventory) variant.trackInventory = row.trackInventory === 'true';
      }
      if (existingVariantIndex >= 0) product.variants[existingVariantIndex] = variant;
      else product.variants.push(variant);
    }
    if (variantIdConflict) {
      errors.push({ row: first.row, message: 'Variant_ID répété dans le produit; aucune ligne de ce produit ne sera écrite.' });
      items.push({ action: 'error', productId, sku: product.sku, rows: groupRows.map((row) => row.row), messages: ['IDs de variantes dupliqués.'] });
      continue;
    }
    product.updatedAt = now;
    const action: CsvImportAction = baseline ? (sameValue({ ...product, updatedAt: baseline.updatedAt }, baseline) ? 'unchanged' : 'update') : 'create';
    items.push({ action, productId: product.id, sku: product.sku, rows: groupRows.map((row) => row.row), messages, product, baseline });
  }
  const duplicates = items.filter((item) => item.action === 'duplicate');
  return { items, errors, duplicates, creates: items.filter((item) => item.action === 'create'), updates: items.filter((item) => item.action === 'update'), unchanged: items.filter((item) => item.action === 'unchanged') };
}

export function serializeCatalogueCsv(products: Product[]): string {
  const quote = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const rows = products.flatMap((product) => product.variants.map((variant) => [
    product.id, product.sku, variant.id, variant.sku, product.categoryId, product.translations.fr.name,
    product.translations.ar.name, product.botanicalName ?? '', product.origin ?? '', `${variant.sizeValue} ${variant.sizeUnit}`,
    variant.priceDZD ?? '', variant.stockQuantity, product.status, product.isFeatured, variant.isActive,
    variant.isPurchasableOnline, variant.trackInventory,
  ].map(quote).join(',')));
  return [EXPORT_HEADERS.join(','), ...rows].join('\r\n');
}

export async function executeCsvImport<T>(items: CsvImportItem[], write: (item: CsvImportItem) => Promise<T>): Promise<{ created: string[]; updated: string[]; failed: Array<{ productId: string; message: string }> }> {
  const created: string[] = [];
  const updated: string[] = [];
  const failed: Array<{ productId: string; message: string }> = [];
  for (const item of items.filter((candidate) => candidate.action === 'create' || candidate.action === 'update')) {
    try {
      await write(item);
      (item.action === 'create' ? created : updated).push(item.productId);
    } catch (error) {
      failed.push({ productId: item.productId, message: error instanceof Error ? error.message : String(error) });
    }
  }
  return { created, updated, failed };
}
