#!/usr/bin/env node

/**
 * Quick Dist Zip Creator
 * Basit zaman damgalı zip oluşturucu
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function createTimestamp() {
  const now = new Date();
  return now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
}

function createQuickZip() {
  try {
    const timestamp = createTimestamp();
    const zipName = `gorkem-dist-${timestamp}.zip`;
    
    console.log('🔨 Build yapılıyor...');
    execSync('npm run build', { stdio: 'inherit' });
    
    console.log('📦 Zip oluşturuluyor...');
    
    // Basit zip komutu (Linux/Mac için)
    const zipCommand = `zip -r "${zipName}" dist/ package.json README.md -x "*.log" "*.tmp"`;
    
    try {
      execSync(zipCommand, { stdio: 'inherit' });
      console.log(`✅ Zip oluşturuldu: ${zipName}`);
    } catch (zipError) {
      // Windows için alternatif
      console.log('⚠️ Zip komutu bulunamadı, manuel zip oluşturuluyor...');
      
      // Node.js native zip oluştur
      const archiver = require('archiver');
      const output = fs.createWriteStream(zipName);
      const archive = archiver('zip', { zlib: { level: 9 } });
      
      output.on('close', () => {
        console.log(`✅ Zip oluşturuldu: ${zipName} (${archive.pointer()} bytes)`);
      });
      
      archive.pipe(output);
      archive.directory('dist/', 'dist/');
      archive.file('package.json', { name: 'package.json' });
      if (fs.existsSync('README.md')) {
        archive.file('README.md', { name: 'README.md' });
      }
      archive.finalize();
    }
    
  } catch (error) {
    console.error('❌ Hata:', error.message);
  }
}

if (require.main === module) {
  createQuickZip();
}

module.exports = { createQuickZip };
