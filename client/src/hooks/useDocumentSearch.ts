// Document Search Hook
import { useState, useEffect } from 'react';
import { supabaseService, DocumentRecord, VectorSearchResult } from '../services/supabase';
import { deepSeekService, SearchDecision } from '../services/deepseek';
import { openAIService, QueryEnhancement } from '../services/openai-embeddings';

interface SearchFilters {
  dateFrom?: string;             // letter_date için
  dateTo?: string;               // letter_date için
  type_of_corr?: string;         // yazışma türü
  severity_rate?: string;        // önem derecesi
  inc_out?: string;              // gelen/giden
  keywords?: string[];           // anahtar kelimeler
  internal_no?: string;          // dahili numara
  sortBy?: 'letter_date' | 'similarity' | 'severity_rate' | 'short_desc' | 'letter_no';
  sortOrder?: 'asc' | 'desc';
}

interface SearchState {
  isLoading: boolean;
  supabaseResults: VectorSearchResult[];
  searchDecision: SearchDecision | null;
  queryEnhancement: QueryEnhancement | null;
  aiAnalysis: {
    relevanceScores: { supabase: number; vector: number };
    recommendations: string[];
    suggestedActions: string[];
  } | null;
  error: string | null;
  lastQuery: string;
  lastFilters: SearchFilters;
  searchMethod: 'text' | 'vector' | 'hybrid';
  stats: {
    totalDocuments: number;
    correspondenceTypeCounts: Record<string, number>;
    severityRateCounts: Record<string, number>;
    recentDocuments: number;
    incomingOutgoing: Record<string, number>;
  };
}

interface DatabaseConnectionState {
  supabase: 'connected' | 'disconnected' | 'testing' | 'error';
  deepseek: 'connected' | 'disconnected' | 'testing' | 'error';
  openai: 'connected' | 'disconnected' | 'testing' | 'error';
}

