import type { Order } from '../types';

export function safeAccountReturnPath(value: string | null): string | null {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return null;
  try {
    const destination = new URL(value, 'https://floraxion.invalid');
    if (destination.origin !== 'https://floraxion.invalid' || destination.pathname.startsWith('/admin')) return null;
    return `${destination.pathname}${destination.search}${destination.hash}`;
  } catch {
    return null;
  }
}

/** Local and remote history are exposed only for the matching Firebase UID. */
export function mergeCustomerOrders(uid: string, localOrders: Order[], remoteOrders: Order[]): Order[] {
  const byId = new Map<string, Order>();
  for (const order of [...localOrders, ...remoteOrders]) {
    if (order.customerUid === uid) byId.set(order.id, order);
  }
  return [...byId.values()].sort((first, second) => second.createdAt.localeCompare(first.createdAt));
}
