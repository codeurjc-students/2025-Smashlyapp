"""
Scraper para obtener métricas de rendimiento de palas desde padelful.com.

Padelful tiene una API interna de búsqueda que devuelve métricas numéricas (0-10):
- Power (Potencia)           → radar_potencia
- Control                    → radar_control
- Rebound (Salida de bola)   → radar_salida_bola
- Maneuverability (Manejab.) → radar_manejabilidad
- Sweet spot (Punto dulce)   → radar_punto_dulce

Estrategia:
  1. Para cada pala de nuestra BD → llamar /api/search?q={name}&locale=en
  2. Fuzzy match el mejor resultado contra nuestro nombre
  3. Extraer métricas directamente del JSON (no requiere renderizado)

NO usa Playwright. Solo HTTP requests con httpx (async).

USO:
    cd src/scrapers
    python -m stores.padelful                          # Standalone (usa rackets.json)
    SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... python -m stores.padelful  # Integrado
"""

import asyncio
import json
import random
import re
import os
import time
from dataclasses import dataclass, asdict
from typing import Optional, List, Dict, Tuple
import httpx
from thefuzz import fuzz


# ──────────────────────────────────────────────
# Data model
# ──────────────────────────────────────────────

@dataclass
class RacketMetrics:
    """Métricas de rendimiento extraídas de padelful.com."""
    padelful_name: str          # Nombre en padelful
    db_name: str                # Nombre en nuestra BD
    db_id: Optional[int]        # ID en nuestra BD
    power: Optional[float]      # 0-10 → radar_potencia
    control: Optional[float]    # 0-10 → radar_control
    rebound: Optional[float]    # 0-10 → radar_salida_bola
    maneuverability: Optional[float]  # 0-10 → radar_manejabilidad
    sweet_spot: Optional[float]       # 0-10 → radar_punto_dulce
    overall: Optional[float]          # Score global padelful
    padelful_url: str           # URL fuente para trazabilidad
    match_score: int            # Fuzzy match score (0-100)
    brand: str = ""             # Marca en padelful
    season: Optional[int] = None  # Temporada
    source: str = "padelful"


# ──────────────────────────────────────────────
# Scraper principal (API-based, no Playwright)
# ──────────────────────────────────────────────

