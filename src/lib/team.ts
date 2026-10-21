import { collection, onSnapshot, query } from 'firebase/firestore';
import type { Unsubscribe } from 'firebase/firestore';
import { db } from './firebase';

export interface AdminTeamMember {
  uid: string;
  displayName: string;
  email: string;
  role: string;
}

export function subscribeAdminTeam(
  onMembers: (members: AdminTeamMember[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(query(collection(db, 'admins')), (snapshot) => {
    const members = snapshot.docs.map((memberDoc) => {
      const data = memberDoc.data();
      return {
        uid: memberDoc.id,
        displayName: typeof data.displayName === 'string' ? data.displayName : '—',
        email: typeof data.email === 'string' ? data.email : '—',
        role: typeof data.role === 'string' ? data.role : 'Rôle invalide',
      };
    }).sort((left, right) => left.displayName.localeCompare(right.displayName));
    onMembers(members);
  }, onError);
}
