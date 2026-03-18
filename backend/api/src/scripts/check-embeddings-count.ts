import 'dotenv/config';
import { supabaseAdmin } from '../config/supabase';

async function checkCounts() {
  const [rackets, reviews, knowledge] = await Promise.all([
    supabaseAdmin.from('racket_embeddings').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('review_embeddings').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('knowledge_embeddings').select('*', { count: 'exact', head: true }),
  ]);

  console.log('--- Vector Store Stats ---');
  console.log('Racket Embeddings:', rackets.count || 0);
  console.log('Review Embeddings:', reviews.count || 0);
  console.log('Knowledge Chunks:', knowledge.count || 0);
}

checkCounts();
