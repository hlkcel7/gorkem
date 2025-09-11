// Runtime configuration for the application
// This file is loaded by the browser and provides configuration values
// that can be set at deployment time without rebuilding the app
window.__APP_CONFIG__ = window.__APP_CONFIG__ || {
  // Production server URL - update this for your deployment
  API_BASE_URL: "http://gorkemprojetakip.com.tr",
  
  // Firebase configuration
  VITE_FIREBASE_API_KEY: "", // GERÇEK API KEY KALDIRILDI
  VITE_FIREBASE_AUTH_DOMAIN: "gorkemapp.firebaseapp.com", 
  VITE_FIREBASE_PROJECT_ID: "gorkemapp",
  VITE_FIREBASE_APP_ID: "1:216254903525:web:bdd3e3de632fbe66b3900c",
  VITE_FIREBASE_MEASUREMENT_ID: "G-PRM08VZW5T",
  
  // Google Sheets API configuration
  GOOGLE_CLIENT_ID: "", // GERÇEK CLIENT ID KALDIRILDI
  GOOGLE_PROJECT_ID: "gorkeminsaat",
  GOOGLE_SPREADSHEET_ID: "1gOjceZ4DxORlbD1rTiGxgxoATvmKLVsIhyeE8UPtdlU",
  
  // Supabase configuration
  SUPABASE_URL: "https://ymivsbikxiosrdtnnuax.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltaXZzYmlreGlvc3JkdG5udWF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczMTc2MDksImV4cCI6MjA3Mjg5MzYwOX0.4Gc2saAw27WX8w78lu8LYr_ad6pRZWTrmC_zBxZGhWE",
  
  // DeepSeek AI configuration
  DEEPSEEK_API_KEY: "", // Gerçek DeepSeek API anahtarınızı buraya yazın
  
  // OpenAI configuration for vector search
  OPENAI_API_KEY: "", // GERÇEK API KEY KALDIRILDI - GÜVENLİK
};
