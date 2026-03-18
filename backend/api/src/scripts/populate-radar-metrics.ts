/**
 * SCRIPT: populate-radar-metrics.ts
 *
 * Calcula y persiste las 5 métricas del gráfico radar para todas las palas.
 * Los valores son DETERMINISTAS: la misma pala siempre produce el mismo resultado.
 * Esto elimina la inconsistencia de dejar que el LLM genere estos valores.
 *
 * PRE-REQUISITO: Ejecutar src/sql/add_radar_columns.sql en Supabase primero.
 *
 * USO:
 *   cd backend/api
 *   npx ts-node src/scripts/populate-radar-metrics.ts
 *   npx ts-node --project tsconfig.json src/scripts/populate-radar-metrics.ts
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// ──────────────────────────────────────────────
// Supabase client (usa las mismas env vars)
// ──────────────────────────────────────────────
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('ERROR: SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY (o SUPABASE_ANON_KEY) son requeridas.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ──────────────────────────────────────────────
// Algoritmo de cálculo determinista
// Basado en TesteaMetricsService.calculateFallbackMetrics
// pero adaptado a los nombres de columna reales de la BD (inglés)
// ──────────────────────────────────────────────

interface RadarValues {
  radar_potencia: number;
  radar_control: number;
  radar_manejabilidad: number;
  radar_punto_dulce: number;
  radar_salida_bola: number;
}

/**
 * Extrae el peso numérico de la pala desde múltiples fuentes posibles.
 * El campo puede estar en specs JSONB, como columna propia, o no existir.
 */
function extractWeight(racket: any): number {
  // Intentar campo directo
  if (typeof racket.peso === 'number' && racket.peso > 0) return racket.peso;
  if (typeof racket.weight === 'number' && racket.weight > 0) return racket.weight;

  // Intentar desde specs JSONB (el scraper puede guardarlo como "365g" o 365)
  if (racket.specs) {
    const specs = typeof racket.specs === 'string' ? JSON.parse(racket.specs) : racket.specs;
    const rawPeso = specs?.Peso || specs?.peso || specs?.Weight || specs?.weight;
    if (rawPeso) {
      const numeric = parseFloat(String(rawPeso).replace(/[^0-9.]/g, ''));
      if (!isNaN(numeric) && numeric > 0) return numeric;
    }
  }

  return 365; // fallback estándar del sector
}

/**
 * Calcula las 5 métricas radar de forma determinista a partir de las
 * características físicas de la pala.
 *
 * Escala: 0-10 donde 10 es el máximo.
 */
function calculateRadarValues(racket: any): RadarValues {
  // Normalizar a minúsculas para comparaciones seguras
  // Los nombres de columna en DB son en inglés
  const forma     = String(racket.characteristics_shape    || '').toLowerCase();
  const balance   = String(racket.characteristics_balance  || '').toLowerCase();
  const dureza    = String(racket.characteristics_hardness || '').toLowerCase();
  const peso      = extractWeight(racket);
  // antivibracion: intentar múltiples nombres de columna posibles
  const antiVib   = Boolean(racket.has_antivibration || racket.tiene_antivibracion || false);

  // ── POTENCIA (diamante+alto balance = más potencia) ──────────────────
  let potencia = 5.0;
  if (forma.includes('diamante') || forma.includes('diamond'))    potencia += 2.0;
  else if (forma.includes('lágrima') || forma.includes('lagrima') || forma.includes('drop')) potencia += 1.0;
  if (balance.includes('alto') || balance.includes('high'))       potencia += 2.0;
  else if (balance.includes('medio') || balance.includes('medium') || balance.includes('mid')) potencia += 1.0;
  if (peso > 370)   potencia += 1.0;
  if (dureza.includes('dura') || dureza.includes('hard'))         potencia += 0.5;

  // ── CONTROL (redonda+bajo balance = más control) ─────────────────────
  let control = 5.0;
  if (forma.includes('redonda') || forma.includes('round'))       control += 2.0;
  else if (forma.includes('lágrima') || forma.includes('lagrima') || forma.includes('drop')) control += 1.0;
  if (balance.includes('bajo') || balance.includes('low'))        control += 2.0;
  else if (balance.includes('medio') || balance.includes('medium') || balance.includes('mid')) control += 1.0;
  if (dureza.includes('blanda') || dureza.includes('soft'))       control += 0.5;

  // ── MANEJABILIDAD (ligera+bajo balance = más manejable) ──────────────
  let manejabilidad = 5.0;
  if (peso < 355)     manejabilidad += 2.5;
  else if (peso < 365) manejabilidad += 1.5;
  else if (peso < 370) manejabilidad += 0.5;
  if (balance.includes('bajo') || balance.includes('low'))        manejabilidad += 2.0;
  else if (balance.includes('medio') || balance.includes('medium') || balance.includes('mid')) manejabilidad += 1.0;

  // ── PUNTO DULCE (redonda=amplio, diamante=reducido) ──────────────────
  let puntoDulce = 5.0;
  if (forma.includes('redonda') || forma.includes('round'))       puntoDulce = 8.0;
  else if (forma.includes('lágrima') || forma.includes('lagrima') || forma.includes('drop')) puntoDulce = 6.0;
  else if (forma.includes('diamante') || forma.includes('diamond')) puntoDulce = 4.0;

  // ── SALIDA DE BOLA (blanda=alta, dura=baja) ──────────────────────────
  let salidaDeBola = 5.0;
  if (dureza.includes('blanda') || dureza.includes('soft'))       salidaDeBola = 8.0;
  else if (dureza.includes('media') || dureza.includes('medium') || dureza.includes('mid')) salidaDeBola = 6.0;
  else if (dureza.includes('dura') || dureza.includes('hard'))    salidaDeBola = 4.0;
  // Antivibracion mejora ligeramente la salida de bola y confort
  if (antiVib) salidaDeBola = Math.min(salidaDeBola + 0.5, 10);

  // Normalizar todo a rango [0, 10] con 1 decimal
  const clamp  = (v: number) => Math.round(Math.min(Math.max(v, 0), 10) * 10) / 10;

  return {
    radar_potencia:      clamp(potencia),
    radar_control:       clamp(control),
    radar_manejabilidad: clamp(manejabilidad),
    radar_punto_dulce:   clamp(puntoDulce),
    radar_salida_bola:   clamp(salidaDeBola),
  };
}

