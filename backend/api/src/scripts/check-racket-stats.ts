import { SupabaseClient, createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStats() {
  console.log('Checking racket stats...');

  const { data: rackets, error } = await supabase.from('rackets').select('*');

  if (error) {
    console.error('Error fetching rackets:', error);
    return;
  }

  const total = rackets.length;
  console.log(`Total rackets: ${total}`);

  if (total === 0) {
    console.log('No rackets found.');
    return;
  }

  // Log the first racket to inspect keys
  console.log('--- Sample Racket (First Item) ---');
  console.log(JSON.stringify(rackets[0], null, 2));

  const hasAntivib = rackets.filter(r => r.tiene_antivibracion).length;
  console.log(`With Anti-vibration: ${hasAntivib} (${Math.round((hasAntivib / total) * 100)}%)`);

  const hasWeight = rackets.filter(r => r.peso).length;
  console.log(`With Weight: ${hasWeight} (${Math.round((hasWeight / total) * 100)}%)`);

  const hasShape = rackets.filter(r => r.caracteristicas_forma).length;
  console.log(`With Shape: ${hasShape} (${Math.round((hasShape / total) * 100)}%)`);

  const hasBalance = rackets.filter(r => r.caracteristicas_balance).length;
  console.log(`With Balance: ${hasBalance} (${Math.round((hasBalance / total) * 100)}%)`);

  const hasHardness = rackets.filter(r => r.caracteristicas_dureza).length;
  console.log(`With Hardness: ${hasHardness} (${Math.round((hasHardness / total) * 100)}%)`);
}

checkStats();
