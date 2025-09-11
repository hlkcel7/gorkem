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
  
  // Runtime config'ten Firebase değerlerini al
  const config = {
    apiKey: runtime?.FIREBASE_API_KEY || BUILD_FIREBASE_CONFIG.apiKey,
    authDomain: runtime?.FIREBASE_AUTH_DOMAIN || BUILD_FIREBASE_CONFIG.authDomain,
    projectId: runtime?.FIREBASE_PROJECT_ID || BUILD_FIREBASE_CONFIG.projectId,
    appId: runtime?.FIREBASE_APP_ID || BUILD_FIREBASE_CONFIG.appId,
  };

  // Config validation - boş değerler için fallback
  if (!config.apiKey && !config.projectId) {
    console.warn('⚠️ Firebase config eksik, development fallback kullanılıyor');
    return {
      apiKey: "development-mode",
      authDomain: "gorkemapp.firebaseapp.com",
      projectId: "gorkemapp",
      appId: "development-mode",
    };
  }

  return config;
}

const firebaseConfig = getFirebaseConfig();

let app: any = null;
let authInstance: any = null;

// Firebase initialization with better error handling
try {
  const config = getFirebaseConfig();
  console.log('🔧 Firebase config:', { 
    projectId: config.projectId,
    authDomain: config.authDomain,
    hasApiKey: !!config.apiKey,
    hasAppId: !!config.appId
  });

  if (config.apiKey && config.apiKey !== "development-mode") {
    app = initializeApp(config as any);
    authInstance = getAuth(app);
    console.log('✅ Firebase initialized successfully');
  } else {
    console.warn('⚠️ Firebase development mode - auth disabled');
    console.log('💡 Gerçek Firebase credentials için app-config.js\'i güncelleyin');
  }
} catch (err) {
  console.error('❌ Firebase initialization failed:', err);
  console.log('💡 Fallback mode: Auth features disabled');
}

export const auth = authInstance;
export default app;
