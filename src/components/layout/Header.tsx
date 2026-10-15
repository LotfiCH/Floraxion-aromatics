import React, { useState, useRef, useEffect } from 'react';
import { Locale } from '../../types';
import { getDictionary } from '../../lib/i18n';
import { ShoppingBag, Menu, X, ShieldCheck, ChevronDown } from 'lucide-react';

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
  selectedCategory,
  setSelectedCategory,
}) => {
  const t = getDictionary(locale);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [productsDropdownOpen, setProductsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const navigateTo = (view: string, category: string | null = null) => {
    setActiveView(view);
    setSelectedCategory(category);
    setMobileMenuOpen(false);
    setProductsDropdownOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleLanguage = () => {
    const nextLocale: Locale = locale === 'fr' ? 'ar' : 'fr';
    setLocale(nextLocale);
    document.documentElement.lang = nextLocale;
    document.documentElement.dir = nextLocale === 'ar' ? 'rtl' : 'ltr';
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProductsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-[#F8F7F2]/95 backdrop-blur-md border-b border-[#E3E5DF] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-6 sm:gap-8 h-18">
          {/* Zone 1: Brand Wordmark (Vertically centered) */}
          <button
            onClick={() => navigateTo('home')}
            className="flex items-center gap-2 shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#244A3B] rounded-sm py-1"
          >
            <span className="font-serif-botanical text-2xl sm:text-3xl font-semibold tracking-tight text-[#244A3B] leading-none">
              Floraxion
            </span>
            <span className="text-[11px] tracking-widest uppercase font-medium text-[#829477] hidden sm:inline leading-none">
              Aromatics
            </span>
          </button>

          {/* Zone 2: Streamlined 3 Navigation Links */}
          <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-[#292D29]">
            {/* 1. Nos Produits with Dropdown */}
            <div
              ref={dropdownRef}
              className="relative"
              onMouseEnter={() => setProductsDropdownOpen(true)}
              onMouseLeave={() => setProductsDropdownOpen(false)}
            >
              <button
                onClick={() => navigateTo('shop', null)}
                className={`flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer py-1 ${
                  activeView === 'shop'
                    ? 'text-[#244A3B] font-semibold'
                    : 'text-[#292D29]/80 hover:text-[#244A3B]'
                }`}
                aria-expanded={productsDropdownOpen}
              >
                <span>{t.nav.shop}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-[#829477] transition-transform duration-200 ${
                    productsDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Dropdown Menu */}
              {productsDropdownOpen && (
                <div className="absolute start-0 top-full pt-2 w-64 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="bg-[#FAF9F5] border border-[#E3E5DF] rounded-xs shadow-lg py-2 divide-y divide-[#E3E5DF]/60 text-xs">
                    <button
                      onClick={() => navigateTo('shop', null)}
                      className={`w-full text-start px-4 py-2.5 transition-colors cursor-pointer flex items-center justify-between ${
                        activeView === 'shop' && !selectedCategory
                          ? 'bg-[#244A3B]/10 text-[#244A3B] font-semibold'
                          : 'hover:bg-black/5 text-[#292D29]'
                      }`}
                    >
                      <span>{t.nav.allProducts}</span>
                      <span className="font-mono text-[10px] text-[#829477]">35</span>
                    </button>

                    <button
                      onClick={() => navigateTo('shop', 'essential-oils')}
                      className={`w-full text-start px-4 py-2.5 transition-colors cursor-pointer flex items-center justify-between ${
                        activeView === 'shop' && selectedCategory === 'essential-oils'
                          ? 'bg-[#244A3B]/10 text-[#244A3B] font-semibold'
                          : 'hover:bg-black/5 text-[#292D29]'
                      }`}
                    >
                      <span>{t.nav.essentialOils}</span>
                      <span className="font-mono text-[10px] text-[#829477]">28</span>
                    </button>

                    <button
                      onClick={() => navigateTo('shop', 'vegetable-oils')}
                      className={`w-full text-start px-4 py-2.5 transition-colors cursor-pointer flex items-center justify-between ${
                        activeView === 'shop' && selectedCategory === 'vegetable-oils'
                          ? 'bg-[#244A3B]/10 text-[#244A3B] font-semibold'
                          : 'hover:bg-black/5 text-[#292D29]'
                      }`}
                    >
                      <span>{t.nav.vegetableOils}</span>
                      <span className="font-mono text-[10px] text-[#829477]">5</span>
                    </button>

                    <button
                      onClick={() => navigateTo('shop', 'hydrolats')}
                      className={`w-full text-start px-4 py-2.5 transition-colors cursor-pointer flex items-center justify-between ${
                        activeView === 'shop' && selectedCategory === 'hydrolats'
                          ? 'bg-[#244A3B]/10 text-[#244A3B] font-semibold'
                          : 'hover:bg-black/5 text-[#292D29]'
                      }`}
                    >
                      <span>{t.nav.hydrolats}</span>
                      <span className="font-mono text-[10px] text-[#829477]">2</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Espace Pro (Shortened) */}
            <button
              onClick={() => navigateTo('b2b')}
              className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer py-1 ${
                activeView === 'b2b'
                  ? 'text-[#244A3B] font-semibold'
                  : 'text-[#292D29]/80 hover:text-[#244A3B]'
              }`}
            >
              {t.nav.b2b}
            </button>

            {/* 3. À Propos (Renamed from Maison Floraxion) */}
            <button
              onClick={() => navigateTo('about')}
              className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer py-1 ${
                activeView === 'about'
                  ? 'text-[#244A3B] font-semibold'
                  : 'text-[#292D29]/80 hover:text-[#244A3B]'
              }`}
            >
              {t.nav.about}
            </button>
          </nav>

          {/* Zone 3: Perfectly Aligned Utility Buttons Cluster */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            {/* Locale Switcher Button */}
            <button
              onClick={toggleLanguage}
              dir="ltr"
              className="h-9 px-3 text-xs font-semibold tracking-wider text-[#244A3B] border border-[#244A3B]/30 hover:border-[#244A3B] hover:bg-[#244A3B]/5 rounded-xs transition-colors cursor-pointer font-sans flex items-center justify-center shrink-0"
              title={locale === 'fr' ? 'التبديل إلى اللغة العربية' : 'Passer au Français'}
              aria-label="Changer de langue"
            >
              {locale === 'fr' ? 'العربية · AR' : 'Français · FR'}
            </button>

            {/* Admin Console Button */}
            <button
              onClick={() => navigateTo('admin')}
              className={`h-9 px-3 text-xs font-medium rounded-xs transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 border ${
                activeView === 'admin'
                  ? 'bg-[#244A3B] text-white border-[#244A3B]'
                  : 'border-transparent text-[#6D746E] hover:text-[#244A3B] hover:bg-black/5 hover:border-[#E3E5DF]'
              }`}
              title="Console d’administration"
              aria-label="Console d’administration"
            >
              <ShieldCheck className="w-4 h-4" />
              <span className="hidden sm:inline">{t.nav.admin}</span>
            </button>

            {/* Cart Button with Live Counter */}
            <button
              onClick={openCart}
              className="h-9 w-9 text-[#244A3B] hover:bg-[#244A3B]/5 rounded-xs transition-colors cursor-pointer flex items-center justify-center relative shrink-0 border border-transparent hover:border-[#E3E5DF]"
              aria-label={`${t.nav.cart} (${cartCount})`}
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute top-1 -right-1 bg-[#244A3B] text-white text-[10px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center tabular-nums leading-none">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden h-9 w-9 flex items-center justify-center text-[#292D29] hover:bg-black/5 rounded-xs transition-colors cursor-pointer shrink-0"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Collapsible Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#E3E5DF] bg-[#F8F7F2] px-6 py-6 space-y-4">
          <div className="flex flex-col space-y-3 text-base font-medium">
            <button
              onClick={() => navigateTo('home')}
              className="text-start py-2 text-[#292D29] hover:text-[#244A3B]"
            >
              {t.nav.home}
            </button>

            <div className="border-t border-b border-[#E3E5DF] py-3 space-y-2">
              <button
                onClick={() => navigateTo('shop', null)}
                className="text-start font-semibold text-[#244A3B] flex items-center justify-between w-full"
              >
                <span>{t.nav.shop}</span>
                <span className="font-mono text-xs text-[#829477]">35 refs</span>
              </button>
              <button
                onClick={() => navigateTo('shop', 'essential-oils')}
                className="text-start ps-3 text-sm text-[#6D746E] hover:text-[#244A3B] block w-full py-1"
              >
                — {t.nav.essentialOils}
              </button>
              <button
                onClick={() => navigateTo('shop', 'vegetable-oils')}
                className="text-start ps-3 text-sm text-[#6D746E] hover:text-[#244A3B] block w-full py-1"
              >
                — {t.nav.vegetableOils}
              </button>
              <button
                onClick={() => navigateTo('shop', 'hydrolats')}
                className="text-start ps-3 text-sm text-[#6D746E] hover:text-[#244A3B] block w-full py-1"
              >
                — {t.nav.hydrolats}
              </button>
            </div>

            <button
              onClick={() => navigateTo('b2b')}
              className="text-start py-2 text-[#292D29] hover:text-[#244A3B]"
            >
              {t.nav.b2b}
            </button>

            <button
              onClick={() => navigateTo('about')}
              className="text-start py-2 text-[#292D29] hover:text-[#244A3B]"
            >
              {t.nav.about}
            </button>

            <button
              onClick={() => navigateTo('admin')}
              className="text-start py-2 text-[#244A3B] font-semibold flex items-center gap-2 pt-2 border-t border-[#E3E5DF]"
            >
              <ShieldCheck className="w-4 h-4" />
              {t.nav.admin}
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
