import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DocumentChunk {
  title: string;
  content: string;
  chunk_index: number;
  total_chunks: number;
  source_file: string;
  metadata?: Record<string, any>;
}

// Simple text chunking function
function chunkText(
  text: string,
  chunkSize: number = 512,
  overlap: number = 50
): string[] {
  const chunks: string[] = [];
  const words = text.split(/\s+/);

  let i = 0;
  while (i < words.length) {
    const chunk = words.slice(i, i + chunkSize).join(' ');
    chunks.push(chunk);
    i += chunkSize - overlap;
  }

  return chunks;
}

// Clean and normalize text
function cleanText(text: string): string {
  return text
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/\n\s*\n/g, '\n\n') // Normalize paragraph breaks
    .trim();
}

// Generate embedding using official Google API format
async function generateEmbedding(
  apiKey: string,
  text: string
): Promise<number[]> {
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent';

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey
    },
    body: JSON.stringify({
      model: 'models/gemini-embedding-001',
      content: { parts: [{ text }] },
      outputDimensionality: 768
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Embedding API error: ${error}`);
  }

  const data = await response.json();
  return data.embedding.values;
}

// Process and store a document
async function processDocument(
  supabase: any,
  geminiApiKey: string,
  document: {
    title: string;
    content: string;
    source_file: string;
    metadata?: Record<string, any>;
  }
): Promise<any> {
  try {
    const { title, content, source_file, metadata = {} } = document;

    // Clean the text
    const cleanedContent = cleanText(content);

    // Check if document already exists
    const { data: existing } = await supabase
      .from('documents')
      .select('id')
      .eq('source_file', source_file)
      .limit(1);

    if (existing && existing.length > 0) {
      return {
        success: false,
        message: `Document ${source_file} already exists. Delete it first if you want to re-ingest.`,
        source_file
      };
    }

    // Chunk the content
    const chunks = chunkText(cleanedContent, 512, 50);
    const totalChunks = chunks.length;

    console.log(`Processing ${totalChunks} chunks for ${source_file}`);

    // Process each chunk
    const processedChunks = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];

      // Generate embedding
      const embedding = await generateEmbedding(geminiApiKey, chunk);

      processedChunks.push({
        title,
        content: chunk,
        chunk_index: i,
        total_chunks: totalChunks,
        source_file,
        metadata: {
          ...metadata,
          word_count: chunk.split(/\s+/).length,
          char_count: chunk.length
        },
        embedding
      });

      // Log progress
      if ((i + 1) % 10 === 0) {
        console.log(`Processed ${i + 1}/${totalChunks} chunks`);
      }
    }

    // Insert all chunks into database
    const { data, error } = await supabase
      .from('documents')
      .insert(processedChunks)
      .select('id');

    if (error) {
      console.error('Error inserting documents:', error);
      throw error;
    }

    return {
      success: true,
      message: `Successfully ingested document: ${title}`,
      source_file,
      chunks_created: totalChunks,
      document_ids: data.map((d: any) => d.id)
    };

  } catch (error) {
    console.error('Error processing document:', error);
    return {
      success: false,
      error: error.message,
      source_file: document.source_file
    };
  }
}

// Batch process multiple documents
async function batchProcessDocuments(
  supabase: any,
  geminiApiKey: string,
  documents: any[]
): Promise<any[]> {
  const results = [];

  for (const doc of documents) {
    const result = await processDocument(supabase, geminiApiKey, doc);
    results.push(result);

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return results;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const { documents, document } = body;

    let results;

    if (documents && Array.isArray(documents)) {
      // Batch processing
      results = await batchProcessDocuments(supabase, geminiApiKey, documents);
    } else if (document) {
      // Single document processing
      results = await processDocument(supabase, geminiApiKey, document);
    } else {
      throw new Error('Either "document" or "documents" array is required');
    }

    return new Response(
      JSON.stringify({
        success: true,
        results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in ingest function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        details: error.stack
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
