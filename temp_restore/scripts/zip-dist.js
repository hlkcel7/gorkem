import fs from 'fs';
import path from 'path';
import archiver from 'archiver';

const outPath = path.resolve(process.cwd(), 'dist.zip');
const distDir = path.resolve(process.cwd(), 'dist');

if (!fs.existsSync(distDir)) {
  console.error('dist directory not found. Run `npm run build` first.');
  process.exit(1);
}

const output = fs.createWriteStream(outPath);
const archive = archiver('zip', { zlib: { level: 9 } });

output.on('close', () => {
  console.log(`Created ${outPath} (${archive.pointer()} total bytes)`);
});

archive.on('warning', (err) => {
  if (err.code === 'ENOENT') {
    console.warn(err.message);
  } else {
    throw err;
  }
});

archive.on('error', (err) => { throw err; });

archive.pipe(output);

// include server dist files and public static build
archive.directory(path.join(distDir), 'dist');

// also include other necessary runtime files (package.json, node_modules serialization not included)
// include package.json for reference
archive.file(path.resolve(process.cwd(), 'package.json'), { name: 'package.json' });

// finalize archive
archive.finalize();

// --- Additional helper: ensure dist/public/app-config.js exists and index.html loads it
// This script can be run directly to prepare dist for upload. It reads environment
// variables to populate runtime config. If not provided, values will be undefined.
function ensureAppConfig() {
  const publicDir = path.join(distDir, 'public');
  if (!fs.existsSync(publicDir)) return;

  const appConfigPath = path.join(publicDir, 'app-config.js');

  const apiBase = process.env.API_BASE_URL || process.env.VITE_API_BASE_URL || 'http://gorkemprojetakip.com.tr';
  const firebaseApiKey = process.env.VITE_FIREBASE_API_KEY || ''; // PLACEHOLDER - GERÇEK DEĞER KALDIRILDI
  const firebaseAuthDomain = process.env.VITE_FIREBASE_AUTH_DOMAIN || 'gorkemapp.firebaseapp.com';
  const firebaseProjectId = process.env.VITE_FIREBASE_PROJECT_ID || 'gorkemapp';
  const firebaseAppId = process.env.VITE_FIREBASE_APP_ID || '1:216254903525:web:bdd3e3de632fbe66b3900c';
  const firebaseMeasurementId = process.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-PRM08VZW5T';
  const googleClientId = process.env.GOOGLE_CLIENT_ID || ''; // PLACEHOLDER - GERÇEK DEĞER KALDIRILDI
  const googleProjectId = process.env.GOOGLE_PROJECT_ID || 'gorkeminsaat';
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID || '1gOjceZ4DxORlbD1rTiGxgxoATvmKLVsIhyeE8UPtdlU';

  const content = `// Auto-generated at ${new Date().toISOString()}
window.__APP_CONFIG__ = window.__APP_CONFIG__ || {
  API_BASE_URL: ${JSON.stringify(apiBase)},
  VITE_FIREBASE_API_KEY: ${JSON.stringify(firebaseApiKey)},
  VITE_FIREBASE_AUTH_DOMAIN: ${JSON.stringify(firebaseAuthDomain)},
  VITE_FIREBASE_PROJECT_ID: ${JSON.stringify(firebaseProjectId)},
  VITE_FIREBASE_APP_ID: ${JSON.stringify(firebaseAppId)},
  VITE_FIREBASE_MEASUREMENT_ID: ${JSON.stringify(firebaseMeasurementId)},
  GOOGLE_CLIENT_ID: ${JSON.stringify(googleClientId)},
  GOOGLE_PROJECT_ID: ${JSON.stringify(googleProjectId)},
  GOOGLE_SPREADSHEET_ID: ${JSON.stringify(spreadsheetId)}
};
`;

  fs.writeFileSync(appConfigPath, content, 'utf8');

  // inject script tag into index.html if missing
  const indexPath = path.join(publicDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    let html = fs.readFileSync(indexPath, 'utf8');
    if (!/app-config\.js/.test(html)) {
      // insert before the first module script that loads the bundle
      const marker = /<script\s+type="module"[^>]*src=\"\/assets\//i;
      const insertTag = '    <script src="/app-config.js"></script>\n';
      const match = html.match(marker);
      if (match && match.index !== undefined) {
        const insertPos = match.index;
        // find the start of the line to preserve formatting
        const before = html.slice(0, insertPos);
        const after = html.slice(insertPos);
        html = before + insertTag + after;
      } else {
        // fallback: append to head
        html = html.replace('</head>', insertTag + '</head>');
      }

      fs.writeFileSync(indexPath, html, 'utf8');
    }
  }
}

// Run ensureAppConfig synchronously before exiting so the written files are included
try {
  ensureAppConfig();
} catch (err) {
  console.warn('Failed to ensure app-config:', err);
}
