import React, { useState, useMemo, useEffect } from 'react';
import {
  AuditLogEntry,
  CategorySlug,
  Locale,
  Order,
  OrderStatus,
  PaymentStatus,
  Product,
  Quotation,
  SiteSettings,
  StaffRole,
  StaffUser,
  WilayaDeliveryRule,
} from '../../types';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { getDictionary } from '../../lib/i18n';
import { convertQuotationToOrder, formatDZD, validateOrderStatusTransition } from '../../lib/commerce';
import { storage } from '../../lib/storage';
import { applyCatalogueCsvImport, createProduct, deleteProduct, migrateMissingProducts, previewProductMigration, updateProduct, type ProductMigrationPreview } from '../../lib/products';
import { planCatalogueCsvImport, serializeCatalogueCsv, type CsvImportPreview } from '../../lib/catalogueCsv';
import { ProductEditModal } from './ProductEditModal';
import { AdminTeamManagement } from './AdminTeamManagement';
import { getAllowedAdminSections, getDefaultAdminSection, type AdminSection } from '../../lib/adminAccess';
import {
  ShieldAlert,
  Package,
  ShoppingCart,
  FileText,
  Truck,
  Settings,
  History,
  CheckCircle,
  AlertTriangle,
  Upload,
  Download,
  Copy,
  Trash2,
  Search,
  Check,
  Building,
  UserCheck,
  LogOut,
  ArrowLeft,
  ShieldCheck,
  Users,
} from 'lucide-react';

