import React, { useState, useEffect } from 'react';
import { Product, ProductVariant, ProductBadge, CategorySlug, Locale, StaffUser } from '../../types';
import { BotanicalIllustration } from '../ui/BotanicalIllustration';
import { createNewProductIdentity, createVariantSku, validateNewProductDraft } from '../../lib/productCreation';
import {
  getImageDataUrlMimeType,
  isProductImageUploadTooLarge,
  selectProductImageCanvasMimeType,
  validateProductImageDataUrl,
} from '../../lib/productImage';
import {
  X,
  Save,
  Upload,
  Image as ImageIcon,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Package,
  FileText,
  Sliders,
  DollarSign,
  Tag,
  Globe,
  Plus,
  Trash2,
} from 'lucide-react';

interface ProductEditModalProps {
  product: Product;
  existingProducts: Product[];
  locale: Locale;
  activeStaff: StaffUser;
  onClose: () => void;
  onSave: (updatedProduct: Product) => Promise<void> | void;
  isNew?: boolean;
}

const BOTANICAL_TAGS = [
  { value: 'rosemary', label: 'Romarin (Rosmarinus officinalis)' },
  { value: 'lavender', label: 'Lavande Vraie (Lavandula angustifolia)' },
  { value: 'eucalyptus', label: 'Eucalyptus (Eucalyptus globulus)' },
  { value: 'cedarwood', label: 'Cèdre de l’Atlas (Cedrus atlantica)' },
  { value: 'immortelle', label: 'Hélichryse / Immortelle (Helichrysum italicum)' },
  { value: 'carrier_oil', label: 'Huile Végétale / Amande / Sésame' },
  { value: 'prickly_pear', label: 'Figue de Barbarie (Opuntia ficus-indica)' },
  { value: 'rose_water', label: 'Hydrolat Rose de Damas' },
  { value: 'orange_blossom', label: 'Hydrolat Fleur d’Oranger / Zhar' },
  { value: 'olive_oil', label: 'Huile d’Olive Vierge Extra (Sig / Kabylie)' },
  { value: 'olive_rosemary', label: 'Huile d’Olive & Romarin Sauvage' },
  { value: 'olive_thyme', label: 'Huile d’Olive & Thym / Zaatar' },
  { value: 'olive_lemon', label: 'Huile d’Olive & Citron / Bergamote' },
  { value: 'olive_chili', label: 'Huile d’Olive & Piment / Harissa' },
  { value: 'olive_garlic', label: 'Huile d’Olive & Ail Rose / Truffe' },
  { value: 'olive_basil', label: 'Huile d’Olive & Basilic / Laurier' },
  { value: 'mint', label: 'Menthe Poivrée / Naanâa' },
  { value: 'citrus', label: 'Agrumes / Bergamote / Citron' },
  { value: 'floral', label: 'Notes Florales & Délicates' },
  { value: 'forest', label: 'Notes Boisées & Forêt' },
  { value: 'herbal', label: 'Herbes Sauvages & Garrigue' },
  { value: 'resin', label: 'Résines Naturelles & Encens' },
  { value: 'roots', label: 'Racines Botaniques' },
  { value: 'spice', label: 'Épices & Baies' },
];

