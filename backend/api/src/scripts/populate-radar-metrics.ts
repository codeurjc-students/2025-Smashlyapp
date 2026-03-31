/**
 * SCRIPT: populate-radar-metrics.ts
 *
 * Calcula y persiste las 5 métricas del gráfico radar para palas SIN datos externos.
 * 
 * FLUJO RECOMENDADO:
 *   1. Ejecutar primero:   python src/scrapers/sync_radar_metrics.py
 *      → Extrae de PadelZoom/TuMejorPala, actualiza Supabase con datos verificados
 *   
 *   2. Ejecutar este script para llenar las que quedan:
 *      cd backend/api && npx ts-node src/scripts/populate-radar-metrics.ts
 *      → SOLO actualiza palas con valores NULL (fallback determinista)
 *      → NO sobrescribe datos que ya tienen valores (del scraper)
 *
 * CARACTERÍSTICA IMPORTANTE: Los valores son DETERMINISTAS cuando usando el algoritmo.
 * Pero se PRIORIZA la fuente externa (PadelZoom) si la pala está dispobible allí.
 *
 * PRE-REQUISITO: Ejecutar src/sql/add_radar_columns.sql en Supabase primero.
 *
 * VARIABLES DE ENTORNO:
 *   USE_EXTERNAL_RADAR_SCORES=false  (default true) → desactiva búsqueda en PadelZoom
 *   PADELZOOM_MIN_CONFIDENCE=0.6     → confianza mínima de matching
 *   PADELZOOM_REQUEST_DELAY_MS=350   → delay entre requests (respetuoso con servidor)
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

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

interface ExternalRadarMatch {
  values: RadarValues;
  sourceUrl: string;
  confidence: number;
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
 * Extrae un valor de características desde columnas dedicadas o, como fallback,
 * desde el campo specs JSONB (donde los scrapers guardan los datos con claves
 * en español: "Forma", "Balance", "Dureza").
 *
 * Esto permite calcular métricas para palas nuevas importadas por los scrapers
 * que aún no tienen las columnas characteristics_* rellenas.
 */
function extractCharacteristic(racket: any, column: string, specKeys: string[]): string {
  // 1. Columna dedicada (fuente de verdad para palas antiguas)
  const fromColumn = racket[column];
  if (fromColumn && String(fromColumn).trim() !== '') return String(fromColumn);

  // 2. Fallback: specs JSONB (palas nuevas importadas por scrapers)
  if (racket.specs) {
    const specs = typeof racket.specs === 'string' ? JSON.parse(racket.specs) : racket.specs;
    for (const key of specKeys) {
      const val = specs?.[key];
      if (val && String(val).trim() !== '') return String(val);
    }
  }

  return '';
}

/**
 * Calcula las 5 métricas radar de forma determinista a partir de las
 * características físicas de la pala.
 *
 * Escala: 0-10 donde 10 es el máximo.
 *
 * Fuentes de datos (en orden de prioridad):
 *   1. Columnas characteristics_shape / characteristics_balance / characteristics_hardness
 *   2. specs JSONB con claves en español: "Forma", "Balance", "Dureza"
 */
