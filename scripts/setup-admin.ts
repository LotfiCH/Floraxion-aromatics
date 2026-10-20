/**
 * Floraxion Aromatics - Administrator Account Provisioning Script
 * 
 * Usage:
 *   npx tsx scripts/setup-admin.ts <email> <password> [displayName] [role]
 * 
 * Example:
 *   npx tsx scripts/setup-admin.ts direction@floraxion.dz MonMotDePasseSecurise2026 "Nour El Houda" super_admin
 */

import { initializeApp, cert, getApps, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as path from 'path';

// Load config
const configPath = path.resolve(__dirname, '../firebase-applet-config.json');
if (!fs.existsSync(configPath)) {
  console.error('Error: firebase-applet-config.json not found in project root.');
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const projectId = config.projectId;

const [email, password, displayName = 'Administrateur', role = 'super_admin'] = process.argv.slice(2);

if (!email || !password) {
  console.log(`
Floraxion Aromatics - Admin Provisioning Utility
------------------------------------------------
Usage:
  npx tsx scripts/setup-admin.ts <email> <password> [displayName] [role]

Available Roles:
  - super_admin        : Full control (products, orders, quotes, settings, audit)
  - catalogue_manager  : Manage products, variants, botanical descriptions
  - order_manager      : Manage and verify customer orders
  - sales_manager      : Manage B2B quotations
  - read_only          : Auditor and view-only permissions

Example:
  npx tsx scripts/setup-admin.ts direction@floraxion.dz MotDePasseSecurise2026 "Nour El Houda" super_admin
`);
  process.exit(0);
}

const VALID_ROLES = ['super_admin', 'catalogue_manager', 'order_manager', 'sales_manager', 'read_only'];
if (!VALID_ROLES.includes(role)) {
  console.error(`Error: Invalid role "${role}". Must be one of: ${VALID_ROLES.join(', ')}`);
  process.exit(1);
}

async function run() {
  console.log(`\nInitializing Firebase Admin SDK for project: ${projectId}...`);

  let app;
  const serviceAccountKeyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  try {
    if (serviceAccountKeyPath && fs.existsSync(serviceAccountKeyPath)) {
      app = initializeApp({
        credential: cert(serviceAccountKeyPath),
        projectId,
      });
    } else {
      // Fallback to application default or project ID
      app = initializeApp({
        credential: applicationDefault(),
        projectId,
      });
    }
  } catch (err: any) {
    console.warn(`\n[Notice] Standard GCP credentials not detected in environment (${err?.message}).`);
    console.log(`
To use this CLI script directly with Firebase Admin SDK:
1. Go to Firebase Console -> Project Settings -> Service Accounts
2. Click "Generate new private key"
3. Set the environment variable:
   export GOOGLE_APPLICATION_CREDENTIALS="/path/to/serviceAccountKey.json"
4. Re-run:
   npx tsx scripts/setup-admin.ts ${email} <password> "${displayName}" ${role}

Alternatively, perform the one-time setup in the Firebase Console:
1. In Firebase Console -> Authentication -> Users:
   Click "Add user", enter:
   - Email: ${email}
   - Password: (your secure password)
   Copy the generated UID.

2. In Firebase Console -> Firestore Database:
   Navigate to or start the "admins" collection.
   Add a document with Document ID = <Copied UID>
   Fields:
   - uid (string): <Copied UID>
   - email (string): "${email}"
   - displayName (string): "${displayName}"
   - role (string): "${role}"
   - createdAt (string): "${new Date().toISOString()}"
`);
    process.exit(0);
  }

  const adminAuth = getAuth(app);
  const adminDb = config.firestoreDatabaseId
    ? getFirestore(app, config.firestoreDatabaseId)
    : getFirestore(app);

  let userRecord;
  try {
    userRecord = await adminAuth.getUserByEmail(email);
    console.log(`User already exists in Firebase Auth (UID: ${userRecord.uid}). Updating credentials...`);
    await adminAuth.updateUser(userRecord.uid, {
      password,
      displayName,
    });
  } catch (err: any) {
    if (err.code === 'auth/user-not-found') {
      console.log(`Creating new user account in Firebase Auth: ${email}...`);
      userRecord = await adminAuth.createUser({
        email,
        password,
        displayName,
      });
      console.log(`Created user with UID: ${userRecord.uid}`);
    } else {
      throw err;
    }
  }

  // Register or update administrator privileges in Firestore /admins/{uid}
  console.log(`Granting verified role "${role}" in Firestore (/admins/${userRecord.uid})...`);
  await adminDb.collection('admins').doc(userRecord.uid).set({
    uid: userRecord.uid,
    email,
    displayName,
    role,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  console.log(`
===========================================================
 SUCCESS: Administrator Configured!
===========================================================
 Email:        ${email}
 Display Name: ${displayName}
 Role:         ${role}
 Auth UID:     ${userRecord.uid}
 Firestore:    /admins/${userRecord.uid}
===========================================================
You can now log in at /admin with these credentials.
`);
}

run().catch((err) => {
  console.error('Failed to setup admin:', err);
  process.exit(1);
});
