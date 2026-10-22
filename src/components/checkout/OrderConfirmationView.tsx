import React from 'react';
import { Locale, Order, SiteSettings } from '../../types';
import { getDictionary } from '../../lib/i18n';
import { formatDZD } from '../../lib/commerce';
import { Eye, Printer, ArrowRight } from 'lucide-react';

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
        {/* Local preview header */}
        <div className="bg-white border border-[#E3E5DF] rounded-xs p-6 sm:p-10 shadow-xs text-center space-y-4">
          <div className="w-14 h-14 bg-[#244A3B]/10 text-[#244A3B] rounded-full flex items-center justify-center mx-auto">
            <Eye className="w-8 h-8" />
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
              {t.confirmation.previewOnly}
            </span>
          </div>
        </div>

        <div role="status" className="mt-8 border border-[#B68B48]/40 bg-[#B68B48]/10 p-5 text-sm leading-relaxed text-[#5B513F]">
          <p className="font-semibold">{t.confirmation.previewTitle}</p>
          <p className="mt-1">{t.confirmation.previewNotice}</p>
        </div>

        {/* Printable Order Recap */}
        <div className="mt-8 bg-white border border-[#E3E5DF] rounded-xs p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-[#E3E5DF] pb-4">
            <h2 className="font-serif-botanical text-xl font-bold text-[#244A3B]">
              {t.confirmation.previewDetails}
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
                <span>{t.confirmation.previewTotal}</span>
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
