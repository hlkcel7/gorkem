// OpenAI Embeddings Service
interface OpenAIConfig {
  apiKey: string;
  model?: string;
  baseUrl?: string;
}

interface EmbeddingResponse {
  data: Array<{
    embedding: number[];
    index: number;
    object: string;
  }>;
  model: string;
  object: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

interface QueryEnhancement {
  originalQuery: string;
  enhancedQuery: string;
  searchKeywords: string[];
  searchStrategy: 'vector' | 'text' | 'hybrid';
  language: 'turkish' | 'english' | 'mixed';
  confidence: number;
}

class OpenAIEmbeddingsService {
  private config: OpenAIConfig | null = null;

  // Konfigürasyon ayarlama
  configure(config: OpenAIConfig) {
    this.config = {
      baseUrl: 'https://api.openai.com/v1',
      model: 'text-embedding-3-small', // Türkçe ve İngilizce destekli, hızlı model
      ...config
    };
  }

  // Bağlantı testi
  async testConnection(): Promise<boolean> {
    try {
      if (!this.config?.apiKey) {
        throw new Error('OpenAI API key yapılandırılmamış');
      }

      // Basit test embedding
      const testText = "Test connection";
      await this.generateEmbedding(testText);
      return true;
    } catch (error) {
      console.error('OpenAI bağlantı hatası:', error);
      return false;
    }
  }

  // Text'ten embedding oluşturma
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      if (!this.config) {
        throw new Error('OpenAI konfigürasyonu yapılmamış');
      }

      // Text temizleme ve hazırlama
      const cleanText = this.prepareTextForEmbedding(text);

