"""
radar_metrics_scraper.py — Extrae métricas radar de fuentes externas (PadelZoom, TuMejorPala).

Scrappea análisis de palas de sitios especializados para obtener valores verificados
de potencia, control, manejabilidad, salida de bola, y punto dulce, en lugar de usar
un algoritmo determinista.

Fuentes:
  1. PadelZoom.es (primary) - 5 métricas verificadas por expertos
  2. TuMejorPala.com (fallback) - 5 métricas con mapeo a estándar
  3. Algoritmo determinista (último fallback) - si pala no existe en sitios

USO:
  python radar_metrics_scraper.py                    # Scrapea todas las palas faltantes
  python radar_metrics_scraper.py --limit 5 --dry-run
"""

import re
import json
import time
import logging
from typing import Optional, Dict, Any
from urllib.parse import quote
from datetime import datetime
from dataclasses import dataclass

try:
    from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeout
    HAS_PLAYWRIGHT = True
except ImportError:
    HAS_PLAYWRIGHT = False
    logging.warning("Playwright not installed. Install with: pip install playwright")

# Intentar import relativo (cuando se usa como módulo), sino absoluto
try:
    from .paddle_normalizer import normalize_paddle_name
except ImportError:
    # Fallback para ejecución directa como script
    try:
        from paddle_normalizer import normalize_paddle_name
    except ImportError:
        # Si aún no funciona, usar strings dummy (solo para testing)
        def normalize_paddle_name(name: str) -> str:
            return name.lower().strip()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class RadarMetrics:
    """Métricas radar normalizadas (0-10 scale)."""
    potencia: float
    control: float
    manejabilidad: float
    salida_bola: float
    punto_dulce: float
    source: str  # "padelzoom", "tumejorpala", o "algoritmo"
    source_url: Optional[str] = None
    confidence: float = 1.0  # 0-1, qué tan confiable es la fuente
    scraped_at: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "radar_potencia": round(self.potencia, 1),
            "radar_control": round(self.control, 1),
            "radar_manejabilidad": round(self.manejabilidad, 1),
            "radar_salida_bola": round(self.salida_bola, 1),
            "radar_punto_dulce": round(self.punto_dulce, 1),
        }


