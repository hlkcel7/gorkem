-- Kullanıcı Ayarları Tablosu Oluşturma
CREATE TABLE IF NOT EXISTS user_settings (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL, -- Kullanıcının benzersiz kimliği (Firebase UID)
  settings JSONB NOT NULL DEFAULT '{}'::jsonb, -- Tüm ayarlar JSON olarak saklanır
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id)
);

-- RLS Politikaları (Row Level Security)
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar sadece kendi ayarlarını okuyabilir
CREATE POLICY "Users can read their own settings" ON user_settings
  FOR SELECT USING (auth.uid()::text = user_id);

-- Kullanıcılar sadece kendi ayarlarını ekleyebilir
CREATE POLICY "Users can insert their own settings" ON user_settings
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Kullanıcılar sadece kendi ayarlarını güncelleyebilir
CREATE POLICY "Users can update their own settings" ON user_settings
  FOR UPDATE USING (auth.uid()::text = user_id);

-- Stored Procedure: Kullanıcı Ayarlarını Getirme veya Oluşturma
CREATE OR REPLACE FUNCTION get_or_create_user_settings(p_user_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_settings JSONB;
BEGIN
  -- Mevcut ayarları kontrol et
  SELECT settings INTO v_settings FROM user_settings 
  WHERE user_id = p_user_id;
  
  -- Eğer ayarlar yoksa, yeni bir kayıt oluştur
  IF v_settings IS NULL THEN
    INSERT INTO user_settings (user_id, settings)
    VALUES (p_user_id, '{}'::jsonb)
    RETURNING settings INTO v_settings;
  END IF;
  
  RETURN v_settings;
END;
$$;

-- Stored Procedure: Kullanıcı Ayarlarını Güncelleme
CREATE OR REPLACE FUNCTION update_user_settings(p_user_id TEXT, p_settings JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_settings JSONB;
BEGIN
  -- Upsert: Varsa güncelle, yoksa ekle
  INSERT INTO user_settings (user_id, settings, updated_at)
  VALUES (p_user_id, p_settings, now())
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    settings = p_settings,
    updated_at = now()
  RETURNING settings INTO v_settings;
  
  RETURN v_settings;
END;
$$;

-- Better merge/update helper: merge incoming JSON with existing settings
-- This function merges keys from p_settings into existing settings (overwriting only provided keys)
-- Use this when the frontend sends only the changed fields (so other stored keys such as API keys are not erased)
CREATE OR REPLACE FUNCTION merge_update_user_settings(p_user_id TEXT, p_settings JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_settings JSONB;
BEGIN
  -- Upsert with merge: existing_settings || new_settings (new overrides existing for same keys)
  INSERT INTO user_settings (user_id, settings, updated_at)
  VALUES (p_user_id, p_settings, now())
  ON CONFLICT (user_id)
  DO UPDATE SET
    settings = user_settings.settings || EXCLUDED.settings,
    updated_at = now()
  RETURNING settings INTO v_settings;

  RETURN v_settings;
END;
$$;

-- Indexes to speed lookups (user_id exact match and JSONB queries)
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_settings_gin ON user_settings USING gin (settings);

-- NOTES on security and auth mapping:
-- 1) The RLS policies above use auth.uid(), which only works when users authenticate via Supabase Auth.
--    If your app uses Firebase Auth (Firebase UID), auth.uid() in Postgres won't match that value.
--    Options:
--      a) Use Supabase Auth so auth.uid() maps automatically and RLS works as intended.
--      b) Keep Firebase Auth but perform DB reads/writes through a trusted server (Edge Function
--         or backend) that verifies the Firebase ID token, then calls these stored procedures using
--         the Supabase service role key (server-side only). Do NOT embed service role key in client.
--      c) Implement a secure token exchange so Supabase can recognize Firebase UIDs as auth.uid() via
--         custom JWT mapping (advanced).
-- 2) Storing API keys in DB JSONB is functionally fine, but for sensitive keys consider encrypting
--    them at rest (pgcrypto) or keeping them server-side only and not in the browser-accessible flow.
