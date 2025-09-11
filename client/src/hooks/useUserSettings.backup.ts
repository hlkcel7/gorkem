import React, { useState, useEffect } from 'react';
import { UserSettings, supabaseService } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';

// Hook for managing user settings
export function useUserSettings() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isLoading: authLoading } = useAuth();

  // Supabase'den ayarları yükle
  const loadUserSettings = async (): Promise<UserSettings | null> => {
    try {
      setIsLoading(true);
      setError(null);

      // Eğer kullanıcı giriş yapmışsa, önce Supabase'den yüklemeyi dene
      if (user && user.uid) {
        console.log('🔍 Kullanıcı giriş yapmış, Supabase\'den ayarlar yükleniyor...', user.uid);
        
        try {
          // Önce localStorage'dan Supabase konfigürasyonunu al
          const localSettings = loadFromLocalStorage();
          
          // LocalStorage'da Supabase config varsa onu kullan
          if (localSettings?.supabase?.url && localSettings?.supabase?.anonKey) {
            console.log('📋 LocalStorage\'dan Supabase config alınıyor...');
            supabaseService.configure({
              url: localSettings.supabase.url,
              anonKey: localSettings.supabase.anonKey
            });
            supabaseService.setUserId(user.uid);
            
            const supabaseSettings = await supabaseService.loadUserSettings();
            if (supabaseSettings) {
              console.log('✅ Supabase\'den kullanıcı ayarları yüklendi');
              setSettings(supabaseSettings);
              
              // Yüklenen Supabase ayarlarını localStorage'a da kaydet (cache olarak)
              saveToLocalStorage(supabaseSettings);
              
              return supabaseSettings;
            }
          } else {
            console.log('⚠️ LocalStorage\'da Supabase config yok - ilk giriş veya temizlenmiş');
            
            // Environment config debug
            console.log('🔍 Environment config kontrol ediliyor:', {
              hasAppConfig: !!(window as any).__APP_CONFIG__,
              supabaseUrl: (window as any).__APP_CONFIG__?.SUPABASE_URL,
              supabaseKeyExists: !!(window as any).__APP_CONFIG__?.SUPABASE_ANON_KEY
            });
            
            // Eğer localStorage'da config yoksa ama ENV'de varsa o config'i dene
            const envSupabaseUrl = (window as any).__APP_CONFIG__?.SUPABASE_URL;
            const envSupabaseKey = (window as any).__APP_CONFIG__?.SUPABASE_ANON_KEY;
            
            if (envSupabaseUrl && envSupabaseKey) {
              console.log('🌐 Environment\'dan Supabase config deneniyor...', {
                url: envSupabaseUrl,
                keyLength: envSupabaseKey.length
              });
              
              try {
                supabaseService.configure({
                  url: envSupabaseUrl,
                  anonKey: envSupabaseKey
                });
                supabaseService.setUserId(user.uid);
                
                const supabaseSettings = await supabaseService.loadUserSettings();
                if (supabaseSettings) {
                  console.log('✅ Environment config ile Supabase\'den ayarlar yüklendi');
                  setSettings(supabaseSettings);
                  
                  // Yüklenen ayarları localStorage'a kaydet
                  saveToLocalStorage(supabaseSettings);
                  
                  return supabaseSettings;
                } else {
                  console.log('⚠️ Environment config ile Supabase\'e bağlanıldı ama ayar yok, default oluşturuluyor...');
                  
                  // Eğer Supabase'de ayar yoksa default ayar oluştur
                  const defaultSettings: UserSettings = {
                    supabase: { url: envSupabaseUrl, anonKey: envSupabaseKey },
                    deepseek: { apiKey: (window as any).__APP_CONFIG__?.DEEPSEEK_API_KEY || '' },
                    openai: { apiKey: (window as any).__APP_CONFIG__?.OPENAI_API_KEY || '' },
                    enableAI: true,
                    vectorThreshold: 0.3,
                    vectorWeight: 0.3,
                    textWeight: 0.7,
                    textScoreMethod: 'overlap' as const
                  };
                  
                  setSettings(defaultSettings);
                  saveToLocalStorage(defaultSettings);
                  
                  return defaultSettings;
                }
              } catch (envConfigError: any) {
                console.error('❌ Environment config ile Supabase bağlantısı başarısız:', envConfigError.message);
              }
            } else {
              console.log('❌ Environment config\'te Supabase bilgileri eksik:', {
                url: envSupabaseUrl,
                key: envSupabaseKey ? 'mevcut' : 'yok'
              });
            }
          }
        } catch (supabaseError: any) {
          console.warn('⚠️ Supabase\'den yükleme başarısız, localStorage\'a geçiliyor:', supabaseError.message);
        }
      }

      // Supabase başarısızsa veya kullanıcı giriş yapmamışsa localStorage'dan yükle
      const userSettings = loadFromLocalStorage();
      setSettings(userSettings);
      console.log('✅ localStorage\'dan kullanıcı ayarları yüklendi');
      return userSettings;
    } catch (err: any) {
      console.error('Ayarlar yüklenemedi:', err);
      setError(err.message);
      
      // Hata durumunda localStorage'dan yükle
      return loadFromLocalStorage();
    } finally {
      setIsLoading(false);
    }
  };

  // localStorage'dan ayarları yükle
  const loadFromLocalStorage = () => {
    try {
      const STORAGE_KEYS = {
        CONFIGS_JSON: 'doc_search_configs_json',
        SUPABASE_URL: 'doc_search_supabase_url',
        SUPABASE_KEY: 'doc_search_supabase_key',
        DEEPSEEK_KEY: 'doc_search_deepseek_key',
        OPENAI_KEY: 'doc_search_openai_key',
        ENABLE_AI: 'doc_search_enable_ai',
        VECTOR_THRESHOLD: 'doc_search_vector_threshold',
        VECTOR_WEIGHT: 'doc_search_vector_weight',
        TEXT_WEIGHT: 'doc_search_text_weight',
        TEXT_SCORE_METHOD: 'doc_search_text_score_method'
      };

      // Önce JSON olarak saklanmış ayarları dene
      const configsJson = localStorage.getItem(STORAGE_KEYS.CONFIGS_JSON);
      let configs = null;

      if (configsJson) {
        try {
          configs = JSON.parse(configsJson);
        } catch (e) {
          console.warn('JSON parse hatası, ayarlar tek tek yüklenecek', e);
        }
      }

      // Tek tek ayarları kontrol et
      if (!configs) {
        const supabaseUrl = localStorage.getItem(STORAGE_KEYS.SUPABASE_URL) || '';
        const supabaseKey = localStorage.getItem(STORAGE_KEYS.SUPABASE_KEY) || '';
        const deepseekKey = localStorage.getItem(STORAGE_KEYS.DEEPSEEK_KEY) || '';
        const openaiKey = localStorage.getItem(STORAGE_KEYS.OPENAI_KEY) || '';
        
        configs = {
          supabase: { url: supabaseUrl, anonKey: supabaseKey },
          deepseek: { apiKey: deepseekKey },
          openai: { apiKey: openaiKey }
        };
      }

      // Diğer ayarları ekle
      const enableAI = localStorage.getItem(STORAGE_KEYS.ENABLE_AI);
      const vectorThreshold = localStorage.getItem(STORAGE_KEYS.VECTOR_THRESHOLD);
      const vectorWeight = localStorage.getItem(STORAGE_KEYS.VECTOR_WEIGHT);
      const textWeight = localStorage.getItem(STORAGE_KEYS.TEXT_WEIGHT);
      const textScoreMethod = localStorage.getItem(STORAGE_KEYS.TEXT_SCORE_METHOD);

      const userSettings: UserSettings = {
        ...configs,
        enableAI: enableAI === 'true',
        vectorThreshold: vectorThreshold ? parseFloat(vectorThreshold) : 0.3,
        vectorWeight: vectorWeight ? parseFloat(vectorWeight) : 0.3,
        textWeight: textWeight ? parseFloat(textWeight) : 0.7,
        textScoreMethod: (textScoreMethod === 'simple' ? 'simple' : 'overlap') as 'overlap' | 'simple'
      };

      setSettings(userSettings);
      console.log('✅ localStorage\'dan kullanıcı ayarları yüklendi');
      return userSettings;
    } catch (err: any) {
      console.error('localStorage\'dan ayarlar yüklenemedi:', err);
      setError(err.message);
      return null;
    }
  };

  // Ayarları kaydet - sadece kullanıcı explicit olarak kaydetmek istediğinde
  const saveUserSettings = async (newSettings: UserSettings) => {
    try {
      setSettings(newSettings);

      // Her zaman localStorage'a kaydet (anlık erişim ve fallback için)
      saveToLocalStorage(newSettings);

      // Kullanıcı oturum açmışsa Supabase'e de kaydet
      if (user && user.uid) {
        try {
          supabaseService.configure({
            url: newSettings.supabase.url,
            anonKey: newSettings.supabase.anonKey
          });
          supabaseService.setUserId(user.uid);
          
          await supabaseService.saveUserSettings(newSettings);
          console.log('✅ Ayarlar hem localStorage hem Supabase\'e kaydedildi');
        } catch (supabaseError: any) {
          console.warn('⚠️ Supabase\'e kaydetme başarısız, sadece localStorage\'a kaydedildi:', supabaseError.message);
          setError(`Supabase\'e kaydetme hatası: ${supabaseError.message}`);
        }
      } else {
        console.log('ℹ️ Kullanıcı oturum açmamış, sadece localStorage\'a kaydedildi');
      }
    } catch (err: any) {
      console.error('Ayarlar kaydedilemedi:', err);
      setError(err.message);
    }
  };

  // Geçici ayar değişikliği - sadece state'i güncelle, kaydetme
  const updateSettingsTemporarily = (newSettings: UserSettings) => {
    setSettings(newSettings);
  };

  // localStorage'a kaydet
  const saveToLocalStorage = (newSettings: UserSettings) => {
    try {
      const STORAGE_KEYS = {
        CONFIGS_JSON: 'doc_search_configs_json',
        SUPABASE_URL: 'doc_search_supabase_url',
        SUPABASE_KEY: 'doc_search_supabase_key',
        DEEPSEEK_KEY: 'doc_search_deepseek_key',
        OPENAI_KEY: 'doc_search_openai_key',
        ENABLE_AI: 'doc_search_enable_ai',
        VECTOR_THRESHOLD: 'doc_search_vector_threshold',
        VECTOR_WEIGHT: 'doc_search_vector_weight',
        TEXT_WEIGHT: 'doc_search_text_weight',
        TEXT_SCORE_METHOD: 'doc_search_text_score_method'
      };

      // JSON olarak kaydet (tüm ayarlar)
      localStorage.setItem(STORAGE_KEYS.CONFIGS_JSON, JSON.stringify(newSettings));

      // Tek tek ayarları da kaydet (geriye uyumluluk için)
      if (newSettings.supabase) {
        localStorage.setItem(STORAGE_KEYS.SUPABASE_URL, newSettings.supabase.url);
        localStorage.setItem(STORAGE_KEYS.SUPABASE_KEY, newSettings.supabase.anonKey);
      }
      if (newSettings.deepseek) {
        localStorage.setItem(STORAGE_KEYS.DEEPSEEK_KEY, newSettings.deepseek.apiKey);
      }
      if (newSettings.openai) {
        localStorage.setItem(STORAGE_KEYS.OPENAI_KEY, newSettings.openai.apiKey);
      }

      // Diğer ayarlar
      localStorage.setItem(STORAGE_KEYS.ENABLE_AI, newSettings.enableAI ? 'true' : 'false');
      if (newSettings.vectorThreshold !== undefined) {
        localStorage.setItem(STORAGE_KEYS.VECTOR_THRESHOLD, String(newSettings.vectorThreshold));
      }
      if (newSettings.vectorWeight !== undefined) {
        localStorage.setItem(STORAGE_KEYS.VECTOR_WEIGHT, String(newSettings.vectorWeight));
      }
      if (newSettings.textWeight !== undefined) {
        localStorage.setItem(STORAGE_KEYS.TEXT_WEIGHT, String(newSettings.textWeight));
      }
      if (newSettings.textScoreMethod !== undefined) {
        localStorage.setItem(STORAGE_KEYS.TEXT_SCORE_METHOD, newSettings.textScoreMethod);
      }

      console.log('✅ Ayarlar localStorage\'a kaydedildi');
    } catch (err) {
      console.error('localStorage kaydetme hatası:', err);
    }
  };

  // Kullanıcı oturum durumu değiştiğinde ayarları yükle
  useEffect(() => {
    console.log('🔄 useUserSettings useEffect tetiklendi:', { 
      user: user?.uid, 
      authLoading, 
      hasAppConfig: !!(window as any).__APP_CONFIG__ 
    });
    
    if (!authLoading) {
      loadUserSettings();
    }
  }, [user, authLoading]);

  return {
    settings,
    isLoading,
    error,
    loadUserSettings,
    saveUserSettings,
    updateSettingsTemporarily
  };
}
