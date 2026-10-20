import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  AuthError,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { StaffRole } from '../types';

export interface AuthenticatedAdmin {
  uid: string;
  email: string;
  displayName: string;
  role: StaffRole;
  createdAt?: string;
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

  // Securely listen to authentication changes and verify admin role in Firestore
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (!user) {
        setAdmin(null);
        setIsLoading(false);
        return;
      }

      try {
        // Query Firestore for authorized admin record
        const adminDocRef = doc(db, 'admins', user.uid);
        const adminSnap = await getDoc(adminDocRef);

        if (adminSnap.exists()) {
          const data = adminSnap.data();
          const verifiedRole = (data?.role as StaffRole) || 'read_only';
          setAdmin({
            uid: user.uid,
            email: user.email || '',
            displayName: data?.displayName || user.displayName || user.email?.split('@')[0] || 'Administrateur',
            role: verifiedRole,
            createdAt: data?.createdAt,
          });
        } else {
          // User exists in Firebase Auth but has NOT been granted admin role in Firestore
          console.warn(`User ${user.email} (${user.uid}) is not listed in Firestore /admins collection.`);
          await signOut(auth);
          setAdmin(null);
          setAuthError(
            `Accès non autorisé : Le compte ${user.email} ne possède pas les privilèges d’accès au back-office.`
          );
        }
      } catch (err) {
        console.error('Error verifying administrator role:', err);
        setAdmin(null);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
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
      const adminSnap = await getDoc(adminDocRef);

      if (!adminSnap.exists()) {
        await signOut(auth);
        const msg = `Accès refusé : Le compte « ${user.email} » n’est pas configuré comme administrateur autorisé.`;
        setAuthError(msg);
        throw new Error(msg);
      }

      const data = adminSnap.data();
      const verifiedAdmin: AuthenticatedAdmin = {
        uid: user.uid,
        email: user.email || trimmedEmail,
        displayName: data?.displayName || user.displayName || trimmedEmail.split('@')[0],
        role: (data?.role as StaffRole) || 'read_only',
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
