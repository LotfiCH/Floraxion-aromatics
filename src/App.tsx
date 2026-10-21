import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import {
  AuditLogEntry,
  CartItem,
  Locale,
  Order,
  Product,
  ProductVariant,
  Quotation,
  WilayaDeliveryRule,
} from './types';
import { storage } from './lib/storage';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { Hero } from './components/storefront/Hero';
import { CategoryDiscovery } from './components/storefront/CategoryDiscovery';
import { ProductCard } from './components/storefront/ProductCard';
import { ProductDetail } from './components/storefront/ProductDetail';
import { ShopView } from './components/storefront/ShopView';
import { CartDrawer } from './components/cart/CartDrawer';
import { CheckoutView } from './components/checkout/CheckoutView';
import { OrderConfirmationView } from './components/checkout/OrderConfirmationView';
import { B2BQuoteView } from './components/quote/B2BQuoteView';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminLogin } from './components/admin/AdminLogin';
import { AdminProtectedRoute } from './components/admin/AdminProtectedRoute';
import { AboutAndPoliciesView } from './components/storefront/AboutAndPolicies';
import { ArrowRight, Sparkles, Building2, Droplets, ShieldCheck, Award, Leaf } from 'lucide-react';
import { getDictionary } from './lib/i18n';
import { useAuth } from './lib/auth';
import { subscribeProducts } from './lib/products';

