import React, { useState } from 'react';
import { Locale, Product, Quotation, QuotationItem, WilayaDeliveryRule } from '../../types';
import { getDictionary } from '../../lib/i18n';
import { storage } from '../../lib/storage';
import {
  Building2,
  FileText,
  Plus,
  Trash2,
  CheckCircle2,
  ShieldCheck,
  Package,
  FileCheck2,
} from 'lucide-react';

interface B2BQuoteViewProps {
  products: Product[];
  wilayas: WilayaDeliveryRule[];
  locale: Locale;
  preselectedProduct?: Product | null;
  onContinue: () => void;
}

export const B2BQuoteView: React.FC<B2BQuoteViewProps> = ({
  products,
  wilayas,
  locale,
  preselectedProduct,
  onContinue,
}) => {
  const t = getDictionary(locale);

  // Form Fields
  const [contactName, setContactName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [wilayaCode, setWilayaCode] = useState('09'); // Default Blida (cosmetics center)
  const [commune, setCommune] = useState('');
  const [address, setAddress] = useState('');
  const [activitySector, setActivitySector] = useState('Cosmétique & Soin');
  const [notes, setNotes] = useState('');

  // Initial Line items
  const [lineItems, setLineItems] = useState<
    Array<{
      productId: string;
      customName: string;
      packaging: string;
      quantity: number;
      unit: string;
    }>
  >([
    {
      productId: preselectedProduct ? preselectedProduct.id : products[0]?.id || '',
      customName: '',
      packaging: 'Bidon aluminium 1 kg',
      quantity: 5,
      unit: 'kg',
    },
  ]);

  const [submittedQuotation, setSubmittedQuotation] = useState<Quotation | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const addLine = () => {
    setLineItems([
      ...lineItems,
      {
        productId: products[0]?.id || '',
        customName: '',
        packaging: 'Fut de 25 kg',
        quantity: 1,
        unit: 'Fut',
      },
    ]);
  };

  const removeLine = (index: number) => {
    if (lineItems.length <= 1) return;
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const updateLine = (index: number, field: string, value: any) => {
    setLineItems(
      lineItems.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!contactName.trim() || !companyName.trim() || !phone.trim()) {
      setErrorMsg(
        locale === 'ar'
          ? 'يرجى استكمال البيانات الإلزامية (اسم المسؤول، المؤسسة، الهاتف).'
          : 'Veuillez renseigner tous les champs obligatoires (nom, entreprise, téléphone).'
      );
      return;
    }

    setIsSubmitting(true);

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const quotationNumber = `FLX-Q-${dateStr}-${randomSuffix}`;

    const selectedWilaya = wilayas.find((w) => w.code === wilayaCode) || wilayas[0];

    const finalItems: QuotationItem[] = lineItems.map((line, idx) => {
      const prod = products.find((p) => p.id === line.productId);
      const name = prod
        ? prod.translations[locale]?.name || prod.translations.fr.name
        : line.customName || 'Ingrédient sur mesure';

      return {
        id: `qi-${Date.now()}-${idx}`,
        productId: prod?.id,
        productName: name,
        variantLabel: line.packaging,
        requestedQuantity: Number(line.quantity) || 1,
        unit: line.unit,
      };
    });

    const quotation: Quotation = {
      id: `quote-${Date.now()}-${randomSuffix}`,
      quotationNumber,
      status: 'submitted',
      customer: {
        contactName: contactName.trim(),
        companyName: companyName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        wilayaCode: selectedWilaya.code,
        wilayaName: locale === 'ar' ? selectedWilaya.nameAr : selectedWilaya.nameFr,
        commune: commune.trim(),
        address: address.trim(),
        activitySector,
        notes: notes.trim(),
      },
      items: finalItems,
      currency: 'DZD',
      revisionNumber: 1,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    // Save to storage
    storage.addQuotation(quotation);

    setSubmittedQuotation(quotation);
    setIsSubmitting(false);
  };

  if (submittedQuotation) {
    return (
      <div className="py-16 bg-[#F8F7F2]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white border border-[#E3E5DF] rounded-xs p-8 sm:p-12 text-center space-y-4 shadow-xs">
            <div className="w-14 h-14 bg-[#244A3B]/10 text-[#244A3B] rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h2 className="font-serif-botanical text-3xl font-bold text-[#244A3B]">
              {t.b2b.quoteConfirmationTitle}
            </h2>

            <p className="text-sm text-[#6D746E] max-w-lg mx-auto">
              {t.b2b.quoteConfirmationSub}
            </p>

            <div className="py-3 px-4 bg-[#FAF9F5] border border-[#E3E5DF] rounded-xs font-mono text-xs text-[#244A3B] inline-block">
              Numéro de demande : <strong>{submittedQuotation.quotationNumber}</strong>
            </div>

            <div className="pt-6 border-t border-[#E3E5DF] text-start max-w-md mx-auto text-xs space-y-2">
              <p>
                <strong>Établissement :</strong> {submittedQuotation.customer.companyName}
              </p>
              <p>
                <strong>Contact :</strong> {submittedQuotation.customer.contactName} (
                {submittedQuotation.customer.phone})
              </p>
              <p>
                <strong>Lignes demandées :</strong> {submittedQuotation.items.length} références
              </p>
            </div>

            <div className="pt-6">
              <button
                onClick={onContinue}
                className="px-6 py-3 bg-[#244A3B] text-white text-xs font-semibold rounded-xs hover:bg-[#1C3A2E] cursor-pointer"
              >
                Retour au catalogue
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 bg-[#F8F7F2]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Editorial Introduction */}
        <div className="mb-12">
          <span className="text-xs uppercase font-mono tracking-wider text-[#829477] font-medium">
            APPROVISIONNEMENT EN GROS & VRAC EN ALGÉRIE
          </span>
          <h1 className="font-serif-botanical text-3xl sm:text-5xl font-bold text-[#244A3B] mt-1">
            {t.b2b.title}
          </h1>
          <p className="text-sm sm:text-base text-[#6D746E] max-w-3xl mt-2 leading-relaxed">
            {t.b2b.introText}
          </p>

          {/* Value Props Strip */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="bg-white p-5 border border-[#E3E5DF] rounded-xs">
              <ShieldCheck className="w-5 h-5 text-[#244A3B] mb-2" />
              <h3 className="font-serif-botanical text-base font-bold text-[#244A3B]">
                {t.b2b.feat1Title}
              </h3>
              <p className="text-xs text-[#6D746E] mt-1 leading-relaxed">{t.b2b.feat1Desc}</p>
            </div>
            <div className="bg-white p-5 border border-[#E3E5DF] rounded-xs">
              <Package className="w-5 h-5 text-[#244A3B] mb-2" />
              <h3 className="font-serif-botanical text-base font-bold text-[#244A3B]">
                {t.b2b.feat2Title}
              </h3>
              <p className="text-xs text-[#6D746E] mt-1 leading-relaxed">{t.b2b.feat2Desc}</p>
            </div>
            <div className="bg-white p-5 border border-[#E3E5DF] rounded-xs">
              <FileCheck2 className="w-5 h-5 text-[#244A3B] mb-2" />
              <h3 className="font-serif-botanical text-base font-bold text-[#244A3B]">
                {t.b2b.feat3Title}
              </h3>
              <p className="text-xs text-[#6D746E] mt-1 leading-relaxed">{t.b2b.feat3Desc}</p>
            </div>
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-white border border-[#E3E5DF] rounded-xs p-6 sm:p-10 shadow-xs">
          <div className="border-b border-[#E3E5DF] pb-4 mb-6">
            <h2 className="font-serif-botanical text-2xl font-bold text-[#244A3B]">
              {t.b2b.formTitle}
            </h2>
            <p className="text-xs text-[#6D746E] mt-0.5">
              Remplissez les informations ci-dessous pour recevoir une offre de prix personnalisée.
            </p>
          </div>

          {errorMsg && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xs">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Business Contact Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-semibold text-[#292D29] mb-1">
                  {t.b2b.contactName} *
                </label>
                <input
                  type="text"
                  required
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="ex: Dr. Amine Larbi"
                  className="w-full p-2.5 bg-[#FAF9F5] border border-[#E3E5DF] focus:border-[#244A3B] rounded-xs text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#292D29] mb-1">
                  {t.b2b.companyName} *
                </label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="ex: Laboratoires Bio-Atlas SARL"
                  className="w-full p-2.5 bg-[#FAF9F5] border border-[#E3E5DF] focus:border-[#244A3B] rounded-xs text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#292D29] mb-1">
                  {t.b2b.activitySector}
                </label>
                <select
                  value={activitySector}
                  onChange={(e) => setActivitySector(e.target.value)}
                  className="w-full p-2.5 bg-[#FAF9F5] border border-[#E3E5DF] focus:border-[#244A3B] rounded-xs text-xs cursor-pointer"
                >
                  <option value="Cosmétique & Soin">{t.b2b.sectorCosmetics}</option>
                  <option value="Pharmacie & Parapharmacie">{t.b2b.sectorPharmacy}</option>
                  <option value="Savonnerie & Hygiène">{t.b2b.sectorSoap}</option>
                  <option value="Agroalimentaire & Arômes">{t.b2b.sectorFood}</option>
                  <option value="Autre secteur">{t.b2b.sectorOther}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#292D29] mb-1">
                  {t.b2b.email} *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="pro@entreprise.dz"
                  className="w-full p-2.5 bg-[#FAF9F5] border border-[#E3E5DF] focus:border-[#244A3B] rounded-xs text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#292D29] mb-1">
                  {t.b2b.phone} *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0661 00 00 00"
                  className="w-full p-2.5 bg-[#FAF9F5] border border-[#E3E5DF] focus:border-[#244A3B] rounded-xs text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#292D29] mb-1">
                  {t.b2b.wilaya} *
                </label>
                <select
                  value={wilayaCode}
                  onChange={(e) => setWilayaCode(e.target.value)}
                  className="w-full p-2.5 bg-[#FAF9F5] border border-[#E3E5DF] focus:border-[#244A3B] rounded-xs text-xs cursor-pointer"
                >
                  {wilayas.map((w) => (
                    <option key={w.code} value={w.code}>
                      {w.code} - {locale === 'ar' ? w.nameAr : w.nameFr}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Line Items Builder */}
            <div className="space-y-4 pt-4 border-t border-[#E3E5DF]">
              <div className="flex items-center justify-between">
                <h3 className="font-serif-botanical text-lg font-bold text-[#244A3B]">
                  {t.b2b.lineItemsTitle}
                </h3>
                <button
                  type="button"
                  onClick={addLine}
                  className="px-3 py-1.5 bg-[#FAF9F5] hover:bg-[#EAE7DC] text-[#244A3B] border border-[#E3E5DF] text-xs font-semibold rounded-xs flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t.b2b.addProductLine}</span>
                </button>
              </div>

              <div className="space-y-3">
                {lineItems.map((line, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-[#FAF9F5] border border-[#E3E5DF] rounded-xs grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
                  >
                    <div className="sm:col-span-5">
                      <label className="block text-[10px] font-mono uppercase text-[#6D746E] mb-1">
                        {t.b2b.productName}
                      </label>
                      <select
                        value={line.productId}
                        onChange={(e) => updateLine(idx, 'productId', e.target.value)}
                        className="w-full p-2 bg-white border border-[#E3E5DF] rounded-xs text-xs"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.sku} - {p.translations[locale]?.name || p.translations.fr.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-4">
                      <label className="block text-[10px] font-mono uppercase text-[#6D746E] mb-1">
                        {t.b2b.packagingOrUnit}
                      </label>
                      <input
                        type="text"
                        value={line.packaging}
                        onChange={(e) => updateLine(idx, 'packaging', e.target.value)}
                        placeholder="Bidon 1kg / Fût 25kg / Vrac"
                        className="w-full p-2 bg-white border border-[#E3E5DF] rounded-xs text-xs"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-mono uppercase text-[#6D746E] mb-1">
                        {t.b2b.quantity}
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={line.quantity}
                        onChange={(e) => updateLine(idx, 'quantity', e.target.value)}
                        className="w-full p-2 bg-white border border-[#E3E5DF] rounded-xs text-xs font-mono"
                      />
                    </div>

                    <div className="sm:col-span-1 text-end pt-4 sm:pt-0">
                      {lineItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeLine(idx)}
                          className="p-2 text-[#6D746E] hover:text-red-700 cursor-pointer"
                          title="Supprimer la ligne"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Additional Specifications / Terms */}
            <div className="pt-2">
              <label className="block text-xs font-semibold text-[#292D29] mb-1">
                {t.b2b.notes}
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Précisez ici vos fréquences d’approvisionnement, exigences particulières de certificats d’analyses, ou contraintes logistiques..."
                className="w-full p-3 bg-[#FAF9F5] border border-[#E3E5DF] focus:border-[#244A3B] rounded-xs text-xs"
              />
            </div>

            {/* Submission Action */}
            <div className="pt-4 border-t border-[#E3E5DF] flex items-center justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="py-3.5 px-8 bg-[#244A3B] hover:bg-[#1C3A2E] text-white text-xs font-semibold tracking-wider uppercase rounded-xs transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <FileText className="w-4 h-4" />
                <span>{isSubmitting ? 'Envoi en cours...' : t.b2b.submitQuote}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
