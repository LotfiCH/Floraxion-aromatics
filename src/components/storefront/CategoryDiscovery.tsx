import React from 'react';
import { Locale } from '../../types';
import { getDictionary } from '../../lib/i18n';
import { BotanicalIllustration } from '../ui/BotanicalIllustration';
import { ArrowRight } from 'lucide-react';

interface CategoryDiscoveryProps {
  locale: Locale;
  onSelectCategory: (categorySlug: string) => void;
}

export const CategoryDiscovery: React.FC<CategoryDiscoveryProps> = ({
  locale,
  onSelectCategory,
}) => {
  const t = getDictionary(locale);

  const categories = [
    {
      slug: 'essential-oils',
      name: t.nav.essentialOils,
      count: t.categoriesSection.essentialOilsCount,
      desc:
        locale === 'ar'
          ? 'زيوت أساسية نقية 100% مستخلصة بالتقطير بالبخار، كاملة النقاء دون أي إضافات.'
          : 'Distillats 100% purs et chémotypés, concentrés aromatiques d’une puissance thérapeutique intacte.',
      tag: 'lavender',
    },
    {
      slug: 'vegetable-oils',
      name: t.nav.vegetableOils,
      count: t.categoriesSection.vegetableOilsCount,
      desc:
        locale === 'ar'
          ? 'زيوت نباتية بكر معصورة على البارد من العصرة الأولى، غنية بالأحماض الدهنية والفيتامينات.'
          : 'Huiles vierges de première pression à froid d’Algérie, riches en stérols et acides gras essentiels.',
      tag: 'carrier_oil',
    },
    {
      slug: 'hydrolats',
      name: t.nav.hydrolats,
      count: t.categoriesSection.hydrolatsCount,
      desc:
        locale === 'ar'
          ? 'مياه أزهار نقية مقطرة طبيعياً من بتلات الورود وزهور النارنج الطازجة.'
          : 'Eaux florales aromatiques distillées au ratio 1:1, respectant la douceur des peaux délicates.',
      tag: 'rose_water',
    },
    {
      slug: 'olive-oils',
      name: t.nav.oliveOils,
      count: t.categoriesSection.oliveOilsCount,
      desc:
        locale === 'ar'
          ? 'زيوت زيتون بكر ممتاز معصورة على البارد من سيق وجرجرة، ومنكّهة بنقع الأعشاب العطرية.'
          : 'Grands crus de Sig, Djurdjura et Aurès extraits à froid, et infusions artisanales aux plantes sauvages.',
      tag: 'olive_oil',
    },
  ];

  return (
    <section className="py-16 sm:py-20 bg-[#F4F1E8]/50 border-b border-[#E3E5DF]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs uppercase tracking-widest text-[#829477] font-mono font-medium">
            ORIGINES & SAVOIR-FAIRE
          </span>
          <h2 className="font-serif-botanical text-2xl sm:text-4xl text-[#244A3B] font-semibold mt-2">
            {t.categoriesSection.title}
          </h2>
          <p className="text-sm text-[#6D746E] mt-2 leading-relaxed">
            {t.categoriesSection.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-6">
          {categories.map((cat) => (
            <div
              key={cat.slug}
              onClick={() => onSelectCategory(cat.slug)}
              className="group bg-[#F8F7F2] rounded-xs border border-[#E3E5DF] overflow-hidden hover:border-[#244A3B]/40 transition-all duration-300 hover:shadow-md cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="h-56 overflow-hidden">
                  <BotanicalIllustration
                    tag={cat.tag}
                    aspectRatio="wide"
                    className="w-full h-full"
                  />
                </div>
                <div className="p-6">
                  <span className="text-[11px] uppercase text-[#829477] tracking-wider block mb-1">
                    {cat.count}
                  </span>
                  <h3 className="font-serif-botanical text-xl font-bold text-[#244A3B] group-hover:text-[#1C3A2E] transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-[#6D746E] leading-relaxed mt-2.5">
                    {cat.desc}
                  </p>
                </div>
              </div>

              <div className="px-6 pb-6 pt-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#244A3B] group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform">
                  <span>{t.categoriesSection.viewCategory}</span>
                  <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
