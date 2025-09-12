import { useQuery } from '@tanstack/react-query';
import { supabaseService } from '../services/supabase';

export interface InfoCenterRecord {
  letter_no?: string;
  letter_date?: string;
  short_desc?: string;
  ref_letters?: string;
  severity_rate?: string;
  keywords?: string;
  web_url?: string;
}

export function useInfoCenterData(limit = 20000, search?: string) {
  return useQuery({
    queryKey: ['info-center', limit, search ?? null],
    queryFn: async () => {
      // Ensure supabase client configured by higher-level code (App or hooks)
      try {
        // Use the internal client if available
        // @ts-ignore
        const client = (supabaseService as any).client;
        if (!client) {
          throw new Error('Supabase client not configured');
        }

        // Build select fields
        const selectFields = 'letter_no,letter_date,short_desc,ref_letters,severity_rate,keywords,weburl';

        const CHUNK = 1000; // Supabase/PostgREST often caps single requests around 1000 rows
        const desired = Number(limit) || CHUNK;

        if (desired <= CHUNK) {
          // Single request is fine
          const qb: any = (client as any).from('documents').select(selectFields);
          if (search && String(search).trim().length > 0) {
            qb.ilike('content', `%${String(search).trim()}%`);
          }
          const { data, error } = await qb.order('letter_date', { ascending: false }).limit(desired);
          if (error) throw error;
          const normalized = (data || []).map((r: any) => ({ ...r, web_url: r.weburl ?? r.web_url ?? null }));
          return normalized as InfoCenterRecord[];
        }

        // For large requests, fetch in pages using range to avoid server-side caps
        let all: any[] = [];
        let offset = 0;
        while (all.length < desired) {
          const end = Math.min(offset + CHUNK - 1, desired - 1);
          const qbPage: any = (client as any).from('documents').select(selectFields);
          if (search && String(search).trim().length > 0) {
            qbPage.ilike('content', `%${String(search).trim()}%`);
          }
          const { data, error } = await qbPage.order('letter_date', { ascending: false }).range(offset, end);
          if (error) {
            // PostgREST returns 416 when offset is out of range; handle gracefully
            const status = (error as any)?.status || (error as any)?.statusCode || null;
            if (status === 416 || String((error as any)?.message || '').toLowerCase().includes('range')) {
              // no more data at this offset — stop paging
              break;
            }
            throw error;
          }
          if (!data || data.length === 0) break;
          all = all.concat(data);
          if (data.length < CHUNK) break; // no more pages
          offset += CHUNK;
          // safety: avoid infinite loop
          if (all.length > desired + CHUNK) break;
        }

        const normalized = all.slice(0, desired).map((r: any) => ({ ...r, web_url: r.weburl ?? r.web_url ?? null }));
        return normalized as InfoCenterRecord[];
      } catch (err) {
        console.error('Info Center fetch error:', err);
        throw err;
      }
    },
    staleTime: 60 * 1000,
    retry: 1,
  });
}
