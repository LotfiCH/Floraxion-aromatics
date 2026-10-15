import React, { useState } from 'react';
import { Locale, Order } from '../../types';
import { formatDZD } from '../../lib/commerce';
import { storage } from '../../lib/storage';
import { Search, Package, Clock, CheckCircle2, Truck, ArrowLeft, Building } from 'lucide-react';

interface OrderTrackingViewProps {
  locale: Locale;
  onBack: () => void;
}

export const OrderTrackingView: React.FC<OrderTrackingViewProps> = ({ locale, onBack }) => {
  const [query, setQuery] = useState('');
  const [searched, setSearched] = useState(false);
  const [matchedOrder, setMatchedOrder] = useState<Order | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearched(true);
    const cleanQuery = query.trim().toUpperCase();
    if (!cleanQuery) {
      setMatchedOrder(null);
      return;
    }

    const allOrders = storage.getOrders();
    const found = allOrders.find(
      (o) =>
        o.orderNumber.toUpperCase() === cleanQuery ||
        o.customerSnapshot.phone.replace(/\s+/g, '') === query.trim().replace(/\s+/g, '')
    );
    setMatchedOrder(found || null);
  };

  const getStepProgress = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return 1;
      case 'confirmed':
        return 2;
      case 'processing':
        return 3;
      case 'shipped':
        return 4;
      case 'delivered':
        return 5;
      default:
        return 1;
    }
  };

  return (
    <div className="py-12 bg-[#F8F7F2] min-h-[70vh]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#244A3B] hover:underline mb-6 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
          <span>{locale === 'ar' ? 'العودة للرئيسية' : 'Retour à l’accueil'}</span>
        </button>

        <div className="bg-white p-8 rounded-xs border border-[#E3E5DF] shadow-xs space-y-6">
          <div className="border-b border-[#E3E5DF] pb-4">
            <div className="flex items-center gap-2 text-[#244A3B] mb-1">
              <Truck className="w-5 h-5 text-[#829477]" />
              <span className="text-xs font-mono uppercase tracking-wider text-[#829477]">
                EXPÉDITION & SUIVI
              </span>
            </div>
            <h1 className="font-serif-botanical text-2xl sm:text-3xl font-bold text-[#244A3B]">
              {locale === 'ar' ? 'تتبع حالة طلبيتك' : 'Suivi en direct de votre commande'}
            </h1>
            <p className="text-xs text-[#6D746E] mt-1">
              {locale === 'ar'
                ? 'أدخل رقم الطلب (مثال: FLX-20250210-4491) أو رقم هاتفك المسجل للاطلاع على مرحلة المعالجة والشحن.'
                : 'Saisissez votre référence de commande (ex: FLX-20250210-4491) ou votre numéro de téléphone pour vérifier l’état de préparation et d’acheminement.'}
            </p>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#829477] absolute start-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ex: FLX-20250210-4491 ou 0555 12 34 56"
                className="w-full ps-9 pe-4 py-2.5 bg-[#FAF9F5] border border-[#E3E5DF] focus:border-[#244A3B] rounded-xs text-xs font-mono"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#244A3B] hover:bg-[#1C3A2E] text-white text-xs font-semibold rounded-xs cursor-pointer shadow-sm"
            >
              {locale === 'ar' ? 'بحث' : 'Rechercher'}
            </button>
          </form>

          {/* Result Box */}
          {searched && (
            <div className="pt-4">
              {matchedOrder ? (
                <div className="space-y-6 bg-[#FAF9F5] p-6 border border-[#E3E5DF] rounded-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#E3E5DF] pb-3 gap-2">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-[#829477]">
                        COMMANDE TROUVÉE
                      </span>
                      <h3 className="font-serif-botanical text-xl font-bold text-[#244A3B]">
                        {matchedOrder.orderNumber}
                      </h3>
                      <p className="text-xs text-[#6D746E]">
                        Enregistrée le {new Date(matchedOrder.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-1 text-xs font-bold rounded-xs ${
                          matchedOrder.paymentStatus === 'paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        Paiement : {matchedOrder.paymentStatus}
                      </span>
                    </div>
                  </div>

                  {/* Visual Stepper */}
                  <div className="py-2">
                    <div className="flex items-center justify-between text-xs text-center font-medium">
                      <div className="flex-1">
                        <div
                          className={`w-7 h-7 mx-auto rounded-full flex items-center justify-center text-xs ${
                            getStepProgress(matchedOrder.status) >= 1
                              ? 'bg-[#244A3B] text-white'
                              : 'bg-neutral-200 text-neutral-600'
                          }`}
                        >
                          1
                        </div>
                        <span className="text-[11px] text-[#292D29] block mt-1">Reçue</span>
                      </div>
                      <div
                        className={`h-0.5 flex-1 ${
                          getStepProgress(matchedOrder.status) >= 2 ? 'bg-[#244A3B]' : 'bg-neutral-200'
                        }`}
                      />
                      <div className="flex-1">
                        <div
                          className={`w-7 h-7 mx-auto rounded-full flex items-center justify-center text-xs ${
                            getStepProgress(matchedOrder.status) >= 2
                              ? 'bg-[#244A3B] text-white'
                              : 'bg-neutral-200 text-neutral-600'
                          }`}
                        >
                          2
                        </div>
                        <span className="text-[11px] text-[#292D29] block mt-1">Confirmée</span>
                      </div>
                      <div
                        className={`h-0.5 flex-1 ${
                          getStepProgress(matchedOrder.status) >= 3 ? 'bg-[#244A3B]' : 'bg-neutral-200'
                        }`}
                      />
                      <div className="flex-1">
                        <div
                          className={`w-7 h-7 mx-auto rounded-full flex items-center justify-center text-xs ${
                            getStepProgress(matchedOrder.status) >= 3
                              ? 'bg-[#244A3B] text-white'
                              : 'bg-neutral-200 text-neutral-600'
                          }`}
                        >
                          3
                        </div>
                        <span className="text-[11px] text-[#292D29] block mt-1">Préparation</span>
                      </div>
                      <div
                        className={`h-0.5 flex-1 ${
                          getStepProgress(matchedOrder.status) >= 4 ? 'bg-[#244A3B]' : 'bg-neutral-200'
                        }`}
                      />
                      <div className="flex-1">
                        <div
                          className={`w-7 h-7 mx-auto rounded-full flex items-center justify-center text-xs ${
                            getStepProgress(matchedOrder.status) >= 4
                              ? 'bg-[#244A3B] text-white'
                              : 'bg-neutral-200 text-neutral-600'
                          }`}
                        >
                          4
                        </div>
                        <span className="text-[11px] text-[#292D29] block mt-1">Expédiée</span>
                      </div>
                      <div
                        className={`h-0.5 flex-1 ${
                          getStepProgress(matchedOrder.status) >= 5 ? 'bg-[#244A3B]' : 'bg-neutral-200'
                        }`}
                      />
                      <div className="flex-1">
                        <div
                          className={`w-7 h-7 mx-auto rounded-full flex items-center justify-center text-xs ${
                            getStepProgress(matchedOrder.status) >= 5
                              ? 'bg-emerald-700 text-white'
                              : 'bg-neutral-200 text-neutral-600'
                          }`}
                        >
                          5
                        </div>
                        <span className="text-[11px] text-[#292D29] block mt-1">Livrée</span>
                      </div>
                    </div>
                  </div>

                  {/* Summary & Destination */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
                    <div>
                      <p className="font-semibold text-[#829477] uppercase font-mono">
                        Destinataire :
                      </p>
                      <p className="font-bold text-[#292D29]">
                        {matchedOrder.customerSnapshot.fullName}
                      </p>
                      <p className="text-[#6D746E]">
                        Wilaya : {matchedOrder.customerSnapshot.wilayaName} (
                        {matchedOrder.customerSnapshot.wilayaCode})
                      </p>
                      <p className="text-[#6D746E]">{matchedOrder.customerSnapshot.commune}</p>
                    </div>

                    <div className="text-start sm:text-end">
                      <p className="font-semibold text-[#829477] uppercase font-mono">
                        Montant Total :
                      </p>
                      <p className="text-xl font-serif-botanical font-bold text-[#244A3B] tabular-nums">
                        {formatDZD(matchedOrder.totalDZD, locale)}
                      </p>
                      <p className="text-[#6D746E]">
                        Mode : {matchedOrder.paymentMethod === 'cash_on_delivery' ? 'Espèces à la livraison' : 'Virement Bancaire'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 bg-amber-50 border border-amber-200 rounded-xs text-amber-900 text-xs text-center space-y-2">
                  <p className="font-semibold text-sm">Aucune commande trouvée</p>
                  <p className="text-[#6D746E]">
                    Vérifiez le numéro saisi (format : FLX-AAAAMMJJ-XXXX) ou contactez notre service client au +213 (0) 23 92 10 40.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