function calculateRadarValues(racket: any): RadarValues {
  // Leer características con fallback automático a specs JSONB
  const forma   = extractCharacteristic(racket, 'characteristics_shape',    ['Forma',   'forma',   'Shape',   'shape']).toLowerCase();
  const balance = extractCharacteristic(racket, 'characteristics_balance',  ['Balance', 'balance']).toLowerCase();
  const dureza  = extractCharacteristic(racket, 'characteristics_hardness', ['Dureza',  'dureza',  'Hardness','hardness']).toLowerCase();
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

function normalizeText(input: string): string {
  return String(input || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function slugify(input: string): string {
  return normalizeText(input)
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function tokenizeSlug(input: string): string[] {
  const STOP = new Set([
    'de', 'del', 'la', 'el', 'by', 'con', 'para', 'and', 'pro', 'plus', 'new',
    'pala', 'palas', 'padel', 'edition', 'edicion', 'review',
  ]);
  return slugify(input)
    .split('-')
    .filter(t => t && !STOP.has(t));
}

function computeSlugSimilarity(a: string, b: string): number {
  const ta = new Set(tokenizeSlug(a));
  const tb = new Set(tokenizeSlug(b));
  if (ta.size === 0 || tb.size === 0) return 0;

  let intersection = 0;
  for (const t of ta) {
    if (tb.has(t)) intersection++;
  }

  const union = new Set([...ta, ...tb]).size;
  return union > 0 ? intersection / union : 0;
}

function parsePadelZoomScores(html: string): RadarValues | null {
  const toNumber = (raw: string): number | null => {
    const value = parseFloat(String(raw).replace(',', '.'));
    if (Number.isNaN(value)) return null;
    return Math.max(0, Math.min(10, Math.round(value * 10) / 10));
  };

  const metricsMap = new Map<string, number>();
  const blockRegex = /<div class="type-puntuacion">[\s\S]*?<span>([^<]+)<\/span>[\s\S]*?<div class="value-puntuacion">[\s\S]*?<span>([0-9]+(?:[.,][0-9]+)?)<\/span>/gi;
  let blockMatch: RegExpExecArray | null;
  while ((blockMatch = blockRegex.exec(html)) !== null) {
    const key = normalizeText(blockMatch[1] || '');
    const val = toNumber(blockMatch[2] || '');
    if (key && val !== null) metricsMap.set(key, val);
  }

  const inlineRegex = /(Potencia|Control|Salida\s+de\s+bola|Manejabilidad|Punto\s+dulce)\s*:\s*([0-9]+(?:[.,][0-9]+)?)/gi;
  let inlineMatch: RegExpExecArray | null;
  while ((inlineMatch = inlineRegex.exec(html)) !== null) {
    const key = normalizeText(inlineMatch[1] || '');
    const val = toNumber(inlineMatch[2] || '');
    if (key && val !== null && !metricsMap.has(key)) metricsMap.set(key, val);
  }

  const potencia = metricsMap.get('potencia') ?? null;
  const control = metricsMap.get('control') ?? null;
  const salida = metricsMap.get('salida de bola') ?? null;
  const manejabilidad = metricsMap.get('manejabilidad') ?? null;
  const puntoDulce = metricsMap.get('punto dulce') ?? null;

  if (
    potencia === null ||
    control === null ||
    salida === null ||
    manejabilidad === null ||
    puntoDulce === null
  ) {
    return null;
  }

  return {
    radar_potencia: potencia,
    radar_control: control,
    radar_manejabilidad: manejabilidad,
    radar_punto_dulce: puntoDulce,
    radar_salida_bola: salida,
  };
}

async function fetchPadelZoomSitemapUrls(): Promise<string[]> {
  const SITEMAP_URL = 'https://padelzoom.es/pala-sitemap.xml';
  const response = await axios.get(SITEMAP_URL, {
    timeout: 20000,
    headers: {
      'User-Agent': 'SmashlyBot/1.0 (+https://smashly.app)'
    },
  });

  const xml = String(response.data || '');
  const locMatches = [...xml.matchAll(/<loc>([^<]+)<\/loc>/gi)];
  return locMatches
    .map(m => (m[1] || '').trim())
    .filter(u => u.startsWith('https://padelzoom.es/'));
}

function buildExternalMatches(rackets: any[], urls: string[]): Map<number, { url: string; confidence: number }> {
  const bySlug = new Map<string, string>();
  const slugList: string[] = [];

  for (const url of urls) {
    const slug = url.replace(/^https?:\/\/[^/]+\//i, '').replace(/\/$/, '');
    if (!slug) continue;
    bySlug.set(slug, url);
    slugList.push(slug);
  }

  const result = new Map<number, { url: string; confidence: number }>();

  for (const racket of rackets) {
    const model = String(racket.model || racket.name || '').trim();
    if (!model) continue;

    const brand = String(racket.brand || '').trim();
    const modelSlug = slugify(model);
    const brandSlug = slugify(brand);
    const prefixedModelSlug = brandSlug && !modelSlug.startsWith(`${brandSlug}-`)
      ? `${brandSlug}-${modelSlug}`
      : modelSlug;

    const direct = bySlug.get(modelSlug) || bySlug.get(prefixedModelSlug);
    if (direct) {
      result.set(racket.id, { url: direct, confidence: 1 });
      continue;
    }

    let bestSlug = '';
    let bestScore = 0;

    for (const candidateSlug of slugList) {
      if (brandSlug && !candidateSlug.includes(brandSlug)) continue;

      const score = computeSlugSimilarity(prefixedModelSlug, candidateSlug);
      if (score > bestScore) {
        bestScore = score;
        bestSlug = candidateSlug;
      }
    }

    if (bestSlug && bestScore >= 0.6) {
      result.set(racket.id, {
        url: bySlug.get(bestSlug) as string,
        confidence: Math.round(bestScore * 100) / 100,
      });
    }
  }

  return result;
}

async function loadExternalScores(rackets: any[]): Promise<Map<number, ExternalRadarMatch>> {
  const output = new Map<number, ExternalRadarMatch>();

  const enabled = (process.env.USE_EXTERNAL_RADAR_SCORES || 'true').toLowerCase() !== 'false';
  if (!enabled) {
    console.log('ℹ️  USE_EXTERNAL_RADAR_SCORES=false -> se omite fuente externa.');
    return output;
  }

  console.log('🌐 Cargando posibles puntuaciones reales desde PadelZoom...');

  let sitemapUrls: string[] = [];
  try {
    sitemapUrls = await fetchPadelZoomSitemapUrls();
  } catch (error: any) {
    console.warn(`⚠️  No se pudo leer sitemap de PadelZoom: ${error?.message || error}`);
    return output;
  }

  if (sitemapUrls.length === 0) {
    console.warn('⚠️  Sitemap de PadelZoom sin URLs.');
    return output;
  }

  const candidates = buildExternalMatches(rackets, sitemapUrls);
  if (candidates.size === 0) {
    console.warn('⚠️  No se encontraron candidatos de matching con PadelZoom.');
    return output;
  }

  console.log(`🔎 Candidatos encontrados: ${candidates.size}/${rackets.length}`);

  const cache = new Map<string, RadarValues | null>();
  const MIN_CONF = parseFloat(process.env.PADELZOOM_MIN_CONFIDENCE || '0.6');
  const DELAY_MS = Number(process.env.PADELZOOM_REQUEST_DELAY_MS || '350');

  let done = 0;
  for (const racket of rackets) {
    const candidate = candidates.get(racket.id);
    if (!candidate || candidate.confidence < MIN_CONF) continue;

    let scores = cache.get(candidate.url);
    if (scores === undefined) {
      try {
        const response = await axios.get(candidate.url, {
          timeout: 20000,
          headers: {
            'User-Agent': 'SmashlyBot/1.0 (+https://smashly.app)'
          },
        });
        scores = parsePadelZoomScores(String(response.data || ''));
      } catch {
        scores = null;
      }

      cache.set(candidate.url, scores);

      if (DELAY_MS > 0) {
        await new Promise(resolve => setTimeout(resolve, DELAY_MS));
      }
    }

    if (scores) {
      output.set(racket.id, {
        values: scores,
        sourceUrl: candidate.url,
        confidence: candidate.confidence,
      });
    }

    done++;
    if (done % 50 === 0) {
      process.stdout.write(`\r  🌐 PadelZoom procesado: ${done}/${candidates.size}`);
    }
  }

  if (done >= 50) console.log('');
  console.log(`✅ Puntuaciones reales válidas: ${output.size}`);

  return output;
}

// ──────────────────────────────────────────────
// Ejecución principal
// ──────────────────────────────────────────────

const BATCH_SIZE = 100; // Supabase recomienda no pasar de 1000 por upsert

async function main() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║   Smashly – Populate Radar Metrics       ║');
  console.log('╚══════════════════════════════════════════╝\n');

  // 1. Obtener SOLO palas SIN métricas radar (columnas NULL)
  // Esto permite que:
  //   - Datos del scraper (sync_radar_metrics.py) NO se sobrescriban
  //   - Algoritmo determinista SOLO actúe como fallback
  console.log('⏳ Obteniendo palas sin métricas radar (fallback)...');
  const PAGE_SIZE = 1000;
  const allRackets: any[] = [];
  let page = 0;

  while (true) {
    const { data, error } = await supabase
      .from('rackets')
      .select('id, name, model, brand, characteristics_shape, characteristics_balance, characteristics_hardness, specs, radar_potencia, radar_control')
      .or(
        'radar_potencia.is.null,radar_control.is.null,radar_manejabilidad.is.null,radar_salida_bola.is.null,radar_punto_dulce.is.null'
      )
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

  // 2. Intentar cargar fuente real (PadelZoom) para sustituir heurística cuando exista
  const externalScores = await loadExternalScores(rackets);

  // 3. Calcular/actualizar métricas para cada pala
  let processed = 0;
  let errors = 0;

  // Estadísticas de distribución para validación
  const stats = {
    potencia: [] as number[],
    control: [] as number[],
    manejabilidad: [] as number[],
    usedExternalSource: 0,
    usedHeuristicSource: 0,
    usedSpecsFallback: 0,   // palas que usaron specs JSONB porque no tenían columnas dedicadas
    usedDedicatedCols: 0,   // palas con columnas characteristics_* rellenas
  };

  // Procesar en lotes usando UPDATE (los registros ya existen, no queremos INSERT)
  for (let i = 0; i < rackets.length; i += BATCH_SIZE) {
    const batch = rackets.slice(i, i + BATCH_SIZE);

    // Calcular valores y lanzar un UPDATE individual por pala en paralelo
    const results = await Promise.all(
      batch.map(async (racket: any) => {
        const external = externalScores.get(racket.id);
        const values = external?.values || calculateRadarValues(racket);
        stats.potencia.push(values.radar_potencia);
        stats.control.push(values.radar_control);
        stats.manejabilidad.push(values.radar_manejabilidad);

        if (external) stats.usedExternalSource++;
        else stats.usedHeuristicSource++;

        // Contabilizar fuente de datos usada
        if (racket.characteristics_shape && String(racket.characteristics_shape).trim() !== '') {
          stats.usedDedicatedCols++;
        } else {
          stats.usedSpecsFallback++;
        }

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
  console.log(`  ✅ Palas actualizadas    : ${processed}`);
  console.log(`  ❌ Errores               : ${errors}`);
  console.log('');
  console.log('  📝 NOTA: Este script SOLO actualiza palas sin métricas.');
  console.log('     Palas con valores existentes (del scraper) NO se tocan.');
  console.log('');
  console.log('  Fuente de valores radar:');
  console.log(`  Puntuación real externa   : ${stats.usedExternalSource} palas (PadelZoom fallback)`);
  console.log(`  Cálculo heurístico        : ${stats.usedHeuristicSource} palas (algoritmo determinista)`);
  console.log('');
  console.log('  Fuente de características:');
  console.log(`  Columnas dedicadas       : ${stats.usedDedicatedCols} palas`);
  console.log(`  Fallback specs JSONB     : ${stats.usedSpecsFallback} palas (importadas por scrapers)`);
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
