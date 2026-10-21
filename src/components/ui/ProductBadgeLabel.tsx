import React from 'react';
import { getDictionary } from '../../lib/i18n';
import { getProductBadge } from '../../lib/productBadges';
import { Locale } from '../../types';

interface ProductBadgeLabelProps {
  value: unknown;
  locale: Locale;
  className?: string;
  compact?: boolean;
}

export const ProductBadgeLabel: React.FC<ProductBadgeLabelProps> = ({
  value,
  locale,
  className = '',
  compact = false,
}) => {
  const badge = getProductBadge(value);
  if (!badge) return null;

  const t = getDictionary(locale);
  const label = badge === 'new'
    ? t.product.productBadgeNew
    : badge === 'best_seller'
      ? t.product.productBadgeBestSeller
      : t.product.productBadgePopular;

  return (
    <span
      className={`pointer-events-none inline-flex max-w-full items-center rounded-full border border-[#244A3B]/15 bg-[#F8F7F2]/95 font-semibold leading-none text-[#244A3B] shadow-sm ${compact ? 'whitespace-nowrap px-1.5 py-1 text-[7px] tracking-[0.03em]' : 'px-2.5 py-1 text-[9px] tracking-[0.1em] backdrop-blur-[2px] sm:text-[10px]'} ${className}`}
    >
      {label}
    </span>
  );
};