class PadelfulMetricsScraper:
    """
    Scraper de métricas usando la API interna de padelful.com.

    La API /api/search devuelve directamente las métricas numéricas en JSON,
    evitando la necesidad de renderizar páginas con Playwright.

    Formato de respuesta de la API:
    [
      {
        "title": "Nox AT10 Luxury Genius 18K Alum 2026 Agustin Tapia",
        "url": "/en/rackets/nox-at10-luxury-genius-18k-alum-2026-agustin-tapia",
        "rating": "8.5",
        "brand": "Nox",
        "season": 2026,
        "ratings": {
          "power": 7.9,
          "control": 8.3,
          "rebound": 8.3,
          "maneuverability": 9.4,
          "sweetSpot": 8.8
        }
      },
      ...
    ]
    """

    SEARCH_API = "https://www.padelful.com/api/search"
    BASE_URL = "https://www.padelful.com"
    MIN_MATCH_SCORE = 65  # Umbral de fuzzy matching
    REQUEST_DELAY = (0.8, 1.5)  # Más rápido que Playwright (es solo JSON)
    MAX_RETRIES = 3
    RETRY_DELAY = 5.0  # Segundos entre reintentos

    USER_AGENTS = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
    ]

    def __init__(self):
        self.client: Optional[httpx.AsyncClient] = None
        self._request_count = 0
        self._rate_limit_hits = 0

    async def init(self):
        """Inicializa el cliente HTTP."""
        if not self.client:
            self.client = httpx.AsyncClient(
                headers={
                    'User-Agent': random.choice(self.USER_AGENTS),
                    'Accept': 'application/json',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Referer': 'https://www.padelful.com/en/rackets',
                },
                timeout=httpx.Timeout(15.0),
                follow_redirects=True,
            )

    async def close(self):
        """Cierra el cliente HTTP."""
        if self.client:
            await self.client.aclose()
            self.client = None

    async def _delay(self):
        """Delay aleatorio entre requests."""
        delay = random.uniform(*self.REQUEST_DELAY)
        await asyncio.sleep(delay)

    def _clean_name(self, name: str) -> str:
        """Limpia nombre de pala para búsqueda y comparación."""
        noise = ['pala', 'padel', 'pádel', 'de pádel', 'racket', 'racquet', 'palas']
        cleaned = name
        for word in noise:
            cleaned = re.sub(rf'\b{re.escape(word)}\b', '', cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r'[^\w\s.-]', ' ', cleaned)
        cleaned = re.sub(r'\s+', ' ', cleaned).strip()
        return cleaned

    def _build_query(self, name: str, brand: str = "") -> str:
        """
        Construye la query óptima para la API de búsqueda.

        La API busca por título completo, así que mandamos el nombre
        más significativo (modelo, no marca genérica).
        """
        cleaned = self._clean_name(name)

        # Extraer las palabras clave más relevantes del nombre
        # (quitar año si está al final, la API ya filtra por season)
        cleaned = re.sub(r'\b20\d{2}\b', '', cleaned).strip()

        # Si el nombre ya contiene la marca, no duplicar
        if brand and brand.lower() not in cleaned.lower():
            # Poner la marca al inicio ayuda a la API
            cleaned = f"{brand} {cleaned}"

        # Limitar a ~40 chars para que la API no falle
        if len(cleaned) > 40:
            # Tomar las primeras palabras significativas
            words = cleaned.split()[:5]
            cleaned = ' '.join(words)

        return cleaned.strip()

    async def _search_api(self, query: str) -> List[Dict]:
        """Llama a la API de búsqueda con reintentos."""
        for attempt in range(self.MAX_RETRIES):
            try:
                await self._delay()
                self._request_count += 1

                resp = await self.client.get(
                    self.SEARCH_API,
                    params={'q': query, 'locale': 'en'}
                )

                if resp.status_code == 200:
                    return resp.json()
                elif resp.status_code == 429 or resp.status_code == 503:
                    self._rate_limit_hits += 1
                    wait = self.RETRY_DELAY * (attempt + 1)
                    print(f"    ⏳ Rate limit (HTTP {resp.status_code}), esperando {wait:.0f}s...")
                    await asyncio.sleep(wait)
                    continue
                else:
                    print(f"    ⚠ HTTP {resp.status_code} para query '{query}'")
                    return []

            except httpx.TimeoutException:
                if attempt < self.MAX_RETRIES - 1:
                    await asyncio.sleep(self.RETRY_DELAY)
                    continue
                return []
            except Exception as e:
                print(f"    ⚠ Error en search API: {e}")
                return []

        return []

    def _find_best_match(
        self,
        results: List[Dict],
        name: str,
        brand: str = ""
    ) -> Tuple[Optional[Dict], int]:
        """
        Encuentra el mejor match entre los resultados de la API y nuestro nombre.

        Returns:
            (best_result, fuzzy_score) o (None, 0) si no hay match suficiente
        """
        if not results:
            return None, 0

        clean_name = self._clean_name(name).lower()
        best_result = None
        best_score = 0

        for result in results:
            padelful_title = result.get('title', '')
            clean_title = self._clean_name(padelful_title).lower()

            # Calcular múltiples tipos de fuzzy score y tomar el mejor
            scores = [
                fuzz.token_sort_ratio(clean_name, clean_title),
                fuzz.token_set_ratio(clean_name, clean_title),
                fuzz.partial_ratio(clean_name, clean_title),
            ]
            score = max(scores)

            # Bonus si la marca coincide exactamente
            padelful_brand = result.get('brand', '').lower()
            if brand and brand.lower() == padelful_brand:
                score = min(score + 5, 100)

            if score > best_score:
                best_score = score
                best_result = result

        if best_score >= self.MIN_MATCH_SCORE and best_result:
            return best_result, best_score

        return None, best_score

    def _extract_metrics(self, result: Dict) -> RacketMetrics:
        """Extrae las métricas de un resultado de la API."""
        ratings = result.get('ratings', {})

        return RacketMetrics(
            padelful_name=result.get('title', ''),
            db_name='',  # Se rellena después
            db_id=None,  # Se rellena después
            power=ratings.get('power'),
            control=ratings.get('control'),
            rebound=ratings.get('rebound'),
            maneuverability=ratings.get('maneuverability'),
            sweet_spot=ratings.get('sweetSpot'),
            overall=float(result.get('rating', 0)) if result.get('rating') else None,
            padelful_url=f"{self.BASE_URL}{result.get('url', '')}",
            match_score=0,
            brand=result.get('brand', ''),
            season=result.get('season'),
        )

    async def search_and_match(
        self,
        name: str,
        brand: str = "",
        db_id: Optional[int] = None
    ) -> Optional[RacketMetrics]:
        """
        Busca una pala en padelful y devuelve sus métricas si hay match.

        Args:
            name: Nombre de la pala en nuestra BD
            brand: Marca de la pala
            db_id: ID en nuestra BD

        Returns:
            RacketMetrics si se encontró match, None si no
        """
        query = self._build_query(name, brand)
        results = await self._search_api(query)

        if not results:
            # Intentar con una query más corta (solo las primeras 3 palabras)
            short_query = ' '.join(query.split()[:3])
            if short_query != query:
                results = await self._search_api(short_query)

        best_match, score = self._find_best_match(results, name, brand)

        if best_match:
            metrics = self._extract_metrics(best_match)
            metrics.db_name = name
            metrics.db_id = db_id
            metrics.match_score = score
            return metrics

        return None

    async def scrape_all(
        self,
        rackets: List[Dict],
        output_file: str = "scraped_metrics.json"
    ) -> List[RacketMetrics]:
        """
        Scrapea métricas para todas las palas de nuestra BD.

        Args:
            rackets: Lista de {id, name, brand} de la BD de Smashly
            output_file: Archivo donde guardar resultados parciales

        Returns:
            Lista completa de resultados
        """
        results: List[RacketMetrics] = []
        found = 0
        not_found = 0

        # Cargar resultados previos (para poder reanudar)
        existing_ids = set()
        if os.path.exists(output_file):
            try:
                with open(output_file, 'r') as f:
                    existing = json.load(f)
                    results = [RacketMetrics(**r) for r in existing]
                    existing_ids = {r.db_id for r in results if r.db_id}
                    found = len([r for r in results if r.power is not None])
                    print(f"  📂 Cargados {len(results)} resultados previos ({found} con métricas)")
            except Exception:
                pass

        total = len(rackets)
        pending = [r for r in rackets if r.get('id') not in existing_ids]
        print(f"\n  🔍 Total: {total} palas | Ya procesadas: {total - len(pending)} | Pendientes: {len(pending)}")

        start_time = time.time()

        for i, racket in enumerate(pending):
            racket_id = racket.get('id')
            name = racket.get('name', '')
            brand = racket.get('brand', '')
            progress_num = len(existing_ids) + i + 1
            progress = f"[{progress_num}/{total}]"

            metrics = await self.search_and_match(name, brand, racket_id)

            if metrics and metrics.power is not None:
                found += 1
                print(
                    f"  {progress} ✓ {brand} {name}"
                    f" → P:{metrics.power} C:{metrics.control} R:{metrics.rebound}"
                    f" M:{metrics.maneuverability} PD:{metrics.sweet_spot}"
                    f" (match:{metrics.match_score}%)"
                )
                results.append(metrics)
            else:
                not_found += 1
                # Guardar como no encontrado para no re-intentar
                results.append(RacketMetrics(
                    padelful_name="",
                    db_name=name,
                    db_id=racket_id,
                    power=None, control=None, rebound=None,
                    maneuverability=None, sweet_spot=None, overall=None,
                    padelful_url="",
                    match_score=0,
                    brand=brand,
                ))
                if metrics:
                    print(f"  {progress} ~ {brand} {name} (mejor match: {metrics.match_score}% - insuficiente)")
                else:
                    print(f"  {progress} ✗ {brand} {name}")

            # Guardar progreso cada 25 palas
            if (i + 1) % 25 == 0:
                self._save_progress(results, output_file)
                elapsed = time.time() - start_time
                rate = (i + 1) / elapsed if elapsed > 0 else 0
                eta = (len(pending) - i - 1) / rate if rate > 0 else 0
                print(f"    💾 Progreso guardado | {rate:.1f} palas/s | ETA: {eta/60:.1f} min")

        # Guardar resultado final
        self._save_progress(results, output_file)

        elapsed = time.time() - start_time
        total_with_metrics = len([r for r in results if r.power is not None])

        print(f"\n  ═══════════════════ RESUMEN ═══════════════════")
        print(f"  ✓ Con métricas reales  : {total_with_metrics}")
        print(f"  ✗ Sin métricas         : {len(results) - total_with_metrics}")
        print(f"  📊 Cobertura           : {total_with_metrics/len(results)*100:.1f}%")
        print(f"  ⏱  Tiempo              : {elapsed/60:.1f} min")
        print(f"  🌐 Requests realizadas : {self._request_count}")
        print(f"  ⚠  Rate limits         : {self._rate_limit_hits}")
        print(f"  📁 Guardado en         : {output_file}")
        print(f"  ═══════════════════════════════════════════════")

        return results

    def _save_progress(self, results: List[RacketMetrics], output_file: str):
        """Guarda progreso parcial a disco."""
        with open(output_file, 'w') as f:
            json.dump([asdict(r) for r in results], f, indent=2, ensure_ascii=False)


