import React from 'react';
import { Locale, Order, SiteSettings } from '../../types';
import { getDictionary } from '../../lib/i18n';
import { formatDZD } from '../../lib/commerce';
import { CheckCircle2, Printer, ArrowRight, Building, Truck, Clock } from 'lucide-react';

interface OrderConfirmationViewProps {
  order: Order;
  settings: SiteSettings;
  locale: Locale;
  onContinueShopping: () => void;
}

export const OrderConfirmationView: React.FC<OrderConfirmationViewProps> = ({
  order,
  settings,
  locale,
  onContinueShopping,
}) => {
  const t = getDictionary(locale);

  return (
    <div className="py-12 bg-[#F8F7F2]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Success Card Header */}
        <div className="bg-white border border-[#E3E5DF] rounded-xs p-6 sm:p-10 shadow-xs text-center space-y-4">
          <div className="w-14 h-14 bg-[#244A3B]/10 text-[#244A3B] rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <h1 className="font-serif-botanical text-3xl sm:text-4xl font-bold text-[#244A3B]">
            {t.confirmation.title}
          </h1>

          <p className="text-sm text-[#6D746E] max-w-lg mx-auto">
            {t.confirmation.subtitle}
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-3 text-xs font-mono">
            <span className="bg-[#FAF9F5] border border-[#E3E5DF] px-3 py-1.5 rounded-xs text-[#244A3B] font-bold">
              {t.confirmation.orderNumber} : {order.orderNumber}
            </span>
            <span className="bg-[#FAF9F5] border border-[#E3E5DF] px-3 py-1.5 rounded-xs text-[#6D746E]">
              {new Date(order.createdAt).toLocaleDateString(locale === 'ar' ? 'ar-DZ' : 'fr-FR')}
            </span>
            <span className="bg-[#244A3B]/10 text-[#244A3B] px-3 py-1.5 rounded-xs font-semibold">
              {order.paymentStatus === 'paid'
                ? 'Règlement validé'
                : 'Paiement en attente de vérification'}
            </span>
          </div>
        </div>

        {/* Payment Instructions Action Box */}
        <div className="mt-8 bg-[#FAF8F3] border border-[#E3E5DF] rounded-xs p-6 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-[#244A3B]">
            {order.paymentMethod === 'bank_transfer' ? (
              <Building className="w-5 h-5 text-[#244A3B]" />
            ) : order.paymentMethod === 'cash_on_delivery' ? (
              <Truck className="w-5 h-5 text-[#244A3B]" />
            ) : (
              <Clock className="w-5 h-5 text-[#244A3B]" />
            )}
            <span>{t.confirmation.nextStepsTitle}</span>
          </div>

          {order.paymentMethod === 'bank_transfer' && (
            <div className="space-y-3 text-xs text-[#292D29]">
              <p className="leading-relaxed">
                {settings.bankTransferInstructions[locale] || settings.bankTransferInstructions.fr}
              </p>
              <div className="bg-white p-4 border border-[#E3E5DF] rounded-xs space-y-2 font-mono text-[11px]">
                <div className="flex justify-between border-b border-[#E3E5DF] pb-1.5">
                  <span className="text-[#6D746E]">Banque Nationale d’Algérie (BNA) :</span>
                  <span className="font-bold text-[#244A3B]">{settings.ribAccount}</span>
                </div>
                <div className="flex justify-between border-b border-[#E3E5DF] pb-1.5">
                  <span className="text-[#6D746E]">Compte Postal CCP :</span>
                  <span className="font-bold text-[#244A3B]">{settings.ccpAccount}</span>
                </div>
                <div className="flex justify-between pt-0.5">
                  <span className="text-[#6D746E]">Référence obligatoire à mentionner :</span>
                  <span className="font-bold text-[#244A3B]">{order.orderNumber}</span>
                </div>
              </div>
            </div>
          )}

          {order.paymentMethod === 'cash_on_delivery' && (
            <p className="text-xs text-[#292D29] leading-relaxed">
              {t.confirmation.codNextSteps} Veuillez préparer la somme exacte de{' '}
              <strong className="text-[#244A3B] font-mono">{formatDZD(order.totalDZD, locale)}</strong>{' '}
              en espèces pour la remise du colis.
            </p>
          )}

          {order.paymentMethod === 'online_card' && (
            <p className="text-xs text-[#292D29] leading-relaxed">
              Session de paiement enregistrée en mode test bancaire. Votre commande a été transmise à notre service logistique pour validation manuelle.
            </p>
          )}
        </div>

        {/* Printable Order Recap */}
        <div className="mt-8 bg-white border border-[#E3E5DF] rounded-xs p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-[#E3E5DF] pb-4">
            <h2 className="font-serif-botanical text-xl font-bold text-[#244A3B]">
              Détails de votre commande
            </h2>
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 border border-[#E3E5DF] hover:border-[#244A3B] text-xs font-medium text-[#244A3B] rounded-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>{t.confirmation.printInvoice}</span>
            </button>
          </div>

          {/* Delivery Address & Snapshot */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
            <div>
              <span className="font-semibold text-[#829477] uppercase font-mono block mb-1">
                Destinataire :
              </span>
              <p className="font-bold text-[#292D29] text-sm">{order.customerSnapshot.fullName}</p>
              {order.customerSnapshot.companyName && (
                <p className="text-[#244A3B] font-medium">{order.customerSnapshot.companyName}</p>
              )}
              <p className="text-[#6D746E] font-mono mt-0.5">{order.customerSnapshot.phone}</p>
              {order.customerSnapshot.email && (
                <p className="text-[#6D746E]">{order.customerSnapshot.email}</p>
              )}
            </div>

            <div>
              <span className="font-semibold text-[#829477] uppercase font-mono block mb-1">
                Adresse de livraison :
              </span>
              <p className="text-[#292D29] leading-relaxed">{order.customerSnapshot.streetAddress}</p>
              <p className="text-[#292D29] font-medium mt-0.5">
                {order.customerSnapshot.commune}, Wilaya de {order.customerSnapshot.wilayaName} (
                {order.customerSnapshot.wilayaCode})
              </p>
              {order.customerSnapshot.deliveryNotes && (
                <p className="text-[#6D746E] italic mt-1">
                  Note : « {order.customerSnapshot.deliveryNotes} »
                </p>
              )}
            </div>
          </div>

          {/* Items Table */}
          <table className="w-full text-xs border border-[#E3E5DF] divide-y divide-[#E3E5DF]">
            <thead className="bg-[#FAF9F5] text-[#244A3B] font-semibold text-start">
              <tr>
                <th className="py-2.5 px-4 text-start">Ingrédient</th>
                <th className="py-2.5 px-4 text-start">Conditionnement</th>
                <th className="py-2.5 px-4 text-center">Quantité</th>
                <th className="py-2.5 px-4 text-end">Prix Unitaire</th>
                <th className="py-2.5 px-4 text-end">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E3E5DF]">
              {order.items.map((item, idx) => (
                <tr key={idx} className="hover:bg-[#FAF9F5]/50">
                  <td className="py-3 px-4 font-medium text-[#292D29]">
                    {item.productNameSnapshot}
                  </td>
                  <td className="py-3 px-4 text-[#6D746E]">{item.variantLabelSnapshot}</td>
                  <td className="py-3 px-4 text-center tabular-nums text-[#292D29]">
                    {item.quantity}
                  </td>
                  <td className="py-3 px-4 text-end font-mono text-[#6D746E]">
                    {formatDZD(item.unitPriceDZD, locale)}
                  </td>
                  <td className="py-3 px-4 text-end font-mono font-semibold text-[#244A3B]">
                    {formatDZD(item.lineTotalDZD, locale)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Order Totals Summary */}
          <div className="flex justify-end pt-2">
            <div className="w-full sm:w-72 space-y-2 text-xs">
              <div className="flex justify-between text-[#6D746E]">
                <span>Sous-total articles :</span>
                <span className="tabular-nums font-mono">
                  {formatDZD(order.subtotalDZD, locale)}
                </span>
              </div>
              <div className="flex justify-between text-[#6D746E]">
                <span>Frais d’expédition wilaya :</span>
                <span className="tabular-nums font-mono">
                  {order.shippingFeeDZD === 0
                    ? 'Offerte'
                    : formatDZD(order.shippingFeeDZD, locale)}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-[#E3E5DF] font-bold text-sm text-[#244A3B]">
                <span>Total net à régler :</span>
                <span className="tabular-nums font-mono text-base">
                  {formatDZD(order.totalDZD, locale)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Back to catalog action */}
        <div className="mt-8 text-center">
          <button
            onClick={onContinueShopping}
            className="px-6 py-3 bg-[#244A3B] hover:bg-[#1C3A2E] text-white text-xs font-semibold tracking-wider uppercase rounded-xs transition-colors inline-flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <span>{t.confirmation.backToCatalog}</span>
            <ArrowRight className="w-4 h-4 rtl:rotate-180" />
          </button>
        </div>
      </div>
    </div>
  );
};
