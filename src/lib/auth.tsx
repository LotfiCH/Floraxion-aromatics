import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  AuthError,
} from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from './firebase';
import { StaffRole } from '../types';

export interface AuthenticatedAdmin {
  uid: string;
  email: string;
  displayName: string;
  role: StaffRole;
  createdAt?: string;
}

const STAFF_ROLES: StaffRole[] = [
  'super_admin',
  'catalogue_manager',
  'order_manager',
  'sales_manager',
  'read_only',
];
const INVALID_ADMIN_ROLE_MESSAGE = 'Accès refusé : le rôle administrateur associé à ce compte est absent ou invalide.';

function isStaffRole(role: unknown): role is StaffRole {
  return typeof role === 'string' && STAFF_ROLES.includes(role as StaffRole);
}

function adminLookupErrorMessage(error: unknown): string {
  const code = typeof error === 'object' && error !== null && 'code' in error
    ? String((error as { code: unknown }).code)
    : '';

  if (code === 'permission-denied' || code === 'firestore/permission-denied') {
    return 'Connexion réussie, mais la vérification des droits administrateur a été refusée par Firestore. Vérifiez la base de données et ses règles.';
  }
  if (code === 'unavailable' || code === 'firestore/unavailable') {
    return 'Connexion réussie, mais Firestore est momentanément indisponible. Réessayez plus tard.';
  }
  return 'Connexion réussie, mais les droits administrateur n’ont pas pu être vérifiés. Vérifiez la configuration Firestore.';
}