# ──────────────────────────────────────────────
# Script principal
# ──────────────────────────────────────────────

async def main():
    """
    Ejecuta el scraper de métricas de padelful.

    MODO INTEGRADO (con Supabase):
      SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... python -m stores.padelful

    MODO STANDALONE:
      Lee rackets de ../rackets.json y guarda resultados en ../scraped_metrics.json
    """
    print("╔══════════════════════════════════════════════════╗")
    print("║  Smashly – Padelful Metrics Scraper (API mode)  ║")
    print("╚══════════════════════════════════════════════════╝\n")

    # ── 1. Cargar palas ──────────────────────────────
    rackets = []
    supabase_url = os.environ.get('SUPABASE_URL')
    supabase_key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY') or os.environ.get('SUPABASE_ANON_KEY')
    supabase = None

    if supabase_url and supabase_key:
        try:
            from supabase import create_client
            supabase = create_client(supabase_url, supabase_key)

            print("⏳ Obteniendo palas de Supabase...")
            all_rackets = []
            page = 0
            while True:
                result = supabase.table('rackets') \
                    .select('id, name, brand') \
                    .order('id') \
                    .range(page * 1000, (page + 1) * 1000 - 1) \
                    .execute()
                if not result.data:
                    break
                all_rackets.extend(result.data)
                if len(result.data) < 1000:
                    break
                page += 1

            rackets = [{
                'id': r['id'],
                'name': r['name'],
                'brand': r.get('brand', '')
            } for r in all_rackets]
            print(f"✅ {len(rackets)} palas cargadas de Supabase\n")
        except ImportError:
            print("⚠ supabase-py no instalado. pip install supabase")
        except Exception as e:
            print(f"⚠ Error conectando a Supabase: {e}")

    # Fallback: cargar desde rackets.json
    if not rackets:
        json_path = os.path.join(os.path.dirname(__file__), '..', 'rackets.json')
        if os.path.exists(json_path):
            print(f"📂 Cargando palas desde {json_path}...")
            with open(json_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                # rackets.json puede ser dict (keyed by slug) o list
                if isinstance(data, dict):
                    rackets = [{
                        'id': r.get('id', i),
                        'name': r.get('name') or r.get('model', ''),
                        'brand': r.get('brand', '')
                    } for i, r in enumerate(data.values())]
                else:
                    rackets = [{
                        'id': r.get('id', i),
                        'name': r.get('name') or r.get('model', ''),
                        'brand': r.get('brand', '')
                    } for i, r in enumerate(data)]
            print(f"✅ {len(rackets)} palas cargadas desde JSON\n")
        else:
            print("❌ No se encontraron palas.")
            print("   Opciones:")
            print("   1. Configura SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY")
            print("   2. Coloca rackets.json en el directorio padre")
            return

    # ── 2. Ejecutar scraping ─────────────────────────
    scraper = PadelfulMetricsScraper()
    try:
        await scraper.init()
        output = os.path.join(os.path.dirname(__file__), '..', 'scraped_metrics.json')
        results = await scraper.scrape_all(rackets, output)

        # ── 3. Actualizar Supabase si está conectado ──
        if supabase:
            print("\n⏳ Actualizando valores radar en Supabase...")
            updated = 0
            errors = 0

            for r in results:
                if r.db_id and r.power is not None:
                    update_data = {
                        'radar_potencia': r.power,
                        'radar_control': r.control,
                        'radar_salida_bola': r.rebound,  # Rebound → Salida de bola
                        'radar_manejabilidad': r.maneuverability,
                        'radar_punto_dulce': r.sweet_spot,
                    }
                    try:
                        supabase.table('rackets') \
                            .update(update_data) \
                            .eq('id', r.db_id) \
                            .execute()
                        updated += 1
                    except Exception as e:
                        errors += 1
                        if errors <= 3:
                            print(f"  ⚠ Error actualizando {r.db_name}: {e}")

            total_in_db = len(rackets)
            kept_algo = total_in_db - updated
            print(f"\n  ✅ {updated} palas actualizadas con métricas reales de padelful")
            print(f"  📊 {kept_algo} palas mantienen valores del algoritmo determinista")
            if errors > 0:
                print(f"  ⚠ {errors} errores al actualizar")
    finally:
        await scraper.close()


if __name__ == "__main__":
    asyncio.run(main())
