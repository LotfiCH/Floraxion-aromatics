import React from 'react';
import { Locale } from '../../types';
import { getDictionary } from '../../lib/i18n';

interface FooterProps {
  locale: Locale;
  setActiveView: (view: string) => void;
  setSelectedCategory: (cat: string | null) => void;
}

export const Footer: React.FC<FooterProps> = ({ locale, setActiveView, setSelectedCategory }) => {
  const t = getDictionary(locale);
  const currentYear = new Date().getFullYear();

  const handleNav = (view: string, cat: string | null = null) => {
    setActiveView(view);
    setSelectedCategory(cat);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#244A3B] text-[#F4F1E8] border-t border-[#1C3A2E] mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Col 1: Brand & Plantaxion Ecosystem */}
          <div className="space-y-4">
            <div className="flex flex-col">
              <span className="font-serif-botanical text-2xl font-bold tracking-tight text-white">
                Floraxion Aromatics
              </span>
              <span className="text-xs uppercase tracking-widest text-[#829477] font-medium mt-1">
                {t.brand.ecosystem}
              </span>
            </div>
            <p className="text-sm text-[#F4F1E8]/80 leading-relaxed">
              {t.footer.brandDesc}
            </p>
            <div className="text-xs text-[#F4F1E8]/60 space-y-1 pt-2 font-mono">
              <p>SARL Floraxion Aromatics</p>
              <p>NIF : 002116098765432 · RC : 16/00-0987654B21</p>
              <p>Zone Industrielle Oued Smar, Alger</p>
            </div>
          </div>

          {/* Col 2: Catalogue Navigation */}
          <div>
            <h4 className="text-xs uppercase tracking-widest text-[#829477] font-semibold mb-4">
              {t.footer.linksTitle}
            </h4>
            <ul className="space-y-2.5 text-sm text-[#F4F1E8]/80">
              <li>
                <button
                  onClick={() => handleNav('shop', null)}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  {t.nav.shop} (35 références)
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('shop', 'essential-oils')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  {t.nav.essentialOils} (28)
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('shop', 'vegetable-oils')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  {t.nav.vegetableOils} (5)
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('shop', 'hydrolats')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  {t.nav.hydrolats} (2)
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('b2b')}
                  className="hover:text-white transition-colors cursor-pointer text-[#829477] font-medium"
                >
                  {t.nav.b2b}
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Practical & Legal Policies */}
          <div>
            <h4 className="text-xs uppercase tracking-widest text-[#829477] font-semibold mb-4">
              {t.footer.policiesTitle}
            </h4>
            <ul className="space-y-2.5 text-sm text-[#F4F1E8]/80">
              <li>
                <button
                  onClick={() => handleNav('shipping')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  {t.footer.shippingPolicy}
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('returns')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  {t.footer.returnsPolicy}
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('terms')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  {t.footer.termsPolicy}
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('legal')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  {t.footer.legalNotice}
                </button>
              </li>
              <li className="pt-2 border-t border-[#1C3A2E]">
                <button
                  onClick={() => handleNav('admin')}
                  className="text-xs font-semibold text-[#829477] hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                >
                  <span>🔐 {locale === 'ar' ? 'بوابة إدارة الموقع والطلبيات' : 'Accès Administration & Commandes'}</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Verified Contact Coordinates */}
          <div>
            <h4 className="text-xs uppercase tracking-widest text-[#829477] font-semibold mb-4">
              {t.footer.contactInfo}
            </h4>
            <div className="space-y-3 text-sm text-[#F4F1E8]/80">
              <p>
                <span className="block text-xs text-[#829477] uppercase font-mono">Service Clients & Commandes :</span>
                <span className="font-mono text-[#F4F1E8]">+213 (0) 23 92 10 40</span>
              </p>
              <p>
                <span className="block text-xs text-[#829477] uppercase font-mono">Département B2B & Vrac :</span>
                <span className="font-mono text-[#F4F1E8]">pro@floraxion.dz</span>
              </p>
              <p className="text-xs text-[#F4F1E8]/70 pt-2">
                Horaires d’accueil : Dimanche au Jeudi, de 08h30 à 16h30.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright & System disclaimer */}
        <div className="border-t border-[#1C3A2E] mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-[#F4F1E8]/60 gap-4">
          <p>© {currentYear} {t.footer.copyright}</p>
          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span>Algérie · Dinar Algérien (DZD)</span>
            <span>·</span>
            <span>Catalogue 35 SKUs certifié</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
