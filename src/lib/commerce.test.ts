import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateCartTotals,
  calculateWilayaShippingFee,
  formatDZD,
  createOrderSnapshot,
  convertQuotationToOrder,
  validateOrderStatusTransition,
} from './commerce.ts';
import type { CartItem, CustomerAddress, Quotation, WilayaDeliveryRule } from '../types/index.ts';

test('calculateCartTotals calculates subtotal, shipping and total correctly in integer DZD', () => {
  const items: CartItem[] = [
    {
      productId: 'p1',
      variantId: 'v1',
      productName: { fr: 'Romarin', ar: 'إكليل الجبل' },
      variantLabel: { fr: '10 ml', ar: '10 مل' },
      sku: 'SKU1',
      unitPriceDZD: 1600,
      quantity: 2,
      imageTag: 'rosemary',
      maxStock: 50,
    },
    {
      productId: 'p2',
      variantId: 'v2',
      productName: { fr: 'Lavande', ar: 'الخزامى' },
      variantLabel: { fr: '30 ml', ar: '30 مل' },
      sku: 'SKU2',
      unitPriceDZD: 4900,
      quantity: 1,
      imageTag: 'lavender',
      maxStock: 20,
    },
  ];

  const result = calculateCartTotals(items, 500, 0);
  assert.equal(result.subtotalDZD, 1600 * 2 + 4900); // 3200 + 4900 = 8100
  assert.equal(result.itemCount, 3);
  assert.equal(result.shippingFeeDZD, 500);
  assert.equal(result.totalDZD, 8600);
});

test('calculateWilayaShippingFee applies threshold correctly', () => {
  const algerRule: WilayaDeliveryRule = {
    code: '16',
    nameFr: 'Alger',
    nameAr: 'الجزائر',
    zone: 1,
    feeDZD: 450,
    estimatedTransitTime: '24h',
    cashOnDeliveryAllowed: true,
  };

  // Under threshold
  assert.equal(calculateWilayaShippingFee(algerRule, 5000, 15000), 450);
  // Equal or above threshold (free delivery)
  assert.equal(calculateWilayaShippingFee(algerRule, 15000, 15000), 0);
  assert.equal(calculateWilayaShippingFee(algerRule, 20000, 15000), 0);
});

test('formatDZD renders French and Arabic currency representations properly', () => {
  assert.equal(formatDZD(1500, 'fr'), '1 500 DZD');
  assert.ok(formatDZD(1500, 'ar').includes('د.ج'));
  assert.equal(formatDZD(null, 'fr'), 'Sur devis');
  assert.equal(formatDZD(null, 'ar'), 'عند الطلب (تسعير خاص)');
});

test('createOrderSnapshot generates an immutable order snapshot with safe unique orderNumber', () => {
  const items: CartItem[] = [
    {
      productId: 'p1',
      variantId: 'v1',
      productName: { fr: 'Cèdre de l’Atlas', ar: 'أرز الأطلس' },
      variantLabel: { fr: '10 ml', ar: '10 مل' },
      sku: 'SKU-CEDRE',
      unitPriceDZD: 1750,
      quantity: 1,
      imageTag: 'cedarwood',
      maxStock: 30,
    },
  ];

  const customer: CustomerAddress = {
    fullName: 'Yacine Benali',
    phone: '0550123456',
    email: 'yacine@example.com',
    wilayaCode: '16',
    wilayaName: 'Alger',
    commune: 'Bab El Oued',
    streetAddress: '12 Boulevard Mohamed V',
  };

  const order = createOrderSnapshot({
    cartItems: items,
    customer,
    shippingFeeDZD: 450,
    paymentMethod: 'cash_on_delivery',
  });

  assert.ok(order.orderNumber.startsWith('FLX-'));
  assert.equal(order.status, 'pending');
  assert.equal(order.paymentStatus, 'unpaid');
  assert.equal(order.totalDZD, 2200);
  assert.equal(order.items.length, 1);
  assert.equal(order.items[0].skuSnapshot, 'SKU-CEDRE');
});

test('convertQuotationToOrder turns quoted quote into confirmed order preserving amounts', () => {
  const sampleQuotation: Quotation = {
    id: 'q-101',
    quotationNumber: 'FLX-Q-20250215-1001',
    status: 'quoted',
    customer: {
      contactName: 'Amina Mansouri',
      companyName: 'Laboratoires Bio-Atlas',
      email: 'amina@bioatlas.dz',
      phone: '0661998877',
      wilayaCode: '09',
      wilayaName: 'Blida',
      commune: 'Ouled Yaïch',
      address: 'Zone d’Activité Lot 4',
      activitySector: 'Cosmétique & Parfumerie',
    },
    items: [
      {
        id: 'qi-1',
        productId: 'prod-he-01',
        productName: 'Huile Essentielle de Romarin à Cinéole',
        variantLabel: 'Fut Inox 5 kg',
        requestedQuantity: 2,
        unit: 'kg',
        unitPriceDZD: 45000,
        lineTotalDZD: 90000,
      },
    ],
    currency: 'DZD',
    subtotalDZD: 90000,
    shippingFeeDZD: 2500,
    taxDZD: 0,
    totalDZD: 92500,
    revisionNumber: 1,
    createdAt: '2025-02-15T10:00:00Z',
    updatedAt: '2025-02-15T11:00:00Z',
  };

  const { order, updatedQuotation } = convertQuotationToOrder(sampleQuotation);

  assert.equal(updatedQuotation.status, 'converted');
  assert.equal(updatedQuotation.convertedOrderId, order.id);
  assert.equal(order.fromQuotationId, 'q-101');
  assert.equal(order.status, 'confirmed');
  assert.equal(order.totalDZD, 92500);
  assert.equal(order.customerSnapshot.companyName, 'Laboratoires Bio-Atlas');
});

test('validateOrderStatusTransition enforces legal transitions', () => {
  assert.equal(validateOrderStatusTransition('pending', 'confirmed'), true);
  assert.equal(validateOrderStatusTransition('confirmed', 'processing'), true);
  assert.equal(validateOrderStatusTransition('processing', 'shipped'), true);
  assert.equal(validateOrderStatusTransition('shipped', 'delivered'), true);
  assert.equal(validateOrderStatusTransition('pending', 'delivered'), false); // Illegal jump
  assert.equal(validateOrderStatusTransition('cancelled', 'confirmed'), false); // Cannot revive cancelled
});