export default function App() {
  const navigate = useNavigate();
  const { admin } = useAuth();
  const canManageCatalogue = admin?.role === 'super_admin' || admin?.role === 'catalogue_manager';
  const [locale, setLocale] = useState<Locale>('fr');
  const [activeView, setActiveView] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '').toLowerCase();
      const params = new URLSearchParams(window.location.search);
      const viewParam = params.get('view')?.toLowerCase();
      const target = (hash || viewParam || '') as string;
      if (['b2b', 'shop', 'about', 'home'].includes(target)) {
        return target;
      }
    }
    return 'home';
  });
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quotePreselectedProduct, setQuotePreselectedProduct] = useState<Product | null>(null);
  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [oliveSubFilter, setOliveSubFilter] = useState<'all' | 'crus' | 'aromatized'>('all');

  // Synchronized Storage State
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [shippingRules, setShippingRules] = useState<WilayaDeliveryRule[]>([]);
  const [settings, setSettings] = useState(storage.getSettings());
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [currentStaff, setCurrentStaff] = useState(storage.getCurrentStaff());
  const [cart, setCart] = useState<CartItem[]>([]);

  const refreshData = () => {
    setOrders(storage.getOrders());
    setQuotations(storage.getQuotations());
    setShippingRules(storage.getShippingRules());
    setSettings(storage.getSettings());
    setAuditLogs(storage.getAuditLogs());
    setCurrentStaff(storage.getCurrentStaff());
    setCart(storage.getCart());
  };

  useEffect(() => {
    setProductsLoading(true);
    setProductsError(null);
    const unsubscribe = subscribeProducts(
      canManageCatalogue,
      (nextProducts) => {
        setProducts(nextProducts);
        setProductsLoading(false);
      },
      (error) => {
        console.error('Firestore catalogue subscription failed:', error);
        setProductsError('Le catalogue partagé est indisponible. Aucune copie locale ne sera utilisée à sa place.');
        setProductsLoading(false);
      },
    );
    return unsubscribe;
  }, [canManageCatalogue]);

  useEffect(() => {
    refreshData();
    // Sync initial HTML document direction
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
  }, [locale]);

  // URL Hash & Query routing sync (e.g. #shop, #b2b, #home, or legacy #admin)
  useEffect(() => {
    const handleLocationChange = () => {
      if (typeof window === 'undefined') return;
      const hash = window.location.hash.replace('#', '').toLowerCase();
      const params = new URLSearchParams(window.location.search);
      const viewParam = params.get('view')?.toLowerCase();

      if (hash === 'admin' || viewParam === 'admin') {
        window.history.replaceState(null, '', '/admin/dashboard');
        navigate('/admin/dashboard', { replace: true });
        return;
      }

      const target = hash || viewParam;
      if (['b2b', 'shop', 'about', 'home'].includes(target || '')) {
        setActiveView(target || 'home');
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
    };

    handleLocationChange();
    window.addEventListener('hashchange', handleLocationChange);
    window.addEventListener('popstate', handleLocationChange);
    return () => {
      window.removeEventListener('hashchange', handleLocationChange);
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, [navigate]);

  const navigateToView = (view: string) => {
    if (view === 'admin') {
      navigate('/admin/dashboard');
      return;
    }
    setActiveView(view);
    if (typeof window !== 'undefined') {
      window.location.hash = view;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Cart operations
  const handleAddToCart = (product: Product, variant: ProductVariant, quantity: number) => {
    const existing = cart.find(
      (item) => item.productId === product.id && item.variantId === variant.id
    );

    let updatedCart: CartItem[];
    if (existing) {
      updatedCart = cart.map((item) =>
        item.productId === product.id && item.variantId === variant.id
          ? { ...item, quantity: item.quantity + quantity }
          : item
      );
    } else {
      const newItem: CartItem = {
        productId: product.id,
        variantId: variant.id,
        productName: {
          fr: product.translations.fr.name,
          ar: product.translations.ar.name,
        },
        botanicalName: product.botanicalName,
        variantLabel: {
          fr: variant.packagingLabel.fr,
          ar: variant.packagingLabel.ar,
        },
        sku: variant.sku,
        unitPriceDZD: variant.priceDZD || 0,
        quantity,
        imageTag: product.imageTag,
        maxStock: variant.stockQuantity,
      };
      updatedCart = [newItem, ...cart];
    }

    setCart(updatedCart);
    storage.saveCart(updatedCart);
    setIsCartDrawerOpen(true);
  };

  const handleUpdateCartQty = (productId: string, variantId: string, quantity: number) => {
    let updatedCart: CartItem[];
    if (quantity <= 0) {
      updatedCart = cart.filter(
        (i) => !(i.productId === productId && i.variantId === variantId)
      );
    } else {
      updatedCart = cart.map((i) =>
        i.productId === productId && i.variantId === variantId ? { ...i, quantity } : i
      );
    }
    setCart(updatedCart);
    storage.saveCart(updatedCart);
  };

  const handleRemoveCartItem = (productId: string, variantId: string) => {
    const updatedCart = cart.filter(
      (i) => !(i.productId === productId && i.variantId === variantId)
    );
    setCart(updatedCart);
    storage.saveCart(updatedCart);
  };

  const handleOrderCompleted = (order: Order) => {
    setLastOrder(order);
    setCart([]);
    refreshData();
    setActiveView('confirmation');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setActiveView('product-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleQuickAdd = (product: Product) => {
    const firstP = product.variants.find((v) => v.isActive && v.isPurchasableOnline);
    if (firstP) {
      handleAddToCart(product, firstP, 1);
    }
  };

  const handleQuoteForProduct = (product: Product) => {
    setQuotePreselectedProduct(product);
    setActiveView('b2b');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const storefrontContent = (
    <div className="min-h-screen flex flex-col bg-[#F8F7F2] text-[#292D29]">
      {/* Global Navigation Top Bar */}
      <Header
        locale={locale}
        setLocale={setLocale}
        activeView={activeView}
        setActiveView={navigateToView}
        cartCount={totalCartCount}
        openCart={() => setIsCartDrawerOpen(true)}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
      />

      {(productsLoading || productsError) && (
        <div className={`px-4 py-2 text-center text-xs ${productsError ? 'bg-rose-50 text-rose-800' : 'bg-[#EAE8D9] text-[#244A3B]'}`} role={productsError ? 'alert' : 'status'}>
          {productsError || 'Chargement du catalogue partagé…'}
        </div>
      )}

      {/* Main Content Area based on activeView */}
      <main className="flex-1">
        {/* VIEW: HOME */}
        {activeView === 'home' && (
          <div>
            {/* Hero Section */}
            <Hero
              locale={locale}
              onExplore={() => {
                setSelectedCategory(null);
                setActiveView('shop');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onRequestQuote={() => {
                setQuotePreselectedProduct(null);
                setActiveView('b2b');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />

            {/* Three Botanical Worlds */}
            <CategoryDiscovery
              locale={locale}
              onSelectCategory={(slug) => {
                setSelectedCategory(slug);
                setActiveView('shop');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />

            {/* Featured Selection of 6 Products */}
            <section className="py-16 sm:py-20 border-b border-[#E3E5DF]">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
                  <div>
                    <span className="text-xs font-mono uppercase tracking-widest text-[#829477] font-medium">
                      SÉLECTION EMBLÉMATIQUE
                    </span>
                    <h2 className="font-serif-botanical text-2xl sm:text-4xl font-bold text-[#244A3B] mt-1">
                      Les Essences Rares du Terroir
                    </h2>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedCategory(null);
                      setActiveView('shop');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#244A3B] hover:underline cursor-pointer"
                  >
                    <span>{locale === 'ar' ? 'عرض كافة الـ 45 منتجاً' : "Voir l'intégralité des 45 références"}</span>
                    <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                  </button>
                </div>

                {productsError && <div role="alert" className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-800 text-sm">{productsError}</div>}
                {productsLoading && <div role="status" className="mb-6 p-4 bg-[#EAE8D9] text-[#244A3B] text-sm">Chargement du catalogue partagé…</div>}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                  {products
                    .filter((p) => p.isFeatured && p.status === 'published')
                    .slice(0, 6)
                    .map((prod) => (
                      <ProductCard
                        key={prod.id}
                        product={prod}
                        locale={locale}
                        onSelect={handleSelectProduct}
                        onQuickAdd={handleQuickAdd}
                      />
                    ))}
                </div>
              </div>
            </section>

            {/* DEDICATED SECTION: HUILES D’OLIVE VIERGE EXTRA & AROMATISÉES (10 PRODUITS) */}
            <section id="olive-oils" className="py-16 sm:py-24 bg-[#F8F7F0] border-b border-[#E3E5DF] scroll-mt-20">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-10 gap-6">
                  <div className="max-w-3xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#EAE8D9] text-[#556B2F] text-[11px] font-mono uppercase tracking-wider rounded-xs mb-3">
                      <Droplets className="w-3.5 h-3.5 text-[#8F9754]" />
                      <span>{locale === 'ar' ? 'محاصيل مختارة ونقع عطري نباتي أصيل' : 'GRANDS CRUS & MACÉRATIONS BOTANIQUES DU TERROIR'}</span>
                    </div>
                    <h2 className="font-serif-botanical text-2xl sm:text-4xl lg:text-5xl font-bold text-[#244A3B] leading-tight">
                      {locale === 'ar'
                        ? 'زيوت الزيتون البكر الممتاز والمنكّهة بالأعشاب الطبيعية'
                        : 'Huiles d’Olive Vierge Extra & Infusions Aromatisées'}
                    </h2>
                    <p className="text-xs sm:text-sm text-[#6D746E] mt-3 leading-relaxed">
                      {locale === 'ar'
                        ? 'أجود أصناف زيت الزيتون المعصورة على البارد (< 22° مئوية) من بساتين سيق العريقة، مرتفعات جرجرة، الأوراس، وسهول المتيجة. بحموضة معتمدة فائقة الانخفاض (< 0.20%)، إضافة إلى تشكيلة من الزيوت المنكّهة بنقع بطيء لأعشابنا العطرية البرية وحمضياتنا الطازجة.'
                        : 'Grands crus mono-variétaux (Sigoise, Chemlal, Azeradj, Limli) extraits à froid (< 22°C) à très basse acidité (< 0,20%), et macérations artisanales sublimées par nos cueillettes de romarin sauvage, zaatar des coteaux, agrumes de la Mitidja, piment fumé et truffe du terroir.'}
                    </p>

                    {/* Terroir & Quality Badges */}
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-4 text-[11px] text-[#556B2F] font-medium">
                      <span className="inline-flex items-center gap-1 bg-white px-2.5 py-1 rounded-xs border border-[#E3E5DF] shadow-2xs">
                        <Award className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <span>{locale === 'ar' ? 'عصرة أولى على البارد < 22°C' : '1ère Pression à Froid < 22°C'}</span>
                      </span>
                      <span className="inline-flex items-center gap-1 bg-white px-2.5 py-1 rounded-xs border border-[#E3E5DF] shadow-2xs">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#3E5C38]" />
                        <span>{locale === 'ar' ? 'حموضة معتمدة < 0.20%' : 'Acidité Certifiée < 0,20%'}</span>
                      </span>
                      <span className="inline-flex items-center gap-1 bg-white px-2.5 py-1 rounded-xs border border-[#E3E5DF] shadow-2xs">
                        <Leaf className="w-3.5 h-3.5 text-[#556B2F]" />
                        <span>{locale === 'ar' ? 'أعشاب برية وحمضيات طازجة' : 'Infusions Botaniques Naturelles'}</span>
                      </span>
                    </div>
                  </div>

                  {/* Sub-Filter Tabs & CTA */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
                    <div className="inline-flex p-1 bg-white border border-[#E3E5DF] rounded-xs shadow-2xs">
                      <button
                        onClick={() => setOliveSubFilter('all')}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-xs transition-colors cursor-pointer ${
                          oliveSubFilter === 'all'
                            ? 'bg-[#244A3B] text-white'
                            : 'text-[#6D746E] hover:text-[#244A3B]'
                        }`}
                      >
                        {locale === 'ar' ? 'كافة الأصناف (10)' : 'Toutes les 10 Huiles'}
                      </button>
                      <button
                        onClick={() => setOliveSubFilter('crus')}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-xs transition-colors cursor-pointer ${
                          oliveSubFilter === 'crus'
                            ? 'bg-[#244A3B] text-white'
                            : 'text-[#6D746E] hover:text-[#244A3B]'
                        }`}
                      >
                        {locale === 'ar' ? 'المحاصيل النقية (4)' : 'Grands Crus Purs (4)'}
                      </button>
                      <button
                        onClick={() => setOliveSubFilter('aromatized')}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-xs transition-colors cursor-pointer ${
                          oliveSubFilter === 'aromatized'
                            ? 'bg-[#244A3B] text-white'
                            : 'text-[#6D746E] hover:text-[#244A3B]'
                        }`}
                      >
                        {locale === 'ar' ? 'المنكّهة بالأعشاب (6)' : 'Aromatisées (6)'}
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedCategory('olive-oils');
                        setActiveView('shop');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#244A3B] hover:text-[#1C3A2E] underline underline-offset-4 cursor-pointer"
                    >
                      <span>{locale === 'ar' ? 'عرض الكتالوج الكامل' : 'Voir tout dans le catalogue'}</span>
                      <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                    </button>
                  </div>
                </div>

                {/* 10 Products Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-7">
                  {products
                    .filter((p) => p.categoryId === 'olive-oils' && p.status === 'published')
                    .filter((p) => {
                      if (oliveSubFilter === 'crus') return !p.slug.includes('aromatisee');
                      if (oliveSubFilter === 'aromatized') return p.slug.includes('aromatisee');
                      return true;
                    })
                    .map((prod) => (
                      <ProductCard
                        key={prod.id}
                        product={prod}
                        locale={locale}
                        onSelect={handleSelectProduct}
                        onQuickAdd={handleQuickAdd}
                      />
                    ))}
                </div>

                {/* Wholesale / Bulk Prompt */}
                <div className="mt-12 p-6 bg-white border border-[#E3E5DF] rounded-xs shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xs bg-[#F4F1E8] flex items-center justify-center text-[#244A3B] shrink-0 border border-[#E3E5DF]">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#244A3B]">
                        {locale === 'ar'
                          ? 'طلبيات الجملة والتوريد للمطاعم والفنادق والموزعين'
                          : 'Approvisionnement Gastronomique & Professionnel'}
                      </h4>
                      <p className="text-xs text-[#6D746E] mt-0.5">
                        {locale === 'ar'
                          ? 'تتوفر عبوات احترافية سعة 5 لتر، 25 لتر وبراميل للمطاعم الفاخرة وشركات التغذية مع شهادات التحليل المخبري.'
                          : 'Conditionnements professionnels en bidons 5 L, fûts 25 L à 200 L avec certificats d’analyse par lot et tarifs dégressifs.'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setQuotePreselectedProduct(null);
                      setActiveView('b2b');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="px-5 py-2.5 bg-[#244A3B] hover:bg-[#1C3A2E] text-white text-xs font-semibold rounded-xs transition-colors cursor-pointer shrink-0 inline-flex items-center gap-2 shadow-2xs"
                  >
                    <span>{locale === 'ar' ? 'طلب تسعيرة كميات' : 'Demander un Devis Vrac'}</span>
                    <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                  </button>
                </div>
              </div>
            </section>

            {/* Wholesale B2B Banner Strip */}
            <section className="py-16 bg-[#244A3B] text-[#F4F1E8]">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  <div className="lg:col-span-8 space-y-3">
                    <span className="text-xs uppercase font-mono tracking-widest text-[#829477]">
                      ESPACE INDUSTRIEL & LABORATOIRES
                    </span>
                    <h2 className="font-serif-botanical text-2xl sm:text-4xl font-bold text-white leading-tight">
                      Approvisionnement en Vrac & Fûts pour Professionnels
                    </h2>
                    <p className="text-sm text-[#F4F1E8]/80 leading-relaxed max-w-2xl font-normal">
                      Conditionnements industriels de 1 kg à 200 kg, certificats chromatographiques GC-MS par lot, facturation avec NIF/RC et assistance technique galénique.
                    </p>
                  </div>

                  <div className="lg:col-span-4 text-start lg:text-end">
                    <button
                      onClick={() => {
                        setQuotePreselectedProduct(null);
                        setActiveView('b2b');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="px-6 py-3.5 bg-white text-[#244A3B] hover:bg-[#F4F1E8] text-xs font-semibold uppercase tracking-wider rounded-xs transition-colors cursor-pointer inline-flex items-center gap-2 shadow-md"
                    >
                      <Building2 className="w-4 h-4" />
                      <span>{locale === 'ar' ? 'طلب تسعيرة للمهنيين' : 'Demander un Devis Professionnel'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* VIEW: SHOP / CATALOGUE */}
        {activeView === 'shop' && (
          <>
            {productsError && <div role="alert" className="mx-auto my-6 max-w-7xl px-4"><div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-sm">{productsError}</div></div>}
            {productsLoading && <div role="status" className="mx-auto my-6 max-w-7xl px-4"><div className="p-4 bg-[#EAE8D9] text-[#244A3B] text-sm">Chargement du catalogue partagé…</div></div>}
            <ShopView
              products={products}
              locale={locale}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              onSelectProduct={handleSelectProduct}
              onQuickAdd={handleQuickAdd}
            />
          </>
        )}

        {/* VIEW: PRODUCT DETAIL (PDP) */}
        {activeView === 'product-detail' && selectedProduct && (
          <ProductDetail
            product={selectedProduct}
            allProducts={products}
            locale={locale}
            onBack={() => setActiveView('shop')}
            onAddToCart={handleAddToCart}
            onRequestQuoteForProduct={handleQuoteForProduct}
            onSelectRelated={handleSelectProduct}
          />
        )}

        {/* VIEW: CHECKOUT */}
        {activeView === 'checkout' && (
          <CheckoutView
            items={cart}
            locale={locale}
            wilayas={shippingRules}
            settings={settings}
            onBackToCart={() => setIsCartDrawerOpen(true)}
            onOrderCompleted={handleOrderCompleted}
          />
        )}

        {/* VIEW: ORDER CONFIRMATION */}
        {activeView === 'confirmation' && lastOrder && (
          <OrderConfirmationView
            order={lastOrder}
            settings={settings}
            locale={locale}
            onContinueShopping={() => {
              setActiveView('shop');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {/* VIEW: B2B QUOTE REQUEST */}
        {activeView === 'b2b' && (
          <B2BQuoteView
            products={products}
            wilayas={shippingRules}
            locale={locale}
            preselectedProduct={quotePreselectedProduct}
            onContinue={() => {
              setActiveView('shop');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {/* VIEWS: ABOUT & POLICIES */}
        {(activeView === 'about' ||
          activeView === 'shipping' ||
          activeView === 'returns' ||
          activeView === 'terms' ||
          activeView === 'legal') && (
          <AboutAndPoliciesView
            viewType={activeView as any}
            locale={locale}
            settings={settings}
            onBack={() => setActiveView('home')}
          />
        )}
      </main>

      {/* Cart Slide-Over Drawer */}
      <CartDrawer
        isOpen={isCartDrawerOpen}
        onClose={() => setIsCartDrawerOpen(false)}
        items={cart}
        onUpdateQuantity={handleUpdateCartQty}
        onRemoveItem={handleRemoveCartItem}
        onCheckout={() => {
          setIsCartDrawerOpen(false);
          setActiveView('checkout');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        locale={locale}
        freeShippingThreshold={settings.freeShippingThresholdDZD}
      />

      {/* Global Footer */}
      <Footer
        locale={locale}
        setActiveView={navigateToView}
        setSelectedCategory={setSelectedCategory}
      />
    </div>
  );

  return (
    <Routes>
      {/* 1. Public Admin Login page for unauthenticated visitors */}
      <Route path="/admin" element={<AdminLogin />} />

      {/* 2. Protected Admin Dashboard & Dedicated Subroutes: /admin/dashboard, /admin/products, /admin/orders, /admin/quotes, /admin/settings, /admin/shipping, /admin/audit, /admin/csv */}
      <Route
        path="/admin/*"
        element={
          <AdminProtectedRoute>
            <AdminDashboard
              products={products}
              orders={orders}
              quotations={quotations}
              shippingRules={shippingRules}
              settings={settings}
              auditLogs={auditLogs}
              currentStaff={currentStaff}
              locale={locale}
              productsError={productsError}
              productsLoading={productsLoading}
              onRefreshData={refreshData}
            />
          </AdminProtectedRoute>
        }
      />

      {/* 3. Public Storefront */}
      <Route path="*" element={storefrontContent} />
    </Routes>
  );
}

