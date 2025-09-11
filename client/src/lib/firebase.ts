import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Prefer runtime-injected config (window.__APP_CONFIG__) when available.
// This avoids needing to rebuild the client bundle when deploying to cPanel.
// Build-time config (these will be replaced by Vite during the build)
const BUILD_FIREBASE_CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

function getFirebaseConfig() {
  // @ts-ignore - window may have __APP_CONFIG__ injected at runtime
  const runtime = typeof window !== 'undefined' && (window as any).__APP_CONFIG__;
  // Prefer runtime override (for deployments that inject a script), otherwise use build-time values
  return {
    apiKey: runtime?.VITE_FIREBASE_API_KEY || BUILD_FIREBASE_CONFIG.apiKey,
    authDomain: runtime?.VITE_FIREBASE_AUTH_DOMAIN || BUILD_FIREBASE_CONFIG.authDomain,
    projectId: runtime?.VITE_FIREBASE_PROJECT_ID || BUILD_FIREBASE_CONFIG.projectId,
    appId: runtime?.VITE_FIREBASE_APP_ID || BUILD_FIREBASE_CONFIG.appId,
  };
}

const firebaseConfig = getFirebaseConfig();

let app: any = null;
let authInstance: any = null;

// Only initialize Firebase if we have a valid apiKey (avoid invalid-api-key runtime errors)
if (firebaseConfig.apiKey) {
  try {
    app = initializeApp(firebaseConfig as any);
    authInstance = getAuth(app);
    console.log('Firebase initialized with runtime config');
  } catch (err) {
    console.error('Failed to initialize Firebase:', err);
  }
} else {
  console.warn('Firebase config missing; auth disabled in this environment');
}

export const auth = authInstance;
export default app;
