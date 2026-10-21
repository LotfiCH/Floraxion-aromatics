import type { CategorySlug, Product, ProductVariant } from '../types/index.ts';

const CATEGORY_CODES: Record<CategorySlug, { id: string; sku: string }> = {
  'essential-oils': { id: 'he', sku: 'HE' },
  'vegetable-oils': { id: 'hv', sku: 'HV' },
  hydrolats: { id: 'hy', sku: 'HY' },
  'olive-oils': { id: 'ol', sku: 'OL' },
};

const PRODUCT_ID_PATTERN = /^[a-zA-Z0-9_-]{1,128}$/;
const SKU_PATTERN = /^[a-zA-Z0-9_-]{1,128}$/;
const SIZE_UNITS = ['ml', 'L', 'g', 'kg'] as const;

export interface NewProductValidationError {
  section: 'general' | 'variants';
  message: string;
}

export function createNewProductIdentity(
  products: Product[],
  categoryId: CategorySlug = 'essential-oils',
): { id: string; sku: string } {
  const codes = CATEGORY_CODES[categoryId];
  const idPattern = new RegExp(`^prod-${codes.id}-(\\d+)$`, 'i');
  const skuPattern = new RegExp(`^FLX-${codes.sku}-(\\d+)$`, 'i');
  const highestSequence = products.reduce((highest, product) => {
    const idSequence = Number(idPattern.exec(product.id)?.[1] || 0);
    const skuSequence = Number(skuPattern.exec(product.sku)?.[1] || 0);
    return Math.max(highest, idSequence, skuSequence);
  }, 0);

  const usedIds = new Set(products.map((product) => product.id));
  const usedSkus = new Set(products.flatMap((product) => [
    product.sku,
    ...(Array.isArray(product.variants) ? product.variants.map((variant) => variant.sku) : []),
  ]).filter(Boolean).map((sku) => sku.toUpperCase()));

  for (let sequence = highestSequence + 1; sequence < 1_000_000; sequence += 1) {
    const id = `prod-${codes.id}-${String(sequence).padStart(2, '0')}`;
    const sku = `FLX-${codes.sku}-${String(sequence).padStart(3, '0')}`;
    if (!usedIds.has(id) && !usedSkus.has(sku.toUpperCase())) return { id, sku };
  }

  throw new Error('Aucun nouvel identifiant produit disponible pour cette famille.');
}

export function createVariantSku(
  productSku: string,
  sizeValue: number,
  sizeUnit: ProductVariant['sizeUnit'],
  alreadyUsedSkus: string[] = [],
): string {
  const normalizedSize = Number.isInteger(sizeValue)
    ? String(sizeValue)
    : String(sizeValue).replace('.', '-');
  const baseSku = `${productSku}-${normalizedSize}${sizeUnit.toUpperCase()}`;
  const used = new Set(alreadyUsedSkus.map((sku) => sku.toUpperCase()));
  if (!used.has(baseSku.toUpperCase())) return baseSku;

  let suffix = 2;
  while (used.has(`${baseSku}-${suffix}`.toUpperCase())) suffix += 1;
  return `${baseSku}-${suffix}`;
}

