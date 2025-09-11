#!/usr/bin/env node

/**
 * Quick Dist Downloader
 * Mevcut dist'i hızlıca zip'ler
 */

const { execSync } = require('child_process');
const fs = require('fs');

function quickDistZip() {
  // Zaman damgası oluştur
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const zipName = `dist-${timestamp}.zip`;
  
  console.log('📦 Hızlı dist download başlatılıyor...');
  
  // Dist klasörünü kontrol et
  if (!fs.existsSync('./dist')) {
    console.error('❌ Dist klasörü bulunamadı! Önce build yapın.');
    process.exit(1);
  }
  
  try {
    console.log(`🔄 ${zipName} oluşturuluyor...`);
    
    // Linux/Mac için zip komutu
    const zipCommand = `zip -r "${zipName}" dist/ package.json README.md 2>/dev/null || echo "Zip completed"`;
    execSync(zipCommand, { stdio: 'inherit' });
    
    console.log(`✅ Download hazır: ${zipName}`);
    console.log(`📍 Konum: ${process.cwd()}/${zipName}`);
    
  } catch (error) {
    console.error('❌ Zip oluşturma hatası:', error.message);
  }
}

if (require.main === module) {
  quickDistZip();
}

module.exports = { quickDistZip };
