import test from 'node:test';
import assert from 'node:assert/strict';
import type { Order } from '../types/index.ts';
import { mergeCustomerOrders, safeAccountReturnPath } from './customerAccount.ts';

function order(id: string, uid: string | undefined, createdAt: string, totalDZD = 100): Order {
  return {
    id,
    customerUid: uid,
    orderNumber: `FLX-${id}`,
    status: 'pending',
    paymentStatus: 'unpaid',
    paymentMethod: 'cash_on_delivery',
    currency: 'DZD',
    subtotalDZD: totalDZD,
    shippingFeeDZD: 0,
    discountDZD: 0,
    totalDZD,
    customerSnapshot: {
      fullName: 'Test client',
      phone: '0550000000',
      wilayaCode: '16',
      wilayaName: 'Alger',
      commune: 'Alger',
      streetAddress: 'Adresse test',
    },
    items: [],
    createdAt,
    updatedAt: createdAt,
  };
}

test('safeAccountReturnPath keeps internal destinations and rejects external or privileged paths', () => {
  assert.equal(safeAccountReturnPath('/checkout'), '/checkout');
  assert.equal(safeAccountReturnPath('/checkout?step=delivery#summary'), '/checkout?step=delivery#summary');
  assert.equal(safeAccountReturnPath('https://example.com/checkout'), null);
  assert.equal(safeAccountReturnPath('//example.com/checkout'), null);
  assert.equal(safeAccountReturnPath('/admin/dashboard'), null);
  assert.equal(safeAccountReturnPath('/\\example.com'), null);
  assert.equal(safeAccountReturnPath(null), null);
});

test('mergeCustomerOrders includes only matching UID orders and prefers remote copies', () => {
  const local = [
    order('local-old', 'customer-a', '2026-01-01T00:00:00.000Z'),
    order('other-user', 'customer-b', '2026-01-04T00:00:00.000Z'),
    order('shared', 'customer-a', '2026-01-02T00:00:00.000Z', 100),
  ];
  const remote = [
    order('shared', 'customer-a', '2026-01-03T00:00:00.000Z', 250),
    order('remote-other', 'customer-b', '2026-01-05T00:00:00.000Z'),
  ];

  const result = mergeCustomerOrders('customer-a', local, remote);
  assert.deepEqual(result.map(({ id }) => id), ['shared', 'local-old']);
  assert.equal(result[0].totalDZD, 250);
});
