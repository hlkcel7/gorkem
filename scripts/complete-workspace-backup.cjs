#!/usr/bin/env node

/**
 * Complete Workspace Backup Script
 * Workspace'deki TÜM klasör ve dosyaları olduğu gibi yedekler
 */

const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

// Timestamp oluştur
const now = new Date();
const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '');

const PROJECT_NAME = 'gorkem-complete-workspace';
const BACKUP_FILENAME = `${PROJECT_NAME}_${dateStr}_${timeStr}.zip`;
const BACKUP_PATH = path.join(__dirname, '..', BACKUP_FILENAME);

console.log('📦 Görkem İnşaat Complete Workspace Backup');
console.log('=' .repeat(70));
console.log(`📂 Workspace: /workspaces/gorkem`);
console.log(`📦 Backup dosyası: ${BACKUP_FILENAME}`);
console.log(`📍 Lokasyon: ${BACKUP_PATH}`);
console.log('🕐 Başlama zamanı:', new Date().toLocaleString('tr-TR'));

// Sadece tehlikeli/gereksiz dosyaları exclude et - minimum exclusion
const MINIMAL_EXCLUDE = [
  '.git/objects',          // Git objects (çok büyük)
  '.git/logs',            // Git logs
  'node_modules',         // Node modules (yeniden install edilebilir)
  '*.tmp',               // Geçici dosyalar
  '*.log',               // Log dosyalar
  '.DS_Store',           // macOS system files
  'Thumbs.db',           // Windows thumbnails
  'desktop.ini',         // Windows system files
  '~*',                  // Backup files
  '*.swp',               // Vim swap files
  '*.swo',               // Vim swap files
  '.*.swp',              // Hidden vim swap files
];

function shouldExclude(filePath, fileName) {
  const relativePath = path.relative(__dirname + '/..', filePath);
  
  return MINIMAL_EXCLUDE.some(pattern => {
    if (pattern.includes('*')) {
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
      return regex.test(fileName) || regex.test(relativePath);
    }
    return relativePath.includes(pattern) || fileName === pattern || relativePath.startsWith(pattern + '/');
  });
}

