"""
sync_radar_metrics.py — Sincroniza métricas radar desde fuentes externas a Supabase.

Carga palas sin métricas radar, intenta scrappearlas de PadelZoom/TuMejorPala,
y actualiza la BD. Para palas sin fuentes externas, el script populate-radar-metrics.ts
aplicará el fallback determinista.

USO:
  python sync_radar_metrics.py                      # Ejecuta en todas las palas
  python sync_radar_metrics.py --limit 10           # Prueba con 10 palas
  python sync_radar_metrics.py --dry-run --limit 5  # Simulación sin escribir
  python sync_radar_metrics.py --batch-size 5       # Procesa 5 en paralelo
"""

import os
import json
import argparse
import logging
from typing import List, Dict, Optional, Any
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed

import dotenv
from supabase import create_client, Client

from radar_metrics_scraper import scrape_pala_metrics

dotenv.load_dotenv()

logger = logging.getLogger(__name__)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

# ─────────────────────────────────────
# Supabase
# ─────────────────────────────────────

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY", "")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY (o SUPABASE_ANON_KEY) requeridas")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


def fetch_rackets_needing_metrics(limit: Optional[int] = None) -> List[Dict[str, Any]]:
    """
    Obtiene palas que NO tienen todas las métricas radar. Deambigüa entre:
      - Totalmente vacías (NULL)
      - Parcialmente llenas (algunas metricas pero no todas)
    """
    try:
        query = (
            supabase.table("rackets")
            .select("id, name, brand, model")
            .or_(
                "radar_potencia.is.null,radar_control.is.null,"
                "radar_manejabilidad.is.null,radar_salida_bola.is.null,"
                "radar_punto_dulce.is.null"
            )
            .limit(limit or 1000)
        )
        response = query.execute()
        return response.data or []
    except Exception as e:
        logger.error(f"Error fetcheando palas: {e}")
        return []


def fetch_all_rackets(limit: Optional[int] = None) -> List[Dict[str, Any]]:
    """
    Obtiene TODAS las palas para forzar actualización completa de métricas.
    Independientemente de si ya tienen valores o no.
    """
    try:
        query = (
            supabase.table("rackets")
            .select("id, name, brand, model")
            .limit(limit or 10000)
        )
        response = query.execute()
        return response.data or []
    except Exception as e:
        logger.error(f"Error fetcheando todas las palas: {e}")
        return []


def update_racket_metrics(
    racket_id: int,
    metrics_dict: Dict[str, Any],
    dry_run: bool = False,
) -> bool:
    """Actualiza una pala con métricas radar."""
    if dry_run:
        logger.info(f"[DRY-RUN] Actualizar racket {racket_id}: {metrics_dict}")
        return True

    try:
        supabase.table("rackets").update(metrics_dict).eq("id", racket_id).execute()
        logger.info(f"✓ Actualizado racket {racket_id}")
        return True
    except Exception as e:
        logger.error(f"Error actualizando racket {racket_id}: {e}")
        return False


def process_racket(
    racket: Dict[str, Any],
    dry_run: bool = False,
) -> Dict[str, Any]:
    """Procesa una pala: scrapea metrics e intenta actualizar."""
    racket_id = racket.get("id")
    raw_name = (racket.get("name") or "").strip()
    brand = (racket.get("brand") or "").strip()
    model = (racket.get("model") or "").strip()

    if raw_name:
        pala_name = raw_name
    elif model and brand and model.lower().startswith(brand.lower()):
        pala_name = model
    else:
        pala_name = f"{brand} {model}".strip()

    logger.info(f"[{racket_id}] Procesando: {pala_name}")

    # Intenta scrappear
    metrics = scrape_pala_metrics(pala_name)

    if not metrics:
        logger.warning(f"[{racket_id}] No encontrada en fuentes externas")
        return {
            "id": racket_id,
            "name": pala_name,
            "status": "no_found",
            "message": "Fallback a algoritmo determinista",
        }

    # Tiene metrics → actualizar
    metrics_dict = metrics.to_dict()
    success = update_racket_metrics(racket_id, metrics_dict, dry_run=dry_run)

    return {
        "id": racket_id,
        "name": pala_name,
        "status": "success" if success else "error",
        "source": metrics.source,
        "metrics": {"potencia": round(metrics.potencia, 1), "control": round(metrics.control, 1)},
    }


def main():
    parser = argparse.ArgumentParser(description="Sincroniza métricas radar desde web")
    parser.add_argument("--limit", type=int, default=None, help="Límite de palas a procesar")
    parser.add_argument("--dry-run", action="store_true", help="Simulación sin escribir BD")
    parser.add_argument(
        "--batch-size",
        type=int,
        default=3,
        help="Palas concurrentes (default 3, max 5 por timeouts)",
    )
    parser.add_argument(
        "--force-all",
        action="store_true",
        help="Actualiza TODAS las palas, no solo las que faltan metrics",
    )
    args = parser.parse_args()

    logger.info("=" * 60)
    logger.info("SYNC RADAR METRICS")
    logger.info(f"Modo: {'DRY-RUN' if args.dry_run else 'LIVE'}")
    logger.info(f"Alcance: {'TODAS las palas' if args.force_all else 'Solo sin metrics'}")
    logger.info(f"Límite: {args.limit or 'ilimitado'}")
    logger.info(f"Concurrencia: {args.batch_size}")
    logger.info("=" * 60)

    # Cargar palas
    if args.force_all:
        rackets = fetch_all_rackets(limit=args.limit)
        logger.info(f"Cargadas {len(rackets)} palas para actualización completa")
    else:
        rackets = fetch_rackets_needing_metrics(limit=args.limit)
        logger.info(f"Encontradas {len(rackets)} palas sin metrics radar")

    if not rackets:
        logger.info("✓ Ninguna pala para procesar")
        return

    # Procesar en paralelo
    results = []
    with ThreadPoolExecutor(max_workers=args.batch_size) as executor:
        futures = {
            executor.submit(process_racket, racket, args.dry_run): racket
            for racket in rackets
        }

        for i, future in enumerate(as_completed(futures), 1):
            result = future.result()
            results.append(result)
            logger.info(f"[{i}/{len(rackets)}] {result['status']}: {result['name']}")

    # Resumen
    logger.info("\n" + "=" * 60)
    logger.info("RESUMEN")
    logger.info("=" * 60)

    success = sum(1 for r in results if r["status"] == "success")
    no_found = sum(1 for r in results if r["status"] == "no_found")
    errors = sum(1 for r in results if r["status"] == "error")

    logger.info(f"✓ Exitosas: {success}/{len(results)}")
    logger.info(f"○ Sin fuente externa: {no_found}/{len(results)}")
    logger.info(f"✗ Errores: {errors}/{len(results)}")
    logger.info("")
    logger.info("Próximo paso:")
    logger.info("  1. Para palas sin metrics externos, ejecutar:")
    logger.info("     cd backend/api && npx ts-node src/scripts/populate-radar-metrics.ts")
    logger.info("  2. Esto aplicará el algoritmo determinista como fallback")
    logger.info("=" * 60)


if __name__ == "__main__":
    main()
