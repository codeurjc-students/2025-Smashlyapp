import 'dotenv/config';
import { supabaseAdmin } from '../config/supabase';

async function inspectTable() {
  const { data, error } = await supabaseAdmin.rpc('get_table_info', {
    table_name: 'racket_embeddings',
  });
  // Since I don't have get_table_info, I'll use a raw query if possible or check for specific error

  const testUpsert = await supabaseAdmin
    .from('racket_embeddings')
    .upsert(
      { racket_id: 1, content: 'test', embedding: new Array(1536).fill(0) },
      { onConflict: 'racket_id' }
    );

  if (testUpsert.error) {
    console.error('Upsert Error:', testUpsert.error);
  } else {
    console.log('Upsert Success');
  }
}

inspectTable();
