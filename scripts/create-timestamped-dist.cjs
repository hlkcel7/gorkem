#!/usr/bin/env node

/**
 * Timestamped Distribution Package Creator
 * Bu script production build'i yapar ve zaman damgası ile zip dosyası oluşturur
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const archiver = require('archiver');

// Konfigürasyon
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

/**
 * Zaman damgası oluştur (YYYYMMDD_HHMMSS formatında)
 */
function createTimestamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  
  return `${year}${month}${day}_${hours}${minutes}${seconds}`;
}

/**
 * Build işlemini gerçekleştir
 */
async function runBuild() {
  try {
    console.log('🔨 Production build başlatılıyor...');
    console.log(`📋 Komut: ${CONFIG.buildCommand}`);
    
    execSync(CONFIG.buildCommand, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    console.log('✅ Build başarıyla tamamlandı');
    return true;
  } catch (error) {
    console.error('❌ Build hatası:', error.message);
    return false;
  }
}

/**
 * Dosya boyutunu human-readable formata çevir
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Zip dosyası oluştur
 */
async function createZipArchive(distPath, outputPath) {
  return new Promise((resolve, reject) => {
    // Output dizinini oluştur
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    });

    let totalFiles = 0;
    let totalSize = 0;

    output.on('close', () => {
      const finalSize = archive.pointer();
      console.log('✅ Zip dosyası oluşturuldu');
      console.log(`📦 Toplam dosya: ${totalFiles}`);
      console.log(`📏 Sıkıştırılmış boyut: ${formatFileSize(finalSize)}`);
      console.log(`📁 Orijinal boyut: ${formatFileSize(totalSize)}`);
      console.log(`🗜️ Sıkıştırma oranı: ${((1 - finalSize/totalSize) * 100).toFixed(1)}%`);
      resolve(outputPath);
    });

    archive.on('error', (err) => {
      console.error('❌ Zip oluşturma hatası:', err);
      reject(err);
    });

    archive.on('entry', (entryData) => {
      totalFiles++;
      totalSize += entryData.stats.size;
    });

    archive.pipe(output);

    // Dist klasörünü ekle
    if (fs.existsSync(distPath)) {
      console.log(`📁 ${distPath} klasörü zip'e ekleniyor...`);
      archive.directory(distPath, 'dist');
    }

    // Önemli root dosyaları ekle
    const rootFiles = [
      'package.json',
      'README.md',
      'DEPLOYMENT.md',
      '.gitignore'
    ];

    rootFiles.forEach(file => {
      const filePath = path.join(process.cwd(), file);
      if (fs.existsSync(filePath)) {
        console.log(`📄 ${file} ekleniyor...`);
        archive.file(filePath, { name: file });
      }
    });

    // Archive'ı sonlandır
    archive.finalize();
  });
}

/**
 * Ana işlem
 */
async function main() {
  try {
    console.log('🚀 Timestamped Distribution Creator başlatılıyor...\n');
    
    const timestamp = createTimestamp();
    const projectName = 'gorkem-dist';
    const zipFileName = `${projectName}_${timestamp}.zip`;
    const outputPath = path.join(CONFIG.outputDir, zipFileName);
    const distPath = path.join(process.cwd(), CONFIG.distDir);

    console.log('📋 Konfigürasyon:');
    console.log(`   Proje: ${projectName}`);
    console.log(`   Zaman damgası: ${timestamp}`);
    console.log(`   Çıktı dosyası: ${zipFileName}`);
    console.log(`   Dist klasörü: ${distPath}`);
    console.log(`   Çıktı yolu: ${outputPath}\n`);

    // 1. Build işlemi
    const buildSuccess = await runBuild();
    if (!buildSuccess) {
      console.error('❌ Build başarısız, işlem durduruluyor');
      process.exit(1);
    }

    // 2. Dist klasörünün var olduğunu kontrol et
    if (!fs.existsSync(distPath)) {
      console.error(`❌ Dist klasörü bulunamadı: ${distPath}`);
      process.exit(1);
    }

    console.log('\n📦 Zip arşivi oluşturuluyor...');

    // 3. Zip dosyası oluştur
    const finalPath = await createZipArchive(distPath, outputPath);

    console.log('\n🎉 İşlem başarıyla tamamlandı!');
    console.log(`📍 Dosya konumu: ${finalPath}`);
    console.log(`💾 İndirmek için: file://${path.resolve(finalPath)}`);

    // 4. Son özet
    console.log('\n📊 Özet:');
    const stats = fs.statSync(finalPath);
    console.log(`   Dosya boyutu: ${formatFileSize(stats.size)}`);
    console.log(`   Oluşturulma: ${stats.birthtime.toLocaleString('tr-TR')}`);
    
    return finalPath;

  } catch (error) {
    console.error('❌ Genel hata:', error.message);
    process.exit(1);
  }
}

/**
 * Script doğrudan çalıştırılıyorsa main fonksiyonunu çalıştır
 */
if (require.main === module) {
  main();
}

module.exports = {
  main,
  createTimestamp,
  createZipArchive,
  CONFIG
};
