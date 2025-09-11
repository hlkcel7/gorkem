// Firebase Config Service - User settings yönetimi için Firestore tabanlı servis
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  onSnapshot,
  Timestamp 
} from 'firebase/firestore';
import app from '../lib/firebase';

// User config veri yapısı - Firebase'de saklanacak
export interface UserConfig {
  // API Konfigürasyonları
  supabase: {
    url: string;
    anonKey: string;
  };
  apis: {
    openai: string;
    deepseek: string;
  };
  
  // Firebase Konfigürasyonu (isteğe bağlı - farklı projeler için)
  firebase?: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    appId: string;
    measurementId?: string;
  };
  
  // Google Sheets Konfigürasyonu
  googleSheets?: {
    clientId: string;
    projectId: string;
    spreadsheetId: string;
  };
  
  // Server Konfigürasyonu
  server?: {
    apiBaseUrl: string;
  };
  
  // Arama ve AI Ayarları
  search: {
    enableAI: boolean;
    vectorThreshold: number;
    vectorWeight: number;
    textWeight: number;
    textScoreMethod: 'overlap' | 'simple';
  };
  
  // Meta veriler
  meta: {
    createdAt: Timestamp;
    updatedAt: Timestamp;
    version: string;
  };
}

// Default config - yeni kullanıcılar için
export const DEFAULT_USER_CONFIG: Omit<UserConfig, 'meta'> = {
  supabase: {
    url: '',
    anonKey: ''
  },
  apis: {
    openai: '',
    deepseek: ''
  },
  search: {
    enableAI: true,
    vectorThreshold: 0.3,
    vectorWeight: 0.3,
    textWeight: 0.7,
    textScoreMethod: 'overlap'
  }
};

class FirebaseConfigService {
  private db;
  private readonly COLLECTION_NAME = 'userConfigs';

  constructor() {
    if (!app) {
      throw new Error('Firebase app is not initialized');
    }
    this.db = getFirestore(app);
  }

  // Kullanıcı config dokümanının referansını al
  private getUserDocRef(userId: string) {
    return doc(this.db, this.COLLECTION_NAME, userId);
  }

  // Kullanıcı config'ini getir
  async getUserConfig(userId: string): Promise<UserConfig | null> {
    try {
      console.log('🔍 Firebase\'den user config getiriliyor:', userId);
      
      const docRef = this.getUserDocRef(userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as UserConfig;
        console.log('✅ Firebase\'den user config bulundu:');
        console.log('📋 Config içeriği:', {
          hasSupabase: !!data.supabase?.url,
          hasApis: !!(data.apis?.openai || data.apis?.deepseek),
          hasFirebase: !!data.firebase?.apiKey,
          hasGoogleSheets: !!data.googleSheets?.clientId,
          hasServer: !!data.server?.apiBaseUrl
        });
        return data;
      } else {
        console.log('⚠️ Firebase\'de user config bulunamadı, default oluşturulacak');
        return null;
      }
    } catch (error) {
      console.error('❌ Firebase\'den config getirme hatası:', error);
      throw error;
    }
  }

  // Yeni kullanıcı config'i oluştur (environment değerleri ile)
  async createDefaultUserConfig(userId: string): Promise<UserConfig> {
    try {
      console.log('🏗️ Yeni kullanıcı için default config oluşturuluyor...');
      
      // Environment değerlerini al
      const appConfig = (window as any).__APP_CONFIG__;
      
      const newConfig: UserConfig = {
        ...DEFAULT_USER_CONFIG,
        // Environment'dan API bilgilerini al (boş olabilir)
        supabase: {
          url: appConfig?.SUPABASE_URL || '',
          anonKey: appConfig?.SUPABASE_ANON_KEY || ''
        },
        apis: {
          openai: appConfig?.OPENAI_API_KEY || '',
          deepseek: appConfig?.DEEPSEEK_API_KEY || ''
        },
        // Firebase config - app-config.js'den gerçek değerleri al
        firebase: {
          apiKey: appConfig?.FIREBASE_API_KEY || '',
          authDomain: appConfig?.FIREBASE_AUTH_DOMAIN || '',
          projectId: appConfig?.FIREBASE_PROJECT_ID || '',
          appId: appConfig?.FIREBASE_APP_ID || '',
          measurementId: appConfig?.FIREBASE_MEASUREMENT_ID || ''
        },
        // Google Sheets config - app-config.js'den gerçek değerleri al  
        googleSheets: {
          clientId: appConfig?.GOOGLE_SHEETS_CLIENT_ID || '',
          projectId: appConfig?.GOOGLE_SHEETS_PROJECT_ID || '',
          spreadsheetId: appConfig?.GOOGLE_SHEETS_SPREADSHEET_ID || ''
        },
        // Server config
        server: {
          apiBaseUrl: appConfig?.API_BASE_URL || 'http://gorkemprojetakip.com.tr'
        },
        meta: {
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          version: '1.0.0'
        }
      };

      await this.saveUserConfig(userId, newConfig);
      console.log('✅ Default user config oluşturuldu ve kaydedildi');
      console.log('📋 Firebase config otomatik olarak Firestore\'a kopyalandı:', newConfig.firebase);
      console.log('📊 Google Sheets config otomatik olarak Firestore\'a kopyalandı:', newConfig.googleSheets);
      
      return newConfig;
    } catch (error) {
      console.error('❌ Default config oluşturma hatası:', error);
      throw error;
    }
  }