export function useDocumentSearch() {
  const [searchState, setSearchState] = useState<SearchState>({
    isLoading: false,
    supabaseResults: [],
    searchDecision: null,
    queryEnhancement: null,
    aiAnalysis: null,
    error: null,
    lastQuery: '',
    lastFilters: {},
    searchMethod: 'hybrid',
    stats: {
      totalDocuments: 0,
      correspondenceTypeCounts: {},
      severityRateCounts: {},
      recentDocuments: 0,
      incomingOutgoing: {}
    }
  });

  const [connectionState, setConnectionState] = useState<DatabaseConnectionState>({
    supabase: 'disconnected',
    deepseek: 'disconnected',
    openai: 'disconnected'
  });

  const [availableOptions, setAvailableOptions] = useState({
    correspondenceTypes: [] as string[],
    severityRates: [] as string[],
    keywords: [] as string[]
  });

  // Database konfigürasyonları
  const configureServices = (configs: {
    supabase?: { url: string; anonKey: string };
    deepseek?: { apiKey: string };
    openai?: { apiKey: string };
  }) => {
    if (configs.supabase) {
      supabaseService.configure(configs.supabase);
    }
    if (configs.deepseek) {
      deepSeekService.configure(configs.deepseek);
    }
    if (configs.openai) {
      openAIService.configure(configs.openai);
    }
  };

  // Bağlantı durumlarını test etme
  const testConnections = async () => {
    setConnectionState(prev => ({
      supabase: 'testing',
      deepseek: 'testing',
      openai: 'testing'
    }));

    try {
      const [supabaseOk, deepseekOk, openaiOk] = await Promise.allSettled([
        supabaseService.testConnection(),
        deepSeekService.testConnection(),
        openAIService.testConnection()
      ]);

      setConnectionState({
        supabase: supabaseOk.status === 'fulfilled' && supabaseOk.value ? 'connected' : 'error',
        deepseek: deepseekOk.status === 'fulfilled' && deepseekOk.value ? 'connected' : 'error',
        openai: openaiOk.status === 'fulfilled' && openaiOk.value ? 'connected' : 'error'
      });

    } catch (error) {
      console.error('Bağlantı testi hatası:', error);
      setConnectionState({
        supabase: 'error',
        deepseek: 'error',
        openai: 'error'
      });
    }
  };

  // İstatistikleri ve seçenekleri yükleme
  const loadInitialData = async () => {
    try {
      // Supabase'den istatistikler ve seçenekler
      const [stats, correspondenceTypes, severityRates, keywords] = await Promise.allSettled([
        supabaseService.getSearchStats(),
        supabaseService.getCorrespondenceTypes(),
        supabaseService.getSeverityRates(),
        supabaseService.getKeywords()
      ]);

      setSearchState(prev => ({
        ...prev,
        stats: stats.status === 'fulfilled' ? stats.value : prev.stats
      }));

      setAvailableOptions({
        correspondenceTypes: correspondenceTypes.status === 'fulfilled' ? correspondenceTypes.value : [],
        severityRates: severityRates.status === 'fulfilled' ? severityRates.value : [],
        keywords: keywords.status === 'fulfilled' ? keywords.value : []
      });

    } catch (error) {
      console.error('İlk veri yükleme hatası:', error);
    }
  };

  // Ana arama fonksiyonu - Vector Search default, AI checkbox ile kontrol
  const search = async (query: string, filters: SearchFilters = {}, enableAI: boolean = false) => {
    if (!query.trim()) {
      setSearchState(prev => ({
        ...prev,
        error: 'Arama sorgusu boş olamaz'
      }));
      return;
    }

    setSearchState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      lastQuery: query,
      lastFilters: filters
    }));

    try {
      console.log(`🚀 Arama başlatılıyor... (AI: ${enableAI ? 'Aktif' : 'Pasif'})`);
      
      let finalResults: VectorSearchResult[] = [];
      let searchMethod: 'text' | 'vector' | 'hybrid' = enableAI ? 'vector' : 'text';
      let queryEnhancement: QueryEnhancement | null = null;

      if (enableAI) {
        // AI AKTIF: Hybrid search kullan (vector + text birleşimi)
        console.log('🧠 Hybrid search (AI modu) yapılıyor...');
        try {
          let queryForVector = query;

          // AI enabled ise query enhancement kullan
          if (connectionState.openai === 'connected') {
            console.log('🤖 OpenAI ile query geliştiriliyor...');
            queryEnhancement = await openAIService.enhanceQuery(query);
            queryForVector = queryEnhancement?.enhancedQuery || query;
          }

          // Vector search için embedding oluştur
          const queryEmbedding = await openAIService.generateEmbedding(queryForVector);
          console.log('useDocumentSearch: generated embedding length =', Array.isArray(queryEmbedding) ? queryEmbedding.length : typeof queryEmbedding);

          // Read tuning from localStorage so UI sliders affect behavior
          const vectorThreshold = parseFloat(localStorage.getItem('doc_search_vector_threshold') || '0.3');
          const vectorWeight = parseFloat(localStorage.getItem('doc_search_vector_weight') || '0.3');
          const textWeight = parseFloat(localStorage.getItem('doc_search_text_weight') || '0.7');
          const textScoreMethod = localStorage.getItem('doc_search_text_score_method') || 'overlap';

          // Hybrid search çağrısı
          finalResults = await supabaseService.hybridSearch(query, queryEmbedding, {
            vectorThreshold,
            vectorWeight,
            textWeight,
            maxResults: 500,
            filters
          }, { textScoreMethod: textScoreMethod as 'overlap' | 'simple' });

          searchMethod = 'hybrid';
          console.log(`✅ Hybrid search tamamlandı: ${finalResults.length} sonuç`);

        } catch (hybridError) {
          console.warn('⚠️ Hybrid search başarısız, vector/text karışımı fallback akışı deneniyor:', hybridError);
          // Fallback: try plain vector first, then text
          try {
            let queryForVector = query;
            if (connectionState.openai === 'connected') {
              queryEnhancement = await openAIService.enhanceQuery(query);
              queryForVector = queryEnhancement?.enhancedQuery || query;
            }
            const queryEmbedding = await openAIService.generateEmbedding(queryForVector);
            finalResults = await supabaseService.vectorSearch(queryEmbedding, { maxResults: 500, filters });
            searchMethod = 'vector';
            console.log(`✅ Fallback vector search tamamlandı: ${finalResults.length} sonuç`);
          } catch (vectorError) {
            console.warn('⚠️ Fallback vector search da başarısız, text search\'e geçiliyor:', vectorError);
            try {
              const textResults = await supabaseService.searchDocuments(query, filters);
              finalResults = textResults.map(doc => ({
                ...doc,
                similarity: 0.5,
                searchType: 'text' as const
              }));
              searchMethod = 'text';
              console.log(`✅ Fallback text search tamamlandı: ${finalResults.length} sonuç`);
            } catch (textError) {
              console.error('❌ Fallback text search de başarısız:', textError);
              throw textError;
            }
          }
        }
      } else {
        // AI PASIF: Sadece basit text search kullan
        console.log('📝 Basit text search (AI pasif) yapılıyor...');
        try {
          const textResults = await supabaseService.searchDocuments(query, filters);
          finalResults = textResults.map(doc => ({
            ...doc,
            similarity: 0.5,
            searchType: 'text' as const
          }));
          searchMethod = 'text';
          console.log(`✅ Basit text search tamamlandı: ${finalResults.length} sonuç`);
        } catch (textError) {
          console.error('❌ Basit text search başarısız:', textError);
          throw textError;
        }
      }

      // 3. Sonuçları güncelle
      setSearchState(prev => ({
        ...prev,
        supabaseResults: finalResults,
        queryEnhancement,
        searchMethod,
        isLoading: false
      }));

      console.log(`🎯 Arama tamamlandı: ${finalResults.length} sonuç (${searchMethod})`);

    } catch (error) {
      console.error('🚨 Arama hatası:', error);
      setSearchState(prev => ({
        ...prev,
        error: `Arama hatası: ${(error as Error).message}`,
        isLoading: false
      }));
    }
  };
  

  // Özel vector search metodu
  const vectorSearch = async (query: string, filters: SearchFilters = {}) => {
    if (connectionState.openai !== 'connected') {
      throw new Error('OpenAI bağlantısı gerekli');
    }

    console.log('🧠 Vector search başlatılıyor...');
    const queryEmbedding = await openAIService.generateEmbedding(query);
    return await supabaseService.vectorSearch(queryEmbedding, {
      maxResults: 500,
      filters
    });
  };

  // Gelişmiş arama (sadece Supabase)
  const advancedSearch = async (
    query: string,
    options?: {
      searchType?: 'plain' | 'phrase' | 'websearch';
      language?: 'turkish' | 'english';
      similarityThreshold?: number;
    }
  ) => {
    setSearchState(prev => ({
      ...prev,
      isLoading: true,
      error: null
    }));

    try {
      const results = await supabaseService.advancedSearch(query, options);
      
      setSearchState(prev => ({
        ...prev,
        supabaseResults: results,
        isLoading: false
      }));

    } catch (error) {
      setSearchState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Gelişmiş arama hatası',
        isLoading: false
      }));
    }
  };

  // Belge ağını görselleştirme
  const getDocumentNetwork = async (documentId: string, depth: number = 2) => {
    try {
      // Neo4j kaldırıldı, benzer belgeleri Supabase'den alıyoruz
      const similar = await supabaseService.findSimilarDocuments(documentId, 10);
      return { 
        nodes: similar.map(doc => ({ id: doc.id, label: doc.short_desc || 'Başlıksız' })), 
        relationships: [] 
      };
    } catch (error) {
      console.error('Belge ağı alınamadı:', error);
      return { nodes: [], relationships: [] };
    }
  };

  // Benzer belgeleri bulma
  const findSimilarDocuments = async (documentId: string, limit: number = 10) => {
    try {
      return await supabaseService.findSimilarDocuments(documentId, limit);
    } catch (error) {
      console.error('Benzer belge arama hatası:', error);
      return [];
    }
  };

  // Sonuçları temizleme
  const clearResults = () => {
    setSearchState(prev => ({
      ...prev,
      supabaseResults: [],
      searchDecision: null,
      aiAnalysis: null,
      error: null,
      lastQuery: '',
      lastFilters: {}
    }));
  };

  // İlk yükleme
  useEffect(() => {
    loadInitialData();
  }, []);

  return {
    // State
    ...searchState,
    connectionState,
    availableOptions,

    // Actions
    configureServices,
    testConnections,
    search,
    vectorSearch,
    advancedSearch,
    getDocumentNetwork,
    findSimilarDocuments,
    clearResults,
    loadInitialData,

    // Computed values
    isAnyDatabaseConnected: Object.values(connectionState).some(status => status === 'connected'),
  totalResults: searchState.supabaseResults.length,
  hasResults: searchState.supabaseResults.length > 0
  };
}
