#!/bin/bash

# Supabase User Settings Migration - REST API ile
# Bu script Supabase REST API kullanarak user_settings tablosunu oluşturur

SUPABASE_URL="https://ymivsbikxiosrdtnnuax.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltaXZzYmlreGlvc3JkdG5udWF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczMTc2MDksImV4cCI6MjA3Mjg5MzYwOX0.4Gc2saAw27WX8w78lu8LYr_ad6pRZWTrmC_zBxZGhWE"

echo "🚀 User Settings Migration başlıyor..."
echo ""

# REST API ile SQL çalıştırmak için gerekli servis hesabı key'ine ihtiyaç var
# Anon key ile DDL komutları çalıştırılamaz

echo "⚠️  Güvenlik nedeniyle REST API ile DDL komutları çalıştırılamaz."
echo "📋 Manuel olarak aşağıdaki adımları izleyin:"
echo ""
echo "1. 🌐 Supabase Dashboard'a gidin: https://app.supabase.com"
echo "2. 📂 Projenizi seçin (ymivsbikxiosrdtnnuax)"
echo "3. 🛠️  Sol menüden 'SQL Editor' seçeneğine tıklayın"
echo "4. 📝 Aşağıdaki SQL kodunu kopyalayıp yapıştırın:"
echo ""
echo "=== SQL KODLARI ==="
cat db/user_settings_migration.sql
echo ""
echo "==================="
echo ""
echo "5. ▶️  'Run' butonuna tıklayın"
echo "6. ✅ Başarılı olduğunu kontrol edin"
echo ""

# Test için basit bir kontrol yapalım
echo "🧪 Mevcut durumu kontrol ediliyor..."

# user_settings tablosunun var olup olmadığını kontrol et
response=$(curl -s \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  "$SUPABASE_URL/rest/v1/user_settings?select=count&limit=1" 2>/dev/null)

if echo "$response" | grep -q "\"count\""; then
  echo "✅ user_settings tablosu zaten mevcut!"
  echo "📊 Tablo test edilebilir durumda."
else
  echo "❌ user_settings tablosu henüz oluşturulmamış."
  echo "👆 Yukarıdaki adımları takip ederek tabloyu oluşturun."
fi

echo ""
echo "💡 Manuel oluşturma tamamlandıktan sonra şu script ile test edebilirsiniz:"
echo "   node test-user-settings.cjs"
