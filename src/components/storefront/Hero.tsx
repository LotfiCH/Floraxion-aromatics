import React from 'react';
import { Locale } from '../../types';
import { getDictionary } from '../../lib/i18n';
import { BotanicalIllustration } from '../ui/BotanicalIllustration';
import { ArrowRight, FileText, CheckCircle2 } from 'lucide-react';

interface HeroProps {
  locale: Locale;
  onExplore: () => void;
  onRequestQuote: () => void;
}

export const Hero: React.FC<HeroProps> = ({ locale, onExplore, onRequestQuote }) => {
  const t = getDictionary(locale);

  return (
    <section className="relative overflow-hidden bg-[#F8F7F2] border-b border-[#E3E5DF] py-12 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Text & Editorial Authority */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 text-xs tracking-widest text-[#829477] uppercase">
              <span className="w-6 h-px bg-[#829477]" />
              <span>{t.hero.eyebrow}</span>
            </div>

            <h1 className="font-serif-botanical text-3xl sm:text-5xl lg:text-5.5xl text-[#244A3B] font-semibold leading-[1.12] tracking-tight">
              {t.hero.title}
            </h1>

            <p className="text-base sm:text-lg text-[#292D29]/80 max-w-2xl leading-relaxed font-normal">
              {t.hero.description}
            </p>

            {/* Primary Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <button
                onClick={onExplore}
                className="px-6 py-3.5 bg-[#244A3B] hover:bg-[#1C3A2E] text-white text-xs font-semibold tracking-wider uppercase rounded-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <span>{t.hero.ctaShop}</span>
                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </button>

              <button
                onClick={onRequestQuote}
                className="px-6 py-3.5 bg-transparent hover:bg-black/5 text-[#244A3B] border border-[#244A3B]/40 hover:border-[#244A3B] text-xs font-semibold tracking-wider uppercase rounded-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>{t.hero.ctaQuote}</span>
              </button>
            </div>

            {/* Botanical Trust Markers */}
            <div className="pt-6 border-t border-[#E3E5DF] grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-[#292D29]/90 font-medium">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#829477] shrink-0" />
                <span>{t.hero.trustItem1}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#829477] shrink-0" />
                <span>{t.hero.trustItem2}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#829477] shrink-0" />
                <span>{t.hero.trustItem3}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Visual Apothecary Display */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Main Featured Vessel Showcase */}
              <div className="rounded-sm overflow-hidden border border-[#E3E5DF] shadow-lg bg-white">
                <BotanicalIllustration
                  tag="rosemary"
                  aspectRatio="portrait"
                  className="w-full h-[360px] sm:h-[420px]"
                />
              </div>

              {/* Inset Distillation Badge Card */}
              <div className="absolute -bottom-6 -start-6 bg-[#FAF9F5] border border-[#E3E5DF] p-4 rounded-xs shadow-md hidden sm:block max-w-[210px]">
                <p className="text-[10px] font-mono uppercase tracking-wider text-[#829477]">
                  DISTILLATION TRADITIONNELLE
                </p>
                <p className="font-serif-botanical text-sm font-semibold text-[#244A3B] mt-1">
                  Alambic Cuivre & Basse Pression
                </p>
                <p className="text-[11px] text-[#6D746E] mt-1 leading-tight">
                  Respect absolu de la fraction volatile des molécules végétales.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
