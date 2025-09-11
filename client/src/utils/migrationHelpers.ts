// Migration Test Script - localStorage'dan Firebase'e geçiş testi
import firebaseConfigService from '../services/firebaseConfig';

// localStorage'dan örnek data oluştur (test için)
const createSampleLocalStorageData = () => {
  const sampleData = {
    supabase: {
      url: "https://ymivsbikxiosrdtnnuax.supabase.co",
      anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    },
    deepseek: {
      apiKey: "sk-PLACEHOLDER" // ÖRNEK - GERÇEK KEY KALDIRILDI
    },
    openai: {
      apiKey: "sk-proj-PLACEHOLDER..." // ÖRNEK - GERÇEK KEY KALDIRILDI
    },
    enableAI: true,
    vectorThreshold: 0.5,
    vectorWeight: 0.6,
    textWeight: 0.4,
    textScoreMethod: "overlap"
  };

  localStorage.setItem('doc_search_configs_json', JSON.stringify(sampleData));
  console.log('✅ Sample localStorage data created');
  return sampleData;
};

// Migration testini çalıştır
export const testMigration = async (userId: string) => {
  try {
    console.log('🧪 Migration test başlatılıyor...');
    
    // 1. Sample localStorage data oluştur
    const sampleData = createSampleLocalStorageData();
    
    // 2. Firebase'de config var mı kontrol et
    const existingConfig = await firebaseConfigService.getUserConfig(userId);
    if (existingConfig) {
      console.log('⚠️ Firebase\'de zaten config var, önce silinmeli (manual test)');
      return;
    }
    
    // 3. Migration işlemini test et
    console.log('🔄 Migration işlemi test ediliyor...');
    const migratedConfig = await firebaseConfigService.migrateFromLocalStorage(userId, sampleData);
    
    // 4. Sonuçları kontrol et
    console.log('📊 Migration sonuçları:');
    console.log('Original:', sampleData);
    console.log('Migrated:', migratedConfig);
    
    // 5. Validation
    const isValid = 
      migratedConfig.supabase.url === sampleData.supabase.url &&
      migratedConfig.supabase.anonKey === sampleData.supabase.anonKey &&
      migratedConfig.apis.openai === sampleData.openai.apiKey &&
      migratedConfig.apis.deepseek === sampleData.deepseek.apiKey &&
      migratedConfig.search.enableAI === sampleData.enableAI;
      
    if (isValid) {
      console.log('✅ Migration test BAŞARILI!');
    } else {
      console.log('❌ Migration test BAŞARISIZ!');
    }
    
    // 6. Test localStorage'ı temizle
    localStorage.removeItem('doc_search_configs_json');
    
    return migratedConfig;
    
  } catch (error) {
    console.error('❌ Migration test hatası:', error);
    throw error;
  }
};

// Production migration (gerçek kullanım)
export const runProductionMigration = async (userId: string) => {
  try {
    console.log('🚀 Production migration başlatılıyor...');
    
    // 1. Firebase'de config var mı kontrol et
    const hasConfig = await firebaseConfigService.configExists(userId);
    if (hasConfig) {
      console.log('✅ User config Firebase\'de zaten mevcut, migration gerekli değil');
      return await firebaseConfigService.getUserConfig(userId);
    }
    
    // 2. localStorage'da veri var mı kontrol et
    const localData = localStorage.getItem('doc_search_configs_json');
    if (!localData) {
      console.log('⚡ LocalStorage\'da veri yok, yeni default config oluşturuluyor');
      return await firebaseConfigService.createDefaultUserConfig(userId);
    }
    
    // 3. Migration işlemini çalıştır
    console.log('🔄 LocalStorage\'dan Firebase\'e migration yapılıyor...');
    const parsedData = JSON.parse(localData);
    const migratedConfig = await firebaseConfigService.migrateFromLocalStorage(userId, parsedData);
    
    // 4. Başarılı olursa localStorage'ı temizle
    localStorage.removeItem('doc_search_configs_json');
    
    // 5. Eski localStorage key'lerini de temizle
    const oldKeys = [
      'doc_search_supabase_url',
      'doc_search_supabase_key', 
      'doc_search_deepseek_key',
      'doc_search_openai_key',
      'doc_search_enable_ai',
      'doc_search_vector_threshold',
      'doc_search_vector_weight',
      'doc_search_text_weight',
      'doc_search_text_score_method'
    ];
    
    oldKeys.forEach(key => localStorage.removeItem(key));
    
    console.log('✅ Production migration tamamlandı ve localStorage temizlendi');
    return migratedConfig;
    
  } catch (error) {
    console.error('❌ Production migration hatası:', error);
    throw error;
  }
};

// Console'dan test etmek için global fonksiyon
if (typeof window !== 'undefined') {
  (window as any).testFirebaseMigration = testMigration;
  (window as any).runFirebaseMigration = runProductionMigration;
}
