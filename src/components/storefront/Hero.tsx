import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Locale, Product } from '../../types';
import { getDictionary } from '../../lib/i18n';
import { BotanicalIllustration } from '../ui/BotanicalIllustration';
import { ProductBadgeLabel } from '../ui/ProductBadgeLabel';
import {
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileText,
  ImageOff,
} from 'lucide-react';
import {
  getHeroImageRenderState,
  HERO_SHOWCASE_INTERVAL_MS,
  selectHeroShowcaseProducts,
  shouldAutoplayHeroShowcase,
  wrapHeroShowcaseIndex,
  type HeroImageLoadResult,
} from '../../lib/heroShowcase';

interface HeroProps {
  locale: Locale;
  products: Product[];
  productsLoading: boolean;
  onExplore: () => void;
  onRequestQuote: () => void;
  onSelectProduct: (product: Product) => void;
}

interface ShowcaseCopy {
  imageLoading: string;
  imageUnavailable: string;
  discoverProduct: string;
}

interface ProductShowcaseImageProps {
  product: Product;
  alt: string;
  copy: ShowcaseCopy;
}

const ProductShowcaseImage: React.FC<ProductShowcaseImageProps> = ({ product, alt, copy }) => {
  const imageUrl = product.imageUrl;
  // Key the result to its URL. A cached image may load before passive effects run.
  const [imageResult, setImageResult] = useState<HeroImageLoadResult | null>(null);
  const imageState = getHeroImageRenderState(imageUrl, imageResult);

  if (!imageUrl) {
    return (
      <BotanicalIllustration
        tag={product.imageTag}
        imageAlt={alt}
        aspectRatio="portrait"
        className="h-full w-full rounded-none"
      />
    );
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[#F1EFE8] p-3 sm:p-4">
      {imageState === 'loading' && (
        <span className="sr-only" role="status">{copy.imageLoading}</span>
      )}
      {imageState === 'error' ? (
        <div
          className="flex h-full w-full flex-col items-center justify-center gap-2 text-[#6D746E]"
          role="img"
          aria-label={`${alt} — ${copy.imageUnavailable}`}
        >
          <ImageOff className="h-7 w-7 text-[#829477]" aria-hidden="true" />
          <span className="text-xs">{copy.imageUnavailable}</span>
        </div>
      ) : (
        <img
          src={imageUrl}
          alt={alt}
          onLoad={() => setImageResult({ source: imageUrl, state: 'loaded' })}
          onError={() => setImageResult({ source: imageUrl, state: 'error' })}
          decoding="async"
          className={`h-full w-full scale-[1.06] object-contain transition-opacity duration-300 motion-reduce:transition-none ${imageState === 'loaded' ? 'opacity-100' : 'opacity-0'}`}
        />
      )}
    </div>
  );
};

interface ProductShowcaseSlideProps {
  product: Product;
  locale: Locale;
  copy: ShowcaseCopy;
  isOutgoing?: boolean;
  onSelectProduct: (product: Product) => void;
}

const ProductShowcaseSlide: React.FC<ProductShowcaseSlideProps> = ({
  product,
  locale,
  copy,
  isOutgoing = false,
  onSelectProduct,
}) => {
  const translation = product.translations[locale] || product.translations.fr;

  return (
    <article
      aria-hidden={isOutgoing || undefined}
      className={`hero-showcase-slide absolute inset-0 z-10 flex h-full w-full flex-col ${isOutgoing ? 'hero-showcase-slide-exit pointer-events-none z-0' : 'hero-showcase-slide-enter'}`}
    >
      <div className="relative min-h-0 flex-1 overflow-hidden bg-[#F1EFE8]">
        <ProductShowcaseImage
          key={`${product.id}:${product.imageUrl || ''}`}
          product={product}
          alt={translation.name}
          copy={copy}
        />
        <ProductBadgeLabel
          value={product.productBadge}
          locale={locale}
          className="absolute left-3 top-3 z-20 rtl:left-auto rtl:right-3"
        />
      </div>

      <div className="flex min-h-[152px] flex-col justify-center border-t border-[#E3E5DF] bg-[#FAF9F5] px-4 py-3 sm:min-h-[156px] sm:px-5">
        <p className="mb-1 truncate text-[10px] font-mono uppercase tracking-[0.16em] text-[#829477]">
          {product.botanicalName || product.sku}
        </p>
        <h2 className="line-clamp-2 font-serif-botanical text-lg font-semibold leading-tight text-[#244A3B] sm:text-xl">
          {translation.name}
        </h2>
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[#6D746E]">
          {translation.shortDescription}
        </p>
        {isOutgoing ? (
          <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#244A3B]">
            {copy.discoverProduct}
            <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden="true" />
          </span>
        ) : (
          <button
            type="button"
            onClick={() => onSelectProduct(product)}
            aria-label={`${copy.discoverProduct} : ${translation.name}`}
            className="mt-2 inline-flex w-fit items-center gap-1 text-xs font-semibold text-[#244A3B] transition-colors hover:text-[#829477] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#244A3B]"
          >
            {copy.discoverProduct}
            <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden="true" />
          </button>
        )}
      </div>
    </article>
  );
};

export const Hero: React.FC<HeroProps> = ({
  locale,
  products,
  productsLoading,
  onExplore,
  onRequestQuote,
  onSelectProduct,
}) => {
  const t = getDictionary(locale);
  const showcaseProducts = useMemo(() => selectHeroShowcaseProducts(products), [products]);
  const [activeProductId, setActiveProductId] = useState<string | null>(null);
  const [outgoingProduct, setOutgoingProduct] = useState<Product | null>(null);
  const previousProductRef = useRef<Product | null>(null);
  const [pointerOver, setPointerOver] = useState(false);
  const [pointerInteracting, setPointerInteracting] = useState(false);
  const [focusWithin, setFocusWithin] = useState(false);
  const [pageVisible, setPageVisible] = useState(() =>
    typeof document === 'undefined' || !document.hidden,
  );
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() =>
    typeof window !== 'undefined'
      && Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches),
  );

  const currentProduct = showcaseProducts.find((product) => product.id === activeProductId)
    || showcaseProducts[0];
  const activeIndex = currentProduct
    ? showcaseProducts.findIndex((product) => product.id === currentProduct.id)
    : 0;
  const visibleOutgoingProduct = outgoingProduct
    && showcaseProducts.some((product) => product.id === outgoingProduct.id)
    ? outgoingProduct
    : null;
  const isInteracting = pointerOver || pointerInteracting || focusWithin;

  useEffect(() => {
    if (!currentProduct) {
      previousProductRef.current = null;
      setOutgoingProduct(null);
      return;
    }

    const previousProduct = previousProductRef.current;
    previousProductRef.current = currentProduct;
    if (!previousProduct || previousProduct.id === currentProduct.id || prefersReducedMotion) {
      setOutgoingProduct(null);
      return;
    }

    setOutgoingProduct(previousProduct);
    const timeoutId = window.setTimeout(() => setOutgoingProduct(null), 520);
    return () => window.clearTimeout(timeoutId);
  }, [currentProduct, prefersReducedMotion]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = (event: MediaQueryListEvent) => setPrefersReducedMotion(event.matches);
    setPrefersReducedMotion(mediaQuery.matches);

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', updatePreference);
      return () => mediaQuery.removeEventListener('change', updatePreference);
    }
    mediaQuery.addListener(updatePreference);
    return () => mediaQuery.removeListener(updatePreference);
  }, []);

  useEffect(() => {
    const updateVisibility = () => setPageVisible(!document.hidden);
    document.addEventListener('visibilitychange', updateVisibility);
    return () => document.removeEventListener('visibilitychange', updateVisibility);
  }, []);

  useEffect(() => {
    if (!currentProduct || !shouldAutoplayHeroShowcase({
      itemCount: showcaseProducts.length,
      isInteracting,
      isPageVisible: pageVisible,
      prefersReducedMotion,
    })) {
      return;
    }

    const nextIndex = wrapHeroShowcaseIndex(activeIndex, showcaseProducts.length, 1);
    const timeoutId = window.setTimeout(
      () => setActiveProductId(showcaseProducts[nextIndex].id),
      HERO_SHOWCASE_INTERVAL_MS,
    );
    return () => window.clearTimeout(timeoutId);
  }, [
    activeIndex,
    currentProduct,
    isInteracting,
    pageVisible,
    prefersReducedMotion,
    showcaseProducts,
  ]);

  const selectRelativeProduct = (direction: -1 | 1) => {
    if (showcaseProducts.length === 0) return;
    const nextIndex = wrapHeroShowcaseIndex(activeIndex, showcaseProducts.length, direction);
    setActiveProductId(showcaseProducts[nextIndex].id);
  };

  const selectProductAtIndex = (index: number) => {
    const product = showcaseProducts[index];
    if (product) setActiveProductId(product.id);
  };

  const showcaseCopy: ShowcaseCopy = {
    imageLoading: t.hero.imageLoading,
    imageUnavailable: t.hero.imageUnavailable,
    discoverProduct: t.hero.discoverProduct,
  };

  return (
    <section className="relative overflow-hidden border-b border-[#E3E5DF] bg-[#F8F7F2] py-12 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-8">
          {/* Left Column: Text & Editorial Authority */}
          <div className="space-y-6 lg:col-span-7">
            <div className="inline-flex items-center gap-2 text-xs tracking-widest text-[#829477] uppercase">
              <span className="h-px w-6 bg-[#829477]" />
              <span>{t.hero.eyebrow}</span>
            </div>

            <h1 className="font-serif-botanical text-3xl leading-[1.12] font-semibold tracking-tight text-[#244A3B] sm:text-5xl lg:text-5.5xl">
              {t.hero.title}
            </h1>

            <p className="max-w-2xl text-base leading-relaxed font-normal text-[#292D29]/80 sm:text-lg">
              {t.hero.description}
            </p>

            {/* Primary Action Buttons - destinations and behavior are unchanged */}
            <div className="flex flex-col items-stretch gap-3.5 pt-2 sm:flex-row sm:items-center">
              <button
                onClick={onExplore}
                className="inline-flex h-12 cursor-pointer items-center justify-center gap-2.5 rounded-xs border border-[#244A3B] bg-[#244A3B] px-6 text-xs font-semibold tracking-wider text-white uppercase shadow-sm transition-colors hover:bg-[#1C3A2E]"
              >
                <span>{t.hero.ctaShop}</span>
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </button>

              <button
                onClick={onRequestQuote}
                className="inline-flex h-12 cursor-pointer items-center justify-center gap-2.5 rounded-xs border border-[#244A3B]/40 bg-[#FAF9F5] px-6 text-xs font-semibold tracking-wider text-[#244A3B] uppercase shadow-2xs transition-colors hover:border-[#244A3B] hover:bg-white"
              >
                <FileText className="h-4 w-4" />
                <span>{t.hero.ctaQuote}</span>
              </button>
            </div>

            {/* Botanical Trust Markers */}
            <div className="grid grid-cols-1 gap-4 border-t border-[#E3E5DF] pt-6 text-xs font-medium text-[#292D29]/90 sm:grid-cols-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-[#829477]" />
                <span>{t.hero.trustItem1}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-[#829477]" />
                <span>{t.hero.trustItem2}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-[#829477]" />
                <span>{t.hero.trustItem3}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Firestore-backed Botanical Product Showcase */}
          <div className="relative lg:col-span-5">
            <div className="mx-auto max-w-md lg:max-w-none">
              <div className="mb-3 flex items-center justify-between gap-3 px-1">
                <div className="inline-flex items-center gap-2 text-[10px] font-medium tracking-[0.18em] text-[#829477] uppercase">
                  <span className="h-px w-5 bg-[#829477]" />
                  <span>{t.hero.showcaseLabel}</span>
                </div>
                {currentProduct && (
                  <span dir="ltr" className="font-mono text-[10px] tracking-wider text-[#6D746E]" aria-hidden="true">
                    {String(activeIndex + 1).padStart(2, '0')} / {String(showcaseProducts.length).padStart(2, '0')}
                  </span>
                )}
              </div>

              <div
                className="overflow-hidden rounded-sm border border-[#E3E5DF] bg-[#FAF9F5] shadow-md"
                role="region"
                aria-roledescription={locale === 'ar' ? 'عارض' : 'carrousel'}
                aria-label={t.hero.showcaseCarouselLabel}
                onPointerEnter={(event) => {
                  if (event.pointerType === 'mouse' || event.pointerType === 'pen') setPointerOver(true);
                }}
                onPointerLeave={(event) => {
                  if (event.pointerType === 'mouse' || event.pointerType === 'pen') setPointerOver(false);
                }}
                onPointerDown={() => setPointerInteracting(true)}
                onPointerUp={() => setPointerInteracting(false)}
                onPointerCancel={() => setPointerInteracting(false)}
                onFocusCapture={() => setFocusWithin(true)}
                onBlurCapture={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                    setFocusWithin(false);
                  }
                }}
              >
                {currentProduct ? (
                  <div
                    className="relative h-[388px] sm:h-[420px]"
                    aria-live={isInteracting ? 'polite' : 'off'}
                    aria-atomic="true"
                  >
                    {visibleOutgoingProduct && (
                      <ProductShowcaseSlide
                        key={`outgoing-${visibleOutgoingProduct.id}`}
                        product={visibleOutgoingProduct}
                        locale={locale}
                        copy={showcaseCopy}
                        isOutgoing
                        onSelectProduct={onSelectProduct}
                      />
                    )}
                    <ProductShowcaseSlide
                      key={`current-${currentProduct.id}`}
                      product={currentProduct}
                      locale={locale}
                      copy={showcaseCopy}
                      onSelectProduct={onSelectProduct}
                    />
                  </div>
                ) : (
                  <div className="flex h-[388px] flex-col items-center justify-center gap-3 bg-[#F1EFE8] px-6 text-center sm:h-[420px]">
                    <ImageOff className="h-8 w-8 text-[#829477]" aria-hidden="true" />
                    <p className="max-w-xs text-sm text-[#6D746E]" role={productsLoading ? 'status' : 'note'}>
                      {productsLoading ? t.hero.showcaseLoading : t.hero.showcaseUnavailable}
                    </p>
                  </div>
                )}

                {showcaseProducts.length > 0 && (
                  <div className="flex min-h-12 items-center justify-between gap-3 border-t border-[#E3E5DF] bg-[#FAF9F5] px-3 py-2.5 sm:px-4">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => selectRelativeProduct(-1)}
                        disabled={showcaseProducts.length < 2}
                        aria-label={t.hero.previousProduct}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#244A3B] transition-colors hover:bg-[#EAE8D9] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#244A3B]"
                      >
                        <ChevronLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => selectRelativeProduct(1)}
                        disabled={showcaseProducts.length < 2}
                        aria-label={t.hero.nextProduct}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#244A3B] transition-colors hover:bg-[#EAE8D9] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#244A3B]"
                      >
                        <ChevronRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5" role="group" aria-label={t.hero.showcaseCarouselLabel}>
                      {showcaseProducts.map((product, index) => (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => selectProductAtIndex(index)}
                          aria-label={`${t.hero.goToProduct} ${index + 1}`}
                          aria-pressed={index === activeIndex}
                          className={`h-2 rounded-full transition-all duration-300 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#244A3B] ${index === activeIndex ? 'w-5 bg-[#244A3B]' : 'w-2 bg-[#B8C0B3] hover:bg-[#829477]'}`}
                        />
                      ))}
                    </div>

                    <span dir="ltr" className="min-w-8 text-end font-mono text-[10px] text-[#6D746E]" aria-hidden="true">
                      {activeIndex + 1}/{showcaseProducts.length}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
