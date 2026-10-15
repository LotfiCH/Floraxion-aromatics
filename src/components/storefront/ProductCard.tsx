import React from 'react';
import { Locale, Product } from '../../types';
import { formatDZD } from '../../lib/commerce';
import { BotanicalIllustration } from '../ui/BotanicalIllustration';
import { Eye, Plus } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  locale: Locale;
  onSelect: (product: Product) => void;
  onQuickAdd?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  locale,
  onSelect,
  onQuickAdd,
}) => {
  const trans = product.translations[locale] || product.translations.fr;
  const firstPurchasable = product.variants.find((v) => v.isActive && v.isPurchasableOnline);
  const startingPrice = firstPurchasable?.priceDZD ?? null;

  return (
    <div
      onClick={() => onSelect(product)}
      className="group bg-[#F8F7F2] rounded-xs border border-[#E3E5DF] overflow-hidden hover:border-[#244A3B]/40 hover:shadow-md transition-all duration-300 flex flex-col justify-between cursor-pointer"
    >
      <div>
        {/* Product Image taking ~65% of height */}
        <div className="relative aspect-[4/3] overflow-hidden bg-white/40">
          <BotanicalIllustration
            tag={product.imageTag}
            aspectRatio="square"
            className="w-full h-full"
          />

          {/* Quick action overlay on hover */}
          <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelect(product);
              }}
              className="p-2.5 bg-white text-[#244A3B] hover:bg-[#F4F1E8] rounded-xs shadow-md transition-colors"
              title="Consulter la fiche"
              aria-label="Consulter la fiche"
            >
              <Eye className="w-4 h-4" />
            </button>
            {firstPurchasable && onQuickAdd && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onQuickAdd(product);
                }}
                className="p-2.5 bg-[#244A3B] text-white hover:bg-[#1C3A2E] rounded-xs shadow-md transition-colors"
                title="Ajouter au panier"
                aria-label="Ajouter au panier"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Content Details */}
        <div className="p-4 sm:p-5">
          {/* Subtle unboxed category metadata (no pills!) */}
          <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase text-[#829477] tracking-wider mb-1.5">
            <span>
              {product.categoryId === 'essential-oils'
                ? locale === 'ar' ? 'زيت أساسي' : 'Huile Essentielle'
                : product.categoryId === 'vegetable-oils'
                ? locale === 'ar' ? 'زيت نباتي' : 'Huile Végétale'
                : locale === 'ar' ? 'مقطر زهري' : 'Hydrolat'}
            </span>
            <span aria-hidden="true">·</span>
            <span>{product.sku}</span>
          </div>

          <h3 className="font-serif-botanical text-base sm:text-lg font-semibold text-[#292D29] group-hover:text-[#244A3B] transition-colors line-clamp-1">
            {trans.name}
          </h3>

          {product.botanicalName && (
            <p className="text-[12px] text-[#6D746E] italic line-clamp-1 mt-0.5 font-normal">
              {product.botanicalName}
            </p>
          )}

          <p className="text-xs text-[#292D29]/70 line-clamp-2 mt-2 leading-relaxed">
            {trans.shortDescription}
          </p>
        </div>
      </div>

      {/* Footer Price & Availability */}
      <div className="px-4 sm:px-5 pb-4 pt-2 border-t border-[#E3E5DF]/60 flex items-baseline justify-between">
        <div>
          {startingPrice !== null ? (
            <div>
              <span className="text-[10px] text-[#6D746E] block font-mono">
                {locale === 'ar' ? 'ابتداءً من' : 'À partir de'}
              </span>
              <span className="text-sm font-semibold text-[#244A3B] tabular-nums">
                {formatDZD(startingPrice, locale)}
              </span>
            </div>
          ) : (
            <span className="text-xs font-medium text-[#829477]">
              {locale === 'ar' ? 'تسعير على الطلب (B2B)' : 'Sur devis / Vrac'}
            </span>
          )}
        </div>

        <span className="text-xs font-semibold text-[#244A3B] group-hover:underline">
          {locale === 'ar' ? 'عرض التفاصيل ←' : 'Découvrir →'}
        </span>
      </div>
    </div>
  );
};