interface AuthContextType {
  admin: AuthenticatedAdmin | null;
  firebaseUser: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<AuthenticatedAdmin>;
  logout: () => Promise<void>;
  authError: string | null;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Maps Firebase Auth error codes to user-friendly messages in French.
 */
export function translateAuthError(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const authErr = error as AuthError;
    switch (authErr.code) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return 'Identifiants invalides : adresse e-mail ou mot de passe incorrect.';
      case 'auth/too-many-requests':
        return 'Trop de tentatives infructueuses. Votre accès est temporairement suspendu par mesure de sécurité.';
      case 'auth/user-disabled':
        return 'Ce compte administrateur a été désactivé par la direction.';
      case 'auth/invalid-email':
        return 'Le format de l’adresse e-mail est invalide.';
      case 'auth/network-request-failed':
        return 'Connexion réseau impossible. Vérifiez votre connexion internet.';
      case 'auth/operation-not-allowed':
        return 'La connexion par e-mail et mot de passe est désactivée dans le projet Firebase utilisé par cette application.';
      case 'auth/unauthorized-domain':
        return 'Ce domaine n’est pas autorisé dans Firebase Authentication. Ajoutez le domaine de l’application aux domaines autorisés du projet utilisé.';
      case 'auth/invalid-api-key':
        return 'La clé de configuration Firebase est invalide. Vérifiez le projet Firebase configuré pour cette application.';
      default:
        return authErr.message || 'Une erreur d’authentification est survenue.';
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Une erreur inattendue est survenue.';
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [admin, setAdmin] = useState<AuthenticatedAdmin | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Track the admin record continuously so role changes and revocations apply
  // to already-open sessions, as well as to new sign-ins.
  useEffect(() => {
    let stopAdminListener: (() => void) | null = null;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      stopAdminListener?.();
      stopAdminListener = null;
      setFirebaseUser(user);
      console.info('[Firebase diagnostics] auth state changed', {
        projectId: auth.app.options.projectId,
        uid: user?.uid ?? null,
      });
      if (!user) {
        setAdmin(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const adminDocRef = doc(db, 'admins', user.uid);
      stopAdminListener = onSnapshot(adminDocRef, { includeMetadataChanges: true }, (adminSnap) => {
        if (auth.currentUser?.uid !== user.uid) return;
        // Never make an authorization decision from a cached role document.
        // Wait until Firestore has confirmed the current server state.
        if (adminSnap.metadata.fromCache) return;
        const role = adminSnap.exists() ? adminSnap.data()?.role : undefined;
        console.info('[Firebase diagnostics] admin role lookup completed', {
          projectId: auth.app.options.projectId,
          uid: user.uid,
          recordExists: adminSnap.exists(),
          role: typeof role === 'string' ? role : null,
          authorizedStaffRole: isStaffRole(role),
        });

        if (!adminSnap.exists() || !isStaffRole(role)) {
          setAdmin(null);
          setIsLoading(false);
          setAuthError(adminSnap.exists()
            ? INVALID_ADMIN_ROLE_MESSAGE
            : `Accès non autorisé : Le compte ${user.email} ne possède pas les privilèges d’accès au back-office.`);
          console.warn(`Admin access removed or invalid for ${user.email} (${user.uid}).`);
          void signOut(auth).catch((error) => console.error('Unable to close revoked admin session:', error));
          return;
        }

        const data = adminSnap.data();
        setAdmin({
          uid: user.uid,
          email: user.email || '',
          displayName: data?.displayName || user.displayName || user.email?.split('@')[0] || 'Administrateur',
          role,
          createdAt: data?.createdAt,
        });
        setAuthError(null);
        setIsLoading(false);
      }, (err) => {
        console.error('[Firebase diagnostics] admin role lookup failed', {
          projectId: auth.app.options.projectId,
          uid: user.uid,
          errorCode: typeof err === 'object' && err !== null && 'code' in err
            ? String((err as { code: unknown }).code)
            : 'unknown',
        });
        console.error('Error verifying administrator role:', err);
        setAdmin(null);
        setAuthError(adminLookupErrorMessage(err));
        setIsLoading(false);
        void signOut(auth).catch((error) => console.error('Unable to close unverified admin session:', error));
      });
    });

    return () => {
      stopAdminListener?.();
      unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<AuthenticatedAdmin> => {
    setAuthError(null);
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      const msg = 'Veuillez saisir votre adresse e-mail professionnelle.';
      setAuthError(msg);
      throw new Error(msg);
    }
    if (!password) {
      const msg = 'Veuillez saisir votre mot de passe.';
      setAuthError(msg);
      throw new Error(msg);
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, trimmedEmail, password);
      const user = userCredential.user;

      // Check admin privileges in Firestore
      const adminDocRef = doc(db, 'admins', user.uid);
      let adminSnap;
      try {
        adminSnap = await getDoc(adminDocRef);
        const role = adminSnap.exists() ? adminSnap.data()?.role : undefined;
        console.info('[Firebase diagnostics] login admin role lookup completed', {
          projectId: auth.app.options.projectId,
          uid: user.uid,
          recordExists: adminSnap.exists(),
          role: typeof role === 'string' ? role : null,
          authorizedStaffRole: isStaffRole(role),
        });
      } catch (err) {
        console.error('[Firebase diagnostics] login admin role lookup failed', {
          projectId: auth.app.options.projectId,
          uid: user.uid,
          errorCode: typeof err === 'object' && err !== null && 'code' in err
            ? String((err as { code: unknown }).code)
            : 'unknown',
        });
        await signOut(auth);
        const msg = adminLookupErrorMessage(err);
        setAuthError(msg);
        throw new Error(msg);
      }

      if (!adminSnap.exists()) {
        await signOut(auth);
        const msg = `Accès refusé : Le compte « ${user.email} » n’est pas configuré comme administrateur autorisé.`;
        setAuthError(msg);
        throw new Error(msg);
      }

      const data = adminSnap.data();
      if (!isStaffRole(data.role)) {
        await signOut(auth);
        const msg = INVALID_ADMIN_ROLE_MESSAGE;
        setAuthError(msg);
        throw new Error(msg);
      }
      const verifiedAdmin: AuthenticatedAdmin = {
        uid: user.uid,
        email: user.email || trimmedEmail,
        displayName: data?.displayName || user.displayName || trimmedEmail.split('@')[0],
        role: data.role,
        createdAt: data?.createdAt,
      };

      setAdmin(verifiedAdmin);
      return verifiedAdmin;
    } catch (err) {
      const userMessage = translateAuthError(err);
      setAuthError(userMessage);
      throw new Error(userMessage);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await signOut(auth);
      setAdmin(null);
      setFirebaseUser(null);
      setAuthError(null);
    } catch (err) {
      console.error('Logout error:', err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        admin,
        firebaseUser,
        isLoading,
        isAuthenticated: !!admin,
        login,
        logout,
        authError,
        clearAuthError: () => setAuthError(null),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
