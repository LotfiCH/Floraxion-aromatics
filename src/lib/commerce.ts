import type {
  CartItem,
  CustomerAddress,
  Order,
  OrderItem,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Quotation,
  WilayaDeliveryRule,
} from '../types/index.ts';

/**
 * Calculates cart subtotal, shipping fee, discount, and grand total.
 * Ensures strict integer minor units for Algerian Dinars (DZD) without floating point artifacts.
 */
export function calculateCartTotals(
  items: CartItem[],
  shippingFee: number,
  discount: number = 0
): {
  subtotalDZD: number;
  itemCount: number;
  shippingFeeDZD: number;
  discountDZD: number;
  totalDZD: number;
} {
  const subtotalDZD = items.reduce((sum, item) => {
    const validQty = Math.max(0, Math.floor(item.quantity));
    const validPrice = Math.max(0, Math.floor(item.unitPriceDZD));
    return sum + validQty * validPrice;
  }, 0);

  const itemCount = items.reduce((sum, item) => sum + Math.max(0, Math.floor(item.quantity)), 0);
  const safeShipping = Math.max(0, Math.floor(shippingFee));
  const safeDiscount = Math.min(subtotalDZD, Math.max(0, Math.floor(discount)));
  const totalDZD = Math.max(0, subtotalDZD + safeShipping - safeDiscount);

  return {
    subtotalDZD,
    itemCount,
    shippingFeeDZD: safeShipping,
    discountDZD: safeDiscount,
    totalDZD,
  };
}

/**
 * Calculates shipping fee for an Algerian Wilaya based on rule and threshold.
 */
export function calculateWilayaShippingFee(
  wilayaRule: WilayaDeliveryRule | undefined,
  subtotal: number,
  freeShippingThreshold: number = 15000
): number {
  if (!wilayaRule) return 0;
  if (subtotal >= freeShippingThreshold && freeShippingThreshold > 0) {
    return 0; // Free shipping benefit
  }
  return wilayaRule.feeDZD;
}

/**
 * Formats a DZD monetary amount cleanly with locale support.
 */
export function formatDZD(amount: number | null | undefined, locale: 'fr' | 'ar' = 'fr'): string {
  if (amount === null || amount === undefined) {
    return locale === 'ar' ? 'عند الطلب (تسعير خاص)' : 'Sur devis';
  }
  const formattedNumber = new Intl.NumberFormat(locale === 'ar' ? 'ar-DZ' : 'fr-DZ', {
    maximumFractionDigits: 0,
  }).format(amount);

  return locale === 'ar' ? `${formattedNumber} د.ج` : `${formattedNumber} DZD`;
}

/**
 * Creates an immutable snapshot for a newly placed order.
 */
export function createOrderSnapshot(params: {
  cartItems: CartItem[];
  customer: CustomerAddress;
  shippingFeeDZD: number;
  paymentMethod: PaymentMethod;
  customerNote?: string;
  fromQuotationId?: string;
}): Order {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const orderNumber = `FLX-${dateStr}-${randomSuffix}`;

  const totals = calculateCartTotals(params.cartItems, params.shippingFeeDZD, 0);

  const items: OrderItem[] = params.cartItems.map((item) => ({
    productId: item.productId,
    variantId: item.variantId,
    skuSnapshot: item.sku,
    productNameSnapshot: item.productName.fr,
    variantLabelSnapshot: item.variantLabel.fr,
    unitPriceDZD: item.unitPriceDZD,
    quantity: item.quantity,
    lineTotalDZD: item.unitPriceDZD * item.quantity,
  }));

  const initialPaymentStatus: PaymentStatus =
    params.paymentMethod === 'online_card' ? 'pending' : 'unpaid';

  return {
    id: `ord-${Date.now()}-${randomSuffix}`,
    orderNumber,
    status: 'pending',
    paymentStatus: initialPaymentStatus,
    paymentMethod: params.paymentMethod,
    currency: 'DZD',
    subtotalDZD: totals.subtotalDZD,
    shippingFeeDZD: totals.shippingFeeDZD,
    discountDZD: totals.discountDZD,
    totalDZD: totals.totalDZD,
    customerSnapshot: { ...params.customer },
    items,
    customerNote: params.customerNote,
    fromQuotationId: params.fromQuotationId,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
}

/**
 * Converts an approved quotation into an active order while preserving full history.
 */
export function convertQuotationToOrder(quotation: Quotation): {
  order: Order;
  updatedQuotation: Quotation;
} {
  if (quotation.status !== 'quoted' && quotation.status !== 'accepted') {
    throw new Error('Only quotations with status "quoted" or "accepted" can be converted to orders.');
  }

  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const orderNumber = `FLX-${dateStr}-${randomSuffix}`;

  const orderItems: OrderItem[] = quotation.items.map((item) => {
    const unitPrice = item.unitPriceDZD || 0;
    const qty = item.requestedQuantity;
    return {
      productId: item.productId || 'custom',
      variantId: 'quote-variant',
      skuSnapshot: `QUOTE-${item.id.slice(0, 6).toUpperCase()}`,
      productNameSnapshot: item.productName,
      variantLabelSnapshot: `${item.variantLabel} (${item.requestedQuantity} ${item.unit})`,
      unitPriceDZD: unitPrice,
      quantity: qty,
      lineTotalDZD: unitPrice * qty,
    };
  });

  const subtotal = orderItems.reduce((acc, i) => acc + i.lineTotalDZD, 0);
  const shipping = quotation.shippingFeeDZD || 0;
  const tax = quotation.taxDZD || 0;
  const total = subtotal + shipping + tax;

  const order: Order = {
    id: `ord-q-${Date.now()}-${randomSuffix}`,
    orderNumber,
    status: 'confirmed',
    paymentStatus: 'unpaid',
    paymentMethod: 'bank_transfer',
    currency: 'DZD',
    subtotalDZD: subtotal,
    shippingFeeDZD: shipping,
    discountDZD: 0,
    totalDZD: total,
    customerSnapshot: {
      fullName: quotation.customer.contactName,
      phone: quotation.customer.phone,
      email: quotation.customer.email,
      wilayaCode: quotation.customer.wilayaCode,
      wilayaName: quotation.customer.wilayaName,
      commune: quotation.customer.commune,
      streetAddress: quotation.customer.address,
      companyName: quotation.customer.companyName,
      deliveryNotes: quotation.customer.notes,
    },
    items: orderItems,
    customerNote: `Converted from Quotation ${quotation.quotationNumber}. Sector: ${quotation.customer.activitySector || 'N/A'}`,
    fromQuotationId: quotation.id,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  const updatedQuotation: Quotation = {
    ...quotation,
    status: 'converted',
    convertedOrderId: order.id,
    updatedAt: now.toISOString(),
  };

  return { order, updatedQuotation };
}

/**
 * Validates allowed state transitions for Order fulfillment.
 */
export function validateOrderStatusTransition(
  current: OrderStatus,
  target: OrderStatus
): boolean {
  const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['processing', 'cancelled'],
    processing: ['shipped', 'cancelled'],
    shipped: ['delivered', 'cancelled'],
    delivered: ['refunded'],
    cancelled: [],
    refunded: [],
  };

  return allowedTransitions[current]?.includes(target) ?? false;
}
