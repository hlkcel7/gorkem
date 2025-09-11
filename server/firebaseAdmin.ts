import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

/**
 * Lazy initializer for Firebase Admin. This avoids throwing at import time when
 * the environment variables are not yet provided (useful for cPanel deployments
 * where envs are configured after upload).
 */
export function getFirebaseAdmin() {
  if (admin.apps.length > 0) return admin.app();

  // Priority: GOOGLE_APPLICATION_CREDENTIALS file -> FIREBASE_SERVICE_ACCOUNT_BASE64 -> FIREBASE_SERVICE_ACCOUNT (JSON string) -> individual envs
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
    return admin.app();
  }

  // Fallback: look for a credentials file inside dist/credentials
  try {
    const fallbackDir = path.resolve(process.cwd(), 'dist', 'credentials');
    if (fs.existsSync(fallbackDir)) {
      const files = fs.readdirSync(fallbackDir).filter(f => f.endsWith('.json'));
      if (files.length > 0) {
        const filePath = path.join(fallbackDir, files[0]);
        const raw = fs.readFileSync(filePath, 'utf8');
        const parsed = JSON.parse(raw);
        admin.initializeApp({
          credential: admin.credential.cert(parsed as any),
        });
        return admin.app();
      }
    }
  } catch (err) {
    // ignore and continue to other options
    // console.warn('Firebase fallback credential read failed', err);
  }

  if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    const json = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8');
    const parsed = JSON.parse(json);
    admin.initializeApp({
      credential: admin.credential.cert(parsed as any),
    });
    return admin.app();
  }

  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
    try {
      const parsed = JSON.parse(raw as string);
      admin.initializeApp({
        credential: admin.credential.cert(parsed as any),
      });
      return admin.app();
    } catch (err) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT must be a valid JSON string');
    }
  }

  if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PROJECT_ID) {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey,
      } as any),
    });
    return admin.app();
  }

  // If none of the credential options are present, throw when the caller
  // actually tries to use Firebase Admin (this function is intentionally
  // lazy to allow the server to start in environments where creds are set
  // later via the hosting UI).
  throw new Error('Firebase admin credentials not found in environment. Provide GOOGLE_APPLICATION_CREDENTIALS, FIREBASE_SERVICE_ACCOUNT_BASE64, FIREBASE_SERVICE_ACCOUNT, or the individual FIREBASE_* vars.');
}

export default admin;
