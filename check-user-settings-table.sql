-- Supabase'de User Settings Tablosunu Kontrol Etme

-- 1. Tablo oluşturulmuş mu?
SELECT * FROM information_schema.tables 
WHERE table_name = 'user_settings';

-- 2. Tablonun yapısını kontrol et
\d user_settings;

-- 3. RLS politikaları oluşturulmuş mu?
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'user_settings';

-- 4. Stored procedure'lar oluşturulmuş mu?
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name IN ('get_or_create_user_settings', 'update_user_settings');

-- 5. Test verisi ekleme (isteğe bağlı)
SELECT get_or_create_user_settings('test-user-123');

-- 6. Test ayarları güncelleme (isteğe bağlı)
SELECT update_user_settings('test-user-123', '{"test": "data", "enableAI": true}');

-- 7. Test verilerini görüntüleme
SELECT * FROM user_settings WHERE user_id = 'test-user-123';
