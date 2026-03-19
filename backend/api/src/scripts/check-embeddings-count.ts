import 'dotenv/config';
import { getSupabaseAdmin } from '../config/supabase';

async function checkCounts() {
  const admin = getSupabaseAdmin();
  const [rackets, reviews, knowledge] = await Promise.all([
    admin.from('racket_embeddings').select('*', { count: 'exact', head: true }),
    admin.from('review_embeddings').select('*', { count: 'exact', head: true }),
    admin.from('knowledge_embeddings').select('*', { count: 'exact', head: true }),
  ]);

  console.log('--- Vector Store Stats ---');
  console.log('Racket Embeddings:', rackets.count || 0);
  console.log('Review Embeddings:', reviews.count || 0);
  console.log('Knowledge Chunks:', knowledge.count || 0);
}

checkCounts();
