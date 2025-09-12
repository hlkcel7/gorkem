import { createClient } from '@supabase/supabase-js';

async function run() {
  try {
    const { DEV_SUPABASE_CONFIG } = await import('../client/src/dev-supabase-config.js');
    if (!DEV_SUPABASE_CONFIG?.url || !DEV_SUPABASE_CONFIG?.anonKey) {
      console.error('No DEV_SUPABASE_CONFIG found. Aborting.');
      process.exit(1);
    }

    const supabase = createClient(DEV_SUPABASE_CONFIG.url, DEV_SUPABASE_CONFIG.anonKey, {
      auth: { persistSession: false }
    });

    console.log('Requesting up to 20000 rows from documents...');
    const start = Date.now();
    const { data, error, status, statusText, count } = await supabase
      .from('documents')
      .select('id', { count: 'exact' })
      .order('letter_date', { ascending: false })
      .limit(20000);

    const took = Date.now() - start;
    if (error) {
      console.error('Error from Supabase:', error, 'status:', status, statusText);
    }

    console.log('Returned rows:', (data || []).length, 'took(ms):', took);
    if (typeof count !== 'undefined') console.log('Total count reported by supabase (if provided):', count);
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

run();
