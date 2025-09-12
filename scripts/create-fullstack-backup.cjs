#!/usr/bin/env node

/**
 * Fullstack Project Backup & Download Script
 * Tüm projeyi zip formatında hazırlar ve indirir
 */

const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

// Timestamp oluştur
const now = new Date();
const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '');

const PROJECT_NAME = 'gorkem-fullstack';
const BACKUP_FILENAME = `${PROJECT_NAME}_backup_${dateStr}_${timeStr}.zip`;
const BACKUP_PATH = path.join(__dirname, '..', BACKUP_FILENAME);

console.log('🚀 Görkem İnşaat Fullstack Project Backup');
console.log('=' .repeat(60));
console.log(`📦 Backup dosyası: ${BACKUP_FILENAME}`);
console.log(`📍 Lokasyon: ${BACKUP_PATH}`);
console.log('🕐 Başlama zamanı:', new Date().toLocaleString('tr-TR'));

// Exclude patterns - bu dosya/klasörler backup'a dahil edilmeyecek
const EXCLUDE_PATTERNS = [
  'node_modules',
  '.git',
  'dist',
  '*.log',
  '.env',
  '.env.local',
  '.env.production',
  'dist-download_*.zip',
  'fullstack_backup_*.zip',
  'gorkem_*.zip',
  '*.tmp',
  '.DS_Store',
  'Thumbs.db',
  '.vscode/settings.json',
  'temp_*',
  'scripts/yedek',
  '.local'
];

// Include patterns - bu dosya/klasörler mutlaka dahil edilecek
const INCLUDE_PATTERNS = [
  'client/**/*',
  'server/**/*',
  'shared/**/*',
  'db/**/*',
  'package.json',
  'package-lock.json',
  'tsconfig.json',
  'vite.config.ts',
  'tailwind.config.ts',
  'postcss.config.js',
  'drizzle.config.ts',
  'components.json',
  'README.md',
  'DEPLOYMENT.md',
  'USER_SETTINGS_README.md',
  'DEBUG-PANEL-INFO.md',
  'replit.md',
  'scripts/**/*',
  'supabase-*.sql',
  'check-*.js',
  'check-*.cjs',
  'test-*.js',
  'test-*.cjs',
  'test-*.html',
  'debug-*.js',
  'manual-*.sh',
  'run-*.sh'
];

function shouldExclude(filePath) {
  const relativePath = path.relative(__dirname + '/..', filePath);
  
  return EXCLUDE_PATTERNS.some(pattern => {
    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(relativePath) || regex.test(path.basename(filePath));
    }
    return relativePath.includes(pattern) || path.basename(filePath) === pattern;
  });
}

function shouldInclude(filePath) {
  const relativePath = path.relative(__dirname + '/..', filePath);
  
  // Eğer exclude listesindeyse dahil etme
  if (shouldExclude(filePath)) {
    return false;
  }
  
  // Include patterns'dan en az birine uyuyorsa dahil et
  return INCLUDE_PATTERNS.some(pattern => {
    if (pattern.includes('**')) {
      const regex = new RegExp(pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*'));
      return regex.test(relativePath);
    } else if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(relativePath) || regex.test(path.basename(filePath));
    }
    return relativePath === pattern || relativePath.startsWith(pattern + '/');
  });
}

async function createFullstackBackup() {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(BACKUP_PATH);
    const archive = archiver('zip', {
      zlib: { level: 6 } // Compression level (0-9)
    });

    let fileCount = 0;
    let totalSize = 0;

    output.on('close', () => {
      const finalSize = archive.pointer();
      const compressionRatio = ((totalSize - finalSize) / totalSize * 100).toFixed(1);
      
      console.log('\n✅ Backup tamamlandı!');
      console.log('📊 İstatistikler:');
      console.log(`   📁 Dosya sayısı: ${fileCount}`);
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
      fileCount++;
      totalSize += entry.stats.size;
      
      if (fileCount % 10 === 0) {
        process.stdout.write(`\r📦 İşlenen dosya sayısı: ${fileCount}`);
      }
    });

    archive.pipe(output);

    // Root directory'deki dosyaları ekle
    const rootDir = path.join(__dirname, '..');
    
    function addDirectory(dir, baseDir = '') {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const relativePath = path.join(baseDir, item);
        
        if (!shouldInclude(fullPath)) {
          continue;
        }

        const stats = fs.statSync(fullPath);
        
        if (stats.isDirectory()) {
          addDirectory(fullPath, relativePath);
        } else {
          try {
            archive.file(fullPath, { name: relativePath });
          } catch (err) {
            console.warn(`⚠️ Dosya eklenemedi: ${relativePath} - ${err.message}`);
          }
        }
      }
    }

    console.log('\n📂 Dosyalar taranıyor ve ekleniyor...');
    addDirectory(rootDir);

    // Özel dosyaları manuel ekle
    const specialFiles = [
      '.gitignore',
      '.replit'
    ];

    specialFiles.forEach(file => {
      const filePath = path.join(rootDir, file);
      if (fs.existsSync(filePath)) {
        archive.file(filePath, { name: file });
      }
    });

    archive.finalize();
  });
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function main() {
  try {
    // Önceki backup dosyalarını temizle (isteğe bağlı)
    const rootDir = path.join(__dirname, '..');
    const oldBackups = fs.readdirSync(rootDir).filter(file => 
      file.startsWith('gorkem-fullstack_backup_') && file.endsWith('.zip')
    );

    if (oldBackups.length > 5) {
      console.log(`🧹 ${oldBackups.length - 5} eski backup dosyası temizleniyor...`);
      oldBackups
        .sort()
        .slice(0, -5) // Son 5'i koru
        .forEach(file => {
          try {
            fs.unlinkSync(path.join(rootDir, file));
            console.log(`   🗑️ Silindi: ${file}`);
          } catch (err) {
            console.warn(`   ⚠️ Silinemedi: ${file}`);
          }
        });
    }

    // Backup oluştur
    const backupPath = await createFullstackBackup();
    
    console.log('\n🎉 Fullstack backup başarıyla oluşturuldu!');
    console.log(`📁 Dosya: ${path.basename(backupPath)}`);
    console.log(`📍 Tam yol: ${backupPath}`);
    console.log('\n💡 İndirme talimatları:');
    console.log('   1. VS Code\'da sol panelden "Explorer" sekmesini aç');
    console.log(`   2. "${path.basename(backupPath)}" dosyasını bul`);
    console.log('   3. Dosyaya sağ tıklayıp "Download" seç');
    console.log('   4. Veya terminal\'de şu komutu çalıştır:');
    console.log(`      wget http://localhost:3000/${path.basename(backupPath)}`);

    return backupPath;
  } catch (error) {
    console.error('❌ Backup işlemi başarısız:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { createFullstackBackup, BACKUP_FILENAME };