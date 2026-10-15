import React, { useState, useMemo } from 'react';
import { CategorySlug, Locale, Product } from '../../types';
import { getDictionary } from '../../lib/i18n';
import { ProductCard } from './ProductCard';
import { Search, SlidersHorizontal, RotateCcw } from 'lucide-react';

interface ShopViewProps {
  products: Product[];
  locale: Locale;
  selectedCategory: string | null;
  onSelectCategory: (cat: string | null) => void;
  onSelectProduct: (product: Product) => void;
  onQuickAdd: (product: Product) => void;
}

export const ShopView: React.FC<ShopViewProps> = ({
  products,
  locale,
  selectedCategory,
  onSelectCategory,
  onSelectProduct,
  onQuickAdd,
}) => {
  const t = getDictionary(locale);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'default' | 'price-asc' | 'price-desc' | 'name'>('default');
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'retail' | 'quote'>('all');

  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        // Only published products in public store
        if (p.status !== 'published') return false;

        // Category filter
        if (selectedCategory && p.categoryId !== selectedCategory) return false;

        // Availability filter
        if (availabilityFilter === 'retail') {
          const hasPurchasable = p.variants.some((v) => v.isActive && v.isPurchasableOnline);
          if (!hasPurchasable) return false;
        } else if (availabilityFilter === 'quote') {
          const onlyQuote = p.variants.every((v) => !v.isPurchasableOnline || v.priceDZD === null);
          if (!onlyQuote) return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const frName = p.translations.fr.name.toLowerCase();
          const arName = p.translations.ar.name.toLowerCase();
          const botanical = (p.botanicalName || '').toLowerCase();
          const sku = p.sku.toLowerCase();
          const origin = (p.origin || '').toLowerCase();

          return (
            frName.includes(q) ||
            arName.includes(q) ||
            botanical.includes(q) ||
            sku.includes(q) ||
            origin.includes(q)
          );
        }

        return true;
      })
      .sort((a, b) => {
        const aPrice = a.variants.find((v) => v.isPurchasableOnline)?.priceDZD ?? 999999;
        const bPrice = b.variants.find((v) => v.isPurchasableOnline)?.priceDZD ?? 999999;

        if (sortBy === 'price-asc') return aPrice - bPrice;
        if (sortBy === 'price-desc') return bPrice - aPrice;
        if (sortBy === 'name') {
          const aName = a.translations[locale]?.name || a.translations.fr.name;
          const bName = b.translations[locale]?.name || b.translations.fr.name;
          return aName.localeCompare(bName);
        }
        return 0;
      });
  }, [products, selectedCategory, availabilityFilter, searchQuery, sortBy, locale]);

  const resetAll = () => {
    setSearchQuery('');
    onSelectCategory(null);
    setAvailabilityFilter('all');
    setSortBy('default');
  };

  return (
    <div className="py-10 bg-[#F8F7F2]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header & Page Title */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="text-xs uppercase font-mono tracking-wider text-[#829477] font-medium">
                CATALOGUE FLORAXION · 35 RÉFÉRENCES
              </span>
              <h1 className="font-serif-botanical text-3xl sm:text-4xl font-bold text-[#244A3B] mt-1">
                {selectedCategory === 'essential-oils'
                  ? t.nav.essentialOils
                  : selectedCategory === 'vegetable-oils'
                  ? t.nav.vegetableOils
                  : selectedCategory === 'hydrolats'
                  ? t.nav.hydrolats
                  : t.catalog.title}
              </h1>
            </div>

            <div className="text-xs text-[#6D746E] font-medium tabular-nums">
              {filteredProducts.length} {t.catalog.showingCount}
            </div>
          </div>
        </div>

        {/* Filter & Search Toolbar */}
        <div className="bg-white p-4 sm:p-5 rounded-xs border border-[#E3E5DF] shadow-xs mb-8 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
            {/* Search Input */}
            <div className="lg:col-span-5 relative">
              <Search className="w-4 h-4 text-[#829477] absolute start-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.catalog.searchPlaceholder}
                className="w-full ps-9 pe-4 py-2.5 bg-[#FAF9F5] border border-[#E3E5DF] focus:border-[#244A3B] focus:outline-none rounded-xs text-xs text-[#292D29] transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-xs text-[#6D746E] hover:text-[#292D29]"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Category Segmented Control */}
            <div className="lg:col-span-5 flex flex-wrap gap-1.5">
              <button
                onClick={() => onSelectCategory(null)}
                className={`px-3 py-1.5 text-xs font-medium rounded-xs transition-colors cursor-pointer ${
                  selectedCategory === null
                    ? 'bg-[#244A3B] text-white'
                    : 'bg-[#FAF9F5] text-[#292D29] hover:bg-[#EAE7DC]'
                }`}
              >
                {t.catalog.allCategories}
              </button>
              <button
                onClick={() => onSelectCategory('essential-oils')}
                className={`px-3 py-1.5 text-xs font-medium rounded-xs transition-colors cursor-pointer ${
                  selectedCategory === 'essential-oils'
                    ? 'bg-[#244A3B] text-white'
                    : 'bg-[#FAF9F5] text-[#292D29] hover:bg-[#EAE7DC]'
                }`}
              >
                {t.nav.essentialOils} (28)
              </button>
              <button
                onClick={() => onSelectCategory('vegetable-oils')}
                className={`px-3 py-1.5 text-xs font-medium rounded-xs transition-colors cursor-pointer ${
                  selectedCategory === 'vegetable-oils'
                    ? 'bg-[#244A3B] text-white'
                    : 'bg-[#FAF9F5] text-[#292D29] hover:bg-[#EAE7DC]'
                }`}
              >
                {t.nav.vegetableOils} (5)
              </button>
              <button
                onClick={() => onSelectCategory('hydrolats')}
                className={`px-3 py-1.5 text-xs font-medium rounded-xs transition-colors cursor-pointer ${
                  selectedCategory === 'hydrolats'
                    ? 'bg-[#244A3B] text-white'
                    : 'bg-[#FAF9F5] text-[#292D29] hover:bg-[#EAE7DC]'
                }`}
              >
                {t.nav.hydrolats} (2)
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className="lg:col-span-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full py-2.5 px-3 bg-[#FAF9F5] border border-[#E3E5DF] focus:border-[#244A3B] rounded-xs text-xs text-[#292D29] cursor-pointer"
              >
                <option value="default">{t.catalog.sortDefault}</option>
                <option value="price-asc">{t.catalog.sortPriceAsc}</option>
                <option value="price-desc">{t.catalog.sortPriceDesc}</option>
                <option value="name">{t.catalog.sortName}</option>
              </select>
            </div>
          </div>

          {/* Active Filter Indicators & Reset */}
          {(selectedCategory || searchQuery || availabilityFilter !== 'all') && (
            <div className="pt-3 border-t border-[#E3E5DF] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-[#6D746E]">
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#829477]" />
                <span>Filtres actifs :</span>
                {selectedCategory && (
                  <span className="text-[#244A3B] font-semibold">
                    {selectedCategory}
                  </span>
                )}
                {searchQuery && (
                  <span className="text-[#244A3B] font-semibold">
                    « {searchQuery} »
                  </span>
                )}
              </div>

              <button
                onClick={resetAll}
                className="text-xs font-medium text-[#244A3B] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{t.catalog.resetFilters}</span>
              </button>
            </div>
          )}
        </div>

        {/* Product Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-white border border-[#E3E5DF] rounded-xs p-8">
            <p className="font-serif-botanical text-2xl text-[#244A3B] font-semibold mb-2">
              {t.catalog.noResults}
            </p>
            <p className="text-xs text-[#6D746E] max-w-md mx-auto mb-6">
              Essayez d’ajuster vos termes de recherche ou sélectionnez une autre catégorie parmi les 35 références disponibles.
            </p>
            <button
              onClick={resetAll}
              className="px-5 py-2.5 bg-[#244A3B] text-white text-xs font-semibold rounded-xs hover:bg-[#1C3A2E] cursor-pointer"
            >
              {t.catalog.resetFilters}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredProducts.map((prod) => (
              <ProductCard
                key={prod.id}
                product={prod}
                locale={locale}
                onSelect={onSelectProduct}
                onQuickAdd={onQuickAdd}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
