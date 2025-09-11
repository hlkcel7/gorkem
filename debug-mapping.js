// Header mapping test
const headers = [
  "Proje Adı",
  "Proje Kodu", 
  "Proje Türü",
  "Lokasyon",
  "İşveren",
  "Yüklenici",
  "Müşavir"
];

const createColumnMapping = (headers) => {
  const mapping = {};
  
  const normalizeHeader = (header) => {
    return header
      .replace(/İ/g, 'i').replace(/I/g, 'i')  // Önce büyük harfleri değiştir
      .replace(/Ğ/g, 'g').replace(/Ü/g, 'u').replace(/Ş/g, 's')
      .replace(/Ö/g, 'o').replace(/Ç/g, 'c')
      .toLowerCase()  // Sonra toLowerCase
      .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
      .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
      .replace(/\s+/g, ' ').trim();
  };

  console.log('\n🔍 HEADER MAPPING DEBUG:');
  console.log('========================');
  
  headers.forEach((header, index) => {
    const normalized = normalizeHeader(header);
    console.log(`${index}: "${header}" → "${normalized}"`);
    
    // Mapping'i oluştur
    if (normalized.includes('proje adi') || normalized === 'proje adı') {
      mapping['proje_adi'] = index;
      console.log(`  ✅ Mapped to: proje_adi`);
    } else if (normalized.includes('proje kodu')) {
      mapping['proje_kodu'] = index;
      console.log(`  ✅ Mapped to: proje_kodu`);
    } else if (normalized.includes('proje turu') || normalized.includes('proje türü')) {
      mapping['proje_turu'] = index;
      console.log(`  ✅ Mapped to: proje_turu`);
    } else if (normalized.includes('lokasyon')) {
      mapping['lokasyon'] = index;
      console.log(`  ✅ Mapped to: lokasyon`);
    } else if (normalized.includes('isveren') || normalized.includes('işveren')) {
      mapping['isveren'] = index;
      console.log(`  ✅ Mapped to: isveren`);
    } else if (normalized.includes('yuklenici') || normalized.includes('yüklenici')) {
      mapping['yuklenici'] = index;
      console.log(`  ✅ Mapped to: yuklenici`);
    } else if (normalized.includes('musavir') || normalized.includes('müşavir')) {
      mapping['musavir'] = index;
      console.log(`  ✅ Mapped to: musavir`);
    } else {
      console.log(`  ❌ No mapping found`);
    }
  });

  console.log('\n📊 FINAL MAPPING:');
  console.log(mapping);
  
  return mapping;
};

// Test
const result = createColumnMapping(headers);

// İşveren test
const testRow = ["GUEST HOUSE", "GH", "KAMU BİNASI", "BAĞDAT", "IRAK HÜKUNETİ", "GÖRKEM İNŞAAT", "Firma1"];

console.log('\n🧪 TEST ROW:');
console.log('===========');

const getCell = (fieldName, fallback = '') => {
  const index = result[fieldName];
  const value = (index !== undefined && testRow[index]) ? String(testRow[index]).trim() : fallback;
  console.log(`${fieldName}: index=${index}, value="${value}"`);
  return value;
};

getCell('proje_adi', 'İsimsiz Proje');
getCell('proje_kodu', 'PROJE-X');
getCell('lokasyon', 'Belirtilmemiş');
getCell('isveren', 'Belirtilmemiş');
