import { useQuery } from '@tanstack/react-query';
import { supabaseService } from '../services/supabase';

export interface InfoCenterRecord {
  letter_no?: string;
  letter_date?: string;
  short_desc?: string;
  ref_letters?: string;
  severity_rate?: string;
  keywords?: string;
  weburl?: string;
}

export function useInfoCenterData(limit = 200) {
  return useQuery({
    queryKey: ['info-center', limit],
    queryFn: async () => {
      // Ensure supabase client configured by higher-level code (App or hooks)
      try {
        // Use the internal client if available
        // @ts-ignore
        const client = (supabaseService as any).client;
        if (!client) {
          throw new Error('Supabase client not configured');
        }

        const { data, error } = await client
          .from('documents')
          .select('letter_no,letter_date,short_desc,ref_letters,severity_rate,keywords,weburl')
          .order('letter_date', { ascending: false })
          .limit(limit);

        if (error) throw error;
        return (data || []) as InfoCenterRecord[];
      } catch (err) {
        console.error('Info Center fetch error:', err);
        throw err;
      }
    },
    staleTime: 60 * 1000,
    retry: 1,
  });
}
