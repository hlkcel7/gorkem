#!/usr/bin/env node

/**
 * Direct Dist Download Creator
 * Mevcut dist klasörünü doğrudan zip'ler, yeniden build yapmaz
 */

const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

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

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function createDistZip() {
  return new Promise((resolve, reject) => {
    const timestamp = createTimestamp();
    const zipName = `dist-download_${timestamp}.zip`;
    const distPath = './dist';
    
    console.log('📦 Dist Download Creator başlatılıyor...');
    console.log(`⏰ Zaman damgası: ${timestamp}`);
    console.log(`📁 Zip dosyası: ${zipName}`);

    // Dist klasörünün var olduğunu kontrol et
    if (!fs.existsSync(distPath)) {
      console.error('❌ Dist klasörü bulunamadı!');
      console.log('💡 Önce "npm run build" komutunu çalıştırın');
      process.exit(1);
    }

    const output = fs.createWriteStream(zipName);
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    });

    let totalFiles = 0;
    let totalSize = 0;

    output.on('close', () => {
      const finalSize = archive.pointer();
      console.log('✅ Zip dosyası oluşturuldu!');
      console.log(`📦 Toplam dosya: ${totalFiles}`);
      console.log(`📏 Sıkıştırılmış boyut: ${formatFileSize(finalSize)}`);
      console.log(`📁 Orijinal boyut: ${formatFileSize(totalSize)}`);
      console.log(`🗜️ Sıkıştırma oranı: ${((1 - finalSize/totalSize) * 100).toFixed(1)}%`);
      console.log(`💾 Dosya konumu: ${path.resolve(zipName)}`);
      resolve(zipName);
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

    console.log('🔄 Dist klasörü zip\'e ekleniyor...');
    archive.directory(distPath, 'dist');

    // Deployment için gerekli dosyalar
    const deploymentFiles = [
      'package.json',
      'README.md'
    ];

    deploymentFiles.forEach(file => {
      if (fs.existsSync(file)) {
        console.log(`📄 ${file} ekleniyor...`);
        archive.file(file, { name: file });
      }
    });

    archive.finalize();
  });
}

// Ana işlem
async function main() {
  try {
    const zipFile = await createDistZip();
    console.log('\n🎉 İşlem tamamlandı!');
    console.log(`📋 İndirme hazır: ${zipFile}`);
    
    // Dosya bilgileri
    const stats = fs.statSync(zipFile);
    console.log(`📊 Dosya boyutu: ${formatFileSize(stats.size)}`);
    console.log(`⏰ Oluşturulma: ${stats.birthtime.toLocaleString('tr-TR')}`);
    
  } catch (error) {
    console.error('❌ Hata:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { createDistZip };
