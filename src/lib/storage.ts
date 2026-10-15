import {
  AuditLogEntry,
  CartItem,
  Category,
  Order,
  Product,
  Quotation,
  SiteSettings,
  StaffRole,
  StaffUser,
  WilayaDeliveryRule,
} from '../types';
import { CATEGORIES, INITIAL_PRODUCTS } from '../data/catalogue';
import { ALGERIA_WILAYAS } from '../data/wilayas';

const STORAGE_KEYS = {
  PRODUCTS: 'flx_products_v1',
  CATEGORIES: 'flx_categories_v1',
  ORDERS: 'flx_orders_v1',
  QUOTATIONS: 'flx_quotations_v1',
  SETTINGS: 'flx_settings_v1',
  SHIPPING: 'flx_shipping_v1',
  AUDIT_LOG: 'flx_audit_log_v1',
  CART: 'flx_cart_v1',
  CURRENT_STAFF: 'flx_current_staff_v1',
};

export const DEFAULT_SETTINGS: SiteSettings = {
  storeName: 'Floraxion Aromatics',
  companyName: 'SARL Floraxion Aromatics (Groupe Plantaxion)',
  address: 'Zone Industrielle Oued Smar, Lot 14, 16200 Alger, Algérie',
  phone: '+213 (0) 23 92 10 40',
  email: 'contact@floraxion.dz',
  nif: '002116098765432',
  nis: '001916010045231',
  rc: '16/00-0987654B21',
  bankTransferInstructions: {
    fr: 'Veuillez effectuer votre virement bancaire ou postal en indiquant votre numéro de commande en référence. Votre commande sera expédiée dès réception des fonds par notre service comptabilité.',
    ar: 'يرجى إجراء التحويل البنكي أو البريدي مع تدوين رقم الطلب في خانة الملاحظات. سيتم شحن طلبيتكم فور التحقق من استلام المبلغ من طرف مصلحة المحاسبة.',
  },
  ribAccount: 'BNA Alger Agence 612 : 001 00612 0300 001234 56',
  ccpAccount: 'CCP N° 00123456 Clé 89 (SARL Floraxion)',
  onlinePaymentEnabled: false, // Provider-neutral gateway disabled until merchant credentials verified
  onlinePaymentTestMode: true,
  freeShippingThresholdDZD: 15000,
};

export const STAFF_USERS: StaffUser[] = [
  { id: 'usr-1', name: 'Nour El Houda (Directrice)', email: 'direction@floraxion.dz', role: 'super_admin' },
  { id: 'usr-2', name: 'Karim Boukhalfa (Resp. Catalogue)', email: 'catalogue@floraxion.dz', role: 'catalogue_manager' },
  { id: 'usr-3', name: 'Amine Larbi (Gestion Commandes)', email: 'logistique@floraxion.dz', role: 'order_manager' },
  { id: 'usr-4', name: 'Selma Benali (Conseillère B2B)', email: 'commercial@floraxion.dz', role: 'sales_manager' },
  { id: 'usr-5', name: 'Auditeur Externe', email: 'audit@consulting.dz', role: 'read_only' },
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ord-init-01',
    orderNumber: 'FLX-20250210-4491',
    status: 'shipped',
    paymentStatus: 'paid',
    paymentMethod: 'bank_transfer',
    currency: 'DZD',
    subtotalDZD: 12500,
    shippingFeeDZD: 450,
    discountDZD: 0,
    totalDZD: 12950,
    customerSnapshot: {
      fullName: 'Dr. Sofiane Khelifi',
      phone: '0555 12 34 56',
      email: 'sofiane.khelifi@bio-sante.dz',
      wilayaCode: '16',
      wilayaName: 'Alger',
      commune: 'Hydra',
      streetAddress: '14 Rue Djenane El Malik',
    },
    items: [
      {
        productId: 'prod-he-01',
        variantId: 'var-he-01-30',
        skuSnapshot: 'FLX-HE-001-30ML',
        productNameSnapshot: 'Huile Essentielle de Romarin à Cinéole',
        variantLabelSnapshot: 'Flacon verre ambré 30 ml',
        unitPriceDZD: 3800,
        quantity: 2,
        lineTotalDZD: 7600,
      },
      {
        productId: 'prod-he-02',
        variantId: 'var-he-02-30',
        skuSnapshot: 'FLX-HE-002-30ML',
        productNameSnapshot: 'Huile Essentielle de Lavande Vraie',
        variantLabelSnapshot: 'Flacon verre ambré 30 ml',
        unitPriceDZD: 4900,
        quantity: 1,
        lineTotalDZD: 4900,
      },
    ],
    customerNote: 'Livraison en après-midi si possible.',
    paymentVerification: {
      verifiedAt: '2025-02-11T10:15:00Z',
      verifiedBy: 'Nour El Houda',
      notes: 'Bordereau virement BNA réf #49281 reçu et validé.',
    },
    createdAt: '2025-02-10T14:20:00Z',
    updatedAt: '2025-02-11T16:00:00Z',
  },
  {
    id: 'ord-init-02',
    orderNumber: 'FLX-20250214-7812',
    status: 'pending',
    paymentStatus: 'unpaid',
    paymentMethod: 'cash_on_delivery',
    currency: 'DZD',
    subtotalDZD: 5400,
    shippingFeeDZD: 700,
    discountDZD: 0,
    totalDZD: 6100,
    customerSnapshot: {
      fullName: 'Amina Cherif',
      phone: '0770 98 76 54',
      email: 'amina.cherif@gmail.com',
      wilayaCode: '31',
      wilayaName: 'Oran',
      commune: 'Bir El Djir',
      streetAddress: 'Cité Akid Lotfi, Bâtiment B2',
    },
    items: [
      {
        productId: 'prod-he-23',
        variantId: 'var-he-23-10',
        skuSnapshot: 'FLX-HE-023-10ML',
        productNameSnapshot: 'Huile Essentielle d’Hélichryse Italienne (Immortelle)',
        variantLabelSnapshot: 'Flacon verre 10 ml',
        unitPriceDZD: 5400,
        quantity: 1,
        lineTotalDZD: 5400,
      },
    ],
    createdAt: '2025-02-14T11:45:00Z',
    updatedAt: '2025-02-14T11:45:00Z',
  },
];

