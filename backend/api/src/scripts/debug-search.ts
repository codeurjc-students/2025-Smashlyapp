import 'dotenv/config';
import { EmbeddingService } from '../services/embeddingService';
import { getSupabaseAdmin } from '../config/supabase';

async function debugSearch() {
  const admin = getSupabaseAdmin();
  const query = 'pala de control para nivel intermedio con epicondilitis';
  console.log(`🔍 Debugging search for: "${query}"`);

  const embedding = await EmbeddingService.embed(query);
  console.log(`📏 Embedding dim: ${embedding.length}`);

  // Test match_rackets with 0 threshold
  const { data, error } = await admin.rpc('match_rackets', {
    query_embedding: embedding,
    match_threshold: 0.0, // Low threshold to see anything
    match_count: 5,
    filter_metadata: {},
  });

  if (error) {
    console.error('❌ RPC Error:', error);
  } else {
    console.log(`✅ Found ${data?.length || 0} rackets (threshold 0.0)`);
    data?.forEach((r: any) => {
      console.log(
        `Match: ${r.similarity.toFixed(4)} - ${r.metadata.brand} ${r.metadata.name || ''}`
      );
    });
  }

  // Test match_knowledge
  const { data: kData, error: kError } = await admin.rpc('match_knowledge', {
    query_embedding: embedding,
    match_threshold: 0.0,
    match_count: 3,
  });

  if (kError) {
    console.error('❌ Knowledge RPC Error:', kError);
  } else {
    console.log(`✅ Found ${kData?.length || 0} knowledge chunks (threshold 0.0)`);
    kData?.forEach((k: any) => {
      console.log(`Match: ${k.similarity.toFixed(4)} - Source: ${k.source}`);
    });
  }
}

debugSearch();
