import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import pdfParse from 'pdf-parse';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DOCS_PATH = process.env.DOCS_PATH || '../docs';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables');
  console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env file');
  process.exit(1);
}

// Read a text file
function readTextFile(filePath) {
  return fs.readFileSync(filePath, 'utf-8');
}

// Read a PDF file
async function readPDFFile(filePath) {
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdfParse(dataBuffer);
  return data.text;
}

// Get all text files from directory
function getDocumentFiles(dirPath) {
  const fullPath = path.resolve(__dirname, dirPath);

  if (!fs.existsSync(fullPath)) {
    console.error(`❌ Directory not found: ${fullPath}`);
    return [];
  }

  const files = fs.readdirSync(fullPath);
  return files
    .filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.txt', '.md', '.pdf'].includes(ext);
    })
    .map(file => path.join(fullPath, file));
}

// Extract title from filename
function getTitleFromFilename(filename) {
  return path.basename(filename, path.extname(filename))
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}

// Call the ingest Edge Function
async function ingestDocument(document) {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/ingest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': SUPABASE_SERVICE_ROLE_KEY
      },
      body: JSON.stringify({ document })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }

    const result = await response.json();
    return result.results;
  } catch (error) {
    console.error(`❌ Error ingesting document:`, error.message);
    return { success: false, error: error.message };
  }
}

// Main ingestion process
async function main() {
  console.log('🚀 Starting document ingestion...\n');

  console.log(`📁 Looking for documents in: ${DOCS_PATH}`);
  const files = getDocumentFiles(DOCS_PATH);

  if (files.length === 0) {
    console.log('⚠️  No documents found.');
    console.log('💡 Please place .txt or .md files in the docs/ directory');
    console.log('   Or update the DOCS_PATH in your .env file');
    return;
  }

  console.log(`📄 Found ${files.length} documents\n`);

  const results = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const filename = path.basename(file);

    console.log(`[${i + 1}/${files.length}] Processing: ${filename}`);

    try {
      // Read file based on extension
      const ext = path.extname(file).toLowerCase();
      let content;

      if (ext === '.pdf') {
        content = await readPDFFile(file);
      } else {
        content = readTextFile(file);
      }

      const title = getTitleFromFilename(filename);

      const document = {
        title,
        content,
        source_file: filename,
        metadata: {
          file_path: file,
          file_size: content.length,
          ingested_at: new Date().toISOString()
        }
      };

      const result = await ingestDocument(document);
      results.push({ filename, result });

      if (result.success) {
        console.log(`  ✓ Success: ${result.chunks_created} chunks created`);
      } else {
        console.log(`  ✗ Failed: ${result.error || result.message}`);
      }

      // Small delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (error) {
      console.error(`  ✗ Error: ${error.message}`);
      results.push({ filename, result: { success: false, error: error.message } });
    }

    console.log('');
  }

  // Summary
  console.log('━'.repeat(50));
  console.log('📊 Ingestion Summary\n');

  const successful = results.filter(r => r.result.success).length;
  const failed = results.filter(r => !r.result.success).length;
  const totalChunks = results
    .filter(r => r.result.success)
    .reduce((sum, r) => sum + (r.result.chunks_created || 0), 0);

  console.log(`✓ Successful: ${successful}/${files.length}`);
  console.log(`✗ Failed: ${failed}/${files.length}`);
  console.log(`📦 Total chunks created: ${totalChunks}`);

  if (failed > 0) {
    console.log('\n❌ Failed documents:');
    results
      .filter(r => !r.result.success)
      .forEach(r => {
        console.log(`  - ${r.filename}: ${r.result.error || r.result.message}`);
      });
  }

  console.log('\n✅ Ingestion complete!');
}

// Run the script
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