export const INITIAL_QUOTATIONS: Quotation[] = [
  {
    id: 'quote-init-01',
    quotationNumber: 'FLX-Q-20250212-0041',
    status: 'quoted',
    customer: {
      contactName: 'Nabil Zerdoum',
      companyName: 'Cosmétiques Atlas Nature SARL',
      email: 'n.zerdoum@atlasnature.dz',
      phone: '0661 45 67 89',
      wilayaCode: '09',
      wilayaName: 'Blida',
      commune: 'Boufarik',
      address: 'Route Nationale 1, Zone Artisanale',
      activitySector: 'Fabrication cosmétique & savonnerie artisanale',
      notes: 'Besoin d’approvisionnement trimestriel régulier avec fiches techniques GC-MS.',
    },
    items: [
      {
        id: 'qi-01',
        productId: 'prod-he-01',
        productName: 'Huile Essentielle de Romarin à Cinéole',
        variantLabel: 'Bidon aluminium 1 kg',
        requestedQuantity: 5,
        unit: 'kg',
        unitPriceDZD: 38000,
        lineTotalDZD: 190000,
      },
      {
        id: 'qi-02',
        productId: 'prod-hv-01',
        productName: 'Huile Végétale d’Amande Douce Vierge',
        variantLabel: 'Fut de 25 Litres',
        requestedQuantity: 2,
        unit: 'Fut 25L',
        unitPriceDZD: 95000,
        lineTotalDZD: 190000,
      },
      {
        id: 'qi-03',
        productId: 'prod-hy-02',
        productName: 'Hydrolat de Fleur d’Oranger Pur',
        variantLabel: 'Cuve PEHD 50 Litres',
        requestedQuantity: 1,
        unit: 'Cuve 50L',
        unitPriceDZD: 65000,
        lineTotalDZD: 65000,
      },
    ],
    currency: 'DZD',
    subtotalDZD: 445000,
    shippingFeeDZD: 4500,
    taxDZD: 0,
    totalDZD: 449500,
    validUntil: '2025-03-31',
    termsAndConditions: 'Paiement 50% à la commande par virement, 50% à livraison sous 10 jours ouvrés.',
    internalStaffNotes: 'Client sérieux, partenaire potentiel pour fourniture savonneries.',
    revisionNumber: 1,
    createdAt: '2025-02-12T09:30:00Z',
    updatedAt: '2025-02-13T15:00:00Z',
  },
];

export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'log-01',
    timestamp: '2025-02-11T10:15:00Z',
    actor: 'Nour El Houda',
    role: 'super_admin',
    action: 'VERIFY_PAYMENT',
    entityType: 'order',
    entityId: 'ord-init-01',
    details: 'Virement bancaire validé pour la commande FLX-20250210-4491 (Montant : 12 950 DZD)',
  },
  {
    id: 'log-02',
    timestamp: '2025-02-13T15:00:00Z',
    actor: 'Selma Benali',
    role: 'sales_manager',
    action: 'EMIT_QUOTATION',
    entityType: 'quotation',
    entityId: 'quote-init-01',
    details: 'Devis B2B émis pour Cosmétiques Atlas Nature (Total : 449 500 DZD)',
  },
];

