// Firebase-first User Settings Hook
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import firebaseConfigService, { UserConfig } from '../services/firebaseConfig';

// Hook dönüş tipi
interface UseUserSettingsReturn {
  config: UserConfig | null;
  isLoading: boolean;
  error: string | null;
  // Actions
  updateConfig: (updates: Partial<Omit<UserConfig, 'meta'>>) => Promise<void>;
  saveConfig: (config: UserConfig) => Promise<void>;
  resetToDefaults: () => Promise<void>;
  // Status
  isConfigured: boolean;
  hasValidSupabase: boolean;
  hasValidApis: boolean;
}

export function useUserSettings(): UseUserSettingsReturn {
  const { user, isLoading: authLoading } = useAuth();
  const [config, setConfig] = useState<UserConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Config'i yükle
  const loadConfig = useCallback(async () => {
    if (!user?.uid) {
      console.log('👤 Kullanıcı giriş yapmamış, config yüklenmeyecek');
      setConfig(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔄 Firebase\'den user config yükleniyor...', user.uid);

      // Önce mevcut config'i kontrol et
      let userConfig = await firebaseConfigService.getUserConfig(user.uid);

      if (!userConfig) {
        console.log('⚡ İlk kullanım: Default config oluşturuluyor...');
        
        // LocalStorage'da eski ayarlar var mı kontrol et
        const hasLocalStorage = localStorage.getItem('doc_search_configs_json');
        
        if (hasLocalStorage) {
          console.log('📦 LocalStorage\'dan migration yapılıyor...');
          try {
            const localSettings = JSON.parse(hasLocalStorage);
            userConfig = await firebaseConfigService.migrateFromLocalStorage(user.uid, localSettings);
            
            // Migration başarılıysa localStorage'ı temizle
            localStorage.removeItem('doc_search_configs_json');
            console.log('🧹 LocalStorage migration tamamlandı, eski veriler temizlendi');
          } catch (migrationError) {
            console.warn('⚠️ Migration başarısız, default config oluşturuluyor:', migrationError);
            userConfig = await firebaseConfigService.createDefaultUserConfig(user.uid);
          }
        } else {
          // Tamamen yeni kullanıcı
          userConfig = await firebaseConfigService.createDefaultUserConfig(user.uid);
        }
      }

      setConfig(userConfig);
      console.log('✅ User config başarıyla yüklendi');
      
    } catch (err: any) {
      console.error('❌ Config yükleme hatası:', err);
      setError(err.message || 'Config yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  }, [user?.uid]);

  // Config güncelle (kısmi)
  const updateConfig = useCallback(async (updates: Partial<Omit<UserConfig, 'meta'>>) => {
    if (!user?.uid || !config) {
      throw new Error('Kullanıcı giriş yapmamış veya config yok');
    }

    try {
      console.log('🔄 Config güncelleniyor...', updates);
      
      await firebaseConfigService.updateUserConfig(user.uid, updates);
      
      // Local state'i de güncelle
      setConfig(prev => prev ? { ...prev, ...updates } : null);
      
      console.log('✅ Config güncellendi');
    } catch (err: any) {
      console.error('❌ Config güncelleme hatası:', err);
      setError(err.message || 'Config güncellenemedi');
      throw err;
    }
  }, [user?.uid, config]);

  // Tam config kaydet
  const saveConfig = useCallback(async (newConfig: UserConfig) => {
    if (!user?.uid) {
      throw new Error('Kullanıcı giriş yapmamış');
    }

    try {
      console.log('💾 Config kaydediliyor...');
      
      await firebaseConfigService.saveUserConfig(user.uid, newConfig);
      setConfig(newConfig);
      
      console.log('✅ Config kaydedildi');
    } catch (err: any) {
      console.error('❌ Config kaydetme hatası:', err);
      setError(err.message || 'Config kaydedilemedi');
      throw err;
    }
  }, [user?.uid]);

  // Default ayarlara sıfırla
  const resetToDefaults = useCallback(async () => {
    if (!user?.uid) {
      throw new Error('Kullanıcı giriş yapmamış');
    }

    try {
      console.log('🔄 Config default\'lara sıfırlanıyor...');
      
      const defaultConfig = await firebaseConfigService.createDefaultUserConfig(user.uid);
      setConfig(defaultConfig);
      
      console.log('✅ Config default\'lara sıfırlandı');
    } catch (err: any) {
      console.error('❌ Config sıfırlama hatası:', err);
      setError(err.message || 'Config sıfırlanamadı');
      throw err;
    }
  }, [user?.uid]);

  // Auth değişikliklerinde config'i yükle
  useEffect(() => {
    if (!authLoading) {
      loadConfig();
    }
  }, [authLoading, loadConfig]);

  // Real-time Firebase listener (opsiyonel - multi-device sync için)
  useEffect(() => {
    if (!user?.uid) return;

    console.log('👂 Firebase real-time listener başlatılıyor...');
    
    const unsubscribe = firebaseConfigService.onUserConfigChange(user.uid, (updatedConfig) => {
      if (updatedConfig) {
        console.log('🔄 Firebase\'den real-time config güncellemesi');
        setConfig(updatedConfig);
      }
    });

    return () => {
      console.log('👂 Firebase listener kapatılıyor');
      unsubscribe();
    };
  }, [user?.uid]);

  // Computed properties
  const isConfigured = Boolean(config);
  const hasValidSupabase = Boolean(config?.supabase.url && config?.supabase.anonKey);
  const hasValidApis = Boolean(config?.apis.openai && config?.apis.deepseek);

  return {
    config,
    isLoading,
    error,
    updateConfig,
    saveConfig,
    resetToDefaults,
    isConfigured,
    hasValidSupabase,
    hasValidApis
  };
}

// Convenience hook - sadece değerlere erişim için
export function useUserConfig() {
  const { config } = useUserSettings();
  return config;
}

// Backwards compatibility - eski UserSettings interface için adapter
export function useUserSettingsLegacy() {
  const { config, updateConfig, saveConfig, isLoading, error } = useUserSettings();
  
  // Eski format'a dönüştür
  const settings = config ? {
    supabase: config.supabase,
    deepseek: { apiKey: config.apis.deepseek },
    openai: { apiKey: config.apis.openai },
    enableAI: config.search.enableAI,
    vectorThreshold: config.search.vectorThreshold,
    vectorWeight: config.search.vectorWeight,
    textWeight: config.search.textWeight,
    textScoreMethod: config.search.textScoreMethod
  } : null;

  const saveUserSettings = async (newSettings: any) => {
    if (!config) return;
    
    const updatedConfig: UserConfig = {
      ...config,
      supabase: newSettings.supabase,
      apis: {
        openai: newSettings.openai?.apiKey || '',
        deepseek: newSettings.deepseek?.apiKey || ''
      },
      search: {
        enableAI: newSettings.enableAI ?? true,
        vectorThreshold: newSettings.vectorThreshold ?? 0.3,
        vectorWeight: newSettings.vectorWeight ?? 0.3,
        textWeight: newSettings.textWeight ?? 0.7,
        textScoreMethod: newSettings.textScoreMethod || 'overlap'
      }
    };
    
    await saveConfig(updatedConfig);
  };

  return {
    settings,
    isLoading,
    error,
    saveUserSettings
  };
}
