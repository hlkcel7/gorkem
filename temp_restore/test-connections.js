// Test script for database connections
import neo4j from 'neo4j-driver';
import { createClient } from '@supabase/supabase-js';

// Test configs - gerçek bilgilerinizi buraya girin
const configs = {
  neo4j: {
    uri: 'neo4j://localhost:7687', // Örnek: 'neo4j+s://your-db.databases.neo4j.io'
    username: 'neo4j',
    password: 'your-password'
  },
  supabase: {
    url: 'https://ymivsbikxiosrdtnnuax.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltaXZzYmlreGlvc3JkdG5udWF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczMTc2MDksImV4cCI6MjA3Mjg5MzYwOX0.4Gc2saAw27WX8w78lu8LYr_ad6pRZWTrmC_zBxZGhWE'
  },
  deepseek: {
    apiKey: 'sk-PLACEHOLDER' // GERÇEK KEY KALDIRILDI
  }
};

// Neo4j bağlantı testi
async function testNeo4j() {
  console.log('🔄 Neo4j bağlantısı test ediliyor...');
  
  if (!configs.neo4j.uri || !configs.neo4j.username || !configs.neo4j.password) {
    console.log('❌ Neo4j konfigürasyonu eksik');
    return false;
  }

  try {
    const driver = neo4j.driver(
      configs.neo4j.uri,
      neo4j.auth.basic(configs.neo4j.username, configs.neo4j.password)
    );

    const session = driver.session();
    await session.run('RETURN 1 as test');
    await session.close();
    await driver.close();

    console.log('✅ Neo4j bağlantısı başarılı!');
    return true;
  } catch (error) {
    console.log('❌ Neo4j bağlantı hatası:', error.message);
    return false;
  }
}

// Supabase bağlantı testi
async function testSupabase() {
  console.log('🔄 Supabase bağlantısı test ediliyor...');
  
  if (!configs.supabase.url || !configs.supabase.anonKey) {
    console.log('❌ Supabase konfigürasyonu eksik');
    return false;
  }

  try {
    const supabase = createClient(configs.supabase.url, configs.supabase.anonKey);
    
    // Basit bir test sorgusu
    const { data, error } = await supabase
      .from('documents')
      .select('count')
      .limit(1);

    if (error && error.code !== 'PGRST116') { // PGRST116 = table doesn't exist, bu OK
      throw error;
    }

    console.log('✅ Supabase bağlantısı başarılı!');
    if (error?.code === 'PGRST116') {
      console.log('ℹ️  "documents" tablosu henüz oluşturulmamış (normal)');
    } else {
      console.log('ℹ️  "documents" tablosu mevcut');
    }
    return true;
  } catch (error) {
    console.log('❌ Supabase bağlantı hatası:', error.message);
    return false;
  }
}

// DeepSeek API testi
async function testDeepSeek() {
  console.log('🔄 DeepSeek API test ediliyor...');
  
  if (!configs.deepseek.apiKey) {
    console.log('❌ DeepSeek API key eksik');
    return false;
  }

  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${configs.deepseek.apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'user', content: 'Test mesajı - sadece "OK" yanıtla' }
        ],
        max_tokens: 10
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ DeepSeek API bağlantısı başarılı!');
    console.log('📝 Test yanıtı:', data.choices[0]?.message?.content);
    return true;
  } catch (error) {
    console.log('❌ DeepSeek API hatası:', error.message);
    return false;
  }
}

// Ana test fonksiyonu
async function runTests() {
  console.log('🚀 Belge Arama Sistemi - Bağlantı Testleri\n');
  
  console.log('⚙️  Konfigürasyon durumu:');
  console.log(`Neo4j URI: ${configs.neo4j.uri ? '✓ Ayarlandı' : '❌ Eksik'}`);
  console.log(`Supabase URL: ${configs.supabase.url ? '✓ Ayarlandı' : '❌ Eksik'}`);
  console.log(`DeepSeek Key: ${configs.deepseek.apiKey ? '✓ Ayarlandı' : '❌ Eksik'}\n`);

  const results = {
    neo4j: await testNeo4j(),
    supabase: await testSupabase(),
    deepseek: await testDeepSeek()
  };

  console.log('\n📊 Test Sonuçları:');
  console.log(`Neo4j Graph DB: ${results.neo4j ? '✅ Bağlı' : '❌ Bağlanamadı'}`);
  console.log(`Supabase PostgreSQL: ${results.supabase ? '✅ Bağlı' : '❌ Bağlanamadı'}`);
  console.log(`DeepSeek AI: ${results.deepseek ? '✅ Bağlı' : '❌ Bağlanamadı'}`);

  const successCount = Object.values(results).filter(Boolean).length;
  console.log(`\n🎯 Genel Durum: ${successCount}/3 servis bağlı`);

  if (successCount === 3) {
    console.log('🎉 Tüm bağlantılar başarılı! Sistem kullanıma hazır.');
  } else if (successCount > 0) {
    console.log('⚠️  Bazı bağlantılar başarısız. Konfigürasyonu kontrol edin.');
  } else {
    console.log('🚨 Hiçbir bağlantı kurulamadı. Konfigürasyonu gözden geçirin.');
  }

  console.log('\n💡 Bağlantı bilgilerini güncellemek için test-connections.js dosyasındaki configs objesini düzenleyin.');
}

// Test çalıştır
runTests().catch(console.error);
