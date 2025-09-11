const {google} = require('googleapis');
const fs = require('fs');

(async function() {
  try {
    const svcPath = 'gorkeminsaat-02871cc1db5d.json';
    const raw = fs.readFileSync(svcPath, 'utf8');
    const creds = JSON.parse(raw);

    const auth = new google.auth.GoogleAuth({
      credentials: creds,
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    const sheets = google.sheets({version: 'v4', auth});
    console.log('Google Sheets auth initialized successfully');

    const spreadsheetId = '1gOjceZ4DxORlbD1rTiGxgxoATvmKLVsIhyeE8UPtdlU';

    // Sheet'leri listele
    const metadata = await sheets.spreadsheets.get({ spreadsheetId });
    console.log('\n🏷️ SHEET\'LER:');
    metadata.data.sheets?.forEach((sheet, index) => {
      console.log(`${index + 1}. ${sheet.properties?.title}`);
    });

    // Her sheet için başlıkları kontrol et
    for (const sheet of metadata.data.sheets || []) {
      const sheetTitle = sheet.properties?.title;
      if (!sheetTitle) continue;

      console.log(`\n\n📊 SHEET: "${sheetTitle}"`);
      console.log('=' .repeat(50));

      try {
        // İlk birkaç satırı al
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range: `${sheetTitle}!A1:Z10` // İlk 10 satır, Z kolonuna kadar
        });

        const values = response.data.values;
        if (!values || values.length === 0) {
          console.log('Bu sheet\'te veri yok.');
          continue;
        }

        // Başlıkları göster
        console.log('\n📋 BAŞLIKLAR (1. satır):');
        const headers = values[0] || [];
        headers.forEach((header, index) => {
          const columnLetter = String.fromCharCode(65 + index); // A, B, C...
          console.log(`${columnLetter} (${index}): "${header}"`);
        });

        // Örnek veri göster (2. satır)
        if (values.length > 1) {
          console.log('\n📄 ÖRNEK VERİ (2. satır):');
          const exampleRow = values[1] || [];
          exampleRow.forEach((cell, index) => {
            const columnLetter = String.fromCharCode(65 + index);
            console.log(`${columnLetter} (${index}): "${cell || ''}"`);
          });
        }

        console.log(`\n📊 Toplam satır sayısı: ${values.length}`);
        console.log(`📏 Toplam kolon sayısı: ${headers.length}`);

      } catch (error) {
        console.error(`❌ ${sheetTitle} okuma hatası:`, error.message);
      }
    }

  } catch (err) {
    console.error('❌ Hata:', err.message || err);
    process.exit(1);
  }
})();