// ──────────────────────────────────────────────
// Ejecución principal
// ──────────────────────────────────────────────

const BATCH_SIZE = 100; // Supabase recomienda no pasar de 1000 por upsert

async function main() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║   Smashly – Populate Radar Metrics       ║');
  console.log('╚══════════════════════════════════════════╝\n');

  // 1. Obtener TODAS las palas paginando (Supabase limita a 1000 por query)
  console.log('⏳ Obteniendo palas de la base de datos...');
  const PAGE_SIZE = 1000;
  const allRackets: any[] = [];
  let page = 0;

  while (true) {
    const { data, error } = await supabase
      .from('rackets')
      .select('id, name, characteristics_shape, characteristics_balance, characteristics_hardness, specs')
      .order('id', { ascending: true })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (error) {
      console.error('ERROR al obtener palas:', error.message);
      process.exit(1);
    }

    if (!data || data.length === 0) break;
    allRackets.push(...data);
    if (data.length < PAGE_SIZE) break; // última página
    page++;
  }

  const rackets = allRackets;

  if (rackets.length === 0) {
    console.warn('⚠️  No se encontraron palas en la base de datos.');
    process.exit(0);
  }

  console.log(`✅ ${rackets.length} palas encontradas.\n`);

  // 2. Calcular métricas para cada pala
  let processed = 0;
  let errors = 0;

  // Estadísticas de distribución para validación
  const stats = { potencia: [] as number[], control: [] as number[], manejabilidad: [] as number[] };

  // Procesar en lotes usando UPDATE (los registros ya existen, no queremos INSERT)
  for (let i = 0; i < rackets.length; i += BATCH_SIZE) {
    const batch = rackets.slice(i, i + BATCH_SIZE);

    // Calcular valores y lanzar un UPDATE individual por pala en paralelo
    const results = await Promise.all(
      batch.map(async (racket: any) => {
        const values = calculateRadarValues(racket);
        stats.potencia.push(values.radar_potencia);
        stats.control.push(values.radar_control);
        stats.manejabilidad.push(values.radar_manejabilidad);

        const { error: updateError } = await supabase
          .from('rackets')
          .update({
            radar_potencia:       values.radar_potencia,
            radar_control:        values.radar_control,
            radar_manejabilidad:  values.radar_manejabilidad,
            radar_punto_dulce:    values.radar_punto_dulce,
            radar_salida_bola:    values.radar_salida_bola,
          })
          .eq('id', racket.id);

        return updateError ? updateError.message : null;
      })
    );

    const batchErrors = results.filter(r => r !== null);
    if (batchErrors.length > 0) {
      console.error(`  ❌ Error en lote ${Math.floor(i / BATCH_SIZE) + 1}: ${batchErrors[0]}`);
      errors += batchErrors.length;
      processed += batch.length - batchErrors.length;
    } else {
      processed += batch.length;
    }

    const progress = Math.round((processed / rackets.length) * 100);
    process.stdout.write(`\r  📊 Progreso: ${processed}/${rackets.length} palas (${progress}%)`);
  }

  console.log('\n');

  // 3. Mostrar resumen estadístico
  const avg = (arr: number[]) => (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1);
  const min = (arr: number[]) => Math.min(...arr).toFixed(1);
  const max = (arr: number[]) => Math.max(...arr).toFixed(1);

  console.log('═══════════════════════ RESUMEN ═══════════════════════');
  console.log(`  ✅ Palas actualizadas : ${processed}`);
  console.log(`  ❌ Errores            : ${errors}`);
  console.log('');
  console.log('  Distribución de valores calculados:');
  console.log(`  Potencia      → min: ${min(stats.potencia)}  avg: ${avg(stats.potencia)}  max: ${max(stats.potencia)}`);
  console.log(`  Control       → min: ${min(stats.control)}  avg: ${avg(stats.control)}  max: ${max(stats.control)}`);
  console.log(`  Manejabilidad → min: ${min(stats.manejabilidad)}  avg: ${avg(stats.manejabilidad)}  max: ${max(stats.manejabilidad)}`);
  console.log('═══════════════════════════════════════════════════════');

  if (errors > 0) {
    console.warn('\n⚠️  Algunos registros fallaron. Revisa los errores arriba y vuelve a ejecutar el script.');
    process.exit(1);
  } else {
    console.log('\n🎉 ¡Todas las métricas radar han sido calculadas y persistidas correctamente!');
    console.log('   El gráfico radar ahora mostrará valores consistentes en todas las comparaciones.\n');
  }
}

main().catch(err => {
  console.error('Error inesperado:', err);
  process.exit(1);
});
