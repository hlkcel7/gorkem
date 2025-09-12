import { createClient } from '@supabase/supabase-js';

async function run() {
  try {
    // Load dev config from client code path
    const { DEV_SUPABASE_CONFIG } = await import('../client/src/dev-supabase-config.js');

    if (!DEV_SUPABASE_CONFIG?.url || !DEV_SUPABASE_CONFIG?.anonKey) {
      console.error('No DEV_SUPABASE_CONFIG found. Aborting.');
      process.exit(1);
    }

    console.log('Using Supabase URL:', DEV_SUPABASE_CONFIG.url);

    const supabase = createClient(DEV_SUPABASE_CONFIG.url, DEV_SUPABASE_CONFIG.anonKey, {
      auth: { persistSession: false }
    });

    console.log('Testing connection: fetching up to 5 rows from documents...');
    const { data, error } = await supabase.from('documents').select('*').limit(5);
    if (error) {
      console.error('Error when querying documents:', error);
      process.exit(2);
    }

    console.log('Fetched rows count:', (data || []).length);
    console.log('Sample rows:');
    console.log(JSON.stringify(data, null, 2));

    process.exit(0);
  } catch (err) {
    console.error('Unexpected error:', err);
    process.exit(3);
  }
}

run();
