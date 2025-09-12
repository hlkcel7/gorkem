// Firebase & Google Sheets Configuration Management Component
import React, { useState, useEffect, useCallback } from 'react';
import { useUserSettings } from '../hooks/useUserSettings';
import { UserConfig } from '../services/firebaseConfig';

export default function ConfigManagement() {
  const { config, isLoading, error, updateConfig, hasValidFirebase, hasValidGoogleSheets } = useUserSettings();
  const [activeTab, setActiveTab] = useState<'firebase' | 'googleSheets' | 'server'>('firebase');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null);

  // Form state'leri
  const [firebaseConfig, setFirebaseConfig] = useState<UserConfig['firebase']>({
    apiKey: config?.firebase?.apiKey || '',
    authDomain: config?.firebase?.authDomain || '',
    projectId: config?.firebase?.projectId || '',
    appId: config?.firebase?.appId || '',
    measurementId: config?.firebase?.measurementId || ''
  });

  const [googleSheetsConfig, setGoogleSheetsConfig] = useState<UserConfig['googleSheets']>({
    clientId: config?.googleSheets?.clientId || '',
    projectId: config?.googleSheets?.projectId || '',
    spreadsheetId: config?.googleSheets?.spreadsheetId || ''
  });

  const [serverConfig, setServerConfig] = useState<UserConfig['server']>({
    apiBaseUrl: config?.server?.apiBaseUrl || 'http://gorkemprojetakip.com.tr'
  });

  // Helper to ensure config objects never contain undefined fields (match the strict state type)
  const normalizeFirebase = (partial?: Partial<UserConfig['firebase']>): UserConfig['firebase'] => ({
    apiKey: partial?.apiKey ?? '',
    authDomain: partial?.authDomain ?? '',
    projectId: partial?.projectId ?? '',
    appId: partial?.appId ?? '',
    measurementId: partial?.measurementId ?? ''
  });

  const normalizeGoogleSheets = (partial?: Partial<UserConfig['googleSheets']>): UserConfig['googleSheets'] => ({
    clientId: partial?.clientId ?? '',
    projectId: partial?.projectId ?? '',
    spreadsheetId: partial?.spreadsheetId ?? ''
  });

  const normalizeServer = (partial?: Partial<UserConfig['server']>): UserConfig['server'] => ({
    apiBaseUrl: partial?.apiBaseUrl ?? 'http://gorkemprojetakip.com.tr'
  });

  // Config güncellemelerini al
  useEffect(() => {
    if (config) {
      setFirebaseConfig(normalizeFirebase({
        apiKey: config.firebase?.apiKey,
        authDomain: config.firebase?.authDomain,
        projectId: config.firebase?.projectId,
        appId: config.firebase?.appId,
        measurementId: config.firebase?.measurementId
      }));
      
      setGoogleSheetsConfig(normalizeGoogleSheets({
        clientId: config.googleSheets?.clientId,
        projectId: config.googleSheets?.projectId,
        spreadsheetId: config.googleSheets?.spreadsheetId
      }));
      
      setServerConfig(normalizeServer({ apiBaseUrl: config.server?.apiBaseUrl }));
    }
  }, [config]);

  // Otomatik kaydetme fonksiyonu
  const autoSave = useCallback(async (configType: 'firebase' | 'googleSheets' | 'server') => {
    try {
      let updateData: Partial<UserConfig> = {};
      
      switch (configType) {
        case 'firebase':
          if (firebaseConfig?.apiKey || firebaseConfig?.authDomain || firebaseConfig?.projectId) {
            updateData.firebase = firebaseConfig;
          }
          break;
        case 'googleSheets':
          if (googleSheetsConfig?.clientId || googleSheetsConfig?.projectId || googleSheetsConfig?.spreadsheetId) {
            updateData.googleSheets = googleSheetsConfig;
          }
          break;
        case 'server':
          updateData.server = serverConfig;
          break;
      }
      
      if (Object.keys(updateData).length > 0) {
        await updateConfig(updateData);
        setSaveMessage(`✅ ${configType} otomatik kaydedildi`);
        setTimeout(() => setSaveMessage(''), 2000);
      }
    } catch (err: any) {
      console.error('Otomatik kaydetme hatası:', err);
    }
  }, [firebaseConfig, googleSheetsConfig, serverConfig, updateConfig]);

  // Debounced auto save - değişiklikten 2 saniye sonra kaydet
  const triggerAutoSave = useCallback((configType: 'firebase' | 'googleSheets' | 'server') => {
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
    }
    
    const timer = setTimeout(() => {
      autoSave(configType);
    }, 2000); // 2 saniye bekle
    
    setAutoSaveTimer(timer);
  }, [autoSave, autoSaveTimer]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
      }
    };
  }, [autoSaveTimer]);

  const handleSave = async (configType: 'firebase' | 'googleSheets' | 'server') => {
    setIsSaving(true);
    setSaveMessage('');
    
    try {
      let updateData: Partial<UserConfig> = {};
      
      switch (configType) {
        case 'firebase':
          updateData.firebase = firebaseConfig;
          break;
        case 'googleSheets':
          updateData.googleSheets = googleSheetsConfig;
          break;
        case 'server':
          updateData.server = serverConfig;
          break;
      }
      
      await updateConfig(updateData);
      setSaveMessage(`${configType} konfigürasyonu başarıyla kaydedildi!`);
      
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (err: any) {
      setSaveMessage(`Hata: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Konfigürasyonlar yükleniyor...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-red-800 font-medium">Konfigürasyon Hatası</h3>
        <p className="text-red-700 mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Veritabanı Ayarları - Otomatik Kaydet
          </h2>
          <p className="text-gray-600 mt-1">
            Firebase, Google Sheets ve Server ayarlarınız otomatik olarak kaydedilir
          </p>
        </div>

        {/* Status Cards */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`p-3 rounded-lg border ${hasValidFirebase ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${hasValidFirebase ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                <span className="font-medium">Firebase</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {hasValidFirebase ? 'Konfigüre edildi' : 'Konfigürasyona ihtiyaç var'}
              </p>
            </div>
            
            <div className={`p-3 rounded-lg border ${hasValidGoogleSheets ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${hasValidGoogleSheets ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                <span className="font-medium">Google Sheets</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {hasValidGoogleSheets ? 'Konfigüre edildi' : 'Konfigürasyona ihtiyaç var'}
              </p>
            </div>
            
            <div className="p-3 rounded-lg border bg-green-50 border-green-200">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="font-medium">Server</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Aktif: {serverConfig?.apiBaseUrl}
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 py-3 border-b border-gray-200">
          <nav className="flex space-x-4">
            {[
              { id: 'firebase', label: '🔥 Firebase', badge: hasValidFirebase },
              { id: 'googleSheets', label: '📊 Google Sheets', badge: hasValidGoogleSheets },
              { id: 'server', label: '🖥️ Server', badge: true }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <span className="flex items-center space-x-2">
                  <span>{tab.label}</span>
                  {tab.badge && <span className="w-2 h-2 bg-green-500 rounded-full"></span>}
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="px-6 py-6">
          {activeTab === 'firebase' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <div className="flex items-center">
                  <span className="text-blue-600 mr-2">🔄</span>
                  <span className="text-blue-800 font-medium">Otomatik Kaydetme Aktif</span>
                </div>
                <p className="text-blue-700 text-sm mt-1">
                  Değişiklikleriniz 2 saniye sonra otomatik olarak kaydedilir
                </p>
              </div>

              <h3 className="text-lg font-medium text-gray-900">Firebase Konfigürasyonu</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    API Key
                  </label>
                  <input
                    type="password"
                    value={firebaseConfig?.apiKey || ''}
                    onChange={(e) => {
                      setFirebaseConfig(normalizeFirebase({ ...firebaseConfig, apiKey: e.target.value }));
                      triggerAutoSave('firebase');
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="AIzaSy..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Auth Domain
                  </label>
                  <input
                    type="text"
                    value={firebaseConfig?.authDomain || ''}
                    onChange={(e) => {
                      setFirebaseConfig(normalizeFirebase({ ...firebaseConfig, authDomain: e.target.value }));
                      triggerAutoSave('firebase');
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="projectname.firebaseapp.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project ID
                  </label>
                  <input
                    type="text"
                    value={firebaseConfig?.projectId || ''}
                    onChange={(e) => {
                      setFirebaseConfig(normalizeFirebase({ ...firebaseConfig, projectId: e.target.value }));
                      triggerAutoSave('firebase');
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="my-firebase-project"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    App ID
                  </label>
                  <input
                    type="text"
                    value={firebaseConfig?.appId || ''}
                    onChange={(e) => {
                      setFirebaseConfig(normalizeFirebase({ ...firebaseConfig, appId: e.target.value }));
                      triggerAutoSave('firebase');
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="1:123456789:web:..."
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Measurement ID (İsteğe bağlı)
                  </label>
                  <input
                    type="text"
                    value={firebaseConfig?.measurementId || ''}
                    onChange={(e) => {
                      setFirebaseConfig(normalizeFirebase({ ...firebaseConfig, measurementId: e.target.value }));
                      triggerAutoSave('firebase');
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="G-XXXXXXXXXX"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'googleSheets' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <div className="flex items-center">
                  <span className="text-blue-600 mr-2">🔄</span>
                  <span className="text-blue-800 font-medium">Otomatik Kaydetme Aktif</span>
                </div>
                <p className="text-blue-700 text-sm mt-1">
                  Değişiklikleriniz 2 saniye sonra otomatik olarak kaydedilir
                </p>
              </div>

              <h3 className="text-lg font-medium text-gray-900">Google Sheets Konfigürasyonu</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Client ID
                  </label>
                  <input
                    type="text"
                    value={googleSheetsConfig?.clientId || ''}
                    onChange={(e) => {
                      setGoogleSheetsConfig(normalizeGoogleSheets({ ...googleSheetsConfig, clientId: e.target.value }));
                      triggerAutoSave('googleSheets');
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="123456789-xxx.apps.googleusercontent.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project ID
                  </label>
                  <input
                    type="text"
                    value={googleSheetsConfig?.projectId || ''}
                    onChange={(e) => {
                      setGoogleSheetsConfig(normalizeGoogleSheets({ ...googleSheetsConfig, projectId: e.target.value }));
                      triggerAutoSave('googleSheets');
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="my-google-project"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Spreadsheet ID
                  </label>
                  <input
                    type="text"
                    value={googleSheetsConfig?.spreadsheetId || ''}
                    onChange={(e) => {
                      setGoogleSheetsConfig(normalizeGoogleSheets({ ...googleSheetsConfig, spreadsheetId: e.target.value }));
                      triggerAutoSave('googleSheets');
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="1Y_nxzxZtJxCQNi9GlqNtRF0Qj5zr5cBKdp5lczJSF-g"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Google Sheets URL'sindeki ID
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'server' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <div className="flex items-center">
                  <span className="text-blue-600 mr-2">🔄</span>
                  <span className="text-blue-800 font-medium">Otomatik Kaydetme Aktif</span>
                </div>
              </div>

              <h3 className="text-lg font-medium text-gray-900">Server Konfigürasyonu</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  API Base URL
                </label>
                  <input
                  type="url"
                  value={serverConfig?.apiBaseUrl || ''}
                    onChange={(e) => {
                    setServerConfig(normalizeServer({ ...serverConfig, apiBaseUrl: e.target.value }));
                    triggerAutoSave('server');
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="http://gorkemprojetakip.com.tr"
                />
              </div>
            </div>
          )}

          {/* Save Message */}
          {saveMessage && (
            <div className={`mt-4 p-3 rounded-lg ${
              saveMessage.startsWith('Hata') 
                ? 'bg-red-50 text-red-700 border border-red-200' 
                : 'bg-green-50 text-green-700 border border-green-200'
            }`}>
              {saveMessage}
            </div>
          )}
        </div>
      </div>

      {/* Info Panel */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-blue-800 font-medium flex items-center">
          <span className="mr-2">💡</span>
          Otomatik Online Kalma Sistemi
        </h3>
        <p className="text-blue-700 mt-1">
          Ayarlarınız sürekli olarak kaydedilir ve kullanıcı logout olmadığı sürece sistem online kalır.
          Firebase ve Google Sheets bağlantıları otomatik olarak sürdürülür.
        </p>
      </div>

      {/* Security Info Panel */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="text-green-800 font-medium flex items-center">
          <span className="mr-2">🔒</span>
          Güvenlik ve Süreklilik
        </h3>
        <p className="text-green-700 mt-1">
          Tüm konfigürasyonlarınız güvenli bir şekilde Firebase Firestore'da şifrelenerek saklanır. 
          Sistem logout olmadığınız sürece sürekli online kalır ve verilerinize kesintisiz erişim sağlar.
        </p>
      </div>
    </div>
  );
}
