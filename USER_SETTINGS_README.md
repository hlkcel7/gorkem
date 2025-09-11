# Kullanıcı Ayarları Sistemi

Bu sistem kullanıcıların konfigürasyon ayarlarını merkezi olarak saklamak ve yönetmek için geliştirilmiştir.

## 📋 Özellikler

- **Kullanıcı Tabanlı Ayarlar**: Her kullanıcı kendi ayarlarına sahip olur
- **Çoklu Depolama**: Supabase (bulut) + localStorage (yerel) hybrid yaklaşımı  
- **Otomatik Senkronizasyon**: Kullanıcı giriş yaptığında ayarlar otomatik yüklenir
- **Offline Desteği**: Kullanıcı oturum açmamışsa localStorage kullanılır
- **Güvenli**: Row Level Security (RLS) ile korunmuş
- **Geriye Uyumlu**: Mevcut localStorage ayarlarını korur

## 🗄️ Veri Yapısı

### UserSettings Interface
```typescript
interface UserSettings {
  supabase: { url: string; anonKey: string };
  deepseek: { apiKey: string };
  openai: { apiKey: string };
  vectorThreshold?: number;
  vectorWeight?: number;
  textWeight?: number;
  textScoreMethod?: 'overlap' | 'simple';
  enableAI?: boolean;
}
```

## 🚀 Kurulum

### 1. Supabase Tablosu Oluşturma

`/workspaces/gorkem/db/user_settings_migration.sql` dosyasını Supabase SQL Editor'de çalıştırın:

```sql
-- Kullanıcı Ayarları Tablosu
CREATE TABLE IF NOT EXISTS user_settings (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id)
);

-- Row Level Security
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
-- ... (diğer SQL komutları)
```

### 2. Frontend Entegrasyonu

```typescript
import { useUserSettings } from '../hooks/useUserSettings';

function MyComponent() {
  const { settings, saveUserSettings, isLoading } = useUserSettings();
  
  // Ayarları kullan
  const handleSave = async () => {
    await saveUserSettings({
      supabase: { url: '...', anonKey: '...' },
      // ... diğer ayarlar
    });
  };
}
```

## 💡 Çalışma Prensibi

### Kullanıcı Oturum Açmış
1. Kullanıcı giriş yapar → `useAuth` hook tetiklenir
2. `useUserSettings` Supabase'den ayarları çeker
3. Ayarlar UI state'ine yüklenir
4. Değişiklikler hem Supabase'e hem localStorage'a kaydedilir

### Kullanıcı Oturum Açmamış  
1. Sadece localStorage kullanılır
2. Kullanıcı giriş yaptığında localStorage verileri Supabase'e migrate edilir

### Senkronizasyon
- Ayarlar değiştiğinde → hem bulut hem yerel güncellenir
- Sayfa yenilendiğinde → önce bulut, sonra yerel kontrol edilir
- Çakışma durumunda → bulut ayarları önceliklidir

## 🔧 API Fonksiyonları

### Supabase Stored Procedures

#### `get_or_create_user_settings(p_user_id TEXT)`
- Kullanıcının ayarlarını getirir
- Ayarlar yoksa boş bir kayıt oluşturur
- Güvenlik: Sadece kendi ayarlarına erişim

#### `update_user_settings(p_user_id TEXT, p_settings JSONB)`  
- Kullanıcının ayarlarını günceller (upsert)
- Güvenlik: Sadece kendi ayarlarını güncelleyebilir

### Frontend Hooks

#### `useUserSettings()`
```typescript
const {
  settings,           // Mevcut ayarlar
  isLoading,         // Yükleme durumu
  error,             // Hata mesajı
  saveUserSettings,  // Ayarları kaydet
  loadUserSettings   // Ayarları yeniden yükle
} = useUserSettings();
```

## 🧪 Test

Test script'ini çalıştırın:
```bash
node test-user-settings.js
```

Test şunları kontrol eder:
- Ayarların kaydedilmesi
- Ayarların yüklenmesi  
- Kullanıcı izolasyonu
- Veri tutarlılığı

## 🔒 Güvenlik

- **Row Level Security**: Kullanıcılar sadece kendi verilerine erişebilir
- **API Key Koruma**: Kritik bilgiler JSONB içinde şifrelenmemiş saklanır (dikkat!)
- **Firebase Auth**: Kullanıcı kimlik doğrulaması Firebase ile yapılır

## 📱 UI Güncellemeleri

### Settings Modal
- Kullanıcı durumu gösterilir (giriş yapılmış/yerel mod)
- Kaydet butonu duruma göre değişir ("Kaydet ve Senkronize Et" / "Kaydet (Yerel)")
- Temizleme işlemi hem bulut hem yerel verileri temizler

### Header
- Kullanıcı email adresi ve senkronizasyon durumu gösterilir
- Yerel mod uyarısı

## 🔄 Migration

Mevcut localStorage ayarları otomatik olarak yeni sisteme geçirilir:
1. İlk giriş yapıldığında localStorage kontrol edilir
2. Varsa veriler Supabase'e aktarılır  
3. Sonraki girişlerde Supabase öncelikli olur

## 📚 Dosya Yapısı

```
/client/src/
├── hooks/
│   └── useUserSettings.ts     # Ana hook
├── services/  
│   └── supabase.ts           # DB işlemleri
└── pages/
    └── document-search.tsx   # UI entegrasyonu

/db/
└── user_settings_migration.sql  # Veritabanı şeması

/test-user-settings.js           # Test script'i
```

## 🐛 Sorun Giderme

### Ayarlar yüklenmiyor
1. Supabase bağlantısını kontrol edin
2. RLS politikalarının doğru yapılandırıldığından emin olun
3. Kullanıcının giriş yaptığından emin olun

### Senkronizasyon çalışmıyor  
1. Firebase Auth'ın çalıştığından emin olun
2. Supabase stored procedure'larının mevcut olduğunu kontrol edin
3. Browser console'da hata mesajlarını kontrol edin

### Permission hatası
1. RLS politikalarını yeniden kontrol edin
2. Kullanıcının `auth.uid()` değerinin doğru olduğunu doğrulayın
