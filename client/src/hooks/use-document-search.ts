import { useState, useEffect, useCallback } from 'react';
import { supabaseService } from '../services/supabase';

interface SearchResult {
  id: string;
  title: string;
  content: string;
  score: number;
  date: string;
}

interface UseDocumentSearchReturn {
  loading: boolean;
  error: string | null;
  isAnyDatabaseConnected: boolean;
  totalResults: number;
  hasResults: boolean;
  results: SearchResult[];
  search: (query?: string) => Promise<void>;
  clearResults: () => void;
  configureServices: () => Promise<void>;
}

export function useDocumentSearch(): UseDocumentSearchReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isAnyDatabaseConnected, setIsAnyDatabaseConnected] = useState(false);

  const configureServices = useCallback(async () => {
    try {
      // Use dev config as a fallback
      const { DEV_SUPABASE_CONFIG } = await import('../dev-supabase-config');
      
      // Load config from environment, local storage, or dev config
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 
                         localStorage.getItem('supabase_url') || 
                         DEV_SUPABASE_CONFIG.url;
      
      const supabaseKey = import.meta.env.VITE_SUPABASE_KEY || 
                         localStorage.getItem('supabase_key') || 
                         DEV_SUPABASE_CONFIG.anonKey;
      
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase bağlantı bilgileri bulunamadı');
      }

      // Configure Supabase
      supabaseService.configure({
        url: supabaseUrl,
        anonKey: supabaseKey
      });

      // Test connection
      const isConnected = await supabaseService.testConnection();
      setIsAnyDatabaseConnected(isConnected);
      
      if (isConnected) {
        console.log('✅ Global: Servisler başarıyla otomatik konfigüre edildi');
      } else {
        throw new Error('Veritabanı bağlantısı başarısız');
      }
    } catch (error) {
      console.error('❌ Servis konfigürasyon hatası:', error);
      setError(error instanceof Error ? error.message : 'Servis konfigürasyonu başarısız');
      setIsAnyDatabaseConnected(false);
    }
  }, []);

  const search = async (query?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // TODO: Implement actual search logic
      // This is just a placeholder
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setResults([
        {
          id: '1',
          title: 'Sample Document',
          content: 'This is a sample search result',
          score: 0.95,
          date: new Date().toISOString()
        }
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Arama sırasında bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setResults([]);
    setError(null);
  };

  return {
    loading,
    error,
    isAnyDatabaseConnected,
    totalResults: results.length,
    hasResults: results.length > 0,
    results,
    search,
    clearResults,
    configureServices
  };
}