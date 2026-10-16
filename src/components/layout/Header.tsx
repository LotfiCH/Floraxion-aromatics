import React, { useState } from 'react';
import { Locale } from '../../types';
import { getDictionary } from '../../lib/i18n';
import { ShoppingBag, Menu, X, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  locale: Locale;
  setLocale: (l: Locale) => void;
  activeView: string;
  setActiveView: (view: string) => void;
  cartCount: number;
  openCart: () => void;
  selectedCategory: string | null;
  setSelectedCategory: (cat: string | null) => void;
}

export const Header: React.FC<HeaderProps> = ({
  locale,
  setLocale,
  activeView,
  setActiveView,
  cartCount,
  openCart,
  selectedCategory: _selectedCategory,
  setSelectedCategory,
}) => {
  const t = getDictionary(locale);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigateTo = (view: string, category: string | null = null) => {
    setActiveView(view);
    setSelectedCategory(category);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleLanguage = () => {
    const nextLocale: Locale = locale === 'fr' ? 'ar' : 'fr';
    setLocale(nextLocale);
    document.documentElement.lang = nextLocale;
    document.documentElement.dir = nextLocale === 'ar' ? 'rtl' : 'ltr';
  };

  return (
    <header className="sticky top-0 z-40 bg-[#F8F7F2]/95 backdrop-blur-md border-b border-[#E3E5DF] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 h-18">
          {/* Zone 1: Brand Wordmark */}
          <button
            onClick={() => navigateTo('home')}
            className="flex items-baseline gap-2 shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#244A3B] rounded-xs py-1"
            aria-label="Floraxion Aromatics"
          >
            <span className="font-serif-botanical text-2xl sm:text-3xl font-semibold tracking-tight text-[#244A3B] leading-none">
              Floraxion
            </span>
            <span className="text-[10px] sm:text-[11px] tracking-widest uppercase font-medium text-[#829477] hidden sm:inline leading-none">
              Aromatics
            </span>
          </button>

          {/* Zone 2: Streamlined 3 Navigation Buttons - Reduced, Clean, No Dropdown */}
          <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-[#292D29]">
            {/* 1. Nos Produits: Combines all three product categories in one place */}
            <button
              onClick={() => navigateTo('shop', null)}
              className={`transition-colors whitespace-nowrap cursor-pointer py-1.5 border-b-2 ${
                activeView === 'shop'
                  ? 'text-[#244A3B] font-semibold border-[#244A3B]'
                  : 'text-[#292D29]/75 hover:text-[#244A3B] border-transparent'
              }`}
            >
              {t.nav.shop}
            </button>

            {/* 2. Devis B2B: Shortened from lengthy name */}
            <button
              onClick={() => navigateTo('b2b')}
              className={`transition-colors whitespace-nowrap cursor-pointer py-1.5 border-b-2 ${
                activeView === 'b2b'
                  ? 'text-[#244A3B] font-semibold border-[#244A3B]'
                  : 'text-[#292D29]/75 hover:text-[#244A3B] border-transparent'
              }`}
            >
              {t.nav.b2b}
            </button>

            {/* 3. À propos: Renamed from Maison Floraxion */}
            <button
              onClick={() => navigateTo('about')}
              className={`transition-colors whitespace-nowrap cursor-pointer py-1.5 border-b-2 ${
                activeView === 'about'
                  ? 'text-[#244A3B] font-semibold border-[#244A3B]'
                  : 'text-[#292D29]/75 hover:text-[#244A3B] border-transparent'
              }`}
            >
              {t.nav.about}
            </button>
          </nav>

          {/* Zone 3: Perfectly Aligned Utility Buttons Cluster (All uniform height h-9) */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Language Switcher Button (Height 36px / h-9) */}
            <button
              onClick={toggleLanguage}
              className="h-9 px-3 text-xs font-semibold rounded-xs border border-[#E3E5DF] bg-[#FAF9F5] hover:bg-white text-[#244A3B] hover:border-[#244A3B] transition-colors cursor-pointer inline-flex items-center justify-center shrink-0 shadow-2xs"
              title={locale === 'fr' ? 'التبديل إلى اللغة العربية' : 'Passer au Français'}
              aria-label="Changer de langue"
            >
              <span className="font-semibold">
                {locale === 'fr' ? 'العربية' : 'Français'}
              </span>
            </button>

            {/* Admin Console Button (Height 36px / h-9) */}
            <button
              onClick={() => navigateTo('admin')}
              className={`h-9 px-3 text-xs font-medium rounded-xs transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5 shrink-0 border shadow-2xs ${
                activeView === 'admin'
                  ? 'bg-[#244A3B] text-white border-[#244A3B]'
                  : 'border-[#E3E5DF] bg-[#FAF9F5] hover:bg-white text-[#292D29] hover:text-[#244A3B] hover:border-[#244A3B]'
              }`}
              title="Console d’administration"
              aria-label="Console d’administration"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.nav.admin}</span>
            </button>

            {/* Cart Button (Height 36px / h-9, matching alignment) */}
            <button
              onClick={openCart}
              className="h-9 px-3 text-xs font-semibold rounded-xs border border-[#244A3B] bg-[#244A3B] hover:bg-[#1C3A2E] text-white transition-colors cursor-pointer inline-flex items-center justify-center gap-2 shrink-0 shadow-2xs"
              aria-label={`${t.nav.cart} (${cartCount})`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">{t.nav.cart}</span>
              {cartCount > 0 ? (
                <span className="bg-white text-[#244A3B] text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none tabular-nums">
                  {cartCount}
                </span>
              ) : (
                <span className="bg-[#1C3A2E] text-[#F4F1E8]/90 text-[10px] font-medium px-1.5 py-0.5 rounded-full leading-none tabular-nums hidden sm:inline">
                  0
                </span>
              )}
            </button>

            {/* Mobile Menu Toggle Button (Height 36px / h-9) */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden h-9 w-9 inline-flex items-center justify-center rounded-xs border border-[#E3E5DF] bg-[#FAF9F5] text-[#292D29] hover:bg-white hover:border-[#244A3B] transition-colors cursor-pointer shrink-0 shadow-2xs"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Collapsible Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#E3E5DF] bg-[#F8F7F2] px-6 py-5 space-y-3">
          <div className="flex flex-col space-y-2 text-base font-medium">
            <button
              onClick={() => navigateTo('home')}
              className={`text-start py-2 px-2 rounded-xs transition-colors ${
                activeView === 'home' ? 'text-[#244A3B] font-semibold bg-[#244A3B]/5' : 'text-[#292D29] hover:text-[#244A3B]'
              }`}
            >
              {t.nav.home}
            </button>

            {/* Combined products view */}
            <button
              onClick={() => navigateTo('shop', null)}
              className={`text-start py-2 px-2 rounded-xs transition-colors flex items-center justify-between ${
                activeView === 'shop' ? 'text-[#244A3B] font-semibold bg-[#244A3B]/5' : 'text-[#292D29] hover:text-[#244A3B]'
              }`}
            >
              <span>{t.nav.shop}</span>
              <span className="text-xs text-[#829477] font-mono">45 refs</span>
            </button>

            {/* Shortened Devis B2B */}
            <button
              onClick={() => navigateTo('b2b')}
              className={`text-start py-2 px-2 rounded-xs transition-colors ${
                activeView === 'b2b' ? 'text-[#244A3B] font-semibold bg-[#244A3B]/5' : 'text-[#292D29] hover:text-[#244A3B]'
              }`}
            >
              {t.nav.b2b}
            </button>

            {/* Renamed À propos */}
            <button
              onClick={() => navigateTo('about')}
              className={`text-start py-2 px-2 rounded-xs transition-colors ${
                activeView === 'about' ? 'text-[#244A3B] font-semibold bg-[#244A3B]/5' : 'text-[#292D29] hover:text-[#244A3B]'
              }`}
            >
              {t.nav.about}
            </button>

            {/* Admin Console */}
            <button
              onClick={() => navigateTo('admin')}
              className={`text-start py-2 px-2 rounded-xs transition-colors flex items-center gap-2 pt-3 border-t border-[#E3E5DF] ${
                activeView === 'admin' ? 'text-[#244A3B] font-semibold' : 'text-[#244A3B] hover:text-[#1C3A2E]'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{t.nav.admin}</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
