import { supabaseService } from './supabase';

export interface GraphNode {
  id: string;
  label: string;
  type: 'document';
  data: {
    docId: string;
    letterNo: string;
    date: string;
    webUrl?: string;
  };
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: 'reference';
}

interface DocumentDetails {
  id: number;
  letter_no?: string;
  letter_date?: string;
  ref_letters?: string;
  weburl?: string;
}

class GraphService {
  // ID tiplerini dönüştürme yardımcı fonksiyonu
  private normalizeDocumentId(docId: string | number): string {
    // Eğer sayısal bir string ise (örn: "123")
    if (/^\d+$/.test(docId.toString())) {
      return docId.toString();
    }
    
    // Eğer internal_no formatında ise (örn: "IC-AD-366")
    return docId.toString();
  }
  
  private async getDocumentById(docId: string): Promise<DocumentDetails | null> {
    try {
      const client = supabaseService.getClient();
      if (!client) {
        throw new Error('Veritabanı bağlantısı başlatılmadı');
      }

      // Önce internal_no ile deneyelim (örn: "IC-AD-366" formatı için)
      const { data: dataByInternalNo, error: errorByInternalNo } = await client
        .from('documents')
        .select('*')
        .eq('internal_no', this.normalizeDocumentId(docId))
        .maybeSingle();

      if (dataByInternalNo) {
        return dataByInternalNo;
      }

      // Eğer sayısal ID ise ve internal_no ile bulunamadıysa, ID ile deneyelim
      if (/^\d+$/.test(docId)) {
        const { data, error } = await client
          .from('documents')
          .select('*')
          .eq('id', parseInt(docId))
          .single();

        if (error) {
          console.error('Supabase sorgu hatası:', error);
          throw new Error(`Belge getirilemedi: ${error.message}`);
        }

        return data;
      }

      // Her iki durumda da bulunamadı
      throw new Error(`${docId} ID'li veya numaralı belge bulunamadı`);

      if (error) {
        console.error('Supabase sorgu hatası:', error);
        throw new Error(`Belge getirilemedi: ${error.message}`);
      }

      if (!data) {
        throw new Error(`${docId} ID'li belge bulunamadı`);
      }

      return data;
    } catch (error) {
      console.error('Belge getirme hatası:', error);
      throw error;
    }
  }

  private parseRefLetters(refLetters?: string): string[] {
    if (!refLetters) return [];
    // ref_letters'dan ID'leri ayır ve temizle
    return refLetters.split(',')
      .map(ref => ref.trim())
      .filter(Boolean)
      .map(ref => this.normalizeDocumentId(ref)); // ID'leri normalize et
  }

  async buildDocumentGraph(rootDocId: string, maxDepth: number = 3): Promise<{nodes: GraphNode[], edges: GraphEdge[]}> {
    const nodes: Map<string, GraphNode> = new Map();
    const edges: GraphEdge[] = [];
    const processed = new Set<string>();

    const processDocument = async (docId: string, depth: number): Promise<void> => {
      if (depth > maxDepth || processed.has(docId)) return;
      processed.add(docId);

      try {
        const doc = await this.getDocumentById(docId);
        if (!doc) {
          console.warn(`${docId} ID'li belge bulunamadı veya erişilemedi`);
          return;
        }

        // Düğümü ekle
        nodes.set(docId, {
          id: docId,
          label: doc.letter_no || `Belge #${doc.id}`,
          type: 'document',
          data: {
            docId: docId,
            letterNo: doc.letter_no || `Belge #${doc.id}`,
            date: doc.letter_date || 'Tarih yok',
            webUrl: doc.weburl
          }
        });

        // Referansları işle
        const refs = this.parseRefLetters(doc.ref_letters);
        for (const refId of refs) {
          // Kenar ekle
          edges.push({
            id: `${docId}-${refId}`,
            source: docId,
            target: refId,
            type: 'reference'
          });

          // Referans verilen belgeyi işle
          await processDocument(refId, depth + 1);
        }
      } catch (error) {
        console.error(`Belge işleme hatası (${docId}):`, error);
      }
    };

    try {
      await processDocument(rootDocId, 0);

      const graphNodes = Array.from(nodes.values());
      if (graphNodes.length === 0) {
        throw new Error('Graf oluşturulamadı: Hiç belge bulunamadı');
      }

      return {
        nodes: graphNodes,
        edges
      };
    } catch (error) {
      console.error('Graf oluşturma hatası:', error);
      throw new Error(`Graf oluşturulurken hata oluştu: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
    }
  }

  async getDocumentDetails(docId: string): Promise<DocumentDetails | null> {
    return this.getDocumentById(docId);
  }
}

export const graphService = new GraphService();