      const response = await fetch(`${this.config.baseUrl}/embeddings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          input: cleanText,
          model: this.config.model,
          encoding_format: 'float'
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`OpenAI API hatası: ${response.status} - ${errorData}`);
      }

      const data: EmbeddingResponse = await response.json();
      
      if (!data.data || data.data.length === 0) {
        throw new Error('Embedding oluşturulamadı');
      }

      console.log(`📊 Embedding oluşturuldu: ${data.data[0].embedding.length} boyut, ${data.usage.total_tokens} token`);
      return data.data[0].embedding;

    } catch (error) {
      console.error('Embedding oluşturma hatası:', error);
      throw new Error('Embedding oluşturulamadı');
    }
  }

  // Query enhancement - Kullanıcı sorgusunu geliştirme
  async enhanceQuery(userQuery: string): Promise<QueryEnhancement> {
    try {
      if (!this.config) {
        throw new Error('OpenAI konfigürasyonu yapılmamış');
      }

      const enhancementPrompt = `Sen bir belge arama uzmanısın. Kullanıcının arama sorgusunu analiz edip geliştir.

Kullanıcı sorgusu: "${userQuery}"

Görevlerin:
1. Sorguyu analiz et ve dili tespit et (turkish/english/mixed)
2. Benzer anlamlı kelimeler ekle
3. Arama stratejisini belirle (vector/text/hybrid)
4. Anahtar kelimeleri çıkar

JSON formatında yanıt ver:
{
  "originalQuery": "orijinal sorgu",
  "enhancedQuery": "geliştirilmiş sorgu",
  "searchKeywords": ["kelime1", "kelime2", "kelime3"],
  "searchStrategy": "hybrid",
  "language": "turkish",
  "confidence": 0.9
}`;

      const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'Sen bir belge arama uzmanısın. Her zaman geçerli JSON formatında yanıt ver.'
            },
            {
              role: 'user', 
              content: enhancementPrompt
            }
          ],
          temperature: 0.3,
          max_tokens: 500
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API hatası: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      try {
        const enhancement = JSON.parse(content);
        return {
          originalQuery: userQuery,
          enhancedQuery: enhancement.enhancedQuery || userQuery,
          searchKeywords: enhancement.searchKeywords || [userQuery],
          searchStrategy: enhancement.searchStrategy || 'hybrid',
          language: enhancement.language || 'turkish',
          confidence: enhancement.confidence || 0.8
        };
      } catch (parseError) {
        console.warn('Query enhancement parse hatası, varsayılan değerler kullanılıyor:', parseError);
        return {
          originalQuery: userQuery,
          enhancedQuery: userQuery,
          searchKeywords: userQuery.split(' ').filter(word => word.length > 2),
          searchStrategy: 'hybrid',
          language: 'turkish',
          confidence: 0.6
        };
      }

    } catch (error) {
      console.error('Query enhancement hatası:', error);
      // Hata durumunda basit enhancement
      return {
        originalQuery: userQuery,
        enhancedQuery: userQuery,
        searchKeywords: userQuery.split(' ').filter(word => word.length > 2),
        searchStrategy: 'text',
        language: 'turkish',
        confidence: 0.5
      };
    }
  }

  // Text hazırlama - Smart query translation yaklaşımı
  private prepareTextForEmbedding(text: string): string {
    // Veritabanı çoğunlukla İngilizce olduğu için
    // Türkçe sorguları İngilizceye çevirelim
    const translatedText = this.smartTranslateQuery(text);
    
    return translatedText
      .trim()
      .replace(/\s+/g, ' ') // Çoklu boşlukları tek boşluğa çevir
      .substring(0, 8000) // OpenAI token limitine uygun kısalt
      .toLowerCase();
  }

  // Smart query translation - Türkçe terimleri İngilizceye çevir
  private smartTranslateQuery(text: string): string {
    // Veritabanı analizi: %90 İngilizce + %10 Türkçe
    // Strategi: Türkçe sorguları İngilizceye çevir, İngilizce sorguları olduğu gibi bırak
    
    const turkishToEnglish: Record<string, string> = {
      // Silah/Güvenlik terimleri (veritabanında BULLET, WEAPON var)
      'kurşun': 'bullet',
      'mermi': 'bullet ammunition',
      'silah': 'weapon firearm',
      'tüfek': 'rifle weapon',
      'güvenlik': 'security safety',
      'korunma': 'protection',
      
      // İnşaat terimleri (veritabanında CONSTRUCTION, BUILDING var)
      'inşaat': 'construction building',
      'yapım': 'construction',
      'bina': 'building',
      'yapı': 'structure building',
      'proje': 'project',
      'tasarım': 'design',
      'plan': 'plan design',
      'çizim': 'drawing plan',
      
      // Mali/İş terimleri (veritabanında INVOICE, PAYMENT var)
      'fatura': 'invoice bill',
      'ödeme': 'payment',
      'para': 'money payment',
      'bütçe': 'budget',
      'maliyet': 'cost',
      'finansal': 'financial',
      'muhasebe': 'accounting',
      
      // İş süreçleri (veritabanında MEETING, APPROVAL var)
      'toplantı': 'meeting',
      'rapor': 'report',
      'durum': 'status situation',
      'onay': 'approval',
      'talep': 'request',
      'başvuru': 'application request',
      'teklif': 'proposal offer',
      
      // Teknik terimler
      'elektrik': 'electrical electricity',
      'teknoloji': 'technology',
      'sistem': 'system',
      'ağ': 'network',
      'bilgisayar': 'computer',
      'yazılım': 'software',
      
      // Genel terimler
      'belge': 'document',
      'dosya': 'file document',
      'kayıt': 'record',
      'arşiv': 'archive',
      'liste': 'list',
      'tablo': 'table',
    };

    let enhancedQuery = text;
    
    // Türkçe kelime tespiti ve çevirisi
    const words = text.toLowerCase().split(/\s+/);
    const translatedWords: string[] = [];
    
    words.forEach(word => {
      const cleanWord = word.replace(/[^\wçğıöşüÇĞIÖŞÜ]/g, '');
      
      if (turkishToEnglish[cleanWord]) {
        // Türkçe kelimeyi İngilizce karşılığıyla değiştir
        translatedWords.push(turkishToEnglish[cleanWord]);
        console.log(`🔄 Çeviri: "${cleanWord}" → "${turkishToEnglish[cleanWord]}"`);
      } else {
        // İngilizce veya bilinmeyen kelimeyi olduğu gibi bırak
        translatedWords.push(word);
      }
    });
    
    enhancedQuery = translatedWords.join(' ');
    
    // Eğer çeviri yapıldıysa log'la
    if (enhancedQuery !== text) {
      console.log(`🌍 Query çevirisi: "${text}" → "${enhancedQuery}"`);
    }
    
    return enhancedQuery;
  }

  // Similarity hesaplama (cosine similarity)
  calculateSimilarity(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) {
      throw new Error('Embedding boyutları eşleşmiyor');
    }

    const dotProduct = embedding1.reduce((sum, a, i) => sum + a * embedding2[i], 0);
    const magnitude1 = Math.sqrt(embedding1.reduce((sum, a) => sum + a * a, 0));
    const magnitude2 = Math.sqrt(embedding2.reduce((sum, a) => sum + a * a, 0));
    
    if (magnitude1 === 0 || magnitude2 === 0) {
      return 0;
    }
    
    return dotProduct / (magnitude1 * magnitude2);
  }
}

export const openAIService = new OpenAIEmbeddingsService();
export type { OpenAIConfig, QueryEnhancement };
