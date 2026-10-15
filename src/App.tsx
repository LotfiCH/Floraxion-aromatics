import React, { useState, useEffect } from 'react';
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
import { AboutAndPoliciesView } from './components/storefront/AboutAndPolicies';
import { ArrowRight, Sparkles, Building2 } from 'lucide-react';

export default function App() {
  const [locale, setLocale] = useState<Locale>('fr');
  const [activeView, setActiveView] = useState<string>('home');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quotePreselectedProduct, setQuotePreselectedProduct] = useState<Product | null>(null);
  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);

  // Synchronized Storage State
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [shippingRules, setShippingRules] = useState<WilayaDeliveryRule[]>([]);
  const [settings, setSettings] = useState(storage.getSettings());
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [currentStaff, setCurrentStaff] = useState(storage.getCurrentStaff());
  const [cart, setCart] = useState<CartItem[]>([]);

  const refreshData = () => {
    setProducts(storage.getProducts());
    setOrders(storage.getOrders());
    setQuotations(storage.getQuotations());
    setShippingRules(storage.getShippingRules());
    setSettings(storage.getSettings());
    setAuditLogs(storage.getAuditLogs());
    setCurrentStaff(storage.getCurrentStaff());
    setCart(storage.getCart());
  };

  useEffect(() => {
    refreshData();
    // Sync initial HTML document direction
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
  }, [locale]);

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

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F7F2] text-[#292D29]">
      {/* Global Navigation Top Bar */}
      <Header
        locale={locale}
        setLocale={setLocale}
        activeView={activeView}
        setActiveView={setActiveView}
        cartCount={totalCartCount}
        openCart={() => setIsCartDrawerOpen(true)}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
      />

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
                    <span>Voir l'intégralité des 35 références</span>
                    <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                  </button>
                </div>

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
                      <span>Demander une Cotation B2B</span>
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* VIEW: SHOP / CATALOGUE */}
        {activeView === 'shop' && (
          <ShopView
            products={products}
            locale={locale}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            onSelectProduct={handleSelectProduct}
            onQuickAdd={handleQuickAdd}
          />
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

        {/* VIEW: ADMIN DASHBOARD */}
        {activeView === 'admin' && (
          <AdminDashboard
            products={products}
            orders={orders}
            quotations={quotations}
            shippingRules={shippingRules}
            settings={settings}
            auditLogs={auditLogs}
            currentStaff={currentStaff}
            locale={locale}
            onRefreshData={refreshData}
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
        setActiveView={setActiveView}
        setSelectedCategory={setSelectedCategory}
      />
    </div>
  );
}
