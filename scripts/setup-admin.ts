/**
 * One-time provisioning of the explicitly designated initial administrator.
 *
 * Usage: npx tsx scripts/setup-admin.ts
 * Requires Google Application Default Credentials with access to the configured
 * Firebase project and named Firestore database. This script never creates an
 * Auth user or changes a password.
 */

import { initializeApp, applicationDefault, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const INITIAL_ADMIN_EMAIL = 'chabou.lotfi@gmail.com';
const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const config = JSON.parse(
  await readFile(path.resolve(scriptDirectory, '../firebase-applet-config.json'), 'utf8')
) as { projectId?: string; firestoreDatabaseId?: string };

if (!config.projectId) {
  throw new Error('firebase-applet-config.json must define projectId.');
}

const app = getApps().find(({ name }) => name === '[DEFAULT]') ?? initializeApp({
  credential: applicationDefault(),
  projectId: config.projectId,
});

const auth = getAuth(app);
const db = config.firestoreDatabaseId
  ? getFirestore(app, config.firestoreDatabaseId)
  : getFirestore(app);

async function run() {
  const rl = createInterface({ input, output });
  try {
    const typedEmail = (await rl.question(
      `To grant super_admin to ${INITIAL_ADMIN_EMAIL}, type that exact email: `
    )).trim().toLowerCase();

    if (typedEmail !== INITIAL_ADMIN_EMAIL) {
      throw new Error('Confirmation did not match the designated administrator email. No changes were made.');
    }

    const user = await auth.getUserByEmail(INITIAL_ADMIN_EMAIL);
    if (user.email?.toLowerCase() !== INITIAL_ADMIN_EMAIL) {
      throw new Error('Firebase Auth returned a different email. No changes were made.');
    }

    const adminRef = db.collection('admins').doc(user.uid);
    const existing = await adminRef.get();
    if (existing.exists && existing.data()?.email?.toLowerCase() !== INITIAL_ADMIN_EMAIL) {
      throw new Error('An admin record with this UID has a different email. Resolve it manually; no changes were made.');
    }

    await adminRef.set({
      uid: user.uid,
      email: INITIAL_ADMIN_EMAIL,
      displayName: user.displayName || 'Administrateur Floraxion',
      role: 'super_admin',
      createdAt: existing.data()?.createdAt || new Date().toISOString(),
    }, { merge: true });

    console.log(`Granted super_admin to the existing Firebase Auth account in project ${config.projectId}.`);
    console.log(`Firestore path: admins/${user.uid}`);
  } finally {
    rl.close();
  }
}

run().catch((error: unknown) => {
  console.error('Admin provisioning failed:', error instanceof Error ? error.message : 'Unknown error.');
  process.exitCode = 1;
});
