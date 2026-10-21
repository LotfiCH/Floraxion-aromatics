import test from 'node:test';
import assert from 'node:assert/strict';
import { getAllowedAdminSections, getDefaultAdminSection } from './adminAccess.ts';

test('catalogue managers can use products and CSV, but not team or settings', () => {
  const sections = getAllowedAdminSections('catalogue_manager');
  assert.deepEqual(sections, ['products', 'csv']);
  assert.equal(getDefaultAdminSection('catalogue_manager'), 'products');
});

test('only super admins can access Team Management and settings', () => {
  for (const role of ['catalogue_manager', 'order_manager', 'sales_manager', 'read_only'] as const) {
    const sections = getAllowedAdminSections(role);
    assert.equal(sections.includes('team'), false);
    assert.equal(sections.includes('settings'), false);
  }
  assert.equal(getAllowedAdminSections('super_admin').includes('team'), true);
  assert.equal(getAllowedAdminSections('super_admin').includes('settings'), true);
});

test('non-catalogue staff cannot open CSV catalogue import/export', () => {
  for (const role of ['order_manager', 'sales_manager', 'read_only'] as const) {
    assert.equal(getAllowedAdminSections(role).includes('csv'), false);
  }
});
