import type { StaffRole } from '../types';

export type AdminSection =
  | 'overview'
  | 'products'
  | 'orders'
  | 'quotes'
  | 'shipping'
  | 'csv'
  | 'settings'
  | 'audit'
  | 'team';

const ALL_SECTIONS: AdminSection[] = [
  'overview', 'products', 'orders', 'quotes', 'shipping', 'csv', 'settings', 'audit', 'team',
];

export function getAllowedAdminSections(role: StaffRole): AdminSection[] {
  if (role === 'super_admin') return ALL_SECTIONS;
  if (role === 'catalogue_manager') return ['products', 'csv'];
  return ALL_SECTIONS.filter((section) => section !== 'settings' && section !== 'team' && section !== 'csv');
}

export function getDefaultAdminSection(role: StaffRole): AdminSection {
  return role === 'catalogue_manager' ? 'products' : 'overview';
}
