import React from 'react';
import { CartItem, Locale } from '../../types';
import { getDictionary } from '../../lib/i18n';
import { formatDZD } from '../../lib/commerce';
import { BotanicalIllustration } from '../ui/BotanicalIllustration';
import { X, Plus, Minus, Trash2, ArrowRight } from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (productId: string, variantId: string, quantity: number) => void;
  onRemoveItem: (productId: string, variantId: string) => void;
  onCheckout: () => void;
  locale: Locale;
  freeShippingThreshold?: number;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  locale,
  freeShippingThreshold = 15000,
}) => {
  const t = getDictionary(locale);

  if (!isOpen) return null;

  const subtotalDZD = items.reduce((sum, item) => sum + item.unitPriceDZD * item.quantity, 0);
  const remainingForFree = Math.max(0, freeShippingThreshold - subtotalDZD);
  const progressPercent = Math.min(100, (subtotalDZD / freeShippingThreshold) * 100);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
      />

      <div className="fixed inset-y-0 end-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#F8F7F2] shadow-2xl flex flex-col border-s border-[#E3E5DF]">
          {/* Header */}
          <div className="p-6 border-b border-[#E3E5DF] flex items-center justify-between bg-white/60">
            <h2 className="font-serif-botanical text-xl font-bold text-[#244A3B]">
              {t.cart.title} ({items.reduce((acc, i) => acc + i.quantity, 0)})
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-[#6D746E] hover:text-[#292D29] hover:bg-black/5 rounded-sm transition-colors cursor-pointer"
              aria-label="Fermer le panier"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Gauge */}
          <div className="px-6 py-3 bg-[#244A3B]/5 border-b border-[#E3E5DF] text-xs">
            {subtotalDZD >= freeShippingThreshold ? (
              <p className="font-medium text-[#244A3B]">{t.cart.freeShippingAchieved}</p>
            ) : (
              <p className="text-[#6D746E]">
                {t.cart.freeShippingProgress}{' '}
                <strong className="text-[#244A3B]">{formatDZD(freeShippingThreshold, locale)}</strong> (reste{' '}
                {formatDZD(remainingForFree, locale)})
              </p>
            )}
            <div className="w-full bg-[#E3E5DF] h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-[#244A3B] h-full transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Items Container */}
          <div className="flex-1 overflow-y-auto p-6 divide-y divide-[#E3E5DF]">
            {items.length === 0 ? (
              <div className="text-center py-16 px-4">
                <p className="font-serif-botanical text-lg text-[#292D29] font-medium mb-1">
                  {t.cart.empty}
                </p>
                <p className="text-xs text-[#6D746E] mb-6">{t.cart.emptySub}</p>
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 bg-[#244A3B] text-white text-xs font-semibold rounded-sm hover:bg-[#1C3A2E] transition-colors cursor-pointer"
                >
                  {t.cart.continueShopping}
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div key={`${item.productId}-${item.variantId}`} className="py-4 flex gap-4">
                  {/* Thumbnail */}
                  <div className="w-18 h-18 shrink-0 rounded-xs overflow-hidden border border-[#E3E5DF]">
                    <BotanicalIllustration tag={item.imageTag} className="w-full h-full p-1" />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-[#292D29] truncate">
                      {item.productName[locale] || item.productName.fr}
                    </h4>
                    {item.botanicalName && (
                      <p className="text-[11px] text-[#829477] italic truncate">
                        {item.botanicalName}
                      </p>
                    )}
                    <p className="text-xs text-[#6D746E] mt-0.5">
                      {item.variantLabel[locale] || item.variantLabel.fr}
                    </p>
                    <p className="text-xs font-semibold text-[#244A3B] mt-1 tabular-nums">
                      {formatDZD(item.unitPriceDZD, locale)}
                    </p>

                    {/* Stepper & Delete */}
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center border border-[#E3E5DF] bg-white rounded-xs">
                        <button
                          onClick={() =>
                            onUpdateQuantity(item.productId, item.variantId, item.quantity - 1)
                          }
                          className="p-1 text-[#6D746E] hover:text-[#292D29] cursor-pointer"
                          aria-label="Diminuer la quantité"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-2 text-xs font-medium tabular-nums text-[#292D29]">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            onUpdateQuantity(item.productId, item.variantId, item.quantity + 1)
                          }
                          className="p-1 text-[#6D746E] hover:text-[#292D29] cursor-pointer"
                          aria-label="Augmenter la quantité"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        onClick={() => onRemoveItem(item.productId, item.variantId)}
                        className="text-[#6D746E] hover:text-red-700 p-1 transition-colors cursor-pointer"
                        title={t.cart.remove}
                        aria-label={t.cart.remove}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Checkout Summary */}
          {items.length > 0 && (
            <div className="p-6 border-t border-[#E3E5DF] bg-white/80 space-y-4">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-[#6D746E]">{t.cart.subtotal}</span>
                <span className="font-serif-botanical text-xl font-bold text-[#244A3B] tabular-nums">
                  {formatDZD(subtotalDZD, locale)}
                </span>
              </div>
              <p className="text-[11px] text-[#6D746E]">
                Frais d’expédition calculés à l’étape suivante selon votre wilaya de livraison en Algérie.
              </p>
              <button
                onClick={() => {
                  onClose();
                  onCheckout();
                }}
                className="w-full py-3.5 px-4 bg-[#244A3B] hover:bg-[#1C3A2E] text-white text-xs font-semibold tracking-wider uppercase rounded-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <span>{t.cart.proceedToCheckout}</span>
                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
