import React, { useState } from 'react';
import { Star } from 'lucide-react';
import type { Locale } from '../../types';
import { getDictionary } from '../../lib/i18n';
import { validateReviewDraft, type ReviewDraft, type ReviewValidationError } from '../../lib/reviewValidation';

interface ProductReviewsProps {
  productId: string;
  locale: Locale;
}

export const ProductReviews: React.FC<ProductReviewsProps> = ({ productId, locale }) => {
  const t = getDictionary(locale).product;
  const [draft, setDraft] = useState<ReviewDraft>({ rating: null, title: '', body: '' });
  const [attempted, setAttempted] = useState(false);
  const validationErrors = validateReviewDraft(draft);
  const shouldShowValidation = attempted || draft.rating !== null || draft.title.length > 0 || draft.body.length > 0;

  const validationMessage: Record<ReviewValidationError, string> = {
    rating: t.reviewRatingRequired,
    body: t.reviewBodyRequired,
    title_too_long: t.reviewTitleTooLong,
    body_too_long: t.reviewBodyTooLong,
  };

  const updateDraft = (updates: Partial<ReviewDraft>) => {
    setDraft((current) => ({ ...current, ...updates }));
  };

  return (
    <section id="product-reviews" aria-labelledby="product-reviews-heading" className="mt-16 pt-10 border-t border-[#E3E5DF] scroll-mt-24">
      <div className="max-w-4xl">
        <h2 id="product-reviews-heading" className="font-serif-botanical text-2xl font-bold text-[#244A3B]">
          {t.reviews}
        </h2>
        <p className="mt-2 text-sm text-[#6D746E] leading-relaxed" role="status">
          {t.reviewSourceUnavailable}
        </p>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="p-5 bg-white border border-[#E3E5DF] rounded-xs" aria-live="polite">
            <h3 className="text-sm font-semibold text-[#244A3B]">{t.reviews}</h3>
            <p className="mt-3 text-sm text-[#6D746E] leading-relaxed">{t.reviewSourceUnavailable}</p>
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              setAttempted(true);
            }}
            className="p-5 bg-white border border-[#E3E5DF] rounded-xs space-y-4"
            aria-describedby={`review-unavailable-${productId}`}
          >
            <h3 className="text-sm font-semibold text-[#244A3B]">{t.reviewFormTitle}</h3>
            <p id={`review-unavailable-${productId}`} className="text-xs text-[#6D746E] leading-relaxed">
              {t.reviewSubmissionNotice}
            </p>

            <fieldset>
              <legend className="block text-xs font-semibold text-[#292D29] mb-2">{t.reviewRating}</legend>
              <div role="radiogroup" className="flex items-center gap-1" dir="ltr">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <label key={rating} className="rounded-sm cursor-pointer focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-[#829477]">
                    <input
                      type="radio"
                      name={`review-rating-${productId}`}
                      value={rating}
                      checked={draft.rating === rating}
                      onChange={() => updateDraft({ rating })}
                      required={rating === 1}
                      className="sr-only peer"
                      aria-label={`${rating} ${t.reviewStars}`}
                    />
                    <Star
                      aria-hidden="true"
                      className={`w-7 h-7 p-0.5 transition-colors ${
                        draft.rating !== null && rating <= draft.rating
                          ? 'fill-[#B68B48] text-[#B68B48]'
                          : 'text-[#B8B9AE]'
                      }`}
                    />
                  </label>
                ))}
              </div>
              {shouldShowValidation && validationErrors.includes('rating') && (
                <p className="mt-1 text-xs text-rose-700" role="alert">{validationMessage.rating}</p>
              )}
            </fieldset>

            <div>
              <label htmlFor={`review-title-${productId}`} className="block text-xs font-semibold text-[#292D29] mb-1">
                {t.reviewTitle}
              </label>
              <input
                id={`review-title-${productId}`}
                type="text"
                value={draft.title}
                onChange={(event) => updateDraft({ title: event.target.value })}
                maxLength={120}
                className="w-full py-2 px-3 bg-[#FAF9F5] border border-[#E3E5DF] rounded-xs text-sm text-[#292D29] focus:border-[#244A3B] focus:outline-none"
                placeholder={t.reviewTitlePlaceholder}
              />
              {shouldShowValidation && validationErrors.includes('title_too_long') && (
                <p className="mt-1 text-xs text-rose-700" role="alert">{validationMessage.title_too_long}</p>
              )}
            </div>

            <div>
              <label htmlFor={`review-body-${productId}`} className="block text-xs font-semibold text-[#292D29] mb-1">
                {t.reviewBody}
              </label>
              <textarea
                id={`review-body-${productId}`}
                value={draft.body}
                onChange={(event) => updateDraft({ body: event.target.value })}
                rows={5}
                maxLength={3000}
                required
                dir={locale === 'ar' ? 'rtl' : 'ltr'}
                className="w-full py-2 px-3 bg-[#FAF9F5] border border-[#E3E5DF] rounded-xs text-sm text-[#292D29] focus:border-[#244A3B] focus:outline-none leading-relaxed"
                placeholder={t.reviewBodyPlaceholder}
              />
              {shouldShowValidation && validationErrors.includes('body') && (
                <p className="mt-1 text-xs text-rose-700" role="alert">{validationMessage.body}</p>
              )}
              {shouldShowValidation && validationErrors.includes('body_too_long') && (
                <p className="mt-1 text-xs text-rose-700" role="alert">{validationMessage.body_too_long}</p>
              )}
            </div>

            <button
              type="submit"
              disabled
              onClick={() => setAttempted(true)}
              className="w-full py-3 px-5 bg-[#829477] text-white text-xs font-semibold tracking-wider uppercase rounded-xs opacity-60 cursor-not-allowed"
              title={t.reviewSubmissionNotice}
            >
              {t.reviewSubmitUnavailable}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};