class StorageService {
  private get<T>(key: string, defaultValue: T): T {
    if (typeof window === 'undefined') return defaultValue;
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  private set<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('Storage write error:', e);
    }
  }

  getProducts(): Product[] {
    return this.get<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
  }

  saveProducts(products: Product[]): void {
    this.set(STORAGE_KEYS.PRODUCTS, products);
  }

  getCategories(): Category[] {
    return this.get<Category[]>(STORAGE_KEYS.CATEGORIES, CATEGORIES);
  }

  saveCategories(categories: Category[]): void {
    this.set(STORAGE_KEYS.CATEGORIES, categories);
  }

  getOrders(): Order[] {
    return this.get<Order[]>(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
  }

  saveOrders(orders: Order[]): void {
    this.set(STORAGE_KEYS.ORDERS, orders);
  }

  addOrder(order: Order): void {
    const orders = this.getOrders();
    this.saveOrders([order, ...orders]);
    this.logAction({
      actor: 'Système Commerce',
      role: 'super_admin',
      action: 'ORDER_CREATED',
      entityType: 'order',
      entityId: order.id,
      details: `Nouvelle commande enregistrée : ${order.orderNumber} (${order.totalDZD} DZD)`,
    });
  }

  updateOrder(updated: Order, actorName: string = 'Staff'): void {
    const orders = this.getOrders().map((o) => (o.id === updated.id ? updated : o));
    this.saveOrders(orders);
    this.logAction({
      actor: actorName,
      role: 'order_manager',
      action: 'ORDER_UPDATED',
      entityType: 'order',
      entityId: updated.id,
      details: `Statut commande ${updated.orderNumber} mis à jour : ${updated.status} / Paiement : ${updated.paymentStatus}`,
    });
  }

  getQuotations(): Quotation[] {
    return this.get<Quotation[]>(STORAGE_KEYS.QUOTATIONS, INITIAL_QUOTATIONS);
  }

  saveQuotations(quotations: Quotation[]): void {
    this.set(STORAGE_KEYS.QUOTATIONS, quotations);
  }

  addQuotation(quotation: Quotation): void {
    const quotes = this.getQuotations();
    this.saveQuotations([quotation, ...quotes]);
    this.logAction({
      actor: 'Portail B2B',
      role: 'sales_manager',
      action: 'QUOTE_SUBMITTED',
      entityType: 'quotation',
      entityId: quotation.id,
      details: `Demande de devis soumise par ${quotation.customer.companyName || quotation.customer.contactName} (${quotation.quotationNumber})`,
    });
  }

  updateQuotation(updated: Quotation, actorName: string = 'Staff'): void {
    const quotes = this.getQuotations().map((q) => (q.id === updated.id ? updated : q));
    this.saveQuotations(quotes);
    this.logAction({
      actor: actorName,
      role: 'sales_manager',
      action: 'QUOTE_UPDATED',
      entityType: 'quotation',
      entityId: updated.id,
      details: `Devis ${updated.quotationNumber} mis à jour : ${updated.status} (Rév. ${updated.revisionNumber})`,
    });
  }

  getShippingRules(): WilayaDeliveryRule[] {
    return this.get<WilayaDeliveryRule[]>(STORAGE_KEYS.SHIPPING, ALGERIA_WILAYAS);
  }

  saveShippingRules(rules: WilayaDeliveryRule[]): void {
    this.set(STORAGE_KEYS.SHIPPING, rules);
  }

  getSettings(): SiteSettings {
    return this.get<SiteSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  }

  saveSettings(settings: SiteSettings): void {
    this.set(STORAGE_KEYS.SETTINGS, settings);
  }

  getAuditLogs(): AuditLogEntry[] {
    return this.get<AuditLogEntry[]>(STORAGE_KEYS.AUDIT_LOG, INITIAL_AUDIT_LOGS);
  }

  logAction(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): void {
    const logs = this.getAuditLogs();
    const newEntry: AuditLogEntry = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      ...entry,
    };
    this.set(STORAGE_KEYS.AUDIT_LOG, [newEntry, ...logs]);
  }

  getCart(): CartItem[] {
    return this.get<CartItem[]>(STORAGE_KEYS.CART, []);
  }

  saveCart(cart: CartItem[]): void {
    this.set(STORAGE_KEYS.CART, cart);
  }

  getCurrentStaff(): StaffUser {
    return this.get<StaffUser>(STORAGE_KEYS.CURRENT_STAFF, STAFF_USERS[0]);
  }

  setCurrentStaff(user: StaffUser): void {
    this.set(STORAGE_KEYS.CURRENT_STAFF, user);
  }

  resetDemoData(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
    localStorage.removeItem(STORAGE_KEYS.CATEGORIES);
    localStorage.removeItem(STORAGE_KEYS.ORDERS);
    localStorage.removeItem(STORAGE_KEYS.QUOTATIONS);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    localStorage.removeItem(STORAGE_KEYS.SHIPPING);
    localStorage.removeItem(STORAGE_KEYS.AUDIT_LOG);
  }
}

export const storage = new StorageService();
