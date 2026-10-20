import React, { useState } from 'react';
import { Locale, Product, ProductVariant } from '../../types';
import { getDictionary } from '../../lib/i18n';
import { formatDZD } from '../../lib/commerce';
import { BotanicalIllustration } from '../ui/BotanicalIllustration';
import {
  ArrowLeft,
  Check,
  FileDown,
  ShoppingBag,
  ShieldCheck,
  Truck,
  Building2,
  Minus,
  Plus,
} from 'lucide-react';

interface ProductDetailProps {
  product: Product;
  allProducts: Product[];
  locale: Locale;
  onBack: () => void;
  onAddToCart: (product: Product, variant: ProductVariant, quantity: number) => void;
  onRequestQuoteForProduct: (product: Product, variant?: ProductVariant) => void;
  onSelectRelated: (product: Product) => void;
}

export const ProductDetail: React.FC<ProductDetailProps> = ({
  product,
  allProducts,
  locale,
  onBack,
  onAddToCart,
  onRequestQuoteForProduct,
  onSelectRelated,
}) => {
  const t = getDictionary(locale);
  const trans = product.translations[locale] || product.translations.fr;

  // Active variant selection
  const defaultVariant = product.variants.find((v) => v.isActive) || product.variants[0];
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant>(defaultVariant);
  const [quantity, setQuantity] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'desc' | 'specs' | 'docs'>('desc');
  const [addedFeedback, setAddedFeedback] = useState<boolean>(false);

  const handleAdd = () => {
    if (!selectedVariant || !selectedVariant.isPurchasableOnline) return;
    onAddToCart(product, selectedVariant, quantity);
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 2200);
  };

  const relatedProducts = allProducts
    .filter((p) => p.categoryId === product.categoryId && p.id !== product.id)
    .slice(0, 3);

  return (
    <div className="py-8 sm:py-12 bg-[#F8F7F2]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation Breadcrumbs */}
        <nav className="flex items-center gap-2 text-xs text-[#6D746E] mb-8 font-medium">
          <button
            onClick={onBack}
            className="hover:text-[#244A3B] flex items-center gap-1 cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
            <span>{t.nav.shop}</span>
          </button>
          <span aria-hidden="true">/</span>
          <span className="text-[#829477] uppercase font-mono">
            {product.categoryId === 'essential-oils'
              ? t.nav.essentialOils
              : product.categoryId === 'vegetable-oils'
              ? t.nav.vegetableOils
              : product.categoryId === 'olive-oils'
              ? t.nav.oliveOils
              : t.nav.hydrolats}
          </span>
          <span aria-hidden="true">/</span>
          <span className="text-[#292D29] font-semibold truncate max-w-xs">{trans.name}</span>
        </nav>

        {/* Main Contiguous Purchase Grid (Sticky Purchase Module) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          {/* Left: Gallery & Botanical Showcase */}
          <div className="lg:col-span-6 space-y-4">
            <div className="rounded-sm overflow-hidden border border-[#E3E5DF] shadow-sm bg-white">
              <BotanicalIllustration
                tag={product.imageTag}
                imageUrl={product.imageUrl}
                aspectRatio="square"
                className="w-full h-[400px] sm:h-[480px]"
              />
            </div>

            {/* Quality Seals Bar */}
            <div className="bg-[#FAF8F3] border border-[#E3E5DF] p-4 rounded-xs grid grid-cols-2 gap-3 text-xs text-[#292D29]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#244A3B] shrink-0" />
                <span>100% Pur & Chémotypé</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#244A3B] shrink-0" />
                <span>Expédition 58 Wilayas</span>
              </div>
            </div>
          </div>

          {/* Right: Contiguous Purchase Module */}
          <div className="lg:col-span-6 space-y-6">
            <div>
              {/* Unboxed SKU & Category header */}
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#829477] mb-2">
                <span>{product.sku}</span>
                <span aria-hidden="true">·</span>
                <span>{product.origin || 'Algérie'}</span>
              </div>

              <h1 className="font-serif-botanical text-2xl sm:text-4xl font-bold text-[#244A3B] leading-tight">
                {trans.name}
              </h1>

              {product.botanicalName && (
                <p className="text-sm sm:text-base text-[#6D746E] italic mt-1 font-serif">
                  {product.botanicalName}
                </p>
              )}
            </div>

            {/* Price Presentation */}
            <div className="py-3 border-y border-[#E3E5DF] flex items-baseline justify-between">
              <div>
                {selectedVariant.priceDZD !== null ? (
                  <div className="flex items-baseline gap-2">
                    <span className="font-serif-botanical text-3xl font-bold text-[#244A3B] tabular-nums">
                      {formatDZD(selectedVariant.priceDZD, locale)}
                    </span>
                    <span className="text-xs text-[#6D746E]">
                      / {selectedVariant.sizeValue} {selectedVariant.sizeUnit}
                    </span>
                  </div>
                ) : (
                  <div>
                    <span className="text-lg font-semibold text-[#829477]">
                      {locale === 'ar' ? 'تسعير مخصص للكميات الصناعية' : 'Approvisionnement sur Devis'}
                    </span>
                    <p className="text-xs text-[#6D746E] mt-0.5">
                      Conditionnement en fûts ou conteneurs pour laboratoires et savonneries.
                    </p>
                  </div>
                )}
              </div>

              {/* Stock status */}
              <div className="text-end">
                {selectedVariant.isPurchasableOnline ? (
                  <span className="text-xs text-emerald-800 font-medium">
                    ● {locale === 'ar' ? 'متوفر بالمخزن' : 'En stock'}
                  </span>
                ) : (
                  <span className="text-xs text-[#829477] font-medium">
                    ● {locale === 'ar' ? 'طلب عرض سعر' : 'Réservé B2B'}
                  </span>
                )}
              </div>
            </div>

            {/* Short description */}
            <p className="text-sm text-[#292D29]/80 leading-relaxed font-normal">
              {trans.shortDescription}
            </p>

            {/* Variant / Pack Size Selector */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#292D29]">
                {t.product.chooseSize}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {product.variants.map((v) => {
                  const isSelected = selectedVariant.id === v.id;
                  return (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariant(v)}
                      className={`p-3 text-start border rounded-xs transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#244A3B] bg-[#244A3B]/5 ring-1 ring-[#244A3B]'
                          : 'border-[#E3E5DF] bg-white hover:border-[#829477]'
                      }`}
                    >
                      <div className="font-mono text-xs font-bold text-[#244A3B]">
                        {v.sizeValue} {v.sizeUnit}
                      </div>
                      <div className="text-[11px] text-[#6D746E] truncate mt-0.5">
                        {v.packagingLabel[locale] || v.packagingLabel.fr}
                      </div>
                      <div className="text-xs font-semibold text-[#292D29] mt-1 tabular-nums">
                        {formatDZD(v.priceDZD, locale)}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quantity Stepper & Buy Action Button */}
            {selectedVariant.isPurchasableOnline ? (
              <div className="pt-2 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center border border-[#E3E5DF] bg-white rounded-xs">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-3 text-[#6D746E] hover:text-[#292D29] cursor-pointer"
                      aria-label="Diminuer la quantité"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="px-4 text-sm font-semibold tabular-nums text-[#292D29]">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="p-3 text-[#6D746E] hover:text-[#292D29] cursor-pointer"
                      aria-label="Augmenter la quantité"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    onClick={handleAdd}
                    className="flex-1 py-3.5 px-6 bg-[#244A3B] hover:bg-[#1C3A2E] text-white text-xs font-semibold tracking-wider uppercase rounded-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                  >
                    {addedFeedback ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-300" />
                        <span>{locale === 'ar' ? 'تمت الإضافة للسلة !' : 'Ajouté au panier !'}</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-4 h-4" />
                        <span>{t.product.addToCart}</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Secondary Wholesale Inquiry for this product */}
                <button
                  onClick={() => onRequestQuoteForProduct(product, selectedVariant)}
                  className="w-full py-2.5 px-4 text-xs font-semibold text-[#244A3B] hover:bg-[#244A3B]/5 border border-[#244A3B]/30 rounded-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Building2 className="w-4 h-4" />
                  <span>{t.product.requestBulkQuote}</span>
                </button>
              </div>
            ) : (
              <div className="pt-2">
                <button
                  onClick={() => onRequestQuoteForProduct(product, selectedVariant)}
                  className="w-full py-3.5 px-6 bg-[#244A3B] hover:bg-[#1C3A2E] text-white text-xs font-semibold tracking-wider uppercase rounded-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <Building2 className="w-4 h-4" />
                  <span>{t.product.requestBulkQuote}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tabbed Technical Specifications & Factual Data */}
        <div className="mt-16 pt-10 border-t border-[#E3E5DF]">
          <div className="flex border-b border-[#E3E5DF] gap-8">
            <button
              onClick={() => setActiveTab('desc')}
              className={`pb-3 text-sm font-semibold cursor-pointer border-b-2 transition-colors ${
                activeTab === 'desc'
                  ? 'border-[#244A3B] text-[#244A3B]'
                  : 'border-transparent text-[#6D746E] hover:text-[#292D29]'
              }`}
            >
              {t.product.usageTab}
            </button>
            <button
              onClick={() => setActiveTab('specs')}
              className={`pb-3 text-sm font-semibold cursor-pointer border-b-2 transition-colors ${
                activeTab === 'specs'
                  ? 'border-[#244A3B] text-[#244A3B]'
                  : 'border-transparent text-[#6D746E] hover:text-[#292D29]'
              }`}
            >
              {t.product.specificationsTab}
            </button>
            <button
              onClick={() => setActiveTab('docs')}
              className={`pb-3 text-sm font-semibold cursor-pointer border-b-2 transition-colors ${
                activeTab === 'docs'
                  ? 'border-[#244A3B] text-[#244A3B]'
                  : 'border-transparent text-[#6D746E] hover:text-[#292D29]'
              }`}
            >
              {t.product.documentsTab} ({product.documents.length})
            </button>
          </div>

          <div className="py-8">
            {activeTab === 'desc' && (
              <div className="space-y-4 max-w-3xl">
                <p className="text-sm text-[#292D29] leading-relaxed">
                  {trans.description}
                </p>
                {product.extractionMethod && (
                  <div className="pt-2 text-xs">
                    <span className="font-semibold text-[#244A3B] block mb-1">
                      {t.product.extraction} :
                    </span>
                    <span className="text-[#6D746E]">
                      {product.extractionMethod[locale] || product.extractionMethod.fr}
                    </span>
                  </div>
                )}
                {product.storageInstructions && (
                  <div className="pt-2 text-xs">
                    <span className="font-semibold text-[#244A3B] block mb-1">
                      {t.product.storage} :
                    </span>
                    <span className="text-[#6D746E]">
                      {product.storageInstructions[locale] || product.storageInstructions.fr}
                    </span>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'specs' && (
              <div className="max-w-3xl">
                <table className="w-full text-xs text-start border border-[#E3E5DF] divide-y divide-[#E3E5DF]">
                  <tbody className="divide-y divide-[#E3E5DF]">
                    {product.botanicalName && (
                      <tr className="bg-white">
                        <td className="py-2.5 px-4 font-semibold text-[#244A3B] w-1/3">
                          {t.product.botanicalName}
                        </td>
                        <td className="py-2.5 px-4 text-[#292D29] italic font-serif">
                          {product.botanicalName}
                        </td>
                      </tr>
                    )}
                    {product.specifications?.casNumber && (
                      <tr className="bg-[#FAF9F5]">
                        <td className="py-2.5 px-4 font-semibold text-[#244A3B]">
                          {t.product.casNumber}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-[#292D29]">
                          {product.specifications.casNumber}
                        </td>
                      </tr>
                    )}
                    {product.origin && (
                      <tr className="bg-white">
                        <td className="py-2.5 px-4 font-semibold text-[#244A3B]">
                          {t.product.origin}
                        </td>
                        <td className="py-2.5 px-4 text-[#292D29]">{product.origin}</td>
                      </tr>
                    )}
                    {product.specifications?.appearance && (
                      <tr className="bg-[#FAF9F5]">
                        <td className="py-2.5 px-4 font-semibold text-[#244A3B]">
                          {t.product.appearance}
                        </td>
                        <td className="py-2.5 px-4 text-[#292D29]">
                          {product.specifications.appearance[locale] ||
                            product.specifications.appearance.fr}
                        </td>
                      </tr>
                    )}
                    {product.specifications?.aromaProfile && (
                      <tr className="bg-white">
                        <td className="py-2.5 px-4 font-semibold text-[#244A3B]">
                          {t.product.aromaProfile}
                        </td>
                        <td className="py-2.5 px-4 text-[#292D29]">
                          {product.specifications.aromaProfile[locale] ||
                            product.specifications.aromaProfile.fr}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'docs' && (
              <div className="max-w-2xl space-y-3">
                {product.documents.length === 0 ? (
                  <p className="text-xs text-[#6D746E]">
                    Les certificats d’analyse par lot GC-MS sont fournis sur demande avec chaque expédition professionnelle.
                  </p>
                ) : (
                  product.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-3.5 bg-white border border-[#E3E5DF] rounded-xs flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <FileDown className="w-5 h-5 text-[#244A3B]" />
                        <div>
                          <p className="text-xs font-semibold text-[#292D29]">
                            {doc.title[locale] || doc.title.fr}
                          </p>
                          <p className="text-[11px] text-[#6D746E] font-mono mt-0.5">
                            {doc.fileName} · {doc.fileSize}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          alert(`Téléchargement certifié : ${doc.fileName} (Authentifié laboratoire Floraxion)`)
                        }
                        className="text-xs font-semibold text-[#244A3B] hover:underline cursor-pointer"
                      >
                        {t.product.downloadDoc}
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16 pt-10 border-t border-[#E3E5DF]">
            <h3 className="font-serif-botanical text-2xl font-bold text-[#244A3B] mb-6">
              {t.product.relatedProducts}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {relatedProducts.map((rel) => {
                const relTrans = rel.translations[locale] || rel.translations.fr;
                const firstP = rel.variants.find((v) => v.isActive && v.isPurchasableOnline);
                return (
                  <div
                    key={rel.id}
                    onClick={() => {
                      onSelectRelated(rel);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="p-4 bg-white border border-[#E3E5DF] rounded-xs hover:border-[#244A3B] transition-all cursor-pointer flex gap-4 items-center"
                  >
                    <div className="w-16 h-16 shrink-0 rounded-xs overflow-hidden border border-[#E3E5DF]">
                      <BotanicalIllustration tag={rel.imageTag} className="w-full h-full p-1" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#292D29] truncate">
                        {relTrans.name}
                      </p>
                      <p className="text-[11px] text-[#6D746E] italic truncate">
                        {rel.botanicalName}
                      </p>
                      <p className="text-xs font-semibold text-[#244A3B] mt-1 tabular-nums">
                        {formatDZD(firstP?.priceDZD, locale)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