export const ProductEditModal: React.FC<ProductEditModalProps> = ({
  product,
  existingProducts,
  locale,
  activeStaff,
  onClose,
  onSave,
  isNew = false,
}) => {
  // Deep clone initial product data to maintain complete isolation until save
  const [draft, setDraft] = useState<Product>(() => JSON.parse(JSON.stringify(product)));
  const [activeSubTab, setActiveSubTab] = useState<'general' | 'variants' | 'specs' | 'image'>('general');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isIdentityCustomized, setIsIdentityCustomized] = useState(false);

  // Synchronize draft whenever selected product prop changes
  useEffect(() => {
    setDraft(JSON.parse(JSON.stringify(product)));
    setErrorMessage(null);
    setIsSubmitting(false);
    setIsIdentityCustomized(false);
  }, [product]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Handle image upload with off-screen resizing and format selection for Firestore persistence.
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Le fichier sélectionné doit être une image valide (PNG, JPG, WebP, etc.).');
      return;
    }

    if (isProductImageUploadTooLarge(file.size)) {
      setErrorMessage('L’image dépasse 5 Mo. Réduisez ses dimensions ou compressez le fichier à 5 Mo maximum, puis réessayez.');
      return;
    }

    setErrorMessage(null);
    const reader = new FileReader();
    reader.onload = () => {
      const rawDataUrl = typeof reader.result === 'string' ? reader.result : '';
      let originalMimeType: string;
      try {
        originalMimeType = getImageDataUrlMimeType(rawDataUrl);
        if (file.type && originalMimeType !== file.type.toLowerCase()) {
          throw new Error('Le type de l’image ne correspond pas au fichier sélectionné.');
        }
      } catch {
        setErrorMessage('Le fichier image est invalide ou son format ne peut pas être vérifié.');
        return;
      }

      const keepOriginalImage = () => {
        try {
          validateProductImageDataUrl(rawDataUrl, originalMimeType);
          setDraft((prev) => ({ ...prev, imageUrl: rawDataUrl }));
        } catch {
          setErrorMessage('Le format de l’image n’a pas pu être vérifié. Choisissez un autre fichier.');
        }
      };

      // Auto-compress and scale to safe dimension (max 800px)
      const img = new Image();
      img.onload = () => {
        try {
          const maxDim = 800;
          let width = img.width;
          let height = img.height;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const outputMimeType = selectProductImageCanvasMimeType(
              ctx.getImageData(0, 0, width, height).data,
            );
            const optimized = outputMimeType === 'image/png'
              ? canvas.toDataURL('image/png')
              : canvas.toDataURL('image/jpeg', 0.85);
            validateProductImageDataUrl(optimized, outputMimeType);
            setDraft((prev) => ({
              ...prev,
              imageUrl: optimized,
            }));
            return;
          }
        } catch (canvasErr) {
          console.warn('Canvas optimization fallback:', canvasErr);
        }
        keepOriginalImage();
      };
      img.onerror = () => {
        setErrorMessage('Impossible de décoder cette image. Choisissez un fichier PNG, JPEG ou WebP valide.');
      };
      img.src = rawDataUrl;
    };
    reader.onerror = () => {
      setErrorMessage('Échec du chargement de l’image. Veuillez réessayer.');
    };
    reader.readAsDataURL(file);
  };

  // Update variant field
  const handleUpdateVariant = (
    index: number,
    field: keyof ProductVariant | 'labelFr' | 'labelAr',
    value: any
  ) => {
    setDraft((prev) => {
      const nextVariants = [...prev.variants];
      const target = { ...nextVariants[index] };

      if (field === 'labelFr') {
        target.packagingLabel = { ...target.packagingLabel, fr: value };
      } else if (field === 'labelAr') {
        target.packagingLabel = { ...target.packagingLabel, ar: value };
      } else {
        (target as any)[field] = value;
      }

      if (isNew && (field === 'sizeValue' || field === 'sizeUnit')) {
        target.sku = createVariantSku(
          prev.sku,
          target.sizeValue,
          target.sizeUnit,
          [prev.sku, ...nextVariants.filter((_, variantIndex) => variantIndex !== index).map((variant) => variant.sku)],
        );
      }

      nextVariants[index] = target;
      return { ...prev, variants: nextVariants };
    });
  };

  const handleProductIdChange = (id: string) => {
    setIsIdentityCustomized(true);
    setDraft((prev) => ({
      ...prev,
      id,
      variants: prev.variants.map((variant, index) => ({
        ...variant,
        id: `${id.slice(0, 104)}-variant-${index + 1}`,
        productId: id,
      })),
    }));
  };

  const handleProductSkuChange = (sku: string) => {
    setIsIdentityCustomized(true);
    setDraft((prev) => {
      const usedSkus = [sku];
      const variants = prev.variants.map((variant) => {
        const nextSku = createVariantSku(sku, variant.sizeValue, variant.sizeUnit, usedSkus);
        usedSkus.push(nextSku);
        return { ...variant, sku: nextSku };
      });
      return { ...prev, sku, variants };
    });
  };

  const handleCategoryChange = (categoryId: CategorySlug) => {
    if (!isNew || isIdentityCustomized) {
      setDraft((prev) => ({ ...prev, categoryId }));
      return;
    }

    const identity = createNewProductIdentity(existingProducts, categoryId);
    setDraft((prev) => {
      const usedSkus = [identity.sku];
      const variants = prev.variants.map((variant, index) => {
        const nextSku = createVariantSku(identity.sku, variant.sizeValue, variant.sizeUnit, usedSkus);
        usedSkus.push(nextSku);
        return {
          ...variant,
          id: `${identity.id}-variant-${index + 1}`,
          productId: identity.id,
          sku: nextSku,
        };
      });
      return { ...prev, categoryId, id: identity.id, sku: identity.sku, variants };
    });
  };

  const handleAddVariant = () => {
    setDraft((prev) => {
      let variantNumber = prev.variants.length + 1;
      const variantId = () => `${prev.id.slice(0, 104)}-variant-${variantNumber}`;
      while (prev.variants.some((variant) => variant.id === variantId())) variantNumber += 1;

      const sizeValue = 10;
      const sizeUnit: ProductVariant['sizeUnit'] = 'ml';
      const variant: ProductVariant = {
        id: variantId(),
        productId: prev.id,
        sku: createVariantSku(prev.sku, sizeValue, sizeUnit, [prev.sku, ...prev.variants.map((item) => item.sku)]),
        sizeValue,
        sizeUnit,
        packagingLabel: { fr: '', ar: '' },
        priceDZD: null,
        stockQuantity: 0,
        trackInventory: true,
        isActive: true,
        isPurchasableOnline: false,
      };
      return { ...prev, variants: [...prev.variants, variant] };
    });
  };

  const handleRemoveVariant = (index: number) => {
    setDraft((prev) => prev.variants.length <= 1
      ? prev
      : { ...prev, variants: prev.variants.filter((_, variantIndex) => variantIndex !== index) });
  };

  // Form submission & validation
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    const nameFr = draft.translations.fr?.name?.trim();
    const nameAr = draft.translations.ar?.name?.trim();

    if (!nameFr) {
      setErrorMessage('Le nom du produit en français est obligatoire.');
      setActiveSubTab('general');
      return;
    }

    if (!nameAr) {
      setErrorMessage('Le nom du produit en arabe est obligatoire.');
      setActiveSubTab('general');
      return;
    }

    if (isNew) {
      const validationError = validateNewProductDraft(draft, existingProducts)[0];
      if (validationError) {
        setErrorMessage(validationError.message);
        setActiveSubTab(validationError.section === 'variants' ? 'variants' : 'general');
        return;
      }
    }

    // Validate variants numbers
    for (const v of draft.variants) {
      if (v.priceDZD !== null && (isNaN(Number(v.priceDZD)) || Number(v.priceDZD) < 0)) {
        setErrorMessage(`Prix invalide pour la variante ${v.packagingLabel?.fr || v.sku}.`);
        setActiveSubTab('variants');
        return;
      }
      if (isNaN(Number(v.stockQuantity)) || Number(v.stockQuantity) < 0) {
        setErrorMessage(`Quantité en stock invalide pour la variante ${v.packagingLabel?.fr || v.sku}.`);
        setActiveSubTab('variants');
        return;
      }
    }

    try {
      setIsSubmitting(true);
      await onSave(draft);
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(err?.message || 'Une erreur inattendue est survenue lors de l’enregistrement.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs overflow-hidden animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-edit-title"
    >
      <div className="bg-[#FAF9F5] border border-[#E3E5DF] rounded-xs shadow-2xl max-w-4xl w-full h-[calc(100dvh-24px)] sm:h-[calc(100dvh-48px)] max-h-[900px] min-h-0 flex flex-col overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="bg-white px-6 py-4 border-b border-[#E3E5DF] flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xs bg-[#244A3B]/10 text-[#244A3B] flex items-center justify-center shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs uppercase text-[#829477] font-semibold tracking-wider">
                  {draft.sku}
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-xs bg-[#244A3B]/10 text-[#244A3B] font-medium">
                  {draft.categoryId}
                </span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-xs font-semibold ${
                    draft.status === 'published'
                      ? 'bg-emerald-100 text-emerald-800'
                      : draft.status === 'draft'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-stone-200 text-stone-700'
                  }`}
                >
                  {draft.status}
                </span>
              </div>
              <h2 id="product-edit-title" className="font-serif-botanical text-xl font-bold text-[#244A3B]">
                {isNew ? 'Nouveau produit : ' : 'Édition : '}{draft.translations.fr.name || draft.sku}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-[#6D746E] hover:text-[#292D29] hover:bg-[#F4F1E8] rounded-xs transition-colors cursor-pointer"
            title="Annuler et fermer"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Sub-Tabs */}
        <div className="bg-white px-6 border-b border-[#E3E5DF] flex items-center gap-2 shrink-0 overflow-x-auto text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveSubTab('general')}
            className={`py-3 px-3 border-b-2 transition-colors cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap ${
              activeSubTab === 'general'
                ? 'border-[#244A3B] text-[#244A3B] font-semibold'
                : 'border-transparent text-[#6D746E] hover:text-[#244A3B]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Noms & Descriptions (Bilingue)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('image')}
            className={`py-3 px-3 border-b-2 transition-colors cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap ${
              activeSubTab === 'image'
                ? 'border-[#244A3B] text-[#244A3B] font-semibold'
                : 'border-transparent text-[#6D746E] hover:text-[#244A3B]'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Image & Rendu Visuel</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('variants')}
            className={`py-3 px-3 border-b-2 transition-colors cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap ${
              activeSubTab === 'variants'
                ? 'border-[#244A3B] text-[#244A3B] font-semibold'
                : 'border-transparent text-[#6D746E] hover:text-[#244A3B]'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Prix, Formats & Stocks ({draft.variants.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('specs')}
            className={`py-3 px-3 border-b-2 transition-colors cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap ${
              activeSubTab === 'specs'
                ? 'border-[#244A3B] text-[#244A3B] font-semibold'
                : 'border-transparent text-[#6D746E] hover:text-[#244A3B]'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Spécifications & Botanique</span>
          </button>
        </div>

        {/* Modal Form Body */}
        <form id="product-edit-form" onSubmit={handleFormSubmit} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:p-6 space-y-6">
          {errorMessage && (
            <div role="alert" aria-live="assertive" className="bg-rose-50 border border-rose-200 px-4 py-3 flex items-center gap-2 text-rose-800 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* TAB 1: General & Bilingual Content */}
          {activeSubTab === 'general' && (
            <div className="space-y-6">
              {isNew && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white p-4 rounded-xs border border-[#E3E5DF]">
                  <div>
                    <label htmlFor="new-product-id" className="block text-xs font-semibold text-[#292D29] mb-1">
                      Identifiant unique du produit
                    </label>
                    <input
                      id="new-product-id"
                      type="text"
                      value={draft.id}
                      onChange={(e) => handleProductIdChange(e.target.value)}
                      maxLength={128}
                      pattern="[a-zA-Z0-9_-]+"
                      autoComplete="off"
                      required
                      className="w-full py-2 px-3 bg-[#FAF9F5] border border-[#E3E5DF] rounded-xs text-xs font-mono text-[#292D29] focus:border-[#244A3B] focus:outline-none"
                    />
                    <p className="mt-1 text-[10px] text-[#6D746E]">Utilisé comme identifiant du document Firestore.</p>
                  </div>
                  <div>
                    <label htmlFor="new-product-sku" className="block text-xs font-semibold text-[#292D29] mb-1">
                      SKU du produit
                    </label>
                    <input
                      id="new-product-sku"
                      type="text"
                      value={draft.sku}
                      onChange={(e) => handleProductSkuChange(e.target.value)}
                      maxLength={128}
                      pattern="[a-zA-Z0-9_-]+"
                      autoComplete="off"
                      required
                      className="w-full py-2 px-3 bg-[#FAF9F5] border border-[#E3E5DF] rounded-xs text-xs font-mono text-[#292D29] focus:border-[#244A3B] focus:outline-none"
                    />
                    <p className="mt-1 text-[10px] text-[#6D746E]">Généré selon la famille et modifiable avant l’enregistrement.</p>
                  </div>
                </div>
              )}

              {/* Status, Category & Visibility Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-white p-4 rounded-xs border border-[#E3E5DF]">
                <div>
                  <label className="block text-xs font-semibold text-[#292D29] mb-1">
                    Statut de publication
                  </label>
                  <select
                    value={draft.status}
                    onChange={(e) => setDraft({ ...draft, status: e.target.value as any })}
                    className="w-full py-1.5 px-3 bg-[#FAF9F5] border border-[#E3E5DF] rounded-xs text-xs text-[#292D29] focus:border-[#244A3B] focus:outline-none"
                  >
                    <option value="published">Publié (En vente)</option>
                    <option value="draft">Brouillon (Non visible)</option>
                    <option value="archived">Archivé</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#292D29] mb-1">
                    Catégorie botanique
                  </label>
                  <select
                    value={draft.categoryId}
                    onChange={(e) => handleCategoryChange(e.target.value as CategorySlug)}
                    className="w-full py-1.5 px-3 bg-[#FAF9F5] border border-[#E3E5DF] rounded-xs text-xs text-[#292D29] focus:border-[#244A3B] focus:outline-none"
                  >
                    <option value="essential-oils">Huiles Essentielles</option>
                    <option value="vegetable-oils">Huiles Végétales</option>
                    <option value="hydrolats">Hydrolats Botaniques</option>
                    <option value="olive-oils">Huiles d’Olive Vierge Extra & Aromatisées</option>
                  </select>
                  {isNew && !isIdentityCustomized && (
                    <p className="mt-1 text-[10px] text-[#6D746E]">Le changement de famille adapte l’ID et le SKU générés; vous pourrez ensuite modifier le SKU.</p>
                  )}
                </div>

                <div>
                  <label htmlFor="product-badge" className="block text-xs font-semibold text-[#292D29] mb-1">
                    Badge produit
                  </label>
                  <select
                    id="product-badge"
                    value={draft.productBadge || ''}
                    onChange={(e) => setDraft({ ...draft, productBadge: (e.target.value || undefined) as ProductBadge | undefined })}
                    className="w-full py-1.5 px-3 bg-[#FAF9F5] border border-[#E3E5DF] rounded-xs text-xs text-[#292D29] focus:border-[#244A3B] focus:outline-none"
                  >
                    <option value="">Aucun badge</option>
                    <option value="new">Nouveau</option>
                    <option value="best_seller">Meilleure vente</option>
                    <option value="popular">Populaire</option>
                  </select>
                  <p className="mt-1 text-[10px] text-[#6D746E]">Attribution éditoriale explicite. Aucun badge ni classement n’est calculé automatiquement.</p>
                </div>

                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#292D29]">
                    <input
                      type="checkbox"
                      checked={draft.isFeatured}
                      onChange={(e) => setDraft({ ...draft, isFeatured: e.target.checked })}
                      className="w-4 h-4 text-[#244A3B] rounded-xs accent-[#244A3B] cursor-pointer"
                    />
                    <span>Mettre en avant sur l'accueil</span>
                  </label>
                </div>
              </div>

              {/* French Fields */}
              <div className="bg-white p-5 rounded-xs border border-[#E3E5DF] space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-[#244A3B] uppercase tracking-wider border-b border-[#E3E5DF] pb-2">
                  <Globe className="w-4 h-4 text-[#829477]" />
                  <span>Version Française</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#292D29] mb-1">
                    Nom commercial du produit (FR) <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={draft.translations.fr.name}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        translations: {
                          ...draft.translations,
                          fr: { ...draft.translations.fr, name: e.target.value },
                        },
                      })
                    }
                    className="w-full py-2 px-3 bg-[#FAF9F5] border border-[#E3E5DF] rounded-xs text-xs text-[#292D29] focus:border-[#244A3B] focus:outline-none"
                    placeholder="ex. Huile Essentielle de Romarin à Cinéole"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#292D29] mb-1">
                    Description courte (FR)
                  </label>
                  <input
                    type="text"
                    value={draft.translations.fr.shortDescription || ''}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        translations: {
                          ...draft.translations,
                          fr: { ...draft.translations.fr, shortDescription: e.target.value },
                        },
                      })
                    }
                    className="w-full py-2 px-3 bg-[#FAF9F5] border border-[#E3E5DF] rounded-xs text-xs text-[#292D29] focus:border-[#244A3B] focus:outline-none"
                    placeholder="Phrase d’accroche résumant les propriétés principales"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#292D29] mb-1">
                    Description détaillée & Histoire du terroir (FR)
                  </label>
                  <textarea
                    rows={4}
                    value={draft.translations.fr.description || ''}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        translations: {
                          ...draft.translations,
                          fr: { ...draft.translations.fr, description: e.target.value },
                        },
                      })
                    }
                    className="w-full py-2 px-3 bg-[#FAF9F5] border border-[#E3E5DF] rounded-xs text-xs text-[#292D29] focus:border-[#244A3B] focus:outline-none leading-relaxed"
                    placeholder="Description complète des procédés de récolte et de distillation..."
                  />
                </div>
              </div>

              {/* Arabic Fields (with RTL alignment) */}
              <div className="bg-white p-5 rounded-xs border border-[#E3E5DF] space-y-4" dir="rtl">
                <div className="flex items-center gap-2 text-xs font-bold text-[#244A3B] uppercase tracking-wider border-b border-[#E3E5DF] pb-2 text-right">
                  <Globe className="w-4 h-4 text-[#829477]" />
                  <span>النسخة العربية (Arabic / RTL)</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#292D29] mb-1 text-right">
                    اسم المنتج التجاري (بالعربية) <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    dir="rtl"
                    value={draft.translations.ar.name}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        translations: {
                          ...draft.translations,
                          ar: { ...draft.translations.ar, name: e.target.value },
                        },
                      })
                    }
                    className="w-full py-2 px-3 bg-[#FAF9F5] border border-[#E3E5DF] rounded-xs text-xs text-[#292D29] focus:border-[#244A3B] focus:outline-none text-right font-sans"
                    placeholder="مثال: زيت إكليل الجبل (الروزماري) بالسينول"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#292D29] mb-1 text-right">
                    الوصف المختصر (بالعربية)
                  </label>
                  <input
                    type="text"
                    dir="rtl"
                    value={draft.translations.ar.shortDescription || ''}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        translations: {
                          ...draft.translations,
                          ar: { ...draft.translations.ar, shortDescription: e.target.value },
                        },
                      })
                    }
                    className="w-full py-2 px-3 bg-[#FAF9F5] border border-[#E3E5DF] rounded-xs text-xs text-[#292D29] focus:border-[#244A3B] focus:outline-none text-right"
                    placeholder="عبارة موجزة تلخص الفوائد والمصدر"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#292D29] mb-1 text-right">
                    الوصف التفصيلي ومعلومات المحصول (بالعربية)
                  </label>
                  <textarea
                    rows={4}
                    dir="rtl"
                    value={draft.translations.ar.description || ''}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        translations: {
                          ...draft.translations,
                          ar: { ...draft.translations.ar, description: e.target.value },
                        },
                      })
                    }
                    className="w-full py-2 px-3 bg-[#FAF9F5] border border-[#E3E5DF] rounded-xs text-xs text-[#292D29] focus:border-[#244A3B] focus:outline-none leading-relaxed text-right font-sans"
                    placeholder="شرح وافٍ لطريقة التقطير وخصائص المحصول من الجبال والمزارع الجزائرية..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Image & Visual Representation */}
          {activeSubTab === 'image' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-white p-6 rounded-xs border border-[#E3E5DF]">
                {/* Left: Live Visual Preview */}
                <div className="md:col-span-5 flex flex-col items-center">
                  <span className="text-xs font-bold text-[#244A3B] uppercase tracking-wider mb-2">
                    Aperçu en direct
                  </span>
                  <div className="w-full max-w-[280px] aspect-square rounded-xs overflow-hidden border border-[#E3E5DF] shadow-sm bg-[#F8F7F2]">
                    <BotanicalIllustration
                      tag={draft.imageTag}
                      imageUrl={draft.imageUrl}
                      aspectRatio="square"
                      className="w-full h-full"
                    />
                  </div>
                  <span className="text-[11px] text-[#6D746E] mt-2 text-center">
                    {draft.imageUrl ? 'Photo personnalisée active' : `Illustration pré-définie : ${draft.imageTag}`}
                  </span>
                </div>

                {/* Right: Controls & Upload */}
                <div className="md:col-span-7 space-y-5">
                  <div>
                    <h3 className="text-sm font-bold text-[#244A3B] mb-1">
                      Gestion de l’image du produit
                    </h3>
                    <p className="text-xs text-[#6D746E]">
                      Vous pouvez soit importer une photo personnalisée de votre produit, soit utiliser l’une de nos illustrations botaniques élégantes.
                    </p>
                  </div>

                  {/* Upload Image Section */}
                  <div className="p-4 bg-[#FAF9F5] border border-dashed border-[#829477]/40 rounded-xs space-y-3">
                    <span className="block text-xs font-semibold text-[#292D29]">
                      Option 1 : Téléverser une photo (PNG, JPG, WebP)
                    </span>
                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-[#244A3B] hover:bg-[#1C3A2E] text-white text-xs font-semibold rounded-xs transition-colors cursor-pointer shadow-2xs">
                      <Upload className="w-4 h-4" />
                      <span>Choisir un fichier image...</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileUpload}
                        className="hidden"
                      />
                    </label>

                    {draft.imageUrl && (
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => setDraft({ ...draft, imageUrl: undefined })}
                          className="inline-flex items-center gap-1.5 text-xs text-rose-700 hover:text-rose-900 font-medium hover:underline cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Supprimer la photo personnalisée et revenir à l'illustration</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Or External URL */}
                  <div>
                    <label className="block text-xs font-semibold text-[#292D29] mb-1">
                      Option 2 : URL d'image en ligne (facultatif)
                    </label>
                    <input
                      type="url"
                      value={draft.imageUrl || ''}
                      onChange={(e) => setDraft({ ...draft, imageUrl: e.target.value.trim() || undefined })}
                      placeholder="https://domaine.com/images/produit.jpg"
                      className="w-full py-2 px-3 bg-[#FAF9F5] border border-[#E3E5DF] rounded-xs text-xs text-[#292D29] focus:border-[#244A3B] focus:outline-none"
                    />
                  </div>

                  {/* Botanical Preset Tag Selector */}
                  <div>
                    <label className="block text-xs font-semibold text-[#292D29] mb-1">
                      Option 3 : Style d’illustration botanique pré-établi
                    </label>
                    <select
                      value={draft.imageTag}
                      onChange={(e) => setDraft({ ...draft, imageTag: e.target.value })}
                      className="w-full py-2 px-3 bg-[#FAF9F5] border border-[#E3E5DF] rounded-xs text-xs text-[#292D29] focus:border-[#244A3B] focus:outline-none cursor-pointer"
                    >
                      {BOTANICAL_TAGS.map((tag) => (
                        <option key={tag.value} value={tag.value}>
                          {tag.label}
                        </option>
                      ))}
                      {!BOTANICAL_TAGS.some((t) => t.value === draft.imageTag) && (
                        <option value={draft.imageTag}>Autre : {draft.imageTag}</option>
                      )}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Variants, Packaging, Pricing & Stock */}
          {activeSubTab === 'variants' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#244A3B]">
                    Conditionnements, Prix & Gestion des Stocks
                  </h3>
                  <p className="text-xs text-[#6D746E]">
                    Ajustez les prix en Dinar Algérien (DZD), les quantités en stock et l'éligibilité à la vente directe pour chaque variante.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddVariant}
                  className="inline-flex shrink-0 items-center gap-1.5 px-3 py-2 bg-[#244A3B] hover:bg-[#1C3A2E] text-white text-xs font-semibold rounded-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ajouter un format</span>
                </button>
              </div>

              <div className="space-y-4">
                {draft.variants.map((v, idx) => (
                  <div
                    key={v.id || idx}
                    className="bg-white p-5 rounded-xs border border-[#E3E5DF] shadow-2xs space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E3E5DF] pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#244A3B]">
                          {v.sku}
                        </span>
                        <span className="text-[11px] font-semibold text-[#829477]">
                          ({v.sizeValue} {v.sizeUnit})
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs">
                        <label className="flex items-center gap-1.5 cursor-pointer text-[#292D29]">
                          <input
                            type="checkbox"
                            checked={v.isActive}
                            onChange={(e) => handleUpdateVariant(idx, 'isActive', e.target.checked)}
                            className="w-3.5 h-3.5 text-[#244A3B] accent-[#244A3B]"
                          />
                          <span>Variante active</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer text-[#292D29]">
                          <input
                            type="checkbox"
                            checked={v.isPurchasableOnline}
                            onChange={(e) => handleUpdateVariant(idx, 'isPurchasableOnline', e.target.checked)}
                            className="w-3.5 h-3.5 text-[#244A3B] accent-[#244A3B]"
                          />
                          <span>Vente en ligne</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => handleRemoveVariant(idx)}
                          disabled={draft.variants.length <= 1}
                          className="inline-flex items-center gap-1 text-rose-700 hover:text-rose-900 disabled:opacity-40 disabled:cursor-not-allowed"
                          aria-label={`Supprimer le conditionnement ${v.packagingLabel?.fr || idx + 1}`}
                          title={draft.variants.length <= 1 ? 'Un produit doit garder au moins un conditionnement.' : 'Supprimer ce conditionnement'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Supprimer</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-[11px] font-semibold text-[#292D29] mb-1">
                          Quantité du format
                        </label>
                        <input
                          type="number"
                          min="0.001"
                          step="any"
                          value={v.sizeValue}
                          onChange={(e) => handleUpdateVariant(idx, 'sizeValue', Number(e.target.value))}
                          required={isNew}
                          className="w-full py-1.5 px-2.5 bg-[#FAF9F5] border border-[#E3E5DF] rounded-xs text-xs text-[#292D29] focus:border-[#244A3B] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-[#292D29] mb-1">
                          Unité
                        </label>
                        <select
                          value={v.sizeUnit}
                          onChange={(e) => handleUpdateVariant(idx, 'sizeUnit', e.target.value as ProductVariant['sizeUnit'])}
                          className="w-full py-1.5 px-2.5 bg-[#FAF9F5] border border-[#E3E5DF] rounded-xs text-xs text-[#292D29] focus:border-[#244A3B] focus:outline-none"
                        >
                          <option value="ml">ml</option>
                          <option value="L">L</option>
                          <option value="g">g</option>
                          <option value="kg">kg</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                      <div>
                        <label className="block text-[11px] font-semibold text-[#292D29] mb-1">
                          Prix de vente (DZD)
                        </label>
                        <input
                          type="number"
                          min="0.01"
                          step="50"
                          value={v.priceDZD ?? ''}
                          onChange={(e) =>
                            handleUpdateVariant(
                              idx,
                              'priceDZD',
                              e.target.value === '' ? null : Number(e.target.value)
                            )
                          }
                          placeholder="Sur devis si vide"
                          className="w-full py-1.5 px-2.5 bg-[#FAF9F5] border border-[#E3E5DF] rounded-xs text-xs text-[#292D29] font-semibold focus:border-[#244A3B] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-[#292D29] mb-1">
                          Prix barré / Promo (DZD)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="50"
                          value={v.compareAtPriceDZD ?? ''}
                          onChange={(e) =>
                            handleUpdateVariant(
                              idx,
                              'compareAtPriceDZD',
                              e.target.value === '' ? null : Number(e.target.value)
                            )
                          }
                          placeholder="Optionnel"
                          className="w-full py-1.5 px-2.5 bg-[#FAF9F5] border border-[#E3E5DF] rounded-xs text-xs text-[#292D29] focus:border-[#244A3B] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-[#292D29] mb-1">
                          Quantité en stock
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={v.stockQuantity}
                          onChange={(e) =>
                            handleUpdateVariant(idx, 'stockQuantity', Math.max(0, parseInt(e.target.value, 10) || 0))
                          }
                          className="w-full py-1.5 px-2.5 bg-[#FAF9F5] border border-[#E3E5DF] rounded-xs text-xs text-[#292D29] font-bold focus:border-[#244A3B] focus:outline-none"
                        />
                      </div>

                      <div className="flex items-end pb-1">
                        <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-medium text-[#6D746E]">
                          <input
                            type="checkbox"
                            checked={v.trackInventory}
                            onChange={(e) => handleUpdateVariant(idx, 'trackInventory', e.target.checked)}
                            className="w-3.5 h-3.5 text-[#244A3B] accent-[#244A3B]"
                          />
                          <span>Suivre le stock</span>
                        </label>
                      </div>
                    </div>

                    {/* Packaging Labels FR & AR */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-[11px] text-[#6D746E] mb-1">
                          Intitulé conditionnement (FR)
                        </label>
                        <input
                          type="text"
                          value={v.packagingLabel?.fr || ''}
                          onChange={(e) => handleUpdateVariant(idx, 'labelFr', e.target.value)}
                          required={isNew}
                          className="w-full py-1.5 px-2.5 bg-[#FAF9F5] border border-[#E3E5DF] rounded-xs text-xs text-[#292D29] focus:border-[#244A3B] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-[#6D746E] mb-1 text-right" dir="rtl">
                          نوع العبوة (بالعربية)
                        </label>
                        <input
                          type="text"
                          dir="rtl"
                          value={v.packagingLabel?.ar || ''}
                          onChange={(e) => handleUpdateVariant(idx, 'labelAr', e.target.value)}
                          required={isNew}
                          className="w-full py-1.5 px-2.5 bg-[#FAF9F5] border border-[#E3E5DF] rounded-xs text-xs text-[#292D29] focus:border-[#244A3B] focus:outline-none text-right font-sans"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: Specifications, Botanical & Terroir */}
          {activeSubTab === 'specs' && (
            <div className="space-y-6">
              <div className="bg-white p-5 rounded-xs border border-[#E3E5DF] space-y-4">
                <h3 className="text-sm font-bold text-[#244A3B] border-b border-[#E3E5DF] pb-2">
                  Origine & Méthode d'Extraction
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#292D29] mb-1">
                      Nom Botanique (Latin)
                    </label>
                    <input
                      type="text"
                      value={draft.botanicalName || ''}
                      onChange={(e) => setDraft({ ...draft, botanicalName: e.target.value })}
                      placeholder="ex. Rosmarinus officinalis L."
                      className="w-full py-2 px-3 bg-[#FAF9F5] border border-[#E3E5DF] rounded-xs text-xs text-[#292D29] italic focus:border-[#244A3B] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#292D29] mb-1">
                      Terroir d'Origine
                    </label>
                    <input
                      type="text"
                      value={draft.origin || ''}
                      onChange={(e) => setDraft({ ...draft, origin: e.target.value })}
                      placeholder="ex. Djebel Ouarsenis, Algérie"
                      className="w-full py-2 px-3 bg-[#FAF9F5] border border-[#E3E5DF] rounded-xs text-xs text-[#292D29] focus:border-[#244A3B] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#292D29] mb-1">
                      Méthode d'extraction (FR)
                    </label>
                    <input
                      type="text"
                      value={draft.extractionMethod?.fr || ''}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          extractionMethod: {
                            fr: e.target.value,
                            ar: draft.extractionMethod?.ar || '',
                          },
                        })
                      }
                      placeholder="ex. Distillation à la vapeur d'eau"
                      className="w-full py-2 px-3 bg-[#FAF9F5] border border-[#E3E5DF] rounded-xs text-xs text-[#292D29] focus:border-[#244A3B] focus:outline-none"
                    />
                  </div>

                  <div dir="rtl">
                    <label className="block text-xs font-semibold text-[#292D29] mb-1 text-right">
                      طريقة الاستخلاص (بالعربية)
                    </label>
                    <input
                      type="text"
                      dir="rtl"
                      value={draft.extractionMethod?.ar || ''}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          extractionMethod: {
                            fr: draft.extractionMethod?.fr || '',
                            ar: e.target.value,
                          },
                        })
                      }
                      placeholder="مثال: التقطير الكامل ببخار الماء"
                      className="w-full py-2 px-3 bg-[#FAF9F5] border border-[#E3E5DF] rounded-xs text-xs text-[#292D29] focus:border-[#244A3B] focus:outline-none text-right font-sans"
                    />
                  </div>
                </div>
              </div>

              {/* Lab Parameters */}
              <div className="bg-white p-5 rounded-xs border border-[#E3E5DF] space-y-4">
                <h3 className="text-sm font-bold text-[#244A3B] border-b border-[#E3E5DF] pb-2">
                  Paramètres Analytiques & Fiche Technique
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#292D29] mb-1">
                      Numéro CAS
                    </label>
                    <input
                      type="text"
                      value={draft.specifications?.casNumber || ''}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          specifications: { ...draft.specifications, casNumber: e.target.value },
                        })
                      }
                      placeholder="ex. 8000-25-7"
                      className="w-full py-2 px-3 bg-[#FAF9F5] border border-[#E3E5DF] rounded-xs text-xs text-[#292D29] font-mono focus:border-[#244A3B] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#292D29] mb-1">
                      Densité à 20°C
                    </label>
                    <input
                      type="text"
                      value={draft.specifications?.density || ''}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          specifications: { ...draft.specifications, density: e.target.value },
                        })
                      }
                      placeholder="ex. 0.895 - 0.920"
                      className="w-full py-2 px-3 bg-[#FAF9F5] border border-[#E3E5DF] rounded-xs text-xs text-[#292D29] font-mono focus:border-[#244A3B] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#292D29] mb-1">
                      Indice de réfraction
                    </label>
                    <input
                      type="text"
                      value={draft.specifications?.refractiveIndex || ''}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          specifications: { ...draft.specifications, refractiveIndex: e.target.value },
                        })
                      }
                      placeholder="ex. 1.464 - 1.472"
                      className="w-full py-2 px-3 bg-[#FAF9F5] border border-[#E3E5DF] rounded-xs text-xs text-[#292D29] font-mono focus:border-[#244A3B] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#292D29] mb-1">
                      Profil Olfactif / Aromatique (FR)
                    </label>
                    <input
                      type="text"
                      value={draft.specifications?.aromaProfile?.fr || ''}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          specifications: {
                            ...draft.specifications,
                            aromaProfile: {
                              fr: e.target.value,
                              ar: draft.specifications?.aromaProfile?.ar || '',
                            },
                          },
                        })
                      }
                      placeholder="ex. Frais, camphré, herbacé franc"
                      className="w-full py-2 px-3 bg-[#FAF9F5] border border-[#E3E5DF] rounded-xs text-xs text-[#292D29] focus:border-[#244A3B] focus:outline-none"
                    />
                  </div>

                  <div dir="rtl">
                    <label className="block text-xs font-semibold text-[#292D29] mb-1 text-right">
                      الملامح العطرية (بالعربية)
                    </label>
                    <input
                      type="text"
                      dir="rtl"
                      value={draft.specifications?.aromaProfile?.ar || ''}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          specifications: {
                            ...draft.specifications,
                            aromaProfile: {
                              fr: draft.specifications?.aromaProfile?.fr || '',
                              ar: e.target.value,
                            },
                          },
                        })
                      }
                      placeholder="مثال: منعش، كافوري، عشبي أصيل"
                      className="w-full py-2 px-3 bg-[#FAF9F5] border border-[#E3E5DF] rounded-xs text-xs text-[#292D29] focus:border-[#244A3B] focus:outline-none text-right font-sans"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </form>

        {/* Modal Footer (Action Buttons) */}
        <div className="bg-white px-4 py-3 sm:px-6 sm:py-4 border-t border-[#E3E5DF] flex flex-col-reverse items-stretch gap-2 shrink-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-4 py-2 border border-[#E3E5DF] text-[#6D746E] hover:text-[#292D29] hover:bg-[#FAF9F5] text-xs font-semibold rounded-xs transition-colors cursor-pointer"
          >
            Annuler les modifications
          </button>

          <div className="flex w-full items-center gap-3 sm:w-auto">
            <button
              type="submit"
              form="product-edit-form"
              disabled={isSubmitting}
              className="inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-xs bg-[#244A3B] px-6 py-2.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-[#1C3A2E] disabled:opacity-50 sm:w-auto cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Enregistrement en cours...' : 'Enregistrer le produit'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