class PadelZoomScraper:
    """Scrappea análisis de PadelZoom.es"""

    BASE_URL = "https://padelzoom.es"

    @staticmethod
    def _search_pala(normalized_name: str) -> Optional[str]:
        """
        Busca la pala en PadelZoom y devuelve la URL si la encuentra.
        Intenta coincidir con slug-style URLs.
        """
        if not HAS_PLAYWRIGHT:
            logger.warning("Playwright no instalado, saltando PadelZoom")
            return None

        try:
            with sync_playwright() as p:
                browser = p.chromium.launch(headless=True)
                page = browser.new_page()

                # Intenta búsqueda directa
                search_url = f"{PadelZoomScraper.BASE_URL}/?s={quote(normalized_name)}"

                page.goto(search_url, timeout=10000)
                time.sleep(1)

                # Busca links a análisis y rankea por coincidencia de tokens
                links = page.query_selector_all("a[href]")
                tokens = {
                    t
                    for t in re.findall(r"[a-z0-9]+", normalized_name.lower())
                    if len(t) >= 3
                }
                stop_tokens = {"padel", "pala", "palas", "edition", "special", "oferta"}
                query_tokens = {t for t in tokens if t not in stop_tokens}

                split_tokens = [
                    t for t in re.findall(r"[a-z0-9]+", normalized_name.lower()) if len(t) >= 3
                ]
                brand_token = split_tokens[0] if split_tokens else ""
                model_tokens = {
                    t
                    for t in split_tokens
                    if t not in stop_tokens and t != brand_token and not t.isdigit()
                }

                best_url: Optional[str] = None
                best_score = 0

                for link in links:
                    href = link.get_attribute("href") or ""
                    text = link.text_content() or ""

                    if not href:
                        continue
                    if href.startswith("/"):
                        href = f"{PadelZoomScraper.BASE_URL}{href}"
                    if "padelzoom.es" not in href:
                        continue

                    haystack = f"{text} {href}".lower()
                    if brand_token and brand_token not in haystack:
                        continue

                    model_score = sum(1 for t in model_tokens if t in haystack)
                    min_model_score = 1 if len(model_tokens) <= 2 else 2
                    if model_score < min_model_score:
                        continue

                    score = sum(1 for t in query_tokens if t in haystack)

                    # Penaliza páginas de listado/categoría para priorizar reviews de modelo
                    if "/palas/" in href or "mejores-palas" in href:
                        score -= 2

                    if score > best_score:
                        best_score = score
                        best_url = href

                browser.close()
                if best_url and best_score >= 2:
                    return best_url

        except PlaywrightTimeout:
            logger.warning(f"Timeout buscando {normalized_name} en PadelZoom")
        except Exception as e:
            logger.error(f"Error scrapeando PadelZoom: {e}")

        return None

    @staticmethod
    def extract_metrics(analysis_url: str) -> Optional[RadarMetrics]:
        """
        Extrae métricas de una página de análisis de PadelZoom.

        PadelZoom muestra:
          Total 8.70  Potencia 8.50  Control 9.00  Salida de bola 8.50  Manejabilidad 8.50  Punto dulce 9.00
        """
        if not HAS_PLAYWRIGHT:
            return None

        try:
            with sync_playwright() as p:
                browser = p.chromium.launch(headless=True)
                page = browser.new_page()

                page.goto(analysis_url, timeout=15000)
                time.sleep(1)

                # Busca el bloque de puntuaciones
                content = page.content()
                browser.close()

                def _parse_value(pattern: str) -> Optional[float]:
                    match = re.search(pattern, content, re.IGNORECASE | re.DOTALL)
                    if not match:
                        return None
                    raw = match.group(1).replace(",", ".")
                    try:
                        return float(raw)
                    except ValueError:
                        return None

                potencia = _parse_value(r"Potencia\s*:\s*([\d]+(?:[.,][\d]+)?)")
                control = _parse_value(r"Control\s*:\s*([\d]+(?:[.,][\d]+)?)")
                manejabilidad = _parse_value(r"Manejabilidad\s*:\s*([\d]+(?:[.,][\d]+)?)")
                punto_dulce = _parse_value(r"Punto\s+dulce\s*:\s*([\d]+(?:[.,][\d]+)?)")

                # "Salida de bola" puede aparecer con label y valor en spans distintos
                salida_bola = _parse_value(r"Salida de bola\s*:\s*([\d]+(?:[.,][\d]+)?)")
                if salida_bola is None:
                    salida_bola = _parse_value(
                        r"Salida de bola\s*</span>\s*</div>\s*"
                        r"<div class=\"value-puntuacion\">\s*<span>\s*([\d]+(?:[.,][\d]+)?)"
                    )

                values = [potencia, control, manejabilidad, salida_bola, punto_dulce]
                if all(v is not None for v in values):
                    return RadarMetrics(
                        potencia=potencia,
                        control=control,
                        manejabilidad=manejabilidad,
                        salida_bola=salida_bola,
                        punto_dulce=punto_dulce,
                        source="padelzoom",
                        source_url=analysis_url,
                        confidence=0.95,
                        scraped_at=datetime.now().isoformat(),
                    )
        except Exception as e:
            logger.error(f"Error extrayendo metrics de PadelZoom: {e}")

        return None


