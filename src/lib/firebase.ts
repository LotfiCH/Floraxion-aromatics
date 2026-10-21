import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const requiredConfigFields = ['apiKey', 'appId', 'authDomain', 'projectId'] as const;
const missingConfigFields = requiredConfigFields.filter((field) => !firebaseConfig[field]);

if (missingConfigFields.length > 0) {
  throw new Error(`Firebase configuration is incomplete. Missing: ${missingConfigFields.join(', ')}.`);
}

const existingDefaultApp = getApps().find(({ name }) => name === '[DEFAULT]');
if (existingDefaultApp && (
  existingDefaultApp.options.projectId !== firebaseConfig.projectId ||
  existingDefaultApp.options.authDomain !== firebaseConfig.authDomain ||
  existingDefaultApp.options.appId !== firebaseConfig.appId
)) {
  throw new Error(
    'The existing Firebase default app does not match firebase-applet-config.json. Check the projectId, authDomain, and appId.'
  );
}

export const app = existingDefaultApp ?? initializeApp(firebaseConfig);

// Temporary, credential-free diagnostics for the catalogue permission investigation.
console.info('[Firebase diagnostics] app initialized', {
  projectId: app.options.projectId,
  firestoreDatabaseId: firebaseConfig.firestoreDatabaseId || '(default)',
});

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Initialize Firestore with specific database ID if configured
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Test connection on boot per Firebase guidelines
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline: check your network connection.');
      return false;
    }
    // Server responded (even if document not found or permission denied)
    return true;
  }
}

// Initial connection check
testConnection().catch((err) => console.warn('Firebase connection check:', err));
