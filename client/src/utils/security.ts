// Güvenlik Utility - LocalStorage'dan hassas verileri temizle
export function cleanSensitiveDataFromLocalStorage() {
  console.log('🔒 GÜVENLİK: LocalStorage hassas veri temizliği başlatılıyor...');
  
  const sensitiveKeys = [
    // Config keys
    'doc_search_configs_json',
    'user_settings',
    'api_keys',
    'configs',
    
    // API keys
    'supabase_url',
    'supabase_anon_key',
    'openai_api_key',
    'deepseek_api_key',
    'firebase_api_key',
    'google_sheets_client_id',
    
    // Variations
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'OPENAI_API_KEY',
    'DEEPSEEK_API_KEY',
    'apiKey',
    'api_key',
    'API_KEY',
    
    // Database credentials
    'database_url',
    'db_url',
    'db_password',
    'database_password'
  ];
  
  let cleanedCount = 0;
  
  sensitiveKeys.forEach(key => {
    if (localStorage.getItem(key)) {
      localStorage.removeItem(key);
      cleanedCount++;
      console.log(`🧹 Temizlendi: ${key}`);
    }
  });
  
  // Pattern-based cleaning for dynamic keys
  const allKeys = Object.keys(localStorage);
  allKeys.forEach(key => {
    const lowerKey = key.toLowerCase();
    if (
      lowerKey.includes('api') && lowerKey.includes('key') ||
      lowerKey.includes('secret') ||
      lowerKey.includes('token') ||
      lowerKey.includes('password') ||
      lowerKey.includes('credential')
    ) {
      localStorage.removeItem(key);
      cleanedCount++;
      console.log(`🧹 Pattern match temizlendi: ${key}`);
    }
  });
  
  if (cleanedCount > 0) {
    console.log(`✅ GÜVENLİK: ${cleanedCount} hassas veri localStorage'dan temizlendi`);
  } else {
    console.log('✅ GÜVENLİK: LocalStorage\'da hassas veri bulunamadı');
  }
  
  return cleanedCount;
}

// Auth logout sırasında çağrılacak fonksiyon
export function secureLogout() {
  console.log('🔐 Güvenli çıkış işlemi başlatılıyor...');
  
  // LocalStorage'ı temizle
  const cleanedCount = cleanSensitiveDataFromLocalStorage();
  
  // SessionStorage'ı da temizle
  sessionStorage.clear();
  console.log('🧹 SessionStorage temizlendi');
  
  // Cache'i temizle
  if ('caches' in window) {
    caches.keys().then(names => {
      names.forEach(name => {
        caches.delete(name);
      });
    });
  }
  
  console.log(`✅ Güvenli çıkış tamamlandı - ${cleanedCount} hassas veri temizlendi`);
}

// Sayfa yüklendiğinde otomatik temizlik (opsiyonel)
export function performSecurityCheck() {
  console.log('🔍 Güvenlik kontrolü başlatılıyor...');
  
  // Eğer kullanıcı auth değilse localStorage'ı temizle
  const hasAuthToken = localStorage.getItem('firebase:authUser') || 
                      sessionStorage.getItem('firebase:authUser');
  
  if (!hasAuthToken) {
    console.log('⚠️ Auth token bulunamadı, güvenlik temizliği yapılıyor...');
    cleanSensitiveDataFromLocalStorage();
  }
}

// Browser'da kullanım için global fonksiyonlar
if (typeof window !== 'undefined') {
  // Assign to window with an any-cast to avoid TypeScript complaints about
  // custom globals. These are convenience helpers for dev/debugging.
  (window as any).cleanSensitiveDataFromLocalStorage = cleanSensitiveDataFromLocalStorage;
  (window as any).secureLogout = secureLogout;
  (window as any).performSecurityCheck = performSecurityCheck;
}
