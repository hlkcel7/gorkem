const { openAIService } = require('./client/src/services/openai-embeddings.ts');

// Load environment variables
require('dotenv').config();

async function testRealUIFlow() {
  console.log('🚀 Web arayüzündeki gerçek akışı test ediyoruz...\n');
  
  // Configure OpenAI
  try {
    await openAIService.configure({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    console.log('✅ OpenAI bağlantısı yapılandırıldı\n');
  } catch (error) {
    console.error('❌ OpenAI yapılandırma hatası:', error);
    return;
  }

  // Test 1: Direct embedding (script gibi)
  console.log('🧪 Test 1: Direkt embedding (script tarzı)');
  try {
    const directEmbedding = await openAIService.generateEmbedding('bullet');
    console.log('   ✅ Direkt embedding oluşturuldu:', directEmbedding.length, 'boyut');
  } catch (error) {
    console.error('   ❌ Direkt embedding hatası:', error);
  }

  // Test 2: Enhanced query embedding (UI gibi)
  console.log('\n🧪 Test 2: Enhanced embedding (UI tarzı)');
  try {
    // Önce query enhancement
    const enhancement = await openAIService.enhanceQuery('bullet');
    console.log('   🤖 Query enhancement:', enhancement.enhancedQuery);
    
    // Sonra enhanced query'nin embedding'i
    const enhancedEmbedding = await openAIService.generateEmbedding(enhancement.enhancedQuery);
    console.log('   ✅ Enhanced embedding oluşturuldu:', enhancedEmbedding.length, 'boyut');
    console.log('   📊 Enhancement detayları:', {
      original: enhancement.originalQuery,
      enhanced: enhancement.enhancedQuery,
      keywords: enhancement.searchKeywords,
      strategy: enhancement.searchStrategy,
      language: enhancement.language
    });
  } catch (error) {
    console.error('   ❌ Enhanced embedding hatası:', error);
  }

  console.log('\n💡 Bu fark nedeniyle web arayüzünde 0 sonuç alıyorsunuz!');
}

testRealUIFlow().catch(console.error);
