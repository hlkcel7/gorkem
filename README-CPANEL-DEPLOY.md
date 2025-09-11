# Görkem İnşaat Proje Takip Sistemi

Bu proje cPanel static hosting için optimize edilmiş bir React + Firebase + Google Sheets uygulamasıdır.

## 🚀 cPanel Deploy Talimatları

### 1. Zip Dosyasını İndir ve Aç
- `dist.zip` dosyasını bilgisayarınıza indirin
- ZIP dosyasını açın

### 2. cPanel File Manager'a Upload
- cPanel → File Manager'a gidin
- `public_html` klasörüne gidin
- `dist/public/` klasörünün **içindeki tüm dosyaları** public_html'e yükleyin:
  - `app-config.js`
  - `assets/` klasörü
  - `index.html`

⚠️ **Önemli**: Sadece `dist/public/` içindekileri yükleyin. `dist/index.js` ve `dist/credentials/` klasörünü public_html'e koymayın!

### 3. Google Spreadsheet ID'sini Ayarla
- Google Sheets'te kullanmak istediğiniz spreadsheet'i açın
- URL'den Spreadsheet ID'sini kopyalayın:
  ```
  https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit
  ```
- cPanel File Manager'da `public_html/app-config.js` dosyasını düzenleyin
- `YOUR_SPREADSHEET_ID_HERE` yazan yeri gerçek ID ile değiştirin:
  ```javascript
  GOOGLE_SPREADSHEET_ID: "1abc123def456ghi789jkl"
  ```

### 4. Google Sheets İzinlerini Ayarla
- Google Sheets'te spreadsheet'i açın
- Sağ üst köşedeki "Share" butonuna tıklayın
- Bu e-postayı ekleyin: `gorkaminsaat@gorkeminsaat.iam.gserviceaccount.com`
- İzin seviyesi: "Editor" seçin
- "Send" butonuna tıklayın

### 5. Firebase Authentication Ayarla
- Firebase Console'da projenize gidin
- Authentication → Sign-in method
- Email/Password'ü etkinleştirin
- Authentication → Users'da test kullanıcısı oluşturun

## 🔧 Yapılandırma Detayları

### Firebase Yapılandırması
```javascript
// app-config.js içinde otomatik ayarlanmış
VITE_FIREBASE_API_KEY: "[GERÇEK_API_KEY_BURAYA]"
VITE_FIREBASE_AUTH_DOMAIN: "gorkemapp.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID: "gorkemapp"
```

### Google API Yapılandırması
```javascript
// app-config.js içinde otomatik ayarlanmış
GOOGLE_CLIENT_ID: "[GERÇEK_CLIENT_ID_BURAYA]"
```

## 📝 Kullanım

1. **Giriş**: http://gorkemprojetakip.com.tr adresine gidin
2. **Login**: Firebase email/password ile giriş yapın
3. **Google Sheets Bağlantısı**: İlk girişte Google hesabınızla yetkilendirme yapılacak
4. **Veri Yönetimi**: Tüm veriler Google Sheets'te saklanır

## 🔍 Sorun Giderme

### "Firebase auth yapılandırılmamış" Hatası
- `app-config.js` dosyasının yüklendiğinden emin olun
- Browser Developer Tools → Console'da hata mesajlarını kontrol edin

### "Google Sheets erişim hatası"
- Spreadsheet ID'sinin doğru olduğunu kontrol edin
- Service account'un spreadsheet'e Editor yetkisi olduğunu kontrol edin
- Google hesabınızla yetkilendirme yapmayı deneyin

### "Veri yüklenmiyor" Sorunu
- Internet bağlantınızı kontrol edin
- Browser cache'ini temizleyin
- Developer Tools → Network tabında API çağrılarını kontrol edin

## 🏗️ Mimari

- **Frontend**: React + Vite (Static hosting)
- **Authentication**: Firebase Auth (Client-side)
- **Database**: Google Sheets API (Client-side OAuth2)
- **Hosting**: cPanel Static File Hosting

## 📁 Dizin Yapısı

```
public_html/           # cPanel web root
├── app-config.js     # Runtime configuration
├── index.html        # Ana HTML dosyası
└── assets/           # CSS/JS bundles
    ├── index-xxx.css
    └── index-xxx.js
```

## 🔐 Güvenlik

- Firebase client config public'tir (güvenli)
- Google OAuth2 client ID public'tir (güvenli)  
- Service account private key sunucu tarafında (kullanılmıyor)
- Tüm API çağrıları user authentication ile güvence altında

## 📱 Responsive Design

Uygulama mobil ve desktop cihazlarda çalışacak şekilde tasarlanmıştır.

---

**İletişim**: Sorunlar için development ekibiyle iletişime geçin.
