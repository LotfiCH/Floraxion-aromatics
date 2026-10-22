import {
  collection,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import type { Unsubscribe } from 'firebase/firestore';
import type { Order } from '../types';
import { db } from './firebase';

/**
 * Subscribe only to orders whose customerUid matches the authenticated user.
 * Firestore rules repeat this ownership check; the query is not the security boundary.
 */
export function subscribeCustomerOrders(
  uid: string,
  onOrders: (orders: Order[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  const ordersQuery = query(collection(db, 'orders'), where('customerUid', '==', uid));
  return onSnapshot(ordersQuery, (snapshot) => {
    const orders = snapshot.docs
      .map((orderDoc) => ({ ...orderDoc.data(), id: orderDoc.id }) as Order)
      .filter((order) => order.customerUid === uid)
      .sort((first, second) => second.createdAt.localeCompare(first.createdAt));
    onOrders(orders);
  }, onError);
}
