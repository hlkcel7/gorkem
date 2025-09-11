# Dist Zip Creator Scripts

Proje için zaman damgalı distribution zip dosyaları oluşturmak için script'ler.

## Kullanım

### 1. Detaylı Zip Creator
Kapsamlı build ve packaging işlemi:
```bash
npm run dist:zip
# veya
node scripts/create-timestamped-dist.js
```

**Özellikler:**
- Production build yapar
- Zaman damgası ile zip dosyası oluşturur (`gorkem-dist_YYYYMMDD_HHMMSS.zip`)
- Maksimum sıkıştırma kullanır
- Dosya boyutu ve sıkıştırma oranı raporlar
- `dist-releases/` klasörüne kaydeder

### 2. Hızlı Zip Creator
Basit ve hızlı zip oluşturma:
```bash
npm run dist:quick
# veya
node scripts/quick-dist-zip.js
```

**Özellikler:**
- Build + hızlı zip
- Root dizinde zip dosyası oluşturur
- Platform bağımsız (fallback mekanizması)

## Çıktı Dosyaları

### Zip İçeriği
- `dist/` - Production build dosyaları
- `package.json` - Proje metadata
- `README.md` - Proje dokümantasyonu (varsa)

### Dosya Adlandırma
- **Detaylı**: `gorkem-dist_20250911_143022.zip`
- **Hızlı**: `gorkem-dist-2025-09-11T14-30-22.zip`

## Konfigürasyon

`scripts/create-timestamped-dist.js` dosyasındaki `CONFIG` objesini düzenleyebilirsiniz:

```javascript
const CONFIG = {
  buildCommand: 'npm run build',
  distDir: 'dist',
  outputDir: './dist-releases',
  excludePatterns: [
    '*.log',
    '*.tmp',
    'node_modules',
    '.git',
    '.env*',
    'service-account.json'
  ]
};
```

## Notlar

- Zip dosyaları `.gitignore`'da exclude edilmiştir
- `dist-releases/` klasörü otomatik oluşturulur
- Hassas dosyalar (credentials, logs) otomatik exclude edilir
- Build hatası durumunda script durur

## Örnek Çıktı

```
🚀 Timestamped Distribution Creator başlatılıyor...

📋 Konfigürasyon:
   Proje: gorkem-dist
   Zaman damgası: 20250911_143022
   Çıktı dosyası: gorkem-dist_20250911_143022.zip
   Dist klasörü: /workspaces/gorkem/dist
   Çıktı yolu: ./dist-releases/gorkem-dist_20250911_143022.zip

🔨 Production build başlatılıyor...
✅ Build başarıyla tamamlandı

📦 Zip arşivi oluşturuluyor...
✅ Zip dosyası oluşturuldu
📦 Toplam dosya: 145
📏 Sıkıştırılmış boyut: 1.2 MB
📁 Orijinal boyut: 4.8 MB
🗜️ Sıkıştırma oranı: 75.0%

🎉 İşlem başarıyla tamamlandı!
📍 Dosya konumu: ./dist-releases/gorkem-dist_20250911_143022.zip
```