  // Kullanıcı config'ini kaydet (tam güncelleme)
  async saveUserConfig(userId: string, config: UserConfig): Promise<void> {
    try {
      console.log('💾 Firebase\'e user config kaydediliyor...');
      
      const docRef = this.getUserDocRef(userId);
      const updatedConfig = {
        ...config,
        meta: {
          ...config.meta,
          updatedAt: Timestamp.now()
        }
      };

      await setDoc(docRef, updatedConfig);
      console.log('✅ Firebase\'e user config kaydedildi');
    } catch (error) {
      console.error('❌ Firebase\'e config kaydetme hatası:', error);
      throw error;
    }
  }

  // Kullanıcı config'ini kısmi güncelle
  async updateUserConfig(userId: string, updates: Partial<Omit<UserConfig, 'meta'>>): Promise<void> {
    try {
      console.log('🔄 Firebase\'de user config güncelleniyor...');
      
      const docRef = this.getUserDocRef(userId);
      const updateData = {
        ...updates,
        'meta.updatedAt': Timestamp.now()
      };

      await updateDoc(docRef, updateData);
      console.log('✅ Firebase\'de user config güncellendi');
    } catch (error) {
      console.error('❌ Firebase config güncelleme hatası:', error);
      throw error;
    }
  }

  // Real-time config değişiklikleri için listener
  onUserConfigChange(userId: string, callback: (config: UserConfig | null) => void): () => void {
    console.log('👂 Firebase config değişiklikleri için listener başlatılıyor...');
    
    const docRef = this.getUserDocRef(userId);
    
    const unsubscribe = onSnapshot(docRef, (doc) => {
      if (doc.exists()) {
        const config = doc.data() as UserConfig;
        console.log('🔄 Firebase\'den config değişikliği alındı');
        callback(config);
      } else {
        console.log('⚠️ Firebase\'de config dokümanı yok');
        callback(null);
      }
    }, (error) => {
      console.error('❌ Firebase config listener hatası:', error);
      callback(null);
    });

    return unsubscribe;
  }

  // Config'in var olup olmadığını kontrol et
  async configExists(userId: string): Promise<boolean> {
    try {
      const docRef = this.getUserDocRef(userId);
      const docSnap = await getDoc(docRef);
      return docSnap.exists();
    } catch (error) {
      console.error('❌ Config varlık kontrolü hatası:', error);
      return false;
    }
  }

  // Özel config güncelleme metodları
  
  // API config güncelleme
  async updateApiConfig(userId: string, apiConfig: UserConfig['apis']): Promise<void> {
    await this.updateUserConfig(userId, { apis: apiConfig });
  }

  // Supabase config güncelleme
  async updateSupabaseConfig(userId: string, supabaseConfig: UserConfig['supabase']): Promise<void> {
    await this.updateUserConfig(userId, { supabase: supabaseConfig });
  }

  // Google Sheets config güncelleme
  async updateGoogleSheetsConfig(userId: string, googleSheetsConfig: UserConfig['googleSheets']): Promise<void> {
    await this.updateUserConfig(userId, { googleSheets: googleSheetsConfig });
  }

  // Firebase config güncelleme
  async updateFirebaseConfig(userId: string, firebaseConfig: UserConfig['firebase']): Promise<void> {
    await this.updateUserConfig(userId, { firebase: firebaseConfig });
  }

  // Server config güncelleme
  async updateServerConfig(userId: string, serverConfig: UserConfig['server']): Promise<void> {
    await this.updateUserConfig(userId, { server: serverConfig });
  }

  // Search config güncelleme
  async updateSearchConfig(userId: string, searchConfig: UserConfig['search']): Promise<void> {
    await this.updateUserConfig(userId, { search: searchConfig });
  }

