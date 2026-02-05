-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create documents table with vector embeddings
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  total_chunks INTEGER NOT NULL,
  source_file TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  embedding vector(768), -- Gemini text-embedding-004 produces 768 dimensions
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for vector similarity search (cosine distance)
CREATE INDEX IF NOT EXISTS documents_embedding_idx
  ON documents
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Create index for source file lookups
CREATE INDEX IF NOT EXISTS documents_source_file_idx ON documents(source_file);

-- Create index for full-text search (optional, for hybrid search)
CREATE INDEX IF NOT EXISTS documents_content_idx ON documents USING gin(to_tsvector('english', content));

-- Create saved_content table for storing generated materials
CREATE TABLE IF NOT EXISTS saved_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  content_type TEXT DEFAULT 'learning_objectives',
  metadata JSONB DEFAULT '{}'::jsonb,
  source_documents UUID[] DEFAULT ARRAY[]::UUID[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for content type filtering
CREATE INDEX IF NOT EXISTS saved_content_type_idx ON saved_content(content_type);

-- Create index for created_at for sorting
CREATE INDEX IF NOT EXISTS saved_content_created_at_idx ON saved_content(created_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for documents table
CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for saved_content table
CREATE TRIGGER update_saved_content_updated_at
  BEFORE UPDATE ON saved_content
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function for vector similarity search
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(768),
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  chunk_index INTEGER,
  source_file TEXT,
  metadata JSONB,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    documents.id,
    documents.title,
    documents.content,
    documents.chunk_index,
    documents.source_file,
    documents.metadata,
    1 - (documents.embedding <=> query_embedding) AS similarity
  FROM documents
  WHERE 1 - (documents.embedding <=> query_embedding) > match_threshold
  ORDER BY documents.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Create a view for document statistics
CREATE OR REPLACE VIEW document_stats AS
SELECT
  source_file,
  COUNT(*) as chunk_count,
  MAX(total_chunks) as total_chunks,
  MIN(created_at) as first_ingested,
  MAX(updated_at) as last_updated
FROM documents
GROUP BY source_file;

-- Grant permissions (adjust based on your RLS policies)
-- For now, using service role key so these aren't strictly necessary
-- but good practice for production

-- Add comments for documentation
COMMENT ON TABLE documents IS 'Stores document chunks with vector embeddings for RAG';
COMMENT ON TABLE saved_content IS 'Stores AI-generated educational content';
COMMENT ON COLUMN documents.embedding IS 'Vector embedding from Gemini text-embedding-004 (768 dimensions)';
COMMENT ON COLUMN documents.chunk_index IS 'Index of this chunk within the source document';
COMMENT ON COLUMN saved_content.source_documents IS 'Array of document IDs used to generate this content';