class TuMejorPalaScraper:
    """Scrappea análisis de TuMejorPala.com"""

    BASE_URL = "https://tumejorpala.com"

    @staticmethod
    def build_url(pala_name: str) -> str:
        """Construye URL esperada basada en slug."""
        slug = pala_name.lower()
        slug = re.sub(r"[^\w\s-]", "", slug)
        slug = re.sub(r"[-\s]+", "-", slug).strip("-")
        return f"{TuMejorPalaScraper.BASE_URL}/palas/{slug}"

    @staticmethod
    def extract_metrics(analysis_url: str) -> Optional[RadarMetrics]:
        """
        Extrae métricas de TuMejorPala.

        TuMejorPala muestra:
          Control 8.3  Potencia 9.2  Rebote 8.5  Manejo 8  Punto dulce 8.4

        Mapeo:
          - Potencia → potencia
          - Control → control
          - Rebote → manejabilidad (aproximado)
          - Manejo → manejabilidad (promedio con Rebote)
          - Punto dulce → punto dulce
          - Salida bola → estimado (no disponible, usar promedio)
        """
        if not HAS_PLAYWRIGHT:
            return None

        try:
            with sync_playwright() as p:
                browser = p.chromium.launch(headless=True)
                page = browser.new_page()

                page.goto(analysis_url, timeout=15000, wait_until="domcontentloaded")
                time.sleep(1)

                content = page.content()
                browser.close()

                # Busca métricas en TuMejorPala
                # Formato típico: "Control8.3Potencia9.2Rebote8.5Manejo8Punto dulce8.4"
                metrics_match = re.search(
                    r"Control\s*([\d.]+).*?Potencia\s*([\d.]+).*?Rebote\s*([\d.]+)"
                    r".*?Manejo\s+([\d.]+).*?Punto\s+dulce\s*([\d.]+)",
                    content,
                    re.IGNORECASE | re.DOTALL,
                )

                if metrics_match:
                    control = float(metrics_match.group(1))
                    potencia = float(metrics_match.group(2))
                    rebote = float(metrics_match.group(3))
                    manejo = float(metrics_match.group(4))
                    punto_dulce = float(metrics_match.group(5))

                    # Promediar Rebote y Manejo para manejabilidad
                    manejabilidad = (rebote + manejo) / 2

                    # Salida bola: estimar como promedio de control y rebote
                    salida_bola = (control + rebote) / 2

                    return RadarMetrics(
                        potencia=potencia,
                        control=control,
                        manejabilidad=manejabilidad,
                        salida_bola=salida_bola,
                        punto_dulce=punto_dulce,
                        source="tumejorpala",
                        source_url=analysis_url,
                        confidence=0.85,  # Menor confianza por mapeo aproximado
                        scraped_at=datetime.now().isoformat(),
                    )
        except Exception as e:
            logger.error(f"Error extrayendo metrics de TuMejorPala: {e}")

        return None


def scrape_pala_metrics(pala_name: str) -> Optional[RadarMetrics]:
    """
    Intenta scrappear métricas de fuentes externas en orden de preferencia.

    1. PadelZoom (mejor fuente, expertos verificados)
    2. TuMejorPala (fallback, algo menos confiable)
    3. Retorna None si no encontrada (se usará algoritmo determinista en BD)
    """
    normalized = normalize_paddle_name(pala_name)
    logger.info(f"Buscando métricas para: {pala_name} (normalized: {normalized})")

    # 1. Intenta PadelZoom
    logger.info("  → Buscando en PadelZoom...")
    pz_url = PadelZoomScraper._search_pala(normalized)
    if pz_url:
        metrics = PadelZoomScraper.extract_metrics(pz_url)
        if metrics:
            logger.info(f"  ✓ Encontrada en PadelZoom: {metrics}")
            return metrics

    # 2. Intenta TuMejorPala
    logger.info("  → Buscando en TuMejorPala...")
    tmp_url = TuMejorPalaScraper.build_url(normalized)
    metrics = TuMejorPalaScraper.extract_metrics(tmp_url)
    if metrics:
        logger.info(f"  ✓ Encontrada en TuMejorPala: {metrics}")
        return metrics

    logger.warning(f"  ✗ No encontrada en fuentes externas, usará fallback")
    return None


if __name__ == "__main__":
    import sys

    # Test
    if len(sys.argv) > 1:
        test_pala = " ".join(sys.argv[1:])
        result = scrape_pala_metrics(test_pala)
        if result:
            print(json.dumps(result.to_dict(), indent=2))
        else:
            print("No encontrada")
    else:
        print("Uso: python radar_metrics_scraper.py 'nombre de pala'")