interface AdminDashboardProps {
  products: Product[];
  orders: Order[];
  quotations: Quotation[];
  shippingRules: WilayaDeliveryRule[];
  settings: SiteSettings;
  auditLogs: AuditLogEntry[];
  currentStaff: StaffUser;
  locale: Locale;
  productsError: string | null;
  productsLoading: boolean;
  onRefreshData: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  products,
  orders,
  quotations,
  shippingRules,
  settings,
  auditLogs,
  currentStaff,
  locale,
  productsError,
  productsLoading,
  onRefreshData,
}) => {
  const t = getDictionary(locale);

  const location = useLocation();
  const navigate = useNavigate();
  const { admin, logout } = useAuth();

  // Dashboard component state
  const [productSearch, setProductSearch] = useState('');
  const [productCatFilter, setProductCatFilter] = useState('all');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [migrationPreview, setMigrationPreview] = useState<ProductMigrationPreview | null>(null);
  const [migrationProducts, setMigrationProducts] = useState<Product[]>([]);
  const [migrationSource, setMigrationSource] = useState<'localStorage' | 'bundled' | null>(null);
  const [isMigrating, setIsMigrating] = useState(false);

  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const [quoteStatusFilter, setQuoteStatusFilter] = useState('all');
  const [selectedQuote, setSelectedQuote] = useState<Quotation | null>(null);

  const [csvPreview, setCsvPreview] = useState<CsvImportPreview | null>(null);
  const [isCsvImporting, setIsCsvImporting] = useState(false);
  const [csvImportReport, setCsvImportReport] = useState<string | null>(null);

  const [notification, setNotification] = useState<string | null>(null);
  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  // Derive active tab directly from URL pathname
  const getTabFromPath = (path: string): AdminSection => {
    if (path.includes('/admin/products')) return 'products';
    if (path.includes('/admin/orders')) return 'orders';
    if (path.includes('/admin/quotes')) return 'quotes';
    if (path.includes('/admin/settings')) return 'settings';
    if (path.includes('/admin/shipping')) return 'shipping';
    if (path.includes('/admin/audit')) return 'audit';
    if (path.includes('/admin/csv')) return 'csv';
    if (path.includes('/admin/team')) return 'team';
    return 'overview';
  };

  const requestedTab = getTabFromPath(location.pathname);
  const allowedSections = admin ? getAllowedAdminSections(admin.role) : [];
  const activeTab = allowedSections.includes(requestedTab)
    ? requestedTab
    : admin ? getDefaultAdminSection(admin.role) : 'overview';
  const isSuperAdmin = admin?.role === 'super_admin';

  const routeMap: Record<AdminSection, string> = {
      overview: '/admin/dashboard',
      products: '/admin/products',
      orders: '/admin/orders',
      quotes: '/admin/quotes',
      settings: '/admin/settings',
      shipping: '/admin/shipping',
      audit: '/admin/audit',
      csv: '/admin/csv',
      team: '/admin/team',
  };

  useEffect(() => {
    if (activeTab !== requestedTab) {
      navigate(routeMap[activeTab], { replace: true });
    }
  }, [activeTab, navigate, requestedTab]);

  const handleTabChange = (tab: AdminSection) => {
    if (allowedSections.includes(tab)) navigate(routeMap[tab]);
  };

  // Real verified staff user from Firebase Auth & Firestore RBAC
  const activeStaff: StaffUser = admin
    ? {
        id: admin.uid,
        name: admin.displayName,
        email: admin.email,
        role: admin.role,
      }
    : currentStaff;
  const canManageCatalogue = admin?.role === 'super_admin' || admin?.role === 'catalogue_manager';

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/admin', { replace: true });
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // KPIs
  const kpiTotalOrders = orders.length;
  const kpiAwaitingPayment = orders.filter((o) => o.paymentStatus === 'unpaid' || o.paymentStatus === 'pending').length;
  const kpiPendingQuotes = quotations.filter((q) => q.status === 'submitted' || q.status === 'under_review').length;
  const kpiLowStock = products.filter((p) =>
    p.variants.some((v) => v.trackInventory && v.stockQuantity < 25)
  ).length;

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (productCatFilter !== 'all' && p.categoryId !== productCatFilter) return false;
      if (productSearch.trim()) {
        const q = productSearch.toLowerCase();
        return (
          p.sku.toLowerCase().includes(q) ||
          p.translations.fr.name.toLowerCase().includes(q) ||
          (p.botanicalName || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [products, productCatFilter, productSearch]);

  // Order Actions
  const handleVerifyPayment = (orderId: string) => {
    const ord = orders.find((o) => o.id === orderId);
    if (!ord) return;

    const updated: Order = {
      ...ord,
      paymentStatus: 'paid',
      status: ord.status === 'pending' ? 'confirmed' : ord.status,
      paymentVerification: {
        verifiedAt: new Date().toISOString(),
        verifiedBy: activeStaff.name,
        notes: `Règlement vérifié et encaissé par ${activeStaff.name}`,
      },
      updatedAt: new Date().toISOString(),
    };

    storage.updateOrder(updated, activeStaff.name);
    onRefreshData();
    setSelectedOrder(updated);
    showNotification(`Paiement de la commande ${ord.orderNumber} validé avec succès.`);
  };

  const handleUpdateOrderStatus = (orderId: string, targetStatus: OrderStatus) => {
    const ord = orders.find((o) => o.id === orderId);
    if (!ord) return;

    if (!validateOrderStatusTransition(ord.status, targetStatus)) {
      alert(`Transition illégale : Impossible de passer de ${ord.status} à ${targetStatus}.`);
      return;
    }

    const updated: Order = {
      ...ord,
      status: targetStatus,
      updatedAt: new Date().toISOString(),
    };

    storage.updateOrder(updated, activeStaff.name);
    onRefreshData();
    setSelectedOrder(updated);
    showNotification(`Commande ${ord.orderNumber} marquée comme ${targetStatus}.`);
  };

  // Convert Quote to Order
  const handleConvertQuote = (quote: Quotation) => {
    try {
      const { order, updatedQuotation } = convertQuotationToOrder(quote);
      storage.addOrder(order);
      storage.updateQuotation(updatedQuotation, activeStaff.name);
      onRefreshData();
      setSelectedQuote(null);
      showNotification(`Devis ${quote.quotationNumber} converti en commande ${order.orderNumber} !`);
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la conversion du devis.');
    }
  };

  // Save Quote Price Edits
  const handleSaveQuotePrices = (
    quoteId: string,
    prices: Record<string, number>,
    shipping: number,
    status: Quotation['status']
  ) => {
    const q = quotations.find((x) => x.id === quoteId);
    if (!q) return;

    const updatedItems = q.items.map((it) => {
      const unitPrice = prices[it.id] !== undefined ? prices[it.id] : it.unitPriceDZD || 0;
      return {
        ...it,
        unitPriceDZD: unitPrice,
        lineTotalDZD: unitPrice * it.requestedQuantity,
      };
    });

    const subtotal = updatedItems.reduce((acc, it) => acc + (it.lineTotalDZD || 0), 0);
    const total = subtotal + shipping;

    const updated: Quotation = {
      ...q,
      status,
      items: updatedItems,
      subtotalDZD: subtotal,
      shippingFeeDZD: shipping,
      totalDZD: total,
      revisionNumber: q.revisionNumber + 1,
      updatedAt: new Date().toISOString(),
    };

    storage.updateQuotation(updated, activeStaff.name);
    onRefreshData();
    setSelectedQuote(updated);
    showNotification(`Devis ${q.quotationNumber} mis à jour.`);
  };

  // Product Save Operation
  const handleSaveProduct = async (updatedProduct: Product) => {
    try {
      const productToSave = { ...updatedProduct, updatedAt: new Date().toISOString() };
      if (isCreatingProduct) await createProduct(productToSave);
      else await updateProduct(productToSave);
      onRefreshData();
      setEditingProduct(null);
      setIsCreatingProduct(false);
      showNotification(
        `Produit « ${productToSave.translations?.fr?.name || productToSave.sku} » (${productToSave.sku}) enregistré avec succès.`
      );
    } catch (err: any) {
      console.error('Erreur lors de la sauvegarde du produit:', err);
      throw new Error(err?.message || 'Une erreur est survenue lors de l’enregistrement du produit.');
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    if (!window.confirm(`Supprimer définitivement « ${product.translations.fr.name} » du catalogue partagé ?`)) return;
    try {
      await deleteProduct(product.id);
      showNotification(`Produit ${product.sku} supprimé du catalogue partagé.`);
    } catch (err: any) {
      showNotification(err?.message || 'La suppression du produit a échoué.');
    }
  };

  const handleDuplicateProduct = (source: Product) => {
    const token = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
    const id = `product-${token}`;
    const sku = `${source.sku.slice(0, 48)}-COPY-${token.toUpperCase()}`;
    const now = new Date().toISOString();
    const draft: Product = {
      ...JSON.parse(JSON.stringify(source)),
      id,
      sku,
      slug: `${source.slug.slice(0, 80)}-copy-${token}`,
      status: 'draft',
      isFeatured: false,
      translations: {
        fr: { ...source.translations.fr, name: `${source.translations.fr.name} (copie)` },
        ar: { ...source.translations.ar, name: `${source.translations.ar.name} (نسخة)` },
      },
      variants: source.variants.map((variant, index) => ({
        ...variant,
        id: `${id}-variant-${index + 1}`,
        productId: id,
        sku: `${sku}-${index + 1}`,
      })),
      documents: source.documents.map((document, index) => ({ ...document, id: `${id}-document-${index + 1}` })),
      createdAt: now,
      updatedAt: now,
    };
    setIsCreatingProduct(true);
    setEditingProduct(draft);
  };

  const handlePreviewMigration = async () => {
    try {
      const legacy = storage.getProductsForMigration();
      const preview = await previewProductMigration(legacy.products);
      setMigrationProducts(legacy.products);
      setMigrationSource(legacy.source);
      setMigrationPreview(preview);
    } catch (err: any) {
      showNotification(err?.message || 'Impossible de préparer l’aperçu de migration.');
    }
  };

  const handleConfirmMigration = async () => {
    if (!migrationPreview || migrationPreview.oversizedIds.length > 0) return;
    const importCount = migrationPreview.candidates.length;
    if (!window.confirm(`Ajouter ${importCount} produit(s) qui n’existent pas encore dans Firestore ? Les documents existants seront ignorés et aucune donnée locale ne sera supprimée.`)) return;
    setIsMigrating(true);
    try {
      const result = await migrateMissingProducts(migrationPreview.candidates);
      setMigrationPreview(null);
      showNotification(`Migration terminée : ${result.created} créé(s), ${result.skipped} ignoré(s) car déjà présents.`);
    } catch (err: any) {
      showNotification(err?.message || 'La migration a échoué. Les documents déjà créés restent dans Firestore.');
    } finally {
      setIsMigrating(false);
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    const csvContent = serializeCatalogueCsv(products);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `catalogue_floraxion_35skus_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification('Export CSV du catalogue téléchargé.');
  };

  const handleApplyCsvImport = async () => {
    if (!csvPreview || isCsvImporting) return;
    const eligible = csvPreview.creates.length + csvPreview.updates.length;
    if (!eligible || !window.confirm(`Appliquer ${csvPreview.creates.length} création(s) et ${csvPreview.updates.length} mise(s) à jour dans Firestore ? Les champs absents ou vides sont conservés; aucun produit ne sera supprimé.`)) return;
    setIsCsvImporting(true);
    setCsvImportReport(null);
    try {
      const result = await applyCatalogueCsvImport(csvPreview);
      onRefreshData();
      const summary = `Import terminé : ${result.created.length} créé(s), ${result.updated.length} mis à jour, ${result.unchanged} inchangé(s), ${result.duplicates} doublon(s), ${result.validationErrors} erreur(s) de validation, ${result.failed.length} échec(s) d’écriture.`;
      setCsvImportReport(result.failed.length ? `${summary} Échecs : ${result.failed.map((item) => `${item.productId} (${item.message})`).join('; ')}` : summary);
      setCsvPreview(null);
      showNotification('Import CSV terminé. Consultez le rapport détaillé.');
    } catch (error) {
      setCsvImportReport(`Import interrompu : ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsCsvImporting(false);
    }
  };

  return (
    <div className="py-8 bg-[#F4F1E8] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Top Header & Role Switcher */}
        <div className="bg-white p-6 rounded-xs border border-[#E3E5DF] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#829477]">
              <span>FLORAXION AROMATICS · BACK-OFFICE</span>
            </div>
            <h1 className="font-serif-botanical text-2xl sm:text-3xl font-bold text-[#244A3B] mt-0.5">
              {t.admin.title}
            </h1>
          </div>

          {/* Authenticated Administrator Profile & Session Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2.5 bg-[#FAF9F5] py-1.5 px-3 border border-[#E3E5DF] rounded-xs shadow-2xs">
              <div className="w-8 h-8 rounded-full bg-[#244A3B] text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs">
                {activeStaff.name.charAt(0)}
              </div>
              <div className="text-start">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-[#244A3B] leading-tight">
                    {activeStaff.name}
                  </span>
                  <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold rounded-xs uppercase">
                    {activeStaff.role}
                  </span>
                </div>
                <span className="text-[11px] text-[#6D746E] block font-mono">
                  {activeStaff.email}
                </span>
              </div>
            </div>

            <Link
              to="/"
              className="h-9 px-3 text-xs font-semibold rounded-xs border border-[#E3E5DF] bg-white hover:bg-[#FAF9F5] text-[#244A3B] transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
              title="Voir la boutique publique"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Boutique</span>
            </Link>

            <button
              onClick={handleLogout}
              className="h-9 px-3 text-xs font-semibold rounded-xs border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
              title="Fermer la session administrateur"
              data-testid="admin-logout-btn"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Déconnexion</span>
            </button>
          </div>
        </div>

        {/* Global Notification Banner */}
        {notification && (
          <div className="p-3 bg-[#244A3B] text-white text-xs font-semibold rounded-xs shadow-md flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{notification}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex flex-wrap border-b border-[#E3E5DF] bg-white px-4 rounded-t-xs text-xs font-semibold gap-1">
          {([
            { section: 'overview', label: t.admin.kpis, Icon: null },
            { section: 'products', label: t.admin.productsTab, Icon: Package },
            { section: 'orders', label: `${t.admin.ordersTab} (${orders.length})`, Icon: ShoppingCart },
            { section: 'quotes', label: `${t.admin.quotesTab} (${quotations.length})`, Icon: FileText },
            { section: 'shipping', label: t.admin.shippingTab, Icon: Truck },
            { section: 'csv', label: t.admin.csvTab, Icon: Upload },
            { section: 'settings', label: t.admin.settingsTab, Icon: Settings },
            { section: 'audit', label: t.admin.auditTab, Icon: History },
            { section: 'team', label: locale === 'ar' ? 'إدارة الفريق' : 'Gestion de l’équipe', Icon: Users },
          ] as Array<{ section: AdminSection; label: string; Icon: React.ComponentType<{ className?: string }> | null }>)
            .filter(({ section }) => allowedSections.includes(section)).map(({ section, label, Icon }) => (
              <button
                key={section}
                type="button"
                onClick={() => handleTabChange(section)}
                aria-current={activeTab === section ? 'page' : undefined}
                className={`py-3.5 px-4 cursor-pointer border-b-2 transition-colors flex items-center gap-1.5 ${
                  activeTab === section
                    ? 'border-[#244A3B] text-[#244A3B]'
                    : 'border-transparent text-[#6D746E] hover:text-[#292D29]'
                }`}
              >
                {Icon && <Icon className="w-4 h-4" />}
                <span>{label}</span>
              </button>
            ))}
        </div>

        {/* Tab 1: Overview KPIs */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 border border-[#E3E5DF] rounded-xs shadow-xs">
                <span className="text-[11px] font-medium text-[#6D746E]">
                  {t.admin.ordersCount}
                </span>
                <p className="font-serif-botanical text-3xl font-bold text-[#244A3B] mt-1 tabular-nums">
                  {kpiTotalOrders}
                </p>
                <span className="text-[11px] text-[#829477]">Commandes enregistrées</span>
              </div>

              <div className="bg-white p-5 border border-[#E3E5DF] rounded-xs shadow-xs">
                <span className="text-[11px] font-medium text-[#6D746E]">
                  {t.admin.pendingPayment}
                </span>
                <p className="font-serif-botanical text-3xl font-bold text-amber-700 mt-1 tabular-nums">
                  {kpiAwaitingPayment}
                </p>
                <span className="text-[11px] text-[#6D746E]">Virements ou livraisons à valider</span>
              </div>

              <div className="bg-white p-5 border border-[#E3E5DF] rounded-xs shadow-xs">
                <span className="text-[11px] font-medium text-[#6D746E]">
                  {t.admin.pendingQuotes}
                </span>
                <p className="font-serif-botanical text-3xl font-bold text-blue-700 mt-1 tabular-nums">
                  {kpiPendingQuotes}
                </p>
                <span className="text-[11px] text-[#6D746E]">Demandes en gros reçues</span>
              </div>

              <div className="bg-white p-5 border border-[#E3E5DF] rounded-xs shadow-xs">
                <span className="text-[11px] font-medium text-[#6D746E]">
                  {t.admin.lowStockCount}
                </span>
                <p className="font-serif-botanical text-3xl font-bold text-emerald-800 mt-1 tabular-nums">
                  {kpiLowStock}
                </p>
                <span className="text-[11px] text-[#6D746E]">Variantes sous le seuil d'alerte</span>
              </div>
            </div>

            {/* Recent Orders Overview */}
            <div className="bg-white p-6 border border-[#E3E5DF] rounded-xs shadow-xs space-y-4">
              <h2 className="font-serif-botanical text-lg font-bold text-[#244A3B]">
                Dernières commandes reçues
              </h2>
              <table className="w-full text-xs text-start border border-[#E3E5DF] divide-y divide-[#E3E5DF]">
                <thead className="bg-[#FAF9F5] text-[#244A3B] font-semibold">
                  <tr>
                    <th className="py-2.5 px-4 text-start">N° Commande</th>
                    <th className="py-2.5 px-4 text-start">Client</th>
                    <th className="py-2.5 px-4 text-start">Wilaya</th>
                    <th className="py-2.5 px-4 text-end">Montant Total</th>
                    <th className="py-2.5 px-4 text-center">Paiement</th>
                    <th className="py-2.5 px-4 text-center">Statut</th>
                    <th className="py-2.5 px-4 text-end">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E3E5DF]">
                  {orders.slice(0, 5).map((o) => (
                    <tr key={o.id} className="hover:bg-[#FAF9F5]/60">
                      <td className="py-3 px-4 font-mono font-bold text-[#244A3B]">
                        {o.orderNumber}
                      </td>
                      <td className="py-3 px-4 text-[#292D29]">
                        {o.customerSnapshot.fullName}
                      </td>
                      <td className="py-3 px-4 text-[#6D746E]">
                        {o.customerSnapshot.wilayaName} ({o.customerSnapshot.wilayaCode})
                      </td>
                      <td className="py-3 px-4 text-end font-mono font-bold tabular-nums">
                        {formatDZD(o.totalDZD, locale)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-xs text-[10px] font-semibold ${
                            o.paymentStatus === 'paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {o.paymentStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-[11px] font-medium text-[#292D29]">
                          {o.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-end">
                        <button
                          onClick={() => {
                            setSelectedOrder(o);
                            handleTabChange('orders');
                          }}
                          className="text-[#244A3B] font-semibold hover:underline cursor-pointer"
                        >
                          Détails
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Products Manager */}
        {activeTab === 'products' && (
          <div className="bg-white p-6 border border-[#E3E5DF] rounded-xs shadow-xs space-y-4">
            {productsError && <div role="alert" className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs">{productsError}</div>}
            {productsLoading && <div role="status" className="p-3 bg-[#EAE8D9] text-[#244A3B] text-xs">Chargement du catalogue Firestore…</div>}
            {canManageCatalogue && (
              <section className="p-4 bg-[#FAF9F5] border border-[#E3E5DF] rounded-xs space-y-3" aria-label="Migration catalogue local">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-bold text-[#244A3B]">Importer l’ancien catalogue local</h2>
                    <p className="text-xs text-[#6D746E] mt-1">L’aperçu compare les identifiants. L’import crée uniquement les produits absents et ne supprime ni ne remplace aucune donnée.</p>
                  </div>
                  <button type="button" onClick={handlePreviewMigration} className="px-3 py-2 bg-white border border-[#E3E5DF] text-[#244A3B] text-xs font-semibold rounded-xs hover:bg-[#F4F1E8]">
                    Prévisualiser l’import
                  </button>
                </div>
                {migrationPreview && (
                  <div className="space-y-2 text-xs text-[#292D29]" aria-live="polite">
                    <p>Source : {migrationSource === 'localStorage' ? 'catalogue sauvegardé dans ce navigateur' : 'catalogue initial intégré à l’application'} · {migrationProducts.length} produits trouvés · {migrationPreview.candidates.length} à ajouter · {migrationPreview.existingIds.length} identifiants déjà présents (ignorés).</p>
                    {migrationPreview.duplicateLocalIds.length > 0 && <p className="text-amber-800">Identifiants dupliqués localement, ignorés : {migrationPreview.duplicateLocalIds.join(', ')}</p>}
                    {migrationPreview.oversizedIds.length > 0 && <p className="text-rose-800">Produits trop volumineux pour Firestore : {migrationPreview.oversizedIds.join(', ')}. Hébergez leurs images puis relancez l’aperçu.</p>}
                    <div className="flex flex-wrap gap-2">
                      <button type="button" disabled={isMigrating || migrationPreview.oversizedIds.length > 0 || migrationPreview.candidates.length === 0} onClick={handleConfirmMigration} className="px-3 py-2 bg-[#244A3B] text-white text-xs font-semibold rounded-xs disabled:opacity-50">
                        {isMigrating ? 'Import en cours…' : `Confirmer l’ajout de ${migrationPreview.candidates.length} produit(s)`}
                      </button>
                      <button type="button" onClick={() => setMigrationPreview(null)} className="px-3 py-2 border border-[#E3E5DF] text-xs rounded-xs">Annuler l’aperçu</button>
                    </div>
                  </div>
                )}
              </section>
            )}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-[#829477] absolute start-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Filtrer SKU, plante..."
                    className="ps-8 pe-3 py-1.5 bg-[#FAF9F5] border border-[#E3E5DF] rounded-xs text-xs text-[#292D29]"
                  />
                </div>

                <select
                  value={productCatFilter}
                  onChange={(e) => setProductCatFilter(e.target.value)}
                  className="py-1.5 px-3 bg-[#FAF9F5] border border-[#E3E5DF] rounded-xs text-xs text-[#292D29] cursor-pointer"
                >
                  <option value="all">Toutes familles ({products.length})</option>
                  <option value="olive-oils">Huiles d’Olive Vierge Extra (10)</option>
                  <option value="essential-oils">Huiles Essentielles (28)</option>
                  <option value="vegetable-oils">Huiles Végétales (5)</option>
                  <option value="hydrolats">Hydrolats (2)</option>
                </select>
              </div>

              <div className="text-xs text-[#6D746E]">
                {filteredProducts.length} références affichées
              </div>
            </div>

            <table className="w-full text-xs text-start border border-[#E3E5DF] divide-y divide-[#E3E5DF]">
              <thead className="bg-[#FAF9F5] text-[#244A3B] font-semibold">
                <tr>
                  <th className="py-2.5 px-4 text-start">SKU</th>
                  <th className="py-2.5 px-4 text-start">Nom Produit (FR / AR)</th>
                  <th className="py-2.5 px-4 text-start">Nom Botanique</th>
                  <th className="py-2.5 px-4 text-start">Famille</th>
                  <th className="py-2.5 px-4 text-start">Conditionnements</th>
                  <th className="py-2.5 px-4 text-center">Statut</th>
                  <th className="py-2.5 px-4 text-end">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E3E5DF]">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-[#FAF9F5]/60">
                    <td className="py-3 px-4 font-mono font-bold text-[#244A3B]">{p.sku}</td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-[#292D29]">{p.translations.fr.name}</p>
                      <p className="text-[11px] text-[#6D746E]">{p.translations.ar.name}</p>
                    </td>
                    <td className="py-3 px-4 text-[#829477] italic font-serif">
                      {p.botanicalName || '—'}
                    </td>
                    <td className="py-3 px-4 text-[#6D746E]">
                      {p.categoryId === 'essential-oils'
                        ? 'H. Essentielle'
                        : p.categoryId === 'vegetable-oils'
                        ? 'H. Végétale'
                        : p.categoryId === 'olive-oils'
                        ? 'H. d’Olive Vierge Extra'
                        : 'Hydrolat'}
                    </td>
                    <td className="py-3 px-4 text-[#292D29]">
                      <div className="space-y-0.5">
                        {p.variants.map((v) => (
                          <div key={v.id} className="text-[11px]">
                            <span className="font-mono text-[#244A3B]">{v.sizeValue}{v.sizeUnit}</span> :{' '}
                            <span className="font-semibold tabular-nums">{formatDZD(v.priceDZD, locale)}</span>{' '}
                            <span className="text-[#829477]">({v.stockQuantity} en stock)</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-semibold rounded-xs">
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-end">
                      <div className="inline-flex items-center gap-3">
                        {canManageCatalogue && <>
                          <button type="button" onClick={() => { setIsCreatingProduct(false); setEditingProduct(p); }} className="text-[#244A3B] font-semibold hover:underline cursor-pointer" data-testid={`edit-product-${p.sku}`} aria-label={`Éditer ${p.translations.fr.name}`}>Éditer</button>
                          <button type="button" onClick={() => handleDuplicateProduct(p)} className="text-[#244A3B] hover:underline cursor-pointer inline-flex items-center gap-1" aria-label={`Créer une copie de ${p.translations.fr.name}`}><Copy className="w-3.5 h-3.5"/>Copier</button>
                          <button type="button" onClick={() => handleDeleteProduct(p)} className="text-rose-700 hover:underline cursor-pointer inline-flex items-center gap-1" aria-label={`Supprimer ${p.translations.fr.name}`}><Trash2 className="w-3.5 h-3.5"/>Supprimer</button>
                        </>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Orders Operations */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="bg-white p-6 border border-[#E3E5DF] rounded-xs shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-serif-botanical text-xl font-bold text-[#244A3B]">
                  Commandes d’ingrédients botaniques ({orders.length})
                </h2>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#6D746E]">Filtrer :</span>
                  <select
                    value={orderStatusFilter}
                    onChange={(e) => setOrderStatusFilter(e.target.value)}
                    className="py-1 px-2.5 bg-[#FAF9F5] border border-[#E3E5DF] rounded-xs text-xs cursor-pointer"
                  >
                    <option value="all">Tous les états</option>
                    <option value="pending">En attente (pending)</option>
                    <option value="confirmed">Confirmée (confirmed)</option>
                    <option value="processing">En préparation (processing)</option>
                    <option value="shipped">Expédiée (shipped)</option>
                    <option value="delivered">Livrée (delivered)</option>
                  </select>
                </div>
              </div>

              <table className="w-full text-xs text-start border border-[#E3E5DF] divide-y divide-[#E3E5DF]">
                <thead className="bg-[#FAF9F5] text-[#244A3B] font-semibold">
                  <tr>
                    <th className="py-2.5 px-4 text-start">N° Commande</th>
                    <th className="py-2.5 px-4 text-start">Date</th>
                    <th className="py-2.5 px-4 text-start">Client</th>
                    <th className="py-2.5 px-4 text-start">Mode Paiement</th>
                    <th className="py-2.5 px-4 text-center">Paiement</th>
                    <th className="py-2.5 px-4 text-center">Statut Commande</th>
                    <th className="py-2.5 px-4 text-end">Total DZD</th>
                    <th className="py-2.5 px-4 text-end">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E3E5DF]">
                  {orders
                    .filter((o) => (orderStatusFilter === 'all' ? true : o.status === orderStatusFilter))
                    .map((o) => (
                      <tr key={o.id} className="hover:bg-[#FAF9F5]/60">
                        <td className="py-3 px-4 font-mono font-bold text-[#244A3B]">
                          {o.orderNumber}
                        </td>
                        <td className="py-3 px-4 text-[#6D746E]">
                          {new Date(o.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-[#292D29]">
                          <p className="font-semibold">{o.customerSnapshot.fullName}</p>
                          <p className="text-[11px] text-[#6D746E]">{o.customerSnapshot.phone}</p>
                        </td>
                        <td className="py-3 px-4 text-[#6D746E]">
                          {o.paymentMethod === 'bank_transfer'
                            ? 'Virement Bancaire'
                            : o.paymentMethod === 'cash_on_delivery'
                            ? 'Paiement Livraison'
                            : 'Carte Bancaire'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-xs text-[10px] font-semibold ${
                              o.paymentStatus === 'paid'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {o.paymentStatus}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-medium">
                          {o.status}
                        </td>
                        <td className="py-3 px-4 text-end font-mono font-bold tabular-nums">
                          {formatDZD(o.totalDZD, locale)}
                        </td>
                        <td className="py-3 px-4 text-end">
                          <button
                            onClick={() => setSelectedOrder(o)}
                            className="px-2.5 py-1 bg-[#244A3B] text-white rounded-xs text-[11px] font-semibold hover:bg-[#1C3A2E] cursor-pointer"
                          >
                            Gérer
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Modal Order Inspector */}
            {selectedOrder && (
              <div className="bg-white p-6 border-2 border-[#244A3B] rounded-xs shadow-md space-y-4">
                <div className="flex items-center justify-between border-b border-[#E3E5DF] pb-3">
                  <div>
                    <span className="text-[11px] font-mono uppercase text-[#829477]">
                      INSPECTION COMMANDE
                    </span>
                    <h3 className="font-serif-botanical text-xl font-bold text-[#244A3B]">
                      {selectedOrder.orderNumber}
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="text-xs text-[#6D746E] hover:text-[#292D29] cursor-pointer"
                  >
                    Fermer ✕
                  </button>
                </div>

                {/* Operations Bar */}
                <div className="p-3 bg-[#FAF9F5] border border-[#E3E5DF] rounded-xs flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#292D29]">Validation paiement :</span>
                    {selectedOrder.paymentStatus !== 'paid' ? (
                      <button
                        onClick={() => handleVerifyPayment(selectedOrder.id)}
                        className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xs font-semibold cursor-pointer flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Valider réception des fonds (Paiement OK)</span>
                      </button>
                    ) : (
                      <span className="text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" />
                        <span>Paiement validé par {selectedOrder.paymentVerification?.verifiedBy || 'Staff'}</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#292D29]">Fulfillment :</span>
                    {selectedOrder.status === 'confirmed' && (
                      <button
                        onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'processing')}
                        className="px-2.5 py-1 bg-[#244A3B] text-white rounded-xs font-medium cursor-pointer"
                      >
                        Passer en préparation
                      </button>
                    )}
                    {selectedOrder.status === 'processing' && (
                      <button
                        onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'shipped')}
                        className="px-2.5 py-1 bg-[#244A3B] text-white rounded-xs font-medium cursor-pointer"
                      >
                        Confirmer expédition colis
                      </button>
                    )}
                    {selectedOrder.status === 'shipped' && (
                      <button
                        onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'delivered')}
                        className="px-2.5 py-1 bg-emerald-700 text-white rounded-xs font-medium cursor-pointer"
                      >
                        Confirmer livraison effectuée
                      </button>
                    )}
                  </div>
                </div>

                {/* Items & Address details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs pt-2">
                  <div>
                    <h4 className="font-semibold text-[#829477] uppercase font-mono mb-2">
                      Articles commandés :
                    </h4>
                    <ul className="divide-y divide-[#E3E5DF] border border-[#E3E5DF] p-2 bg-[#FAF9F5] rounded-xs">
                      {selectedOrder.items.map((it: any, idx: number) => (
                        <li key={idx} className="py-2 flex justify-between">
                          <div>
                            <span className="font-bold text-[#292D29]">{it.productNameSnapshot}</span>
                            <span className="text-[11px] text-[#6D746E] block">
                              {it.variantLabelSnapshot} × {it.quantity}
                            </span>
                          </div>
                          <span className="font-mono text-[#244A3B] font-semibold tabular-nums">
                            {formatDZD(it.lineTotalDZD, locale)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-[#829477] uppercase font-mono mb-2">
                      Coordonnées de livraison :
                    </h4>
                    <div className="p-3 bg-[#FAF9F5] border border-[#E3E5DF] rounded-xs space-y-1">
                      <p>
                        <strong>Destinataire :</strong> {selectedOrder.customerSnapshot.fullName}
                      </p>
                      <p>
                        <strong>Téléphone :</strong> {selectedOrder.customerSnapshot.phone}
                      </p>
                      <p>
                        <strong>Adresse :</strong> {selectedOrder.customerSnapshot.streetAddress},{' '}
                        {selectedOrder.customerSnapshot.commune}
                      </p>
                      <p>
                        <strong>Wilaya :</strong> {selectedOrder.customerSnapshot.wilayaName} (
                        {selectedOrder.customerSnapshot.wilayaCode})
                      </p>
                      {selectedOrder.customerNote && (
                        <p className="italic text-[#6D746E] pt-1">
                          « {selectedOrder.customerNote} »
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Quotations Manager */}
        {activeTab === 'quotes' && (
          <div className="space-y-6">
            <div className="bg-white p-6 border border-[#E3E5DF] rounded-xs shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-serif-botanical text-xl font-bold text-[#244A3B]">
                  Demandes de Devis & Approvisionnement Gros ({quotations.length})
                </h2>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#6D746E]">Statut :</span>
                  <select
                    value={quoteStatusFilter}
                    onChange={(e) => setQuoteStatusFilter(e.target.value)}
                    className="py-1 px-2.5 bg-[#FAF9F5] border border-[#E3E5DF] rounded-xs text-xs cursor-pointer"
                  >
                    <option value="all">Toutes les demandes</option>
                    <option value="submitted">Nouvelle soumission (submitted)</option>
                    <option value="under_review">En cours d'étude (under_review)</option>
                    <option value="quoted">Devis chiffré émis (quoted)</option>
                    <option value="converted">Converti en commande (converted)</option>
                  </select>
                </div>
              </div>

              <table className="w-full text-xs text-start border border-[#E3E5DF] divide-y divide-[#E3E5DF]">
                <thead className="bg-[#FAF9F5] text-[#244A3B] font-semibold">
                  <tr>
                    <th className="py-2.5 px-4 text-start">N° Devis</th>
                    <th className="py-2.5 px-4 text-start">Société / Contact</th>
                    <th className="py-2.5 px-4 text-start">Secteur</th>
                    <th className="py-2.5 px-4 text-start">Wilaya</th>
                    <th className="py-2.5 px-4 text-center">Lignes</th>
                    <th className="py-2.5 px-4 text-center">Statut</th>
                    <th className="py-2.5 px-4 text-end">Montant Coté</th>
                    <th className="py-2.5 px-4 text-end">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E3E5DF]">
                  {quotations
                    .filter((q) => (quoteStatusFilter === 'all' ? true : q.status === quoteStatusFilter))
                    .map((q) => (
                      <tr key={q.id} className="hover:bg-[#FAF9F5]/60">
                        <td className="py-3 px-4 font-mono font-bold text-[#244A3B]">
                          {q.quotationNumber}
                        </td>
                        <td className="py-3 px-4 text-[#292D29]">
                          <p className="font-semibold">{q.customer.companyName || q.customer.contactName}</p>
                          <p className="text-[11px] text-[#6D746E]">{q.customer.phone}</p>
                        </td>
                        <td className="py-3 px-4 text-[#6D746E]">{q.customer.activitySector || '—'}</td>
                        <td className="py-3 px-4 text-[#6D746E]">{q.customer.wilayaName}</td>
                        <td className="py-3 px-4 text-center font-mono">{q.items.length}</td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-xs text-[10px] font-semibold ${
                              q.status === 'quoted'
                                ? 'bg-blue-100 text-blue-800'
                                : q.status === 'converted'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {q.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-end font-mono font-bold tabular-nums">
                          {formatDZD(q.totalDZD, locale)}
                        </td>
                        <td className="py-3 px-4 text-end">
                          <button
                            onClick={() => setSelectedQuote(q)}
                            className="px-2.5 py-1 bg-[#244A3B] text-white rounded-xs text-[11px] font-semibold hover:bg-[#1C3A2E] cursor-pointer"
                          >
                            Traiter
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Quotation Editor & Conversion Inspector */}
            {selectedQuote && (
              <div className="bg-white p-6 border-2 border-[#244A3B] rounded-xs shadow-md space-y-6">
                <div className="flex items-center justify-between border-b border-[#E3E5DF] pb-3">
                  <div>
                    <span className="text-[11px] font-mono uppercase text-[#829477]">
                      GESTIONNAIRE DE COTATION B2B
                    </span>
                    <h3 className="font-serif-botanical text-xl font-bold text-[#244A3B]">
                      {selectedQuote.quotationNumber} — {selectedQuote.customer.companyName}
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedQuote(null)}
                    className="text-xs text-[#6D746E] hover:text-[#292D29] cursor-pointer"
                  >
                    Fermer ✕
                  </button>
                </div>

                {/* Conversion Trigger Button */}
                <div className="p-4 bg-[#FAF8F3] border border-[#E3E5DF] rounded-xs flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-[#244A3B]">
                      Conversion en Commande Définitive
                    </p>
                    <p className="text-[11px] text-[#6D746E]">
                      Convertit ce devis accepté en commande ferme dans le système logistique sans ressaisie.
                    </p>
                  </div>
                  {selectedQuote.status === 'converted' ? (
                    <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" />
                      <span>Converti en commande {selectedQuote.convertedOrderId}</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => handleConvertQuote(selectedQuote)}
                      className="px-4 py-2 bg-[#244A3B] hover:bg-[#1C3A2E] text-white text-xs font-semibold rounded-xs cursor-pointer shadow-sm"
                    >
                      {t.admin.convertQuoteToOrder}
                    </button>
                  )}
                </div>

                {/* Line Items Pricing Form */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-[#292D29] uppercase font-mono">
                    Tarification des lignes de produits :
                  </h4>
                  <table className="w-full text-xs border border-[#E3E5DF] divide-y divide-[#E3E5DF]">
                    <thead className="bg-[#FAF9F5] text-[#244A3B] font-semibold">
                      <tr>
                        <th className="py-2 px-3 text-start">Produit</th>
                        <th className="py-2 px-3 text-start">Conditionnement</th>
                        <th className="py-2 px-3 text-center">Quantité</th>
                        <th className="py-2 px-3 text-end">Prix Unitaire HT (DZD)</th>
                        <th className="py-2 px-3 text-end">Total Ligne</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E3E5DF]">
                      {selectedQuote.items.map((it: any) => (
                        <tr key={it.id}>
                          <td className="py-2 px-3 font-medium text-[#292D29]">
                            {it.productName}
                          </td>
                          <td className="py-2 px-3 text-[#6D746E]">{it.variantLabel}</td>
                          <td className="py-2 px-3 text-center font-mono">
                            {it.requestedQuantity} {it.unit}
                          </td>
                          <td className="py-2 px-3 text-end">
                            <input
                              type="number"
                              defaultValue={it.unitPriceDZD || 0}
                              id={`price-${it.id}`}
                              className="w-28 p-1 text-end font-mono border border-[#E3E5DF] rounded-xs bg-[#FAF9F5]"
                            />
                          </td>
                          <td className="py-2 px-3 text-end font-mono font-bold text-[#244A3B]">
                            {formatDZD(it.lineTotalDZD, locale)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="flex justify-end pt-3">
                    <button
                      onClick={() => {
                        const newPrices: Record<string, number> = {};
                        selectedQuote.items.forEach((it: any) => {
                          const input = document.getElementById(`price-${it.id}`) as HTMLInputElement;
                          if (input) newPrices[it.id] = Number(input.value) || 0;
                        });
                        handleSaveQuotePrices(selectedQuote.id, newPrices, 3500, 'quoted');
                      }}
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xs cursor-pointer"
                    >
                      Enregistrer les prix & Valider la cotation
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Wilaya Shipping Manager */}
        {activeTab === 'shipping' && (
          <div className="bg-white p-6 border border-[#E3E5DF] rounded-xs shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#E3E5DF] pb-3">
              <div>
                <h2 className="font-serif-botanical text-xl font-bold text-[#244A3B]">
                  Grille des frais de livraison par Wilaya (58 Wilayas)
                </h2>
                <p className="text-xs text-[#6D746E] mt-0.5">
                  Seuil de gratuité globale configuré :{' '}
                  <strong className="text-[#244A3B]">
                    {formatDZD(settings.freeShippingThresholdDZD, locale)}
                  </strong>
                </p>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-xs border border-[#E3E5DF] divide-y divide-[#E3E5DF]">
                <thead className="bg-[#FAF9F5] text-[#244A3B] font-semibold sticky top-0">
                  <tr>
                    <th className="py-2.5 px-4 text-start">Code</th>
                    <th className="py-2.5 px-4 text-start">Wilaya (Français)</th>
                    <th className="py-2.5 px-4 text-start">الولاية (العربية)</th>
                    <th className="py-2.5 px-4 text-center">Zone Tarifaire</th>
                    <th className="py-2.5 px-4 text-end">Tarif DZD</th>
                    <th className="py-2.5 px-4 text-center">Délai Estimé</th>
                    <th className="py-2.5 px-4 text-center">Paiement Livraison (COD)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E3E5DF]">
                  {shippingRules.map((w) => (
                    <tr key={w.code} className="hover:bg-[#FAF9F5]/60">
                      <td className="py-2.5 px-4 font-mono font-bold text-[#244A3B]">{w.code}</td>
                      <td className="py-2.5 px-4 font-medium">{w.nameFr}</td>
                      <td className="py-2.5 px-4">{w.nameAr}</td>
                      <td className="py-2.5 px-4 text-center font-mono">Zone {w.zone}</td>
                      <td className="py-2.5 px-4 text-end font-mono font-bold">
                        {formatDZD(w.feeDZD, locale)}
                      </td>
                      <td className="py-2.5 px-4 text-center text-[#6D746E]">
                        {w.estimatedTransitTime}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        {w.cashOnDeliveryAllowed ? (
                          <span className="text-emerald-700 font-bold">✓ Autorisé</span>
                        ) : (
                          <span className="text-amber-700 font-bold">✗ Virement seul</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 6: CSV Import/Export */}
        {activeTab === 'csv' && (
          <div className="bg-white p-6 border border-[#E3E5DF] rounded-xs shadow-xs space-y-6">
            <div>
              <h2 className="font-serif-botanical text-xl font-bold text-[#244A3B]">
                Import / Export du Catalogue des 35 Ingrédients
              </h2>
              <p className="text-xs text-[#6D746E] mt-1 leading-relaxed">
                Permet d’exporter le catalogue complet en CSV pour les partenaires ou d'importer une nouvelle nomenclature avec détection de doublons et contrôle transactionnel.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="p-6 bg-[#FAF9F5] border border-[#E3E5DF] rounded-xs space-y-4">
                <Download className="w-6 h-6 text-[#244A3B]" />
                <h3 className="font-serif-botanical text-lg font-bold text-[#244A3B]">
                  Exporter le Catalogue Actuel
                </h3>
                <p className="text-xs text-[#6D746E]">
                  Télécharge le catalogue Firestore courant avec les IDs stables, variantes, prix DZD, stocks et statuts.
                </p>
                <button
                  onClick={handleExportCSV}
                  className="px-4 py-2.5 bg-[#244A3B] text-white text-xs font-semibold rounded-xs hover:bg-[#1C3A2E] cursor-pointer flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Télécharger le catalogue CSV actuel</span>
                </button>
              </div>

              <div className="p-6 bg-[#FAF9F5] border border-[#E3E5DF] rounded-xs space-y-4">
                <Upload className="w-6 h-6 text-[#244A3B]" />
                <h3 className="font-serif-botanical text-lg font-bold text-[#244A3B]">
                  Import CSV vers Firestore
                </h3>
                <p className="text-xs text-[#6D746E]">
                    Import réel avec aperçu. L’export fournit les IDs stables; les anciennes colonnes restent acceptées pour mettre à jour des variantes reconnues. Les cellules vides conservent les valeurs existantes.
                </p>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (evt) => {
                        setCsvPreview(planCatalogueCsvImport(String(evt.target?.result ?? ''), products));
                        setCsvImportReport(null);
                        showNotification(`Aperçu du fichier ${file.name} prêt.`);
                      };
                      reader.onerror = () => showNotification(`Impossible de lire le fichier ${file.name}.`);
                      reader.readAsText(file);
                    }
                  }}
                  className="text-xs text-[#6D746E] file:mr-3 file:py-1.5 file:px-3 file:rounded-xs file:border file:border-[#E3E5DF] file:bg-white file:text-xs file:font-semibold file:cursor-pointer"
                />
              </div>
            </div>

            {csvPreview && (
              <section className="p-4 bg-white border border-[#E3E5DF] rounded-xs space-y-3" aria-live="polite">
                <h3 className="text-sm font-bold text-[#244A3B]">Aperçu d’import Firestore</h3>
                <p className="text-xs text-[#292D29]">{csvPreview.creates.length} création(s) · {csvPreview.updates.length} mise(s) à jour · {csvPreview.unchanged.length} inchangé(s) · {csvPreview.duplicates.length} doublon(s) · {csvPreview.errors.length + csvPreview.items.filter((item) => item.action === 'error').length} erreur(s) de validation</p>
                <ul className="max-h-48 overflow-y-auto divide-y divide-[#E3E5DF] text-xs">
                  {csvPreview.items.map((item, index) => <li key={`${item.productId}-${index}`} className="py-1.5"><strong>{item.action}</strong> · {item.productId || 'ID manquant'} · {item.sku || 'SKU manquant'} · lignes {item.rows.join(', ')} {item.messages.join(' ')}</li>)}
                  {csvPreview.errors.map((error, index) => <li key={`error-${index}`} className="py-1.5 text-rose-800">Erreur ligne {error.row}: {error.message}</li>)}
                </ul>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={handleApplyCsvImport} disabled={isCsvImporting || (!csvPreview.creates.length && !csvPreview.updates.length)} className="px-3 py-2 bg-[#244A3B] text-white text-xs font-semibold rounded-xs disabled:opacity-50">{isCsvImporting ? 'Écriture Firestore…' : 'Confirmer les créations et mises à jour'}</button>
                  <button type="button" onClick={() => setCsvPreview(null)} disabled={isCsvImporting} className="px-3 py-2 border border-[#E3E5DF] text-xs rounded-xs">Annuler</button>
                </div>
              </section>
            )}
            {csvImportReport && <p role="status" className="p-3 bg-[#FAF9F5] border border-[#E3E5DF] text-xs text-[#292D29]">{csvImportReport}</p>}
          </div>
        )}

        {/* Tab 7: Settings & Payment Gateway */}
        {activeTab === 'settings' && isSuperAdmin && (
          <div className="bg-white p-6 border border-[#E3E5DF] rounded-xs shadow-xs space-y-6">
            <h2 className="font-serif-botanical text-xl font-bold text-[#244A3B] border-b border-[#E3E5DF] pb-3">
              Paramètres de l’Établissement & Passerelles de Règlement
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="space-y-4 p-4 bg-[#FAF9F5] border border-[#E3E5DF] rounded-xs">
                <h3 className="font-serif-botanical text-base font-bold text-[#244A3B]">
                  Coordonnées Virement Bancaire & Postal
                </h3>
                <div>
                  <label className="block text-[#6D746E] mb-1">Banque BNA (RIB 20 chiffres) :</label>
                  <input
                    type="text"
                    defaultValue={settings.ribAccount}
                    className="w-full p-2 bg-white border border-[#E3E5DF] rounded-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[#6D746E] mb-1">Compte Postal CCP :</label>
                  <input
                    type="text"
                    defaultValue={settings.ccpAccount}
                    className="w-full p-2 bg-white border border-[#E3E5DF] rounded-xs font-mono"
                  />
                </div>
              </div>

              <div className="space-y-4 p-4 bg-[#FAF9F5] border border-[#E3E5DF] rounded-xs">
                <h3 className="font-serif-botanical text-base font-bold text-[#244A3B]">
                  Passerelle de Paiement Électronique CIB / Edahabia
                </h3>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xs text-amber-900 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertTriangle className="w-4 h-4 text-amber-700" />
                    <span>Statut : Mode Test Bancaire (Désactivé en production réelle)</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Conformément aux règles de sécurité, le paiement direct par carte bancaire reste bridé tant que l'accord marchand SATIM / GIE Monétique n'est pas injecté dans le serveur sécurisé.
                  </p>
                </div>
                <div>
                  <label className="block text-[#6D746E] mb-1">Seuil Livraison Gratuite (DZD) :</label>
                  <input
                    type="number"
                    defaultValue={settings.freeShippingThresholdDZD}
                    className="w-full p-2 bg-white border border-[#E3E5DF] rounded-xs font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'team' && isSuperAdmin && <AdminTeamManagement locale={locale} />}

        {/* Tab 8: Audit Log */}
        {activeTab === 'audit' && (
          <div className="bg-white p-6 border border-[#E3E5DF] rounded-xs shadow-xs space-y-4">
            <h2 className="font-serif-botanical text-xl font-bold text-[#244A3B]">
              Journal d’Audit et Traçabilité des Opérations
            </h2>
            <table className="w-full text-xs text-start border border-[#E3E5DF] divide-y divide-[#E3E5DF]">
              <thead className="bg-[#FAF9F5] text-[#244A3B] font-semibold">
                <tr>
                  <th className="py-2.5 px-4 text-start">Date & Heure</th>
                  <th className="py-2.5 px-4 text-start">Opérateur</th>
                  <th className="py-2.5 px-4 text-start">Rôle</th>
                  <th className="py-2.5 px-4 text-start">Action</th>
                  <th className="py-2.5 px-4 text-start">Détails</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E3E5DF]">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#FAF9F5]/60">
                    <td className="py-2.5 px-4 font-mono text-[#6D746E]">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-[#292D29]">{log.actor}</td>
                    <td className="py-2.5 px-4 font-mono text-[#829477]">{log.role}</td>
                    <td className="py-2.5 px-4 font-bold text-[#244A3B]">{log.action}</td>
                    <td className="py-2.5 px-4 text-[#292D29]">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Product Edit Modal */}
        {editingProduct && (
          <ProductEditModal
            product={editingProduct}
            isNew={isCreatingProduct}
            locale={locale}
            activeStaff={activeStaff}
            onClose={() => { setEditingProduct(null); setIsCreatingProduct(false); }}
            onSave={handleSaveProduct}
          />
        )}
      </div>
    </div>
  );
};
