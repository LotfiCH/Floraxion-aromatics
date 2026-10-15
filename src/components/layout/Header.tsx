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
  selectedCategory,
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
        <div className="flex items-center justify-between gap-8 h-18">
          {/* Zone 1: Single-element brand wordmark */}
          <button
            onClick={() => navigateTo('home')}
            className="text-left group flex items-baseline gap-2 shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#244A3B] rounded-sm"
          >
            <span className="font-serif-botanical text-2xl sm:text-3xl font-semibold tracking-tight text-[#244A3B]">
              Floraxion
            </span>
            <span className="text-xs tracking-widest uppercase font-medium text-[#829477] hidden sm:inline">
              Aromatics
            </span>
          </button>

          {/* Zone 2: 4-5 concise single-line text navigation links */}
          <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-[#292D29]">
            <button
              onClick={() => navigateTo('shop', null)}
              className={`hover:text-[#244A3B] transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-1 border-b-2 ${
                activeView === 'shop' && !selectedCategory ? 'border-[#244A3B] text-[#244A3B]' : 'border-transparent text-[#292D29]/80'
              }`}
            >
              {t.nav.shop}
            </button>
            <button
              onClick={() => navigateTo('shop', 'essential-oils')}
              className="hover:text-[#244A3B] transition-colors whitespace-nowrap shrink-0 cursor-pointer text-[#292D29]/80"
            >
              {t.nav.essentialOils}
            </button>
            <button
              onClick={() => navigateTo('shop', 'vegetable-oils')}
              className="hover:text-[#244A3B] transition-colors whitespace-nowrap shrink-0 cursor-pointer text-[#292D29]/80"
            >
              {t.nav.vegetableOils}
            </button>
            <button
              onClick={() => navigateTo('shop', 'hydrolats')}
              className="hover:text-[#244A3B] transition-colors whitespace-nowrap shrink-0 cursor-pointer text-[#292D29]/80"
            >
              {t.nav.hydrolats}
            </button>
            <button
              onClick={() => navigateTo('b2b')}
              className={`hover:text-[#244A3B] transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-1 border-b-2 ${
                activeView === 'b2b' ? 'border-[#244A3B] text-[#244A3B]' : 'border-transparent text-[#292D29]/80'
              }`}
            >
              {t.nav.b2b}
            </button>
            <button
              onClick={() => navigateTo('about')}
              className={`hover:text-[#244A3B] transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-1 border-b-2 ${
                activeView === 'about' ? 'border-[#244A3B] text-[#244A3B]' : 'border-transparent text-[#292D29]/80'
              }`}
            >
              {t.nav.about}
            </button>
          </nav>

          {/* Zone 3: 1 primary action / utility cluster */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            {/* Locale switcher */}
            <button
              onClick={toggleLanguage}
              dir="ltr"
              className="px-2.5 py-1 text-xs font-semibold tracking-wider text-[#244A3B] border border-[#244A3B]/30 hover:border-[#244A3B] hover:bg-[#244A3B]/5 rounded-xs transition-colors cursor-pointer font-sans"
              title={locale === 'fr' ? 'التبديل إلى اللغة العربية' : 'Passer au Français'}
              aria-label="Changer de langue"
            >
              {locale === 'fr' ? 'العربية · AR' : 'Français · FR'}
            </button>

            {/* Admin Console shortcut */}
            <button
              onClick={() => navigateTo('admin')}
              className={`p-2 text-xs font-medium rounded-sm transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeView === 'admin'
                  ? 'bg-[#244A3B] text-white'
                  : 'text-[#6D746E] hover:text-[#244A3B] hover:bg-black/5'
              }`}
              title="Console d’administration"
              aria-label="Console d’administration"
            >
              <ShieldCheck className="w-4 h-4" />
              <span className="hidden xl:inline">{t.nav.admin}</span>
            </button>

            {/* Cart Icon with Live Count */}
            <button
              onClick={openCart}
              className="relative p-2.5 text-[#244A3B] hover:bg-[#244A3B]/5 rounded-sm transition-colors cursor-pointer"
              aria-label={`${t.nav.cart} (${cartCount})`}
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute top-1.5 -right-1 bg-[#244A3B] text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center tabular-nums">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-[#292D29] hover:bg-black/5 rounded-sm transition-colors cursor-pointer"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
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
            <button
              onClick={() => navigateTo('shop', null)}
              className="text-start py-2 text-[#292D29] hover:text-[#244A3B]"
            >
              {t.nav.shop}
            </button>
            <button
              onClick={() => navigateTo('shop', 'essential-oils')}
              className="text-start py-2 ps-4 text-sm text-[#6D746E] hover:text-[#244A3B]"
            >
              — {t.nav.essentialOils} (28)
            </button>
            <button
              onClick={() => navigateTo('shop', 'vegetable-oils')}
              className="text-start py-2 ps-4 text-sm text-[#6D746E] hover:text-[#244A3B]"
            >
              — {t.nav.vegetableOils} (5)
            </button>
            <button
              onClick={() => navigateTo('shop', 'hydrolats')}
              className="text-start py-2 ps-4 text-sm text-[#6D746E] hover:text-[#244A3B]"
            >
              — {t.nav.hydrolats} (2)
            </button>
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
              className="text-start py-2 text-[#244A3B] font-semibold flex items-center gap-2"
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