export function createNewProductDraft(products: Product[], now = new Date()): Product {
  const categoryId: CategorySlug = 'essential-oils';
  const { id, sku } = createNewProductIdentity(products, categoryId);
  const variant: ProductVariant = {
    id: `${id}-variant-1`,
    productId: id,
    sku: createVariantSku(sku, 10, 'ml'),
    sizeValue: 10,
    sizeUnit: 'ml',
    packagingLabel: { fr: '', ar: '' },
    priceDZD: null,
    stockQuantity: 0,
    trackInventory: true,
    isActive: true,
    isPurchasableOnline: false,
  };
  const timestamp = now.toISOString();

  return {
    id,
    sku,
    slug: id.replace(/^prod-/, ''),
    categoryId,
    status: 'draft',
    isFeatured: false,
    botanicalName: '',
    origin: '',
    translations: {
      fr: { name: '', shortDescription: '', description: '' },
      ar: { name: '', shortDescription: '', description: '' },
    },
    imageTag: 'rosemary',
    variants: [variant],
    documents: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function createUniqueProductSlug(name: string, productId: string, products: Product[]): string {
  const base = name.normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 96) || productId;
  const usedSlugs = new Set(products.filter((product) => product.id !== productId).map((product) => product.slug));
  if (!usedSlugs.has(base)) return base;

  const withId = `${base}-${productId}`.slice(0, 128);
  if (!usedSlugs.has(withId)) return withId;
  let suffix = 2;
  while (usedSlugs.has(`${withId}-${suffix}`)) suffix += 1;
  return `${withId}-${suffix}`;
}

export function validateNewProductDraft(product: Product, existingProducts: Product[]): NewProductValidationError[] {
  const errors: NewProductValidationError[] = [];
  const addError = (section: NewProductValidationError['section'], message: string) => {
    errors.push({ section, message });
  };
  const existingIds = new Set(existingProducts.map((item) => item.id));
  const existingSkus = new Set(existingProducts.flatMap((item) => [
    item.sku,
    ...(Array.isArray(item.variants) ? item.variants.map((variant) => variant.sku) : []),
  ]).filter(Boolean).map((sku) => sku.trim().toUpperCase()));

  if (!PRODUCT_ID_PATTERN.test(product.id)) {
    addError('general', 'L’identifiant doit contenir uniquement des lettres, chiffres, tirets ou tirets bas (128 caractères maximum).');
  } else if (existingIds.has(product.id)) {
    addError('general', `L’identifiant produit « ${product.id} » existe déjà.`);
  }

  const productSku = product.sku.trim();
  if (!SKU_PATTERN.test(productSku)) {
    addError('general', 'Le SKU doit être renseigné et contenir uniquement des lettres, chiffres, tirets ou tirets bas.');
  } else if (existingSkus.has(productSku.toUpperCase())) {
    addError('general', `Le SKU « ${productSku} » est déjà utilisé par un produit ou une variante.`);
  }

  if (!product.translations.fr.name.trim()) addError('general', 'Le nom français est obligatoire.');
  if (!product.translations.ar.name.trim()) addError('general', 'Le nom arabe est obligatoire.');
  if (!['draft', 'published', 'archived'].includes(product.status)) {
    addError('general', 'Le statut de publication est invalide.');
  }

  if (product.variants.length === 0) {
    addError('variants', 'Ajoutez au moins un conditionnement avant d’enregistrer le produit.');
    return errors;
  }

  const variantIds = new Set<string>();
  const allSkus = new Set(existingSkus);
  if (productSku) allSkus.add(productSku.toUpperCase());

  product.variants.forEach((variant, index) => {
    const label = variant.packagingLabel?.fr?.trim() || `variante ${index + 1}`;
    if (!PRODUCT_ID_PATTERN.test(variant.id) || variant.productId !== product.id) {
      addError('variants', `L’identifiant de la ${label} doit être valide et rattaché au produit courant.`);
    }
    if (variantIds.has(variant.id)) addError('variants', `L’identifiant de la ${label} est dupliqué.`);
    variantIds.add(variant.id);

    const variantSku = variant.sku.trim();
    if (!SKU_PATTERN.test(variantSku)) {
      addError('variants', `Le SKU de la ${label} est invalide.`);
    } else if (allSkus.has(variantSku.toUpperCase())) {
      addError('variants', `Le SKU « ${variantSku} » de la ${label} est déjà utilisé.`);
    }
    allSkus.add(variantSku.toUpperCase());

    if (!variant.packagingLabel?.fr?.trim() || !variant.packagingLabel?.ar?.trim()) {
      addError('variants', `Renseignez le nom du conditionnement en français et en arabe pour la ${label}.`);
    }
    if (!Number.isFinite(variant.sizeValue) || variant.sizeValue <= 0 || !SIZE_UNITS.includes(variant.sizeUnit)) {
      addError('variants', `Le format de la ${label} doit avoir une quantité et une unité valides.`);
    }
    if (!Number.isInteger(variant.stockQuantity) || variant.stockQuantity < 0) {
      addError('variants', `Le stock de la ${label} doit être un entier positif ou nul.`);
    }
    if (variant.priceDZD !== null && (!Number.isFinite(variant.priceDZD) || variant.priceDZD <= 0)) {
      addError('variants', `Le prix DZD de la ${label} doit être supérieur à zéro, ou vide pour une vente sur devis.`);
    }
    if (variant.compareAtPriceDZD != null && (!Number.isFinite(variant.compareAtPriceDZD) || variant.compareAtPriceDZD <= 0)) {
      addError('variants', `Le prix barré de la ${label} doit être supérieur à zéro.`);
    }
    if (variant.compareAtPriceDZD != null && variant.priceDZD != null && variant.compareAtPriceDZD <= variant.priceDZD) {
      addError('variants', `Le prix barré de la ${label} doit être supérieur au prix de vente.`);
    }
    if (variant.isPurchasableOnline && (variant.priceDZD == null || variant.priceDZD <= 0)) {
      addError('variants', `Désactivez la vente en ligne de la ${label} ou indiquez un prix supérieur à zéro.`);
    }
    if (variant.isPurchasableOnline && variant.trackInventory && variant.stockQuantity === 0) {
      addError('variants', `La ${label} ne peut pas être vendue en ligne avec un stock suivi à zéro.`);
    }
  });

  return errors;
}
