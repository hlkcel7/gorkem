import { useQuery } from '@tanstack/react-query';
import { supabaseService } from '../services/supabase';

export interface InfoCenterPageResult {
  rows: any[];
  total: number;
}

export function useInfoCenterPage(opts: {
  pageIndex: number;
  pageSize: number;
  search?: string;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
}) {
  const { pageIndex, pageSize, search, sortField, sortOrder } = opts;
  return useQuery({
    queryKey: [
      'info-center-page',
      pageIndex,
      pageSize,
      search ?? null,
      sortField ?? 'letter_date',
      sortOrder ?? 'desc'
    ],
    queryFn: async () => {
      // @ts-ignore
      const client = (supabaseService as any).client;
      if (!client) throw new Error('Supabase client not configured');

      const selectFields = 'letter_no,letter_date,short_desc,ref_letters,severity_rate,keywords,weburl';
      const start = pageIndex * pageSize;
      const end = start + pageSize - 1;

      const qb: any = (client as any).from('documents').select(selectFields, { count: 'exact' });
      if (search && String(search).trim().length > 0) qb.ilike('content', `%${String(search).trim()}%`);
      const orderField = sortField || 'letter_date';
      const ascending = sortOrder === 'asc';
      const { data, count, error, status } = await qb.order(orderField, { ascending }).range(start, end);
      if (error) {
        if (status === 416) return { rows: [], total: count ?? 0 };
        throw error;
      }
      const rows = (data || []).map((r: any) => ({ ...r, web_url: r.weburl ?? r.web_url ?? null }));
      return { rows, total: typeof count === 'number' ? count : rows.length } as InfoCenterPageResult;
    },
    staleTime: 30 * 1000
  });
}