// Runtime konfigürasyon dosyası - GÜVENL İK SÜRÜMÜ
// Hassas veriler GitHub repository rules nedeniyle kaldırılmıştır
// Gerçek değerler Firestore'dan runtime'da yüklenir

window.__APP_CONFIG__ = {
  // Production server URL (public bilgi)
  API_BASE_URL: "http://gorkemprojetakip.com.tr",
  
  // Firebase configuration - PLACEHOLDER VALUES (Firestore'dan yüklenecek)
  FIREBASE_API_KEY: "", // GERÇEK DEĞER KALDIRILDI
  FIREBASE_AUTH_DOMAIN: "", // GERÇEK DEĞER KALDIRILDI
  FIREBASE_PROJECT_ID: "gorkemapp", // public bilgi
  FIREBASE_APP_ID: "", // GERÇEK DEĞER KALDIRILDI
  FIREBASE_MEASUREMENT_ID: "", // GERÇEK DEĞER KALDIRILDI
  
  // Google Sheets configuration - PLACEHOLDER VALUES (Firestore'dan yüklenecek)
  GOOGLE_SHEETS_CLIENT_ID: "", // GERÇEK DEĞER KALDIRILDI
  GOOGLE_SHEETS_PROJECT_ID: "", // GERÇEK DEĞER KALDIRILDI
  GOOGLE_SHEETS_SPREADSHEET_ID: "", // GERÇEK DEĞER KALDIRILDI
  
  // API Keys - Kullanıcı ayarlarından yüklenecek
  SUPABASE_URL: "",
  SUPABASE_ANON_KEY: "",
  DEEPSEEK_API_KEY: "",
  OPENAI_API_KEY: "",
  
  // Deployment Info
  VERSION: '1.0.0',
  BUILD_TIME: new Date().toISOString(),
  
  // Config yükleme durumu
  CONFIG_LOADED: false,
  CONFIG_SOURCE: 'placeholder' // placeholder | firestore | user-settings
};