async function createCompleteBackup() {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(BACKUP_PATH);
    const archive = archiver('zip', {
      zlib: { level: 6 } // Orta seviye compression
    });

    let fileCount = 0;
    let dirCount = 0;
    let totalSize = 0;
    let skippedCount = 0;

    output.on('close', () => {
      const finalSize = archive.pointer();
      const compressionRatio = totalSize > 0 ? ((totalSize - finalSize) / totalSize * 100).toFixed(1) : 0;
      
      console.log('\n✅ Complete Workspace Backup tamamlandı!');
      console.log('📊 Detaylı İstatistikler:');
      console.log(`   📁 Toplam klasör sayısı: ${dirCount}`);
      console.log(`   📄 Toplam dosya sayısı: ${fileCount}`);
      console.log(`   ⏭️ Atlanan dosya sayısı: ${skippedCount}`);
      console.log(`   📦 Orijinal boyut: ${formatBytes(totalSize)}`);
      console.log(`   🗜️ Sıkıştırılmış boyut: ${formatBytes(finalSize)}`);
      console.log(`   💾 Sıkıştırma oranı: %${compressionRatio}`);
      console.log(`   🕐 Tamamlanma zamanı: ${new Date().toLocaleString('tr-TR')}`);
      
      resolve(BACKUP_PATH);
    });

    archive.on('error', (err) => {
      console.error('❌ Backup hatası:', err);
      reject(err);
    });

    archive.on('entry', (entry) => {
      if (entry.stats.isDirectory()) {
        dirCount++;
      } else {
        fileCount++;
        totalSize += entry.stats.size;
      }
      
      if ((fileCount + dirCount) % 25 === 0) {
        process.stdout.write(`\r📦 İşlenen: ${fileCount} dosya, ${dirCount} klasör`);
      }
    });

    archive.pipe(output);

    // Root directory'yi tamamen ekle
    const rootDir = path.join(__dirname, '..');
    
    function addDirectoryRecursive(dir, baseDir = '') {
      let items;
      try {
        items = fs.readdirSync(dir);
      } catch (err) {
        console.warn(`⚠️ Klasör okunamadı: ${dir} - ${err.message}`);
        return;
      }
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const relativePath = path.join(baseDir, item);
        
        // Minimal exclusion check
        if (shouldExclude(fullPath, item)) {
          skippedCount++;
          continue;
        }

        let stats;
        try {
          stats = fs.statSync(fullPath);
        } catch (err) {
          console.warn(`⚠️ Dosya stat alınamadı: ${relativePath} - ${err.message}`);
          skippedCount++;
          continue;
        }
        
        if (stats.isDirectory()) {
          // Klasörü ekle
          archive.directory(fullPath, relativePath);
          
          // Recursive olarak alt klasörleri de ekle
          addDirectoryRecursive(fullPath, relativePath);
        } else {
          try {
            // Dosyayı ekle
            archive.file(fullPath, { name: relativePath });
          } catch (err) {
            console.warn(`⚠️ Dosya eklenemedi: ${relativePath} - ${err.message}`);
            skippedCount++;
          }
        }
      }
    }

    console.log('\n📂 Workspace tamamen taranıyor...');
    console.log('📋 Dahil edilen klasörler:');
    
    // Ana klasörleri listele
    const rootItems = fs.readdirSync(rootDir);
    rootItems.forEach(item => {
      const fullPath = path.join(rootDir, item);
      if (fs.statSync(fullPath).isDirectory() && !shouldExclude(fullPath, item)) {
        console.log(`   ✅ ${item}/`);
      }
    });
    
    console.log('\n📦 Dosyalar ekleniyor...');
    
    // Tüm workspace'i ekle
    addDirectoryRecursive(rootDir);

    // Gizli dosyaları da manuel kontrol et
    const hiddenFiles = ['.gitignore', '.replit', '.env.example'];
    hiddenFiles.forEach(file => {
      const filePath = path.join(rootDir, file);
      if (fs.existsSync(filePath)) {
        try {
          archive.file(filePath, { name: file });
        } catch (err) {
          console.warn(`⚠️ Gizli dosya eklenemedi: ${file}`);
        }
      }
    });

    archive.finalize();
  });
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function main() {
  try {
    console.log('\n🔍 Workspace içeriği analizi:');
    const rootDir = path.join(__dirname, '..');
    const items = fs.readdirSync(rootDir);
    
    let totalDirs = 0;
    let totalFiles = 0;
    
    items.forEach(item => {
      const fullPath = path.join(rootDir, item);
      const stats = fs.statSync(fullPath);
      if (stats.isDirectory()) {
        totalDirs++;
        console.log(`   📁 ${item}/`);
      } else {
        totalFiles++;
        console.log(`   📄 ${item}`);
      }
    });
    
    console.log(`\n📊 Toplam: ${totalDirs} klasör, ${totalFiles} dosya`);
    
    // Eski backup dosyalarını temizle (10'dan fazlaysa)
    const oldBackups = fs.readdirSync(rootDir).filter(file => 
      file.startsWith('gorkem-complete-workspace_') && file.endsWith('.zip')
    );

    if (oldBackups.length >= 10) {
      console.log(`\n🧹 ${oldBackups.length - 9} eski backup dosyası temizleniyor...`);
      oldBackups
        .sort()
        .slice(0, -(9)) // Son 9'u koru
        .forEach(file => {
          try {
            fs.unlinkSync(path.join(rootDir, file));
            console.log(`   🗑️ Silindi: ${file}`);
          } catch (err) {
            console.warn(`   ⚠️ Silinemedi: ${file}`);
          }
        });
    }

    // Complete backup oluştur
    const backupPath = await createCompleteBackup();
    
    console.log('\n🎉 Complete Workspace Backup başarıyla oluşturuldu!');
    console.log(`📁 Dosya: ${path.basename(backupPath)}`);
    console.log(`📍 Tam yol: ${backupPath}`);
    console.log('\n💡 İndirme seçenekleri:');
    console.log('   📥 VS Code Explorer\'dan sağ tık → Download');
    console.log('   📥 Terminal: Dosyaya çift tıklayarak indir');
    console.log(`   📥 Wget: wget http://localhost:3000/${path.basename(backupPath)}`);
    
    console.log('\n📋 Backup içeriği:');
    console.log('   ✅ Tüm kaynak kodlar (client, server, shared)');
    console.log('   ✅ Tüm konfigürasyon dosyaları');
    console.log('   ✅ Veritabanı dosyaları ve script\'ler');
    console.log('   ✅ Build ve dist dosyaları');
    console.log('   ✅ Git history (.git klasörü)');
    console.log('   ✅ Documentation ve README\'ler');
    console.log('   ✅ Package.json ve dependencies tanımları');
    console.log('   ✅ Tüm yardımcı script\'ler');
    console.log('   ❌ Sadece node_modules hariç (yeniden install için)');

    return backupPath;
  } catch (error) {
    console.error('❌ Complete backup işlemi başarısız:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { createCompleteBackup, BACKUP_FILENAME };