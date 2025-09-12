// Development-only Supabase test credentials.
// This file is intended for local testing only. Do NOT commit real secrets to the repo.
// You can replace the values below with the test URL and anon key you provided.

// Vite exposes env vars via import.meta.env. Use VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY in .env.
const viteUrl = (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.VITE_SUPABASE_URL) || '';
const viteAnon = (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.VITE_SUPABASE_ANON_KEY) || '';

export const DEV_SUPABASE_CONFIG = {
  url: viteUrl || process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL || 'https://ymivsbikxiosrdtnnuax.supabase.co/',
  anonKey: viteAnon || process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltaXZzYmlreGlvc3JkdG5udWF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczMTc2MDksImV4cCI6MjA3Mjg5MzYwOX0.4Gc2saAw27WX8w78lu8LYr_ad6pRZWTrmC_zBxZGhWE'
};
