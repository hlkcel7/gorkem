-- Supabase Vector Search RPC Functions
-- Bu SQL'i Supabase SQL Editor'de çalıştırın

-- 1. pgvector extension'ı etkinleştir (eğer aktif değilse)
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. documents tablosuna vector index ekle (eğer yoksa)
-- Not: Bu index zaten mevcut olabilir, o durumda hata vermez
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'documents' 
        AND indexname = 'documents_embedding_idx'
    ) THEN
        CREATE INDEX documents_embedding_idx ON documents 
        USING ivfflat (embedding vector_cosine_ops)
        WITH (lists = 100);
    END IF;
END $$;

-- 3. match_documents RPC fonksiyonu
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(1536),
  similarity_threshold float DEFAULT 0.8,  -- Daha iyi kalite için yükseltildi
  match_count int DEFAULT 10000  -- Sınır kaldırıldı
)
RETURNS TABLE (
  id uuid,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    documents.id,
    documents.content,
    documents.metadata,
    1 - (documents.embedding <=> query_embedding) AS similarity
  FROM documents
  WHERE documents.embedding IS NOT NULL
    AND 1 - (documents.embedding <=> query_embedding) > similarity_threshold
  ORDER BY documents.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 4. find_similar_documents RPC fonksiyonu
CREATE OR REPLACE FUNCTION find_similar_documents(
  document_id uuid,
  similarity_threshold float DEFAULT 0.8,  -- Daha iyi kalite için yükseltildi
  match_count int DEFAULT 10000  -- Sınır kaldırıldı
)
RETURNS TABLE (
  id uuid,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
DECLARE
  source_embedding vector(1536);
BEGIN
  -- Kaynak belgenin embedding'ini al
  SELECT embedding INTO source_embedding
  FROM documents
  WHERE documents.id = document_id;
  
  IF source_embedding IS NULL THEN
    RAISE EXCEPTION 'Document not found or has no embedding';
  END IF;
  
  RETURN QUERY
  SELECT
    documents.id,
    documents.content,
    documents.metadata,
    1 - (documents.embedding <=> source_embedding) AS similarity
  FROM documents
  WHERE documents.id != document_id
    AND documents.embedding IS NOT NULL
    AND 1 - (documents.embedding <=> source_embedding) > similarity_threshold
  ORDER BY documents.embedding <=> source_embedding
  LIMIT match_count;
END;
$$;

-- 5. Test sorgusu (opsiyonel - silmeden önce test edebilirsiniz)
-- SELECT count(*) as total_documents, 
--        count(embedding) as documents_with_embeddings
-- FROM documents;