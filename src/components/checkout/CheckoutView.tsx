import React, { useState } from 'react';
import {
  CartItem,
  CustomerAddress,
  Locale,
  Order,
  PaymentMethod,
  SiteSettings,
  WilayaDeliveryRule,
} from '../../types';
import { getDictionary } from '../../lib/i18n';
import {
  calculateCartTotals,
  calculateWilayaShippingFee,
  createOrderSnapshot,
  formatDZD,
} from '../../lib/commerce';
import { storage } from '../../lib/storage';
import { ArrowLeft, ShieldCheck, CreditCard, Banknote, Building, AlertCircle } from 'lucide-react';

interface CheckoutViewProps {
  items: CartItem[];
  locale: Locale;
  wilayas: WilayaDeliveryRule[];
  settings: SiteSettings;
  customerUid: string;
  onBackToCart: () => void;
  onOrderCompleted: (order: Order) => void;
}

export const CheckoutView: React.FC<CheckoutViewProps> = ({
  items,
  locale,
  wilayas,
  settings,
  customerUid,
  onBackToCart,
  onOrderCompleted,
}) => {
  const t = getDictionary(locale);

  // Form State
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [selectedWilayaCode, setSelectedWilayaCode] = useState('16'); // Default Alger
  const [commune, setCommune] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [isProfessional, setIsProfessional] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [taxNumber, setTaxNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank_transfer');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const selectedWilaya = wilayas.find((w) => w.code === selectedWilayaCode) || wilayas[0];

  // Price calculations
  const tempSubtotal = items.reduce((sum, i) => sum + i.unitPriceDZD * i.quantity, 0);
  const calculatedShipping = calculateWilayaShippingFee(
    selectedWilaya,
    tempSubtotal,
    settings.freeShippingThresholdDZD
  );
  const totals = calculateCartTotals(items, calculatedShipping, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validation
    if (!fullName.trim()) {
      setFormError(locale === 'ar' ? 'يرجى إدخال الاسم واللقب بالكامل.' : 'Veuillez saisir votre nom et prénom.');
      return;
    }
    if (!phone.trim() || phone.trim().length < 9) {
      setFormError(locale === 'ar' ? 'يرجى إدخال رقم هاتف محمول صالح للتواصل.' : 'Veuillez renseigner un numéro de téléphone mobile valide.');
      return;
    }
    if (!commune.trim()) {
      setFormError(locale === 'ar' ? 'يرجى إدخال البلدية أو المدينة.' : 'Veuillez préciser la commune de livraison.');
      return;
    }
    if (!streetAddress.trim()) {
      setFormError(locale === 'ar' ? 'يرجى إدخال عنوان التوصيل بالتفصيل.' : 'Veuillez préciser l’adresse exacte de livraison.');
      return;
    }
    if (items.length === 0) {
      setFormError(locale === 'ar' ? 'سلة الشراء فارغة.' : 'Votre panier est vide.');
      return;
    }

    setIsSubmitting(true);

    const customerAddress: CustomerAddress = {
      fullName: fullName.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      wilayaCode: selectedWilaya.code,
      wilayaName: locale === 'ar' ? selectedWilaya.nameAr : selectedWilaya.nameFr,
      commune: commune.trim(),
      streetAddress: streetAddress.trim(),
      deliveryNotes: deliveryNotes.trim() || undefined,
      companyName: isProfessional && companyName.trim() ? companyName.trim() : undefined,
      taxNumber: isProfessional && taxNumber.trim() ? taxNumber.trim() : undefined,
    };

    try {
      const order = {
        ...createOrderSnapshot({
          cartItems: items,
          customer: customerAddress,
          shippingFeeDZD: calculatedShipping,
          paymentMethod,
          customerNote: deliveryNotes.trim() || undefined,
        }),
        customerUid,
      };

      // Save to persistence
      storage.addOrder(order);

      // Clear cart
      storage.saveCart([]);

      onOrderCompleted(order);
    } catch (err: any) {
      setFormError(err.message || 'Erreur lors de la validation de commande.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-10 bg-[#F8F7F2]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={onBackToCart}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#244A3B] hover:underline mb-6 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
          <span>{locale === 'ar' ? 'العودة لتعديل السلة' : 'Retour au panier'}</span>
        </button>

        <div className="mb-8">
          <h1 className="font-serif-botanical text-3xl sm:text-4xl font-bold text-[#244A3B]">
            {t.checkout.title}
          </h1>
          <p className="text-xs sm:text-sm text-[#6D746E] mt-1">{t.checkout.subtitle}</p>
        </div>

        <div role="note" className="mb-6 flex items-start gap-3 border border-[#B68B48]/40 bg-[#B68B48]/10 p-4 text-[#5B513F]">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#9A743B]" aria-hidden="true" />
          <div>
            <p className="text-xs font-semibold">{t.checkout.reviewModeTitle}</p>
            <p className="mt-1 text-xs leading-relaxed">{t.checkout.reviewModeNotice}</p>
          </div>
        </div>

        {formError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xs flex items-center gap-3 text-red-800 text-xs font-medium">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Form: Delivery details & Payment selection */}
          <div className="lg:col-span-7 space-y-8">
            {/* Delivery address group */}
            <div className="bg-white p-6 rounded-xs border border-[#E3E5DF] shadow-xs space-y-4">
              <h2 className="font-serif-botanical text-lg font-bold text-[#244A3B] border-b border-[#E3E5DF] pb-3">
                {t.checkout.customerInfo}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#292D29] mb-1">
                    {t.checkout.fullName} *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="ex: Yacine Benali"
                    className="w-full p-2.5 bg-[#FAF9F5] border border-[#E3E5DF] focus:border-[#244A3B] focus:outline-none rounded-xs text-xs text-[#292D29]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#292D29] mb-1">
                    {t.checkout.phone} *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0550 12 34 56"
                    className="w-full p-2.5 bg-[#FAF9F5] border border-[#E3E5DF] focus:border-[#244A3B] focus:outline-none rounded-xs text-xs text-[#292D29] font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#292D29] mb-1">
                  {t.checkout.email}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contact@exemple.dz"
                  className="w-full p-2.5 bg-[#FAF9F5] border border-[#E3E5DF] focus:border-[#244A3B] focus:outline-none rounded-xs text-xs text-[#292D29]"
                />
              </div>

              {/* Wilaya Selection from all 58 Algerian Wilayas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-medium text-[#292D29] mb-1">
                    {t.checkout.wilaya} *
                  </label>
                  <select
                    value={selectedWilayaCode}
                    onChange={(e) => setSelectedWilayaCode(e.target.value)}
                    className="w-full p-2.5 bg-[#FAF9F5] border border-[#E3E5DF] focus:border-[#244A3B] focus:outline-none rounded-xs text-xs text-[#292D29] cursor-pointer"
                  >
                    {wilayas.map((w) => (
                      <option key={w.code} value={w.code}>
                        {w.code} - {locale === 'ar' ? w.nameAr : w.nameFr} ({w.feeDZD} DZD)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#292D29] mb-1">
                    {t.checkout.commune} *
                  </label>
                  <input
                    type="text"
                    required
                    value={commune}
                    onChange={(e) => setCommune(e.target.value)}
                    placeholder="ex: Cheraga / Hydra / Oran Centre"
                    className="w-full p-2.5 bg-[#FAF9F5] border border-[#E3E5DF] focus:border-[#244A3B] focus:outline-none rounded-xs text-xs text-[#292D29]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#292D29] mb-1">
                  {t.checkout.streetAddress} *
                </label>
                <textarea
                  rows={2}
                  required
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                  placeholder="Numéro de rue, bâtiment, quartier, repère pour le livreur..."
                  className="w-full p-2.5 bg-[#FAF9F5] border border-[#E3E5DF] focus:border-[#244A3B] focus:outline-none rounded-xs text-xs text-[#292D29]"
                />
              </div>

              {/* Professional Business Checkbox */}
              <div className="pt-2 border-t border-[#E3E5DF]">
                <label className="flex items-center gap-2 text-xs font-medium text-[#244A3B] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isProfessional}
                    onChange={(e) => setIsProfessional(e.target.checked)}
                    className="rounded-xs text-[#244A3B] focus:ring-[#244A3B]"
                  />
                  <span>{t.checkout.isProfessional}</span>
                </label>

                {isProfessional && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3 p-3 bg-[#FAF9F5] border border-[#E3E5DF] rounded-xs">
                    <div>
                      <label className="block text-[11px] font-medium text-[#292D29] mb-1">
                        {t.checkout.companyName} *
                      </label>
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="SARL / Pharmacie / Laboratoire"
                        className="w-full p-2 bg-white border border-[#E3E5DF] rounded-xs text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-[#292D29] mb-1">
                        {t.checkout.taxNumber}
                      </label>
                      <input
                        type="text"
                        value={taxNumber}
                        onChange={(e) => setTaxNumber(e.target.value)}
                        placeholder="NIF ou RC"
                        className="w-full p-2 bg-white border border-[#E3E5DF] rounded-xs text-xs font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="bg-white p-6 rounded-xs border border-[#E3E5DF] shadow-xs space-y-4">
              <h2 className="font-serif-botanical text-lg font-bold text-[#244A3B] border-b border-[#E3E5DF] pb-3">
                {t.checkout.paymentMethod}
              </h2>

              <div className="space-y-3">
                {/* Method 1: Bank Transfer (BNA / CCP) */}
                <label
                  className={`p-4 border rounded-xs flex items-start gap-3 cursor-pointer transition-colors ${
                    paymentMethod === 'bank_transfer'
                      ? 'border-[#244A3B] bg-[#244A3B]/5 ring-1 ring-[#244A3B]'
                      : 'border-[#E3E5DF] bg-[#FAF9F5]'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="bank_transfer"
                    checked={paymentMethod === 'bank_transfer'}
                    onChange={() => setPaymentMethod('bank_transfer')}
                    className="mt-1 text-[#244A3B] focus:ring-[#244A3B]"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-[#244A3B]" />
                      <span className="text-xs font-bold text-[#292D29]">
                        {t.checkout.bankTransfer}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#6D746E] leading-relaxed">
                      {t.checkout.bankTransferDesc}
                    </p>
                  </div>
                </label>

                {/* Method 2: Cash On Delivery */}
                {selectedWilaya.cashOnDeliveryAllowed ? (
                  <label
                    className={`p-4 border rounded-xs flex items-start gap-3 cursor-pointer transition-colors ${
                      paymentMethod === 'cash_on_delivery'
                        ? 'border-[#244A3B] bg-[#244A3B]/5 ring-1 ring-[#244A3B]'
                        : 'border-[#E3E5DF] bg-[#FAF9F5]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cash_on_delivery"
                      checked={paymentMethod === 'cash_on_delivery'}
                      onChange={() => setPaymentMethod('cash_on_delivery')}
                      className="mt-1 text-[#244A3B] focus:ring-[#244A3B]"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Banknote className="w-4 h-4 text-[#244A3B]" />
                        <span className="text-xs font-bold text-[#292D29]">
                          {t.checkout.cashOnDelivery}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#6D746E] leading-relaxed">
                        {t.checkout.cashOnDeliveryDesc}
                      </p>
                    </div>
                  </label>
                ) : (
                  <div className="p-3 bg-neutral-100 border border-[#E3E5DF] rounded-xs text-[11px] text-[#6D746E]">
                    {t.checkout.cashOnDeliveryUnavailable} ({locale === 'ar' ? selectedWilaya.nameAr : selectedWilaya.nameFr})
                  </div>
                )}

                {/* Method 3: Online Payment (Gated Demonstration Gateway) */}
                <label
                  className={`p-4 border rounded-xs flex items-start gap-3 cursor-pointer transition-colors ${
                    paymentMethod === 'online_card'
                      ? 'border-[#244A3B] bg-[#244A3B]/5 ring-1 ring-[#244A3B]'
                      : 'border-[#E3E5DF] bg-[#FAF9F5]'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="online_card"
                    checked={paymentMethod === 'online_card'}
                    onChange={() => setPaymentMethod('online_card')}
                    className="mt-1 text-[#244A3B] focus:ring-[#244A3B]"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-[#244A3B]" />
                      <span className="text-xs font-bold text-[#292D29]">
                        {t.checkout.onlineCard}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#6D746E] leading-relaxed">
                      {t.checkout.onlineCardDesc}
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Right Summary Column */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-6 rounded-xs border border-[#E3E5DF] shadow-xs space-y-4">
              <h2 className="font-serif-botanical text-lg font-bold text-[#244A3B] border-b border-[#E3E5DF] pb-3">
                {t.checkout.orderSummary} ({totals.itemCount} articles)
              </h2>

              {/* Items List */}
              <div className="divide-y divide-[#E3E5DF] max-h-60 overflow-y-auto">
                {items.map((i) => (
                  <div key={`${i.productId}-${i.variantId}`} className="py-2.5 flex justify-between text-xs">
                    <div className="min-w-0 pe-2">
                      <p className="font-semibold text-[#292D29] truncate">
                        {i.productName[locale] || i.productName.fr}
                      </p>
                      <p className="text-[11px] text-[#6D746E]">
                        {i.variantLabel[locale] || i.variantLabel.fr} × {i.quantity}
                      </p>
                    </div>
                    <span className="font-medium text-[#244A3B] tabular-nums shrink-0">
                      {formatDZD(i.unitPriceDZD * i.quantity, locale)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Totals Table */}
              <div className="border-t border-[#E3E5DF] pt-3 space-y-2 text-xs">
                <div className="flex justify-between text-[#6D746E]">
                  <span>{t.cart.subtotal}</span>
                  <span className="tabular-nums text-[#292D29]">
                    {formatDZD(totals.subtotalDZD, locale)}
                  </span>
                </div>

                <div className="flex justify-between text-[#6D746E]">
                  <span>
                    Livraison ({locale === 'ar' ? selectedWilaya.nameAr : selectedWilaya.nameFr}) :
                  </span>
                  <span className="tabular-nums text-[#292D29]">
                    {totals.shippingFeeDZD === 0 ? (
                      <strong className="text-emerald-700">Offerte</strong>
                    ) : (
                      formatDZD(totals.shippingFeeDZD, locale)
                    )}
                  </span>
                </div>

                <div className="border-t border-[#E3E5DF] pt-3 flex items-baseline justify-between font-serif-botanical">
                  <span className="text-base font-bold text-[#292D29]">{t.cart.total}</span>
                  <span className="text-2xl font-bold text-[#244A3B] tabular-nums">
                    {formatDZD(totals.totalDZD, locale)}
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 px-6 bg-[#244A3B] hover:bg-[#1C3A2E] disabled:bg-[#829477] text-white text-xs font-semibold tracking-wider uppercase rounded-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm mt-4"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{isSubmitting ? t.checkout.processing : t.checkout.placeOrder}</span>
              </button>

              <p className="text-[10px] text-[#6D746E] text-center leading-relaxed">
                {t.checkout.termsNotice}
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