  // GÜVENLİ LocalStorage Migration - Sadece authenticated kullanıcılar için
  async migrateFromLocalStorage(userId: string, localSettings: any): Promise<UserConfig> {
    try {
      console.log('🔄 GÜVENLİ: Authenticated kullanıcı için LocalStorage migration başlatılıyor...');
      console.log('🔒 GÜVENLİK: Migration sadece Firestore\'a hassas verileri taşıyacak');
      
      // Environment değerlerini al
      const appConfig = (window as any).__APP_CONFIG__;
      
      const migratedConfig: UserConfig = {
        supabase: {
          url: localSettings?.supabase?.url || appConfig?.SUPABASE_URL || '',
          anonKey: localSettings?.supabase?.anonKey || appConfig?.SUPABASE_ANON_KEY || ''
        },
        apis: {
          openai: localSettings?.openai?.apiKey || appConfig?.OPENAI_API_KEY || '',
          deepseek: localSettings?.deepseek?.apiKey || appConfig?.DEEPSEEK_API_KEY || ''
        },
        // Firebase config ekle
        firebase: {
          apiKey: appConfig?.FIREBASE_API_KEY || '',
          authDomain: appConfig?.FIREBASE_AUTH_DOMAIN || '',
          projectId: appConfig?.FIREBASE_PROJECT_ID || '',
          appId: appConfig?.FIREBASE_APP_ID || '',
          measurementId: appConfig?.FIREBASE_MEASUREMENT_ID || ''
        },
        // Google Sheets config ekle
        googleSheets: {
          clientId: appConfig?.GOOGLE_SHEETS_CLIENT_ID || '',
          projectId: appConfig?.GOOGLE_SHEETS_PROJECT_ID || '',
          spreadsheetId: appConfig?.GOOGLE_SHEETS_SPREADSHEET_ID || ''
        },
        // Server config ekle
        server: {
          apiBaseUrl: appConfig?.API_BASE_URL || 'http://gorkemprojetakip.com.tr'
        },
        search: {
          enableAI: localSettings?.enableAI ?? true,
          vectorThreshold: localSettings?.vectorThreshold ?? 0.3,
          vectorWeight: localSettings?.vectorWeight ?? 0.3,
          textWeight: localSettings?.textWeight ?? 0.7,
          textScoreMethod: localSettings?.textScoreMethod || 'overlap'
        },
        meta: {
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          version: '1.0.0'
        }
      };

      await this.saveUserConfig(userId, migratedConfig);
      console.log('✅ GÜVENLİ: LocalStorage\'dan Firebase\'e migration tamamlandı');
      console.log('� Not: Migration sonrası localStorage otomatik temizlenecek');
      
      return migratedConfig;
    } catch (error) {
      console.error('❌ Güvenli migration hatası:', error);
      throw error;
    }
  }

  // Mevcut config'i app-config.js değerleriyle tamamla
  async enhanceExistingConfig(userId: string): Promise<UserConfig | null> {
    try {
      const existingConfig = await this.getUserConfig(userId);
      if (!existingConfig) return null;

      const appConfig = (window as any).__APP_CONFIG__;
      let needsUpdate = false;
      
      const enhanced: UserConfig = { ...existingConfig };

      // Firebase config eksikse ekle
      if (!enhanced.firebase?.apiKey && appConfig?.FIREBASE_API_KEY) {
        enhanced.firebase = {
          apiKey: appConfig.FIREBASE_API_KEY,
          authDomain: appConfig.FIREBASE_AUTH_DOMAIN || '',
          projectId: appConfig.FIREBASE_PROJECT_ID || '',
          appId: appConfig.FIREBASE_APP_ID || '',
          measurementId: appConfig.FIREBASE_MEASUREMENT_ID || ''
        };
        needsUpdate = true;
        console.log('📋 Firebase config mevcut kullanıcıya eklendi');
      }

      // Google Sheets config eksikse ekle
      if (!enhanced.googleSheets?.clientId && appConfig?.GOOGLE_SHEETS_CLIENT_ID) {
        enhanced.googleSheets = {
          clientId: appConfig.GOOGLE_SHEETS_CLIENT_ID,
          projectId: appConfig.GOOGLE_SHEETS_PROJECT_ID || '',
          spreadsheetId: appConfig.GOOGLE_SHEETS_SPREADSHEET_ID || ''
        };
        needsUpdate = true;
        console.log('📊 Google Sheets config mevcut kullanıcıya eklendi');
      }

      // Server config eksikse ekle
      if (!enhanced.server?.apiBaseUrl && appConfig?.API_BASE_URL) {
        enhanced.server = {
          apiBaseUrl: appConfig.API_BASE_URL
        };
        needsUpdate = true;
        console.log('🖥️ Server config mevcut kullanıcıya eklendi');
      }

      if (needsUpdate) {
        await this.saveUserConfig(userId, enhanced);
        console.log('✅ Mevcut config app-config.js değerleri ile tamamlandı');
      }

      return enhanced;
    } catch (error) {
      console.error('❌ Config enhancement hatası:', error);
      return null;
    }
  }
}

// Singleton instance
export const firebaseConfigService = new FirebaseConfigService();
export default firebaseConfigService;
