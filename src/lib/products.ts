import {
  collection,
  deleteDoc,
  doc,
  getDocFromServer,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  updateDoc,
  where,
} from 'firebase/firestore';
import type { Unsubscribe } from 'firebase/firestore';
import type { Product, StaffRole } from '../types';
import { auth, db } from './firebase';
import { executeCsvImport, type CsvImportPreview } from './catalogueCsv';
import { validateNewProductDraft } from './productCreation';

const CATALOGUE_ROLES: StaffRole[] = ['super_admin', 'catalogue_manager'];
const MAX_PRODUCT_DOCUMENT_BYTES = 900 * 1024;

export interface ProductMigrationPreview {
  candidates: Product[];
  existingIds: string[];
  duplicateLocalIds: string[];
  oversizedIds: string[];
}

function productDocument(product: Product): Record<string, unknown> {
  if (!product.id || !/^[a-zA-Z0-9_-]{1,128}$/.test(product.id)) {
    throw new Error(`Identifiant produit invalide : ${product.id || '(vide)'}.`);
  }
  const cleanProduct = JSON.parse(JSON.stringify(product)) as Product;
  const size = new TextEncoder().encode(JSON.stringify(cleanProduct)).length;
  if (size > MAX_PRODUCT_DOCUMENT_BYTES) {
    throw new Error(`Le produit ${product.sku} dépasse la taille sûre pour un document Firestore. Réduisez les dimensions ou la taille de l’image, ou utilisez une URL d’image hébergée. Aucune donnée n’a été enregistrée.`);
  }
  return cleanProduct as unknown as Record<string, unknown>;
}

async function requireCatalogueAdmin(): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('Connectez-vous avec un compte catalogue autorisé.');
  const adminRecord = await getDocFromServer(doc(db, 'admins', user.uid));
  const role = adminRecord.exists() ? adminRecord.data().role : undefined;
  if (!CATALOGUE_ROLES.includes(role)) {
    throw new Error('Seuls les rôles super_admin et catalogue_manager peuvent modifier le catalogue.');
  }
}

export function subscribeProducts(
  includeUnpublished: boolean,
  onProducts: (products: Product[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  const queryType = includeUnpublished ? 'admin-full-catalogue' : 'public-published-products';
  const productsQuery = includeUnpublished
    ? query(collection(db, 'products'))
    : query(collection(db, 'products'), where('status', '==', 'published'));

  console.info('[Firebase diagnostics] catalogue subscription started', {
    projectId: auth.app.options.projectId,
    uid: auth.currentUser?.uid ?? null,
    queryType,
  });

  return onSnapshot(productsQuery, (snapshot) => {
    onProducts(snapshot.docs.map((productDoc) => ({
      ...productDoc.data(),
      id: productDoc.id,
    }) as Product));
  }, (error) => {
    console.error('[Firebase diagnostics] catalogue subscription failed', {
      projectId: auth.app.options.projectId,
      uid: auth.currentUser?.uid ?? null,
      queryType,
      errorCode: error.code,
    });
    onError(error);
  });
}

export async function createProduct(product: Product): Promise<void> {
  await requireCatalogueAdmin();
  const existingSnapshot = await getDocs(collection(db, 'products'));
  const existingProducts = existingSnapshot.docs.map((productDoc) => ({
    ...productDoc.data(),
    id: productDoc.id,
  }) as Product);
  const validationErrors = validateNewProductDraft(product, existingProducts);
  if (validationErrors.length > 0) throw new Error(validationErrors[0].message);

  const reference = doc(db, 'products', product.id);
  const serialized = productDocument(product);
  await runTransaction(db, async (transaction) => {
    const existing = await transaction.get(reference);
    if (existing.exists()) throw new Error(`Le produit ${product.id} existe déjà; rien n’a été remplacé.`);
    transaction.set(reference, serialized);
  });
}

export async function updateProduct(product: Product): Promise<void> {
  await requireCatalogueAdmin();
  await updateDoc(doc(db, 'products', product.id), productDocument(product));
}

export async function deleteProduct(productId: string): Promise<void> {
  await requireCatalogueAdmin();
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(productId)) throw new Error('Identifiant produit invalide.');
  await deleteDoc(doc(db, 'products', productId));
}

export async function previewProductMigration(products: Product[]): Promise<ProductMigrationPreview> {
  await requireCatalogueAdmin();
  const snapshot = await getDocs(collection(db, 'products'));
  const existingIds = new Set(snapshot.docs.map((productDoc) => productDoc.id));
  const seen = new Set<string>();
  const duplicateLocalIds: string[] = [];
  const candidates: Product[] = [];
  const oversizedIds: string[] = [];

  for (const product of products) {
    if (seen.has(product.id)) {
      duplicateLocalIds.push(product.id);
      continue;
    }
    seen.add(product.id);
    if (existingIds.has(product.id)) continue;
    try {
      productDocument(product);
      candidates.push(product);
    } catch {
      oversizedIds.push(product.id);
    }
  }

  return {
    candidates,
    existingIds: [...existingIds].filter((id) => seen.has(id)),
    duplicateLocalIds,
    oversizedIds,
  };
}

export async function migrateMissingProducts(products: Product[]): Promise<{ created: number; skipped: number }> {
  await requireCatalogueAdmin();
  const uniqueProducts = [...new Map(products.map((product) => [product.id, product])).values()];
  let created = 0;
  let skipped = 0;

  for (const product of uniqueProducts) {
    const reference = doc(db, 'products', product.id);
    const serialized = productDocument(product);
    const wasCreated = await runTransaction(db, async (transaction) => {
      const existing = await transaction.get(reference);
      if (existing.exists()) return false;
      transaction.set(reference, serialized);
      return true;
    });
    if (wasCreated) created += 1;
    else skipped += 1;
  }

  return { created, skipped };
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => `${JSON.stringify(key)}:${stableJson(item)}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

export async function applyCatalogueCsvImport(preview: CsvImportPreview): Promise<{
  created: string[]; updated: string[]; unchanged: number; duplicates: number;
  validationErrors: number; failed: Array<{ productId: string; message: string }>;
}> {
  await requireCatalogueAdmin();
  const result = await executeCsvImport(preview.items, async (item) => {
    if (!item.product) throw new Error('Aucun document préparé dans l’aperçu.');
    const reference = doc(db, 'products', item.productId);
    const serialized = productDocument(item.product);
    return runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(reference);
      if (item.action === 'create') {
        if (snapshot.exists()) throw new Error('Ce produit est apparu dans Firestore depuis l’aperçu; relancez la prévisualisation.');
        transaction.set(reference, serialized);
        return;
      }
      if (!snapshot.exists() || !item.baseline) throw new Error('Le produit a changé depuis l’aperçu; relancez la prévisualisation.');
      const current = { ...snapshot.data(), id: snapshot.id } as Product;
      if (stableJson(current) !== stableJson(item.baseline)) throw new Error('Le produit a été modifié depuis l’aperçu; aucune donnée n’a été remplacée. Relancez la prévisualisation.');
      transaction.set(reference, serialized);
    });
  });
  return {
    ...result,
    unchanged: preview.unchanged.length,
    duplicates: preview.duplicates.length,
    validationErrors: preview.errors.length + preview.items.filter((item) => item.action === 'error').length,
  };
}
