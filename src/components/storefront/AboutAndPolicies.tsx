import React from 'react';
import { Locale, SiteSettings } from '../../types';
import { getDictionary } from '../../lib/i18n';
import { formatDZD } from '../../lib/commerce';
import { ArrowLeft, ShieldCheck, Truck, RotateCcw, FileText, Scale } from 'lucide-react';

interface PolicyViewProps {
  viewType: 'about' | 'shipping' | 'returns' | 'terms' | 'legal';
  locale: Locale;
  settings: SiteSettings;
  onBack: () => void;
}

export const AboutAndPoliciesView: React.FC<PolicyViewProps> = ({
  viewType,
  locale,
  settings,
  onBack,
}) => {
  const t = getDictionary(locale);

  return (
    <div className="py-12 bg-[#F8F7F2]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#244A3B] hover:underline mb-8 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
          <span>{locale === 'ar' ? 'العودة' : 'Retour'}</span>
        </button>

        <div className="bg-white border border-[#E3E5DF] rounded-xs p-8 sm:p-12 shadow-xs space-y-8">
          {/* ABOUT FLORAXION */}
          {viewType === 'about' && (
            <div className="space-y-6">
              <div className="border-b border-[#E3E5DF] pb-4">
                <span className="text-xs uppercase font-mono tracking-wider text-[#829477]">
                  NOTRE HISTOIRE & TERROIRS
                </span>
                <h1 className="font-serif-botanical text-3xl sm:text-4xl font-bold text-[#244A3B] mt-1">
                  {t.about.title}
                </h1>
                <p className="text-sm text-[#6D746E] mt-1">{t.about.subtitle}</p>
              </div>

              <div className="space-y-6 text-sm text-[#292D29] leading-relaxed">
                <div className="p-4 bg-[#FAF9F5] border border-[#E3E5DF] rounded-xs">
                  <h2 className="font-serif-botanical text-xl font-bold text-[#244A3B] mb-2">
                    {t.about.section1Title}
                  </h2>
                  <p>{t.about.section1Text}</p>
                </div>

                <div>
                  <h2 className="font-serif-botanical text-xl font-bold text-[#244A3B] mb-2">
                    {t.about.section2Title}
                  </h2>
                  <p>{t.about.section2Text}</p>
                </div>

                <div>
                  <h2 className="font-serif-botanical text-xl font-bold text-[#244A3B] mb-2">
                    {t.about.section3Title}
                  </h2>
                  <p>{t.about.section3Text}</p>
                </div>
              </div>
            </div>
          )}

          {/* SHIPPING POLICY */}
          {viewType === 'shipping' && (
            <div className="space-y-6">
              <div className="border-b border-[#E3E5DF] pb-4">
                <div className="flex items-center gap-2 text-[#244A3B] mb-1">
                  <Truck className="w-5 h-5" />
                  <span className="text-xs uppercase font-mono tracking-wider text-[#829477]">
                    EXPÉDITION NATIONALE
                  </span>
                </div>
                <h1 className="font-serif-botanical text-3xl font-bold text-[#244A3B]">
                  Politique de Livraison à Domicile (58 Wilayas)
                </h1>
              </div>

              <div className="space-y-4 text-xs text-[#292D29] leading-relaxed">
                <p>
                  Floraxion Aromatics assure l’acheminement sécurisé de vos ingrédients botaniques à travers l'ensemble des 58 wilayas d’Algérie, grâce à nos partenaires de messagerie express agréés.
                </p>

                <div className="p-4 bg-[#FAF9F5] border border-[#E3E5DF] rounded-xs space-y-2">
                  <h3 className="font-bold text-sm text-[#244A3B]">
                    Gratuité des Frais de Livraison
                  </h3>
                  <p>
                    La livraison est entièrement offerte pour toute commande d’un montant égal ou supérieur à{' '}
                    <strong className="text-[#244A3B] font-mono">
                      {formatDZD(settings.freeShippingThresholdDZD, locale)}
                    </strong>
                    , sans restriction de wilaya.
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-bold text-sm text-[#244A3B]">
                    Délais d'acheminement indicatifs
                  </h3>
                  <ul className="list-disc list-inside space-y-1 text-[#6D746E]">
                    <li><strong>Zone 1 (Alger, Blida, Tipaza, Boumerdès) :</strong> 24 heures.</li>
                    <li><strong>Zone 2 (Grandes métropoles Nord & Côtières) :</strong> 24 à 48 heures.</li>
                    <li><strong>Zone 3 (Hauts Plateaux & Intérieur) :</strong> 48 à 72 heures.</li>
                    <li><strong>Zone 4 (Grand Sud & Oasis sahariennes) :</strong> 3 à 5 jours ouvrés.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* RETURNS POLICY */}
          {viewType === 'returns' && (
            <div className="space-y-6">
              <div className="border-b border-[#E3E5DF] pb-4">
                <div className="flex items-center gap-2 text-[#244A3B] mb-1">
                  <RotateCcw className="w-5 h-5" />
                  <span className="text-xs uppercase font-mono tracking-wider text-[#829477]">
                    CONFORMITÉ & GARANTIES
                  </span>
                </div>
                <h1 className="font-serif-botanical text-3xl font-bold text-[#244A3B]">
                  Conditions de Retour & Réclamations Qualité
                </h1>
              </div>

              <div className="space-y-4 text-xs text-[#292D29] leading-relaxed">
                <p>
                  En raison de la nature sensible et périssable des huiles essentielles pures et des distillats sans conservateurs, les retours obéissent à des règles d'hygiène et de sécurité strictes.
                </p>
                <div className="p-4 bg-[#FAF9F5] border border-[#E3E5DF] rounded-xs space-y-2">
                  <h3 className="font-bold text-sm text-[#244A3B]">
                    Droit de rétractation et scellé de garantie
                  </h3>
                  <p>
                    Tout flacon dont la bague d'inviolabilité ou le bouchon compte-gouttes a été descellé ne pourra faire l'objet d'une reprise ou d'un échange, afin de garantir l’intégrité chimique des lots.
                  </p>
                </div>
                <p>
                  En cas d’anomalie de transport ou de bris de verre constaté à l’ouverture du colis en présence du livreur, un remplacement immédiat est organisé par notre service client sans frais additionnels.
                </p>
              </div>
            </div>
          )}

          {/* TERMS & CONDITIONS (CGV) */}
          {viewType === 'terms' && (
            <div className="space-y-6">
              <div className="border-b border-[#E3E5DF] pb-4">
                <div className="flex items-center gap-2 text-[#244A3B] mb-1">
                  <Scale className="w-5 h-5" />
                  <span className="text-xs uppercase font-mono tracking-wider text-[#829477]">
                    CADRE CONTRACTUEL
                  </span>
                </div>
                <h1 className="font-serif-botanical text-3xl font-bold text-[#244A3B]">
                  Conditions Générales de Vente (CGV)
                </h1>
              </div>

              <div className="space-y-4 text-xs text-[#292D29] leading-relaxed">
                <p>
                  Les présentes conditions régissent les ventes conclues sur le site officiel de Floraxion Aromatics, conformément à la législation algérienne en vigueur régissant le commerce électronique (Loi n° 18-05 relative au commerce électronique).
                </p>
                <h3 className="font-bold text-sm text-[#244A3B]">Prix et Devise</h3>
                <p>
                  Tous nos prix sont exprimés en Dinars Algériens (DZD) nets. Les prix appliqués sont ceux affichés lors de la validation ferme de la commande.
                </p>
                <h3 className="font-bold text-sm text-[#244A3B]">Usage Thérapeutique & Recommandations</h3>
                <p>
                  Les informations botaniques et descriptives présentées sont purement informatives et ne sauraient constituer un diagnostic ou une prescription médicale. Les huiles essentielles pures nécessitent des précautions d’emploi spécifiques et un avis professionnel qualifié.
                </p>
              </div>
            </div>
          )}

          {/* LEGAL NOTICE */}
          {viewType === 'legal' && (
            <div className="space-y-6">
              <div className="border-b border-[#E3E5DF] pb-4">
                <div className="flex items-center gap-2 text-[#244A3B] mb-1">
                  <FileText className="w-5 h-5" />
                  <span className="text-xs uppercase font-mono tracking-wider text-[#829477]">
                    REGISTRE DU COMMERCE & FISCALITÉ
                  </span>
                </div>
                <h1 className="font-serif-botanical text-3xl font-bold text-[#244A3B]">
                  Mentions Légales & Fiscales
                </h1>
              </div>

              <div className="space-y-4 text-xs text-[#292D29] leading-relaxed">
                <div className="p-4 bg-[#FAF9F5] border border-[#E3E5DF] rounded-xs space-y-2 font-mono text-[11px]">
                  <p><strong>Raison Sociale :</strong> {settings.companyName}</p>
                  <p><strong>Siège Social :</strong> {settings.address}</p>
                  <p><strong>Numéro d'Identification Fiscale (NIF) :</strong> {settings.nif}</p>
                  <p><strong>Numéro d'Identification Statistique (NIS) :</strong> {settings.nis}</p>
                  <p><strong>Registre du Commerce (RC) :</strong> {settings.rc}</p>
                  <p><strong>Téléphone Direction :</strong> {settings.phone}</p>
                  <p><strong>Courriel Officiel :</strong> {settings.email}</p>
                </div>
                <p>
                  Protection des données personnelles : Conformément à la loi algérienne n° 18-07 relative à la protection des personnes physiques dans le traitement des données à caractère personnel, vos coordonnées sont exclusivement réservées au traitement de vos commandes et devis.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
