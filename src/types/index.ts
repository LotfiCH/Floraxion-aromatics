export type Locale = 'fr' | 'ar';

export type CategorySlug = 'essential-oils' | 'vegetable-oils' | 'hydrolats' | 'olive-oils';

export interface Category {
  id: string;
  slug: CategorySlug;
  sortOrder: number;
  isActive: boolean;
  translations: {
    fr: { name: string; description: string };
    ar: { name: string; description: string };
  };
}

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  sizeValue: number;
  sizeUnit: 'ml' | 'L' | 'g' | 'kg';
  packagingLabel: {
    fr: string;
    ar: string;
  };
  priceDZD: number | null; // null if quote only
  compareAtPriceDZD?: number | null;
  stockQuantity: number;
  trackInventory: boolean;
  isActive: boolean;
  isPurchasableOnline: boolean;
}

export interface ProductDocument {
  id: string;
  title: { fr: string; ar: string };
  documentType: 'coa' | 'spec_sheet' | 'msds' | 'catalog';
  fileName: string;
  fileSize: string;
  isPublic: boolean;
}

export interface Product {
  id: string;
  sku: string;
  slug: string;
  categoryId: CategorySlug;
  status: 'draft' | 'published' | 'archived';
  isFeatured: boolean;
  botanicalName?: string;
  origin?: string;
  extractionMethod?: {
    fr: string;
    ar: string;
  };
  specifications?: {
    casNumber?: string;
    appearance?: { fr: string; ar: string };
    aromaProfile?: { fr: string; ar: string };
    density?: string;
    refractiveIndex?: string;
  };
  storageInstructions?: {
    fr: string;
    ar: string;
  };
  translations: {
    fr: {
      name: string;
      shortDescription: string;
      description: string;
    };
    ar: {
      name: string;
      shortDescription: string;
      description: string;
    };
  };
  imageTag: string; // identifier for styled botanical illustration / visual container
  imageUrl?: string; // custom uploaded or external image URL
  variants: ProductVariant[];
  documents: ProductDocument[];
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  productId: string;
  variantId: string;
  productName: {
    fr: string;
    ar: string;
  };
  botanicalName?: string;
  variantLabel: {
    fr: string;
    ar: string;
  };
  sku: string;
  unitPriceDZD: number;
  quantity: number;
  imageTag: string;
  imageUrl?: string;
  maxStock: number;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export type PaymentStatus =
  | 'unpaid'
  | 'pending'
  | 'paid'
  | 'failed'
  | 'partially_refunded'
  | 'refunded';

export type PaymentMethod = 'bank_transfer' | 'cash_on_delivery' | 'online_card';

export interface CustomerAddress {
  fullName: string;
  phone: string;
  email?: string;
  wilayaCode: string;
  wilayaName: string;
  commune: string;
  streetAddress: string;
  deliveryNotes?: string;
  companyName?: string;
  taxNumber?: string; // NIF / RC for professionals
}

export interface OrderItem {
  productId: string;
  variantId: string;
  skuSnapshot: string;
  productNameSnapshot: string;
  variantLabelSnapshot: string;
  unitPriceDZD: number;
  quantity: number;
  lineTotalDZD: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  currency: 'DZD';
  subtotalDZD: number;
  shippingFeeDZD: number;
  discountDZD: number;
  totalDZD: number;
  customerSnapshot: CustomerAddress;
  items: OrderItem[];
  customerNote?: string;
  paymentVerification?: {
    verifiedAt: string;
    verifiedBy: string;
    notes?: string;
  };
  fromQuotationId?: string;
  createdAt: string;
  updatedAt: string;
}

export type QuotationStatus =
  | 'submitted'
  | 'under_review'
  | 'quoted'
  | 'accepted'
  | 'rejected'
  | 'expired'
  | 'converted';

export interface QuotationItem {
  id: string;
  productId?: string;
  productName: string;
  variantLabel: string;
  requestedQuantity: number;
  unit: string;
  unitPriceDZD?: number;
  lineTotalDZD?: number;
  customNotes?: string;
}

export interface Quotation {
  id: string;
  quotationNumber: string;
  status: QuotationStatus;
  customer: {
    contactName: string;
    companyName: string;
    email: string;
    phone: string;
    wilayaCode: string;
    wilayaName: string;
    commune: string;
    address: string;
    activitySector?: string;
    notes?: string;
  };
  items: QuotationItem[];
  currency: 'DZD';
  subtotalDZD?: number;
  shippingFeeDZD?: number;
  taxDZD?: number;
  totalDZD?: number;
  validUntil?: string;
  termsAndConditions?: string;
  internalStaffNotes?: string;
  revisionNumber: number;
  convertedOrderId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WilayaDeliveryRule {
  code: string;
  nameFr: string;
  nameAr: string;
  zone: 1 | 2 | 3 | 4;
  feeDZD: number;
  estimatedTransitTime: string;
  cashOnDeliveryAllowed: boolean;
}

export type StaffRole =
  | 'super_admin'
  | 'catalogue_manager'
  | 'order_manager'
  | 'sales_manager'
  | 'read_only';

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  role: StaffRole;
  action: string;
  entityType: 'order' | 'quotation' | 'product' | 'shipping' | 'settings';
  entityId: string;
  details: string;
}

export interface SiteSettings {
  storeName: string;
  companyName: string;
  address: string;
  phone: string;
  email: string;
  nif: string;
  nis: string;
  rc: string;
  bankTransferInstructions: {
    fr: string;
    ar: string;
  };
  ribAccount: string;
  ccpAccount: string;
  onlinePaymentEnabled: boolean;
  onlinePaymentTestMode: boolean;
  freeShippingThresholdDZD: number;
}
